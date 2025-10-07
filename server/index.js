import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import { z } from 'zod';
import { connectDatabase, resetDatabase, seedDatabase, User, WorkEntry } from './database.js';

const app = express();
const port = process.env.PORT || 4000;

// Initialiser la base de données au démarrage
console.log('🚀 Démarrage du serveur...');
await connectDatabase();
await seedDatabase();

// Strict CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081', 'http://localhost:19006'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

app.use(express.json());

function calculateDurationHours(entry) {
  try {
    const start = new Date(`${entry.startDate}T${entry.startTime}:00`);
    const end = new Date(`${entry.endDate}T${entry.endTime}:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    if (end < start) return 0;
    let duration = (end - start) / (1000 * 60 * 60);
    if (duration > 24) return 0;
    if (entry.hasBreak) {
      const bs = new Date(`${entry.startDate}T${entry.breakStartHour || '00'}:${entry.breakStartMin || '00'}:00`);
      const be = new Date(`${entry.startDate}T${entry.breakEndHour || '00'}:${entry.breakEndMin || '00'}:00`);
      if (!Number.isNaN(bs.getTime()) && !Number.isNaN(be.getTime()) && be > bs) {
        const breakH = (be - bs) / (1000 * 60 * 60);
        duration = Math.max(0, duration - Math.min(breakH, duration));
      }
    }
    return Math.round(duration * 100) / 100;
  } catch {
    return 0;
  }
}

// Health
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'heures-travaille-backend', database: 'MongoDB' });
});

// Route pour réinitialiser la base de données (DEV ONLY)
app.post('/dev/reset-database', async (_req, res) => {
  try {
    await resetDatabase();
    res.json({ ok: true, message: 'Base de données réinitialisée avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Validation schemas
const signupSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const workEntrySchema = z.object({
  userId: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  hasBreak: z.boolean().optional(),
  breakStartHour: z.string().optional(),
  breakStartMin: z.string().optional(),
  breakEndHour: z.string().optional(),
  breakEndMin: z.string().optional(),
  category: z.string().optional(),
  hourlyRate: z.number().optional(),
  location: z.object({
    city: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
  employerId: z.string().optional(),
  projectName: z.string().optional(),
  comment: z.string().optional(),
});

// AUTH ENDPOINTS

app.post('/auth/signup', async (req, res) => {
  try {
    const body = signupSchema.parse(req.body);
    const { firstName, lastName, email, password } = body;

    // Vérifier si l'email existe déjà
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hasher le mot de passe
    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    // Créer l'utilisateur
    const user = new User({
      _id: userId,
      firstName,
      lastName,
      email,
      password: passwordHash,
    });
    await user.save();

    // Générer le token
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: userId, firstName, lastName, email, phone: null, avatarUrl: null },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const { email, password } = body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// USER ENDPOINTS

app.get('/users/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
  });
});

app.put('/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  if (id !== req.user.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { firstName, lastName, email, phone, avatarUrl } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { firstName, lastName, email, phone, avatarUrl },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  if (id !== req.user.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    await User.findByIdAndDelete(id);
    await WorkEntry.deleteMany({ userId: id });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WORK ENTRIES ENDPOINTS

app.post('/work-entries', authMiddleware, async (req, res) => {
  try {
    const body = workEntrySchema.parse(req.body);

    if (body.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const entryId = 'e_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const location = body.location || {};

    const entry = new WorkEntry({
      _id: entryId,
      userId: body.userId,
      startDate: body.startDate,
      startTime: body.startTime,
      endDate: body.endDate,
      endTime: body.endTime,
      hasBreak: body.hasBreak || false,
      breakStartHour: body.breakStartHour,
      breakStartMin: body.breakStartMin,
      breakEndHour: body.breakEndHour,
      breakEndMin: body.breakEndMin,
      category: body.category,
      hourlyRate: body.hourlyRate,
      location: {
        city: location.city,
        address: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
      },
      employerId: body.employerId,
      projectName: body.projectName,
      comment: body.comment,
    });

    await entry.save();

    const durationHours = calculateDurationHours(entry);
    
    res.json({
      id: entry._id,
      userId: entry.userId,
      startDate: entry.startDate,
      startTime: entry.startTime,
      endDate: entry.endDate,
      endTime: entry.endTime,
      hasBreak: entry.hasBreak,
      breakStartHour: entry.breakStartHour,
      breakStartMin: entry.breakStartMin,
      breakEndHour: entry.breakEndHour,
      breakEndMin: entry.breakEndMin,
      category: entry.category,
      hourlyRate: entry.hourlyRate,
      location: entry.location,
      employerId: entry.employerId,
      projectName: entry.projectName,
      comment: entry.comment,
      durationHours,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

app.get('/work-entries', authMiddleware, async (req, res) => {
  const entries = await WorkEntry.find({ userId: req.user.userId }).sort({ startDate: -1, startTime: -1 });
  
  const formatted = entries.map(e => ({
    id: e._id,
    userId: e.userId,
    startDate: e.startDate,
    startTime: e.startTime,
    endDate: e.endDate,
    endTime: e.endTime,
    hasBreak: e.hasBreak,
    breakStartHour: e.breakStartHour,
    breakStartMin: e.breakStartMin,
    breakEndHour: e.breakEndHour,
    breakEndMin: e.breakEndMin,
    category: e.category,
    hourlyRate: e.hourlyRate,
    location: e.location,
    employerId: e.employerId,
    projectName: e.projectName,
    comment: e.comment,
    durationHours: calculateDurationHours(e),
  }));
  
  res.json(formatted);
});

app.get('/work-entries/:id', authMiddleware, async (req, res) => {
  const entry = await WorkEntry.findById(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  if (entry.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json({
    id: entry._id,
    userId: entry.userId,
    startDate: entry.startDate,
    startTime: entry.startTime,
    endDate: entry.endDate,
    endTime: entry.endTime,
    hasBreak: entry.hasBreak,
    breakStartHour: entry.breakStartHour,
    breakStartMin: entry.breakStartMin,
    breakEndHour: entry.breakEndHour,
    breakEndMin: entry.breakEndMin,
    category: entry.category,
    hourlyRate: entry.hourlyRate,
    location: entry.location,
    employerId: entry.employerId,
    projectName: entry.projectName,
    comment: entry.comment,
    durationHours: calculateDurationHours(entry),
  });
});

app.put('/work-entries/:id', authMiddleware, async (req, res) => {
  const entry = await WorkEntry.findById(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  if (entry.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const body = workEntrySchema.partial().parse(req.body);
    const location = body.location || {};

    const updateData = {
      startDate: body.startDate || entry.startDate,
      startTime: body.startTime || entry.startTime,
      endDate: body.endDate || entry.endDate,
      endTime: body.endTime || entry.endTime,
      hasBreak: body.hasBreak !== undefined ? body.hasBreak : entry.hasBreak,
      breakStartHour: body.breakStartHour !== undefined ? body.breakStartHour : entry.breakStartHour,
      breakStartMin: body.breakStartMin !== undefined ? body.breakStartMin : entry.breakStartMin,
      breakEndHour: body.breakEndHour !== undefined ? body.breakEndHour : entry.breakEndHour,
      breakEndMin: body.breakEndMin !== undefined ? body.breakEndMin : entry.breakEndMin,
      category: body.category !== undefined ? body.category : entry.category,
      hourlyRate: body.hourlyRate !== undefined ? body.hourlyRate : entry.hourlyRate,
      location: {
        city: location.city !== undefined ? location.city : entry.location.city,
        address: location.address !== undefined ? location.address : entry.location.address,
        latitude: location.latitude !== undefined ? location.latitude : entry.location.latitude,
        longitude: location.longitude !== undefined ? location.longitude : entry.location.longitude,
      },
      employerId: body.employerId !== undefined ? body.employerId : entry.employerId,
      projectName: body.projectName !== undefined ? body.projectName : entry.projectName,
      comment: body.comment !== undefined ? body.comment : entry.comment,
    };

    const updated = await WorkEntry.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.json({
      id: updated._id,
      userId: updated.userId,
      startDate: updated.startDate,
      startTime: updated.startTime,
      endDate: updated.endDate,
      endTime: updated.endTime,
      hasBreak: updated.hasBreak,
      breakStartHour: updated.breakStartHour,
      breakStartMin: updated.breakStartMin,
      breakEndHour: updated.breakEndHour,
      breakEndMin: updated.breakEndMin,
      category: updated.category,
      hourlyRate: updated.hourlyRate,
      location: updated.location,
      employerId: updated.employerId,
      projectName: updated.projectName,
      comment: updated.comment,
      durationHours: calculateDurationHours(updated),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

app.delete('/work-entries/:id', authMiddleware, async (req, res) => {
  const entry = await WorkEntry.findById(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  if (entry.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    await WorkEntry.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// INVOICE PREVIEW
app.post('/invoice-preview', authMiddleware, async (req, res) => {
  const { startDate, endDate, hourlyRate } = req.body;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Missing startDate or endDate' });
  }

  const entries = await WorkEntry.find({
    userId: req.user.userId,
    startDate: { $gte: startDate, $lte: endDate },
  });

  let totalHours = 0;
  const items = entries.map((e) => {
    const durationHours = calculateDurationHours(e);
    totalHours += durationHours;
    return {
      date: e.startDate,
      hours: durationHours,
      rate: hourlyRate || e.hourlyRate || 0,
      amount: durationHours * (hourlyRate || e.hourlyRate || 0),
    };
  });

  const total = totalHours * (hourlyRate || 0);

  res.json({
    items,
    totalHours,
    total,
  });
});

// CRON: weekly summary (example - runs every Monday at 9 AM)
cron.schedule('0 9 * * 1', () => {
  console.log('📊 Weekly summary job triggered');
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log(`📊 Base de données: MongoDB`);
  console.log(`🔐 Utilisateur de test: boussad@example.com / password123`);
});

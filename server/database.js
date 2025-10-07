import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from './models/User.js';
import WorkEntry from './models/WorkEntry.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/heures-travaille';

// Connexion à MongoDB
export async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    console.log(`📊 Base de données: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error.message);
    console.log('');
    console.log('💡 SOLUTION:');
    console.log('1. Vérifiez que MongoDB est installé et démarré');
    console.log('2. Commande Windows: net start MongoDB');
    console.log('3. Ou téléchargez MongoDB: https://www.mongodb.com/try/download/community');
    console.log('');
    process.exit(1);
  }
}

// Ajouter des données de test
export async function seedDatabase() {
  try {
    // Vérifier si des utilisateurs existent déjà
    const userCount = await User.countDocuments();
    
    if (userCount > 0) {
      console.log('ℹ️  La base de données contient déjà des données');
      return;
    }

    console.log('🌱 Ajout de données de test...');

    // Créer un utilisateur de test
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const userId = 'test-user-' + Date.now();

    const user = new User({
      _id: userId,
      firstName: 'Boussad',
      lastName: 'AIT DJOUDI OUFELLA',
      email: 'boussad@example.com',
      phone: '06 12 34 56 78',
      password: hashedPassword,
      avatarUrl: null,
    });

    await user.save();

    // Créer des entrées de travail de test
    const workEntries = [
      {
        _id: 'entry-1-' + Date.now(),
        userId: userId,
        startDate: '2025-01-06',
        startTime: '09:00',
        endDate: '2025-01-06',
        endTime: '17:00',
        hasBreak: true,
        breakStartHour: '12',
        breakStartMin: '00',
        breakEndHour: '13',
        breakEndMin: '00',
        category: 'Standard',
        hourlyRate: 50,
        location: {
          city: 'Paris',
          address: '10 Rue de la République',
          latitude: null,
          longitude: null,
        },
        employerId: 'client-1',
        projectName: 'Développement site web',
        comment: 'Journée productive',
      },
      {
        _id: 'entry-2-' + Date.now() + 1,
        userId: userId,
        startDate: '2025-01-07',
        startTime: '10:00',
        endDate: '2025-01-07',
        endTime: '18:00',
        hasBreak: true,
        breakStartHour: '12',
        breakStartMin: '30',
        breakEndHour: '13',
        breakEndMin: '30',
        category: 'Standard',
        hourlyRate: 50,
        location: {
          city: 'Paris',
          address: '20 Avenue des Champs',
          latitude: null,
          longitude: null,
        },
        employerId: 'client-2',
        projectName: 'Consulting technique',
        comment: 'Réunion client',
      },
      {
        _id: 'entry-3-' + Date.now() + 2,
        userId: userId,
        startDate: '2025-01-08',
        startTime: '09:30',
        endDate: '2025-01-08',
        endTime: '16:30',
        hasBreak: true,
        breakStartHour: '12',
        breakStartMin: '00',
        breakEndHour: '13',
        breakEndMin: '00',
        category: 'Standard',
        hourlyRate: 60,
        location: {
          city: 'Lyon',
          address: '5 Place Bellecour',
          latitude: null,
          longitude: null,
        },
        employerId: 'client-3',
        projectName: 'Formation',
        comment: 'Session de formation',
      },
    ];

    await WorkEntry.insertMany(workEntries);

    console.log('✅ Données de test ajoutées avec succès');
    console.log('📧 Email de test: boussad@example.com');
    console.log('🔑 Mot de passe: password123');
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error.message);
  }
}

// Réinitialiser la base de données
export async function resetDatabase() {
  try {
    console.log('🗑️  Suppression des données existantes...');
    await WorkEntry.deleteMany({});
    await User.deleteMany({});
    await seedDatabase();
    console.log('✅ Base de données réinitialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error.message);
    throw error;
  }
}

// Déconnexion propre
export async function disconnectDatabase() {
  try {
    await mongoose.connection.close();
    console.log('👋 Déconnecté de MongoDB');
  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion:', error.message);
  }
}

// Gestion de la fermeture gracieuse
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

export { User, WorkEntry };

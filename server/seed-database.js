import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// ===== MODELS =====
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  phone: String,
  address: String,
  siret: String,
  avatarUrl: String,
  defaultHourlyRate: Number,
});

const workEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: String,
  clientName: String,
  categoryId: String,
  categoryName: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: String,
  hourlyRate: Number,
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
  },
});

const User = mongoose.model('User', userSchema);
const WorkEntry = mongoose.model('WorkEntry', workEntrySchema);

// ===== CONFIGURATION =====
const MONGO_URI = 'mongodb://localhost:27017/heures-travaille';

// ===== DONNÉES DE TEST =====
const testUsers = [
  {
    email: 'marie.dupont@test.com',
    password: 'Test123!',
    firstName: 'Marie',
    lastName: 'Dupont',
    phone: '+33 6 12 34 56 78',
    address: '15 Rue de la Paix, 75002 Paris',
    siret: '123 456 789 00012',
    defaultHourlyRate: 45,
  },
  {
    email: 'pierre.martin@test.com',
    password: 'Test123!',
    firstName: 'Pierre',
    lastName: 'Martin',
    phone: '+33 6 98 76 54 32',
    address: '42 Avenue des Champs-Élysées, 75008 Paris',
    siret: '987 654 321 00045',
    defaultHourlyRate: 55,
  },
  {
    email: 'sophie.bernard@test.com',
    password: 'Test123!',
    firstName: 'Sophie',
    lastName: 'Bernard',
    phone: '+33 6 55 44 33 22',
    address: '8 Boulevard Saint-Germain, 75005 Paris',
    siret: '456 789 123 00089',
    defaultHourlyRate: 50,
  },
];

// Clients pour les tests
const clients = [
  { id: 'client-1', name: 'Restaurant Le Gourmet', address: '23 Rue de Rivoli', city: 'Paris', postalCode: '75001', siret: '111 222 333 00011' },
  { id: 'client-2', name: 'Café des Arts', address: '56 Boulevard Voltaire', city: 'Paris', postalCode: '75011', siret: '222 333 444 00022' },
  { id: 'client-3', name: 'Boulangerie du Coin', address: '12 Rue Montmartre', city: 'Paris', postalCode: '75002', siret: '333 444 555 00033' },
  { id: 'client-4', name: 'Hôtel Beauséjour', address: '78 Avenue de la République', city: 'Paris', postalCode: '75011', siret: '444 555 666 00044' },
  { id: 'client-5', name: 'Pizzeria Bella Vista', address: '34 Rue de la Roquette', city: 'Paris', postalCode: '75011', siret: '555 666 777 00055' },
];

// Catégories/Activités
const categories = [
  { id: 'cat-1', name: 'Service' },
  { id: 'cat-2', name: 'Cuisine' },
  { id: 'cat-3', name: 'Ménage' },
  { id: 'cat-4', name: 'Réception' },
  { id: 'cat-5', name: 'Livraison' },
];

// Fonction pour générer des heures de travail aléatoires
function generateWorkEntries(userId, count = 20) {
  const entries = [];
  const now = new Date();
  
  // Coordonnées GPS de Paris (variées)
  const parisLocations = [
    { lat: 48.8566, lng: 2.3522, addr: '23 Rue de Rivoli, 75001 Paris' },
    { lat: 48.8606, lng: 2.3376, addr: '56 Boulevard Voltaire, 75011 Paris' },
    { lat: 48.8656, lng: 2.3212, addr: '12 Rue Montmartre, 75002 Paris' },
    { lat: 48.8534, lng: 2.3488, addr: '78 Avenue de la République, 75011 Paris' },
    { lat: 48.8584, lng: 2.2945, addr: '34 Rue de la Roquette, 75011 Paris' },
  ];

  for (let i = 0; i < count; i++) {
    // Date aléatoire dans les 60 derniers jours
    const daysAgo = Math.floor(Math.random() * 60);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysAgo);
    startDate.setHours(8 + Math.floor(Math.random() * 8), 0, 0, 0);

    // Durée de travail : 2 à 8 heures
    const duration = 2 + Math.floor(Math.random() * 7);
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + duration);

    // Client et catégorie aléatoires
    const client = clients[Math.floor(Math.random() * clients.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const location = parisLocations[Math.floor(Math.random() * parisLocations.length)];

    // Taux horaire : entre 40 et 60€
    const hourlyRate = 40 + Math.floor(Math.random() * 21);

    entries.push({
      userId,
      clientId: client.id,
      clientName: client.name,
      categoryId: category.id,
      categoryName: category.name,
      startDate,
      endDate,
      description: `${category.name} chez ${client.name}`,
      hourlyRate,
      location: {
        latitude: location.lat,
        longitude: location.lng,
        address: location.addr,
      },
    });
  }

  return entries;
}

// ===== SCRIPT PRINCIPAL =====
async function seedDatabase() {
  try {
    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connecté à MongoDB\n');

    // Nettoyer la base de données
    console.log('🗑️  Nettoyage de la base de données...');
    await User.deleteMany({});
    await WorkEntry.deleteMany({});
    console.log('✅ Base de données nettoyée\n');

    // Créer les utilisateurs
    console.log('👥 Création des utilisateurs...');
    const createdUsers = [];

    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        ...userData,
        password: hashedPassword,
      });
      createdUsers.push(user);
      console.log(`   ✅ ${user.firstName} ${user.lastName} (${user.email})`);
    }
    console.log('');

    // Créer des heures de travail pour chaque utilisateur
    console.log('⏱️  Création des heures de travail...');
    let totalEntries = 0;

    for (const user of createdUsers) {
      const entries = generateWorkEntries(user._id, 25); // 25 entrées par utilisateur
      await WorkEntry.insertMany(entries);
      totalEntries += entries.length;
      console.log(`   ✅ ${entries.length} entrées pour ${user.firstName} ${user.lastName}`);
    }
    console.log(`   📊 Total : ${totalEntries} heures de travail créées\n`);

    // Afficher les identifiants
    console.log('════════════════════════════════════════════════════════════');
    console.log('🎉 BASE DE DONNÉES REMPLIE AVEC SUCCÈS !');
    console.log('════════════════════════════════════════════════════════════\n');
    
    console.log('📧 IDENTIFIANTS DE CONNEXION :\n');
    
    testUsers.forEach((user, index) => {
      console.log(`👤 UTILISATEUR ${index + 1} :`);
      console.log(`   Email    : ${user.email}`);
      console.log(`   Password : ${user.password}`);
      console.log(`   Nom      : ${user.firstName} ${user.lastName}`);
      console.log(`   Taux     : ${user.defaultHourlyRate}€/h`);
      console.log('');
    });

    console.log('════════════════════════════════════════════════════════════');
    console.log('📊 RÉSUMÉ :');
    console.log(`   • ${createdUsers.length} utilisateurs créés`);
    console.log(`   • ${totalEntries} heures de travail enregistrées`);
    console.log(`   • ${clients.length} clients différents`);
    console.log(`   • ${categories.length} catégories d'activités`);
    console.log('════════════════════════════════════════════════════════════\n');

    console.log('💡 Vous pouvez maintenant vous connecter à l\'application !');
    console.log('   Utilisez l\'un des 3 comptes ci-dessus.\n');

  } catch (error) {
    console.error('❌ Erreur lors du remplissage de la base de données :', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Lancer le script
seedDatabase();


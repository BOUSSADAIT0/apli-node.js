# 🍃 MongoDB Local - Guide d'installation et utilisation

## 📋 Table des matières

1. [Installation de MongoDB sur Windows](#installation-mongodb-windows)
2. [Démarrage du serveur](#démarrage-serveur)
3. [Utilisation de l'application](#utilisation)
4. [Commandes utiles](#commandes-utiles)
5. [Dépannage](#dépannage)

---

## 🪟 Installation de MongoDB sur Windows {#installation-mongodb-windows}

### Étape 1 : Télécharger MongoDB

1. **Allez sur** : https://www.mongodb.com/try/download/community
2. **Sélectionnez** :
   - Version : `7.0.x` (ou la dernière)
   - Platform : `Windows`
   - Package : `MSI`
3. **Cliquez** sur "Download"

### Étape 2 : Installer MongoDB

1. **Exécutez** le fichier `.msi` téléchargé
2. **Suivez l'assistant** :
   - Acceptez la licence
   - Choisissez "Complete" pour l'installation
   - **IMPORTANT** : Cochez "Install MongoDB as a Service"
   - **IMPORTANT** : Cochez "Install MongoDB Compass" (interface graphique)
3. **Cliquez** sur "Install"

### Étape 3 : Vérifier l'installation

Ouvrez **PowerShell** ou **Invite de commandes** et tapez :

```bash
mongod --version
```

**Réponse attendue** :
```
db version v7.0.x
Build Info: ...
```

---

## 🚀 Démarrage du serveur {#démarrage-serveur}

### Option 1 : Service Windows (Automatique - Recommandé)

Si vous avez coché "Install MongoDB as a Service" lors de l'installation, MongoDB démarre **automatiquement** au démarrage de Windows.

**Vérifier le statut** :
```powershell
net start | findstr MongoDB
```

**Démarrer manuellement** (si arrêté) :
```powershell
net start MongoDB
```

**Arrêter** (si nécessaire) :
```powershell
net stop MongoDB
```

### Option 2 : Démarrage manuel

Si MongoDB n'est pas installé comme service :

```powershell
# Créer le dossier de données (première fois seulement)
mkdir C:\data\db

# Démarrer MongoDB
mongod
```

⚠️ **Laissez cette fenêtre ouverte** tant que vous utilisez l'application.

---

## 💻 Utilisation de l'application {#utilisation}

### Étape 1 : Installer les dépendances

```bash
cd server
npm install
```

Cela installera `mongoose` (ODM pour MongoDB).

### Étape 2 : Lancer le serveur backend

```bash
npm start
```

**Sortie attendue** :
```
🚀 Démarrage du serveur...
✅ Connecté à MongoDB
📊 Base de données: heures-travaille
🌱 Ajout de données de test...
✅ Données de test ajoutées avec succès
📧 Email de test: boussad@example.com
🔑 Mot de passe: password123
✅ Server running on http://localhost:4000
📊 Base de données: MongoDB
🔐 Utilisateur de test: boussad@example.com / password123
```

### Étape 3 : Tester l'API

**Vérifier la santé du serveur** :
```bash
curl http://localhost:4000/health
```

**Réponse** :
```json
{
  "ok": true,
  "service": "heures-travaille-backend",
  "database": "MongoDB"
}
```

**Se connecter** :
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"boussad@example.com\",\"password\":\"password123\"}"
```

---

## 🛠️ Commandes utiles {#commandes-utiles}

### MongoDB Shell (mongosh)

**Ouvrir le shell** :
```bash
mongosh
```

**Commandes de base** :
```javascript
// Lister les bases de données
show dbs

// Utiliser la base de données
use heures-travaille

// Lister les collections (tables)
show collections

// Compter les utilisateurs
db.users.countDocuments()

// Voir tous les utilisateurs
db.users.find().pretty()

// Voir les entrées de travail
db.work_entries.find().pretty()

// Supprimer toutes les données
db.users.deleteMany({})
db.work_entries.deleteMany({})

// Quitter
exit
```

### MongoDB Compass (Interface graphique)

1. **Ouvrez** MongoDB Compass
2. **Connectez-vous** avec : `mongodb://localhost:27017`
3. **Sélectionnez** la base `heures-travaille`
4. **Explorez** les collections `users` et `work_entries`

### Réinitialiser la base de données

**Via l'API** (serveur en cours d'exécution) :
```bash
curl -X POST http://localhost:4000/dev/reset-database
```

**Via mongosh** :
```bash
mongosh
use heures-travaille
db.dropDatabase()
```

Puis redémarrez le serveur pour recréer les données de test.

---

## 📊 Structure de la base de données

### Collection `users`

```javascript
{
  _id: "u_1736247890123_abc123",
  firstName: "Boussad",
  lastName: "AIT DJOUDI OUFELLA",
  email: "boussad@example.com",
  phone: "06 12 34 56 78",
  password: "$2a$10$hash...",
  avatarUrl: null,
  createdAt: ISODate("2025-01-07T12:00:00Z"),
  updatedAt: ISODate("2025-01-07T12:00:00Z")
}
```

### Collection `work_entries`

```javascript
{
  _id: "e_1736247890456_xyz789",
  userId: "u_1736247890123_abc123",
  startDate: "2025-01-06",
  startTime: "09:00",
  endDate: "2025-01-06",
  endTime: "17:00",
  hasBreak: true,
  breakStartHour: "12",
  breakStartMin: "00",
  breakEndHour: "13",
  breakEndMin: "00",
  category: "Standard",
  hourlyRate: 50,
  location: {
    city: "Paris",
    address: "10 Rue de la République",
    latitude: null,
    longitude: null
  },
  employerId: "client-1",
  projectName: "Développement site web",
  comment: "Journée productive",
  createdAt: ISODate("2025-01-07T12:00:00Z"),
  updatedAt: ISODate("2025-01-07T12:00:00Z")
}
```

---

## 🆘 Dépannage {#dépannage}

### ❌ Erreur : "Cannot find package 'mongoose'"

**Solution** :
```bash
cd server
npm install
```

### ❌ Erreur : "MongoServerError: connect ECONNREFUSED"

**Cause** : MongoDB n'est pas démarré.

**Solution** :
```powershell
# Vérifier si MongoDB est démarré
net start | findstr MongoDB

# Si absent, démarrer
net start MongoDB
```

### ❌ Erreur : "Access is denied" lors du démarrage de MongoDB

**Cause** : Vous devez exécuter PowerShell en tant qu'administrateur.

**Solution** :
1. Clic droit sur PowerShell
2. "Exécuter en tant qu'administrateur"
3. Réessayez : `net start MongoDB`

### ❌ MongoDB Compass ne se connecte pas

**Solution** :
1. Vérifiez que MongoDB est démarré
2. Utilisez cette URI : `mongodb://localhost:27017`
3. Cliquez sur "Connect"

### ❌ Le serveur affiche "Erreur de connexion à MongoDB"

**Vérifications** :
1. MongoDB est-il démarré ? → `net start | findstr MongoDB`
2. Port 27017 disponible ? → Vérifiez qu'aucune autre application n'utilise ce port
3. Firewall ? → Autorisez MongoDB dans le pare-feu Windows

---

## 🌟 Données de test

Au premier démarrage, les données suivantes sont créées :

### 1 Utilisateur

- **Email** : `boussad@example.com`
- **Mot de passe** : `password123`
- **Nom** : Boussad AIT DJOUDI OUFELLA
- **Téléphone** : 06 12 34 56 78

### 3 Entrées de travail

| Date       | Heures          | Pause       | Projet                  | Ville | Taux  |
|------------|-----------------|-------------|-------------------------|-------|-------|
| 2025-01-06 | 09:00 - 17:00   | 12:00-13:00 | Développement site web  | Paris | 50€/h |
| 2025-01-07 | 10:00 - 18:00   | 12:30-13:30 | Consulting technique    | Paris | 50€/h |
| 2025-01-08 | 09:30 - 16:30   | 12:00-13:00 | Formation               | Lyon  | 60€/h |

---

## 🎯 Variables d'environnement (Optionnel)

Créez un fichier `.env` dans le dossier `server` :

```env
# Connexion MongoDB
MONGODB_URI=mongodb://localhost:27017/heures-travaille

# JWT Secret
JWT_SECRET=your-super-secret-key-change-me-in-production

# Port serveur
PORT=4000

# CORS
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

---

## ✅ Checklist de démarrage

- [ ] MongoDB installé
- [ ] Service MongoDB démarré (`net start MongoDB`)
- [ ] Dependencies installées (`npm install`)
- [ ] Serveur backend démarré (`npm start`)
- [ ] Connexion réussie (message "✅ Connecté à MongoDB")
- [ ] Données de test créées
- [ ] API accessible sur http://localhost:4000

---

## 📚 Ressources

- **MongoDB Docs** : https://www.mongodb.com/docs/manual/
- **Mongoose Docs** : https://mongoosejs.com/docs/
- **MongoDB Compass** : https://www.mongodb.com/products/compass
- **MongoDB Shell** : https://www.mongodb.com/docs/mongodb-shell/

---

**Base de données MongoDB configurée avec ❤️ pour les auto-entrepreneurs français** 🇫🇷


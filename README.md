# 📱 Heures de Travail - Application Mobile

Application mobile de gestion des heures de travail pour auto-entrepreneurs, développée avec React Native et Expo.

## ✨ Fonctionnalités

### 🏠 **Accueil**
- Vue d'ensemble des statistiques
- Navigation rapide vers les fonctionnalités principales

### ⏰ **Heures**
- Calendrier interactif avec couleurs mixtes (Client + Activité)
- Ajout/modification/suppression d'entrées de travail
- Calcul automatique des heures et montants
- Gestion des pauses

### 👥 **Clients & Activités**
- Gestion séparée des clients et activités
- Couleurs personnalisables pour identification visuelle
- Informations complètes (adresse, SIRET, taux horaire)

### 📊 **Récap**
- Statistiques par période (semaine/mois/année)
- Répartition par catégorie
- Export PDF/Excel

### 💰 **Factures**
- Génération de factures
- Prévisualisation et export

### ⚙️ **Paramètres**
- Configuration des notifications
- Paramètres de l'application

### 👤 **Profil**
- Gestion du profil utilisateur
- Photo de profil (caméra/galerie)
- Informations personnelles et professionnelles

## 🚀 Installation

### Prérequis
- Node.js (v16 ou supérieur)
- npm ou yarn
- Expo CLI
- MongoDB

### Installation

1. **Cloner le repository**
   ```bash
   git clone <votre-repo>
   cd heures-travaille
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   cd server
   npm install
   ```

3. **Démarrer MongoDB**
   - Installer MongoDB localement
   - Ou utiliser MongoDB Atlas

4. **Démarrer le serveur**
   ```bash
   cd server
   node index.js
   ```

5. **Démarrer l'application**
   ```bash
   npx expo start
   ```

## 🧪 Comptes de Test

Les comptes suivants sont créés automatiquement :

- **Marie Dupont** : `marie@example.com` / `password123`
- **Pierre Martin** : `pierre@example.com` / `password123`
- **Sophie Bernard** : `sophie@example.com` / `password123`

## 🎨 Système de Couleurs

L'application utilise un système de couleurs mixtes dans le calendrier :

- **Couleur finale** = 50% couleur client + 50% couleur activité
- Chaque combinaison client/activité = couleur unique
- Identification visuelle instantanée des types de travail

## 📱 Technologies

### Frontend
- **React Native** avec Expo
- **TypeScript** pour la sécurité des types
- **Expo Router** pour la navigation
- **AsyncStorage** pour la persistance locale

### Backend
- **Node.js** avec Express
- **MongoDB** avec Mongoose
- **JWT** pour l'authentification
- **bcryptjs** pour le hachage des mots de passe

### UI/UX
- Design moderne et responsive
- Thème sombre/clair adaptatif
- Animations fluides
- Accessibilité optimisée

## 🔧 Structure du Projet

```
heures-travaille/
├── app/                    # Pages de l'application (Expo Router)
│   ├── (tabs)/            # Onglets principaux
│   ├── auth/              # Authentification
│   └── _layout.tsx        # Layout principal
├── components/            # Composants réutilisables
├── lib/                   # Utilitaires et API
├── server/                # Backend Node.js
│   ├── models/           # Modèles MongoDB
│   └── index.js          # Serveur principal
└── assets/               # Images et ressources
```

## 📋 API Endpoints

### Authentification
- `POST /auth/login` - Connexion
- `POST /auth/register` - Inscription

### Utilisateurs
- `GET /users/profile` - Profil utilisateur
- `PUT /users/:id` - Modification profil

### Heures de travail
- `GET /work-entries` - Liste des entrées
- `POST /work-entries` - Créer une entrée
- `PUT /work-entries/:id` - Modifier une entrée
- `DELETE /work-entries/:id` - Supprimer une entrée

## 🚀 Déploiement

### Backend
```bash
cd server
npm start
```

### Frontend
```bash
npx expo build:android
npx expo build:ios
```

## 📄 Licence

Ce projet est sous licence MIT.

## 👨‍💻 Développement

Pour contribuer au projet :

1. Fork le repository
2. Créer une branche feature
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 🆘 Support

Pour toute question ou problème, ouvrez une issue sur GitHub.

---

**Développé avec ❤️ pour les auto-entrepreneurs**
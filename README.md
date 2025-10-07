# ⏰ Heures Travaillées - Application de gestion du temps

Application mobile et web de suivi des heures de travail, spécialement conçue pour les **auto-entrepreneurs en France** 🇫🇷

## 🎯 Public cible

Cette application est destinée aux **auto-entrepreneurs français** qui :
- Ont **un seul statut SIREN** (une seule entreprise)
- Peuvent exercer **plusieurs activités** sous ce statut unique
- Travaillent pour **plusieurs clients**
- Ont besoin de suivre précisément leurs heures de travail et leurs revenus

## ✨ Fonctionnalités principales

### 🔐 Authentification
- Création de compte avec validation stricte
- Connexion/déconnexion sécurisée (JWT)
- Gestion de session locale

### 👤 Profil utilisateur
- Photo de profil personnalisable
- Informations personnelles (nom, prénom, email, téléphone)
- **Numéro SIRET** pour votre statut auto-entrepreneur
- Suppression de compte

### ⏱️ Suivi des heures
- Enregistrement précis : date, heure de début/fin
- Gestion des pauses (durée personnalisable)
- Lieu de travail (ville + adresse)
- Commentaires optionnels
- **Calcul automatique** du nombre d'heures travaillées

### 📅 Calendrier mensuel
- Visualisation des jours travaillés
- Navigation mois par mois
- **Badges** affichant heures et montant par jour
- Cliquer sur un jour pour ajouter/modifier une entrée
- **Résumés** : hebdomadaire et mensuel (heures totales, montant, nombre de jours)

### 🏢 Gestion des clients & activités
- Créer plusieurs **clients** (entreprises pour lesquelles vous travaillez)
- Créer plusieurs **activités** (types de prestations que vous proposez)
- Taux horaire par défaut personnalisable par client/activité
- **Couleurs** pour identifier visuellement chaque client/activité
- Tout géré sous votre **unique statut SIREN**

### 🏷️ Catégories personnalisables
- 4 catégories par défaut : Standard, Heures sup., Weekend, Nuit
- Ajout/suppression de vos propres catégories
- Filtrage et organisation de vos journées

### 📍 Géolocalisation
- Capture automatique de votre **position GPS**
- Reverse geocoding : récupération automatique de la ville et l'adresse
- Bouton "📍 Capturer ma position" dans le formulaire avancé

### 📄 Facturation & Export
- **Génération de factures PDF** professionnelles
- Export **Excel/CSV** pour votre comptabilité
- Filtrage par période (date de début/fin)
- Calcul automatique avec taux horaire
- Partage direct par email ou autre app

### 🔔 Notifications push
- **Rappels de fin de journée** : n'oubliez pas d'enregistrer vos heures
- **Résumés hebdomadaires** : bilan de votre semaine
- Configuration personnalisable dans Paramètres

### 🎨 Interface moderne
- Thème clair/sombre automatique
- Design épuré et professionnel
- Navigation intuitive par onglets
- Toasts de feedback pour chaque action

## 🚀 Démarrage rapide

### Installation des dépendances

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### Packages Expo supplémentaires

Si vous n'avez pas encore installé les packages Expo requis :

```bash
npx expo install expo-print expo-sharing expo-image-picker expo-notifications expo-location
```

### Lancer l'application

**1. Démarrer le backend (API)**

```bash
cd server
node index.js
```

Le serveur démarre sur `http://localhost:3000`

**2. Démarrer le frontend (Expo)**

Dans un autre terminal, depuis la racine du projet :

```bash
npx expo start
```

Ensuite, choisissez :
- **w** pour ouvrir dans le navigateur web
- **a** pour ouvrir sur un émulateur Android
- **i** pour ouvrir sur un simulateur iOS
- Scanner le QR code avec l'app **Expo Go** sur votre téléphone

## 📂 Structure du projet

```
heures-travaille/
├── app/                          # Frontend Expo (React Native)
│   ├── (tabs)/                   # Écrans principaux
│   │   ├── index.tsx             # Page d'accueil (présentation)
│   │   ├── hours.tsx             # Suivi des heures + calendrier
│   │   ├── invoices.tsx          # Factures & export
│   │   ├── employers.tsx         # Gestion clients/activités
│   │   ├── profile.tsx           # Profil utilisateur + SIRET
│   │   └── settings.tsx          # Paramètres (catégories, notifications)
│   └── auth/                     # Authentification
│       ├── login.tsx
│       └── register.tsx
├── components/                   # Composants réutilisables
│   └── work-entry-form.tsx       # Formulaire de saisie d'heures
├── lib/                          # Utilitaires & logique métier
│   ├── api.ts                    # Client API
│   ├── clients.ts                # Gestion clients/activités
│   ├── categories.ts             # Catégories personnalisables
│   ├── notifications.ts          # Notifications push
│   ├── cache.ts                  # Cache hybride (localStorage + mémoire)
│   └── toast.ts                  # Notifications toast
├── constants/
│   └── theme.ts                  # Palette de couleurs & thème
├── server/                       # Backend Express.js
│   ├── index.js                  # API REST + authentification JWT
│   └── package.json
└── README.md                     # Ce fichier
```

## 🛠️ Technologies utilisées

### Frontend
- **Expo** & **React Native** : framework mobile cross-platform
- **Expo Router** : navigation file-based
- **TypeScript** : typage statique
- **expo-print** : génération PDF
- **expo-sharing** : partage de fichiers
- **expo-image-picker** : sélection d'images
- **expo-location** : géolocalisation GPS
- **expo-notifications** : notifications push

### Backend
- **Node.js** + **Express.js** : API REST
- **JWT** : authentification sécurisée
- **bcryptjs** : hachage des mots de passe
- **Zod** : validation des données
- **express-rate-limit** : protection contre le spam
- **CORS** : sécurité cross-origin

### Stockage
- **localStorage** (web) ou **AsyncStorage** (mobile) : cache côté client
- **In-memory** : stockage temporaire backend (dev)
- _Note : pour la production, remplacer par une vraie base de données (PostgreSQL, MongoDB, etc.)_

## 📋 Guide d'utilisation

### 1. Créer votre compte
- Renseignez prénom, nom, email et mot de passe (6+ caractères)
- Connexion automatique après inscription

### 2. Configurer votre profil
- Allez dans l'onglet **"Profil"** ou **"Explore"**
- Ajoutez votre photo de profil
- Renseignez vos coordonnées (email, téléphone)
- **Important** : ajoutez votre **numéro SIRET** (14 chiffres)

### 3. Ajouter vos clients/activités
- Onglet **"Clients"**
- Cliquez sur **"+ Ajouter"**
- Choisissez entre **"Client"** (entreprise) ou **"Activité"** (type de prestation)
- Renseignez le nom et le taux horaire par défaut
- Choisissez une couleur pour identifier visuellement

### 4. Enregistrer vos heures
- Onglet **"Heures"**
- Cliquez sur **"Ajouter une journée"**
- Remplissez : date, heures début/fin, pauses, client, catégorie
- Option : capturez votre position GPS pour le lieu
- Validez : les heures et le montant sont calculés automatiquement

### 5. Consulter le calendrier
- Visualisez vos journées travaillées en un coup d'œil
- Les jours avec des entrées sont surlignés
- Badges affichant heures et montant par jour
- Résumés hebdo/mensuel en bas de page

### 6. Générer des factures
- Onglet **"Factures"**
- Sélectionnez la période (date début/fin)
- Cliquez sur **"📄 PDF"** pour générer une facture professionnelle
- Cliquez sur **"📊 Excel"** pour exporter en CSV
- Partagez directement par email ou autre app

### 7. Personnaliser l'app
- Onglet **"Paramètres"**
- Gérez vos catégories de travail
- Activez/configurez les notifications push

## 🇫🇷 Contexte auto-entrepreneur

En France, un **auto-entrepreneur** (ou micro-entrepreneur) :
- A un **numéro SIRET unique** (14 chiffres)
- Peut déclarer **plusieurs activités** sous ce même SIRET
- Facture plusieurs clients différents
- Doit tenir un **livre des recettes**
- Déclare son chiffre d'affaires mensuellement ou trimestriellement

Cette application vous aide à :
- ✅ **Suivre précisément vos heures** pour chaque client/activité
- ✅ **Calculer automatiquement vos revenus**
- ✅ **Générer des justificatifs** pour votre comptabilité
- ✅ **Organiser votre temps** avec le calendrier
- ✅ **Géolocaliser vos interventions** en cas de déplacements

## 🔒 Sécurité

- **Mots de passe** : hachés avec bcryptjs (jamais stockés en clair)
- **JWT** : tokens sécurisés avec expiration
- **Rate limiting** : protection contre les attaques par force brute
- **CORS** : restriction des origines autorisées
- **Validation** : Zod pour toutes les données entrantes

## 📝 Améliorations futures (roadmap)

- [ ] Base de données réelle (PostgreSQL/MongoDB) au lieu de in-memory
- [ ] Hébergement cloud (backend + frontend)
- [ ] Génération automatique de factures avec TVA
- [ ] Intégration avec l'API URSSAF pour déclaration
- [ ] Graphiques de statistiques (revenus mensuels, heures par client, etc.)
- [ ] Mode hors ligne complet avec sync automatique
- [ ] Export comptable direct (format FEC)
- [ ] Rappels intelligents basés sur vos habitudes

## 🤝 Contribution

Ce projet est un MVP (Minimum Viable Product) destiné aux auto-entrepreneurs français. Les contributions sont les bienvenues !

## 📄 Licence

Propriétaire - Tous droits réservés

---

**Développé avec ❤️ pour les auto-entrepreneurs français** 🇫🇷

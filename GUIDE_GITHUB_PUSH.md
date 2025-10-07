# 🚀 Guide pour Pousser sur GitHub

## Étape 1 : Configurer le dépôt distant

### Si vous AVEZ déjà créé un dépôt sur GitHub :
```bash
git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
```
Remplacez `VOTRE-USERNAME` et `VOTRE-REPO` par vos informations.

### Si vous N'AVEZ PAS encore de dépôt :
1. Allez sur https://github.com
2. Cliquez sur "New repository"
3. Nom : `heures-travaille` (ou autre)
4. **NE cochez PAS** "Initialize with README"
5. Cliquez "Create repository"
6. Copiez l'URL et utilisez-la dans la commande ci-dessus

---

## Étape 2 : Ajouter tous les fichiers

```bash
git add .
```

Cette commande ajoute tous les nouveaux fichiers et modifications.
**Note** : Le fichier `.env` est automatiquement ignoré (il contient votre IP locale).

---

## Étape 3 : Créer un commit

```bash
git commit -m "✨ Application complète de gestion d'heures pour auto-entrepreneurs

- Authentification (login/register)
- Gestion des clients (nom, adresse, SIRET)
- Suivi des heures avec calendrier interactif
- Sélection du client lors de l'ajout d'heures
- Génération de factures PDF
- Export CSV
- Base de données MongoDB
- API Backend Express
- Interface mobile React Native (Expo)"
```

---

## Étape 4 : Pousser sur GitHub

```bash
git push -u origin master
```

**Si vous avez une erreur** "branch 'main' not found", utilisez :
```bash
git push -u origin main
```

---

## 🔐 Important : Configuration pour les autres développeurs

Le fichier `.env` n'est PAS dans le dépôt (pour la sécurité).
Les autres développeurs devront créer leur propre `.env` :

```bash
# Créer un fichier .env à la racine du projet
EXPO_PUBLIC_API_BASE_URL=http://LEUR_IP_LOCALE:4000
```

Pour trouver l'IP locale :
- **Windows** : `ipconfig` → Adresse IPv4
- **Mac/Linux** : `ifconfig` → inet

---

## 📦 Installation pour les autres développeurs

Après avoir cloné le dépôt :

```bash
# 1. Installer les dépendances frontend
npm install

# 2. Installer les dépendances backend
cd server
npm install
cd ..

# 3. Créer le fichier .env (voir ci-dessus)

# 4. Démarrer MongoDB (Windows)
# Services > MongoDB > Démarrer

# 5. Démarrer le serveur backend (terminal 1)
cd server
npm start

# 6. Démarrer l'app Expo (terminal 2)
npx expo start
```

---

## 🎯 Commandes Git Utiles

### Vérifier l'état
```bash
git status
```

### Voir l'historique
```bash
git log --oneline
```

### Voir les fichiers ignorés
```bash
git status --ignored
```

### Pousser après des modifications
```bash
git add .
git commit -m "Description des modifications"
git push
```

---

## ⚠️ Fichiers Importants NON Poussés

Ces fichiers sont dans `.gitignore` et ne seront PAS envoyés sur GitHub :
- `.env` - Configuration locale (IP du serveur)
- `node_modules/` - Dépendances (à réinstaller avec npm install)
- `.expo/` - Cache Expo
- `ios/` et `android/` - Dossiers natifs générés

---

**Bon push ! 🚀**


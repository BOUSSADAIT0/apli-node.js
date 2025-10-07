# 📷 Fonctionnalité Caméra Selfie - Photo de Profil

## ✅ Modifications Apportées

### **Nouvelle Fonctionnalité : Choix entre Caméra et Galerie**

L'utilisateur peut maintenant choisir comment ajouter sa photo de profil :

1. 📷 **Prendre un selfie** (caméra frontale)
2. 🖼️ **Choisir depuis la galerie**

---

## 🎯 Comportement

### **Sur Mobile (iOS/Android)**

Lorsque l'utilisateur clique sur "Changer la photo" ou sur l'icône 📷 :
- Une **alerte avec 3 options** s'affiche :
  1. **📷 Prendre un selfie** → Ouvre la caméra frontale
  2. **🖼️ Choisir depuis la galerie** → Ouvre la galerie de photos
  3. **Annuler** → Ferme le menu

### **Sur Web**

- Ouvre directement la galerie de photos (la caméra n'est pas disponible sur web)

---

## 🔧 Détails Techniques

### **Fonction `handleTakePhoto`**

```typescript
const handleTakePhoto = async () => {
  // 1. Demander la permission d'accéder à la caméra
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (perm.status !== 'granted') {
    Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à la caméra.');
    return;
  }
  
  // 2. Lancer la caméra
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: true,
    aspect: [1, 1],
    cameraType: ImagePicker.CameraType.front, // ⭐ Caméra FRONTALE pour selfie
  });
  
  // 3. Enregistrer la photo
  if (!res.canceled && res.assets && res.assets.length > 0) {
    setAvatarUrl(res.assets[0].uri);
  }
};
```

### **Paramètres Importants**

- ✅ `cameraType: ImagePicker.CameraType.front` → **Caméra frontale** (selfie)
- ✅ `allowsEditing: true` → Permet de recadrer la photo
- ✅ `aspect: [1, 1]` → Format carré (parfait pour une photo de profil)
- ✅ `quality: 0.7` → Bonne qualité sans fichier trop lourd

---

## 🔐 Permissions Requises

### **Android** (`app.json`)

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "L'application a besoin d'accéder à vos photos pour votre photo de profil.",
          "cameraPermission": "L'application a besoin d'accéder à la caméra pour prendre votre photo de profil."
        }
      ]
    ]
  }
}
```

### **iOS** (`app.json`)

Les permissions sont déjà configurées par `expo-image-picker`.

---

## 🧪 Test de la Fonctionnalité

### **Sur Mobile**

1. Ouvrez l'application sur votre mobile
2. Allez dans **Profil** 👤
3. Cliquez sur **"Changer la photo"** ou sur l'icône 📷
4. ✅ **Vérification** : Vous devriez voir une alerte avec 3 options
5. Sélectionnez **"📷 Prendre un selfie"**
6. ✅ **Vérification** : La caméra **frontale** s'ouvre (vous voyez votre visage)
7. Prenez la photo
8. Recadrez si nécessaire
9. Validez
10. ✅ **Vérification** : La photo s'affiche comme avatar

### **Tester la Galerie**

1. Cliquez à nouveau sur "Changer la photo"
2. Sélectionnez **"🖼️ Choisir depuis la galerie"**
3. ✅ **Vérification** : La galerie de photos s'ouvre
4. Choisissez une photo existante
5. ✅ **Vérification** : La photo s'affiche comme avatar

---

## 📱 Compatibilité

| Plateforme | Caméra Selfie | Galerie |
|-----------|---------------|---------|
| iOS       | ✅ Oui        | ✅ Oui  |
| Android   | ✅ Oui        | ✅ Oui  |
| Web       | ❌ Non        | ✅ Oui  |

**Note** : Sur web, seulement la galerie est disponible (la caméra web n'est pas supportée par `expo-image-picker`).

---

## 🎨 Expérience Utilisateur

### **Avant** (ancien comportement)
- ❌ Seulement la galerie
- ❌ Pas de selfie possible

### **Après** (nouveau comportement)
- ✅ Choix entre caméra et galerie
- ✅ Caméra frontale par défaut (selfie)
- ✅ Recadrage en carré
- ✅ Interface intuitive

---

## 🔄 Changement de Caméra

Si l'utilisateur veut utiliser la **caméra arrière** au lieu de la frontale, il peut :
1. Ouvrir la caméra
2. Chercher le bouton de rotation de caméra (icône ⟲)
3. Basculer vers la caméra arrière

**Note** : Par défaut, c'est la caméra frontale qui s'ouvre pour faciliter les selfies.

---

## 💾 Stockage de la Photo

La photo est stockée :
1. **Localement** : URI de l'image (ex: `file:///path/to/image.jpg`)
2. **Dans le profil utilisateur** : Sauvegardée via `updateUser()` dans la base de données
3. **Dans AsyncStorage** : Pour persistance entre les sessions

---

## 🚀 Code Mis à Jour

**Fichier modifié** : `app/(tabs)/profile.tsx`

**Nouvelles fonctions** :
- ✅ `handleTakePhoto()` - Ouvre la caméra frontale
- ✅ `handleChoosePhotoOption()` - Affiche le menu de choix

**Boutons mis à jour** :
- ✅ Icône 📷 (badge sur l'avatar)
- ✅ Bouton "Changer la photo"

---

**Profitez de votre nouvelle fonctionnalité de selfie ! 📸✨**


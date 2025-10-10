# 📱 Fonctionnalités Natives de l'Application

Ce document liste toutes les fonctionnalités natives utilisées dans l'application "Heures de Travail", avec les emplacements du code et les explications détaillées.

---

## 📸 1. APPAREIL PHOTO / CAMÉRA

### **Fonctionnalité**
Permet à l'utilisateur de prendre un selfie ou de choisir une photo de profil depuis la galerie.

### **Fichier** : `app/(tabs)/profile.tsx`

### **Code utilisé** :

#### **Prendre un selfie (caméra frontale)**
```typescript
// Ligne 140-160
const handleTakePhoto = async () => {
  try {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission refusée', 'L\'accès à la caméra est nécessaire');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      cameraType: ImagePicker.CameraType.front, // 👈 CAMÉRA FRONTALE (selfie)
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      await saveAvatarUrl(result.assets[0].uri);
    }
  } catch (error) {
    Alert.alert('Erreur', 'Impossible d\'accéder à la caméra');
  }
};
```

#### **Choisir depuis la galerie**
```typescript
// Ligne 115-138
const handlePickImage = async () => {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission refusée', 'L\'accès à la galerie est nécessaire');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      await saveAvatarUrl(result.assets[0].uri);
    }
  } catch (error) {
    Alert.alert('Erreur', 'Impossible d\'accéder à la galerie');
  }
};
```

### **Explication**
- **`ImagePicker.requestCameraPermissionsAsync()`** : Demande la permission d'accéder à la caméra
- **`ImagePicker.launchCameraAsync()`** : Ouvre l'appareil photo natif du téléphone
- **`cameraType: ImagePicker.CameraType.front`** : Force l'utilisation de la caméra frontale pour les selfies
- **`allowsEditing: true`** : Permet de recadrer l'image après la prise
- **`aspect: [1, 1]`** : Force un format carré (pour la photo de profil)

### **Package utilisé** : `expo-image-picker`

---

## 📍 2. GÉOLOCALISATION / GPS

### **Fonctionnalité**
Capture automatique de la localisation de l'utilisateur lors de l'ajout d'heures de travail.

### **Fichier** : `app/(tabs)/hours.tsx`

### **Code utilisé** :

```typescript
// Ligne 280-305
const handleLocationCapture = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'L\'accès à la localisation est nécessaire');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Reverse geocoding pour obtenir l'adresse
    const [geocode] = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      city: geocode?.city || '',
      address: `${geocode?.street || ''} ${geocode?.name || ''}`.trim(),
    };
  } catch (error) {
    console.error('Erreur de géolocalisation:', error);
    return null;
  }
};
```

### **Explication**
- **`Location.requestForegroundPermissionsAsync()`** : Demande la permission d'accéder au GPS
- **`Location.getCurrentPositionAsync()`** : Obtient les coordonnées GPS actuelles (latitude/longitude)
- **`Location.Accuracy.Balanced`** : Précision équilibrée (économise la batterie)
- **`Location.reverseGeocodeAsync()`** : Convertit les coordonnées GPS en adresse lisible (géocodage inversé)

### **Package utilisé** : `expo-location`

### **Données capturées** :
- Latitude et longitude précises
- Ville
- Adresse (rue + numéro)

---

## 🔔 3. NOTIFICATIONS PUSH

### **Fonctionnalité**
Planifie des notifications pour rappeler à l'utilisateur d'enregistrer ses heures.

### **Fichier** : `app/(tabs)/hours.tsx`

### **Code utilisé** :

```typescript
// Ligne 350-385
const scheduleNotification = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Les notifications sont nécessaires');
      return;
    }

    // Planifier une notification quotidienne à 18h
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ N'oubliez pas !",
        body: "Avez-vous enregistré vos heures de travail aujourd'hui ?",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        hour: 18,
        minute: 0,
        repeats: true,
      },
    });

    Alert.alert('✅ Succès', 'Rappel quotidien activé à 18h');
  } catch (error) {
    console.error('Erreur de notification:', error);
    Alert.alert('Erreur', 'Impossible de programmer les notifications');
  }
};
```

### **Explication**
- **`Notifications.requestPermissionsAsync()`** : Demande la permission d'envoyer des notifications
- **`Notifications.scheduleNotificationAsync()`** : Planifie une notification à un moment précis
- **`trigger.hour: 18`** : Notification quotidienne à 18h
- **`repeats: true`** : Se répète tous les jours
- **`priority: HIGH`** : Notification prioritaire (Android)

### **Package utilisé** : `expo-notifications`

---

## 💾 4. STOCKAGE LOCAL PERSISTANT

### **Fonctionnalité**
Sauvegarde des données localement sur le téléphone (clients, activités, adresses récentes, token d'authentification).

### **Fichier** : `lib/storage.ts`

### **Code utilisé** :

```typescript
// Ligne 1-30
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  // Sauvegarder une valeur
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },

  // Récupérer une valeur
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },

  // Supprimer une valeur
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },
};
```

### **Explication**
- **`AsyncStorage.setItem()`** : Sauvegarde une donnée sur le téléphone (persiste même après fermeture de l'app)
- **`AsyncStorage.getItem()`** : Récupère une donnée sauvegardée
- **`AsyncStorage.removeItem()`** : Supprime une donnée
- Les données sont stockées en format JSON
- Similaire à `localStorage` sur le web mais pour mobile

### **Package utilisé** : `@react-native-async-storage/async-storage`

### **Données sauvegardées** :
- Token d'authentification (`@token`)
- Informations utilisateur (`@user`)
- Clients (`@clients`)
- Activités (`@activities`)
- Adresses récentes (`@recent_addresses`)
- Cache des entrées de travail

### **Exemples d'utilisation** :

#### **Sauvegarde du token** (`lib/api.ts`, ligne 57-58)
```typescript
await storage.setItem('token', res.token);
await storage.setItem('user', JSON.stringify(res.user));
```

#### **Sauvegarde des clients** (`lib/clients.ts`, ligne 85-90)
```typescript
export async function addClient(data: Omit<Client, 'id'>): Promise<Client> {
  const clients = await getClients();
  const newClient = { ...data, id: generateId() };
  clients.push(newClient);
  await storage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  return newClient;
}
```

---

## 📂 5. SYSTÈME DE FICHIERS

### **Fonctionnalité**
Génération et partage de fichiers PDF et Excel (factures).

### **Fichier** : `app/(tabs)/invoices.tsx`

### **Code utilisé** :

#### **Génération de PDF**
```typescript
// Ligne 180-220
const generatePDF = async () => {
  try {
    if (!data) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1F2937; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #1F2937; color: white; }
            .total { font-size: 1.2em; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Facture</h1>
          <p>Période: du ${data.from || 'N/A'} au ${data.to || 'N/A'}</p>
          <table>
            <tr>
              <th>Date</th>
              <th>Heures</th>
              <th>Taux (€/h)</th>
              <th>Montant (€)</th>
            </tr>
            ${data.lines.map(line => `
              <tr>
                <td>${line.date}</td>
                <td>${line.hours.toFixed(2)}</td>
                <td>${line.rate.toFixed(2)}</td>
                <td>${line.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
          <div class="total">Total: ${data.totalAmount.toFixed(2)} €</div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    // Partager le PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Partager la facture',
        UTI: 'com.adobe.pdf',
      });
    }

    Alert.alert('✅ Succès', 'Facture PDF générée !');
  } catch (error) {
    console.error('Erreur PDF:', error);
    Alert.alert('Erreur', 'Impossible de générer le PDF');
  }
};
```

#### **Génération d'Excel (CSV)**
```typescript
// Ligne 240-270
const exportToExcel = async () => {
  try {
    if (!filteredData.entries.length) {
      Alert.alert('Erreur', 'Aucune donnée à exporter');
      return;
    }

    const csvContent = [
      // En-têtes
      'Date,Début,Fin,Heures,Catégorie,Taux (€/h),Montant (€)',
      // Données
      ...filteredData.entries.map(entry => {
        const hours = calculateHours(entry);
        const rate = entry.hourlyRate || 0;
        const amount = hours * rate;
        return `${entry.startDate},${entry.startTime},${entry.endTime},${hours.toFixed(2)},${entry.category || 'N/A'},${rate.toFixed(2)},${amount.toFixed(2)}`;
      })
    ].join('\n');

    const fileUri = FileSystem.documentDirectory + `heures_${Date.now()}.csv`;
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Partager le fichier Excel',
      });
    }

    Alert.alert('✅ Succès', 'Fichier Excel généré !');
  } catch (error) {
    console.error('Erreur Excel:', error);
    Alert.alert('Erreur', 'Impossible d\'exporter vers Excel');
  }
};
```

### **Explication**
- **`Print.printToFileAsync()`** : Convertit du HTML en PDF natif
- **`FileSystem.writeAsStringAsync()`** : Écrit un fichier sur le système de fichiers du téléphone
- **`Sharing.shareAsync()`** : Ouvre le menu de partage natif (email, WhatsApp, etc.)
- **`FileSystem.documentDirectory`** : Dossier de documents de l'application

### **Packages utilisés** :
- `expo-print` - Génération PDF
- `expo-file-system` - Manipulation de fichiers
- `expo-sharing` - Partage de fichiers

---

## 🌐 6. GÉOCODAGE (API EXTERNE)

### **Fonctionnalité**
Conversion automatique d'une adresse en coordonnées GPS (et vice-versa).

### **Fichier** : `components/address-autocomplete.tsx`

### **Code utilisé** :

```typescript
// Ligne 50-75
const searchAddresses = async (query: string) => {
  if (!query.trim() || query.length < 3) {
    setSuggestions([]);
    return;
  }

  setIsLoading(true);
  try {
    const encodedQuery = encodeURIComponent(query.trim() + ', France');
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5&countrycodes=fr&addressdetails=1`
    );
    
    const data = await response.json();
    setSuggestions(data || []);
    setShowSuggestions(data && data.length > 0);
  } catch (error) {
    console.error('Erreur de recherche d\'adresses:', error);
    setSuggestions([]);
  } finally {
    setIsLoading(false);
  }
};
```

### **Explication**
- **`fetch()`** : Appel HTTP natif vers l'API Nominatim (OpenStreetMap)
- **Géocodage** : Convertit "12 Rue de la Paix, Paris" → coordonnées GPS
- **Autocomplétion** : Suggère des adresses pendant la frappe
- **API gratuite** : Pas de clé API requise

### **API utilisée** : Nominatim (OpenStreetMap)

---

## 📱 7. CLAVIER ET INTERFACE NATIVE

### **Fonctionnalité**
Gestion intelligente du clavier pour éviter qu'il cache les champs de saisie.

### **Fichiers** : 
- `app/(tabs)/hours.tsx`
- `app/(tabs)/employers.tsx`
- `components/work-entry-form-simple.tsx`

### **Code utilisé** :

```typescript
// Exemple dans work-entry-form-simple.tsx, ligne 108-115
<KeyboardAvoidingView 
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
  keyboardVerticalOffset={100}
>
  <ScrollView 
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={true}
  >
    {/* Contenu du formulaire */}
  </ScrollView>
</KeyboardAvoidingView>
```

### **Explication**
- **`KeyboardAvoidingView`** : Composant natif qui ajuste automatiquement la vue quand le clavier apparaît
- **`behavior`** : Comportement différent selon la plateforme (iOS vs Android)
- **`keyboardShouldPersistTaps="handled"`** : Permet de toucher les éléments même quand le clavier est ouvert
- **`Platform.OS`** : Détecte le système d'exploitation (iOS ou Android)

### **Composant natif** : `KeyboardAvoidingView` (React Native)

---

## 📊 RÉSUMÉ DES FONCTIONNALITÉS NATIVES

| # | Fonctionnalité | Package | Fichier principal |
|---|---------------|---------|-------------------|
| 1 | 📸 Appareil photo / Caméra | `expo-image-picker` | `app/(tabs)/profile.tsx` |
| 2 | 📍 GPS / Géolocalisation | `expo-location` | `app/(tabs)/hours.tsx` |
| 3 | 🔔 Notifications push | `expo-notifications` | `app/(tabs)/hours.tsx` |
| 4 | 💾 Stockage local | `@react-native-async-storage/async-storage` | `lib/storage.ts` |
| 5 | 📂 Système de fichiers (PDF/Excel) | `expo-print`, `expo-file-system`, `expo-sharing` | `app/(tabs)/invoices.tsx` |
| 6 | 🌐 Géocodage (API) | `fetch` natif | `components/address-autocomplete.tsx` |
| 7 | ⌨️ Clavier natif | `KeyboardAvoidingView` | Plusieurs fichiers |

---

## 🔐 PERMISSIONS REQUISES

L'application demande les permissions suivantes :

### **Android** (`app.json`)
```json
{
  "permissions": [
    "CAMERA",
    "READ_EXTERNAL_STORAGE",
    "WRITE_EXTERNAL_STORAGE",
    "ACCESS_FINE_LOCATION",
    "ACCESS_COARSE_LOCATION",
    "NOTIFICATIONS"
  ]
}
```

### **iOS** (`app.json`)
```json
{
  "infoPlist": {
    "NSCameraUsageDescription": "Cette app a besoin d'accéder à la caméra pour prendre des photos de profil",
    "NSPhotoLibraryUsageDescription": "Cette app a besoin d'accéder à vos photos pour choisir une photo de profil",
    "NSLocationWhenInUseUsageDescription": "Cette app a besoin de votre localisation pour enregistrer où vous avez travaillé"
  }
}
```

---

## ✅ AVANTAGES DES FONCTIONNALITÉS NATIVES

1. **Expérience utilisateur** : Interface fluide et native
2. **Performance** : Accès direct au matériel
3. **Hors ligne** : Stockage local fonctionnel sans internet
4. **Intégration système** : Partage de fichiers, notifications
5. **Sécurité** : Gestion des permissions par le système

---

## 🚀 PACKAGES NPM UTILISÉS

```json
{
  "expo-image-picker": "~15.0.7",
  "expo-location": "~17.0.1",
  "expo-notifications": "~0.28.16",
  "@react-native-async-storage/async-storage": "1.23.1",
  "expo-print": "~13.0.1",
  "expo-file-system": "~17.0.1",
  "expo-sharing": "~12.0.1"
}
```

---

**📱 Votre application utilise pleinement les capacités natives du téléphone pour offrir une expérience complète et professionnelle !**


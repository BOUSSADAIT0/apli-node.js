import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { deleteUser, getCurrentUser, logout, setCurrentUser, updateUser } from '@/lib/api';
import { storage } from '@/lib/storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [siret, setSiret] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Nouvelles données professionnelles pour la facturation
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [iban, setIban] = useState('');

  const loadProfile = async () => {
    const u = getCurrentUser();
    if (u) {
      setFirstName(u.firstName || '');
      setLastName(u.lastName || '');
      setEmail(u.email || '');
      setPhone(u.phone || '');
      setAvatarUrl(u.avatarUrl || null);
    }
    // Load professional data from storage
    try {
      const storedSiret = await storage.getItem('@siret');
      const storedCompanyName = await storage.getItem('@companyName');
      const storedCompanyAddress = await storage.getItem('@companyAddress');
      const storedCompanyCity = await storage.getItem('@companyCity');
      const storedIban = await storage.getItem('@iban');

      if (storedSiret) setSiret(storedSiret);
      if (storedCompanyName) setCompanyName(storedCompanyName);
      if (storedCompanyAddress) setCompanyAddress(storedCompanyAddress);
      if (storedCompanyCity) setCompanyCity(storedCompanyCity);
      if (storedIban) setIban(storedIban);
    } catch {}
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleTakePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à la caméra.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
      cameraType: ImagePicker.CameraType.front, // Caméra frontale pour selfie
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const newUri = res.assets[0].uri;
      setAvatarUrl(newUri);
      // Sauvegarder automatiquement la photo
      await saveAvatarUrl(newUri);
    }
  };

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à vos photos.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const newUri = res.assets[0].uri;
      setAvatarUrl(newUri);
      // Sauvegarder automatiquement la photo
      await saveAvatarUrl(newUri);
    }
  };

  // Fonction pour sauvegarder l'avatar automatiquement
  const saveAvatarUrl = async (uri: string) => {
    try {
      const cur = getCurrentUser();
      if (!cur) return;

      const updated = await updateUser(cur.id, {
        avatarUrl: uri,
      });
      setCurrentUser(updated);

      // Sauvegarder dans le storage
      await storage.setItem('user', JSON.stringify(updated));
      
      console.log('✅ Photo de profil sauvegardée:', uri);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la photo:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la photo');
    }
  };

  const handleChoosePhotoOption = () => {
    if (Platform.OS === 'web') {
      // Sur web, seulement la galerie
      handlePickImage();
    } else {
      // Sur mobile, afficher les options
      Alert.alert(
        'Photo de profil',
        'Choisissez une option',
        [
          {
            text: '📷 Prendre un selfie',
            onPress: handleTakePhoto,
          },
          {
            text: '🖼️ Choisir depuis la galerie',
            onPress: handlePickImage,
          },
          {
            text: 'Annuler',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const cur = getCurrentUser();
      if (!cur) return;

      const updated = await updateUser(cur.id, {
        firstName,
        lastName,
        email,
        phone,
        avatarUrl: avatarUrl || null,
      });
      setCurrentUser(updated);

      // Save to storage
      await storage.setItem('user', JSON.stringify(updated));

      // Save professional data
      if (siret) await storage.setItem('@siret', siret);
      if (companyName) await storage.setItem('@companyName', companyName);
      if (companyAddress) await storage.setItem('@companyAddress', companyAddress);
      if (companyCity) await storage.setItem('@companyCity', companyCity);
      if (iban) await storage.setItem('@iban', iban);

      Alert.alert(
        'Succès',
        'Profil enregistré avec succès ! Vos informations seront utilisées automatiquement dans vos factures.'
      );
    } catch (e) {
      Alert.alert('Erreur', String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const cur = getCurrentUser();
    if (!cur) return;

    if (Platform.OS === 'web') {
      const ok = confirm('Supprimer définitivement votre compte ?');
      if (!ok) return;
    } else {
      Alert.alert(
        'Supprimer le compte',
        'Êtes-vous sûr de vouloir supprimer définitivement votre compte ? Cette action est irréversible.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteUser(cur.id);
                await logout();
                router.replace('/auth/login');
              } catch (e) {
                Alert.alert('Erreur', String(e));
              }
            },
          },
        ]
      );
      return;
    }

    try {
      await deleteUser(cur.id);
      await logout();
      router.replace('/auth/login');
    } catch (e) {
      Alert.alert('Erreur', String(e));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>👤 Mon Profil</Text>
        <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
          Gérez vos informations personnelles et professionnelles
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Avatar Section */}
        <View style={[styles.avatarSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarPlaceholderText}>
                  {firstName[0]?.toUpperCase() || '?'}
                  {lastName[0]?.toUpperCase() || ''}
                </Text>
              </View>
            )}
            <Pressable
              style={[styles.avatarBadge, { backgroundColor: theme.primary }]}
              onPress={handleChoosePhotoOption}
            >
              <Text style={styles.avatarBadgeText}>📷</Text>
            </Pressable>
          </View>
          <Pressable style={[styles.changePhotoBtn, { borderColor: theme.primary }]} onPress={handleChoosePhotoOption}>
            <Text style={[styles.changePhotoBtnText, { color: theme.primary }]}>Changer la photo</Text>
          </Pressable>
        </View>

        {/* Personal Information */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionIcon]}>📋</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Informations personnelles</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.muted }]}>Prénom</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Votre prénom"
              placeholderTextColor={theme.muted}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.muted }]}>Nom</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Votre nom"
              placeholderTextColor={theme.muted}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.muted }]}>Email</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="votre@email.com"
              placeholderTextColor={theme.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.muted }]}>Téléphone (optionnel)</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="+33 6 12 34 56 78"
              placeholderTextColor={theme.muted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Auto-entrepreneur Status */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionIcon]}>🏢</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Statut auto-entrepreneur</Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Text style={[styles.infoBoxText, { color: theme.muted }]}>
              💡 En tant qu'auto-entrepreneur, vous avez un numéro SIRET unique. Vous pouvez exercer plusieurs
              activités sous ce même statut.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.muted }]}>N° SIRET</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="14 chiffres"
              placeholderTextColor={theme.muted}
              value={siret}
              onChangeText={setSiret}
              keyboardType="numeric"
              maxLength={14}
            />
          </View>
        </View>

        {/* Professional Information */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionIcon]}>💼</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Informations professionnelles</Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Text style={[styles.infoBoxText, { color: theme.muted }]}>
              ✨ Ces informations seront automatiquement utilisées lors de la génération de vos factures.
              Remplissez-les une seule fois !
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.muted }]}>Nom de votre entreprise</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Ex: Dev Solutions"
              placeholderTextColor={theme.muted}
              value={companyName}
              onChangeText={setCompanyName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.muted }]}>Adresse complète</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Ex: 10 Rue de la République"
              placeholderTextColor={theme.muted}
              value={companyAddress}
              onChangeText={setCompanyAddress}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.muted }]}>Code postal et ville</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Ex: 75001 Paris"
              placeholderTextColor={theme.muted}
              value={companyCity}
              onChangeText={setCompanyCity}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.muted }]}>IBAN</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              placeholderTextColor={theme.muted}
              value={iban}
              onChangeText={setIban}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? '⏳ Enregistrement...' : '💾 Enregistrer'}</Text>
          </Pressable>

          <Pressable style={[styles.deleteBtn, { backgroundColor: theme.danger }]} onPress={handleDeleteAccount}>
            <Text style={styles.deleteBtnText}>🗑️ Supprimer mon compte</Text>
          </Pressable>

          <Pressable
            style={[styles.logoutBtn, { borderColor: theme.border }]}
            onPress={async () => {
              await logout();
              router.replace('/auth/login');
            }}
          >
            <Text style={[styles.logoutBtnText, { color: theme.muted }]}>🚪 Déconnexion</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  avatarSection: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarBadgeText: {
    fontSize: 16,
  },
  changePhotoBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  changePhotoBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoBoxText: {
    fontSize: 13,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 48,
  },
  actionButtons: {
    marginHorizontal: 16,
    gap: 12,
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  logoutBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});



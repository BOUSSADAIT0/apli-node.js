import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addCategory, getCategories, removeCategory } from '@/lib/categories';
import {
    cancelAllNotifications,
    getNotificationSettings,
    registerForPushNotifications,
    scheduleDailyReminder,
    scheduleWeeklySummary,
} from '@/lib/notifications';
import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
} from 'react-native';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [categories, setCategories] = useState<string[]>([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const [notifGranted, setNotifGranted] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [dailyReminder, setDailyReminder] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCategories();
    loadNotifSettings();
  }, []);

  async function loadCategories() {
    const cats = await getCategories();
    setCategories(cats);
  }

  async function loadNotifSettings() {
    const settings = await getNotificationSettings();
    setNotifGranted(settings.granted);
    setNotifCount(settings.scheduledCount);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadCategories();
    await loadNotifSettings();
    setRefreshing(false);
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de catégorie');
      return;
    }
    await addCategory(newCategory.trim());
    await loadCategories();
    setNewCategory('');
    setShowCatModal(false);
    Alert.alert('Succès', 'Catégorie ajoutée avec succès !');
  }

  async function handleRemoveCategory(cat: string) {
    Alert.alert('Supprimer', `Supprimer la catégorie "${cat}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeCategory(cat);
            await loadCategories();
          } catch (e) {
            Alert.alert('Erreur', String(e));
          }
        },
      },
    ]);
  }

  async function handleEnableNotifications() {
    const token = await registerForPushNotifications();
    if (token) {
      await loadNotifSettings();
    }
  }

  async function toggleDailyReminder(value: boolean) {
    setDailyReminder(value);
    if (value) {
      await scheduleDailyReminder();
    } else {
      await cancelAllNotifications();
    }
    await loadNotifSettings();
  }

  async function toggleWeeklySummary(value: boolean) {
    setWeeklySummary(value);
    if (value) {
      await scheduleWeeklySummary();
    }
    await loadNotifSettings();
  }

  const customCategories = categories.filter(
    (c) =>
      ![
        'Standard',
        'Heures supplémentaires',
        'Travail de nuit',
        'Weekend',
        'Jours fériés',
        'Télétravail',
        'Déplacement',
        'Formation',
        'Réunion',
        'Support',
      ].includes(c)
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>⚙️ Paramètres</Text>
        <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
          Personnalisez votre expérience
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Categories Section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionIcon}>🏷️</Text>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Catégories personnalisées</Text>
              </View>
              <Text style={[styles.sectionDesc, { color: theme.muted }]}>
                Ajoutez vos propres catégories de travail
              </Text>
            </View>
            <Pressable
              style={[styles.addBtn, { backgroundColor: theme.primary }]}
              onPress={() => setShowCatModal(true)}
            >
              <Text style={styles.addBtnText}>+ Ajouter</Text>
            </Pressable>
          </View>

          {customCategories.length > 0 ? (
            <View style={styles.categoriesList}>
              {customCategories.map((cat) => (
                <View key={cat} style={[styles.catRow, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.catText, { color: theme.text }]}>🏷️ {cat}</Text>
                  <Pressable style={styles.deleteBtn} onPress={() => handleRemoveCategory(cat)}>
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.emptyText, { color: theme.muted }]}>Aucune catégorie personnalisée</Text>
            </View>
          )}
        </View>

        {/* Notifications Section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>🔔</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Notifications</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: theme.muted }]}>
            Recevez des rappels et résumés automatiques
          </Text>

          {!notifGranted ? (
            <Pressable
              style={[styles.enableBtn, { backgroundColor: theme.primary }]}
              onPress={handleEnableNotifications}
            >
              <Text style={styles.enableBtnText}>🔔 Activer les notifications</Text>
            </Pressable>
          ) : (
            <>
              <View style={[styles.successBox, { backgroundColor: theme.success + '20', borderColor: theme.success }]}>
                <Text style={[styles.successText, { color: theme.success }]}>
                  ✓ Notifications autorisées ({notifCount} programmées)
                </Text>
              </View>

              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>📅 Rappel quotidien</Text>
                  <Text style={[styles.settingDesc, { color: theme.muted }]}>18h00 - Enregistrer vos heures</Text>
                </View>
                <Switch value={dailyReminder} onValueChange={toggleDailyReminder} />
              </View>

              <View style={styles.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>📊 Résumé hebdomadaire</Text>
                  <Text style={[styles.settingDesc, { color: theme.muted }]}>Dimanche 20h - Statistiques</Text>
                </View>
                <Switch value={weeklySummary} onValueChange={toggleWeeklySummary} />
              </View>
            </>
          )}
        </View>

        {/* Info Section */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionIcon}>ℹ️</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>À propos</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>Version</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.muted }]}>Développeur</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>AIT DJOUDI OUFELLA Boussad</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Category Modal */}
      <Modal visible={showCatModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCatModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>➕ Nouvelle catégorie</Text>
              <Pressable onPress={() => setShowCatModal(false)}>
                <Text style={[styles.closeBtn, { color: theme.muted }]}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>Nom de la catégorie</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Ex: Consulting, Formation..."
                placeholderTextColor={theme.muted}
                value={newCategory}
                onChangeText={setNewCategory}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.cancelBtn, { borderColor: theme.border }]}
                onPress={() => setShowCatModal(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.muted }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleAddCategory}>
                <Text style={styles.saveBtnText}>💾 Ajouter</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionDesc: {
    fontSize: 13,
    marginTop: 4,
  },
  addBtn: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  categoriesList: {
    marginTop: 8,
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  catText: {
    fontSize: 15,
    flex: 1,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyBox: {
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
  enableBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  enableBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  successBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 13,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    fontSize: 24,
    fontWeight: '300',
    padding: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 48,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});



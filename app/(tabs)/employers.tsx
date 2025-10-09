import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ACTIVITY_COLORS, addActivity, addClient, CLIENT_COLORS, deleteActivity, deleteClient, getActivities, getClients, updateActivity, updateClient, type Activity, type Client } from '@/lib/clients';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function ClientsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const [activeTab, setActiveTab] = useState<'clients' | 'activities'>('clients');
  
  // Clients
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientPostalCode, setClientPostalCode] = useState('');
  const [clientSiret, setClientSiret] = useState('');
  const [clientColor, setClientColor] = useState(CLIENT_COLORS[0]);
  
  // Activités
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityName, setActivityName] = useState('');
  const [activityRate, setActivityRate] = useState('');
  const [activityColor, setActivityColor] = useState(ACTIVITY_COLORS[0]);
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [clientsData, activitiesData] = await Promise.all([
      getClients(),
      getActivities(),
    ]);
    setClients(clientsData);
    setActivities(activitiesData);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // === CLIENTS ===
  
  function openAddClient() {
    setEditingClientId(null);
    setClientName('');
    setClientAddress('');
    setClientCity('');
    setClientPostalCode('');
    setClientSiret('');
    setClientColor(CLIENT_COLORS[0]);
    setShowClientModal(true);
  }

  function openEditClient(client: Client) {
    setEditingClientId(client.id);
    setClientName(client.name);
    setClientAddress(client.address || '');
    setClientCity(client.city || '');
    setClientPostalCode(client.postalCode || '');
    setClientSiret(client.siret || '');
    setClientColor(client.color);
    setShowClientModal(true);
  }

  async function handleSaveClient() {
    if (!clientName.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }

    try {
      if (editingClientId) {
        await updateClient(editingClientId, {
          name: clientName.trim(),
          address: clientAddress.trim() || undefined,
          city: clientCity.trim() || undefined,
          postalCode: clientPostalCode.trim() || undefined,
          siret: clientSiret.trim() || undefined,
          color: clientColor,
        });
        Alert.alert('✅ Succès', 'Client modifié');
      } else {
        await addClient({
          name: clientName.trim(),
          address: clientAddress.trim() || undefined,
          city: clientCity.trim() || undefined,
          postalCode: clientPostalCode.trim() || undefined,
          siret: clientSiret.trim() || undefined,
          color: clientColor,
        });
        Alert.alert('✅ Succès', 'Client ajouté');
      }
      setShowClientModal(false);
      await loadData();
    } catch (error) {
      Alert.alert('Erreur', String(error));
    }
  }

  async function handleDeleteClient(id: string) {
    Alert.alert(
      'Confirmation',
      'Supprimer ce client ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteClient(id);
            await loadData();
            Alert.alert('✅ Succès', 'Client supprimé');
          },
        },
      ]
    );
  }

  // === ACTIVITÉS ===
  
  function openAddActivity() {
    setEditingActivityId(null);
    setActivityName('');
    setActivityRate('');
    setActivityColor(ACTIVITY_COLORS[0]);
    setShowActivityModal(true);
  }

  function openEditActivity(activity: Activity) {
    setEditingActivityId(activity.id);
    setActivityName(activity.name);
    setActivityRate(String(activity.defaultRate || ''));
    setActivityColor(activity.color);
    setShowActivityModal(true);
  }

  async function handleSaveActivity() {
    if (!activityName.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }

    try {
      if (editingActivityId) {
        await updateActivity(editingActivityId, {
          name: activityName.trim(),
          defaultRate: Number(activityRate) || undefined,
          color: activityColor,
        });
        Alert.alert('✅ Succès', 'Activité modifiée');
      } else {
        await addActivity({
          name: activityName.trim(),
          defaultRate: Number(activityRate) || undefined,
          color: activityColor,
        });
        Alert.alert('✅ Succès', 'Activité ajoutée');
      }
      setShowActivityModal(false);
      await loadData();
    } catch (error) {
      Alert.alert('Erreur', String(error));
    }
  }

  async function handleDeleteActivity(id: string) {
    Alert.alert(
      'Confirmation',
      'Supprimer cette activité ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteActivity(id);
            await loadData();
            Alert.alert('✅ Succès', 'Activité supprimée');
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>👥 Clients & Activités</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Gérez vos clients et activités
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={styles.statIcon}>👤</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{clients.length}</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Clients</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={styles.statIcon}>📋</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{activities.length}</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Activités</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[
              styles.tab,
              { backgroundColor: theme.card },
              activeTab === 'clients' && [styles.tabActive, { backgroundColor: theme.primary }],
            ]}
            onPress={() => setActiveTab('clients')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'clients' ? '#fff' : theme.muted }]}>
              👤 Clients
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tab,
              { backgroundColor: theme.card },
              activeTab === 'activities' && [styles.tabActive, { backgroundColor: theme.primary }],
            ]}
            onPress={() => setActiveTab('activities')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'activities' ? '#fff' : theme.muted }]}>
              📋 Activités
            </Text>
          </Pressable>
        </View>

        {/* Bouton Ajouter */}
        <View style={styles.addButtonContainer}>
          <Pressable
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={activeTab === 'clients' ? openAddClient : openAddActivity}
          >
            <Text style={styles.addButtonText}>
              + Ajouter {activeTab === 'clients' ? 'un client' : 'une activité'}
            </Text>
          </Pressable>
        </View>

        {/* Liste CLIENTS */}
        {activeTab === 'clients' && (
          <View style={styles.list}>
            {clients.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                <Text style={styles.emptyIcon}>👤</Text>
                <Text style={[styles.emptyText, { color: theme.text }]}>Aucun client</Text>
                <Text style={[styles.emptyHint, { color: theme.muted }]}>
                  Ajoutez votre premier client
                </Text>
              </View>
            ) : (
              clients.map((client) => (
                <View key={client.id} style={[styles.card, { backgroundColor: theme.card }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                      <View style={[styles.colorDot, { backgroundColor: client.color }]} />
                      <Text style={[styles.cardTitle, { color: theme.text }]}>{client.name}</Text>
                    </View>
                    <View style={styles.cardActions}>
                      <Pressable onPress={() => openEditClient(client)} style={styles.actionBtn}>
                        <Text style={[styles.actionText, { color: theme.primary }]}>✏️</Text>
                      </Pressable>
                      <Pressable onPress={() => handleDeleteClient(client.id)} style={styles.actionBtn}>
                        <Text style={[styles.actionText, { color: theme.danger }]}>🗑️</Text>
                      </Pressable>
                    </View>
                  </View>
                  {client.address && (
                    <Text style={[styles.cardDetail, { color: theme.muted }]}>
                      📍 {client.address}
                    </Text>
                  )}
                  {client.city && (
                    <Text style={[styles.cardDetail, { color: theme.muted }]}>
                      🏙️ {client.city} {client.postalCode}
                    </Text>
                  )}
                  {client.siret && (
                    <Text style={[styles.cardDetail, { color: theme.muted }]}>
                      🔢 {client.siret}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* Liste ACTIVITÉS */}
        {activeTab === 'activities' && (
          <View style={styles.list}>
            {activities.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={[styles.emptyText, { color: theme.text }]}>Aucune activité</Text>
                <Text style={[styles.emptyHint, { color: theme.muted }]}>
                  Ajoutez votre première activité
                </Text>
              </View>
            ) : (
              activities.map((activity) => (
                <View key={activity.id} style={[styles.card, { backgroundColor: theme.card }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                      <View style={[styles.colorDot, { backgroundColor: activity.color }]} />
                      <Text style={[styles.cardTitle, { color: theme.text }]}>{activity.name}</Text>
                    </View>
                    <View style={styles.cardActions}>
                      <Pressable onPress={() => openEditActivity(activity)} style={styles.actionBtn}>
                        <Text style={[styles.actionText, { color: theme.primary }]}>✏️</Text>
                      </Pressable>
                      <Pressable onPress={() => handleDeleteActivity(activity.id)} style={styles.actionBtn}>
                        <Text style={[styles.actionText, { color: theme.danger }]}>🗑️</Text>
                      </Pressable>
                    </View>
                  </View>
                  {activity.defaultRate && (
                    <Text style={[styles.cardDetail, { color: theme.success }]}>
                      💰 {activity.defaultRate}€/h
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal CLIENT */}
      <Modal visible={showClientModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboard}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {editingClientId ? '✏️ Modifier Client' : '➕ Nouveau Client'}
                </Text>
                <Pressable onPress={() => setShowClientModal(false)}>
                  <Text style={[styles.closeBtn, { color: theme.muted }]}>✕</Text>
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled">
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: theme.muted }]}>Nom *</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
                    placeholder="Ex: Restaurant Le Gourmet"
                    placeholderTextColor={theme.muted}
                    value={clientName}
                    onChangeText={setClientName}
                  />
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: theme.muted }]}>Adresse</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
                    placeholder="Ex: 12 Rue de la Paix"
                    placeholderTextColor={theme.muted}
                    value={clientAddress}
                    onChangeText={setClientAddress}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.modalSection, { flex: 2 }]}>
                    <Text style={[styles.modalLabel, { color: theme.muted }]}>Ville</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
                      placeholder="Paris"
                      placeholderTextColor={theme.muted}
                      value={clientCity}
                      onChangeText={setClientCity}
                    />
                  </View>
                  <View style={[styles.modalSection, { flex: 1 }]}>
                    <Text style={[styles.modalLabel, { color: theme.muted }]}>Code postal</Text>
                    <TextInput
                      style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
                      placeholder="75001"
                      placeholderTextColor={theme.muted}
                      value={clientPostalCode}
                      onChangeText={setClientPostalCode}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: theme.muted }]}>SIRET</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
                    placeholder="123 456 789 00012"
                    placeholderTextColor={theme.muted}
                    value={clientSiret}
                    onChangeText={setClientSiret}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: theme.muted }]}>Couleur</Text>
                  <View style={styles.colorPicker}>
                    {CLIENT_COLORS.map((c) => (
                      <Pressable
                        key={c}
                        style={[
                          styles.colorOption,
                          { backgroundColor: c },
                          clientColor === c && styles.colorOptionSelected,
                        ]}
                        onPress={() => setClientColor(c)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <Pressable
                    style={[styles.cancelBtn, { borderColor: theme.muted }]}
                    onPress={() => setShowClientModal(false)}
                  >
                    <Text style={[styles.cancelBtnText, { color: theme.muted }]}>Annuler</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                    onPress={handleSaveClient}
                  >
                    <Text style={styles.saveBtnText}>💾 Enregistrer</Text>
                  </Pressable>
                </View>

                <View style={{ height: 50 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal ACTIVITÉ */}
      <Modal visible={showActivityModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboard}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {editingActivityId ? '✏️ Modifier Activité' : '➕ Nouvelle Activité'}
                </Text>
                <Pressable onPress={() => setShowActivityModal(false)}>
                  <Text style={[styles.closeBtn, { color: theme.muted }]}>✕</Text>
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled">
                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: theme.muted }]}>Nom *</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
                    placeholder="Ex: Service, Plonge, Cuisine"
                    placeholderTextColor={theme.muted}
                    value={activityName}
                    onChangeText={setActivityName}
                  />
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: theme.muted }]}>Taux horaire (€/h)</Text>
                  <TextInput
                    style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text }]}
                    placeholder="45"
                    placeholderTextColor={theme.muted}
                    value={activityRate}
                    onChangeText={setActivityRate}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.modalSection}>
                  <Text style={[styles.modalLabel, { color: theme.muted }]}>Couleur</Text>
                  <View style={styles.colorPicker}>
                    {ACTIVITY_COLORS.map((c) => (
                      <Pressable
                        key={c}
                        style={[
                          styles.colorOption,
                          { backgroundColor: c },
                          activityColor === c && styles.colorOptionSelected,
                        ]}
                        onPress={() => setActivityColor(c)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <Pressable
                    style={[styles.cancelBtn, { borderColor: theme.muted }]}
                    onPress={() => setShowActivityModal(false)}
                  >
                    <Text style={[styles.cancelBtnText, { color: theme.muted }]}>Annuler</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                    onPress={handleSaveActivity}
                  >
                    <Text style={styles.saveBtnText}>💾 Enregistrer</Text>
                  </Pressable>
                </View>

                <View style={{ height: 50 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 16 },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  statIcon: { fontSize: 32, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 14 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  tab: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  tabActive: {},
  tabText: { fontSize: 16, fontWeight: '600' },
  addButtonContainer: { paddingHorizontal: 20, marginBottom: 16 },
  addButton: { padding: 16, borderRadius: 12, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { padding: 16, borderRadius: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  colorDot: { width: 16, height: 16, borderRadius: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  actionText: { fontSize: 20 },
  cardDetail: { fontSize: 14, marginTop: 4 },
  emptyState: { padding: 40, borderRadius: 12, alignItems: 'center' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyHint: { fontSize: 14 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalKeyboard: { width: '100%', maxWidth: 400 },
  modalContent: { borderRadius: 16, padding: 20, backgroundColor: '#fff', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  closeBtn: { fontSize: 24, fontWeight: '600' },
  modalSection: { marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  modalInput: { padding: 12, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  row: { flexDirection: 'row', gap: 12 },
  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorOption: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#E5E7EB' },
  colorOptionSelected: { borderWidth: 4, borderColor: '#fff', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600' },
  saveBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});

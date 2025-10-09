import { ACTIVITY_COLORS, addActivity, addClient, blendColors, CLIENT_COLORS, getActivities, getClients, type Activity, type Client } from '@/lib/clients';
import { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
} from 'react-native';

type WorkEntryPayload = {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  hasBreak: boolean;
  breakStartHour?: string;
  breakStartMin?: string;
  breakEndHour?: string;
  breakEndMin?: string;
  category?: string;
  clientId?: string;
  clientName?: string;
  activityId?: string;
  activityName?: string;
  hourlyRate?: number;
};

type Props = {
  onSubmit: (data: WorkEntryPayload) => Promise<void> | void;
  submitting?: boolean;
  initialValues?: Partial<WorkEntryPayload>;
  submitLabel?: string;
};

export default function WorkEntryFormFinal({ onSubmit, submitting, initialValues, submitLabel }: Props) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');

  const [startDate, setStartDate] = useState(initialValues?.startDate ?? `${yyyy}-${mm}-${dd}`);
  const [startTime, setStartTime] = useState(initialValues?.startTime ?? '09:00');
  const [endDate, setEndDate] = useState(initialValues?.endDate ?? `${yyyy}-${mm}-${dd}`);
  const [endTime, setEndTime] = useState(initialValues?.endTime ?? '17:00');
  const [hasBreak, setHasBreak] = useState(initialValues?.hasBreak ?? true);
  const [breakStartHour, setBreakStartHour] = useState(initialValues?.breakStartHour ?? '12');
  const [breakStartMin, setBreakStartMin] = useState(initialValues?.breakStartMin ?? '00');
  const [breakEndHour, setBreakEndHour] = useState(initialValues?.breakEndHour ?? '13');
  const [breakEndMin, setBreakEndMin] = useState(initialValues?.breakEndMin ?? '00');
  const [hourlyRate, setHourlyRate] = useState(String(initialValues?.hourlyRate ?? 45));
  
  const [clients, setClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

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
    
    if (initialValues?.clientId) {
      const client = clientsData.find(c => c.id === initialValues.clientId);
      if (client) setSelectedClient(client);
    }
    
    if (initialValues?.activityId) {
      const activity = activitiesData.find(a => a.id === initialValues.activityId);
      if (activity) {
        setSelectedActivity(activity);
        if (activity.defaultRate) {
          setHourlyRate(String(activity.defaultRate));
        }
      }
    }
  }

  function handleClientSelect(client: Client) {
    setSelectedClient(client);
  }

  function handleActivitySelect(activity: Activity) {
    setSelectedActivity(activity);
    if (activity.defaultRate) {
      setHourlyRate(String(activity.defaultRate));
    }
  }

  async function handleAddClient() {
    if (!newClientName.trim()) {
      Alert.alert('Erreur', 'Le nom du client est requis');
      return;
    }

    try {
      setAdding(true);
      const newClient = await addClient({
        name: newClientName.trim(),
        address: newClientAddress.trim() || undefined,
        city: newClientCity.trim() || undefined,
        postalCode: newClientPostalCode.trim() || undefined,
        siret: newClientSiret.trim() || undefined,
        color: newClientColor,
      });

      await loadData();
      setSelectedClient(newClient);
      setShowAddClientModal(false);
      resetClientForm();
      
      Alert.alert('✅ Succès', 'Client ajouté !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter le client');
    } finally {
      setAdding(false);
    }
  }

  async function handleAddActivity() {
    if (!newActivityName.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'activité est requis');
      return;
    }

    try {
      setAdding(true);
      const newActivity = await addActivity({
        name: newActivityName.trim(),
        defaultRate: Number(newActivityRate) || undefined,
        color: newActivityColor,
      });

      await loadData();
      setSelectedActivity(newActivity);
      if (newActivity.defaultRate) {
        setHourlyRate(String(newActivity.defaultRate));
      }
      setShowAddActivityModal(false);
      resetActivityForm();
      
      Alert.alert('✅ Succès', 'Activité ajoutée !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'activité');
    } finally {
      setAdding(false);
    }
  }

  function resetClientForm() {
    setNewClientName('');
    setNewClientAddress('');
    setNewClientCity('');
    setNewClientPostalCode('');
    setNewClientSiret('');
    setNewClientColor(CLIENT_COLORS[0]);
  }

  function resetActivityForm() {
    setNewActivityName('');
    setNewActivityRate('45');
    setNewActivityColor(ACTIVITY_COLORS[0]);
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={100}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{initialValues ? '✏️ Modifier' : '➕ Nouvelle entrée'}</Text>
          
          {/* Sélection du CLIENT */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Client</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipScrollContent}
            >
              {clients.length === 0 ? (
                <Text style={styles.noDataText}>
                  Aucun client. Cliquez sur "+ Nouveau".
                </Text>
              ) : (
                clients.map((client) => (
                  <Pressable
                    key={client.id}
                    style={[
                      styles.chip,
                      selectedClient?.id === client.id && styles.chipSelected,
                      { 
                        backgroundColor: selectedClient?.id === client.id ? client.color : '#374151',
                        borderColor: client.color,
                      },
                    ]}
                    onPress={() => handleClientSelect(client)}
                  >
                    <Text style={styles.chipText}>{client.name}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>

          {/* Sélection de l'ACTIVITÉ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Activité</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipScrollContent}
            >
              {activities.length === 0 ? (
                <Text style={styles.noDataText}>
                  Aucune activité. Cliquez sur "+ Nouveau".
                </Text>
              ) : (
                activities.map((activity) => (
                  <Pressable
                    key={activity.id}
                    style={[
                      styles.chip,
                      selectedActivity?.id === activity.id && styles.chipSelected,
                      { 
                        backgroundColor: selectedActivity?.id === activity.id ? activity.color : '#374151',
                        borderColor: activity.color,
                      },
                    ]}
                    onPress={() => handleActivitySelect(activity)}
                  >
                    <Text style={styles.chipText}>{activity.name}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>

          {/* Prévisualisation de la couleur mixte */}
          {selectedClient && selectedActivity && (
            <View style={styles.colorPreview}>
              <Text style={styles.colorPreviewLabel}>🎨 Couleur dans le calendrier :</Text>
              <View style={styles.colorPreviewRow}>
                <View style={[styles.colorDot, { backgroundColor: selectedClient.color }]} />
                <Text style={styles.colorPlus}>+</Text>
                <View style={[styles.colorDot, { backgroundColor: selectedActivity.color }]} />
                <Text style={styles.colorEquals}>=</Text>
                <View style={[
                  styles.colorDotLarge, 
                  { backgroundColor: blendColors(selectedClient.color, selectedActivity.color) }
                ]} />
              </View>
            </View>
          )}

          {/* Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Date</Text>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Début</Text>
                <TextInput 
                  style={styles.input} 
                  value={startDate} 
                  onChangeText={setStartDate} 
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#666"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fin</Text>
                <TextInput 
                  style={styles.input} 
                  value={endDate} 
                  onChangeText={setEndDate} 
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#666"
                />
              </View>
            </View>
          </View>

          {/* Heures */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏰ Heures</Text>
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Début</Text>
                <TextInput 
                  style={styles.input} 
                  value={startTime} 
                  onChangeText={setStartTime} 
                  placeholder="HH:mm"
                  placeholderTextColor="#666"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fin</Text>
                <TextInput 
                  style={styles.input} 
                  value={endTime} 
                  onChangeText={setEndTime} 
                  placeholder="HH:mm"
                  placeholderTextColor="#666"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
          </View>

          {/* Pause */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.sectionTitle}>☕ Pause</Text>
              <Switch value={hasBreak} onValueChange={setHasBreak} />
            </View>
            {hasBreak && (
              <View style={styles.breakRow}>
                <TextInput 
                  style={styles.breakInput} 
                  value={breakStartHour} 
                  onChangeText={setBreakStartHour} 
                  placeholder="HH"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.separator}>:</Text>
                <TextInput 
                  style={styles.breakInput} 
                  value={breakStartMin} 
                  onChangeText={setBreakStartMin} 
                  placeholder="mm"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.separator}>-</Text>
                <TextInput 
                  style={styles.breakInput} 
                  value={breakEndHour} 
                  onChangeText={setBreakEndHour} 
                  placeholder="HH"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.separator}>:</Text>
                <TextInput 
                  style={styles.breakInput} 
                  value={breakEndMin} 
                  onChangeText={setBreakEndMin} 
                  placeholder="mm"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            )}
          </View>

          {/* Taux horaire */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Taux horaire</Text>
            <TextInput 
              style={styles.input} 
              value={hourlyRate} 
              onChangeText={setHourlyRate} 
              keyboardType="decimal-pad"
              placeholder="45"
              placeholderTextColor="#666"
            />
            <Text style={styles.hint}>€/heure</Text>
          </View>

          {/* Bouton */}
          <View style={styles.buttonContainer}>
            <Button
              title={submitting ? '⏳ Enregistrement...' : (submitLabel || '✅ Ajouter')}
              onPress={() =>
                onSubmit({
                  startDate,
                  startTime,
                  endDate,
                  endTime,
                  hasBreak,
                  breakStartHour,
                  breakStartMin,
                  breakEndHour,
                  breakEndMin,
                  category: selectedActivity?.name || 'standard',
                  clientId: selectedClient?.id,
                  clientName: selectedClient?.name,
                  activityId: selectedActivity?.id,
                  activityName: selectedActivity?.name,
                  hourlyRate: Number(hourlyRate) || 0,
                })
              }
              disabled={submitting}
              color="#3B82F6"
            />
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Modal CLIENT */}
      <Modal visible={showAddClientModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboard}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>👤 Nouveau Client</Text>
                <Pressable onPress={() => { setShowAddClientModal(false); resetClientForm(); }}>
                  <Text style={styles.closeBtn}>✕</Text>
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled">
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Nom *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ex: Restaurant Le Gourmet"
                    placeholderTextColor="#666"
                    value={newClientName}
                    onChangeText={setNewClientName}
                  />
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Adresse</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ex: 12 Rue de la Paix"
                    placeholderTextColor="#666"
                    value={newClientAddress}
                    onChangeText={setNewClientAddress}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.modalSection, { flex: 2 }]}>
                    <Text style={styles.modalLabel}>Ville</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Paris"
                      placeholderTextColor="#666"
                      value={newClientCity}
                      onChangeText={setNewClientCity}
                    />
                  </View>
                  <View style={[styles.modalSection, { flex: 1 }]}>
                    <Text style={styles.modalLabel}>Code postal</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="75001"
                      placeholderTextColor="#666"
                      value={newClientPostalCode}
                      onChangeText={setNewClientPostalCode}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>SIRET</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="123 456 789 00012"
                    placeholderTextColor="#666"
                    value={newClientSiret}
                    onChangeText={setNewClientSiret}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Couleur</Text>
                  <View style={styles.colorPicker}>
                    {CLIENT_COLORS.map((color) => (
                      <Pressable
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          newClientColor === color && styles.colorOptionSelected,
                        ]}
                        onPress={() => setNewClientColor(color)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <Pressable 
                    style={styles.cancelBtn}
                    onPress={() => { setShowAddClientModal(false); resetClientForm(); }}
                  >
                    <Text style={styles.cancelBtnText}>Annuler</Text>
                  </Pressable>
                  <Pressable 
                    style={styles.saveBtn}
                    onPress={handleAddClient}
                    disabled={adding}
                  >
                    <Text style={styles.saveBtnText}>
                      {adding ? '⏳ Ajout...' : '💾 Ajouter'}
                    </Text>
                  </Pressable>
                </View>

                <View style={{ height: 50 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal ACTIVITÉ */}
      <Modal visible={showAddActivityModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboard}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>📋 Nouvelle Activité</Text>
                <Pressable onPress={() => { setShowAddActivityModal(false); resetActivityForm(); }}>
                  <Text style={styles.closeBtn}>✕</Text>
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled">
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Nom *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Ex: Service, Plonge, Cuisine"
                    placeholderTextColor="#666"
                    value={newActivityName}
                    onChangeText={setNewActivityName}
                  />
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Taux horaire (€/h)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="45"
                    placeholderTextColor="#666"
                    value={newActivityRate}
                    onChangeText={setNewActivityRate}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Couleur</Text>
                  <View style={styles.colorPicker}>
                    {ACTIVITY_COLORS.map((color) => (
                      <Pressable
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          newActivityColor === color && styles.colorOptionSelected,
                        ]}
                        onPress={() => setNewActivityColor(color)}
                      />
                    ))}
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <Pressable 
                    style={styles.cancelBtn}
                    onPress={() => { setShowAddActivityModal(false); resetActivityForm(); }}
                  >
                    <Text style={styles.cancelBtnText}>Annuler</Text>
                  </Pressable>
                  <Pressable 
                    style={styles.saveBtn}
                    onPress={handleAddActivity}
                    disabled={adding}
                  >
                    <Text style={styles.saveBtnText}>
                      {adding ? '⏳ Ajout...' : '💾 Ajouter'}
                    </Text>
                  </Pressable>
                </View>

                <View style={{ height: 50 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  card: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 24, color: '#fff', textAlign: 'center' },
  
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  
  addBtn: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  
  noDataText: { color: '#9CA3AF', fontSize: 14, fontStyle: 'italic' },
  
  chipScroll: { marginTop: 8 },
  chipScrollContent: { paddingRight: 16, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
  },
  chipSelected: { borderColor: '#fff', borderWidth: 3 },
  chipText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  
  colorPreview: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  colorPreviewLabel: { color: '#9CA3AF', fontSize: 14, marginBottom: 12, fontWeight: '600' },
  colorPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  colorDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#fff' },
  colorDotLarge: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: '#fff' },
  colorPlus: { color: '#9CA3AF', fontSize: 20, fontWeight: '700' },
  colorEquals: { color: '#10B981', fontSize: 20, fontWeight: '700' },
  
  row: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1 },
  label: { fontSize: 14, color: '#9CA3AF', marginBottom: 6 },
  input: {
    backgroundColor: '#1F2937',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  breakRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakInput: {
    backgroundColor: '#1F2937',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    textAlign: 'center',
    width: 50,
    borderWidth: 1,
    borderColor: '#374151',
  },
  separator: { color: '#9CA3AF', fontSize: 18, fontWeight: '600' },
  hint: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
  
  buttonContainer: { marginTop: 24 },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboard: { width: '100%', maxWidth: 400 },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  closeBtn: { fontSize: 24, color: '#9CA3AF', fontWeight: '600' },
  
  modalSection: { marginBottom: 16 },
  modalLabel: { fontSize: 14, color: '#9CA3AF', marginBottom: 8, fontWeight: '600' },
  modalInput: {
    backgroundColor: '#374151',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4B5563',
  },
  colorOptionSelected: {
    borderWidth: 4,
    borderColor: '#fff',
  },
  
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#9CA3AF', fontWeight: '600' },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});




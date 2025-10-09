import { blendColors, getActivities, getClients, type Activity, type Client } from '@/lib/clients';
import { useEffect, useState } from 'react';
import {
    Button,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
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

export default function WorkEntryFormSimple({ onSubmit, submitting, initialValues, submitLabel }: Props) {
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
                  Aucun client. Ajoutez des clients dans l'onglet "Clients".
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
                  Aucune activité. Ajoutez des activités dans l'onglet "Clients".
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
              <Pressable
                style={[styles.switch, hasBreak && styles.switchActive]}
                onPress={() => setHasBreak(!hasBreak)}
              >
                <Text style={[styles.switchText, hasBreak && styles.switchTextActive]}>
                  {hasBreak ? 'ON' : 'OFF'}
                </Text>
              </Pressable>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  card: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 24, color: '#fff', textAlign: 'center' },
  
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  
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
  switch: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  switchActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  switchText: { color: '#9CA3AF', fontWeight: '600' },
  switchTextActive: { color: '#fff' },
  
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
});

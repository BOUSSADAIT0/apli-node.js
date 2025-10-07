import { getCategories } from '@/lib/categories';
import { getEmployers, type Employer } from '@/lib/employers';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

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
  hourlyRate?: number;
  location?: {
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  employerId?: string;
  projectName?: string;
  comment?: string;
};

type Props = {
  onSubmit: (data: WorkEntryPayload) => Promise<void> | void;
  submitting?: boolean;
  initialValues?: Partial<WorkEntryPayload>;
  submitLabel?: string;
};

export default function WorkEntryFormAdvanced({ onSubmit, submitting, initialValues, submitLabel }: Props) {
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
  const [hourlyRate, setHourlyRate] = useState(String(initialValues?.hourlyRate ?? 20));
  
  // New fields
  const [category, setCategory] = useState(initialValues?.category ?? 'Standard');
  const [comment, setComment] = useState(initialValues?.comment ?? '');
  const [projectName, setProjectName] = useState(initialValues?.projectName ?? '');
  const [employerId, setEmployerId] = useState(initialValues?.employerId ?? '');
  const [city, setCity] = useState(initialValues?.location?.city ?? '');
  const [address, setAddress] = useState(initialValues?.location?.address ?? '');
  const [latitude, setLatitude] = useState<number | undefined>(initialValues?.location?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(initialValues?.location?.longitude);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  const [categories, setCategories] = useState<string[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showEmployerPicker, setShowEmployerPicker] = useState(false);

  useEffect(() => {
    loadCategories();
    loadEmployers();
  }, []);

  async function loadCategories() {
    const cats = await getCategories();
    setCategories(cats);
  }

  async function loadEmployers() {
    const emps = await getEmployers();
    setEmployers(emps);
  }

  async function captureLocation() {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'La géolocalisation est désactivée. Vous pouvez l\'activer dans les paramètres.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      
      // Reverse geocoding
      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        setCity(place.city || place.region || '');
        setAddress(`${place.street || ''} ${place.name || ''}`.trim());
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de capturer la localisation: ' + String(e));
    } finally {
      setLoadingLocation(false);
    }
  }

  function handleSubmit() {
    const employer = employers.find(e => e.id === employerId);
    const finalRate = employer?.defaultRate ?? Number(hourlyRate) || 0;
    
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
      category,
      hourlyRate: finalRate,
      location: latitude && longitude ? { city, address, latitude, longitude } : undefined,
      employerId: employerId || undefined,
      projectName: projectName || undefined,
      comment: comment || undefined,
    });
  }

  const selectedEmployer = employers.find(e => e.id === employerId);

  return (
    <ScrollView style={styles.card} contentContainerStyle={{ gap: 12 }}>
      <Text style={styles.title}>{submitLabel || 'Nouvelle entrée'}</Text>
      
      {/* Employer & Project */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Employeur & Projet</Text>
        <Pressable style={styles.picker} onPress={() => setShowEmployerPicker(true)}>
          <Text style={styles.pickerText}>{selectedEmployer?.name || 'Sélectionner un employeur'}</Text>
        </Pressable>
        <TextInput style={styles.input} value={projectName} onChangeText={setProjectName} placeholder="Nom du projet (optionnel)" placeholderTextColor="#6B7280" />
      </View>

      {/* Dates & Times */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Horaires</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Date début</Text>
            <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor="#6B7280" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Heure début</Text>
            <TextInput style={styles.input} value={startTime} onChangeText={setStartTime} placeholder="HH:mm" placeholderTextColor="#6B7280" />
          </View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Date fin</Text>
            <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" placeholderTextColor="#6B7280" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Heure fin</Text>
            <TextInput style={styles.input} value={endTime} onChangeText={setEndTime} placeholder="HH:mm" placeholderTextColor="#6B7280" />
          </View>
        </View>
      </View>

      {/* Break */}
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Pause</Text>
        <Switch value={hasBreak} onValueChange={setHasBreak} />
      </View>
      {hasBreak && (
        <View style={styles.breakRow}>
          <TextInput style={styles.inputSmall} value={breakStartHour} onChangeText={setBreakStartHour} placeholder="HH" placeholderTextColor="#6B7280" />
          <Text style={styles.sep}>:</Text>
          <TextInput style={styles.inputSmall} value={breakStartMin} onChangeText={setBreakStartMin} placeholder="mm" placeholderTextColor="#6B7280" />
          <Text style={styles.sep}>-</Text>
          <TextInput style={styles.inputSmall} value={breakEndHour} onChangeText={setBreakEndHour} placeholder="HH" placeholderTextColor="#6B7280" />
          <Text style={styles.sep}>:</Text>
          <TextInput style={styles.inputSmall} value={breakEndMin} onChangeText={setBreakEndMin} placeholder="mm" placeholderTextColor="#6B7280" />
        </View>
      )}

      {/* Category & Rate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Catégorie & Taux</Text>
        <Pressable style={styles.picker} onPress={() => setShowCategoryPicker(true)}>
          <Text style={styles.pickerText}>{category}</Text>
        </Pressable>
        <TextInput style={styles.input} value={hourlyRate} onChangeText={setHourlyRate} keyboardType="numeric" placeholder="Taux €/h" placeholderTextColor="#6B7280" />
        {selectedEmployer?.defaultRate && <Text style={styles.hint}>Taux par défaut: {selectedEmployer.defaultRate} €/h</Text>}
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lieu de travail</Text>
        <Pressable style={styles.locationBtn} onPress={captureLocation} disabled={loadingLocation}>
          {loadingLocation ? <ActivityIndicator color="#fff" /> : <Text style={styles.locationBtnText}>📍 Capturer ma position</Text>}
        </Pressable>
        {(latitude && longitude) && <Text style={styles.hint}>Position: {latitude.toFixed(4)}, {longitude.toFixed(4)}</Text>}
        <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Ville" placeholderTextColor="#6B7280" />
        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Adresse" placeholderTextColor="#6B7280" />
      </View>

      {/* Comment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Commentaire</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={comment} onChangeText={setComment} placeholder="Notes..." placeholderTextColor="#6B7280" multiline />
      </View>

      <Button
        title={submitting ? 'Envoi…' : (submitLabel || 'Ajouter')}
        onPress={handleSubmit}
        disabled={!!submitting}
        color="#4a7a8c"
      />

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner une catégorie</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {categories.map(cat => (
                <Pressable key={cat} style={styles.modalItem} onPress={() => { setCategory(cat); setShowCategoryPicker(false); }}>
                  <Text style={styles.modalItemText}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button title="Annuler" onPress={() => setShowCategoryPicker(false)} color="#6B7280" />
          </View>
        </View>
      </Modal>

      {/* Employer Picker Modal */}
      <Modal visible={showEmployerPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner un employeur</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <Pressable style={styles.modalItem} onPress={() => { setEmployerId(''); setShowEmployerPicker(false); }}>
                <Text style={styles.modalItemText}>Aucun</Text>
              </Pressable>
              {employers.map(emp => (
                <Pressable key={emp.id} style={styles.modalItem} onPress={() => { setEmployerId(emp.id); setShowEmployerPicker(false); }}>
                  <Text style={styles.modalItemText}>{emp.name}</Text>
                  {emp.defaultRate && <Text style={styles.modalItemSub}>{emp.defaultRate} €/h</Text>}
                </Pressable>
              ))}
            </ScrollView>
            <Button title="Annuler" onPress={() => setShowEmployerPicker(false)} color="#6B7280" />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 16, backgroundColor: '#111827' },
  title: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  section: { gap: 8, marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#9CA3AF' },
  row: { flexDirection: 'row', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: '#9CA3AF', fontSize: 13, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#374151', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#fff' },
  inputSmall: { flex: 1, borderWidth: 1, borderColor: '#374151', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, color: '#fff', textAlign: 'center' },
  breakRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sep: { color: '#9CA3AF' },
  picker: { borderWidth: 1, borderColor: '#374151', borderRadius: 8, padding: 12, backgroundColor: '#1F2937' },
  pickerText: { color: '#fff' },
  hint: { color: '#6B7280', fontSize: 12 },
  locationBtn: { backgroundColor: '#3B82F6', borderRadius: 8, padding: 12, alignItems: 'center' },
  locationBtnText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1F2937', borderRadius: 12, padding: 20, gap: 12 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  modalItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#374151' },
  modalItemText: { color: '#fff', fontSize: 15 },
  modalItemSub: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
});



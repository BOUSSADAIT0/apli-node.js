import { useEffect, useState } from 'react';
import { Button, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { getClients, type Client } from '@/lib/clients';

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
  hourlyRate?: number;
};

type Props = {
  onSubmit: (data: WorkEntryPayload) => Promise<void> | void;
  submitting?: boolean;
  initialValues?: Partial<WorkEntryPayload>;
  submitLabel?: string;
};

export default function WorkEntryForm({ onSubmit, submitting, initialValues, submitLabel }: Props) {
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
  
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    const data = await getClients();
    setClients(data);
    
    // Si on a des valeurs initiales avec un clientId, trouver le client
    if (initialValues?.clientId) {
      const client = data.find(c => c.id === initialValues.clientId);
      if (client) {
        setSelectedClient(client);
        if (client.defaultRate) {
          setHourlyRate(String(client.defaultRate));
        }
      }
    }
  }

  function handleClientSelect(client: Client) {
    setSelectedClient(client);
    if (client.defaultRate) {
      setHourlyRate(String(client.defaultRate));
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Nouvelle entrée</Text>
      
      {/* Sélection du client */}
      <View style={styles.row}>
        <Text style={styles.label}>Client / Activité</Text>
        <View style={styles.clientSelector}>
          {clients.map((client) => (
            <Pressable
              key={client.id}
              style={[
                styles.clientChip,
                {
                  backgroundColor: selectedClient?.id === client.id ? (client.color || '#3B82F6') : '#374151',
                  borderColor: selectedClient?.id === client.id ? (client.color || '#3B82F6') : '#4B5563',
                },
              ]}
              onPress={() => handleClientSelect(client)}
            >
              <Text style={styles.clientChipText}>{client.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Début (date)</Text>
        <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Début (heure)</Text>
        <TextInput style={styles.input} value={startTime} onChangeText={setStartTime} placeholder="HH:mm" />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Fin (date)</Text>
        <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Fin (heure)</Text>
        <TextInput style={styles.input} value={endTime} onChangeText={setEndTime} placeholder="HH:mm" />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Pause</Text>
        <Switch value={hasBreak} onValueChange={setHasBreak} />
      </View>
      {hasBreak && (
        <View style={styles.breakRow}>
          <TextInput style={styles.input} value={breakStartHour} onChangeText={setBreakStartHour} placeholder="HH" />
          <TextInput style={styles.input} value={breakStartMin} onChangeText={setBreakStartMin} placeholder="mm" />
          <Text style={styles.sep}>-</Text>
          <TextInput style={styles.input} value={breakEndHour} onChangeText={setBreakEndHour} placeholder="HH" />
          <TextInput style={styles.input} value={breakEndMin} onChangeText={setBreakEndMin} placeholder="mm" />
        </View>
      )}
      <View style={styles.row}>
        <Text style={styles.label}>Taux €/h</Text>
        <TextInput style={styles.input} value={hourlyRate} onChangeText={setHourlyRate} keyboardType="numeric" />
      </View>
      <Button
        title={submitting ? 'Envoi…' : (submitLabel || 'Ajouter')}
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
            category: selectedClient?.type === 'activity' ? selectedClient.name : 'standard',
            clientId: selectedClient?.id,
            clientName: selectedClient?.name,
            hourlyRate: Number(hourlyRate) || 0,
          })
        }
        disabled={!!submitting}
        color="#4a7a8c"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#111827',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  row: {
    gap: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#9CA3AF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
  },
  breakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sep: { color: '#9CA3AF' },
  clientSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  clientChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  clientChipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});



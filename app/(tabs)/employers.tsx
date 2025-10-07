import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addClient, deleteClient, getClients, updateClient, type Client } from '@/lib/clients';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function ClientsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [siret, setSiret] = useState('');
  const [rate, setRate] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [type, setType] = useState<'client' | 'activity'>('client');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const items = await getClients();
    setClients(items);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function openAdd() {
    setEditingId(null);
    setName('');
    setAddress('');
    setCity('');
    setPostalCode('');
    setSiret('');
    setRate('');
    setColor('#3B82F6');
    setType('client');
    setShowModal(true);
  }

  function openEdit(client: Client) {
    setEditingId(client.id);
    setName(client.name);
    setAddress(client.address || '');
    setCity(client.city || '');
    setPostalCode(client.postalCode || '');
    setSiret(client.siret || '');
    setRate(String(client.defaultRate || ''));
    setColor(client.color || '#3B82F6');
    setType(client.type || 'client');
    setShowModal(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }
    try {
      const clientData = {
        name,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        siret: siret.trim() || undefined,
        defaultRate: Number(rate) || undefined,
        color,
        type,
      };

      if (editingId) {
        await updateClient(editingId, clientData);
      } else {
        await addClient(clientData);
      }
      await load();
      setShowModal(false);
      Alert.alert('Succès', `${type === 'client' ? 'Client' : 'Activité'} ${editingId ? 'modifié' : 'ajouté'} avec succès !`);
    } catch (e) {
      Alert.alert('Erreur', String(e));
    }
  }

  async function handleDelete(id: string) {
    if (Platform.OS === 'web') {
      if (!confirm('Supprimer ce client/activité ?')) return;
    } else {
      Alert.alert('Confirmation', 'Supprimer ce client/activité ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClient(id);
              await load();
            } catch (e) {
              Alert.alert('Erreur', String(e));
            }
          },
        },
      ]);
      return;
    }
    try {
      await deleteClient(id);
      await load();
    } catch (e) {
      Alert.alert('Erreur', String(e));
    }
  }

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const clientsOnly = clients.filter((c) => c.type === 'client' || !c.type);
  const activitiesOnly = clients.filter((c) => c.type === 'activity');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>🏢 Clients & Activités</Text>
          <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
            Gérez vos clients et activités sous votre statut
          </Text>
        </View>
        <Pressable style={[styles.floatingBtn, { backgroundColor: theme.primary }]} onPress={openAdd}>
          <Text style={styles.floatingBtnText}>+ Ajouter</Text>
        </Pressable>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.primary }]}>{clientsOnly.length}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>👤 Clients</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.secondary }]}>{activitiesOnly.length}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>📋 Activités</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.statValue, { color: theme.success }]}>{clients.length}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Total</Text>
        </View>
      </View>

      <FlatList
        data={clients}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border, borderLeftColor: item.color || theme.primary },
            ]}
            onPress={() => openEdit(item)}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.colorDot, { backgroundColor: item.color || theme.primary }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.clientName, { color: theme.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <View style={styles.cardMeta}>
                  <Text
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor: item.type === 'client' ? theme.primary + '20' : theme.secondary + '20',
                        color: item.type === 'client' ? theme.primary : theme.secondary,
                      },
                    ]}
                  >
                    {item.type === 'client' ? '👤 Client' : '📋 Activité'}
                  </Text>
                  {item.defaultRate && (
                    <Text style={[styles.clientRate, { color: theme.muted }]}>💰 {item.defaultRate} €/h</Text>
                  )}
                </View>
                {item.type === 'client' && (item.address || item.city || item.siret) && (
                  <View style={{ marginTop: 8, gap: 4 }}>
                    {(item.address || item.city || item.postalCode) && (
                      <Text style={[{ fontSize: 12, color: theme.muted }]} numberOfLines={1}>
                        📍 {[item.address, item.postalCode, item.city].filter(Boolean).join(', ')}
                      </Text>
                    )}
                    {item.siret && (
                      <Text style={[{ fontSize: 12, color: theme.muted }]} numberOfLines={1}>
                        🏢 SIRET: {item.siret}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
            <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
              <Text style={{ fontSize: 20 }}>🗑️</Text>
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucun client ou activité</Text>
            <Text style={[styles.emptyText, { color: theme.muted }]}>
              Commencez par ajouter vos premiers clients ou activités
            </Text>
            <Text style={[styles.emptyHint, { color: theme.muted }]}>
              💡 En tant qu'auto-entrepreneur, vous pouvez gérer plusieurs clients ou activités sous votre unique
              statut SIREN.
            </Text>
          </View>
        }
      />

      {/* Modal Add/Edit */}
      <Modal visible={showModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingId ? '✏️ Modifier' : '➕ Nouveau'} {type === 'client' ? 'client' : 'activité'}
              </Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Text style={[styles.closeBtn, { color: theme.muted }]}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>Type</Text>
              <View style={styles.typeRow}>
                <Pressable
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: type === 'client' ? theme.primary : theme.background,
                      borderColor: type === 'client' ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setType('client')}
                >
                  <Text style={[styles.typeBtnText, { color: type === 'client' ? '#FFF' : theme.text }]}>
                    👤 Client
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: type === 'activity' ? theme.secondary : theme.background,
                      borderColor: type === 'activity' ? theme.secondary : theme.border,
                    },
                  ]}
                  onPress={() => setType('activity')}
                >
                  <Text style={[styles.typeBtnText, { color: type === 'activity' ? '#FFF' : theme.text }]}>
                    📋 Activité
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>Nom *</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder={
                  type === 'client' ? 'Ex: Société ABC' : "Ex: Développement web"
                }
                placeholderTextColor={theme.muted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {type === 'client' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.muted }]}>Adresse</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                    placeholder="Ex: 12 rue de la Paix"
                    placeholderTextColor={theme.muted}
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={[styles.inputGroup, { flex: 2 }]}>
                    <Text style={[styles.label, { color: theme.muted }]}>Ville</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                      placeholder="Ex: Paris"
                      placeholderTextColor={theme.muted}
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.label, { color: theme.muted }]}>Code Postal</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                      placeholder="75001"
                      placeholderTextColor={theme.muted}
                      value={postalCode}
                      onChangeText={setPostalCode}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.muted }]}>SIRET</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                    placeholder="Ex: 123 456 789 00012"
                    placeholderTextColor={theme.muted}
                    value={siret}
                    onChangeText={setSiret}
                    keyboardType="numeric"
                    maxLength={17}
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>Taux horaire par défaut (optionnel)</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Ex: 45"
                placeholderTextColor={theme.muted}
                value={rate}
                onChangeText={setRate}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.muted }]}>Couleur</Text>
              <View style={styles.colorRow}>
                {colors.map((c) => (
                  <Pressable
                    key={c}
                    style={[
                      styles.colorBox,
                      {
                        backgroundColor: c,
                        borderWidth: color === c ? 3 : 1,
                        borderColor: color === c ? theme.text : theme.border,
                      },
                    ]}
                    onPress={() => setColor(c)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.cancelBtn, { borderColor: theme.border }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.muted }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={handleSave}>
                <Text style={styles.saveBtnText}>💾 Enregistrer</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
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
  floatingBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  floatingBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardHeader: {
    marginBottom: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeBadge: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: '600',
  },
  clientRate: {
    fontSize: 13,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyContainer: {
    marginTop: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
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
    maxHeight: '90%',
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
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
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


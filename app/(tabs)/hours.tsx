import WorkEntryForm from '@/components/work-entry-form';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { createWorkEntry, deleteWorkEntry, getCurrentUser, listWorkEntries, updateWorkEntry } from '@/lib/api';
import { storage } from '@/lib/storage';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HoursScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (userId) reload();
  }, [userId]);

  async function loadUser() {
    try {
      const u = getCurrentUser();
      if (u?.id) {
        setUserId(String(u.id));
      } else {
        const raw = await storage.getItem('user');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.id) setUserId(String(parsed.id));
          } catch {}
        }
      }
    } catch {}
  }

  async function reload() {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await listWorkEntries(userId);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  function formatDateKey(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function getMonthMatrix(monthStart: Date): Date[][] {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Mon=0
    const startDate = new Date(year, month, 1 - startDayOfWeek);
    const weeks: Date[][] = [];
    let cursor = new Date(startDate);
    for (let w = 0; w < 6; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }

  const entriesByDate = useMemo(() => {
    return items.reduce((acc: Record<string, any[]>, it: any) => {
      // Normaliser la clé au format YYYY-MM-DD
      const key = String(it.startDate).split('T')[0]; // Enlève l'heure si présente
      acc[key] = acc[key] || [];
      acc[key].push(it);
      return acc;
    }, {});
  }, [items]);

  // Debug: Log pour vérifier les données
  if (items.length > 0) {
    console.log('📊 Entrées chargées:', items.length);
    console.log('📅 Dates avec entrées:', Object.keys(entriesByDate));
    console.log('📌 Exemple d\'entrée:', items[0]);
  }

  const monthLines = useMemo(() => {
    return (items || []).map((e) => {
      const start = new Date(`${e.startDate}T${e.startTime}:00`);
      const end = new Date(`${e.endDate}T${e.endTime}:00`);
      let hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
      if (e.hasBreak) {
        const bs = new Date(`${e.startDate}T${e.breakStartHour || '00'}:${e.breakStartMin || '00'}:00`);
        const be = new Date(`${e.startDate}T${e.breakEndHour || '00'}:${e.breakEndMin || '00'}:00`);
        if (!Number.isNaN(bs.getTime()) && !Number.isNaN(be.getTime()) && be > bs) {
          hours = Math.max(0, hours - (be.getTime() - bs.getTime()) / (1000 * 60 * 60));
        }
      }
      const rate = Number(e.hourlyRate || 0);
      // Normaliser la date au format YYYY-MM-DD
      const dateKey = String(e.startDate).split('T')[0];
      return { date: dateKey, hours, amount: Math.round(hours * rate * 100) / 100 };
    });
  }, [items]);

  const totalsByDate = useMemo(() => {
    return monthLines.reduce((acc, l) => {
      const cur = acc[l.date] || { hours: 0, amount: 0 };
      cur.hours += l.hours;
      cur.amount += l.amount;
      acc[l.date] = cur;
      return acc;
    }, {} as Record<string, { hours: number; amount: number }>);
  }, [monthLines]);

  const monthKey = useMemo(() => {
    return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
  }, [currentMonth]);

  const monthEntries = useMemo(() => {
    return items.filter(e => {
      const dateKey = String(e.startDate).split('T')[0];
      return dateKey.startsWith(monthKey);
    });
  }, [items, monthKey]);

  const monthTotalHours = useMemo(() => {
    return monthLines.reduce((s, l) => s + (String(l.date).startsWith(monthKey) ? l.hours : 0), 0);
  }, [monthLines, monthKey]);

  const monthTotalAmount = useMemo(() => {
    return Math.round(monthLines.reduce((s, l) => s + (String(l.date).startsWith(monthKey) ? l.amount : 0), 0) * 100) / 100;
  }, [monthLines, monthKey]);

  const monthUniqueDays = useMemo(() => {
    return new Set(monthEntries.map(e => String(e.startDate).split('T')[0])).size;
  }, [monthEntries]);

  function getWeekRange(baseDateStr?: string) {
    const base = baseDateStr ? new Date(`${baseDateStr}T00:00:00`) : new Date();
    const day = (base.getDay() + 6) % 7; // Mon=0
    const monday = new Date(base);
    monday.setDate(base.getDate() - day);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { monday, sunday, mondayKey: fmt(monday), sundayKey: fmt(sunday) };
  }

  const { monday, sunday, mondayKey, sundayKey } = getWeekRange(selectedDate || undefined);
  
  const weekEntries = useMemo(() => {
    return items.filter(e => {
      const dateKey = String(e.startDate).split('T')[0];
      return dateKey >= mondayKey && dateKey <= sundayKey;
    });
  }, [items, mondayKey, sundayKey]);

  const weekTotals = useMemo(() => {
    return weekEntries.reduce((acc, e) => {
      const start = new Date(`${e.startDate}T${e.startTime}:00`);
      const end = new Date(`${e.endDate}T${e.endTime}:00`);
      let hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
      if (e.hasBreak) {
        const bs = new Date(`${e.startDate}T${e.breakStartHour || '00'}:${e.breakStartMin || '00'}:00`);
        const be = new Date(`${e.startDate}T${e.breakEndHour || '00'}:${e.breakEndMin || '00'}:00`);
        if (!Number.isNaN(bs.getTime()) && !Number.isNaN(be.getTime()) && be > bs) {
          hours = Math.max(0, hours - (be.getTime() - bs.getTime()) / (1000 * 60 * 60));
        }
      }
      const rate = Number(e.hourlyRate || 0);
      acc.hours += hours;
      acc.amount += Math.round(hours * rate * 100) / 100;
      acc.days.add(e.startDate);
      return acc;
    }, { hours: 0, amount: 0, days: new Set<string>() } as { hours: number; amount: number; days: Set<string> });
  }, [weekEntries]);

  const selectedEntries = useMemo(() => {
    return selectedDate ? (entriesByDate[selectedDate] || []).map(e => {
      // Ajouter le calcul de durationHours pour chaque entrée
      const start = new Date(`${e.startDate}T${e.startTime}:00`);
      const end = new Date(`${e.endDate}T${e.endTime}:00`);
      let hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
      if (e.hasBreak) {
        const bs = new Date(`${e.startDate}T${e.breakStartHour || '00'}:${e.breakStartMin || '00'}:00`);
        const be = new Date(`${e.startDate}T${e.breakEndHour || '00'}:${e.breakEndMin || '00'}:00`);
        if (!Number.isNaN(bs.getTime()) && !Number.isNaN(be.getTime()) && be > bs) {
          hours = Math.max(0, hours - (be.getTime() - bs.getTime()) / (1000 * 60 * 60));
        }
      }
      return { ...e, durationHours: hours };
    }) : [];
  }, [selectedDate, entriesByDate]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>⏱️ Mes Heures</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Suivez votre temps de travail
            </Text>
          </View>
          <Pressable 
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </Pressable>
        </View>

        {/* Stats rapides */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{monthTotalHours.toFixed(1)}h</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Ce mois</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={[styles.statValue, { color: theme.success }]}>{monthTotalAmount.toFixed(2)}€</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Revenus</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{monthUniqueDays}</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Jours</Text>
          </View>
        </View>

        {/* Calendrier */}
        <View style={[styles.calendarSection, { backgroundColor: theme.card }]}>
          <View style={styles.calHeader}>
            <Pressable onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
              <Text style={[styles.calNav, { color: theme.primary }]}>‹</Text>
            </Pressable>
            <Text style={[styles.calTitle, { color: theme.text }]}>
              {currentMonth.toLocaleString('fr-FR', { month: 'long' })} {currentMonth.getFullYear()}
            </Text>
            <Pressable onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
              <Text style={[styles.calNav, { color: theme.primary }]}>›</Text>
            </Pressable>
          </View>
          
          <View style={styles.weekRow}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <Text key={i} style={[styles.weekCell, { color: theme.muted }]}>{d}</Text>
            ))}
          </View>
          
          <View style={styles.grid}>
            {getMonthMatrix(currentMonth).map((week, wi) => (
              <View key={wi} style={styles.rowH}>
                {week.map((date, di) => {
                  const inMonth = date.getMonth() === currentMonth.getMonth();
                  const key = formatDateKey(date);
                  const hasEntries = !!entriesByDate[key];
                  const isSelected = selectedDate === key;
                  const badge = totalsByDate[key];
                  const isToday = formatDateKey(new Date()) === key;
                  
                  return (
                    <Pressable
                      key={di}
                      style={[
                        styles.cell,
                        { backgroundColor: theme.background },
                        hasEntries && [styles.cellMarked, { backgroundColor: theme.primary + '20' }],
                        isSelected && [styles.cellSelected, { backgroundColor: theme.primary, borderColor: theme.primary }],
                        isToday && !isSelected && [styles.cellToday, { borderColor: theme.warning }],
                      ]}
                      onPress={() => setSelectedDate(isSelected ? null : key)}
                    >
                      <Text 
                        style={[
                          styles.cellDay, 
                          { color: isSelected ? '#FFFFFF' : (inMonth ? theme.text : theme.muted) }
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      {badge && !isSelected && (
                        <Text style={[styles.cellBadge, { color: theme.primary }]}>
                          {badge.hours.toFixed(1)}h
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Week summary (si date sélectionnée) */}
        {selectedDate && (
          <View style={[styles.summaryBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>📊 Semaine sélectionnée</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: theme.primary }]}>{weekTotals.hours.toFixed(1)}h</Text>
                <Text style={[styles.summaryLabel, { color: theme.muted }]}>Heures</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: theme.success }]}>{weekTotals.amount.toFixed(2)}€</Text>
                <Text style={[styles.summaryLabel, { color: theme.muted }]}>Montant</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: theme.text }]}>{weekTotals.days.size}</Text>
                <Text style={[styles.summaryLabel, { color: theme.muted }]}>Jours</Text>
              </View>
            </View>
          </View>
        )}

        {/* Liste des entrées */}
        {selectedDate && selectedEntries.length > 0 && (
          <View style={styles.entriesSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              📝 Entrées du {new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </Text>
            {selectedEntries.map((item) => (
              <View key={item.id} style={[styles.entryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.entryHeader}>
                  <Text style={[styles.entryTime, { color: theme.text }]}>
                    {item.startTime} → {item.endTime}
                  </Text>
                  <Text style={[styles.entryAmount, { color: theme.success }]}>
                    {item.hourlyRate ? `${(item.durationHours * item.hourlyRate).toFixed(2)}€` : '-'}
                  </Text>
                </View>
                
                {item.clientName && (
                  <View style={[styles.entryBadge, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.entryBadgeText, { color: theme.primary }]}>👤 {item.clientName}</Text>
                  </View>
                )}
                
                {item.category && !item.clientName && (
                  <View style={[styles.entryBadge, { backgroundColor: theme.primary + '20' }]}>
                    <Text style={[styles.entryBadgeText, { color: theme.primary }]}>{item.category}</Text>
                  </View>
                )}
                
                {item.location?.city && (
                  <Text style={[styles.entryLocation, { color: theme.muted }]}>
                    📍 {item.location.city}
                  </Text>
                )}
                
                <View style={styles.entryActions}>
                  <Pressable onPress={() => setEditing(item)}>
                    <Text style={[styles.actionButton, { color: theme.primary }]}>✏️ Modifier</Text>
                  </Pressable>
                  <Pressable onPress={async () => {
                    Alert.alert(
                      'Supprimer',
                      'Êtes-vous sûr de vouloir supprimer cette entrée ?',
                      [
                        { text: 'Annuler', style: 'cancel' },
                        { 
                          text: 'Supprimer', 
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await deleteWorkEntry(item.id);
                              await reload();
                              Alert.alert('✅ Succès', 'Entrée supprimée');
                            } catch (e) {
                              Alert.alert('❌ Erreur', String(e));
                            }
                          }
                        }
                      ]
                    );
                  }}>
                    <Text style={[styles.actionButton, { color: theme.danger }]}>🗑️ Supprimer</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedDate && selectedEntries.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune entrée</Text>
            <Text style={[styles.emptyText, { color: theme.muted }]}>
              Aucune heure enregistrée pour ce jour
            </Text>
            <Pressable 
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={styles.emptyButtonText}>+ Ajouter une entrée</Text>
            </Pressable>
          </View>
        )}

        {!selectedDate && items.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Commencez à suivre vos heures</Text>
            <Text style={[styles.emptyText, { color: theme.muted }]}>
              Ajoutez votre première entrée de travail
            </Text>
            <Pressable 
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={styles.emptyButtonText}>+ Ajouter une entrée</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Modal d'ajout */}
      <Modal visible={showAddForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>➕ Nouvelle entrée</Text>
              <Pressable onPress={() => setShowAddForm(false)}>
                <Text style={[styles.modalClose, { color: theme.muted }]}>✕</Text>
              </Pressable>
            </View>
            <ScrollView>
              <WorkEntryForm
                submitting={submitting}
                onSubmit={async (data) => {
                  if (!userId) {
                    Alert.alert('❌ Erreur', 'Vous devez être connecté');
                    return;
                  }
                  try {
                    setSubmitting(true);
                    await createWorkEntry({ userId, ...data });
                    await reload();
                    setShowAddForm(false);
                    Alert.alert('✅ Succès', 'Entrée ajoutée avec succès');
                  } catch (e) {
                    Alert.alert('❌ Erreur', String(e));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de modification */}
      <Modal visible={!!editing} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>✏️ Modifier l'entrée</Text>
              <Pressable onPress={() => setEditing(null)}>
                <Text style={[styles.modalClose, { color: theme.muted }]}>✕</Text>
              </Pressable>
            </View>
            <ScrollView>
              {editing && (
                <WorkEntryForm
                  submitting={submitting}
                  initialValues={editing}
                  submitLabel="Enregistrer"
                  onSubmit={async (data) => {
                    try {
                      setSubmitting(true);
                      await updateWorkEntry(editing.id, data);
                      setEditing(null);
                      await reload();
                      Alert.alert('✅ Succès', 'Entrée modifiée avec succès');
                    } catch (e) {
                      Alert.alert('❌ Erreur', String(e));
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  calendarSection: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calTitle: {
    fontWeight: '700',
    fontSize: 18,
    textTransform: 'capitalize',
  },
  calNav: {
    fontSize: 32,
    fontWeight: '600',
    paddingHorizontal: 16,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekCell: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    gap: 4,
  },
  rowH: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  cell: {
    width: `${100 / 7 - 0.6}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  cellMarked: {},
  cellSelected: {
    borderWidth: 2,
  },
  cellToday: {
    borderWidth: 2,
  },
  cellDay: {
    fontSize: 14,
    fontWeight: '600',
  },
  cellBadge: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  summaryBox: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
  },
  entriesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  entryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTime: {
    fontSize: 16,
    fontWeight: '600',
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  entryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  entryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  entryLocation: {
    fontSize: 14,
    marginBottom: 12,
  },
  entryActions: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  actionButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    marginHorizontal: 20,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalClose: {
    fontSize: 28,
    fontWeight: '300',
  },
});

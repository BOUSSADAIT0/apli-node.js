import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCurrentUser, invoicePreview, listWorkEntries } from '@/lib/api';
import { storage } from '@/lib/storage';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type PeriodType = 'week' | 'month' | 'year' | 'custom';

export default function RecapScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rate, setRate] = useState('50');
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState<null | Awaited<ReturnType<typeof invoicePreview>>>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user?.id) reload();
  }, [user]);

  async function loadUser() {
    try {
      const u = getCurrentUser();
      if (u) {
        setUser(u);
      } else {
        const raw = await storage.getItem('user');
        if (raw) {
          const parsed = JSON.parse(raw);
          setUser(parsed);
        }
      }
    } catch {}
  }

  async function reload() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const entries = await listWorkEntries(user.id);
      setItems(entries);
    } finally {
      setLoading(false);
    }
  }

  // Calcul des périodes
  const periods = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    const fmt = (d: Date) => d.toISOString().split('T')[0];

    return {
      week: { from: fmt(startOfWeek), to: fmt(endOfWeek) },
      month: { from: fmt(startOfMonth), to: fmt(endOfMonth) },
      year: { from: fmt(startOfYear), to: fmt(endOfYear) },
      custom: { from, to },
    };
  }, [from, to]);

  // Données filtrées par période
  const filteredData = useMemo(() => {
    const currentPeriod = periods[period];
    const filtered = items.filter(e => {
      if (!currentPeriod.from && !currentPeriod.to) return true;
      if (currentPeriod.from && e.startDate < currentPeriod.from) return false;
      if (currentPeriod.to && e.startDate > currentPeriod.to) return false;
      return true;
    });

    let totalHours = 0;
    let totalAmount = 0;
    const daySet = new Set<string>();

    filtered.forEach(e => {
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

      const entryRate = Number(e.hourlyRate || rate || 0);
      totalHours += hours;
      totalAmount += hours * entryRate;
      daySet.add(e.startDate);
    });

    return {
      entries: filtered,
      totalHours,
      totalAmount: Math.round(totalAmount * 100) / 100,
      uniqueDays: daySet.size,
      avgHoursPerDay: daySet.size > 0 ? totalHours / daySet.size : 0,
    };
  }, [items, period, periods, rate]);

  // Extraction des emplacements uniques avec coordonnées GPS

  // Répartition par catégorie
  const byCategory = useMemo(() => {
    const map: Record<string, { hours: number; amount: number }> = {};
    
    filteredData.entries.forEach(e => {
      const cat = e.category || 'Standard';
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

      const entryRate = Number(e.hourlyRate || rate || 0);
      
      if (!map[cat]) map[cat] = { hours: 0, amount: 0 };
      map[cat].hours += hours;
      map[cat].amount += hours * entryRate;
    });

    return Object.entries(map).map(([name, stats]) => ({
      name,
      hours: Math.round(stats.hours * 10) / 10,
      amount: Math.round(stats.amount * 100) / 100,
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredData, rate]);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const currentPeriod = periods[period];
      const res = await invoicePreview({ 
        userId: user.id, 
        from: currentPeriod.from || undefined, 
        to: currentPeriod.to || undefined, 
        hourlyRate: Number(rate) || 0 
      });
      setData(res);
      setShowModal(true);
    } catch (e) {
      Alert.alert('❌ Erreur', String(e));
    } finally {
      setLoading(false);
    }
  }

  const csv = useMemo(() => {
    if (!data) return '';
    const header = 'Date;Heures;Taux;Montant;Catégorie\n';
    const rows = data.lines.map(l => `${l.date};${l.hours};${l.rate};${l.amount};${l.category || 'Standard'}`).join('\n');
    return header + rows + `\nTotal;;${''};${data.totalAmount};`;
  }, [data]);

  async function exportExcel() {
    if (!data || !user) return;
    try {
      const BOM = '\uFEFF';
      const excelCSV = BOM + csv;
      const fileName = `facture_${data.from || 'debut'}_${data.to || 'fin'}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, excelCSV, { encoding: FileSystem.EncodingType.UTF8 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { dialogTitle: 'Exporter en Excel', mimeType: 'text/csv' });
      } else {
        Alert.alert('✅ Succès', `Fichier Excel créé: ${fileUri}`);
      }
    } catch (e) {
      Alert.alert('❌ Erreur', 'Erreur export Excel: ' + String(e));
    }
  }

  async function createPDF() {
    if (!data || !user) return;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: system-ui, sans-serif; padding: 40px; color: #1F2937; }
    h1 { color: #3B82F6; margin-bottom: 8px; }
    .header { margin-bottom: 24px; }
    .info { color: #6B7280; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; }
    th { background: #F3F4F6; font-weight: 600; color: #374151; }
    .total { font-weight: 700; background: #EFF6FF; color: #1E40AF; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Facture</h1>
    <div class="info">
      <p>${user.firstName} ${user.lastName}</p>
      <p>${user.email || ''}</p>
      <p>Période: ${data.from || 'Début'} → ${data.to || 'Fin'}</p>
    </div>
  </div>
  <table>
    <thead>
      <tr><th>Date</th><th>Heures</th><th>Taux (€/h)</th><th>Montant (€)</th><th>Catégorie</th></tr>
    </thead>
    <tbody>
      ${data.lines.map(l => `<tr><td>${l.date}</td><td>${l.hours.toFixed(2)}</td><td>${l.rate.toFixed(2)}</td><td>${l.amount.toFixed(2)}</td><td>${l.category || 'Standard'}</td></tr>`).join('')}
    </tbody>
    <tfoot>
      <tr class="total"><td colspan="3">Total</td><td>${data.totalAmount.toFixed(2)} €</td><td>${data.totalHours.toFixed(2)} h</td></tr>
    </tfoot>
  </table>
</body>
</html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { dialogTitle: 'Facture PDF' });
      } else {
        Alert.alert('✅ Succès', `PDF créé: ${uri}`);
      }
    } catch (e) {
      Alert.alert('❌ Erreur', String(e));
    }
  }

  const periodLabels = {
    week: 'Cette semaine',
    month: 'Ce mois',
    year: 'Cette année',
    custom: 'Personnalisé',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>📊 Récapitulatif</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Vos statistiques et revenus
            </Text>
          </View>
        </View>

        {/* Sélection de période */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year', 'custom'] as PeriodType[]).map((p) => (
            <Pressable
              key={p}
              style={[
                styles.periodButton,
                { backgroundColor: period === p ? theme.primary : theme.card },
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  { color: period === p ? '#FFFFFF' : theme.text },
                ]}
              >
                {periodLabels[p]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Dates personnalisées */}
        {period === 'custom' && (
          <View style={[styles.customPeriod, { backgroundColor: theme.card }]}>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Du (YYYY-MM-DD)"
              placeholderTextColor={theme.muted}
              value={from}
              onChangeText={setFrom}
            />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              placeholder="Au (YYYY-MM-DD)"
              placeholderTextColor={theme.muted}
              value={to}
              onChangeText={setTo}
            />
          </View>
        )}

        {/* Stats principales */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{filteredData.totalHours.toFixed(1)}h</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Total heures</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={[styles.statValue, { color: theme.success }]}>{filteredData.totalAmount.toFixed(2)}€</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Revenus</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{filteredData.uniqueDays}</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Jours travaillés</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={styles.statIcon}>📈</Text>
            <Text style={[styles.statValue, { color: theme.primary}]}>{filteredData.avgHoursPerDay.toFixed(1)}h</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>Moy. / jour</Text>
          </View>
        </View>


        {/* Répartition par catégorie */}
        {byCategory.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>🏷️ Par catégorie</Text>
            {byCategory.map((cat) => (
              <View key={cat.name} style={[styles.categoryRow, { borderBottomColor: theme.border }]}>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryName, { color: theme.text }]}>{cat.name}</Text>
                  <Text style={[styles.categoryHours, { color: theme.muted }]}>{cat.hours}h</Text>
                </View>
                <Text style={[styles.categoryAmount, { color: theme.success }]}>{cat.amount.toFixed(2)}€</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={load}
          >
            <Text style={styles.actionButtonText}>📄 Générer facture</Text>
          </Pressable>
        </View>

        {/* État vide */}
        {filteredData.entries.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Aucune donnée</Text>
            <Text style={[styles.emptyText, { color: theme.muted }]}>
              Aucune entrée pour cette période
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal de facture */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>📄 Aperçu Facture</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Text style={[styles.modalClose, { color: theme.muted }]}>✕</Text>
              </Pressable>
            </View>

            <ScrollView>
              {data && (
                <>
                  {/* Résumé */}
                  <View style={[styles.summaryBox, { backgroundColor: theme.background }]}>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: theme.muted }]}>Période</Text>
                      <Text style={[styles.summaryValue, { color: theme.text }]}>
                        {data.from || '-'} → {data.to || '-'}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: theme.muted }]}>Total heures</Text>
                      <Text style={[styles.summaryValue, { color: theme.primary }]}>
                        {data.totalHours.toFixed(2)} h
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: theme.muted }]}>Total montant</Text>
                      <Text style={[styles.summaryValue, { color: theme.success, fontWeight: '700', fontSize: 20 }]}>
                        {data.totalAmount.toFixed(2)} €
                      </Text>
                    </View>
                  </View>

                  {/* Lignes */}
                  <View style={styles.linesSection}>
                    <Text style={[styles.linesSectionTitle, { color: theme.text }]}>Détail</Text>
                    {data.lines.map((l, i) => (
                      <View key={i} style={[styles.lineRow, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.lineDate, { color: theme.text }]}>{l.date}</Text>
                        <Text style={[styles.lineDetail, { color: theme.muted }]}>
                          {l.hours.toFixed(1)}h × {l.rate}€ = {l.amount.toFixed(2)}€
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Actions */}
                  <View style={styles.modalActions}>
                    <Pressable
                      style={[styles.modalActionButton, { backgroundColor: theme.primary, flex: 1 }]}
                      onPress={createPDF}
                    >
                      <Text style={styles.modalActionButtonText}>📄 PDF</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.modalActionButton, { backgroundColor: theme.success, flex: 1 }]}
                      onPress={exportExcel}
                    >
                      <Text style={styles.modalActionButtonText}>📊 Excel</Text>
                    </Pressable>
                  </View>
                </>
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
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  customPeriod: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
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
  section: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryHours: {
    fontSize: 14,
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  actions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
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
  summaryBox: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  linesSection: {
    marginBottom: 16,
  },
  linesSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  lineRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 4,
  },
  lineDate: {
    fontSize: 15,
    fontWeight: '600',
  },
  lineDetail: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalActionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

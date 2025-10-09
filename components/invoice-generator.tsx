import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCurrentUser } from '@/lib/api';
import { getClients, type Client } from '@/lib/clients';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

type InvoiceItem = {
  id: number;
  description: string;
  quantity: number;
  price: number;
  amount: number;
};

type InvoiceData = {
  fournisseur: {
    name: string;
    address: string;
    city: string;
    siret: string;
    autoEntrepreneurName: string;
    iban: string;
  };
  client: {
    name: string;
    address: string;
    city: string;
    siret: string;
  };
  dateEcheance: string;
  montantRegle: number;
  items: InvoiceItem[];
};

export default function InvoiceGenerator() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];

  const [factureNumber, setFactureNumber] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientPicker, setShowClientPicker] = useState(false);

  // Données fournisseur (auto-rempli depuis le profil)
  const [fournisseur, setFournisseur] = useState({
    name: '',
    address: '',
    city: '',
    siret: '',
    autoEntrepreneurName: '',
    iban: '',
  });

  // Données client
  const [client, setClient] = useState({
    name: '',
    address: '',
    city: '',
    siret: '',
  });

  const [dateEcheance, setDateEcheance] = useState('');
  const [montantRegle, setMontantRegle] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, description: '', quantity: 0, price: 0, amount: 0 },
  ]);
  const [total, setTotal] = useState(0);

  // Charger les données utilisateur et clients au démarrage
  useEffect(() => {
    loadUserData();
    loadClients();
    generateFactureNumber();
  }, []);

  async function loadUserData() {
    try {
      const user = await getCurrentUser();
      if (user) {
        // Charger toutes les données professionnelles depuis localStorage
        let siret = '';
        let companyName = '';
        let companyAddress = '';
        let companyCity = '';
        let iban = '';

        try {
          if (typeof localStorage !== 'undefined') {
            siret = localStorage.getItem('@siret') || '';
            companyName = localStorage.getItem('@companyName') || '';
            companyAddress = localStorage.getItem('@companyAddress') || '';
            companyCity = localStorage.getItem('@companyCity') || '';
            iban = localStorage.getItem('@iban') || '';
          }
        } catch {}

        setFournisseur({
          name: companyName || 'Auto-entreprise', // Pré-rempli depuis le profil
          address: companyAddress || '', // Pré-rempli depuis le profil
          city: companyCity || '', // Pré-rempli depuis le profil
          siret: siret,
          autoEntrepreneurName: `${user.firstName} ${user.lastName}`,
          iban: iban || '', // Pré-rempli depuis le profil
        });
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }
  }

  async function loadClients() {
    try {
      const clientsList = await getClients();
      setClients(clientsList);
    } catch (e) {
      console.error('Error loading clients:', e);
    }
  }

  function generateFactureNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const uuid = Math.random().toString(36).substring(2, 10).toUpperCase();
    const factureNum = `${year}${month}${day}-${uuid}`;
    setFactureNumber(factureNum);
  }

  function getCurrentDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function selectClient(selectedClient: Client) {
    setClient({
      name: selectedClient.name,
      address: '', // À compléter
      city: '', // À compléter
      siret: '', // À compléter
    });
    setShowClientPicker(false);
  }

  function addItem() {
    const newItem: InvoiceItem = {
      id: items.length + 1,
      description: '',
      quantity: 0,
      price: 0,
      amount: 0,
    };
    setItems([...items, newItem]);
  }

  function updateItem(id: number, field: keyof InvoiceItem, value: any) {
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };

        if (field === 'quantity' || field === 'price') {
          const quantity = field === 'quantity' ? value : item.quantity;
          const price = field === 'price' ? value : item.price;
          updatedItem.amount = quantity * price;
        }

        return updatedItem;
      }
      return item;
    });

    setItems(updatedItems);

    const newTotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    setTotal(newTotal);
  }

  function removeItem(id: number) {
    if (items.length > 1) {
      const updatedItems = items.filter((item) => item.id !== id);
      setItems(updatedItems);
      const newTotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
      setTotal(newTotal);
    }
  }

  function validateFields(): boolean {
    if (!fournisseur.name.trim()) {
      Alert.alert('Erreur', "Le nom de l'entreprise fournisseur est obligatoire");
      return false;
    }
    if (!fournisseur.autoEntrepreneurName.trim()) {
      Alert.alert('Erreur', "Le nom de l'auto-entrepreneur est obligatoire");
      return false;
    }
    if (!client.name.trim()) {
      Alert.alert('Erreur', 'Le nom du client est obligatoire');
      return false;
    }
    if (!dateEcheance) {
      Alert.alert('Erreur', "La date d'échéance est obligatoire");
      return false;
    }

    const hasValidItems = items.some(
      (item) => item.description.trim() && item.quantity > 0 && item.price > 0
    );
    if (!hasValidItems) {
      Alert.alert(
        'Erreur',
        'Au moins un article avec description, quantité et prix est obligatoire'
      );
      return false;
    }

    return true;
  }

  async function generatePDF() {
    if (!validateFields()) return;

    generateFactureNumber();

    const netAPayer = total - montantRegle;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .header div {
              flex: 1;
            }
            .header p {
              margin: 3px 0;
            }
            .section {
              margin-bottom: 20px;
            }
            .section p {
              margin: 5px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .total-section {
              margin-top: 20px;
              float: right;
              width: 300px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              border-bottom: 1px solid #ddd;
            }
            .total-row.bold {
              font-weight: bold;
              font-size: 16px;
            }
            .footer {
              margin-top: 80px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .bold {
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <p class="bold">Micro-entreprise : ${fournisseur.name}</p>
              <p>${fournisseur.address}</p>
              <p>${fournisseur.city}</p>
              <p>FRANCE</p>
              <p>SIRET : ${fournisseur.siret}</p>
              <p>Numéro de facture : ${factureNumber}</p>
            </div>
            <div>
              <p class="bold">Client :</p>
              <p>${client.name}</p>
              <p>${client.address || ''}</p>
              <p>${client.city || ''}</p>
              <p>FRANCE</p>
              ${client.siret ? `<p>SIRET : ${client.siret}</p>` : ''}
            </div>
          </div>

          <div class="section">
            <p class="bold">Auto-entrepreneur : ${fournisseur.autoEntrepreneurName}</p>
            ${fournisseur.iban ? `<p>IBAN : ${fournisseur.iban}</p>` : ''}
          </div>

          <div class="section">
            <p>Date de facturation : ${getCurrentDate()}</p>
            <p>À régler avant : ${new Date(dateEcheance).toLocaleDateString('fr-FR')}</p>
          </div>

          <div class="section">
            <p class="bold">Facture pour : ${client.name}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Description</th>
                <th class="text-center">Qté</th>
                <th class="text-right">Prix unit.</th>
                <th class="text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item) => `
                <tr>
                  <td>${String(item.id).padStart(3, '0')}</td>
                  <td>${item.description}</td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">${item.price.toFixed(2)} €</td>
                  <td class="text-right">${item.amount.toFixed(2)} €</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span class="bold">Total :</span>
              <span>${total.toFixed(2)} €</span>
            </div>
            <div class="total-row">
              <span class="bold">Total TTC :</span>
              <span>${total.toFixed(2)} €</span>
            </div>
            <div class="total-row">
              <span class="bold">Déjà réglé :</span>
              <span>${montantRegle.toFixed(2)} €</span>
            </div>
            <div class="total-row bold">
              <span>NET à payer :</span>
              <span>${netAPayer.toFixed(2)} €</span>
            </div>
          </div>

          <div class="footer">
            <p>Micro-entreprise ${fournisseur.name} - ${fournisseur.address}, ${fournisseur.city}</p>
            <p>TVA non applicable, article 293 B du CGI</p>
            <p>Page 1/1</p>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
      Alert.alert('Succès', 'Facture générée avec succès !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer la facture');
      console.error(error);
    }
  }

  const netAPayer = total - montantRegle;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: theme.success + '20', borderColor: theme.success }]}>
        <Text style={[styles.infoTitle, { color: theme.success }]}>
          ✅ Pré-remplissage automatique activé
        </Text>
        <Text style={[styles.infoText, { color: theme.text }]}>
          • Vos informations professionnelles sont automatiquement chargées depuis votre profil
        </Text>
        <Text style={[styles.infoText, { color: theme.text }]}>
          • Plus besoin de ressaisir votre SIRET, adresse, IBAN à chaque fois !
        </Text>
        <Text style={[styles.infoText, { color: theme.text }]}>
          • Modifiez-les dans l'onglet "Profil" si nécessaire
        </Text>
        <Text style={[styles.infoText, { color: theme.warning, fontWeight: '600' }]}>
          💡 Astuce : Sélectionnez un client existant pour gagner encore plus de temps
        </Text>
      </View>

      {/* Section Fournisseur */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>📋 Vos informations (auto-remplies ✅)</Text>
        <Text style={[styles.helperText, { color: theme.muted }]}>
          Ces informations proviennent de votre profil. Modifiez-les dans l'onglet "Profil" si nécessaire.
        </Text>
        
        <Text style={[styles.label, { color: theme.muted }]}>Nom de l'entreprise ✅</Text>
        <TextInput
          style={[styles.inputReadOnly, { color: theme.text, borderColor: theme.success, backgroundColor: theme.success + '10' }]}
          value={fournisseur.name}
          editable={false}
          placeholder="Configurez dans Profil"
          placeholderTextColor={theme.muted}
        />

        <Text style={[styles.label, { color: theme.muted }]}>Adresse ✅</Text>
        <TextInput
          style={[styles.inputReadOnly, { color: theme.text, borderColor: theme.success, backgroundColor: theme.success + '10' }]}
          value={fournisseur.address}
          editable={false}
          placeholder="Configurez dans Profil"
          placeholderTextColor={theme.muted}
        />

        <Text style={[styles.label, { color: theme.muted }]}>Ville et Code Postal ✅</Text>
        <TextInput
          style={[styles.inputReadOnly, { color: theme.text, borderColor: theme.success, backgroundColor: theme.success + '10' }]}
          value={fournisseur.city}
          editable={false}
          placeholder="Configurez dans Profil"
          placeholderTextColor={theme.muted}
        />

        <Text style={[styles.label, { color: theme.muted }]}>SIRET ✅</Text>
        <TextInput
          style={[styles.inputReadOnly, { color: theme.text, borderColor: theme.success, backgroundColor: theme.success + '10' }]}
          value={fournisseur.siret}
          editable={false}
          placeholder="Configurez dans Profil"
          placeholderTextColor={theme.muted}
        />

        <Text style={[styles.label, { color: theme.muted }]}>Nom de l'auto-entrepreneur ✅</Text>
        <TextInput
          style={[styles.inputReadOnly, { color: theme.text, borderColor: theme.success, backgroundColor: theme.success + '10' }]}
          value={fournisseur.autoEntrepreneurName}
          editable={false}
          placeholderTextColor={theme.muted}
        />

        <Text style={[styles.label, { color: theme.muted }]}>IBAN ✅</Text>
        <TextInput
          style={[styles.inputReadOnly, { color: theme.text, borderColor: theme.success, backgroundColor: theme.success + '10' }]}
          value={fournisseur.iban}
          editable={false}
          placeholder="Configurez dans Profil"
          placeholderTextColor={theme.muted}
        />

        <Text style={[styles.warningText, { color: theme.warning }]}>
          ⚠️ Pour modifier ces informations, allez dans l'onglet "Profil" → Section "💼 Informations professionnelles"
        </Text>
      </View>

      {/* Section Client */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>👤 Informations Client</Text>
        
        <Pressable
          style={[styles.button, { backgroundColor: theme.secondary }]}
          onPress={() => setShowClientPicker(true)}
        >
          <Text style={styles.buttonText}>📋 Sélectionner un client existant</Text>
        </Pressable>

        <Text style={[styles.label, { color: theme.muted }]}>Nom du client</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          value={client.name}
          onChangeText={(text) => setClient({ ...client, name: text })}
          placeholder="Ex: Société ABC"
          placeholderTextColor={theme.muted}
        />

        <Text style={[styles.label, { color: theme.muted }]}>Adresse</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          value={client.address}
          onChangeText={(text) => setClient({ ...client, address: text })}
          placeholder="Ex: 20 Avenue des Champs"
          placeholderTextColor={theme.muted}
        />

        <Text style={[styles.label, { color: theme.muted }]}>Ville et Code Postal</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          value={client.city}
          onChangeText={(text) => setClient({ ...client, city: text })}
          placeholder="Ex: 75008 Paris"
          placeholderTextColor={theme.muted}
        />

        <Text style={[styles.label, { color: theme.muted }]}>SIRET (optionnel)</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          value={client.siret}
          onChangeText={(text) => setClient({ ...client, siret: text })}
          placeholder="14 chiffres"
          placeholderTextColor={theme.muted}
          keyboardType="numeric"
          maxLength={14}
        />

        <Text style={[styles.label, { color: theme.muted }]}>Date d'échéance</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
          value={dateEcheance}
          onChangeText={setDateEcheance}
          placeholder="AAAA-MM-JJ"
          placeholderTextColor={theme.muted}
        />
      </View>

      {/* Section Articles */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📦 Articles / Prestations</Text>
          <Pressable
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={addItem}
          >
            <Text style={styles.buttonText}>+ Ajouter</Text>
          </Pressable>
        </View>

        {items.map((item, index) => (
          <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemNumber, { color: theme.muted }]}>
                Ligne {String(item.id).padStart(2, '0')}
              </Text>
              {items.length > 1 && (
                <Pressable onPress={() => removeItem(item.id)}>
                  <Text style={[styles.removeText, { color: theme.danger }]}>✕ Supprimer</Text>
                </Pressable>
              )}
            </View>

            <Text style={[styles.label, { color: theme.muted }]}>Description</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              value={item.description}
              onChangeText={(text) => updateItem(item.id, 'description', text)}
              placeholder="Ex: Développement site web"
              placeholderTextColor={theme.muted}
              multiline
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={[styles.label, { color: theme.muted }]}>Quantité</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  value={String(item.quantity || '')}
                  onChangeText={(text) => updateItem(item.id, 'quantity', Number(text) || 0)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.muted}
                />
              </View>

              <View style={styles.halfWidth}>
                <Text style={[styles.label, { color: theme.muted }]}>Prix unitaire (€)</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  value={String(item.price || '')}
                  onChangeText={(text) => updateItem(item.id, 'price', Number(text) || 0)}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={theme.muted}
                />
              </View>
            </View>

            <Text style={[styles.itemTotal, { color: theme.primary }]}>
              Montant: {item.amount.toFixed(2)} €
            </Text>
          </View>
        ))}

        {/* Totaux */}
        <View style={[styles.totalsCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total HT :</Text>
            <Text style={[styles.totalValue, { color: theme.text }]}>{total.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total TTC :</Text>
            <Text style={[styles.totalValue, { color: theme.text }]}>{total.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Déjà réglé :</Text>
            <TextInput
              style={[styles.totalInput, { color: theme.text, borderColor: theme.border }]}
              value={String(montantRegle || '')}
              onChangeText={(text) => setMontantRegle(Number(text) || 0)}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={theme.muted}
            />
          </View>
          <View style={[styles.totalRow, styles.finalTotal]}>
            <Text style={[styles.totalLabel, styles.bold, { color: theme.primary }]}>
              NET À PAYER :
            </Text>
            <Text style={[styles.totalValue, styles.bold, { color: theme.primary }]}>
              {netAPayer.toFixed(2)} €
            </Text>
          </View>
        </View>
      </View>

      {/* Bouton Générer */}
      <Pressable
        style={[styles.generateButton, { backgroundColor: theme.success }]}
        onPress={generatePDF}
      >
        <Text style={styles.generateButtonText}>📄 Générer la facture PDF</Text>
      </Pressable>

      {/* Modal sélection client */}
      <Modal visible={showClientPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Sélectionner un client</Text>
            <ScrollView style={styles.clientList}>
              {clients.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.muted }]}>
                  Aucun client enregistré. Ajoutez-en dans l'onglet "Clients".
                </Text>
              ) : (
                clients.map((c) => (
                  <Pressable
                    key={c.id}
                    style={[styles.clientItem, { borderBottomColor: theme.border }]}
                    onPress={() => selectClient(c)}
                  >
                    <Text style={[styles.clientName, { color: theme.text }]}>{c.name}</Text>
                    {c.defaultRate && (
                      <Text style={[styles.clientRate, { color: theme.muted }]}>
                        {c.defaultRate} €/h
                      </Text>
                    )}
                  </Pressable>
                ))
              )}
            </ScrollView>
            <Pressable
              style={[styles.closeButton, { backgroundColor: theme.danger }]}
              onPress={() => setShowClientPicker(false)}
            >
              <Text style={styles.buttonText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  infoBanner: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  infoText: { fontSize: 13, marginBottom: 4 },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  helperText: { fontSize: 13, marginBottom: 12, fontStyle: 'italic' },
  warningText: { fontSize: 13, marginTop: 12, fontWeight: '600', fontStyle: 'italic' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 8,
  },
  inputReadOnly: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '600',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  itemCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNumber: { fontSize: 14, fontWeight: '700' },
  removeText: { fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  halfWidth: { flex: 1 },
  itemTotal: { fontSize: 16, fontWeight: '700', marginTop: 8, textAlign: 'right' },
  totalsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: { fontSize: 15, fontWeight: '600' },
  totalValue: { fontSize: 15, fontWeight: '600' },
  totalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 15,
    width: 100,
    textAlign: 'right',
  },
  finalTotal: { borderTopWidth: 2, borderTopColor: '#ddd', paddingTop: 12, marginTop: 8 },
  bold: { fontSize: 17, fontWeight: '700' },
  generateButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  generateButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: { borderRadius: 12, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  clientList: { maxHeight: 400, marginBottom: 16 },
  clientItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  clientName: { fontSize: 16, fontWeight: '600' },
  clientRate: { fontSize: 13, marginTop: 4 },
  emptyText: { fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  closeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});


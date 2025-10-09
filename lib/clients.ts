import { storage } from './storage';

// ============================================================
// CLIENT : Entreprise ou personne pour qui vous travaillez
// ============================================================
export type Client = {
  id: string;
  name: string; // Nom du client (ex: Restaurant Le Gourmet)
  address?: string; // Adresse du client
  city?: string; // Ville
  postalCode?: string; // Code postal
  siret?: string; // Numéro SIRET du client
  color: string; // Couleur pour identification visuelle
  description?: string; // Notes additionnelles
};

// ============================================================
// ACTIVITÉ : Type de travail effectué pour un client
// ============================================================
export type Activity = {
  id: string;
  name: string; // Nom de l'activité (ex: Service, Plonge, Cuisine)
  defaultRate?: number; // Taux horaire pour cette activité
  color: string; // Couleur pour identification visuelle
  description?: string; // Description de l'activité
};

const CLIENTS_KEY = '@clients';
const ACTIVITIES_KEY = '@activities';

// ============================================================
// CLIENTS - CRUD
// ============================================================

export async function getClients(): Promise<Client[]> {
  try {
    const raw = await storage.getItem(CLIENTS_KEY);
    if (raw) {
      const clients = JSON.parse(raw);
      console.log('📇 Clients chargés depuis le storage:', clients.length);
      return clients;
    }
  } catch (e) {
    console.error('Error loading clients:', e);
  }
  console.log('📇 Aucun client trouvé, retour tableau vide');
  return [];
}

export async function addClient(client: Omit<Client, 'id'>): Promise<Client> {
  try {
    const id = 'client_' + Date.now().toString();
    const newClient: Client = { id, ...client };
    const clients = await getClients();
    clients.push(newClient);
    await storage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    console.log('✅ Client ajouté:', newClient.name, '- Total:', clients.length);
    return newClient;
  } catch (e) {
    console.error('Error adding client:', e);
    throw e;
  }
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<void> {
  try {
    const clients = await getClients();
    const index = clients.findIndex(c => c.id === id);
    if (index >= 0) {
      clients[index] = { ...clients[index], ...updates };
      await storage.setItem(CLIENTS_KEY, JSON.stringify(clients));
      console.log('✅ Client mis à jour:', clients[index].name);
    }
  } catch (e) {
    console.error('Error updating client:', e);
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    const clients = await getClients();
    const filtered = clients.filter(c => c.id !== id);
    await storage.setItem(CLIENTS_KEY, JSON.stringify(filtered));
    console.log('✅ Client supprimé - Total:', filtered.length);
  } catch (e) {
    console.error('Error deleting client:', e);
  }
}

// ============================================================
// ACTIVITÉS - CRUD
// ============================================================

export async function getActivities(): Promise<Activity[]> {
  try {
    const raw = await storage.getItem(ACTIVITIES_KEY);
    if (raw) {
      const activities = JSON.parse(raw);
      console.log('📋 Activités chargées depuis le storage:', activities.length);
      return activities;
    }
  } catch (e) {
    console.error('Error loading activities:', e);
  }
  console.log('📋 Aucune activité trouvée, retour tableau vide');
  return [];
}

export async function addActivity(activity: Omit<Activity, 'id'>): Promise<Activity> {
  try {
    const id = 'activity_' + Date.now().toString();
    const newActivity: Activity = { id, ...activity };
    const activities = await getActivities();
    activities.push(newActivity);
    await storage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
    console.log('✅ Activité ajoutée:', newActivity.name, '- Total:', activities.length);
    return newActivity;
  } catch (e) {
    console.error('Error adding activity:', e);
    throw e;
  }
}

export async function updateActivity(id: string, updates: Partial<Activity>): Promise<void> {
  try {
    const activities = await getActivities();
    const index = activities.findIndex(a => a.id === id);
    if (index >= 0) {
      activities[index] = { ...activities[index], ...updates };
      await storage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
      console.log('✅ Activité mise à jour:', activities[index].name);
    }
  } catch (e) {
    console.error('Error updating activity:', e);
  }
}

export async function deleteActivity(id: string): Promise<void> {
  try {
    const activities = await getActivities();
    const filtered = activities.filter(a => a.id !== id);
    await storage.setItem(ACTIVITIES_KEY, JSON.stringify(filtered));
    console.log('✅ Activité supprimée - Total:', filtered.length);
  } catch (e) {
    console.error('Error deleting activity:', e);
  }
}

// ============================================================
// COULEURS PRÉDÉFINIES
// ============================================================

export const CLIENT_COLORS = [
  '#3B82F6', // Bleu
  '#8B5CF6', // Violet
  '#EC4899', // Rose
  '#F59E0B', // Ambre
  '#10B981', // Vert
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
];

export const ACTIVITY_COLORS = [
  '#10B981', // Vert
  '#F59E0B', // Jaune
  '#EF4444', // Rouge
  '#F97316', // Orange
  '#8B5CF6', // Violet
  '#EC4899', // Rose
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
];

// ============================================================
// UTILITAIRE : Mélanger 2 couleurs (50/50)
// ============================================================

export function blendColors(color1: string, color2: string): string {
  // Convertir hex en RGB
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);
  
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);
  
  // Mélange 50/50
  const r = Math.round((r1 + r2) / 2);
  const g = Math.round((g1 + g2) / 2);
  const b = Math.round((b1 + b2) / 2);
  
  // Retour en hex
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

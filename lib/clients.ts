// Client/Activity management for auto-entrepreneurs
// An auto-entrepreneur has ONE business (SIREN) but can manage multiple clients or activities
export type Client = {
  id: string;
  name: string; // Client name or activity description
  address?: string; // Adresse du client
  city?: string; // Ville
  postalCode?: string; // Code postal
  siret?: string; // Numéro SIRET du client
  defaultRate?: number; // Hourly rate for this client/activity
  color?: string; // Color for visual identification
  type?: 'client' | 'activity'; // Distinguish between a client or an activity
  description?: string; // Additional details
};

const CLIENTS_KEY = '@clients';

export async function getClients(): Promise<Client[]> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CLIENTS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (e) {
    console.error('Error loading clients:', e);
  }
  return [];
}

export async function addClient(client: Omit<Client, 'id'>): Promise<Client> {
  try {
    const id = Date.now().toString();
    const newClient: Client = { id, ...client };
    const clients = await getClients();
    clients.push(newClient);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    }
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
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
      }
    }
  } catch (e) {
    console.error('Error updating client:', e);
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    const clients = await getClients();
    const filtered = clients.filter(c => c.id !== id);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('Error deleting client:', e);
  }
}



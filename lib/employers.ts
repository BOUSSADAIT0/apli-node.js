// Employer/Project management
export type Employer = {
  id: string;
  name: string;
  defaultRate?: number;
  color?: string;
};

const EMPLOYERS_KEY = '@employers';

export async function getEmployers(): Promise<Employer[]> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(EMPLOYERS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (e) {
    console.error('Error loading employers:', e);
  }
  return [];
}

export async function addEmployer(employer: Omit<Employer, 'id'>): Promise<Employer> {
  try {
    const id = Date.now().toString();
    const newEmployer: Employer = { id, ...employer };
    const employers = await getEmployers();
    employers.push(newEmployer);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(EMPLOYERS_KEY, JSON.stringify(employers));
    }
    return newEmployer;
  } catch (e) {
    console.error('Error adding employer:', e);
    throw e;
  }
}

export async function updateEmployer(id: string, updates: Partial<Employer>): Promise<void> {
  try {
    const employers = await getEmployers();
    const index = employers.findIndex(e => e.id === id);
    if (index >= 0) {
      employers[index] = { ...employers[index], ...updates };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(EMPLOYERS_KEY, JSON.stringify(employers));
      }
    }
  } catch (e) {
    console.error('Error updating employer:', e);
  }
}

export async function deleteEmployer(id: string): Promise<void> {
  try {
    const employers = await getEmployers();
    const filtered = employers.filter(e => e.id !== id);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(EMPLOYERS_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('Error deleting employer:', e);
  }
}



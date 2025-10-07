// Predefined work categories with ability to add custom ones
export const DEFAULT_CATEGORIES = [
  'Standard',
  'Heures supplémentaires',
  'Travail de nuit',
  'Weekend',
  'Jours fériés',
  'Télétravail',
  'Déplacement',
  'Formation',
  'Réunion',
  'Support',
];

const CUSTOM_CATEGORIES_KEY = '@custom_categories';

export async function getCategories(): Promise<string[]> {
  try {
    if (typeof localStorage !== 'undefined') {
      const custom = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      if (custom) {
        const parsed = JSON.parse(custom);
        return [...DEFAULT_CATEGORIES, ...parsed];
      }
    }
  } catch (e) {
    console.error('Error loading custom categories:', e);
  }
  return DEFAULT_CATEGORIES;
}

export async function addCategory(category: string): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      const custom = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      const existing = custom ? JSON.parse(custom) : [];
      if (!existing.includes(category) && !DEFAULT_CATEGORIES.includes(category)) {
        existing.push(category);
        localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(existing));
      }
    }
  } catch (e) {
    console.error('Error adding category:', e);
  }
}

export async function removeCategory(category: string): Promise<void> {
  try {
    if (DEFAULT_CATEGORIES.includes(category)) {
      throw new Error('Cannot remove default category');
    }
    if (typeof localStorage !== 'undefined') {
      const custom = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      if (custom) {
        const existing = JSON.parse(custom);
        const filtered = existing.filter((c: string) => c !== category);
        localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(filtered));
      }
    }
  } catch (e) {
    console.error('Error removing category:', e);
  }
}



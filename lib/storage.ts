// Unified storage adapter for web (localStorage) and mobile (AsyncStorage)

let AsyncStorage: any = null;

// Try to import AsyncStorage for mobile
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  // AsyncStorage not available (web), will use localStorage
}

/**
 * Universal storage that works on both web and mobile
 */
export const storage = {
  /**
   * Get an item from storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      // Mobile: use AsyncStorage
      if (AsyncStorage) {
        return await AsyncStorage.getItem(key);
      }
      
      // Web: use localStorage
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      
      return null;
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },

  /**
   * Set an item in storage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      // Mobile: use AsyncStorage
      if (AsyncStorage) {
        await AsyncStorage.setItem(key, value);
        return;
      }
      
      // Web: use localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },

  /**
   * Remove an item from storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      // Mobile: use AsyncStorage
      if (AsyncStorage) {
        await AsyncStorage.removeItem(key);
        return;
      }
      
      // Web: use localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    try {
      // Mobile: use AsyncStorage
      if (AsyncStorage) {
        await AsyncStorage.clear();
        return;
      }
      
      // Web: use localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
};


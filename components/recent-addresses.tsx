import { storage } from '@/lib/storage';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type RecentAddress = {
  address: string;
  latitude: number;
  longitude: number;
  timestamp: number;
};

type Props = {
  onAddressSelect: (address: string, latitude: number, longitude: number) => void;
};

const RECENT_ADDRESSES_KEY = '@recent_addresses';
const MAX_RECENT_ADDRESSES = 5;

export default function RecentAddresses({ onAddressSelect }: Props) {
  const [recentAddresses, setRecentAddresses] = useState<RecentAddress[]>([]);

  useEffect(() => {
    loadRecentAddresses();
  }, []);

  const loadRecentAddresses = async () => {
    try {
      const stored = await storage.getItem(RECENT_ADDRESSES_KEY);
      if (stored) {
        const addresses = JSON.parse(stored);
        setRecentAddresses(addresses);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des adresses récentes:', error);
    }
  };

  const saveAddressToRecent = async (address: string, latitude: number, longitude: number) => {
    try {
      const newAddress: RecentAddress = {
        address,
        latitude,
        longitude,
        timestamp: Date.now(),
      };

      // Charger les adresses existantes
      const stored = await storage.getItem(RECENT_ADDRESSES_KEY);
      let addresses: RecentAddress[] = stored ? JSON.parse(stored) : [];

      // Supprimer les doublons et ajouter la nouvelle adresse en premier
      addresses = addresses.filter(addr => addr.address !== address);
      addresses.unshift(newAddress);

      // Garder seulement les 5 plus récentes
      addresses = addresses.slice(0, MAX_RECENT_ADDRESSES);

      // Sauvegarder
      await storage.setItem(RECENT_ADDRESSES_KEY, JSON.stringify(addresses));
      setRecentAddresses(addresses);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'adresse récente:', error);
    }
  };

  const selectRecentAddress = (address: RecentAddress) => {
    onAddressSelect(address.address, address.latitude, address.longitude);
  };

  const formatAddressForDisplay = (address: string) => {
    // Tronquer l'adresse si elle est trop longue
    return address.length > 50 ? address.substring(0, 47) + '...' : address;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  if (recentAddresses.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Adresses récentes</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recentAddresses.map((address, index) => (
          <Pressable
            key={index}
            style={styles.addressCard}
            onPress={() => selectRecentAddress(address)}
          >
            <View style={styles.addressHeader}>
              <Text style={styles.addressIcon}>📍</Text>
              <Text style={styles.timeAgo}>{formatTimeAgo(address.timestamp)}</Text>
            </View>
            
            <Text style={styles.addressText}>
              {formatAddressForDisplay(address.address)}
            </Text>
            
            <Text style={styles.coordinatesText}>
              {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      
      <Text style={styles.hint}>
        💡 Touchez une adresse pour la réutiliser
      </Text>
    </View>
  );
}

// Fonction utilitaire pour ajouter une adresse récente (à utiliser depuis le composant parent)
export const addRecentAddress = async (address: string, latitude: number, longitude: number) => {
  try {
    const newAddress: RecentAddress = {
      address,
      latitude,
      longitude,
      timestamp: Date.now(),
    };

    const stored = await storage.getItem(RECENT_ADDRESSES_KEY);
    let addresses: RecentAddress[] = stored ? JSON.parse(stored) : [];

    // Supprimer les doublons et ajouter la nouvelle adresse en premier
    addresses = addresses.filter(addr => addr.address !== address);
    addresses.unshift(newAddress);

    // Garder seulement les 5 plus récentes
    addresses = addresses.slice(0, MAX_RECENT_ADDRESSES);

    await storage.setItem(RECENT_ADDRESSES_KEY, JSON.stringify(addresses));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'adresse récente:', error);
  }
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 8,
  },
  scrollContent: {
    paddingRight: 16,
  },
  addressCard: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 200,
    maxWidth: 250,
    borderWidth: 1,
    borderColor: '#374151',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addressIcon: {
    fontSize: 16,
  },
  timeAgo: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  addressText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    lineHeight: 16,
  },
  coordinatesText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import RecentAddresses, { addRecentAddress } from './recent-addresses';

type AddressSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
  importance: number;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
};

type Props = {
  address: string;
  onAddressChange: (address: string) => void;
  onLocationFound: (latitude: number, longitude: number) => void;
  disabled?: boolean;
};

export default function AddressAutocomplete({ 
  address, 
  onAddressChange, 
  onLocationFound, 
  disabled = false 
}: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearch, setLastSearch] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour rechercher des suggestions d'adresses
  const searchAddresses = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const encodedQuery = encodeURIComponent(query.trim() + ', France');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5&countrycodes=fr&addressdetails=1&extratags=1`
      );
      
      const data = await response.json();
      setSuggestions(data || []);
      setShowSuggestions(data && data.length > 0);
    } catch (error) {
      console.error('Erreur de recherche d\'adresses:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Recherche avec debounce (éviter trop de requêtes)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (address !== lastSearch) {
      searchTimeoutRef.current = setTimeout(() => {
        searchAddresses(address);
        setLastSearch(address);
      }, 500); // Attendre 500ms après la dernière frappe
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [address, lastSearch]);

  // Fonction pour formater une adresse de manière lisible
  const formatAddress = (suggestion: AddressSuggestion) => {
    const addr = suggestion.address;
    if (!addr) return suggestion.display_name;

    const parts = [];
    if (addr.house_number && addr.road) {
      parts.push(`${addr.house_number} ${addr.road}`);
    } else if (addr.road) {
      parts.push(addr.road);
    }
    
    if (addr.postcode && addr.city) {
      parts.push(`${addr.postcode} ${addr.city}`);
    } else if (addr.city) {
      parts.push(addr.city);
    }

    return parts.length > 0 ? parts.join(', ') : suggestion.display_name;
  };

  // Fonction pour sélectionner une suggestion
  const selectSuggestion = async (suggestion: AddressSuggestion) => {
    const formattedAddress = formatAddress(suggestion);
    const latitude = parseFloat(suggestion.lat);
    const longitude = parseFloat(suggestion.lon);
    
    onAddressChange(formattedAddress);
    onLocationFound(latitude, longitude);
    
    // Sauvegarder dans les adresses récentes
    await addRecentAddress(formattedAddress, latitude, longitude);
    
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Fonction pour géocoder l'adresse actuelle
  const geocodeCurrentAddress = async () => {
    if (!address.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir une adresse');
      return;
    }

    setIsLoading(true);
    try {
      const encodedAddress = encodeURIComponent(address.trim() + ', France');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=fr&addressdetails=1`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        const foundAddress = formatAddress(result);
        
        // Proposer l'adresse trouvée si elle est différente
        if (foundAddress !== address.trim()) {
          Alert.alert(
            'Adresse trouvée',
            `Voulez-vous utiliser cette adresse ?\n\n${foundAddress}`,
            [
              { text: 'Non', style: 'cancel' },
              { 
                text: 'Oui', 
                onPress: async () => {
                  onAddressChange(foundAddress);
                  onLocationFound(latitude, longitude);
                  await addRecentAddress(foundAddress, latitude, longitude);
                }
              },
            ]
          );
        } else {
          onLocationFound(latitude, longitude);
          await addRecentAddress(address.trim(), latitude, longitude);
          Alert.alert('✅ Succès', 'Coordonnées trouvées !');
        }
      } else {
        Alert.alert('Erreur', 'Adresse non trouvée. Vérifiez l\'orthographe.');
      }
    } catch (error) {
      console.error('Erreur de géocodage:', error);
      Alert.alert('Erreur', 'Impossible de localiser l\'adresse. Vérifiez votre connexion internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>📍 Adresse complète</Text>
      
      {/* Adresses récentes */}
      <RecentAddresses 
        onAddressSelect={(address, latitude, longitude) => {
          onAddressChange(address);
          onLocationFound(latitude, longitude);
        }}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={onAddressChange}
          placeholder="Commencez à taper une adresse..."
          placeholderTextColor="#6B7280"
          multiline
          numberOfLines={2}
          editable={!disabled}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        
        {/* Indicateur de chargement */}
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <Text style={styles.loadingText}>🔍</Text>
          </View>
        )}
      </View>

      {/* Suggestions d'adresses */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView 
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((suggestion, index) => (
              <Pressable
                key={index}
                style={styles.suggestionItem}
                onPress={() => selectSuggestion(suggestion)}
              >
                <Text style={styles.suggestionText}>
                  📍 {formatAddress(suggestion)}
                </Text>
                <Text style={styles.suggestionDetails}>
                  {suggestion.address?.city && suggestion.address?.postcode && 
                    `${suggestion.address.postcode} ${suggestion.address.city}`
                  }
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bouton de géocodage manuel */}
      <Pressable
        style={[
          styles.geocodeButton,
          (!address.trim() || isLoading || disabled) && styles.geocodeButtonDisabled,
        ]}
        onPress={geocodeCurrentAddress}
        disabled={!address.trim() || isLoading || disabled}
      >
        <Text style={styles.geocodeButtonText}>
          {isLoading ? '🔍 Recherche...' : '🗺️ Localiser automatiquement'}
        </Text>
      </Pressable>
      
      {/* Conseils pour l'utilisateur */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Conseils :</Text>
        <Text style={styles.tipText}>
          • Tapez au moins 3 caractères pour voir les suggestions
        </Text>
        <Text style={styles.tipText}>
          • Incluez le numéro, la rue et la ville pour de meilleurs résultats
        </Text>
        <Text style={styles.tipText}>
          • Exemple : "12 Rue de la Paix, Paris" ou "1 Avenue des Champs-Élysées, 75008 Paris"
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#1F2937',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#374151',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  loadingText: {
    fontSize: 20,
    color: '#3B82F6',
  },
  suggestionsContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    marginTop: 4,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  suggestionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  suggestionDetails: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  geocodeButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  geocodeButtonDisabled: {
    backgroundColor: '#374151',
  },
  geocodeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  tipsContainer: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  tipsTitle: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 16,
  },
});

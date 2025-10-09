import type { Client } from '@/lib/clients';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  clients: Client[];
  onClientSelect?: (client: Client) => void;
  selectedClient?: Client | null;
};

export default function ClientMapWeb({ clients, onClientSelect, selectedClient }: Props) {
  const [mapReady, setMapReady] = useState(false);

  // Filtrer les clients qui ont des coordonnées
  const clientsWithLocation = clients.filter(client => 
    client.latitude !== undefined && 
    client.longitude !== undefined &&
    client.latitude !== null && 
    client.longitude !== null
  );

  // Calculer la région de la carte basée sur les clients
  const getMapCenter = () => {
    if (clientsWithLocation.length === 0) {
      // Centre par défaut sur Paris
      return { latitude: 48.8566, longitude: 2.3522 };
    }

    if (clientsWithLocation.length === 1) {
      const client = clientsWithLocation[0];
      return { latitude: client.latitude!, longitude: client.longitude! };
    }

    // Calculer le centre pour afficher tous les clients
    const latitudes = clientsWithLocation.map(c => c.latitude!);
    const longitudes = clientsWithLocation.map(c => c.longitude!);
    
    const avgLat = latitudes.reduce((sum, lat) => sum + lat, 0) / latitudes.length;
    const avgLng = longitudes.reduce((sum, lng) => sum + lng, 0) / longitudes.length;
    
    return { latitude: avgLat, longitude: avgLng };
  };

  useEffect(() => {
    setMapReady(true);
  }, []);

  const center = getMapCenter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Localisation des clients</Text>
      
      {clientsWithLocation.length === 0 ? (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            📍 Aucun client avec localisation
          </Text>
          <Text style={styles.noDataSubtext}>
            Ajoutez des coordonnées aux clients pour les voir sur la carte
          </Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          {/* Carte simulée avec OpenStreetMap */}
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapTitle}>🗺️ Carte des clients</Text>
            <Text style={styles.mapSubtitle}>
              Centre: {center.latitude.toFixed(4)}, {center.longitude.toFixed(4)}
            </Text>
            
            {/* Liste des clients avec leurs coordonnées */}
            <View style={styles.clientsList}>
              {clientsWithLocation.map((client) => (
                <View
                  key={client.id}
                  style={[
                    styles.clientMarker,
                    selectedClient?.id === client.id && styles.clientMarkerSelected,
                  ]}
                  onTouchEnd={() => onClientSelect?.(client)}
                >
                  <View
                    style={[
                      styles.markerDot,
                      { backgroundColor: client.color },
                    ]}
                  />
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{client.name}</Text>
                    <Text style={styles.clientCoords}>
                      📍 {client.latitude?.toFixed(4)}, {client.longitude?.toFixed(4)}
                    </Text>
                    {client.address && (
                      <Text style={styles.clientAddress}>{client.address}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
          
          {/* Lien vers Google Maps */}
          <View style={styles.externalMapContainer}>
            <Text style={styles.externalMapText}>
              💡 Pour une carte interactive, ouvrez dans :
            </Text>
            <View style={styles.externalMapButtons}>
              <View
                style={styles.externalMapButton}
                onTouchEnd={() => {
                  const coords = `${center.latitude},${center.longitude}`;
                  const url = `https://www.google.com/maps?q=${coords}`;
                  // Sur mobile, cela ouvrira l'app Google Maps
                  console.log('Ouvrir Google Maps:', url);
                }}
              >
                <Text style={styles.externalMapButtonText}>🗺️ Google Maps</Text>
              </View>
              
              <View
                style={styles.externalMapButton}
                onTouchEnd={() => {
                  const coords = `${center.longitude},${center.latitude}`;
                  const url = `https://www.openstreetmap.org/?mlat=${center.latitude}&mlon=${center.longitude}&zoom=12`;
                  console.log('Ouvrir OpenStreetMap:', url);
                }}
              >
                <Text style={styles.externalMapButtonText}>🌍 OpenStreetMap</Text>
              </View>
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.legend}>
        <Text style={styles.legendText}>
          📍 {clientsWithLocation.length} client{clientsWithLocation.length > 1 ? 's' : ''} localisé{clientsWithLocation.length > 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    paddingVertical: 16,
    backgroundColor: '#374151',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noDataSubtext: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#374151',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  mapTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  clientsList: {
    flex: 1,
  },
  clientMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  clientMarkerSelected: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#1E3A8A',
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  clientCoords: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  clientAddress: {
    color: '#6B7280',
    fontSize: 14,
  },
  externalMapContainer: {
    backgroundColor: '#1F2937',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
  },
  externalMapText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  externalMapButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  externalMapButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  externalMapButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  legend: {
    backgroundColor: '#374151',
    padding: 12,
    alignItems: 'center',
  },
  legendText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
});

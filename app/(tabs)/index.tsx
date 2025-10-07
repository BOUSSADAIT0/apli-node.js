import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getCurrentUser, logout } from '@/lib/api';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Feature = {
  icon: string;
  title: string;
  description: string;
  color: string;
};

const features: Feature[] = [
  {
    icon: '⏱️',
    title: 'Suivi des heures',
    description: 'Enregistrez vos heures de travail avec précision : date, heure de début/fin, pauses incluses.',
    color: '#3B82F6',
  },
  {
    icon: '📅',
    title: 'Calendrier mensuel',
    description: 'Visualisez vos journées travaillées sur un calendrier. Cliquez sur un jour pour ajouter ou modifier une entrée.',
    color: '#10B981',
  },
  {
    icon: '💰',
    title: 'Calcul automatique',
    description: 'Définissez votre taux horaire et obtenez automatiquement le montant gagné par jour, semaine et mois.',
    color: '#F59E0B',
  },
  {
    icon: '📍',
    title: 'Géolocalisation',
    description: 'Capturez automatiquement votre position GPS et l\'adresse de votre lieu de travail en un clic.',
    color: '#EF4444',
  },
  {
    icon: '🏢',
    title: 'Multi-clients/activités',
    description: 'Gérez plusieurs clients ou activités sous votre statut auto-entrepreneur avec des taux horaires personnalisés.',
    color: '#8B5CF6',
  },
  {
    icon: '🏷️',
    title: 'Catégories personnalisables',
    description: 'Créez vos propres catégories (heures normales, heures sup., weekend, nuit, etc.) pour mieux organiser votre temps.',
    color: '#EC4899',
  },
  {
    icon: '📄',
    title: 'Facturation PDF',
    description: 'Générez des factures professionnelles en PDF avec logo, récapitulatif détaillé et export par email.',
    color: '#06B6D4',
  },
  {
    icon: '📊',
    title: 'Export Excel',
    description: 'Exportez vos données en format Excel/CSV pour votre comptabilité ou vos déclarations.',
    color: '#14B8A6',
  },
  {
    icon: '🔔',
    title: 'Notifications',
    description: 'Recevez des rappels en fin de journée pour enregistrer vos heures et des résumés hebdomadaires.',
    color: '#F97316',
  },
  {
    icon: '👤',
    title: 'Profil personnalisé',
    description: 'Ajoutez votre photo de profil, vos coordonnées (email, téléphone) et gérez votre compte en toute sécurité.',
    color: '#6366F1',
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'dark'];
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserName(`${user.firstName} ${user.lastName}`);
      }
    } catch (e) {
      console.log('No user loaded', e);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/auth/login');
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.headerTitle}>⏰ Heures Travaillées</Text>
        <Text style={styles.headerSubtitle}>Gestion complète de vos heures de travail</Text>
        {userName ? <Text style={styles.headerUser}>Bienvenue, {userName} !</Text> : null}
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={[styles.welcomeTitle, { color: theme.text }]}>
          Bienvenue dans votre application de suivi des heures ! 👋
        </Text>
        <Text style={[styles.welcomeText, { color: theme.muted }]}>
          Application conçue pour les <Text style={{ fontWeight: '700' }}>auto-entrepreneurs en France</Text>. 
          Gérez facilement vos heures de travail pour toutes vos activités et clients sous votre statut unique, 
          calculez vos gains, et générez des factures professionnelles.
        </Text>
      </View>

      {/* Features Grid */}
      <View style={styles.featuresSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>✨ Fonctionnalités</Text>
        {features.map((feature, index) => (
          <View
            key={index}
            style={[
              styles.featureCard,
              { backgroundColor: theme.card, borderLeftColor: feature.color },
            ]}
          >
            <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
              <Text style={styles.featureIconText}>{feature.icon}</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
              <Text style={[styles.featureDescription, { color: theme.muted }]}>
                {feature.description}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>🚀 Démarrage rapide</Text>
        
        <View style={[styles.actionCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.actionTitle, { color: theme.text }]}>1. Configurez votre profil</Text>
          <Text style={[styles.actionText, { color: theme.muted }]}>
            Allez dans l'onglet "Profil" pour ajouter votre photo, vos informations personnelles et votre numéro SIRET.
          </Text>
        </View>

        <View style={[styles.actionCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.actionTitle, { color: theme.text }]}>2. Ajoutez vos clients/activités</Text>
          <Text style={[styles.actionText, { color: theme.muted }]}>
            Dans l'onglet "Clients", créez vos différents clients ou activités avec leurs taux horaires.
          </Text>
        </View>

        <View style={[styles.actionCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.actionTitle, { color: theme.text }]}>3. Enregistrez vos heures</Text>
          <Text style={[styles.actionText, { color: theme.muted }]}>
            Utilisez l'onglet "Heures" pour saisir vos journées de travail et voir le calendrier.
          </Text>
        </View>

        <View style={[styles.actionCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.actionTitle, { color: theme.text }]}>4. Générez vos factures</Text>
          <Text style={[styles.actionText, { color: theme.muted }]}>
            Dans "Factures", créez des factures professionnelles avec vos infos pré-remplies. Format PDF conforme aux normes françaises.
          </Text>
        </View>

        <View style={[styles.actionCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.actionTitle, { color: theme.text }]}>5. Personnalisez l'app</Text>
          <Text style={[styles.actionText, { color: theme.muted }]}>
            Dans "Paramètres", configurez vos catégories et notifications selon vos besoins.
          </Text>
        </View>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <Pressable
          style={[styles.logoutButton, { backgroundColor: theme.danger }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>🚪 Déconnexion</Text>
        </Pressable>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  headerUser: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.85,
  },
  welcomeSection: {
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 15,
    lineHeight: 22,
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  actionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoutButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

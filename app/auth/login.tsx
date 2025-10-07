import { login, setAuthToken, setCurrentUser } from '@/lib/api';
import { storage } from '@/lib/storage';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <Text style={styles.hint}>Connectez-vous à votre compte</Text>
      
      <View style={styles.fieldGroup}>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      </View>
      
      <View style={styles.fieldGroup}>
        <TextInput style={styles.input} placeholder="Mot de passe" placeholderTextColor="#9CA3AF" value={password} onChangeText={setPassword} secureTextEntry />
      </View>
      <Button
        title={loading ? 'Connexion…' : 'Se connecter'}
        disabled={loading || !email.trim() || !password.trim()}
        onPress={async () => {
          // Validation
          if (!email.trim() || !password.trim()) {
            Alert.alert('Champs requis', 'Veuillez remplir tous les champs');
            return;
          }
          
          // Prevent double-tap
          if (loading) {
            console.log('⚠️ Already loading, ignoring tap');
            return;
          }
          
          try {
            setLoading(true);
            
            const res = await login({ email, password });
            
            // Save token and user
            setAuthToken(res.token);
            setCurrentUser(res.user);
            await storage.setItem('token', res.token);
            await storage.setItem('user', JSON.stringify(res.user));
            
            // Navigate directly
            router.replace('/(tabs)/');
            
          } catch (e) {
            Alert.alert('Erreur de connexion', String(e));
            setLoading(false);
          }
        }}
        color="#4a7a8c"
      />
      <Link href="/auth/register" style={styles.link}><Text style={styles.linkText}>Créer un compte</Text></Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { 
    flexGrow: 1, 
    backgroundColor: '#0B1220',
  },
  container: { 
    flex: 1, 
    padding: 16, 
    gap: 16, 
    justifyContent: 'center',
    minHeight: 500,
  },
  title: { color: 'white', fontSize: 28, fontWeight: '700', textAlign: 'center' },
  hint: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginBottom: 8 },
  fieldGroup: { gap: 4 },
  input: { 
    borderWidth: 1, 
    borderColor: '#374151', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 12, 
    color: '#fff', 
    fontSize: 16,
    minHeight: 44, // Meilleure taille tactile sur mobile
  },
  link: { alignSelf: 'center', marginTop: 16 },
  linkText: { color: '#5c9eb3', fontSize: 15 },
});



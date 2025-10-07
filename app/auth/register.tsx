import { setAuthToken, setCurrentUser, signup } from '@/lib/api';
import { storage } from '@/lib/storage';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
      <Text style={styles.title}>Inscription</Text>
      <Text style={styles.hint}>Créez votre compte pour commencer</Text>
      
      <View style={styles.fieldGroup}>
        <TextInput style={styles.input} placeholder="Prénom" placeholderTextColor="#9CA3AF" value={firstName} onChangeText={setFirstName} />
        <Text style={styles.helperText}>Au moins 1 caractère</Text>
      </View>
      
      <View style={styles.fieldGroup}>
        <TextInput style={styles.input} placeholder="Nom" placeholderTextColor="#9CA3AF" value={lastName} onChangeText={setLastName} />
        <Text style={styles.helperText}>Au moins 1 caractère</Text>
      </View>
      
      <View style={styles.fieldGroup}>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.helperText}>Format email valide (ex: nom@exemple.com)</Text>
      </View>
      
      <View style={styles.fieldGroup}>
        <TextInput style={styles.input} placeholder="Mot de passe" placeholderTextColor="#9CA3AF" value={password} onChangeText={setPassword} secureTextEntry />
        <Text style={styles.helperText}>Au moins 6 caractères</Text>
      </View>
      <Button
        title={loading ? 'Création…' : 'Créer le compte'}
        onPress={async () => {
          try {
            setLoading(true);
            const res = await signup({ firstName, lastName, email, password });
            
            // Save token and user
            setAuthToken(res.token);
            setCurrentUser(res.user);
            await storage.setItem('token', res.token);
            await storage.setItem('user', JSON.stringify(res.user));
            
            // Navigate directly
            router.replace('/(tabs)/');
            
          } catch (e) {
            Alert.alert('Erreur d\'inscription', String(e));
            setLoading(false);
          }
        }}
        color="#4a7a8c"
      />
      <Link href="/auth/login" style={styles.link}><Text style={styles.linkText}>J'ai déjà un compte</Text></Link>
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
    gap: 12, 
    justifyContent: 'center',
    minHeight: 600,
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
  helperText: { color: '#6B7280', fontSize: 12, paddingLeft: 4 },
  link: { alignSelf: 'center', marginTop: 16 },
  linkText: { color: '#5c9eb3', fontSize: 15 },
});



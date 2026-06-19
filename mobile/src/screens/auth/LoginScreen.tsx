import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Button, Field } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { apiError } from '../../api/client';

export default function LoginScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || !password) return Alert.alert('Missing info', 'Enter your email and password.');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      Alert.alert('Login failed', apiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing(12) }]}>
        <Text style={styles.brand}>StayMate</Text>
        <Text style={styles.tagline}>Find your next stay, roommate, or rental space in minutes.</Text>

        <View style={{ height: spacing(8) }} />

        <Field
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Field
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button title="Log In" onPress={submit} loading={loading} style={{ marginTop: spacing(2) }} />

        <TouchableOpacity onPress={() => nav.navigate('Register')} style={{ marginTop: spacing(6) }}>
          <Text style={styles.link}>
            New here? <Text style={{ color: colors.primary, fontWeight: '700' }}>Create an account</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Demo accounts (after seeding)</Text>
          <Text style={styles.demoText}>owner@demo.com / password123</Text>
          <Text style={styles.demoText}>seeker@demo.com / password123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing(6), paddingBottom: spacing(10) },
  brand: { fontSize: 34, fontWeight: '900', color: colors.primary, textAlign: 'center' },
  tagline: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing(2) },
  link: { textAlign: 'center', color: colors.textMuted },
  demoBox: {
    marginTop: spacing(10), padding: spacing(4), backgroundColor: colors.primaryLight,
    borderRadius: 12,
  },
  demoTitle: { fontWeight: '700', color: colors.primaryDark, marginBottom: spacing(1.5) },
  demoText: { color: colors.primaryDark, fontSize: 13 },
});

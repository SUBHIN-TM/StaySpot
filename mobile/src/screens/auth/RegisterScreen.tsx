import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { Button, Field } from '../../components/ui';
import { colors, radius, spacing } from '../../theme';
import { apiError } from '../../api/client';

const ROLES = [
  { key: 'seeker', label: 'I’m looking for a place' },
  { key: 'owner', label: 'I’m listing a property' },
];

export default function RegisterScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '', occupation: '', mobile_number: '',
  });
  const [role, setRole] = useState('seeker');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.name || !form.email || !form.password)
      return Alert.alert('Missing info', 'Name, email, and password are required.');
    if (form.password.length < 6)
      return Alert.alert('Weak password', 'Use at least 6 characters.');
    setLoading(true);
    try {
      await signUp({ ...form, email: form.email.trim(), role });
    } catch (e) {
      Alert.alert('Sign up failed', apiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing(8) }]}>
        <Text style={styles.title}>Create your account</Text>

        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.key}
              onPress={() => setRole(r.key)}
              style={[styles.roleChip, role === r.key && styles.roleChipActive]}
            >
              <Text style={[styles.roleText, role === r.key && { color: colors.white }]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field label="Full name" placeholder="Jane Doe" value={form.name} onChangeText={set('name')} />
        <Field
          label="Email" placeholder="you@example.com" autoCapitalize="none"
          keyboardType="email-address" value={form.email} onChangeText={set('email')}
        />
        <Field label="Password" placeholder="At least 6 characters" secureTextEntry value={form.password} onChangeText={set('password')} />
        <Field label="Occupation (optional)" placeholder="Student, Engineer…" value={form.occupation} onChangeText={set('occupation')} />
        <Field label="Mobile (optional)" placeholder="9000000000" keyboardType="phone-pad" value={form.mobile_number} onChangeText={set('mobile_number')} />

        <Button title="Sign Up" onPress={submit} loading={loading} style={{ marginTop: spacing(2) }} />

        <TouchableOpacity onPress={() => nav.goBack()} style={{ marginTop: spacing(6) }}>
          <Text style={styles.link}>
            Already have an account? <Text style={{ color: colors.primary, fontWeight: '700' }}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing(6), paddingBottom: spacing(12) },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: spacing(5) },
  roleRow: { flexDirection: 'row', gap: spacing(3), marginBottom: spacing(5) },
  roleChip: {
    flex: 1, paddingVertical: spacing(3), borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, alignItems: 'center', backgroundColor: colors.white,
  },
  roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleText: { fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'center' },
  link: { textAlign: 'center', color: colors.textMuted },
});

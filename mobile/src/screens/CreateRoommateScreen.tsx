import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Field } from '../components/ui';
import { RoommateApi } from '../api';
import { apiError } from '../api/client';
import { colors, spacing } from '../theme';

export default function CreateRoommateScreen() {
  const nav = useNavigation<any>();
  const [form, setForm] = useState({
    title: '', description: '', budget: '', preferred_location: '', move_in_date: '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.title.trim()) return Alert.alert('Title required');
    setLoading(true);
    try {
      await RoommateApi.create({
        title: form.title.trim(),
        description: form.description || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        preferred_location: form.preferred_location || undefined,
        move_in_date: form.move_in_date || undefined,
      } as any);
      nav.goBack();
    } catch (e) {
      Alert.alert('Could not create post', apiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing(4) }}>
      <Field label="Title" placeholder="Looking for a roommate in…" value={form.title} onChangeText={set('title')} />
      <Field label="Description" placeholder="Tell people about yourself" value={form.description} onChangeText={set('description')} multiline numberOfLines={4} style={{ minHeight: 90, textAlignVertical: 'top' }} />
      <Field label="Budget (₹/month)" placeholder="8000" keyboardType="numeric" value={form.budget} onChangeText={set('budget')} />
      <Field label="Preferred location" placeholder="Koramangala" value={form.preferred_location} onChangeText={set('preferred_location')} />
      <Field label="Move-in date (YYYY-MM-DD)" placeholder="2026-07-01" value={form.move_in_date} onChangeText={set('move_in_date')} />
      <Button title="Post" onPress={submit} loading={loading} style={{ marginTop: spacing(2) }} />
    </ScrollView>
  );
}

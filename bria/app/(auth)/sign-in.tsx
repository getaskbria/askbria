import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { signIn } from '@/lib/auth';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';

export default function SignInScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSignIn() {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.container}>
          <TouchableOpacity style={s.back} onPress={() => router.back()}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={s.title}>Welcome back.</Text>
          <Text style={s.sub}>Sign in to your household.</Text>

          <View style={s.form}>
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor={Colors.soft}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor={Colors.soft}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={s.btnText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.cream },
  flex:        { flex: 1 },
  container:   { flex: 1, padding: Spacing[8], justifyContent: 'center' },
  back:        { position: 'absolute', top: Spacing[4], left: Spacing[8] },
  backText:    { color: Colors.mid, fontSize: FontSize.base },
  title:       { fontFamily: 'Georgia', fontSize: 34, color: Colors.charcoal, marginBottom: Spacing[2] },
  sub:         { fontSize: FontSize.base, color: Colors.mid, marginBottom: Spacing[8] },
  form:        { gap: Spacing[3] },
  input: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.md,
    padding: Spacing[4],
    fontSize: FontSize.base,
    color: Colors.charcoal,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.subtle,
  },
  btn: {
    backgroundColor: Colors.charcoal,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing[2],
    ...Shadow.subtle,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: Colors.warmWhite, fontSize: FontSize.md, fontWeight: '600' },
});

import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/Colors';
import { useSession } from '@/hooks/useSession';

export default function RootLayout() {
  const { session, loading } = useSession();

  useEffect(() => {
    if (loading) return;
    if (session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/welcome');
    }
  }, [session, loading]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.cream } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Decorative blobs */}
        <View style={[s.blob, s.blobTopRight]} />
        <View style={[s.blob, s.blobBottomLeft]} />

        {/* Logo mark */}
        <View style={s.logoWrap}>
          <View style={s.logoBox}>
            <Text style={s.logoLetter}>B</Text>
            <View style={s.logoDot} />
          </View>
        </View>

        {/* Eyebrow */}
        <Text style={s.eyebrow}>Bria by Brighthouse</Text>

        {/* Headline */}
        <Text style={s.headline}>
          A calmer way{'\n'}to{' '}
          <Text style={s.headlineAccent}>run home.</Text>
        </Text>

        {/* Body */}
        <Text style={s.body}>
          Meet Bria — your AI household assistant. She tracks supplies,
          sets reminders, and helps coordinate your home so you can stop
          carrying it all in your head.
        </Text>

        {/* Bria says card */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardStar}>✦</Text>
            <Text style={s.cardLabel}>Bria says</Text>
          </View>
          <Text style={s.cardQuote}>
            "Tonight's dinner is handled. Maria has her instructions for Friday.
            Your AC filter ships Tuesday."
          </Text>
        </View>

        {/* CTAs */}
        <View style={s.actions}>
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => router.push('/(auth)/onboarding')}
            activeOpacity={0.85}
          >
            <Text style={s.primaryBtnText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => router.push('/sign-in' as any)}
            activeOpacity={0.7}
          >
            <Text style={s.secondaryBtnText}>
              Already have an account?{' '}
              <Text style={s.secondaryBtnLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scroll: {
    paddingHorizontal: Spacing[8],
    paddingTop: Spacing[10],
    paddingBottom: Spacing[8],
  },

  // Decorative
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTopRight: {
    width: 280,
    height: 280,
    top: -80,
    right: -80,
    backgroundColor: 'rgba(200,153,74,0.07)',
  },
  blobBottomLeft: {
    width: 200,
    height: 200,
    bottom: 40,
    left: -60,
    backgroundColor: 'rgba(107,143,113,0.09)',
  },

  // Logo
  logoWrap: {
    marginBottom: Spacing[6],
  },
  logoBox: {
    width: 56,
    height: 56,
    backgroundColor: Colors.charcoal,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontFamily: 'Georgia',
    fontSize: 26,
    color: Colors.warmWhite,
  },
  logoDot: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.gold,
  },

  // Text
  eyebrow: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: Colors.goldDark,
    marginBottom: Spacing[3],
  },
  headline: {
    fontFamily: 'Georgia',
    fontSize: 42,
    color: Colors.charcoal,
    lineHeight: 50,
    letterSpacing: -0.8,
    marginBottom: Spacing[4],
  },
  headlineAccent: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    color: Colors.goldDark,
  },
  body: {
    fontSize: FontSize.base,
    color: Colors.mid,
    lineHeight: 24,
    fontWeight: '300',
    marginBottom: Spacing[6],
    maxWidth: 320,
  },

  // Bria says card
  card: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.lg,
    padding: Spacing[5],
    marginBottom: Spacing[8],
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  cardStar: {
    fontSize: 16,
    color: Colors.gold,
  },
  cardLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: Colors.goldDark,
  },
  cardQuote: {
    fontSize: FontSize.sm,
    color: Colors.charcoal,
    lineHeight: 21,
    fontStyle: 'italic',
  },

  // Actions
  actions: {
    gap: Spacing[3],
  },
  primaryBtn: {
    backgroundColor: Colors.charcoal,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.subtle,
  },
  primaryBtnText: {
    color: Colors.warmWhite,
    fontSize: FontSize.md,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    paddingVertical: Spacing[2],
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.mid,
    fontSize: FontSize.sm,
  },
  secondaryBtnLink: {
    color: Colors.charcoal,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

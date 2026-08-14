import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';

// ── Data ──────────────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  'Basic household dashboard',
  'Up to 10 active tasks',
  'Up to 5 reminders',
  'Manual grocery / supply list',
  'Chat with Bria (limited)',
  'Up to 5 Vault uploads',
];

const PREMIUM_FEATURES = [
  'AI household dashboard',
  'AI meal planning',
  'Auto-generated grocery lists',
  'Smart reminders & proactive nudges',
  'Unlimited tasks & reminders',
  'Expanded Household Vault',
  'AI document extraction',
  'Warranty & maintenance reminders',
  'Repair & maintenance suggestions',
  'Vendor history',
];

const CONCIERGE_TYPES = [
  'Vendor coordination',
  'Grocery / supply support',
  'Repair follow-up',
  'Household checklist',
  'Scheduling',
  'Document organization',
  'Other',
];

const URGENCY_OPTIONS = ['Today', 'This week', 'Flexible'];

// ── Plans Screen ──────────────────────────────────────────────────────────────

export default function PlansScreen() {
  const [showConcierge, setShowConcierge] = useState(false);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Plans</Text>
          <Text style={s.sub}>App features are separate from Concierge help</Text>
        </View>

        {/* Info clarifier */}
        <View style={s.infoBox}>
          <Text style={s.infoEmoji}>ℹ️</Text>
          <Text style={s.infoText}>
            These plans cover <Text style={s.infoBold}>app features only</Text>.
            Brighthouse Concierge (human help) is separate and priced per request.
          </Text>
        </View>

        {/* Free plan */}
        <FreePlan />

        {/* Premium plan */}
        <PremiumPlan />

        {/* Divider */}
        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>OR</Text>
          <View style={s.dividerLine} />
        </View>

        {/* Concierge teaser */}
        <TouchableOpacity
          style={s.conciergeTeaser}
          onPress={() => setShowConcierge(true)}
          activeOpacity={0.85}
        >
          <View style={s.conciergeTeaserIcon}>
            <Text style={s.conciergeTeaserIconText}>✦</Text>
          </View>
          <View style={s.conciergeTeaserBody}>
            <Text style={s.conciergeTeaserTitle}>Brighthouse Concierge</Text>
            <Text style={s.conciergeTeaserSub}>
              Human help — separate from your app plan, priced per request.
            </Text>
            <Text style={s.conciergeTeaserPrice}>Starting at $75 per request →</Text>
          </View>
          <Text style={s.conciergeTeaserArrow}>›</Text>
        </TouchableOpacity>

        {/* Phase 1 note */}
        <Text style={s.phaseNote}>
          Phase 1 focuses on household planning, reminders, and coordination support.
          Full vendor fulfillment and marketplace booking may come later.
        </Text>
      </ScrollView>

      {/* Concierge modal */}
      <ConciergeModal
        visible={showConcierge}
        onClose={() => setShowConcierge(false)}
      />
    </SafeAreaView>
  );
}

// ── Free Plan ─────────────────────────────────────────────────────────────────

function FreePlan() {
  return (
    <View style={s.planCard}>
      <View style={s.planCardHeader}>
        <View>
          <Text style={s.planTier}>Free App Plan</Text>
          <Text style={s.planName}>Tracking essentials</Text>
        </View>
        <View style={s.planPriceWrap}>
          <Text style={s.planPrice}>$0</Text>
          <Text style={s.planPricePer}>forever</Text>
        </View>
      </View>

      <View style={s.currentBadge}>
        <Text style={s.currentBadgeText}>✓ YOUR CURRENT PLAN</Text>
      </View>

      <View style={s.featureList}>
        {FREE_FEATURES.map(f => (
          <View key={f} style={s.featureRow}>
            <Text style={[s.featureDot, { color: Colors.sage }]}>✓</Text>
            <Text style={s.featureText}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Premium Plan ──────────────────────────────────────────────────────────────

function PremiumPlan() {
  return (
    <View style={s.premiumCard}>
      {/* Glow blob */}
      <View style={s.premiumGlow} />

      <View style={s.premiumHeader}>
        <View style={s.recommendedBadge}>
          <Text style={s.recommendedText}>★ RECOMMENDED</Text>
        </View>

        <View style={s.planCardHeader}>
          <View>
            <Text style={[s.planTier, { color: Colors.gold }]}>Premium AI App Plan</Text>
            <Text style={[s.planName, { color: Colors.warmWhite }]}>Smart planning</Text>
          </View>
          <View style={s.planPriceWrap}>
            <Text style={[s.planPrice, { color: Colors.warmWhite }]}>$9.99</Text>
            <Text style={[s.planPricePer, { color: 'rgba(255,255,255,0.5)' }]}>/month</Text>
          </View>
        </View>
        <Text style={s.premiumYearly}>
          or <Text style={{ color: Colors.warmWhite, fontWeight: '700' }}>$69.99/year</Text> · save 41%
        </Text>
      </View>

      <View style={[s.featureList, { paddingHorizontal: Spacing[5] }]}>
        {PREMIUM_FEATURES.map(f => (
          <View key={f} style={s.featureRow}>
            <Text style={[s.featureDot, { color: Colors.gold }]}>★</Text>
            <Text style={[s.featureText, { color: Colors.warmWhite }]}>{f}</Text>
          </View>
        ))}
      </View>

      <View style={s.premiumFooter}>
        <TouchableOpacity
          style={s.trialBtn}
          activeOpacity={0.85}
          onPress={() => Alert.alert('Coming soon', 'Stripe billing lands in Phase 2.')}
        >
          <Text style={s.trialBtnText}>Start 7-day Free Trial</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Concierge Modal ───────────────────────────────────────────────────────────

function ConciergeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [types, setTypes]         = useState<string[]>([]);
  const [urgency, setUrgency]     = useState('This week');
  const [notes, setNotes]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  function toggleType(t: string) {
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  async function handleSubmit() {
    if (types.length === 0) {
      Alert.alert('Select a request type', 'Please choose at least one option above.');
      return;
    }
    setSubmitting(true);
    // Simulate submission — in production this fires a Slack/email webhook
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
  }

  function handleClose() {
    setTypes([]); setUrgency('This week');
    setNotes(''); setSubmitted(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={s.modalWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Dark header */}
        <View style={s.conciergeModalHeader}>
          <View style={s.modalHandle} />
          <View style={s.conciergeModalTop}>
            <View>
              <Text style={s.conciergeModalEyebrow}>✦ Human Concierge Help</Text>
              <Text style={s.conciergeModalTitle}>Brighthouse Concierge</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Text style={s.conciergeModalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.conciergeModalSub}>
            A real person helps coordinate what the app can't automate yet.
          </Text>
        </View>

        <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled">
          {submitted ? (
            <SubmittedState onClose={handleClose} />
          ) : (
            <>
              {/* Clarifier */}
              <View style={s.conciergeInfoBox}>
                <Text style={s.conciergeInfoText}>
                  Concierge is <Text style={{ fontWeight: '700' }}>separate from the app plan</Text> and
                  priced per request. One dedicated VA handles your request via Slack/email.
                </Text>
              </View>

              {/* Pricing */}
              <Text style={s.sectionLabel}>Pricing</Text>
              {[
                { title: 'Intro Concierge Request',    price: '$75',       desc: 'Up to 45 min of remote coordination. Best for first-time requests.', featured: false },
                { title: 'Standard Request',           price: 'from $100', desc: 'Vendor coordination, household admin, scheduling, sourcing, or follow-ups.', featured: true },
                { title: 'Monthly Household Support',  price: 'from $350/mo', desc: 'Ongoing remote household management support.', featured: false },
              ].map(tier => (
                <View key={tier.title} style={[s.tierCard, tier.featured && s.tierCardFeatured]}>
                  <View style={s.tierRow}>
                    <Text style={s.tierTitle}>{tier.title}</Text>
                    <Text style={s.tierPrice}>{tier.price}</Text>
                  </View>
                  <Text style={s.tierDesc}>{tier.desc}</Text>
                </View>
              ))}

              {/* Request form */}
              <Text style={[s.sectionLabel, { marginTop: Spacing[6] }]}>Request form</Text>

              <Text style={s.formLabel}>What do you need help with?</Text>
              <View style={s.chipGrid}>
                {CONCIERGE_TYPES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.chip, types.includes(t) && s.chipSelected]}
                    onPress={() => toggleType(t)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.chipText, types.includes(t) && s.chipTextSelected]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.formLabel}>How urgent is this?</Text>
              <View style={s.chipGrid}>
                {URGENCY_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[s.chip, urgency === opt && s.chipSelected]}
                    onPress={() => setUrgency(opt)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.chipText, urgency === opt && s.chipTextSelected]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.formLabel}>Notes / details</Text>
              <TextInput
                style={s.notesInput}
                placeholder="Add any details, preferences, or constraints…"
                placeholderTextColor={Colors.soft}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[s.submitBtn, submitting && s.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting
                  ? <ActivityIndicator color={Colors.warmWhite} />
                  : <Text style={s.submitBtnText}>Submit Concierge Request</Text>
                }
              </TouchableOpacity>

              <Text style={s.submitDisclaimer}>
                Brighthouse will review your request and coordinate the next step.
                You'll receive confirmation by email or in-app.
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Submitted State ───────────────────────────────────────────────────────────

function SubmittedState({ onClose }: { onClose: () => void }) {
  return (
    <View style={s.submittedWrap}>
      <View style={s.submittedIcon}>
        <Text style={s.submittedIconText}>✦</Text>
      </View>
      <Text style={s.submittedTitle}>Request received.</Text>
      <Text style={s.submittedSub}>
        Your Brighthouse concierge will review this and reach out to coordinate the next step.
        Expect a reply within 1 business day.
      </Text>
      <TouchableOpacity style={s.submitBtn} onPress={onClose}>
        <Text style={s.submitBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.cream },
  scrollContent: { padding: Spacing[4], paddingBottom: Spacing[12], gap: Spacing[4] },

  header:  { paddingHorizontal: Spacing[2], paddingTop: Spacing[2] },
  title:   { fontFamily: 'Georgia', fontSize: FontSize['2xl'], color: Colors.charcoal },
  sub:     { fontSize: FontSize.xs, color: Colors.mid, marginTop: 2 },

  // Info box
  infoBox: {
    backgroundColor: Colors.blueSoft,
    borderRadius: Radius.md,
    padding: Spacing[4],
    flexDirection: 'row', gap: Spacing[2], alignItems: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(58,107,138,0.2)',
  },
  infoEmoji: { fontSize: 15 },
  infoText:  { flex: 1, fontSize: FontSize.sm, color: Colors.blue, lineHeight: 20 },
  infoBold:  { fontWeight: '700' },

  // Plan card (shared)
  planCard: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  planCardHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing[5],
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  planTier:     { fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: Colors.mid, marginBottom: 4 },
  planName:     { fontFamily: 'Georgia', fontSize: FontSize.lg, color: Colors.charcoal },
  planPriceWrap:{ alignItems: 'flex-end' },
  planPrice:    { fontFamily: 'Georgia', fontSize: 28, color: Colors.charcoal, lineHeight: 32 },
  planPricePer: { fontSize: FontSize.xs, color: Colors.mid, marginTop: 2 },

  currentBadge: {
    marginHorizontal: Spacing[5],
    marginTop: Spacing[4],
    alignSelf: 'flex-start',
    backgroundColor: Colors.sageLight,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing[3], paddingVertical: 4,
  },
  currentBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.sage },

  featureList: { padding: Spacing[5], gap: Spacing[3] },
  featureRow:  { flexDirection: 'row', gap: Spacing[3], alignItems: 'flex-start' },
  featureDot:  { fontSize: FontSize.base, width: 18 },
  featureText: { flex: 1, fontSize: FontSize.sm, color: Colors.charcoal, lineHeight: 20 },

  // Premium card
  premiumCard: {
    backgroundColor: Colors.charcoal,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.card,
  },
  premiumGlow: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: Colors.gold, opacity: 0.2,
  },
  premiumHeader: {
    padding: Spacing[5],
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(200,153,74,0.2)',
    borderWidth: 1, borderColor: 'rgba(200,153,74,0.4)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing[3], paddingVertical: 3,
    marginBottom: Spacing[3],
  },
  recommendedText: { fontSize: 10, fontWeight: '700', color: Colors.gold },
  premiumYearly:   { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.55)', marginTop: Spacing[2] },
  premiumFooter:   { padding: Spacing[5], paddingTop: Spacing[4] },
  trialBtn: {
    backgroundColor: Colors.gold, borderRadius: Radius.pill,
    paddingVertical: 14, alignItems: 'center',
  },
  trialBtnText: { color: Colors.warmWhite, fontSize: FontSize.base, fontWeight: '700' },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 11, fontWeight: '600', color: Colors.soft, letterSpacing: 1 },

  // Concierge teaser
  conciergeTeaser: {
    backgroundColor: Colors.cream,
    borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.gold,
    padding: Spacing[4],
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3],
    ...Shadow.card,
  },
  conciergeTeaserIcon: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  conciergeTeaserIconText: { color: Colors.warmWhite, fontSize: 18 },
  conciergeTeaserBody:     { flex: 1 },
  conciergeTeaserTitle:    { fontFamily: 'Georgia', fontSize: FontSize.md, color: Colors.charcoal, marginBottom: 3 },
  conciergeTeaserSub:      { fontSize: FontSize.xs, color: Colors.mid, lineHeight: 18, marginBottom: 4 },
  conciergeTeaserPrice:    { fontSize: FontSize.xs, fontWeight: '700', color: Colors.goldDark },
  conciergeTeaserArrow:    { fontSize: 22, color: Colors.goldDark, alignSelf: 'center' },

  phaseNote: {
    fontSize: 11, color: Colors.mid,
    textAlign: 'center', lineHeight: 18,
    fontStyle: 'italic', paddingHorizontal: Spacing[4],
  },

  // Concierge modal
  modalWrap: { flex: 1, backgroundColor: Colors.cream },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center', marginTop: Spacing[3],
  },
  conciergeModalHeader: {
    backgroundColor: Colors.charcoal,
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[5],
  },
  conciergeModalTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: Spacing[4],
    marginBottom: Spacing[2],
  },
  conciergeModalEyebrow: {
    fontSize: 10, fontWeight: '600',
    color: Colors.gold, letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 4,
  },
  conciergeModalTitle: { fontFamily: 'Georgia', fontSize: FontSize.xl, color: Colors.warmWhite },
  conciergeModalClose: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.6)', paddingTop: 4 },
  conciergeModalSub:   { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },

  modalBody: { padding: Spacing[6] },

  conciergeInfoBox: {
    backgroundColor: Colors.goldLight,
    borderRadius: Radius.md, padding: Spacing[4],
    borderWidth: 1, borderColor: 'rgba(200,153,74,0.3)',
    marginBottom: Spacing[5],
  },
  conciergeInfoText: { fontSize: FontSize.sm, color: Colors.goldDark, lineHeight: 20 },

  sectionLabel: {
    fontSize: 11, fontWeight: '600',
    color: Colors.soft, letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing[3],
  },

  // Pricing tiers
  tierCard: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.md, padding: Spacing[4],
    marginBottom: Spacing[2],
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.subtle,
  },
  tierCardFeatured: { borderColor: Colors.gold, borderWidth: 1.5 },
  tierRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  tierTitle: { fontFamily: 'Georgia', fontSize: FontSize.md, color: Colors.charcoal, flex: 1 },
  tierPrice: { fontFamily: 'Georgia', fontSize: FontSize.lg, color: Colors.goldDark },
  tierDesc:  { fontSize: FontSize.sm, color: Colors.mid, lineHeight: 19 },

  // Request form
  formLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.charcoal, marginBottom: Spacing[2], marginTop: Spacing[4] },
  chipGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip: {
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    borderRadius: Radius.pill, backgroundColor: Colors.cream,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipSelected:     { backgroundColor: Colors.goldLight, borderColor: Colors.gold },
  chipText:         { fontSize: FontSize.xs, color: Colors.mid, fontWeight: '500' },
  chipTextSelected: { color: Colors.goldDark, fontWeight: '600' },
  notesInput: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.md, padding: Spacing[4],
    fontSize: FontSize.base, color: Colors.charcoal,
    borderWidth: 1, borderColor: Colors.border,
    minHeight: 100, marginTop: Spacing[2],
    ...Shadow.subtle,
  },
  submitBtn: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.pill,
    paddingVertical: 15, alignItems: 'center',
    marginTop: Spacing[5], ...Shadow.subtle,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText:     { color: Colors.warmWhite, fontSize: FontSize.base, fontWeight: '700' },
  submitDisclaimer: {
    fontSize: 11, color: Colors.mid,
    textAlign: 'center', lineHeight: 18,
    fontStyle: 'italic', marginTop: Spacing[3],
  },

  // Submitted state
  submittedWrap:    { alignItems: 'center', paddingTop: Spacing[8], gap: Spacing[4] },
  submittedIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  submittedIconText: { color: Colors.warmWhite, fontSize: 30 },
  submittedTitle:    { fontFamily: 'Georgia', fontSize: FontSize.xl, color: Colors.charcoal },
  submittedSub: {
    fontSize: FontSize.base, color: Colors.mid,
    textAlign: 'center', lineHeight: 22,
    paddingHorizontal: Spacing[4],
  },
});

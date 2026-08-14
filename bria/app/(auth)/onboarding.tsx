import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { z } from 'zod';
import { signUp } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OnboardingData {
  // Auth (step 0 — pre-onboarding)
  fullName:    string;
  email:       string;
  password:    string;
  confirm:     string;
  // Step 1 — Household size
  adults:      number;
  kids:        number;
  pets:        number;
  // Step 2 — Staff
  hasCleaner:  boolean;
  staffTypes:  string[];
  // Step 3 — Dietary
  dietary:     string[];
  // Step 4 — Reminders
  reminderTime: string;  // 'morning' | 'afternoon' | 'evening'
}

const accountSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
});

const STEPS = [
  { title: "Who's home?",           sub: 'Help Bria tailor everything for your household.' },
  { title: 'Any household staff?',  sub: 'Bria will adapt how she helps you coordinate.' },
  { title: 'Dietary preferences',   sub: 'So Bria can plan meals your whole household loves.' },
  { title: 'When should Bria check in?', sub: 'Pick the best time for daily reminders.' },
  { title: 'Create your account',   sub: 'Your info is private and never shared.' },
];

const STAFF_OPTIONS = [
  { key: 'cleaner',   emoji: '🧹', label: 'Housekeeper',   sub: 'Full or part-time cleaning' },
  { key: 'cook',      emoji: '👨‍🍳', label: 'Cook / Chef',   sub: 'Meal prep & supplies' },
  { key: 'driver',    emoji: '🚘', label: 'Driver',         sub: 'Transport & errands' },
  { key: 'nanny',     emoji: '👶', label: 'Nanny',          sub: 'Childcare coordination' },
  { key: 'gardener',  emoji: '🌿', label: 'Gardener',       sub: 'Garden tools & supplies' },
];

const DIETARY_OPTIONS = [
  'Gluten-free', 'Halal', 'Vegan', 'Vegetarian',
  'Nut allergy', 'Dairy-free', 'Shellfish allergy',
  'Keto', 'Diabetic-friendly', 'None',
];

const REMINDER_OPTIONS = [
  { key: '08:00', emoji: '🌅', label: 'Morning',   sub: '7 – 9 AM' },
  { key: '13:00', emoji: '☀️',  label: 'Afternoon', sub: '12 – 2 PM' },
  { key: '19:00', emoji: '🌙', label: 'Evening',   sub: '6 – 8 PM' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const [step, setStep]         = useState(0);
  const [saving, setSaving]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [data, setData]       = useState<OnboardingData>({
    fullName: '', email: '', password: '', confirm: '',
    adults: 2, kids: 0, pets: 0,
    hasCleaner: false, staffTypes: [],
    dietary: [],
    reminderTime: '08:00',
  });

  function set<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData(d => ({ ...d, [key]: value }));
  }

  function toggleStaff(key: string) {
    set('staffTypes', data.staffTypes.includes(key)
      ? data.staffTypes.filter(s => s !== key)
      : [...data.staffTypes, key]
    );
  }

  function toggleDietary(item: string) {
    if (item === 'None') { set('dietary', ['None']); return; }
    const without = data.dietary.filter(d => d !== 'None');
    set('dietary', without.includes(item)
      ? without.filter(d => d !== item)
      : [...without, item]
    );
  }

  async function finish() {
    setSaving(true);
    try {
      // Create auth user + household + profile seed
      await signUp(data.email, data.password, data.fullName);

      // Get the newly created session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session not found after sign up');

      // Fetch household_id
      const { data: user } = await supabase
        .from('users')
        .select('household_id')
        .eq('id', session.user.id)
        .single();

      if (!user) throw new Error('User profile not found');

      // Save household profile from onboarding answers
      await supabase
        .from('household_profiles')
        .update({
          adults:        data.adults,
          kids:          data.kids,
          pets:          data.pets,
          has_cleaner:   data.hasCleaner,
          staff_types:   data.staffTypes,
          dietary:       data.dietary,
          reminder_time: data.reminderTime,
        } as any)
        .eq('household_id', (user as any).household_id);

      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Something went wrong', e.message);
    } finally {
      setSaving(false);
    }
  }

  const isLastStep = step === STEPS.length - 1;

  function handleNext() {
    setStep(s => s + 1);
  }

  function handleFinish() {
    const result = accountSchema.safeParse(data);
    if (!result.success) {
      const flat = result.error.flatten();
      const errors: Record<string, string> = {};
      for (const key in flat.fieldErrors) {
        const msgs = flat.fieldErrors[key as keyof typeof flat.fieldErrors];
        if (msgs && msgs.length > 0) errors[key] = msgs[0];
      }
      // refine() errors land in formErrors — attach to 'confirm'
      if (flat.formErrors.length > 0 && !errors.confirm) {
        errors.confirm = flat.formErrors[0];
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    finish();
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Top-left back button */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={[s.backBtn, step === 0 && s.invisible]}
          onPress={() => setStep(s => s - 1)}
          disabled={step === 0}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={s.progressRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[s.progressSeg, i <= step && s.progressSegActive]}
          />
        ))}
      </View>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.stepLabel}>Step {step + 1} of {STEPS.length}</Text>
        <Text style={s.stepTitle}>{STEPS[step].title}</Text>
        <Text style={s.stepSub}>{STEPS[step].sub}</Text>
      </View>

      {/* Panel */}
      <ScrollView
        style={s.body}
        contentContainerStyle={s.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && <StepHousehold data={data} set={set} />}
        {step === 1 && <StepStaff data={data} set={set} toggleStaff={toggleStaff} />}
        {step === 2 && <StepDietary data={data} toggleDietary={toggleDietary} />}
        {step === 3 && <StepReminders data={data} set={set} />}
        {step === 4 && <StepAccount data={data} set={set} errors={fieldErrors} />}
      </ScrollView>

      {/* Bottom nav */}
      <View style={s.bottom}>
        <TouchableOpacity
          style={[s.nextBtn, saving && s.nextBtnDisabled]}
          onPress={isLastStep ? handleFinish : handleNext}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color={Colors.warmWhite} />
            : <Text style={s.nextBtnText}>{isLastStep ? 'Finish Setup' : 'Continue'}</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Step 0: Account ───────────────────────────────────────────────────────────

function StepAccount({ data, set, errors }: any) {
  return (
    <View style={s.stepWrap}>
      <View style={s.inputBlock}>
        <Text style={s.inputLabel}>Full name</Text>
        <TextInput
          style={[s.textInput, errors.fullName && s.textInputError]}
          value={data.fullName}
          onChangeText={v => set('fullName', v)}
          placeholder="Jane Smith"
          placeholderTextColor={Colors.soft}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {errors.fullName && <Text style={s.fieldError}>{errors.fullName}</Text>}
      </View>

      <View style={s.inputBlock}>
        <Text style={s.inputLabel}>Email</Text>
        <TextInput
          style={[s.textInput, errors.email && s.textInputError]}
          value={data.email}
          onChangeText={v => set('email', v)}
          placeholder="you@email.com"
          placeholderTextColor={Colors.soft}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errors.email && <Text style={s.fieldError}>{errors.email}</Text>}
      </View>

      <View style={s.inputBlock}>
        <Text style={s.inputLabel}>Password</Text>
        <TextInput
          style={[s.textInput, errors.password && s.textInputError]}
          value={data.password}
          onChangeText={v => set('password', v)}
          placeholder="At least 8 characters"
          placeholderTextColor={Colors.soft}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errors.password && <Text style={s.fieldError}>{errors.password}</Text>}
      </View>

      <View style={s.inputBlock}>
        <Text style={s.inputLabel}>Confirm password</Text>
        <TextInput
          style={[s.textInput, errors.confirm && s.textInputError]}
          value={data.confirm}
          onChangeText={v => set('confirm', v)}
          placeholder="Re-enter your password"
          placeholderTextColor={Colors.soft}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errors.confirm && <Text style={s.fieldError}>{errors.confirm}</Text>}
      </View>
    </View>
  );
}

// ── Step 1: Household size ────────────────────────────────────────────────────

function StepHousehold({ data, set }: any) {
  return (
    <View style={s.stepWrap}>
      <Stepper label="Adults" value={data.adults} min={1} max={10}
        onChange={v => set('adults', v)} />
      <Stepper label="Children / Teens" value={data.kids} min={0} max={10}
        onChange={v => set('kids', v)} />
      <Stepper label="Pets" value={data.pets} min={0} max={10}
        onChange={v => set('pets', v)} />
    </View>
  );
}

// ── Step 2: Staff ─────────────────────────────────────────────────────────────

function StepStaff({ data, set, toggleStaff }: any) {
  return (
    <View style={s.stepWrap}>
      {/* Has cleaner master toggle */}
      <View style={s.toggleRow}>
        <View style={s.toggleLeft}>
          <Text style={s.toggleEmoji}>🏡</Text>
          <View>
            <Text style={s.toggleLabel}>We have household staff</Text>
            <Text style={s.toggleSub}>Enables Cleaner Mode in your dashboard</Text>
          </View>
        </View>
        <Switch
          value={data.hasCleaner}
          onValueChange={v => set('hasCleaner', v)}
          trackColor={{ true: Colors.sage, false: Colors.soft }}
          thumbColor={Colors.warmWhite}
        />
      </View>

      {data.hasCleaner && (
        <View style={s.staffList}>
          {STAFF_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[s.staffRow, data.staffTypes.includes(opt.key) && s.staffRowSelected]}
              onPress={() => toggleStaff(opt.key)}
              activeOpacity={0.7}
            >
              <View style={s.toggleLeft}>
                <Text style={s.toggleEmoji}>{opt.emoji}</Text>
                <View>
                  <Text style={s.toggleLabel}>{opt.label}</Text>
                  <Text style={s.toggleSub}>{opt.sub}</Text>
                </View>
              </View>
              <View style={[s.checkBox, data.staffTypes.includes(opt.key) && s.checkBoxChecked]}>
                {data.staffTypes.includes(opt.key) &&
                  <Text style={s.checkMark}>✓</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Step 3: Dietary ───────────────────────────────────────────────────────────

function StepDietary({ data, toggleDietary }: any) {
  return (
    <View style={s.stepWrap}>
      <View style={s.chipWrap}>
        {DIETARY_OPTIONS.map(item => {
          const selected = data.dietary.includes(item);
          return (
            <TouchableOpacity
              key={item}
              style={[s.chip, selected && s.chipSelected]}
              onPress={() => toggleDietary(item)}
              activeOpacity={0.7}
            >
              <Text style={[s.chipText, selected && s.chipTextSelected]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Step 4: Reminders ─────────────────────────────────────────────────────────

function StepReminders({ data, set }: any) {
  return (
    <View style={s.stepWrap}>
      {REMINDER_OPTIONS.map(opt => {
        const selected = data.reminderTime === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[s.optionCard, selected && s.optionCardSelected]}
            onPress={() => set('reminderTime', opt.key)}
            activeOpacity={0.7}
          >
            <View style={s.optionLeft}>
              <Text style={s.optionEmoji}>{opt.emoji}</Text>
              <View>
                <Text style={s.optionLabel}>{opt.label}</Text>
                <Text style={s.optionSub}>{opt.sub}</Text>
              </View>
            </View>
            <View style={[s.checkBox, selected && s.checkBoxChecked]}>
              {selected && <Text style={s.checkMark}>✓</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <View style={s.stepperBlock}>
      <Text style={s.stepperLabel}>{label}</Text>
      <View style={s.stepperRow}>
        <TouchableOpacity
          style={[s.stepBtn, value <= min && s.stepBtnDisabled]}
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Text style={s.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={s.stepVal}>{value}</Text>
        <TouchableOpacity
          style={[s.stepBtn, value >= max && s.stepBtnDisabled]}
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Text style={s.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },

  // Progress
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  progressSeg: {
    flex: 1, height: 3, borderRadius: 2,
    backgroundColor: Colors.border,
  },
  progressSegActive: {
    backgroundColor: Colors.gold,
  },

  // Header
  header: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
  },
  stepLabel: {
    fontSize: FontSize.xs,
    color: Colors.soft,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stepTitle: {
    fontFamily: 'Georgia',
    fontSize: 26,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  stepSub: {
    fontSize: FontSize.sm,
    color: Colors.mid,
    lineHeight: 19,
  },

  // Body
  body:        { flex: 1 },
  bodyContent: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[4] },
  stepWrap:    { gap: Spacing[3] },

  // Account inputs
  inputBlock: { gap: 6 },
  inputLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.charcoal },
  textInput: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[4],
    paddingVertical: 13,
    fontSize: FontSize.base,
    color: Colors.charcoal,
    ...Shadow.subtle,
  },
  textInputError: { borderColor: Colors.red },
  fieldError: { fontSize: FontSize.xs, color: Colors.red, marginTop: 2 },

  // Stepper
  stepperBlock: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.md,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadow.subtle,
  },
  stepperLabel: { fontSize: FontSize.base, color: Colors.charcoal, fontWeight: '500', flex: 1 },
  stepperRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
  stepBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.cream,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnDisabled: { opacity: 0.3 },
  stepBtnText:     { fontSize: 20, color: Colors.charcoal, lineHeight: 22 },
  stepVal:         { fontSize: FontSize.lg, fontWeight: '600', color: Colors.charcoal, minWidth: 28, textAlign: 'center' },

  // Toggles / Staff
  toggleRow: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.md,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadow.subtle,
  },
  toggleLeft:  { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flex: 1 },
  toggleEmoji: { fontSize: 22 },
  toggleLabel: { fontSize: FontSize.base, fontWeight: '500', color: Colors.charcoal },
  toggleSub:   { fontSize: FontSize.xs, color: Colors.mid, marginTop: 2 },

  staffList:   { gap: Spacing[2] },
  staffRow: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.md,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Shadow.subtle,
  },
  staffRowSelected: { borderColor: Colors.sage },

  // Checkboxes
  checkBox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.soft,
    alignItems: 'center', justifyContent: 'center',
  },
  checkBoxChecked: { backgroundColor: Colors.sage, borderColor: Colors.sage },
  checkMark: { color: Colors.warmWhite, fontSize: 13, fontWeight: '700' },

  // Dietary chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.pill,
    backgroundColor: Colors.warmWhite,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipSelected: { backgroundColor: Colors.goldLight, borderColor: Colors.gold },
  chipText:     { fontSize: FontSize.sm, color: Colors.mid, fontWeight: '500' },
  chipTextSelected: { color: Colors.goldDark, fontWeight: '600' },

  // Reminder option cards
  optionCard: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.md,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...Shadow.subtle,
  },
  optionCardSelected: { borderColor: Colors.gold, backgroundColor: Colors.goldLight },
  optionLeft:  { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  optionEmoji: { fontSize: 24 },
  optionLabel: { fontSize: FontSize.base, fontWeight: '600', color: Colors.charcoal },
  optionSub:   { fontSize: FontSize.xs, color: Colors.mid, marginTop: 2 },

  // Top bar (back button)
  topBar: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
    paddingBottom: 0,
    minHeight: 36,
    justifyContent: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[2],
  },
  backBtnText: { fontSize: FontSize.sm, color: Colors.mid, fontWeight: '500' },
  invisible:   { opacity: 0 },

  // Bottom nav
  bottom: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  nextBtn: {
    backgroundColor: Colors.charcoal,
    borderRadius: Radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    ...Shadow.subtle,
  },

  nextBtnDisabled: { opacity: 0.6 },
  nextBtnText: { color: Colors.warmWhite, fontSize: FontSize.base, fontWeight: '600' },
  nextBtnFull: { marginLeft: 0 },
});

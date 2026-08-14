import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';
import { useHousehold } from '@/hooks/useHousehold';
import { useSession } from '@/hooks/useSession';
import { tasksApi, inventoryApi } from '@/lib/api';

// ── Greeting helper ───────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { session }            = useSession();
  const { profile, loading }   = useHousehold();
  const [refreshing, setRefreshing] = useState(false);
  const [taskCount, setTaskCount]   = useState(0);
  const [lowCount, setLowCount]     = useState(0);

  const firstName = session?.user?.user_metadata?.full_name?.split(' ')[0] ?? 'there';

  useEffect(() => { fetchCounts(); }, []);

  async function fetchCounts() {
    try {
      const [tasks, low] = await Promise.all([
        tasksApi.list(),
        inventoryApi.low(),
      ]);
      setTaskCount(tasks.tasks?.filter((t: any) => t.status !== 'done').length ?? 0);
      setLowCount(low.items?.length ?? 0);
    } catch { /* fail silently on dashboard */ }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchCounts();
    setRefreshing(false);
  }

  const hasCleaner = profile?.has_cleaner ?? false;

  return (
    <SafeAreaView style={s.safe}>
      {/* Top bar */}
      <View style={s.topBar}>
        <View>
          <Text style={s.greetingSub}>{greeting()}</Text>
          <Text style={s.greetingName}>My Household 🏡</Text>
        </View>
        <TouchableOpacity style={s.avatar}>
          <Text style={s.avatarText}>{firstName[0]?.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
        }
      >
        {/* Ask Bria hero */}
        <AskBriaHero firstName={firstName} />

        {/* Today at a glance */}
        <GlanceRow taskCount={taskCount} lowCount={lowCount} />

        {/* Cleaning section — adaptive */}
        {hasCleaner ? <CleanerSection /> : <DIYSection />}

        {/* Tasks one-liner */}
        <TasksCard />

        {/* Plan status */}
        <PlanCard taskCount={taskCount} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Ask Bria Hero ─────────────────────────────────────────────────────────────
function AskBriaHero({ firstName }: { firstName: string }) {
  const chips = [
    { emoji: '🛒', label: "What do we need?" },
    { emoji: '📋', label: "Any tasks today?" },
    { emoji: '🧹', label: "Plan Sunday reset" },
  ];

  return (
    <TouchableOpacity
      style={s.briaCard}
      onPress={() => router.push('/chat')}
      activeOpacity={0.9}
    >
      <View style={s.briaHeader}>
        <View style={s.briaIcon}>
          <Text style={s.briaIconText}>✦</Text>
        </View>
        <View style={s.briaHeaderText}>
          <Text style={s.briaEyebrow}>Hi {firstName} ☀️</Text>
          <Text style={s.briaTitle}>What can Bria help with?</Text>
        </View>
      </View>

      {/* Fake input bar */}
      <View style={s.briaInput}>
        <Text style={s.briaInputPlaceholder}>Ask Bria anything…</Text>
        <Text style={s.briaMic}>🎙️</Text>
      </View>

      {/* Quick-suggest chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipsRow}
      >
        {chips.map(chip => (
          <TouchableOpacity
            key={chip.label}
            style={s.chip}
            onPress={() => router.push('/chat')}
            activeOpacity={0.7}
          >
            <Text style={s.chipText}>{chip.emoji} {chip.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </TouchableOpacity>
  );
}

// ── Today at a glance ─────────────────────────────────────────────────────────
function GlanceRow({ taskCount, lowCount }: { taskCount: number; lowCount: number }) {
  const stats = [
    { emoji: '📋', count: taskCount, label: 'Tasks',        bg: '#FEF3E2', screen: '/tasks' },
    { emoji: '⚠️',  count: lowCount,  label: 'Low supplies', bg: Colors.redSoft, screen: '/supplies' },
    { emoji: '🔔', count: 0,          label: 'Reminders',   bg: Colors.blueSoft, screen: null },
  ];

  return (
    <View style={s.glanceRow}>
      {stats.map(stat => (
        <TouchableOpacity
          key={stat.label}
          style={s.glanceStat}
          onPress={() => stat.screen && router.push(stat.screen as any)}
          activeOpacity={stat.screen ? 0.7 : 1}
        >
          <View style={[s.glanceIcon, { backgroundColor: stat.bg }]}>
            <Text style={s.glanceEmoji}>{stat.emoji}</Text>
          </View>
          <Text style={s.glanceNum}>{stat.count}</Text>
          <Text style={s.glanceLbl}>{stat.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Cleaner Mode Section ──────────────────────────────────────────────────────
function CleanerSection() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const checklist = [
    { id: 'guest',   emoji: '🛏️', label: 'Prepare guest room before cleaner arrives' },
    { id: 'laundry', emoji: '📝', label: 'Leave laundry & ironing instructions' },
    { id: 'supply',  emoji: '🧴', label: 'Restock cleaning supplies' },
  ];

  return (
    <View style={[s.card, s.cleanerCard]}>
      <View style={s.cardHeader}>
        <View>
          <Text style={s.cardTitle}>🧹 Cleaning Coordination</Text>
          <Text style={s.cardSub}>Bria helps you prep & coordinate</Text>
        </View>
        <View style={s.modeBadge}>
          <Text style={s.modeBadgeText}>CLEANER MODE</Text>
        </View>
      </View>

      {/* Next visit */}
      <View style={s.staffRow}>
        <View style={s.staffAvatar}>
          <Text style={s.staffAvatarText}>M</Text>
        </View>
        <View style={s.staffInfo}>
          <Text style={s.staffName}>Housekeeper</Text>
          <Text style={s.staffSub}>Next visit · Friday 8 AM</Text>
        </View>
        <View style={s.inDaysTag}>
          <Text style={s.inDaysText}>in 2 days</Text>
        </View>
      </View>

      {/* Prep checklist */}
      <Text style={s.sectionLabel}>Prep checklist · Bria suggests</Text>
      {checklist.map(item => (
        <TouchableOpacity
          key={item.id}
          style={s.checkRow}
          onPress={() => setChecked(c => ({ ...c, [item.id]: !c[item.id] }))}
          activeOpacity={0.7}
        >
          <Text style={s.checkEmoji}>{item.emoji}</Text>
          <Text style={[s.checkLabel, checked[item.id] && s.checkLabelDone]}>
            {item.label}
          </Text>
          <View style={[s.checkbox, checked[item.id] && s.checkboxDone]}>
            {checked[item.id] && <Text style={s.checkMark}>✓</Text>}
          </View>
        </TouchableOpacity>
      ))}

      <View style={s.cardActions}>
        <TouchableOpacity style={[s.actionBtn, s.actionBtnPrimary]} activeOpacity={0.8}>
          <Text style={s.actionBtnPrimaryText}>Send Instructions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} activeOpacity={0.8}>
          <Text style={s.actionBtnText}>Edit Checklist</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── DIY Mode Section ──────────────────────────────────────────────────────────
function DIYSection() {
  const routines = [
    { emoji: '🔄', label: 'Sunday reset',    sub: 'Every Sunday · 15 min',  tag: 'Active',  tagColor: Colors.sage },
    { emoji: '🧺', label: 'Laundry day',     sub: 'Tue & Sat',              tag: 'Active',  tagColor: Colors.sage },
    { emoji: '❄️', label: 'Clean out fridge', sub: 'Monthly · due in 4 days', tag: 'Soon', tagColor: Colors.gold },
  ];

  return (
    <View style={[s.card, s.diyCard]}>
      <View style={s.cardHeader}>
        <View>
          <Text style={s.cardTitle}>🧹 Cleaning Routines</Text>
          <Text style={s.cardSub}>Bria keeps your home routines simple</Text>
        </View>
        <View style={[s.modeBadge, { backgroundColor: Colors.blue }]}>
          <Text style={s.modeBadgeText}>DIY MODE</Text>
        </View>
      </View>

      {/* Quick win */}
      <View style={s.quickWin}>
        <View style={s.quickWinHeader}>
          <Text style={s.quickWinEmoji}>🌅</Text>
          <Text style={s.quickWinTitle}>Today's quick win</Text>
          <View style={s.minTag}>
            <Text style={s.minTagText}>15 MIN</Text>
          </View>
        </View>
        <Text style={s.quickWinBody}>
          Sunday reset — wipe counters, run dishwasher, start one load of laundry. That's it.
        </Text>
      </View>

      {/* Routines */}
      <Text style={s.sectionLabel}>Your routines</Text>
      {routines.map(r => (
        <View key={r.label} style={s.routineRow}>
          <Text style={s.checkEmoji}>{r.emoji}</Text>
          <View style={s.routineInfo}>
            <Text style={s.staffName}>{r.label}</Text>
            <Text style={s.staffSub}>{r.sub}</Text>
          </View>
          <View style={[s.tag, { backgroundColor: r.tagColor + '22' }]}>
            <Text style={[s.tagText, { color: r.tagColor }]}>{r.tag}</Text>
          </View>
        </View>
      ))}

      {/* Bria tip */}
      <View style={s.briaTip}>
        <Text style={s.briaTipStar}>✦</Text>
        <View style={s.briaTipContent}>
          <Text style={s.briaTipLabel}>Bria's tip</Text>
          <Text style={s.briaTipBody}>
            Got a red wine spill? Blot, don't rub. Sprinkle salt, then dab with cold water.
          </Text>
        </View>
      </View>

      <View style={s.cardActions}>
        <TouchableOpacity style={[s.actionBtn, s.actionBtnPrimary]} activeOpacity={0.8}>
          <Text style={s.actionBtnPrimaryText}>Start Today's Win</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} activeOpacity={0.8}>
          <Text style={s.actionBtnText}>All Routines</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Tasks one-liner ───────────────────────────────────────────────────────────
function TasksCard() {
  return (
    <TouchableOpacity style={s.card} onPress={() => router.push('/tasks')} activeOpacity={0.85}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>📋 Top Tasks Today</Text>
        <Text style={s.viewAll}>View all ›</Text>
      </View>
      <View style={s.taskRow}>
        <Text style={s.taskEmoji}>🛒</Text>
        <Text style={s.taskLabel}>Buy groceries — dinner ingredients</Text>
        <View style={[s.tag, { backgroundColor: Colors.redSoft }]}>
          <Text style={[s.tagText, { color: Colors.red }]}>Urgent</Text>
        </View>
      </View>
      <View style={[s.taskRow, { borderBottomWidth: 0 }]}>
        <Text style={s.taskEmoji}>📦</Text>
        <Text style={s.taskLabel}>Restock supplies</Text>
        <View style={[s.tag, { backgroundColor: Colors.goldLight }]}>
          <Text style={[s.tagText, { color: Colors.goldDark }]}>Today</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Plan Status ───────────────────────────────────────────────────────────────
function PlanCard({ taskCount }: { taskCount: number }) {
  const FREE_TASK_LIMIT = 10;

  return (
    <View style={s.planCard}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle}>⭐ Current Plan: <Text style={{ color: Colors.goldDark }}>Free</Text></Text>
        <Text style={s.cardSub}>App plan</Text>
      </View>

      <View style={s.planStats}>
        <View style={s.planStat}>
          <Text style={s.planStatNum}>
            <Text style={s.planStatBig}>{taskCount}</Text>
            <Text style={s.planStatOf}>/{FREE_TASK_LIMIT}</Text>
          </Text>
          <Text style={s.planStatLabel}>Tasks</Text>
        </View>
        <View style={s.planStat}>
          <Text style={s.planStatNum}>
            <Text style={s.planStatBig}>0</Text>
            <Text style={s.planStatOf}>/5</Text>
          </Text>
          <Text style={s.planStatLabel}>Reminders</Text>
        </View>
        <View style={s.planStat}>
          <Text style={s.planStatNum}>
            <Text style={s.planStatBig}>0</Text>
            <Text style={s.planStatOf}>/5</Text>
          </Text>
          <Text style={s.planStatLabel}>Vault</Text>
        </View>
      </View>

      <View style={s.cardActions}>
        <TouchableOpacity
          style={[s.actionBtn, s.actionBtnPrimary, { flex: 1.3 }]}
          onPress={() => router.push('/plans')}
          activeOpacity={0.8}
        >
          <Text style={s.actionBtnPrimaryText}>Upgrade to Premium</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} activeOpacity={0.8}>
          <Text style={s.actionBtnText}>✦ Concierge</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.planDisclaimer}>Concierge is separate from your app plan</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.cream },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    backgroundColor: Colors.cream,
  },
  greetingSub:  { fontSize: FontSize.xs, color: Colors.mid, marginBottom: 2 },
  greetingName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.charcoal },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.charcoal,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:   { color: Colors.warmWhite, fontWeight: '700', fontSize: FontSize.base },

  scroll:       { flex: 1 },
  scrollContent: { padding: Spacing[4], paddingBottom: Spacing[10], gap: Spacing[3] },

  // Ask Bria hero
  briaCard: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    ...Shadow.card,
  },
  briaHeader:      { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3], marginBottom: Spacing[3] },
  briaIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.charcoal,
    alignItems: 'center', justifyContent: 'center',
  },
  briaIconText:     { color: Colors.gold, fontSize: 18 },
  briaHeaderText:   { flex: 1 },
  briaEyebrow:      { fontSize: FontSize.xs, color: Colors.mid, marginBottom: 2 },
  briaTitle:        { fontSize: FontSize.md, fontWeight: '600', color: Colors.charcoal },
  briaInput: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    marginBottom: Spacing[3],
    borderWidth: 1, borderColor: Colors.border,
  },
  briaInputPlaceholder: { flex: 1, color: Colors.soft, fontSize: FontSize.base },
  briaMic:              { fontSize: 16 },
  chipsRow:             { gap: Spacing[2], paddingRight: Spacing[2] },
  chip: {
    backgroundColor: Colors.cream,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderWidth: 1, borderColor: Colors.border,
  },
  chipText: { fontSize: FontSize.xs, color: Colors.charcoal, fontWeight: '500' },

  // Glance row
  glanceRow: {
    flexDirection: 'row', gap: Spacing[3],
  },
  glanceStat: {
    flex: 1, backgroundColor: Colors.warmWhite,
    borderRadius: Radius.md, padding: Spacing[4],
    alignItems: 'center', gap: Spacing[1],
    ...Shadow.subtle,
  },
  glanceIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  glanceEmoji: { fontSize: 18 },
  glanceNum:   { fontFamily: 'Georgia', fontSize: FontSize.xl, color: Colors.charcoal, fontWeight: '700' },
  glanceLbl:   { fontSize: 10, color: Colors.mid, textAlign: 'center' },

  // Cards
  card: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.card,
  },
  cleanerCard: {
    borderColor: 'rgba(107,143,113,0.2)',
  },
  diyCard: {
    borderColor: 'rgba(58,107,138,0.2)',
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing[3] },
  cardTitle:   { fontSize: FontSize.base, fontWeight: '700', color: Colors.charcoal },
  cardSub:     { fontSize: FontSize.xs, color: Colors.mid, marginTop: 2 },

  // Mode badge
  modeBadge: {
    backgroundColor: Colors.sage,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing[2], paddingVertical: 3,
  },
  modeBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.warmWhite, letterSpacing: 0.5 },

  // Staff row
  staffRow: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.md,
    padding: Spacing[3],
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    marginBottom: Spacing[3],
    borderWidth: 1, borderColor: Colors.border,
  },
  staffAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.sage,
    alignItems: 'center', justifyContent: 'center',
  },
  staffAvatarText: { color: Colors.warmWhite, fontWeight: '700', fontSize: FontSize.base },
  staffInfo:       { flex: 1 },
  staffName:       { fontSize: FontSize.sm, fontWeight: '600', color: Colors.charcoal },
  staffSub:        { fontSize: FontSize.xs, color: Colors.mid, marginTop: 1 },
  inDaysTag: {
    backgroundColor: Colors.goldLight,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing[2], paddingVertical: 3,
  },
  inDaysText: { fontSize: 10, fontWeight: '700', color: Colors.goldDark },

  // Section label
  sectionLabel: {
    fontSize: 10, fontWeight: '600',
    letterSpacing: 0.5, textTransform: 'uppercase',
    color: Colors.soft, marginBottom: Spacing[2],
  },

  // Checklist rows
  checkRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing[2], gap: Spacing[2],
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  checkEmoji:     { fontSize: 16, width: 24 },
  checkLabel:     { flex: 1, fontSize: FontSize.sm, color: Colors.charcoal },
  checkLabelDone: { textDecorationLine: 'line-through', color: Colors.soft },
  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: Colors.soft,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: Colors.sage, borderColor: Colors.sage },
  checkMark:    { color: Colors.warmWhite, fontSize: 12, fontWeight: '700' },

  // Quick win (DIY)
  quickWin: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.md,
    padding: Spacing[3],
    marginBottom: Spacing[3],
    borderWidth: 1, borderColor: Colors.border,
  },
  quickWinHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[1] },
  quickWinEmoji:  { fontSize: 18 },
  quickWinTitle:  { flex: 1, fontSize: FontSize.sm, fontWeight: '600', color: Colors.charcoal },
  quickWinBody:   { fontSize: FontSize.xs, color: Colors.mid, lineHeight: 18 },
  minTag: {
    backgroundColor: Colors.goldLight,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing[2], paddingVertical: 2,
  },
  minTagText: { fontSize: 9, fontWeight: '700', color: Colors.goldDark },

  // Routine rows
  routineRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing[2], gap: Spacing[2],
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  routineInfo: { flex: 1 },

  // Tags
  tag: { borderRadius: Radius.pill, paddingHorizontal: Spacing[2], paddingVertical: 3 },
  tagText: { fontSize: 10, fontWeight: '700' },

  // Bria tip
  briaTip: {
    backgroundColor: Colors.charcoal,
    borderRadius: Radius.md,
    padding: Spacing[3],
    flexDirection: 'row', gap: Spacing[2],
    marginTop: Spacing[3],
  },
  briaTipStar:    { color: Colors.gold, fontSize: 16, marginTop: 1 },
  briaTipContent: { flex: 1 },
  briaTipLabel: {
    fontSize: 10, fontWeight: '600',
    color: Colors.gold, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 3,
  },
  briaTipBody: { fontSize: FontSize.xs, color: Colors.warmWhite, lineHeight: 18 },

  // Card actions
  cardActions: {
    flexDirection: 'row', gap: Spacing[2],
    marginTop: Spacing[3], paddingTop: Spacing[3],
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  actionBtn: {
    flex: 1, borderRadius: Radius.pill,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  actionBtnPrimary:     { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
  actionBtnText:        { fontSize: FontSize.xs, fontWeight: '600', color: Colors.charcoal },
  actionBtnPrimaryText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.warmWhite },

  // Tasks card
  viewAll:  { fontSize: FontSize.sm, color: Colors.goldDark, fontWeight: '500' },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  taskEmoji: { fontSize: 14, width: 20 },
  taskLabel: { flex: 1, fontSize: FontSize.sm, color: Colors.charcoal },

  // Plan card
  planCard: {
    backgroundColor: Colors.goldLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1, borderColor: 'rgba(200,153,74,0.25)',
    ...Shadow.card,
    marginBottom: Spacing[2],
  },
  planStats:      { flexDirection: 'row', gap: Spacing[4], marginBottom: Spacing[4] },
  planStat:       { flex: 1 },
  planStatLabel:  { fontSize: 10, color: Colors.mid, marginBottom: 3 },
  planStatNum:    { flexDirection: 'row', alignItems: 'baseline' },
  planStatBig:    { fontFamily: 'Georgia', fontSize: FontSize.xl, color: Colors.charcoal, fontWeight: '700' },
  planStatOf:     { fontSize: FontSize.sm, color: Colors.mid },
  planDisclaimer: { fontSize: 10, color: Colors.mid, textAlign: 'center', marginTop: Spacing[2], fontStyle: 'italic' },
});

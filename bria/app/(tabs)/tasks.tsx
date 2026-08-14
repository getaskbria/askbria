import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, TextInput,
  Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';
import { tasksApi, refreshBus } from '@/lib/api';
import type { Task } from '@/lib/database.types';

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FILTERS = ['All', 'Today', 'This week', 'Done'] as const;
type Filter = typeof FILTERS[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isToday(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

function isThisWeek(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);
  return d >= now && d <= weekEnd;
}

function formatDue(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString())    return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Tasks Screen ──────────────────────────────────────────────────────────────

export default function TasksScreen() {
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [filter, setFilter]       = useState<Filter>('All');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd]     = useState(false);

  useEffect(() => {
    fetchTasks();
    refreshBus.on('refresh', fetchTasks);
    return () => { refreshBus.off('refresh', fetchTasks); };
  }, []);

  async function fetchTasks() {
    try {
      const data = await tasksApi.list();
      setTasks(data.tasks ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  }

  async function toggleDone(task: Task) {
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    try {
      await tasksApi.update(task.id, { status: newStatus });
    } catch {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  }

  async function deleteTask(id: string) {
    Alert.alert('Delete task?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setTasks(prev => prev.filter(t => t.id !== id));
          try { await tasksApi.remove(id); }
          catch { fetchTasks(); }
        },
      },
    ]);
  }

  const filtered = tasks.filter(t => {
    if (filter === 'Done')      return t.status === 'done';
    if (filter === 'Today')     return t.status !== 'done' && isToday(t.due_date);
    if (filter === 'This week') return t.status !== 'done' && isThisWeek(t.due_date);
    return true; // All
  });

  // Group by section
  const today    = filtered.filter(t => t.status !== 'done' && isToday(t.due_date));
  const thisWeek = filtered.filter(t => t.status !== 'done' && !isToday(t.due_date) && isThisWeek(t.due_date));
  const upcoming = filtered.filter(t => t.status !== 'done' && !isToday(t.due_date) && !isThisWeek(t.due_date));
  const done     = filtered.filter(t => t.status === 'done');

  const sections: { label: string; data: Task[] }[] = [];
  if (filter === 'All' || filter === 'Today')     { if (today.length)    sections.push({ label: 'Today', data: today }); }
  if (filter === 'All' || filter === 'This week') { if (thisWeek.length) sections.push({ label: 'This Week', data: thisWeek }); }
  if (filter === 'All')                           { if (upcoming.length) sections.push({ label: 'Upcoming', data: upcoming }); }
  if (filter === 'Done')                          { if (done.length)     sections.push({ label: 'Completed', data: done }); }
  // If All and no specific section, put everything in one list
  if (filter === 'All' && sections.length === 0 && filtered.length > 0) {
    sections.push({ label: 'All Tasks', data: filtered });
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Tasks</Text>
          <Text style={s.sub}>
            {tasks.filter(t => t.status !== 'done').length} pending
          </Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={s.filterBar}>
        {FILTERS.map(f => {
          const count = f === 'All'       ? tasks.length
                      : f === 'Today'     ? tasks.filter(t => t.status !== 'done' && isToday(t.due_date)).length
                      : f === 'This week' ? tasks.filter(t => t.status !== 'done' && isThisWeek(t.due_date)).length
                      : tasks.filter(t => t.status === 'done').length;
          return (
            <TouchableOpacity
              key={f}
              style={[s.filterChip, filter === f && s.filterChipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[s.filterChipText, filter === f && s.filterChipTextActive]}>
                {f}{count > 0 ? ` ${count}` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyTasks filter={filter} onAdd={() => setShowAdd(true)} />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={item => item.label}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
          }
          renderItem={({ item: section }) => (
            <View style={s.section}>
              <Text style={s.sectionLabel}>{section.label}</Text>
              <View style={s.taskCard}>
                {section.data.map((task, i) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isLast={i === section.data.length - 1}
                    onToggle={() => toggleDone(task)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </View>
            </View>
          )}
        />
      )}

      {/* Add task modal */}
      <AddTaskModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={async (title, dueDate) => {
          try {
            const t = await tasksApi.add({ title, due_date: dueDate });
            setTasks(prev => [t, ...prev]);
            setShowAdd(false);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      />
    </SafeAreaView>
  );
}

// ── Task Item ─────────────────────────────────────────────────────────────────

function TaskItem({
  task, isLast, onToggle, onDelete,
}: {
  task: Task; isLast: boolean;
  onToggle: () => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const due = formatDue(task.due_date);
  const isDone = task.status === 'done';

  return (
    <TouchableOpacity
      style={[s.taskItem, isLast && s.taskItemLast, isDone && s.taskItemDone]}
      onPress={() => setExpanded(e => !e)}
      onLongPress={onDelete}
      activeOpacity={0.7}
      delayLongPress={600}
    >
      <View style={s.taskRow}>
        {/* Checkbox */}
        <TouchableOpacity style={s.checkboxWrap} onPress={onToggle} hitSlop={10}>
          <View style={[s.checkbox, isDone && s.checkboxDone]}>
            {isDone && <Text style={s.checkMark}>✓</Text>}
          </View>
        </TouchableOpacity>

        {/* Title */}
        <Text style={[s.taskTitle, isDone && s.taskTitleDone]} numberOfLines={expanded ? 0 : 2}>
          {task.title}
        </Text>

        {/* Due tag */}
        {due && !isDone && (
          <View style={[
            s.tag,
            due === 'Today'    ? { backgroundColor: Colors.redSoft }    :
            due === 'Tomorrow' ? { backgroundColor: Colors.goldLight }  :
                                 { backgroundColor: Colors.blueSoft },
          ]}>
            <Text style={[
              s.tagText,
              due === 'Today'    ? { color: Colors.red }      :
              due === 'Tomorrow' ? { color: Colors.goldDark } :
                                   { color: Colors.blue },
            ]}>{due}</Text>
          </View>
        )}
      </View>

      {/* Expanded detail */}
      {expanded && !isDone && (
        <View style={s.taskDetail}>
          {task.notes && (
            <Text style={s.taskNotes}>{task.notes}</Text>
          )}
          {task.assignee_name && (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Assigned to</Text>
              <Text style={s.detailValue}>{task.assignee_name}</Text>
            </View>
          )}
          {task.recurring && (
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Recurring</Text>
              <Text style={s.detailValue}>{task.recurring}</Text>
            </View>
          )}
          <View style={s.taskActions}>
            <TouchableOpacity style={[s.actionBtn, s.actionBtnPrimary]} onPress={onToggle}>
              <Text style={s.actionBtnPrimaryText}>Mark Done</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={onDelete}>
              <Text style={s.actionBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Add Task Modal ────────────────────────────────────────────────────────────

function AddTaskModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, dueDate: string | null) => Promise<void>;
}) {
  const [title, setTitle]     = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving]   = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await onSave(title.trim(), dueDate || null);
    setSaving(false);
    setTitle('');
    setDueDate('');
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.modalWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.modalHandle} />
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>New Task</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.modalClose}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={s.modalBody}>
          <Text style={s.inputLabel}>What needs to be done?</Text>
          <TextInput
            style={s.textInput}
            placeholder="e.g. Buy groceries, Call plumber…"
            placeholderTextColor={Colors.soft}
            value={title}
            onChangeText={setTitle}
            autoFocus
            multiline
          />

          <Text style={[s.inputLabel, { marginTop: Spacing[4] }]}>Due date (optional)</Text>
          <TextInput
            style={s.textInput}
            placeholder="YYYY-MM-DD e.g. 2026-06-15"
            placeholderTextColor={Colors.soft}
            value={dueDate}
            onChangeText={setDueDate}
            keyboardType="numbers-and-punctuation"
          />

          <TouchableOpacity
            style={[s.saveBtn, (!title.trim() || saving) && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!title.trim() || saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color={Colors.warmWhite} />
              : <Text style={s.saveBtnText}>Add Task</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyTasks({ filter, onAdd }: { filter: Filter; onAdd: () => void }) {
  const messages: Record<Filter, string> = {
    'All':       "No tasks yet. Add one or ask Bria.",
    'Today':     "Nothing due today. Nice.",
    'This week': "Nothing due this week.",
    'Done':      "No completed tasks yet.",
  };
  return (
    <View style={s.emptyWrap}>
      <Text style={s.emptyEmoji}>📋</Text>
      <Text style={s.emptyText}>{messages[filter]}</Text>
      {filter === 'All' && (
        <TouchableOpacity style={s.emptyBtn} onPress={onAdd}>
          <Text style={s.emptyBtnText}>+ Add a task</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4], paddingBottom: Spacing[2],
  },
  title: { fontFamily: 'Georgia', fontSize: FontSize['2xl'], color: Colors.charcoal },
  sub:   { fontSize: FontSize.xs, color: Colors.mid, marginTop: 2 },
  addBtn: {
    backgroundColor: Colors.charcoal,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2],
  },
  addBtnText: { color: Colors.warmWhite, fontSize: FontSize.sm, fontWeight: '600' },

  // Filter bar
  filterBar: {
    flexDirection: 'row', gap: Spacing[2],
    paddingHorizontal: Spacing[6], paddingVertical: Spacing[3],
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.warmWhite,
  },
  filterChip: {
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] + 2,
    borderRadius: Radius.pill,
    backgroundColor: Colors.cream,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive:     { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
  filterChipText:       { fontSize: FontSize.xs, color: Colors.mid, fontWeight: '500' },
  filterChipTextActive: { color: Colors.warmWhite, fontWeight: '600' },

  // List
  listContent: { padding: Spacing[4], paddingBottom: Spacing[12], gap: Spacing[1] },

  // Section
  section:      { marginBottom: Spacing[4] },
  sectionLabel: {
    fontSize: 11, fontWeight: '600',
    color: Colors.soft, letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing[2], marginLeft: 2,
  },

  // Task card
  taskCard: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.card,
  },

  // Task item
  taskItem: {
    padding: Spacing[4],
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  taskItemLast: { borderBottomWidth: 0 },
  taskItemDone: { opacity: 0.5 },
  taskRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },

  // Checkbox
  checkboxWrap: { padding: 2 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.soft,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: Colors.sage, borderColor: Colors.sage },
  checkMark:    { color: Colors.warmWhite, fontSize: 13, fontWeight: '700' },

  taskTitle:     { flex: 1, fontSize: FontSize.base, color: Colors.charcoal, lineHeight: 20 },
  taskTitleDone: { textDecorationLine: 'line-through', color: Colors.soft },

  // Tags
  tag:     { borderRadius: Radius.pill, paddingHorizontal: Spacing[2], paddingVertical: 3 },
  tagText: { fontSize: 10, fontWeight: '700' },

  // Expanded detail
  taskDetail: {
    marginTop: Spacing[3], paddingTop: Spacing[3],
    borderTopWidth: 1, borderTopColor: Colors.border,
    gap: Spacing[2],
  },
  taskNotes:    { fontSize: FontSize.sm, color: Colors.mid, lineHeight: 19 },
  detailRow:    { flexDirection: 'row', gap: Spacing[3], alignItems: 'center' },
  detailLabel:  { fontSize: FontSize.xs, color: Colors.soft, width: 80 },
  detailValue:  { fontSize: FontSize.sm, color: Colors.charcoal, fontWeight: '500' },
  taskActions:  { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[2] },
  actionBtn: {
    flex: 1, borderRadius: Radius.pill,
    paddingVertical: 8, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  actionBtnPrimary:     { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
  actionBtnText:        { fontSize: FontSize.xs, fontWeight: '600', color: Colors.charcoal },
  actionBtnPrimaryText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.warmWhite },

  // Add task modal
  modalWrap: {
    flex: 1, backgroundColor: Colors.cream,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.soft,
    alignSelf: 'center', marginTop: Spacing[3],
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6], paddingVertical: Spacing[4],
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontFamily: 'Georgia', fontSize: FontSize.lg, color: Colors.charcoal },
  modalClose: { fontSize: FontSize.base, color: Colors.mid },
  modalBody:  { padding: Spacing[6], gap: Spacing[2] },
  inputLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.charcoal },
  textInput: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.md,
    padding: Spacing[4],
    fontSize: FontSize.base,
    color: Colors.charcoal,
    borderWidth: 1, borderColor: Colors.border,
    minHeight: 52,
    ...Shadow.subtle,
  },
  saveBtn: {
    backgroundColor: Colors.charcoal,
    borderRadius: Radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing[4],
    ...Shadow.subtle,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText:     { color: Colors.warmWhite, fontSize: FontSize.base, fontWeight: '600' },

  // Empty
  emptyWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[3] },
  emptyEmoji:   { fontSize: 40 },
  emptyText:    { fontSize: FontSize.base, color: Colors.mid },
  emptyBtn: {
    backgroundColor: Colors.charcoal,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing[6], paddingVertical: Spacing[3],
  },
  emptyBtnText: { color: Colors.warmWhite, fontSize: FontSize.base, fontWeight: '600' },
});

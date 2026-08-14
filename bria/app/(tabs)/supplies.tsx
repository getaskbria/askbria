import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';
import { inventoryApi, shoppingApi, refreshBus } from '@/lib/api';
import type { InventoryItem } from '@/lib/database.types';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Kitchen', 'Bathroom', 'Cleaning', 'Pantry', 'Pets', 'General'];

const CATEGORY_EMOJI: Record<string, string> = {
  Kitchen:  '🍳', Bathroom: '🚿', Cleaning: '🧹',
  Pantry:   '🥫', Pets:     '🐾', General:  '📦',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function stockLevel(item: InventoryItem): 'critical' | 'low' | 'ok' {
  if (item.quantity <= 0)                        return 'critical';
  if (item.quantity <= item.low_threshold)       return 'low';
  return 'ok';
}

function stockPercent(item: InventoryItem): number {
  const max = item.low_threshold * 5;
  return Math.min(100, Math.round((item.quantity / max) * 100));
}

function stockLabel(item: InventoryItem): string {
  const level = stockLevel(item);
  if (level === 'critical') return 'Out of stock';
  if (level === 'low')      return `${item.quantity} ${item.unit} left`;
  return `${item.quantity} ${item.unit} · ${item.category}`;
}

// ── Supplies Screen ───────────────────────────────────────────────────────────

export default function SuppliesScreen() {
  const [items, setItems]           = useState<InventoryItem[]>([]);
  const [shopping, setShopping]     = useState<any[]>([]);
  const [category, setCategory]     = useState('All');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [inv, shop] = await Promise.all([inventoryApi.list(), shoppingApi.list()]);
      setItems(inv.items ?? []);
      setShopping(shop.items ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    refreshBus.on('refresh', fetchAll);
    return () => { refreshBus.off('refresh', fetchAll); };
  }, [fetchAll]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }

  async function toggleShoppingItem(item: any) {
    const newStatus = item.status === 'bought' ? 'pending' : 'bought';
    setShopping(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    try { await shoppingApi.update(item.id, { status: newStatus }); }
    catch { fetchAll(); }
  }

  async function deleteShoppingItem(id: string) {
    setShopping(prev => prev.filter(i => i.id !== id));
    try { await shoppingApi.remove(id); }
    catch { fetchAll(); }
  }

  async function handleDelete(id: string) {
    Alert.alert('Remove item?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          setItems(prev => prev.filter(i => i.id !== id));
          try { await inventoryApi.remove(id); }
          catch { fetchAll(); }
        },
      },
    ]);
  }

  const filtered = category === 'All'
    ? items
    : items.filter(i => i.category === category);

  const lowItems  = filtered.filter(i => stockLevel(i) !== 'ok');
  const okItems   = filtered.filter(i => stockLevel(i) === 'ok');

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Supplies</Text>
          <Text style={s.sub}>
            {lowItems.length > 0
              ? `${lowItems.length} item${lowItems.length > 1 ? 's' : ''} running low`
              : 'Everything stocked'}
          </Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={s.filterBar}
        contentContainerStyle={s.filterRow}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[s.filterChip, category === cat && s.filterChipActive]}
            onPress={() => setCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={[s.filterChipText, category === cat && s.filterChipTextActive]}>
              {cat !== 'All' ? `${CATEGORY_EMOJI[cat] ?? '📦'} ` : ''}{cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={Colors.gold} /></View>
      ) : items.length === 0 ? (
        <EmptySupplies onAdd={() => setShowAdd(true)} />
      ) : (
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />
          }
        >
          {/* Restock summary */}
          {lowItems.length > 0 && (
            <RestockSummary count={lowItems.length} onRestock={() => setShowReceipt(true)} />
          )}

          {/* Upload Receipt button */}
          <TouchableOpacity style={s.receiptBtn} onPress={() => setShowReceipt(true)} activeOpacity={0.85}>
            <Text style={s.receiptBtnIcon}>📄</Text>
            <Text style={s.receiptBtnText}>Upload Receipt</Text>
            <Text style={s.receiptBtnArrow}>›</Text>
          </TouchableOpacity>

          {/* Shopping list — Bria-generated */}
          {shopping.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionRow}>
                <Text style={s.sectionLabel}>✦ Bria's Shopping List</Text>
                <Text style={s.sectionCount}>{shopping.filter(i => i.status === 'pending').length} pending</Text>
              </View>
              <View style={s.card}>
                {shopping.map((item, i) => (
                  <ShoppingItem
                    key={item.id}
                    item={item}
                    isLast={i === shopping.length - 1}
                    onToggle={() => toggleShoppingItem(item)}
                    onDelete={() => deleteShoppingItem(item.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Low items */}
          {lowItems.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>Running Low</Text>
              <View style={s.card}>
                {lowItems.map((item, i) => (
                  <SupplyItem
                    key={item.id}
                    item={item}
                    isLast={i === lowItems.length - 1}
                    onDelete={() => handleDelete(item.id)}
                    onUpdate={fetchItems}
                  />
                ))}
              </View>
            </View>
          )}

          {/* OK items */}
          {okItems.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>Well Stocked</Text>
              <View style={s.card}>
                {okItems.map((item, i) => (
                  <SupplyItem
                    key={item.id}
                    item={item}
                    isLast={i === okItems.length - 1}
                    onDelete={() => handleDelete(item.id)}
                    onUpdate={fetchItems}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add item modal */}
      <AddItemModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={async (item) => {
          try {
            await inventoryApi.add(item);
            await fetchAll();
            setShowAdd(false);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }}
      />

      {/* Upload Receipt modal */}
      <ReceiptModal
        visible={showReceipt}
        onClose={() => setShowReceipt(false)}
        onParsed={fetchAll}
      />
    </SafeAreaView>
  );
}

// ── Restock Summary ───────────────────────────────────────────────────────────

function RestockSummary({ count, onRestock }: { count: number; onRestock: () => void }) {
  return (
    <View style={s.summaryCard}>
      <Text style={s.summaryLabel}>📦 Restock Summary</Text>
      <Text style={s.summaryTitle}>{count} item{count > 1 ? 's' : ''} running low</Text>
      <Text style={s.summarySub}>Ask Bria to add them to your shopping list</Text>
      <TouchableOpacity style={s.summaryBtn} onPress={onRestock} activeOpacity={0.85}>
        <Text style={s.summaryBtnText}>Upload Receipt to Update</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Supply Item ───────────────────────────────────────────────────────────────

function SupplyItem({ item, isLast, onDelete, onUpdate }: {
  item: InventoryItem;
  isLast: boolean;
  onDelete: () => void;
  onUpdate: () => void;
}) {
  const level   = stockLevel(item);
  const percent = stockPercent(item);
  const emoji   = CATEGORY_EMOJI[item.category] ?? '📦';

  const barColor = level === 'critical' ? Colors.red
                 : level === 'low'      ? Colors.gold
                 :                        Colors.sage;

  return (
    <TouchableOpacity
      style={[s.supplyItem, isLast && s.supplyItemLast]}
      onLongPress={onDelete}
      delayLongPress={600}
      activeOpacity={0.7}
    >
      <View style={s.supplyLeft}>
        <Text style={s.supplyEmoji}>{emoji}</Text>
        <View style={s.supplyInfo}>
          <Text style={s.supplyName}>{item.name}</Text>
          <Text style={s.supplySub}>{stockLabel(item)}</Text>
        </View>
      </View>

      {/* Stock bar */}
      <View style={s.barWrap}>
        <View style={[s.bar, { width: `${percent}%` as any, backgroundColor: barColor }]} />
      </View>

      {/* Critical badge */}
      {level === 'critical' && (
        <View style={s.criticalTag}>
          <Text style={s.criticalTagText}>OUT</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Add Item Modal ────────────────────────────────────────────────────────────

function AddItemModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (item: any) => Promise<void>;
}) {
  const [name, setName]         = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit]         = useState('pcs');
  const [category, setCategory] = useState('General');
  const [saving, setSaving]     = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({
      name: name.trim(),
      quantity: parseFloat(quantity) || 1,
      unit: unit.trim() || 'pcs',
      category,
      low_threshold: 2,
    });
    setSaving(false);
    setName(''); setQuantity('1'); setUnit('pcs'); setCategory('General');
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.modalWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.modalHandle} />
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>Add Supply Item</Text>
          <TouchableOpacity onPress={onClose}><Text style={s.modalClose}>Cancel</Text></TouchableOpacity>
        </View>

        <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={s.inputLabel}>Item name</Text>
          <TextInput style={s.textInput} placeholder="e.g. Rice, Dish Soap…"
            placeholderTextColor={Colors.soft} value={name} onChangeText={setName} autoFocus />

          <View style={s.row}>
            <View style={s.flex1}>
              <Text style={s.inputLabel}>Quantity</Text>
              <TextInput style={s.textInput} value={quantity} onChangeText={setQuantity}
                keyboardType="decimal-pad" placeholderTextColor={Colors.soft} />
            </View>
            <View style={s.flex1}>
              <Text style={s.inputLabel}>Unit</Text>
              <TextInput style={s.textInput} value={unit} onChangeText={setUnit}
                placeholder="pcs, kg, L…" placeholderTextColor={Colors.soft} />
            </View>
          </View>

          <Text style={s.inputLabel}>Category</Text>
          <View style={s.categoryGrid}>
            {CATEGORIES.filter(c => c !== 'All').map(cat => (
              <TouchableOpacity
                key={cat}
                style={[s.catChip, category === cat && s.catChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[s.catChipText, category === cat && s.catChipTextActive]}>
                  {CATEGORY_EMOJI[cat]} {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[s.saveBtn, (!name.trim() || saving) && s.saveBtnDisabled]}
            onPress={handleSave} disabled={!name.trim() || saving}
          >
            {saving
              ? <ActivityIndicator color={Colors.warmWhite} />
              : <Text style={s.saveBtnText}>Add Item</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Upload Receipt Modal ──────────────────────────────────────────────────────

function ReceiptModal({ visible, onClose, onParsed }: {
  visible: boolean;
  onClose: () => void;
  onParsed: () => void;
}) {
  const [emailText, setEmailText] = useState('');
  const [parsing, setParsing]     = useState(false);
  const [result, setResult]       = useState<string | null>(null);

  async function handleParse() {
    if (!emailText.trim()) return;
    setParsing(true);
    try {
      const data = await inventoryApi.parseReceipt(emailText);
      setResult(`Bria found ${data.parsed} item${data.parsed !== 1 ? 's' : ''} and updated your inventory.`);
      onParsed();
    } catch (e: any) {
      setResult(`Couldn't parse receipt: ${e.message}`);
    } finally {
      setParsing(false);
    }
  }

  function handleClose() {
    setEmailText(''); setResult(null);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={s.modalWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.modalHandle} />
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>Upload Receipt</Text>
          <TouchableOpacity onPress={handleClose}><Text style={s.modalClose}>Done</Text></TouchableOpacity>
        </View>

        <ScrollView style={s.modalBody} keyboardShouldPersistTaps="handled">
          {/* Option A — email forwarding */}
          <View style={s.receiptOptionCard}>
            <Text style={s.receiptOptionTitle}>📧 From Email</Text>
            <Text style={s.receiptOptionSub}>
              Forward your grocery receipt email to Bria, then paste the email text below.
              {'\n'}Your unique Bria address: <Text style={s.receiptEmail}>receipts@getbria.com</Text>
            </Text>
          </View>

          {result ? (
            <View style={s.resultCard}>
              <Text style={s.resultText}>{result}</Text>
              <TouchableOpacity style={s.saveBtn} onPress={handleClose}>
                <Text style={s.saveBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[s.inputLabel, { marginTop: Spacing[4] }]}>
                Paste receipt text
              </Text>
              <TextInput
                style={[s.textInput, { minHeight: 140 }]}
                placeholder="Paste the receipt email content here…"
                placeholderTextColor={Colors.soft}
                value={emailText}
                onChangeText={setEmailText}
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[s.saveBtn, (!emailText.trim() || parsing) && s.saveBtnDisabled]}
                onPress={handleParse}
                disabled={!emailText.trim() || parsing}
              >
                {parsing
                  ? <ActivityIndicator color={Colors.warmWhite} />
                  : <Text style={s.saveBtnText}>Parse Receipt</Text>
                }
              </TouchableOpacity>

              {/* Phase 2 notice */}
              <Text style={s.phase2Note}>
                📸 Photo scanning coming in Phase 2 — same button, smarter backend.
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Shopping Item ─────────────────────────────────────────────────────────────

function ShoppingItem({ item, isLast, onToggle, onDelete }: {
  item: any; isLast: boolean; onToggle: () => void; onDelete: () => void;
}) {
  const bought = item.status === 'bought';
  return (
    <TouchableOpacity
      style={[s.supplyItem, isLast && s.supplyItemLast]}
      onPress={onToggle}
      onLongPress={onDelete}
      delayLongPress={600}
      activeOpacity={0.7}
    >
      <View style={[s.shopCheck, bought && s.shopCheckDone]}>
        {bought && <Text style={s.shopCheckMark}>✓</Text>}
      </View>
      <View style={s.supplyInfo}>
        <Text style={[s.supplyName, bought && s.shopNameDone]}>{item.item_name}</Text>
        <Text style={s.supplySub}>
          {item.added_by === 'bria' ? '✦ Added by Bria' : 'Added manually'}
          {item.quantity ? ` · ${item.quantity}${item.unit ? ' ' + item.unit : ''}` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptySupplies({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={s.emptyWrap}>
      <Text style={s.emptyEmoji}>📦</Text>
      <Text style={s.emptyTitle}>No supplies tracked yet</Text>
      <Text style={s.emptySub}>Add items manually or tell Bria what you bought.</Text>
      <TouchableOpacity style={s.emptyBtn} onPress={onAdd}>
        <Text style={s.emptyBtnText}>+ Add a supply</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4], paddingBottom: Spacing[2],
  },
  title:      { fontFamily: 'Georgia', fontSize: FontSize['2xl'], color: Colors.charcoal },
  sub:        { fontSize: FontSize.xs, color: Colors.mid, marginTop: 2 },
  addBtn: {
    backgroundColor: Colors.charcoal, borderRadius: Radius.pill,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2],
  },
  addBtnText: { color: Colors.warmWhite, fontSize: FontSize.sm, fontWeight: '600' },

  // Filter
  filterBar: {
    maxHeight: 50,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.warmWhite,
  },
  filterRow: {
    flexDirection: 'row', gap: Spacing[2],
    paddingHorizontal: Spacing[6], paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] + 2,
    borderRadius: Radius.pill, backgroundColor: Colors.cream,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive:     { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
  filterChipText:       { fontSize: FontSize.xs, color: Colors.mid, fontWeight: '500' },
  filterChipTextActive: { color: Colors.warmWhite, fontWeight: '600' },

  scrollContent: { padding: Spacing[4], paddingBottom: Spacing[12], gap: Spacing[3] },

  // Restock summary
  summaryCard: {
    backgroundColor: Colors.charcoal,
    borderRadius: Radius.lg, padding: Spacing[5],
  },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.gold, fontWeight: '600', marginBottom: Spacing[1] },
  summaryTitle: { fontFamily: 'Georgia', fontSize: FontSize.lg, color: Colors.warmWhite, marginBottom: 4 },
  summarySub:   { fontSize: FontSize.xs, color: Colors.soft, marginBottom: Spacing[4] },
  summaryBtn: {
    backgroundColor: Colors.gold, borderRadius: Radius.pill,
    paddingVertical: 10, alignItems: 'center',
  },
  summaryBtnText: { color: Colors.warmWhite, fontSize: FontSize.sm, fontWeight: '700' },

  // Upload receipt button
  receiptBtn: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.md,
    padding: Spacing[4],
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.subtle,
  },
  receiptBtnIcon:  { fontSize: 20 },
  receiptBtnText:  { flex: 1, fontSize: FontSize.base, fontWeight: '600', color: Colors.charcoal },
  receiptBtnArrow: { fontSize: 20, color: Colors.soft },

  // Section
  section:      { gap: Spacing[2] },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: {
    fontSize: 11, fontWeight: '600',
    color: Colors.soft, letterSpacing: 0.5,
    textTransform: 'uppercase', marginLeft: 2,
  },
  sectionCount: { fontSize: FontSize.xs, color: Colors.mid },

  // Shopping item
  shopCheck: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: Colors.soft,
    alignItems: 'center', justifyContent: 'center',
  },
  shopCheckDone:  { backgroundColor: Colors.sage, borderColor: Colors.sage },
  shopCheckMark:  { color: Colors.warmWhite, fontSize: 12, fontWeight: '700' },
  shopNameDone:   { textDecorationLine: 'line-through', color: Colors.soft },
  card: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, overflow: 'hidden',
    ...Shadow.card,
  },

  // Supply item
  supplyItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing[4], gap: Spacing[3],
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  supplyItemLast: { borderBottomWidth: 0 },
  supplyLeft:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  supplyEmoji:    { fontSize: 22, width: 28 },
  supplyInfo:     { flex: 1 },
  supplyName:     { fontSize: FontSize.base, fontWeight: '600', color: Colors.charcoal },
  supplySub:      { fontSize: FontSize.xs, color: Colors.mid, marginTop: 2 },

  barWrap: {
    width: 60, height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3, overflow: 'hidden',
  },
  bar:         { height: '100%', borderRadius: 3 },
  criticalTag: {
    backgroundColor: Colors.red,
    borderRadius: Radius.pill,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  criticalTagText: { fontSize: 9, fontWeight: '800', color: Colors.warmWhite, letterSpacing: 0.5 },

  // Modal shared
  modalWrap:   { flex: 1, backgroundColor: Colors.cream },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.soft, alignSelf: 'center', marginTop: Spacing[3],
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[6], paddingVertical: Spacing[4],
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle:  { fontFamily: 'Georgia', fontSize: FontSize.lg, color: Colors.charcoal },
  modalClose:  { fontSize: FontSize.base, color: Colors.mid },
  modalBody:   { padding: Spacing[6] },
  inputLabel:  { fontSize: FontSize.sm, fontWeight: '600', color: Colors.charcoal, marginBottom: Spacing[2] },
  textInput: {
    backgroundColor: Colors.warmWhite, borderRadius: Radius.md,
    padding: Spacing[4], fontSize: FontSize.base, color: Colors.charcoal,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.subtle,
  },
  row:   { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[4] },
  flex1: { flex: 1 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[6] },
  catChip: {
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    borderRadius: Radius.pill, backgroundColor: Colors.cream,
    borderWidth: 1, borderColor: Colors.border,
  },
  catChipActive:     { backgroundColor: Colors.goldLight, borderColor: Colors.gold },
  catChipText:       { fontSize: FontSize.xs, color: Colors.mid, fontWeight: '500' },
  catChipTextActive: { color: Colors.goldDark, fontWeight: '600' },

  saveBtn: {
    backgroundColor: Colors.charcoal, borderRadius: Radius.pill,
    paddingVertical: 15, alignItems: 'center', marginTop: Spacing[4], ...Shadow.subtle,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText:     { color: Colors.warmWhite, fontSize: FontSize.base, fontWeight: '600' },

  // Receipt modal
  receiptOptionCard: {
    backgroundColor: Colors.warmWhite, borderRadius: Radius.md,
    padding: Spacing[4], borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing[2],
  },
  receiptOptionTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.charcoal, marginBottom: 4 },
  receiptOptionSub:   { fontSize: FontSize.sm, color: Colors.mid, lineHeight: 20 },
  receiptEmail:       { color: Colors.blue, fontWeight: '600' },
  resultCard: {
    backgroundColor: Colors.sageLight, borderRadius: Radius.md,
    padding: Spacing[4], borderWidth: 1, borderColor: Colors.sage,
    marginTop: Spacing[4],
  },
  resultText: { fontSize: FontSize.base, color: Colors.charcoal, marginBottom: Spacing[4], lineHeight: 22 },
  phase2Note: { fontSize: FontSize.xs, color: Colors.soft, textAlign: 'center', marginTop: Spacing[4], fontStyle: 'italic' },

  // Empty
  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[3] },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontFamily: 'Georgia', fontSize: FontSize.lg, color: Colors.charcoal },
  emptySub:   { fontSize: FontSize.base, color: Colors.mid, textAlign: 'center', paddingHorizontal: Spacing[8] },
  emptyBtn: {
    backgroundColor: Colors.charcoal, borderRadius: Radius.pill,
    paddingHorizontal: Spacing[6], paddingVertical: Spacing[3],
  },
  emptyBtnText: { color: Colors.warmWhite, fontSize: FontSize.base, fontWeight: '600' },
});

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';
import { FontSize } from '@/constants/Typography';
import { chatApi, refreshBus } from '@/lib/api';
import { useSession } from '@/hooks/useSession';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id:         string;
  role:       'user' | 'assistant';
  content:    string;
  created_at: string;
}

// ── Quick suggest chips ───────────────────────────────────────────────────────

const CHIPS = [
  { emoji: '🛒', label: "What do we need?" },
  { emoji: '📋', label: "Any tasks today?" },
  { emoji: '🧹', label: "Plan Sunday reset" },
  { emoji: '🍳', label: "What's for dinner?" },
  { emoji: '📦', label: "Check supplies" },
];

// ── Chat Screen ───────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { session }                 = useSession();
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState('');
  const [sending, setSending]       = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const flatListRef                 = useRef<FlatList>(null);

  const firstName = session?.user?.user_metadata?.full_name?.split(' ')[0] ?? 'there';

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    try {
      const data = await chatApi.history();
      setMessages(data.messages ?? []);
    } catch {
      // First-time user — no history yet, show empty state
    } finally {
      setLoadingHistory(false);
    }
  }

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);

    // Optimistically add user message
    const tempId = Date.now().toString();
    const userMsg: Message = {
      id: tempId,
      role: 'user',
      content: msg,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    scrollToEnd();

    try {
      const data = await chatApi.send(msg);

      // Replace temp + add Bria's response
      const briaMsg: Message = {
        id: tempId + '_reply',
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, briaMsg]);
      scrollToEnd();
      // Tell other screens to refresh — Bria may have updated tasks/supplies/shopping
      refreshBus.emit('refresh');
    } catch (e: any) {
      const errMsg: Message = {
        id: tempId + '_err',
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Try again in a moment.",
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }

  function scrollToEnd() {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }

  // Strip action JSON from Bria's displayed text
  function cleanContent(content: string) {
    return content.replace(/\{[\s\S]*?"action"[\s\S]*?\}/g, '').trim();
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerIcon}>
            <Text style={s.headerIconText}>✦</Text>
          </View>
          <View>
            <Text style={s.headerTitle}>Bria</Text>
            <Text style={s.headerSub}>Your household assistant</Text>
          </View>
        </View>

        {/* Message list */}
        {loadingHistory ? (
          <View style={s.center}>
            <ActivityIndicator color={Colors.gold} />
          </View>
        ) : messages.length === 0 ? (
          <EmptyState firstName={firstName} onChipPress={send} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={s.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToEnd}
            renderItem={({ item, index }) => (
              <MessageBubble
                message={{ ...item, content: cleanContent(item.content) }}
                isFirst={index === 0 || messages[index - 1]?.role !== item.role}
              />
            )}
            ListFooterComponent={sending ? <TypingIndicator /> : null}
          />
        )}

        {/* Quick chips — shown when there are messages */}
        {messages.length > 0 && !sending && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.chipsScroll}
            contentContainerStyle={s.chipsRow}
          >
            {CHIPS.map(chip => (
              <TouchableOpacity
                key={chip.label}
                style={s.chip}
                onPress={() => send(chip.label)}
                activeOpacity={0.7}
              >
                <Text style={s.chipText}>{chip.emoji} {chip.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Bria anything…"
            placeholderTextColor={Colors.soft}
            multiline
            maxLength={500}
            returnKeyType="default"
            editable={!sending}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnDisabled]}
            onPress={() => send()}
            disabled={!input.trim() || sending}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator color={Colors.warmWhite} size="small" />
              : <Text style={s.sendBtnText}>↑</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ firstName, onChipPress }: { firstName: string; onChipPress: (t: string) => void }) {
  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyIcon}>
        <Text style={s.emptyIconText}>✦</Text>
      </View>
      <Text style={s.emptyTitle}>Hi {firstName} ☀️</Text>
      <Text style={s.emptySub}>
        Ask me anything about your household — supplies, tasks, meals, or just what needs doing today.
      </Text>

      <View style={s.emptyChips}>
        {CHIPS.map(chip => (
          <TouchableOpacity
            key={chip.label}
            style={s.emptyChip}
            onPress={() => onChipPress(chip.label)}
            activeOpacity={0.7}
          >
            <Text style={s.emptyChipText}>{chip.emoji} {chip.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message, isFirst }: { message: Message; isFirst: boolean }) {
  const isUser = message.role === 'user';
  if (!message.content) return null;

  return (
    <View style={[s.bubbleWrap, isUser ? s.bubbleWrapUser : s.bubbleWrapBria]}>
      {!isUser && isFirst && (
        <View style={s.briaAvatar}>
          <Text style={s.briaAvatarText}>✦</Text>
        </View>
      )}
      {!isUser && !isFirst && <View style={s.briaAvatarSpacer} />}

      <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleBria]}>
        <Text style={[s.bubbleText, isUser ? s.bubbleTextUser : s.bubbleTextBria]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

// ── Typing Indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <View style={[s.bubbleWrap, s.bubbleWrapBria]}>
      <View style={s.briaAvatar}>
        <Text style={s.briaAvatarText}>✦</Text>
      </View>
      <View style={[s.bubble, s.bubbleBria, s.typingBubble]}>
        <Text style={s.typingDots}>• • •</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.cream },
  flex:  { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  headerIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.charcoal,
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconText: { color: Colors.gold, fontSize: 16 },
  headerTitle:    { fontSize: FontSize.md, fontWeight: '700', color: Colors.charcoal },
  headerSub:      { fontSize: FontSize.xs, color: Colors.mid },

  // Message list
  messageList: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
    gap: Spacing[2],
  },

  // Bubbles
  bubbleWrap:     { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing[2] },
  bubbleWrapUser: { justifyContent: 'flex-end', paddingLeft: 60 },
  bubbleWrapBria: { justifyContent: 'flex-start', paddingRight: 60 },

  briaAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.charcoal,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  briaAvatarText:  { color: Colors.gold, fontSize: 12 },
  briaAvatarSpacer:{ width: 28 },

  bubble: {
    maxWidth: '100%',
    borderRadius: 18,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  bubbleUser: {
    backgroundColor: Colors.charcoal,
    borderBottomRightRadius: 4,
  },
  bubbleBria: {
    backgroundColor: Colors.warmWhite,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.subtle,
  },
  bubbleText:     { fontSize: FontSize.base, lineHeight: 22 },
  bubbleTextUser: { color: Colors.warmWhite },
  bubbleTextBria: { color: Colors.charcoal },

  // Typing
  typingBubble: { paddingVertical: Spacing[3] },
  typingDots:   { color: Colors.soft, fontSize: FontSize.md, letterSpacing: 3 },

  // Quick chips
  chipsScroll: {
    maxHeight: 44,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  chipsRow: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    gap: Spacing[2],
    alignItems: 'center',
  },
  chip: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1] + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { fontSize: FontSize.xs, color: Colors.charcoal, fontWeight: '500' },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
    borderRadius: 22,
    paddingHorizontal: Spacing[4],
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: FontSize.base,
    color: Colors.charcoal,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 120,
    ...Shadow.subtle,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.charcoal,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.soft },
  sendBtnText:     { color: Colors.warmWhite, fontSize: 20, fontWeight: '700', lineHeight: 22 },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    gap: Spacing[4],
  },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.charcoal,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  emptyIconText: { color: Colors.gold, fontSize: 28 },
  emptyTitle:    { fontFamily: 'Georgia', fontSize: FontSize.xl, color: Colors.charcoal },
  emptySub: {
    fontSize: FontSize.base, color: Colors.mid,
    lineHeight: 22, textAlign: 'center',
  },
  emptyChips: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: Spacing[2], justifyContent: 'center',
    marginTop: Spacing[2],
  },
  emptyChip: {
    backgroundColor: Colors.warmWhite,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.subtle,
  },
  emptyChipText: { fontSize: FontSize.sm, color: Colors.charcoal, fontWeight: '500' },
});

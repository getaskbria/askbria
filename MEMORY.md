# Bria by Brighthouse — Project Memory

> **For Claude Code:** Read this file first before any task. It contains every decision, constraint, and convention for the project.

---

## 1. Company & Product Identity

### Brighthouse — the company
- **Company Name:** Brighthouse
- **Legal entity status:** TBD (to be registered)
- **Developer enrollment:** Apple App Store + Google Play Store under "Brighthouse"

### Bria — the product
- **App Name:** Bria
- **Displayed as:** *Bria by Brighthouse*
- **Category:** Smart home companion / AI-powered home management
- **NOT a payment app** — it's a home living assistant/manager

### App Store Identity
- **Developer Name:** Brighthouse
- **App Name:** Bria
- **Bundle ID options** (pick one before App Store enrollment):
  - `com.brighthouse.bria` — emphasizes parent brand
  - `com.getbria.app` — emphasizes product, matches `getbria.com`

---

## 2. Brand Concept — Bria as a Verb

Bria is designed to become a **daily verb**, in the same pattern as Grab, Uber, Venmo, Zelle.

| Market | Usage Pattern |
|---|---|
| 🇵🇭 Philippines | *"Bria mo na lang"* (primary cultural inspiration) |
| 🇺🇸 US | *"Just ask Bria"* / *"Tell Bria about the leaky faucet"* |
| 🌐 Multilingual | Works phonetically in English, Filipino, and Spanish |

### Tagline concepts
- "Ask Bria"
- "Tell Bria"
- "Hey Bria"

### Naming backstory
- "Brita" was original inspiration → taken (water filter brand)
- "Bria" chosen over "Brilo" for warmer, more human feel
- "Bri" in Bria is a subtle nod to **Bri**ghthouse — intentional shared prefix
- Unofficial backronym (not forced): **B**righthouse **R**esidential **I**ntelligent **A**ssistant
- **Jason** on the team proposed the verb-ified brand-name concept

---

## 3. Target Market

- **Primary:** Philippines 🇵🇭 (the "Bria mo na lang" cultural pattern is the launch beachhead)
- **Secondary:** United States 🇺🇸
- **Tertiary:** Australia 🇦🇺
- **Strategy:** Multilingual/multicultural positioning — name works in English, Filipino, Spanish

---

## 4. Domain Strategy

| Domain | Priority | Why |
|---|---|---|
| **bria.app** | Primary (ideal) | Modern, doubles as website + signals it's an app |
| **getbria.com** | Recommended | Standard "get[app]" pattern, register alongside bria.app |
| **heybria.com** | Secondary | Mirrors "Hey Bria" wake-word pattern |
| askbria.com | Fallback | Backup |
| briaapp.com | Fallback | Backup |

**Recommendation:** Register `bria.app` + `getbria.com` together.

---

## 5. Two User Types — Core Product Insight

The app adapts based on the user's household setup. There's a live toggle in the prototype dashboard to switch between these views.

### 🏡 With Cleaner Mode (households with housekeeper, cleaner, or staff)
- **Stress is coordination, prep, and communication** — not cleaning itself
- Bria helps with:
  - Prep checklists ("Prepare guest room before cleaner arrives")
  - Recurring weekly instructions
  - Supply restocking alerts
  - Follow-up reminders

### 🧹 DIY Mode (households who clean themselves)
- **Stress is overwhelm and remembering routines**
- Bria helps with:
  - "Today's quick win" — one 15-minute task
  - Recurring routines (Sunday reset, laundry day, fridge clean)
  - Microcleaning tips (stain rescue, seasonal advice)
  - Confidence-building, low-overwhelm framing

---

## 6. Phase 1 vs Phase 2

### Phase 1 (build now)
Household planning, reminders, document organization, and coordination support. The current HTML prototype covers all Phase 1 features.

### Phase 2 (later)
- Full vendor fulfillment
- Marketplace booking
- Staff portal logins
- Microcleaning tips library + photo-based stain diagnosis
- Family chore assignments to spouse/kids/roommates
- Real AI integration (Claude API or similar)
- Real backend, accounts, payments, notifications

---

## 7. Monetization Model

**Critical:** App subscriptions and human Concierge are **separate products** — never bundled.

| Product | Price | What It Covers |
|---|---|---|
| **Free App Plan** | $0 | Basic dashboard, 10 tasks, 5 reminders, 5 vendor contacts, 5 Vault uploads |
| **Premium AI App Plan** | $9.99/mo or $69.99/yr | AI meal planning, smart reminders, unlimited tasks, expanded Vault, AI doc extraction, warranty reminders, vendor history |
| **Brighthouse Concierge** | $75 – $350/mo | **Separate from app plan.** Human help, priced per request. Intro $75 (45 min), Standard from $100, Monthly from $350 |

App plans = software features. Concierge = human service. They are never bundled together.

---

## 8. Design System

### Color palette (CSS variables)
```css
--charcoal:     #2C2B27;  /* primary text, dark CTAs, hero */
--gold:         #C8994A;  /* accent, premium markers */
--gold-dark:    #8B6420;  /* gold text on light backgrounds */
--gold-light:   #F5E9CC;  /* premium tags, subtle accents */
--cream:        #FAF8F3;  /* warm app background */
--warm-white:   #FFFEF9;  /* card surfaces */
--sage:         #6B8F71;  /* success, "with cleaner" mode */
--sage-light:   #EAF0EB;
--blue:         #3A6B8A;  /* info, "DIY" mode */
--blue-soft:    #EAF0F5;
--red:          #C0452A;  /* urgent, low alerts */
--red-soft:     #F9EDEA;
--mid:          #6B6860;  /* secondary text */
--soft:         #B8B5AC;  /* tertiary text */
--border:       rgba(44,43,39,0.10);
```

### Typography
- **Display:** Georgia (or DM Serif Display in production) — headlines, eyebrow titles, large numbers
- **Body:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (or DM Sans in production)

### Visual rules
- Rounded corners: **14–18px** for cards, **999px (pill)** for buttons and chips
- Soft shadows: `0 8px 24px rgba(0,0,0,0.04)` — subtle, never harsh
- Touch targets: minimum **44×44 px** (iOS guideline)
- Spacing: **8px grid system**; major sections separated by 24–32px
- Mobile-first responsive — edge-to-edge on phones, phone-frame preview on desktop

---

## 9. Bria Voice & Copy Guidelines

When writing user-facing copy for Bria:

- **Warm, calm, premium** — like a magazine, not a tech app
- **First person:** "I can help with that" / "Let me check your fridge"
- **Never say "Brighthouse will…"** in user-facing copy → say "Bria can…"
- **Always capitalize "Bria"** — proper noun
- **Avoid robot-y language:** no "I am an AI assistant designed to…"
- **Avoid generic AI clichés:** no "Let me know how I can help!"
- **Examples that hit the right tone:**
  - ✅ "Tonight's dinner is handled."
  - ✅ "Maria has her instructions for Friday."
  - ✅ "Your AC filter ships Tuesday."
  - ❌ "I would be happy to assist you with that request."

### Tone by context
- **Onboarding:** welcoming, never overwhelming, broken into bite-sized steps
- **Empty states:** encouraging, with one clear next action
- **Reminders:** brief, calm, specific (not naggy)
- **Errors:** soft, never blaming the user

---

## 10. Feature Inventory (current prototype)

The HTML prototype demonstrates these features fully — use it as the source of truth for UI/UX:

- **Welcome Screen** — 3 variants (A · Calm, B · Warm, C · Bright) with toggle
- **Onboarding** — 8 steps: household size, age groups, home type, features, staff, diet, meal style, reminders
- **Dashboard** — adaptive Cleaner Mode and DIY Mode with live toggle
- **Ask Bria hero** — chat-style input with quick-suggest chips
- **Tonight's Dinner card** — soft one-liner with calories per serving
- **Today at a glance** — 3 stats: Tasks · Low supplies · Reminders
- **Cleaning Routines & Coordination** — adaptive content per user type
- **Top Tasks one-liner** — compressed dashboard view
- **Smart Reminders** — Premium-tagged
- **Plan Status card** — Free plan usage with upgrade & concierge CTAs
- **Meals screen** — featured meal with full nutrition (cal/protein/carbs/fat)
- **Cook What I Have (AI)** — photo scan + ingredient picker, 3 meal suggestions
- **Tasks screen** — filter chips (Today / This Week / Upcoming)
- **Assign Task** — 2-step flow (pick assignee → configure delivery + due + recurring)
- **Rich task status** — Assigned to / Sent by / Due / Status / Follow-up
- **Task actions** — Mark Done, Send Reminder, Edit Instructions, Reassign
- **Supplies screen** — category filters, Restock Summary, low-supply assign
- **Vendors screen** — Concierge banner + vendor contact cards
- **Household Vault** — Upload/Scan/Photo, 10 categories, AI extraction copy
- **App Plans screen** — Free $0 vs Premium $9.99/mo with separation clarifier
- **Brighthouse Concierge screen** — 3 pricing tiers + 5-field request form
- **Bottom navigation** — Home · Meals · Tasks · Vault · Plans

---

## 11. Decisions Made & Pending

| Question | Status |
|---|---|
| Company name | ✅ **Confirmed:** Brighthouse |
| Product / AI name | ✅ **Confirmed:** Bria. Displayed as "Bria by Brighthouse" |
| User segmentation | ✅ **Confirmed:** DIY vs Cleaner |
| Launch markets | ✅ **Confirmed:** Philippines (primary), US, Australia |
| Welcome screen variant | ⏳ All 3 built — awaiting pick |
| Bundle ID | ⏳ `com.brighthouse.bria` OR `com.getbria.app` |
| Domain | ⏳ Recommend register bria.app + getbria.com together |
| Tech stack | ⏳ Native iOS/Android, React Native, or PWA? |
| Backend | ⏳ Firebase / Supabase / custom Node? |
| AI provider | ⏳ Claude API / OpenAI / custom? |
| Payment processor | ⏳ Stripe / App Store IAP / both? |
| Concierge routing | ⏳ Email / ticketing / Slack? |

---

## 12. Recommended MVP Cut for First Build

To launch fast and validate, ship this tighter MVP first:

1. Welcome + Onboarding (1 winning variant)
2. Dashboard with adaptive Cleaner / DIY mode
3. Tasks (with Assign flow, routing via text/email only — no staff portal)
4. Meals + Cook What I Have (with real AI integration)
5. Household Vault with manual upload (skip AI extraction for v1)
6. App Plans + Stripe checkout
7. Concierge request form → email/Slack notification

---

## 13. Team

- **Founder:** [name]
- **Jason:** team member who proposed the verb-ified brand-name concept

---

## 14. Quick Reference Links

- Live prototype: [Insert your Netlify URL]
- Prototype HTML: `brighthouse.html` (source of truth for UI/UX)
- Strategic context: `BrightHouse_Partner_Update.docx` + `.pptx`
- This file: `MEMORY.md`

---

*Bria mo na lang.* 🏡✨

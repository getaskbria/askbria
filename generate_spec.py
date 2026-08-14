from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

OUTPUT = "/Users/helrouis/Projects/BrightHouse/Bria_Phase1_Spec.pdf"

# ── Palette ───────────────────────────────────────────────────────────────────
CHARCOAL   = colors.HexColor("#2C2B27")
GOLD       = colors.HexColor("#C8994A")
GOLD_LIGHT = colors.HexColor("#F5E9CC")
GOLD_DARK  = colors.HexColor("#8B6420")
CREAM      = colors.HexColor("#FAF8F3")
SAGE       = colors.HexColor("#6B8F71")
SAGE_LIGHT = colors.HexColor("#EAF0EB")
BLUE       = colors.HexColor("#3A6B8A")
BLUE_SOFT  = colors.HexColor("#EAF0F5")
RED        = colors.HexColor("#C0452A")
RED_SOFT   = colors.HexColor("#F9EDEA")
MID        = colors.HexColor("#6B6860")
SOFT       = colors.HexColor("#B8B5AC")
WHITE      = colors.HexColor("#FFFEF9")

# ── Styles ────────────────────────────────────────────────────────────────────
base = getSampleStyleSheet()

def style(name, **kw):
    return ParagraphStyle(name, **kw)

S = {
    "cover_tag":   style("cover_tag",   fontName="Helvetica",           fontSize=10, textColor=GOLD,     spaceAfter=6,  alignment=TA_CENTER),
    "cover_title": style("cover_title", fontName="Helvetica-Bold",      fontSize=32, textColor=CHARCOAL, spaceAfter=10, alignment=TA_CENTER, leading=38),
    "cover_sub":   style("cover_sub",   fontName="Helvetica",           fontSize=13, textColor=MID,      spaceAfter=6,  alignment=TA_CENTER, leading=18),
    "h1":          style("h1",          fontName="Helvetica-Bold",      fontSize=18, textColor=CHARCOAL, spaceBefore=24, spaceAfter=8, leading=22),
    "h2":          style("h2",          fontName="Helvetica-Bold",      fontSize=13, textColor=CHARCOAL, spaceBefore=16, spaceAfter=6, leading=17),
    "body":        style("body",        fontName="Helvetica",           fontSize=10, textColor=CHARCOAL, spaceAfter=6,  leading=15),
    "body_mid":    style("body_mid",    fontName="Helvetica",           fontSize=10, textColor=MID,      spaceAfter=5,  leading=15),
    "disclaimer":  style("disclaimer",  fontName="Helvetica-Oblique",   fontSize=9,  textColor=MID,      spaceAfter=6,  leading=13),
    "footer":      style("footer",      fontName="Helvetica",           fontSize=8,  textColor=SOFT,     alignment=TA_CENTER),
}

def gold_hr():
    return HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceAfter=8, spaceBefore=2)

def hr(color=GOLD, thickness=1):
    return HRFlowable(width="100%", thickness=thickness, color=color, spaceAfter=10, spaceBefore=4)

complexity_colors = {"Low": SAGE, "Medium": GOLD, "High": RED}
tier_colors       = {"Free": SAGE, "Premium": GOLD, "VA": BLUE}

def make_feature_table(rows, header_color):
    """
    rows: list of [capability, description, complexity, tier]
    First row is the header (plain strings).
    """
    built = []
    for i, row in enumerate(rows):
        if i == 0:
            built.append([
                Paragraph(row[0], style(f"th{i}a", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
                Paragraph(row[1], style(f"th{i}b", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
                Paragraph(row[2], style(f"th{i}c", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
                Paragraph(row[3], style(f"th{i}d", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            ])
        else:
            built.append([
                Paragraph(row[0], style(f"td{i}a", fontName="Helvetica-Bold", fontSize=9.5, textColor=CHARCOAL)),
                Paragraph(row[1], style(f"td{i}b", fontName="Helvetica",      fontSize=9.5, textColor=MID, leading=13)),
                Paragraph(row[2], style(f"td{i}c", fontName="Helvetica-Bold", fontSize=9,   textColor=WHITE, alignment=TA_CENTER)),
                Paragraph(row[3], style(f"td{i}d", fontName="Helvetica-Bold", fontSize=9,   textColor=WHITE, alignment=TA_CENTER)),
            ])

    t = Table(built, colWidths=[1.8*inch, 3.1*inch, 0.95*inch, 0.85*inch])
    cmds = [
        ("BACKGROUND", (0,0), (-1,0), header_color),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 9),
        ("RIGHTPADDING",  (0,0), (-1,-1), 9),
        ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#E0DDD6")),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, CREAM]),
    ]
    for i, row in enumerate(rows[1:], 1):
        cmds.append(("BACKGROUND", (2,i), (2,i), complexity_colors.get(row[2], MID)))
        cmds.append(("TEXTCOLOR",  (2,i), (2,i), WHITE))
        cmds.append(("BACKGROUND", (3,i), (3,i), tier_colors.get(row[3], MID)))
        cmds.append(("TEXTCOLOR",  (3,i), (3,i), WHITE))
    t.setStyle(TableStyle(cmds))
    return t

# ── Document ──────────────────────────────────────────────────────────────────
doc = SimpleDocTemplate(
    OUTPUT, pagesize=letter,
    leftMargin=0.85*inch, rightMargin=0.85*inch,
    topMargin=0.85*inch,  bottomMargin=0.85*inch,
    title="Bria Phase 1 — Product Spec", author="Brighthouse",
)

story = []
W = 6.8 * inch

# ════════════════════════════════════════════════════
# COVER
# ════════════════════════════════════════════════════
story.append(Spacer(1, 0.6*inch))
story.append(Paragraph("BRIA BY BRIGHTHOUSE", S["cover_tag"]))
story.append(Spacer(1, 0.1*inch))
story.append(Paragraph("Phase 1\nProduct Specification", S["cover_title"]))
story.append(Spacer(1, 0.15*inch))
story.append(hr(GOLD, 1.5))
story.append(Spacer(1, 0.1*inch))
story.append(Paragraph("Lean Solo-Build MVP — AI Chat + Smart Inventory", S["cover_sub"]))
story.append(Spacer(1, 0.3*inch))

meta = [
    ["Prepared for",    "Product Owner Review"],
    ["Version",         "2.0 — Revised"],
    ["Date",            "June 2026"],
    ["Scope",           "Phase 1 MVP — Solo Build"],
    ["Primary Market",  "United States · Philippines · Australia"],
    ["Concierge",       "One dedicated VA (human support)"],
]
meta_table = Table(
    [[Paragraph(k, style(f"mk{i}", fontName="Helvetica-Bold", fontSize=9, textColor=SOFT)),
      Paragraph(v, style(f"mv{i}", fontName="Helvetica",      fontSize=9, textColor=CHARCOAL))]
     for i, (k, v) in enumerate(meta)],
    colWidths=[1.6*inch, 4.4*inch]
)
meta_table.setStyle(TableStyle([
    ("TOPPADDING",    (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("LINEBELOW",     (0,0), (-1,-2), 0.3, colors.HexColor("#E8E4DC")),
    ("LEFTPADDING",   (0,0), (-1,-1), 0),
]))
story.append(meta_table)
story.append(Spacer(1, 0.35*inch))
story.append(Paragraph(
    "This document reflects a revised, solo-builder-friendly Phase 1 scope. Complexity has been "
    "deliberately reduced — the goal is to ship something real, validate that users love talking "
    "to Bria, and build Phase 2 on proven ground.",
    S["body_mid"]
))
story.append(PageBreak())

# ════════════════════════════════════════════════════
# EXECUTIVE SUMMARY
# ════════════════════════════════════════════════════
story.append(Paragraph("Executive Summary", S["h1"]))
story.append(gold_hr())
story.append(Paragraph(
    "Bria is the household intelligence layer — not a chore tracker, not a grocery app, not a "
    "generic AI chatbot. Phase 1 proves one thing: that talking to Bria feels natural, useful, "
    "and unlike anything else on the market.",
    S["body"]
))
story.append(Spacer(1, 0.08*inch))

summary_rows = [
    [Paragraph("What ships", style("sw", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
     Paragraph("Onboarding · Auth · Bria AI Chat · Inventory via chat + Upload Receipt · Basic dashboard · Task list", style("sv", fontName="Helvetica", fontSize=9.5, textColor=WHITE))],
    [Paragraph("What does NOT ship", style("sn", fontName="Helvetica-Bold", fontSize=9.5, textColor=CHARCOAL)),
     Paragraph("Meals / Cook What I Have · Vault · Vendors · Cleaner/DIY toggle · Stripe billing · OCR scanning · Delivery API integrations", style("sv2", fontName="Helvetica", fontSize=9.5, textColor=CHARCOAL))],
    [Paragraph("Concierge", style("sc", fontName="Helvetica-Bold", fontSize=9.5, textColor=CHARCOAL)),
     Paragraph("One VA handles requests. Routed via Slack/email. No portal needed in Phase 1 — just a request form.", style("sv3", fontName="Helvetica", fontSize=9.5, textColor=CHARCOAL))],
    [Paragraph("Timeline", style("st", fontName="Helvetica-Bold", fontSize=9.5, textColor=CHARCOAL)),
     Paragraph("10–12 weeks solo to App Store submission (realistic, not optimistic)", style("sv4", fontName="Helvetica", fontSize=9.5, textColor=CHARCOAL))],
    [Paragraph("Stack", style("ss", fontName="Helvetica-Bold", fontSize=9.5, textColor=CHARCOAL)),
     Paragraph("React Native · Node.js + Fastify · Supabase · Claude 3.7 Sonnet · Postmark (email parsing)", style("sv5", fontName="Helvetica", fontSize=9.5, textColor=CHARCOAL))],
]
sum_t = Table(summary_rows, colWidths=[1.5*inch, 5.3*inch])
sum_t.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (-1,0), CHARCOAL),
    ("BACKGROUND",    (0,1), (-1,1), RED_SOFT),
    ("BACKGROUND",    (0,2), (-1,2), BLUE_SOFT),
    ("BACKGROUND",    (0,3), (-1,3), CREAM),
    ("BACKGROUND",    (0,4), (-1,4), GOLD_LIGHT),
    ("TOPPADDING",    (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ("LEFTPADDING",   (0,0), (-1,-1), 10),
    ("RIGHTPADDING",  (0,0), (-1,-1), 10),
    ("GRID",          (0,0), (-1,-1), 0.5, colors.HexColor("#E0DDD6")),
    ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ("FONTNAME",      (0,0), (0,-1), "Helvetica-Bold"),
]))
story.append(sum_t)
story.append(PageBreak())

# ════════════════════════════════════════════════════
# SOLO BUILD NOTE
# ════════════════════════════════════════════════════
story.append(Paragraph("A Note on Solo Build Scope", S["h1"]))
story.append(gold_hr())
story.append(Paragraph(
    "The original prototype covers 10 screens and a wide feature set — it is an excellent vision "
    "document. But for one person to ship a quality product, scope must be ruthlessly cut. "
    "The rule applied here: <b>if it does not prove that Bria is useful, it does not ship in Phase 1.</b>",
    S["body"]
))
story.append(Paragraph(
    "The full prototype remains the design source of truth for Phase 2. Nothing is thrown away "
    "— it is just sequenced correctly.",
    S["body"]
))
story.append(Spacer(1, 0.1*inch))

cut_rows = [
    ["Screen / Feature",          "Phase 1",  "Phase 2"],
    ["Onboarding (4 steps)",       "Yes",      "—"],
    ["Auth (email + social)",      "Yes",      "—"],
    ["Bria AI Chat",               "Yes",      "—"],
    ["Basic dashboard",            "Yes",      "—"],
    ["Task list",                  "Yes",      "—"],
    ["Inventory via chat",         "Yes",      "—"],
    ["Upload Receipt button",      "Yes",      "—"],
    ["Concierge request form",     "Yes (simple)", "Full VA portal"],
    ["Cleaner / DIY mode toggle",  "No",       "Yes"],
    ["Meals + Cook What I Have",   "No",       "Yes"],
    ["Household Vault",            "No",       "Yes"],
    ["Vendors screen",             "No",       "Yes"],
    ["Supplies screen",            "No",       "Yes (with delivery APIs)"],
    ["Stripe / subscription",      "No",       "Yes"],
    ["Receipt OCR / photo scan",   "No",       "Yes"],
    ["Instacart / GrabMart APIs",  "No",       "Yes"],
    ["Staff portal",               "No",       "Yes"],
    ["Budget tracking",            "No",       "Yes"],
]

cut_built = []
for i, row in enumerate(cut_rows):
    if i == 0:
        cut_built.append([
            Paragraph(row[0], style("cth0", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            Paragraph(row[1], style("cth1", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            Paragraph(row[2], style("cth2", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
        ])
    else:
        is_yes = row[1].startswith("Yes")
        p1_color = SAGE if is_yes else RED
        cut_built.append([
            Paragraph(row[0], style(f"cr{i}a", fontName="Helvetica",      fontSize=9.5, textColor=CHARCOAL)),
            Paragraph(row[1], style(f"cr{i}b", fontName="Helvetica-Bold", fontSize=9,   textColor=WHITE, alignment=TA_CENTER)),
            Paragraph(row[2], style(f"cr{i}c", fontName="Helvetica",      fontSize=9.5, textColor=MID)),
        ])

cut_t = Table(cut_built, colWidths=[3.5*inch, 1.5*inch, 1.7*inch])
cut_cmds = [
    ("BACKGROUND",    (0,0), (-1,0), CHARCOAL),
    ("TOPPADDING",    (0,0), (-1,-1), 7),
    ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ("LEFTPADDING",   (0,0), (-1,-1), 9),
    ("RIGHTPADDING",  (0,0), (-1,-1), 9),
    ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#E0DDD6")),
    ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, CREAM]),
]
for i, row in enumerate(cut_rows[1:], 1):
    c = SAGE if row[1].startswith("Yes") else RED
    cut_cmds.append(("BACKGROUND", (1,i), (1,i), c))
    cut_cmds.append(("TEXTCOLOR",  (1,i), (1,i), WHITE))
cut_t.setStyle(TableStyle(cut_cmds))
story.append(cut_t)
story.append(PageBreak())

# ════════════════════════════════════════════════════
# FEATURE SCOPE
# ════════════════════════════════════════════════════
story.append(Paragraph("Phase 1 Feature Detail", S["h1"]))
story.append(gold_hr())

legend_rows = [[
    Paragraph("Complexity", style("lg0", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE)),
    Paragraph("Low", style("lg1", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
    Paragraph("Medium", style("lg2", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
    Paragraph("High", style("lg3", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
    Paragraph("Tier", style("lg4", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE)),
    Paragraph("Free", style("lg5", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
    Paragraph("Premium", style("lg6", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
    Paragraph("VA", style("lg7", fontName="Helvetica-Bold", fontSize=9, textColor=WHITE, alignment=TA_CENTER)),
]]
leg_t = Table(legend_rows, colWidths=[0.85*inch, 0.6*inch, 0.75*inch, 0.55*inch, 0.6*inch, 0.55*inch, 0.85*inch, 0.55*inch])
leg_t.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (0,0), CHARCOAL),
    ("BACKGROUND",    (1,0), (1,0), SAGE),
    ("BACKGROUND",    (2,0), (2,0), GOLD),
    ("BACKGROUND",    (3,0), (3,0), RED),
    ("BACKGROUND",    (4,0), (4,0), CHARCOAL),
    ("BACKGROUND",    (5,0), (5,0), SAGE),
    ("BACKGROUND",    (6,0), (6,0), GOLD),
    ("BACKGROUND",    (7,0), (7,0), BLUE),
    ("TOPPADDING",    (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("LEFTPADDING",   (0,0), (-1,-1), 6),
    ("RIGHTPADDING",  (0,0), (-1,-1), 6),
    ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
]))
story.append(leg_t)
story.append(Spacer(1, 0.12*inch))

# ── Feature 1: Auth + Onboarding ─────────────────────────────────────────────
story.append(Paragraph("Feature 1 — Auth + Onboarding", S["h2"]))
story.append(Paragraph("The foundation. Without it Bria has no household context and there is no user.", S["body_mid"]))

f1 = [
    ["Capability",                "Description",                                                              "Complexity", "Tier"],
    ["Email + social sign up/in", "Supabase Auth — email, Google, Apple",                                    "Low",        "Free"],
    ["4-step onboarding",         "Household size, staff presence, dietary needs, reminder preferences",      "Low",        "Free"],
    ["Household profile",         "Stored in Supabase. Passed to Claude as system prompt context every turn", "Low",        "Free"],
    ["Multi-member access",       "Invite partner / family member to same household — real-time sync",        "Medium",     "Free"],
]
story.append(make_feature_table(f1, CHARCOAL))

# ── Feature 2: Bria AI Chat ───────────────────────────────────────────────────
story.append(Spacer(1, 0.18*inch))
story.append(Paragraph("Feature 2 — Bria AI Chat", S["h2"]))
story.append(Paragraph(
    "The hero interaction and the entire product bet. Users talk to Bria in natural language. "
    "Bria responds with a warm, calm, premium voice — and actually does things.",
    S["body_mid"]
))

f2 = [
    ["Capability",               "Description",                                                                    "Complexity", "Tier"],
    ["Natural language input",   "User types freely in English (Tagalog support available via system prompt)",      "Low",        "Free"],
    ["Household-aware context",  "Onboarding data seeds Bria's system prompt on every conversation turn",           "Medium",     "Free"],
    ["Quick-suggest chips",      "Pre-built prompts: What do we need? / Add to list / Any tasks today?",            "Low",        "Free"],
    ["Conversation history",     "Per-household chat log in Supabase — Bria remembers past context",                "Low",        "Free"],
    ["Inventory queries",        '"What do we have?" — Bria reads inventory state and responds naturally',           "Medium",     "Free"],
    ["Task creation from chat",  '"Remind me to clean the fridge Sunday" — appears in task list automatically',      "Medium",     "Free"],
    ["Shopping list via chat",   "Bria compiles low-stock + user requests into an organised list",                   "Medium",     "Premium"],
    ["Proactive nudges",         "Bria surfaces low stock or upcoming tasks unprompted — push notification",         "Medium",     "Premium"],
]
story.append(make_feature_table(f2, CHARCOAL))

# ── Feature 3: Inventory ──────────────────────────────────────────────────────
story.append(Spacer(1, 0.18*inch))
story.append(Paragraph("Feature 3 — Household Inventory", S["h2"]))
story.append(Paragraph(
    "The first concrete use case Bria acts on. Chat is the primary input. "
    "The Upload Receipt button is the shortcut — it hides email forwarding behind familiar UX, "
    "and will be upgraded to OCR in Phase 2 without the button ever changing.",
    S["body_mid"]
))

f3 = [
    ["Capability",               "Description",                                                                          "Complexity", "Tier"],
    ["Inventory state",          "Database tracks item, quantity, category, unit, low threshold, last updated",           "Low",        "Free"],
    ["Chat-driven updates",      '"Bria, I bought 2kg rice" — Bria parses and updates inventory automatically',           "Medium",     "Free"],
    ["Manual entry",             "User can add/edit items directly in the supplies list",                                 "Low",        "Free"],
    ["Low stock detection",      "Bria flags items below threshold — surfaced in dashboard and chat",                     "Low",        "Free"],
    ["Upload Receipt button",    "Phase 1: forwards email to receipts@getbria.com, Claude extracts items as text",        "Medium",     "Free"],
    ["",                         "Phase 2 upgrade: same button triggers camera OCR — UX never changes",                  "",           ""],
    ["One-tap order handoff",    "Shopping list shows deep link to Instacart / Amazon Fresh — no API, just a link out",   "Low",        "Free"],
    ["Consumption patterns",     "Data model built to support pattern learning in Phase 2 — foundation only",             "Low",        "Free"],
]
story.append(make_feature_table(f3, BLUE))

# ── Feature 4: Concierge ──────────────────────────────────────────────────────
story.append(Spacer(1, 0.18*inch))
story.append(Paragraph("Feature 4 — Brighthouse Concierge", S["h2"]))
story.append(Paragraph(
    "One dedicated VA handles whatever the app cannot automate yet. "
    "Requests come through a simple in-app form and route to the VA via Slack/email. "
    "No portal, no ticketing system needed in Phase 1.",
    S["body_mid"]
))

f4 = [
    ["Capability",              "Description",                                                                   "Complexity", "Tier"],
    ["Request form",            "5-field in-app form: name, request type, description, urgency, contact pref",  "Low",        "VA"],
    ["VA routing",              "Submission triggers Slack message + email to VA — manual handling from there",  "Low",        "VA"],
    ["Pricing display",         "Intro $75 / Standard from $100 / Monthly from $350 — shown before submit",     "Low",        "VA"],
    ["Separation clarifier",    "Clear UI copy: Concierge is separate from the app subscription",                "Low",        "VA"],
]
story.append(make_feature_table(f4, MID))

story.append(PageBreak())

# ════════════════════════════════════════════════════
# UPLOAD RECEIPT — HOW IT WORKS
# ════════════════════════════════════════════════════
story.append(Paragraph("Upload Receipt — Technical Design", S["h1"]))
story.append(gold_hr())
story.append(Paragraph(
    "The Upload Receipt button is a UX wrapper that hides the technical implementation from the user. "
    "In Phase 1 it uses email parsing. In Phase 2 it uses OCR. The button never changes.",
    S["body"]
))
story.append(Spacer(1, 0.08*inch))

flow_rows = [
    ["Phase",    "What User Does",                          "What Happens Behind the Button",                                        "Tech"],
    ["Phase 1",  "Taps Upload Receipt, selects From Email, forwards any grocery receipt email to their unique Bria address",
                 "Postmark webhook receives email, passes to Node.js, Claude extracts items + quantities as plain text, inventory updates",
                 "Postmark inbound + Claude API"],
    ["Phase 2",  "Taps Upload Receipt, selects Take Photo",
                 "Camera captures receipt, OCR engine extracts text, Claude parses items + quantities, inventory updates",
                 "OCR + Claude API"],
    ["Phase 2+", "No action needed",
                 "Instacart / GrabMart / Woolworths API pushes purchase data directly — inventory updates automatically on order completion",
                 "Delivery partner APIs"],
]

flow_built = []
for i, row in enumerate(flow_rows):
    fn = "Helvetica-Bold" if i == 0 else "Helvetica"
    tc = WHITE if i == 0 else CHARCOAL
    bg = CHARCOAL if i == 0 else (SAGE_LIGHT if i == 1 else GOLD_LIGHT if i == 2 else BLUE_SOFT)
    flow_built.append([
        Paragraph(row[0], style(f"fl{i}a", fontName="Helvetica-Bold", fontSize=9.5, textColor=tc if i==0 else GOLD_DARK)),
        Paragraph(row[1], style(f"fl{i}b", fontName=fn, fontSize=9.5, textColor=tc if i==0 else MID, leading=13)),
        Paragraph(row[2], style(f"fl{i}c", fontName=fn, fontSize=9.5, textColor=tc if i==0 else MID, leading=13)),
        Paragraph(row[3], style(f"fl{i}d", fontName="Helvetica-Bold", fontSize=9, textColor=tc if i==0 else BLUE)),
    ])

flow_t = Table(flow_built, colWidths=[0.75*inch, 1.8*inch, 3.0*inch, 1.15*inch])
flow_cmds = [
    ("BACKGROUND",    (0,0), (-1,0), CHARCOAL),
    ("BACKGROUND",    (0,1), (-1,1), SAGE_LIGHT),
    ("BACKGROUND",    (0,2), (-1,2), GOLD_LIGHT),
    ("BACKGROUND",    (0,3), (-1,3), BLUE_SOFT),
    ("TOPPADDING",    (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ("LEFTPADDING",   (0,0), (-1,-1), 9),
    ("RIGHTPADDING",  (0,0), (-1,-1), 9),
    ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#E0DDD6")),
    ("VALIGN",        (0,0), (-1,-1), "TOP"),
]
flow_t.setStyle(TableStyle(flow_cmds))
story.append(flow_t)
story.append(Spacer(1, 0.1*inch))
story.append(Paragraph(
    "Each household gets a unique inbound email address (e.g. home-a3f9@receipts.getbria.com). "
    "One-time setup: user adds it as a contact and forwards receipts whenever they shop. "
    "Bria processes it silently — no manual input required after setup.",
    S["disclaimer"]
))

# ════════════════════════════════════════════════════
# MONETISATION
# ════════════════════════════════════════════════════
story.append(Spacer(1, 0.2*inch))
story.append(Paragraph("Monetisation — Free vs Premium vs Concierge", S["h1"]))
story.append(gold_hr())
story.append(Paragraph(
    "App subscriptions and Concierge are always separate products. "
    "Stripe billing is deferred to Phase 2 — Phase 1 ships free to maximise early signups and validation.",
    S["body"]
))
story.append(Spacer(1, 0.08*inch))

mon_rows = [
    ["Plan",                  "Price",            "What's Included",                                                          "Phase"],
    ["Free",                  "$0",               "Auth, onboarding, Bria chat (basic), inventory via chat, task list, manual inventory entry, Upload Receipt", "Phase 1"],
    ["Premium AI",            "$9.99/mo or $69.99/yr",
                                                  "Everything in Free + smart shopping list, proactive nudges, expanded inventory history, priority chat responses",
                                                                                                                              "Phase 2"],
    ["Brighthouse Concierge", "$75–$350/mo",       "One dedicated VA. Separate from app plan entirely. Handles what the app cannot automate. Routed via Slack/email in Phase 1.", "Phase 1 (form only)"],
]

mon_built = []
for i, row in enumerate(mon_rows):
    if i == 0:
        mon_built.append([
            Paragraph(row[0], style("mh0", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            Paragraph(row[1], style("mh1", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            Paragraph(row[2], style("mh2", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            Paragraph(row[3], style("mh3", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
        ])
    else:
        tier_bg = {1: SAGE_LIGHT, 2: GOLD_LIGHT, 3: BLUE_SOFT}
        tier_tc = {1: SAGE, 2: GOLD_DARK, 3: BLUE}
        mon_built.append([
            Paragraph(row[0], style(f"mp{i}a", fontName="Helvetica-Bold", fontSize=9.5, textColor=tier_tc[i])),
            Paragraph(row[1], style(f"mp{i}b", fontName="Helvetica-Bold", fontSize=9.5, textColor=CHARCOAL)),
            Paragraph(row[2], style(f"mp{i}c", fontName="Helvetica",      fontSize=9.5, textColor=MID, leading=13)),
            Paragraph(row[3], style(f"mp{i}d", fontName="Helvetica-Bold", fontSize=9,   textColor=tier_tc[i], alignment=TA_CENTER)),
        ])

mon_t = Table(mon_built, colWidths=[1.3*inch, 1.3*inch, 3.1*inch, 1.05*inch])
mon_cmds = [
    ("BACKGROUND",    (0,0), (-1,0), CHARCOAL),
    ("BACKGROUND",    (0,1), (-1,1), SAGE_LIGHT),
    ("BACKGROUND",    (0,2), (-1,2), GOLD_LIGHT),
    ("BACKGROUND",    (0,3), (-1,3), BLUE_SOFT),
    ("TOPPADDING",    (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ("LEFTPADDING",   (0,0), (-1,-1), 9),
    ("RIGHTPADDING",  (0,0), (-1,-1), 9),
    ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#E0DDD6")),
    ("VALIGN",        (0,0), (-1,-1), "TOP"),
]
mon_t.setStyle(TableStyle(mon_cmds))
story.append(mon_t)

story.append(PageBreak())

# ════════════════════════════════════════════════════
# TECH STACK
# ════════════════════════════════════════════════════
story.append(Paragraph("Technology Stack", S["h1"]))
story.append(gold_hr())

stack_rows = [
    ["Layer",               "Technology",                    "Rationale"],
    ["Mobile App",          "React Native + Expo",           "Single codebase iOS + Android. Expo handles push notifications, camera, and App Store submission tooling."],
    ["API Backend",         "Node.js + Fastify",             "Lightweight and fast. Handles AI requests, email webhooks, inventory logic. Deploy on Railway — free to start."],
    ["Database / Auth",     "Supabase (Postgres)",           "Relational DB + RLS for household isolation + Auth + Realtime + Storage. Free tier covers first 50K MAU."],
    ["AI / Chat",           "Claude 3.7 Sonnet",             "Best instruction-following for Bria's voice and persona. Prompt caching cuts costs 80% at scale."],
    ["Email Parsing",       "Postmark (inbound)",            "Receives forwarded receipts, fires webhook to Node.js. Claude extracts items as plain text — no OCR needed."],
    ["Push Notifications",  "Expo Notifications + FCM",      "iOS + Android in one call. Required for proactive nudges and reminders."],
    ["Payments",            "Stripe (Phase 2)",              "Subscription billing deferred. Phase 1 ships fully free."],
]

stack_built = []
for i, row in enumerate(stack_rows):
    if i == 0:
        stack_built.append([
            Paragraph(row[0], style("skh0", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            Paragraph(row[1], style("skh1", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            Paragraph(row[2], style("skh2", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
        ])
    else:
        stack_built.append([
            Paragraph(row[0], style(f"sk{i}a", fontName="Helvetica-Bold", fontSize=9.5, textColor=CHARCOAL)),
            Paragraph(row[1], style(f"sk{i}b", fontName="Helvetica-Bold", fontSize=9.5, textColor=GOLD_DARK)),
            Paragraph(row[2], style(f"sk{i}c", fontName="Helvetica",      fontSize=9.5, textColor=MID, leading=13)),
        ])

stack_t = Table(stack_built, colWidths=[1.35*inch, 1.65*inch, 3.7*inch])
stack_t.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (-1,0), CHARCOAL),
    ("TOPPADDING",    (0,0), (-1,-1), 7),
    ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ("LEFTPADDING",   (0,0), (-1,-1), 9),
    ("RIGHTPADDING",  (0,0), (-1,-1), 9),
    ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#E0DDD6")),
    ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, CREAM]),
]))
story.append(stack_t)

# ════════════════════════════════════════════════════
# TIMELINE
# ════════════════════════════════════════════════════
story.append(Spacer(1, 0.2*inch))
story.append(Paragraph("Development Timeline — Solo Build", S["h1"]))
story.append(gold_hr())
story.append(Paragraph(
    "Realistic estimate for one person building full-time. Part-time adds 4–6 weeks. "
    "Timeline assumes welcome variant, bundle ID, and App Store enrollment are decided before Week 1.",
    S["body"]
))
story.append(Spacer(1, 0.08*inch))

tl_rows = [
    ["Week",     "Milestone",                  "Deliverables",                                                                              "Risk"],
    ["1–2",      "Foundation",                 "React Native scaffold · Supabase schema · Auth (email + Google + Apple) · Nav structure",    "Low"],
    ["3–4",      "Onboarding + Profile",       "4-step onboarding · Household profile · Feeds Claude system prompt",                         "Low"],
    ["5–6",      "Bria AI Chat",               "Claude API integration · Chat UI · Quick-suggest chips · Conversation history",              "Medium"],
    ["7–8",      "Inventory + Upload Receipt", "Inventory data model · Chat-driven updates · Postmark email webhook · Upload Receipt UX",    "Medium"],
    ["9",        "Dashboard + Tasks",          "Basic dashboard · Task list · Low stock indicators · Shopping list",                         "Low"],
    ["10",       "Concierge Form",             "Request form · Slack/email routing to VA · Pricing display · Separation clarifier",          "Low"],
    ["11",       "Polish + QA",                "Empty states · Error handling · Bria voice QA · Device testing (iOS + Android)",             "Low"],
    ["12",       "Beta + Submission",          "TestFlight · Google Play Internal Track · 20–50 beta users · App Store submission",          "Medium"],
]

tl_built = []
for i, row in enumerate(tl_rows):
    if i == 0:
        tl_built.append([
            Paragraph(row[0], style("tlh0", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            Paragraph(row[1], style("tlh1", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            Paragraph(row[2], style("tlh2", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            Paragraph(row[3], style("tlh3", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
        ])
    else:
        tl_built.append([
            Paragraph(row[0], style(f"tl{i}a", fontName="Helvetica-Bold", fontSize=9.5, textColor=GOLD_DARK)),
            Paragraph(row[1], style(f"tl{i}b", fontName="Helvetica-Bold", fontSize=9.5, textColor=CHARCOAL)),
            Paragraph(row[2], style(f"tl{i}c", fontName="Helvetica",      fontSize=9.5, textColor=MID, leading=13)),
            Paragraph(row[3], style(f"tl{i}d", fontName="Helvetica-Bold", fontSize=9,   textColor=WHITE, alignment=TA_CENTER)),
        ])

tl_t = Table(tl_built, colWidths=[0.55*inch, 1.3*inch, 4.0*inch, 0.85*inch])
tl_cmds = [
    ("BACKGROUND",    (0,0), (-1,0), CHARCOAL),
    ("TOPPADDING",    (0,0), (-1,-1), 7),
    ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ("LEFTPADDING",   (0,0), (-1,-1), 9),
    ("RIGHTPADDING",  (0,0), (-1,-1), 9),
    ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#E0DDD6")),
    ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, CREAM]),
]
risk_map = {"Low": SAGE, "Medium": GOLD, "High": RED}
for i, row in enumerate(tl_rows[1:], 1):
    rc = risk_map.get(row[3], MID)
    tl_cmds += [
        ("BACKGROUND", (3,i), (3,i), rc),
        ("TEXTCOLOR",  (3,i), (3,i), WHITE),
        ("FONTNAME",   (3,i), (3,i), "Helvetica-Bold"),
        ("ALIGN",      (3,i), (3,i), "CENTER"),
    ]
tl_t.setStyle(TableStyle(tl_cmds))
story.append(tl_t)

story.append(PageBreak())

# ════════════════════════════════════════════════════
# SUCCESS METRICS
# ════════════════════════════════════════════════════
story.append(Paragraph("Success Metrics — Phase 1", S["h1"]))
story.append(gold_hr())

sm_rows = [
    ["Metric",                              "Target",       "Why It Matters"],
    ["Beta signups",                        "200+",         "Validates demand. US-first, Philippines secondary."],
    ["Chat sessions per user / week",       "3+",           "Is Bria becoming a daily habit?"],
    ["Inventory items tracked / household", "10+",          "Validates the intelligence layer use case"],
    ["Upload Receipt activations",          ">40% of users","Confirms the email parsing UX is clear enough"],
    ["D7 retention",                        ">40%",         "Core health metric — are users coming back?"],
    ["NPS from beta",                       ">50",          "Premium positioning requires premium satisfaction"],
    ["Onboarding completion rate",          ">70%",         "Drop-off here means Bria never gets context to be useful"],
    ["Concierge request submissions",       "5+ in Week 12","Validates willingness to pay for human support"],
]

sm_built = []
for i, row in enumerate(sm_rows):
    if i == 0:
        sm_built.append([
            Paragraph(row[0], style("smh0", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            Paragraph(row[1], style("smh1", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            Paragraph(row[2], style("smh2", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
        ])
    else:
        sm_built.append([
            Paragraph(row[0], style(f"sm{i}a", fontName="Helvetica-Bold", fontSize=9.5, textColor=CHARCOAL)),
            Paragraph(row[1], style(f"sm{i}b", fontName="Helvetica-Bold", fontSize=9.5, textColor=GOLD_DARK)),
            Paragraph(row[2], style(f"sm{i}c", fontName="Helvetica",      fontSize=9.5, textColor=MID, leading=13)),
        ])

sm_t = Table(sm_built, colWidths=[2.4*inch, 1.2*inch, 3.2*inch])
sm_t.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (-1,0), SAGE),
    ("TOPPADDING",    (0,0), (-1,-1), 7),
    ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ("LEFTPADDING",   (0,0), (-1,-1), 9),
    ("RIGHTPADDING",  (0,0), (-1,-1), 9),
    ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#E0DDD6")),
    ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, SAGE_LIGHT]),
]))
story.append(sm_t)

# ════════════════════════════════════════════════════
# DECISIONS NEEDED
# ════════════════════════════════════════════════════
story.append(Spacer(1, 0.2*inch))
story.append(Paragraph("Decisions Needed Before Development Starts", S["h1"]))
story.append(gold_hr())

dec_rows = [
    ["#", "Decision",                              "Options",                                                        "Owner"],
    ["1",  "Welcome screen variant",               "A — Calm (cream) · B — Warm (sage+gold) · C — Bright (coral)",  "Product Owner"],
    ["2",  "Bundle ID",                            "com.brighthouse.bria  OR  com.getbria.app",                      "Product Owner"],
    ["3",  "Domain registration",                  "Register bria.app + getbria.com together (recommended)",         "Product Owner"],
    ["4",  "App Store enrollment",                 "Enroll Brighthouse as developer on Apple + Google Play",         "Founder"],
    ["5",  "Onboarding: 4 steps or 8 steps?",      "Lean 4-step (recommended) vs full 8-step from prototype",        "Product Owner"],
    ["6",  "Beta recruitment strategy",            "How will first 200 US users be sourced for TestFlight?",         "Product Owner"],
]

dec_built = []
for i, row in enumerate(dec_rows):
    if i == 0:
        dec_built.append([
            Paragraph(row[0], style("dh0", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            Paragraph(row[1], style("dh1", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            Paragraph(row[2], style("dh2", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
            Paragraph(row[3], style("dh3", fontName="Helvetica-Bold", fontSize=9.5, textColor=WHITE)),
        ])
    else:
        dec_built.append([
            Paragraph(row[0], style(f"dc{i}a", fontName="Helvetica-Bold", fontSize=9.5, textColor=GOLD_DARK, alignment=TA_CENTER)),
            Paragraph(row[1], style(f"dc{i}b", fontName="Helvetica-Bold", fontSize=9.5, textColor=CHARCOAL)),
            Paragraph(row[2], style(f"dc{i}c", fontName="Helvetica",      fontSize=9.5, textColor=MID, leading=13)),
            Paragraph(row[3], style(f"dc{i}d", fontName="Helvetica-Bold", fontSize=9.5, textColor=GOLD_DARK)),
        ])

dec_t = Table(dec_built, colWidths=[0.3*inch, 1.8*inch, 3.2*inch, 1.4*inch])
dec_t.setStyle(TableStyle([
    ("BACKGROUND",    (0,0), (-1,0), GOLD_DARK),
    ("TOPPADDING",    (0,0), (-1,-1), 7),
    ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ("LEFTPADDING",   (0,0), (-1,-1), 9),
    ("RIGHTPADDING",  (0,0), (-1,-1), 9),
    ("GRID",          (0,0), (-1,-1), 0.4, colors.HexColor("#E0DDD6")),
    ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, GOLD_LIGHT]),
    ("ALIGN",         (0,0), (0,-1), "CENTER"),
]))
story.append(dec_t)

# ════════════════════════════════════════════════════
# CLOSING
# ════════════════════════════════════════════════════
story.append(Spacer(1, 0.35*inch))
story.append(hr(GOLD, 1))
story.append(Spacer(1, 0.12*inch))
story.append(Paragraph(
    "Phase 1 is about one thing: proving that Bria feels like a real assistant, not another app. "
    "Ship small. Validate fast. Build Phase 2 on users who already love it.",
    style("closing", fontName="Helvetica-Oblique", fontSize=11, textColor=CHARCOAL, alignment=TA_CENTER, leading=16)
))
story.append(Spacer(1, 0.15*inch))
story.append(Paragraph("Bria by Brighthouse  ·  Phase 1 Product Specification v2.0  ·  June 2026", S["footer"]))

doc.build(story)
print(f"Created: {OUTPUT}")

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API_BASE = "https://your-project.vercel.app";

const THEMES = {
  dark: {
    bg:"#0a0d14", surface:"#0e1219", card:"#111827", border:"#1e2636",
    borderHi:"#2a3650", accent:"#00e5a0", accentDim:"#00e5a012",
    red:"#f43f5e", gold:"#f59e0b", blue:"#3b82f6",
    cyan:"#06b6d4", orange:"#f97316", purple:"#8b5cf6",
    text:"#e2e8f0", textDim:"#94a3b8", muted:"#475569", tabBar:"#080b10",
    funded:"#00e5a0", fundedBg:"#00e5a012",
    underfunded:"#f59e0b", underfundedBg:"#f59e0b12",
    overspent:"#f43f5e", overspentBg:"#f43f5e12",
  },
  light: {
    bg:"#f8f7f4", surface:"#ffffff", card:"#ffffff", border:"#e5e0d8",
    borderHi:"#d4cdc2", accent:"#0a7c5c", accentDim:"#0a7c5c12",
    red:"#dc2626", gold:"#d97706", blue:"#2563eb",
    cyan:"#0891b2", orange:"#ea580c", purple:"#7c3aed",
    text:"#1a1814", textDim:"#6b6460", muted:"#9d9690", tabBar:"#f0ede8",
    funded:"#0a7c5c", fundedBg:"#0a7c5c10",
    underfunded:"#d97706", underfundedBg:"#d9770610",
    overspent:"#dc2626", overspentBg:"#dc262610",
  },
  midnight: {
    bg:"#0d0a1a", surface:"#120f24", card:"#18132e", border:"#2a2040",
    borderHi:"#3d2f60", accent:"#c084fc", accentDim:"#c084fc12",
    red:"#fb7185", gold:"#fbbf24", blue:"#60a5fa",
    cyan:"#34d399", orange:"#fb923c", purple:"#a78bfa",
    text:"#f0e8ff", textDim:"#a78bfa", muted:"#6d5d8a", tabBar:"#080612",
    funded:"#c084fc", fundedBg:"#c084fc12",
    underfunded:"#fbbf24", underfundedBg:"#fbbf2412",
    overspent:"#fb7185", overspentBg:"#fb718512",
  },
  tape: {
    // Calm analog — worn linen, faded oxide, quiet warmth
    bg:"#16120e", surface:"#1e1812", card:"#252018", border:"#35291c",
    borderHi:"#4a3a28", accent:"#c8924a", accentDim:"#c8924a12",
    red:"#c0614a", gold:"#c8924a", blue:"#7a9eaa",
    cyan:"#7aaa96", orange:"#b87848", purple:"#9a84aa",
    text:"#e8ddc8", textDim:"#a08c70", muted:"#685848", tabBar:"#100e0a",
    funded:"#c8924a", fundedBg:"#c8924a12",
    underfunded:"#b87848", underfundedBg:"#b8784812",
    overspent:"#c0614a", overspentBg:"#c0614a12",
  },
};

// Global mutable theme reference — updated when user changes theme
// Always read from localStorage — single source of truth
const getThemeColors = () => { try { return THEMES[localStorage.getItem("pursuivo_theme") || "dark"] || THEMES.dark; } catch { return THEMES.dark; } };
let C = getThemeColors();

// useC() — reads the current global C which is updated on theme change + remount
// Works because key={theme} on root div fully remounts the tree on switch
const useC = () => C;

const F = { sans:"'Plus Jakarta Sans', sans-serif", mono:"'DM Mono', monospace" };

const GROUPS = [
  { id:"bills", label:"Bills", icon:"🏠", cats:[
    { id:"rent",     label:"Rent / Mortgage", target:700, freq:"monthly" },
    { id:"electric", label:"Electric",        target:80,  freq:"monthly" },
    { id:"internet", label:"Internet",        target:50,  freq:"monthly" },
    { id:"phone",    label:"Phone",           target:40,  freq:"monthly" },
  ]},
  { id:"needs", label:"Needs", icon:"🛒", cats:[
    { id:"groceries", label:"Groceries",  target:180, freq:"monthly" },
    { id:"transport", label:"Transport",  target:100, freq:"monthly" },
    { id:"health",    label:"Health",     target:60,  freq:"monthly" },
    { id:"household", label:"Household",  target:30,  freq:"monthly" },
  ]},
  { id:"wants", label:"Wants", icon:"✨", cats:[
    { id:"dining",        label:"Dining Out",    target:60,  freq:"monthly" },
    { id:"delivery",      label:"Delivery",      target:120, freq:"monthly" },
    { id:"entertainment", label:"Entertainment", target:40,  freq:"monthly" },
    { id:"subscriptions", label:"Subscriptions", target:50,  freq:"monthly" },
    { id:"shopping",      label:"Shopping",      target:90,  freq:"monthly" },
    { id:"travel",        label:"Travel",        target:50,  freq:"monthly" },
  ]},
  { id:"savings", label:"Savings Goals", icon:"🎯", cats:[
    { id:"emergency", label:"Emergency Fund", target:100, freq:"monthly" },
    { id:"vacation",  label:"Vacation Fund",  target:50,  freq:"monthly" },
    { id:"investing", label:"Investing",      target:80,  freq:"monthly" },
  ]},
];
const ALL_CATS = GROUPS.flatMap(g => g.cats);

const DESC_TO_CAT = {
  "DoorDash Burger":"dining","DoorDash Eggsu":"dining","DoorDash Insom":"dining",
  "DoorDash Joy of":"dining","DoorDash Marco":"dining","DoorDash McDonald's":"dining",
  "DoorDash Popeyes":"dining","DoorDash Sully":"dining","DoorDash 7-Eleven":"dining",
  "DoorDash Shop":"dining","DoorDash DashPass":"dining",
  "Domino's":"dining","Dunkin'":"dining","McDonald's":"dining",
  "ALDI":"groceries","ShopRite":"groceries","Stop & Shop":"groceries",
  "Taylors Food Mart":"groceries","Dollar General":"groceries","Walmart":"groceries",
  "Sarmarket":"groceries","RK Mart":"groceries","7-Eleven":"groceries",
  "Exxon":"transport","Shell":"transport",
  "Supercharged":null,
  "Breeze Airways":"travel",
  "Spotify":"subscriptions","Crunchyroll":"subscriptions","Amazon Prime":"subscriptions",
  "Kindle Unlimited":"subscriptions","Audible":"subscriptions","Discord Nitro":"subscriptions",
  "Steam":"entertainment","Steam Games":"entertainment","Steam Purchase":"entertainment","Riot Games":"entertainment",
  "Amazon":"shopping","Target":"shopping","Ross Stores":"shopping","TJ Maxx":"shopping",
  "Best Buy":"shopping","Barnes & Noble":"shopping",
  "Crunch Fitness":"health","YMCA":"health","507 Salon":"health","Walgreens":"health",
  "Spectrum":"internet",
  "Schwab Brokerage":null,"Interbank Transfer":null,"Zelle from Diana Ho":null,"Zelle from Miraj":null,
};

function guessCategory(d) {
  d = d.toLowerCase();
  if (/doordash|grubhub|ubereats|postmates|dashpass|caviar|seamless/.test(d)) return "🚗 Delivery";
  if (/aldi|shoprite|stop.shop|stop & shop|walmart|trader joe|whole foods|kroger|publix|safeway|market|grocery|food mart|dollar general|7-eleven|sarmarket|rk mart/.test(d)) return "🛒 Groceries";
  if (/chipotle|starbucks|domino|mcdonald|dunkin|popeye|burger king|taco bell|subway|chick-fil|wendy|five guys|panera|pizza|sushi|ramen/.test(d)) return "🍽 Dining Out";
  if (/exxon|shell|bp |chevron|mobil|marathon|gas station|sunoco|speedway/.test(d)) return "Transport";
  if (/uber|lyft|metro|transit|mta|parking|breeze|airline|flight/.test(d)) return "Travel";
  if (/spotify|crunchyroll|amazon prime|netflix|hulu|disney|apple.music|kindle|audible|discord|youtube premium/.test(d)) return "🔔 Subscriptions";
  if (/steam|riot|playstation|xbox|nintendo|epic games/.test(d)) return "Entertainment";
  if (/amazon|target|ross|tjmaxx|tj maxx|best buy|barnes|zara|h&m|uniqlo|gap|old navy/.test(d)) return "Shopping";
  if (/spectrum|at&t|verizon|t-mobile|comcast|xfinity|cox|electric|utilities|gas bill|water bill/.test(d)) return "Utilities";
  if (/crunch|ymca|gym|planet fitness|equinox|la fitness|salon|spa|walgreens|cvs|pharmacy|doctor|dental|vision/.test(d)) return "Health";
  if (/salary|payroll|direct deposit|schwab|fidelity|vanguard|brokerage|zelle|venmo|cashapp|paypal/.test(d)) return "Income";
  if (/tobacco|cigarette|cigar|vape|smoke/.test(d)) return "🚩 Tobacco";
  if (/draftkings|betmgm|fanduel|casino|lottery|pokerstars/.test(d)) return "🚩 Gambling";
  if (/overdraft|nsf fee|insufficient|late fee|service fee/.test(d)) return "🚩 Fees";
  if (/atm fee|atm surcharge|withdrawal fee/.test(d)) return "🚩 Fees";
  if (/atm|cash withdrawal/.test(d)) return "🚩 Cash";
  return "❓ Unclear";
}

const CAT_TO_BUDGET = {
  "🛒 Groceries":"groceries","🍽 Dining Out":"dining","🚗 Delivery":"delivery",
  "🔔 Subscriptions":"subscriptions",Travel:"travel",
  Food:"groceries",Transport:"transport",Shopping:"shopping",
  Entertainment:"entertainment",Health:"health",Utilities:"electric",
  "🍔 Dining":"dining",Income:null,Other:null,
  "🚩 Tobacco":null,"🚩 Cash":null,"🚩 Fees":null,"🚩 Gambling":null,"❓ Unclear":null,
};

function txToBudgetCat(t) {
  if (t.type === "income") return null;
  const exact = DESC_TO_CAT[t.description];
  if (exact !== undefined) return exact;
  return CAT_TO_BUDGET[t.category] || null;
}

const CAT_TX_COLOR = {
  "🛒 Groceries":C.accent,"🍽 Dining Out":C.cyan,"🚗 Delivery":C.orange,
  "🔔 Subscriptions":"#8b5cf6",Travel:"#60a5fa",
  Food:C.accent,Transport:C.blue,Shopping:C.purple,
  Entertainment:C.gold,Health:C.orange,Utilities:C.cyan,
  Income:C.accent,Other:C.muted,
  "🚩 Tobacco":"#a78bfa","🚩 Cash":"#64748b","🚩 Fees":"#ef4444","🚩 Gambling":"#f97316",
  "❓ Unclear":"#94a3b8",
};

const STATUS_COLOR = { funded:C.funded, underfunded:C.underfunded, overspent:C.overspent, empty:C.muted };
const STATUS_BG    = { funded:C.fundedBg, underfunded:C.underfundedBg, overspent:C.overspentBg, empty:"transparent" };

const fmt     = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
const fmtFull = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
const MONTHS       = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PIE_COLORS   = [C.accent,C.blue,C.purple,C.gold,C.orange,C.cyan,C.red,"#ec4899","#14b8a6","#84cc16"];

function getNowMonth()    { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function getLastMonth()   { const d=new Date(); d.setMonth(d.getMonth()-1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function getMonthMinus2() { const d=new Date(); d.setMonth(d.getMonth()-2); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function fmtDate(iso) { const [,m,d]=iso.split("-"); return `${MONTHS_SHORT[+m-1]} ${+d}`; }
function fmtMonthLabel(iso) { const [y,m]=iso.split("-"); return `${MONTHS[+m-1]} ${y}`; }
function ls(k,def) { try { const v=localStorage.getItem(k); return v?JSON.parse(v):def; } catch { return def; } }
function catStatus(assigned,target,spent) {
  if (assigned===0&&spent===0) return "empty";
  if (spent>assigned) return "overspent";
  if (assigned>=target) return "funded";
  return "underfunded";
}

// ─── Theme hook ───────────────────────────────────────────────────────────────
function useTheme() {
  const [themeName, setThemeName] = useState(
    () => { try { return localStorage.getItem("pursuivo_theme") || "dark"; } catch { return "dark"; } }
  );
  const setTheme = (t) => {
    const valid = THEMES[t] ? t : "dark";
    try { localStorage.setItem("pursuivo_theme", valid); } catch {}
    // Update global C immediately so all components see new colors on next render
    C = THEMES[valid];
    document.querySelector("meta[name='theme-color']")
      ?.setAttribute("content", THEMES[valid].bg);
    setThemeName(valid);
  };
  return [themeName, setTheme];
}

const PROFILE_STEPS = [

  // ── PHASE 1: YOUR SITUATION (things the app cannot see) ─────────────────────
  { id:"safety_net", phase:"Your Situation", phaseNum:1, emoji:"🛡️",
    question:"Do you have any savings set aside right now?",
    sub:"Not in this account — anywhere. A separate savings account, cash, anything you could access in an emergency.",
    options:[
      {value:"zero",       label:"Nothing saved",              sub:"One bad week would break everything"},
      {value:"under_500",  label:"Less than $500",             sub:"Barely started"},
      {value:"under_1k",   label:"$500–$1,000",                sub:"Starter cushion"},
      {value:"one_month",  label:"About 1 month of expenses",  sub:"Basic protection"},
      {value:"three_plus", label:"3+ months of expenses",      sub:"Real security"},
    ],
  },

  { id:"debt_total", phase:"Your Situation", phaseNum:1, emoji:"⚖️",
    question:"How much total debt do you carry outside of this account?",
    sub:"Credit cards, student loans, personal loans, car payments. Not mortgage — everything else.",
    options:[
      {value:"none",       label:"No debt",          sub:"Clean slate"},
      {value:"under_2k",   label:"Under $2,000",     sub:"Small, beatable"},
      {value:"2k_10k",     label:"$2,000–$10,000",   sub:"Meaningful — needs a plan"},
      {value:"10k_30k",    label:"$10,000–$30,000",  sub:"Significant — needs a real plan"},
      {value:"over_30k",   label:"Over $30,000",     sub:"Long-term payoff required"},
    ],
  },

  { id:"income_pattern", phase:"Your Situation", phaseNum:1, emoji:"💰",
    question:"How predictable is your income month to month?",
    sub:"Your statements show deposits but not whether they're guaranteed next month.",
    options:[
      {value:"steady",   label:"Same amount every month",             sub:"Predictable, easy to plan"},
      {value:"variable", label:"Varies — some months more, some less", sub:"Feast and famine rhythm"},
      {value:"gig",      label:"Freelance or project-based",           sub:"Income tied to active work"},
      {value:"mixed",    label:"Steady base plus variable on top",     sub:"Salary plus side income"},
    ],
  },

  // ── PHASE 2: YOUR GOAL ───────────────────────────────────────────────────────
  { id:"rich_life_vision", phase:"Your Goal", phaseNum:2, emoji:"🌟",
    question:"What does having your finances right actually make possible?",
    sub:"Not what sounds responsible. What actually matters to you.",
    options:[
      {value:"freedom",     label:"Never worrying about money again",    sub:"Security and full optionality"},
      {value:"home",        label:"Owning a home",                       sub:"Equity, stability, yours"},
      {value:"time",        label:"Buying back my time",                 sub:"Work less, choose more"},
      {value:"experiences", label:"Experiences — travel, events, life",  sub:"Stories over stuff"},
      {value:"family",      label:"Taking care of the people I love",    sub:"Providing, protecting, giving"},
      {value:"build",       label:"Building something of my own",        sub:"Business, brand, legacy"},
    ],
  },

  { id:"goal_timeline", phase:"Your Goal", phaseNum:2, emoji:"⏱️",
    question:"When do you want to get there?",
    sub:"A goal without a timeline is just a wish.",
    options:[
      {value:"now",  label:"I need progress this month",  sub:"Urgent — things need to change now"},
      {value:"1yr",  label:"Within the next year",        sub:"12 months of focused effort"},
      {value:"3yr",  label:"1–3 years",                   sub:"Building steadily"},
      {value:"5yr",  label:"3–5 years",                   sub:"Medium-term commitment"},
      {value:"10yr", label:"5–10 years",                  sub:"Long game"},
    ],
  },

  { id:"first_win", phase:"Your Goal", phaseNum:2, emoji:"🎯",
    question:"If Pursuivo could give you one concrete win in the next 30 days, what would it be?",
    sub:"One thing. The most useful thing. Not a wish list.",
    options:[
      {value:"see_truth",  label:"Show me exactly where my money goes",    sub:"I want the honest picture"},
      {value:"stop_bleed", label:"Find and stop the biggest leaks",        sub:"Stop the waste first"},
      {value:"first_1k",   label:"Save my first $1,000 emergency fund",   sub:"Build the foundation"},
      {value:"debt_start", label:"Start a real plan to kill debt",         sub:"Smallest debt first"},
      {value:"habit",      label:"Build a saving habit I can stick to",    sub:"Automate something"},
      {value:"understand", label:"Just understand what I have",            sub:"Clarity before action"},
    ],
  },

  // ── PHASE 3: YOUR BEHAVIOUR ───────────────────────────────────────────────────
  { id:"spending_trigger", phase:"Your Behaviour", phaseNum:3, emoji:"🔄",
    question:"When you overspend, what's usually driving it?",
    sub:"Your statements show the what. This tells us the why.",
    options:[
      {value:"impulse",     label:"I see it, I want it, I buy it",          sub:"In the moment, no pause"},
      {value:"emotional",   label:"I spend when stressed, bored, or down",  sub:"Shopping as relief"},
      {value:"social",      label:"Social pressure — events, keeping up",   sub:"Hard to say no"},
      {value:"convenience", label:"Convenience — delivery, easy purchases", sub:"Effort to not spend is too high"},
      {value:"no_tracking", label:"I don't track — it just disappears",     sub:"Only notice when balance drops"},
      {value:"intentional", label:"I rarely overspend",                     sub:"Most spending is considered"},
    ],
  },

  { id:"real_obstacle", phase:"Your Behaviour", phaseNum:3, emoji:"🚧",
    question:"What's actually stopping you from where you want to be?",
    sub:"Most people won't answer this honestly. The ones who do are the ones who change.",
    options:[
      {value:"income_gap",  label:"I don't earn enough",                         sub:"Income is genuinely the constraint"},
      {value:"debt_anchor", label:"Debt is dragging everything down",            sub:"Payments eat before I can save"},
      {value:"no_system",   label:"No system — I wing it every month",           sub:"I never know where I stand"},
      {value:"overspend",   label:"I spend more than I should and I know it",    sub:"The behaviour is the problem"},
      {value:"avoidance",   label:"I avoid looking at it",                       sub:"Ignorance feels better than facing it"},
      {value:"lost",        label:"I genuinely don't know where to start",       sub:"Overwhelmed by all of it"},
    ],
  },

  { id:"automation", phase:"Your Behaviour", phaseNum:3, emoji:"⚙️",
    question:"How much of your finances run automatically right now?",
    sub:"Automation is the most powerful financial tool most people aren't using.",
    options:[
      {value:"manual",  label:"I manually move money and pay bills",           sub:"All decisions are active"},
      {value:"some",    label:"Some things auto-pay, most is manual",          sub:"Bills maybe, savings not"},
      {value:"partial", label:"Bills and savings auto-run",                    sub:"Partial — getting there"},
      {value:"full",    label:"Almost everything runs without me",             sub:"Money moves before I can spend it"},
    ],
  },

  { id:"savings_habit", phase:"Your Behaviour", phaseNum:3, emoji:"🔁",
    question:"How consistently do you actually save right now?",
    sub:"Not the intention. What actually happens at the end of the month.",
    options:[
      {value:"never",     label:"It never happens",                    sub:"Month ends, nothing left"},
      {value:"sometimes", label:"Sometimes — when I remember",         sub:"Inconsistent, no system"},
      {value:"manual",    label:"I move money manually when I can",    sub:"Active effort, not automated"},
      {value:"automated", label:"It comes out automatically",          sub:"Set it and forget it"},
    ],
  },

];
// ─── ProfileFlow ─────────────────────────────────────────────────────────────
function ProfileFlow({onComplete, txContext }) {
  const C = useC();
  const [step, setStep]   = useState(0);
  const [answers, setAnswers] = useState({});
  const s       = PROFILE_STEPS[step];
  const isLast  = step === PROFILE_STEPS.length - 1;
  const progress= Math.round(((step + 1) / PROFILE_STEPS.length) * 100);
  const phases  = [...new Set(PROFILE_STEPS.map(s => s.phase))];
  const fmt     = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);

  const select = (value) => {
    const next = { ...answers, [s.id]: value };
    setAnswers(next);
    if (isLast) onComplete(next);
    else setStep(st => st + 1);
  };

  // Data context cards — shown on relevant questions to ground the answer in reality
  const dataContext = txContext ? {
    spending_trigger: txContext.avgDelivery > 80
      ? { text:`Your statements show ${fmt(txContext.avgDelivery)}/month on delivery — the highest single discretionary category.`, color:"#f97316" }
      : null,
    real_obstacle: txContext.avgTotalSpend > 0 && txContext.avgIncome > 0
      ? { text:`Your real numbers: ${fmt(txContext.avgIncome)}/mo in, ${fmt(txContext.avgTotalSpend)}/mo out. ${txContext.avgIncome > txContext.avgTotalSpend ? fmt(txContext.avgIncome - txContext.avgTotalSpend)+" surplus." : fmt(txContext.avgTotalSpend - txContext.avgIncome)+" deficit."}`, color: txContext.avgIncome > txContext.avgTotalSpend ? "#00e5a0" : "#f43f5e" }
      : null,
    safety_net: txContext.avgFees > 20
      ? { text:`You've paid ${fmt(txContext.avgFees)}/month in bank fees — a signal your balance is running low.`, color:"#f43f5e" }
      : null,
    savings_habit: txContext.avgIncome > 0
      ? { text:`Based on your statements, you're saving about ${Math.max(0,Math.round((txContext.avgIncome - txContext.avgTotalSpend)/txContext.avgIncome*100))}% of your income each month.`, color:"#94a3b8" }
      : null,
  } : {};

  const ctx = dataContext[s.id];

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", maxWidth:430, margin:"0 auto", background:C.bg, fontFamily:F.sans }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'); *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;} ::-webkit-scrollbar{display:none;} button{font-family:inherit;}`}</style>

      {/* Progress bar */}
      <div style={{ height:3, background:C.border, position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, zIndex:200 }}>
        <div style={{ height:3, background:C.accent, width:`${progress}%`, transition:"width 0.35s ease", boxShadow:`0 0 10px ${C.accent}70` }} />
      </div>

      {/* Header */}
      <div style={{ position:"fixed", top:3, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:`${C.bg}f0`, backdropFilter:"blur(20px)", borderBottom:`1px solid ${C.border}`, padding:"12px 20px 10px", zIndex:190 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:10, color:C.accent, fontFamily:F.mono, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:1 }}>Phase {s.phaseNum} of {phases.length} · {s.phase}</div>
            <div style={{ fontSize:10, color:C.muted, fontFamily:F.mono }}>{step + 1} of {PROFILE_STEPS.length}</div>
          </div>
          <div style={{ display:"flex", gap:5, alignItems:"center" }}>
            {phases.map((ph, i) => {
              const phSteps = PROFILE_STEPS.filter(st => st.phase === ph);
              const phStart = PROFILE_STEPS.findIndex(st => st.phase === ph);
              const isDone  = step >= phStart + phSteps.length;
              const isActive= s.phase === ph;
              return <div key={i} style={{ height:6, borderRadius:3, background: isDone ? C.accent : isActive ? C.accent : C.border, width: isActive ? 24 : isDone ? 10 : 6, opacity: isDone ? 0.45 : 1, transition:"all 0.3s" }} />;
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:"80px 20px 130px", overflowY:"auto" }}>
        <div style={{ fontSize:38, lineHeight:1, marginBottom:16 }}>{s.emoji}</div>
        <div style={{ fontSize:22, fontWeight:800, color:C.text, lineHeight:1.25, letterSpacing:"-0.02em", marginBottom:10 }}>{s.question}</div>
        <div style={{ fontSize:13, color:C.textDim, lineHeight:1.65, marginBottom: ctx ? 14 : 24, fontWeight:500 }}>{s.sub}</div>

        {/* Data context card — shows real numbers when relevant */}
        {ctx && (
          <div style={{ background:`${ctx.color}12`, border:`1px solid ${ctx.color}30`, borderRadius:12, padding:"11px 14px", marginBottom:20, display:"flex", alignItems:"flex-start", gap:10 }}>
            <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>📊</span>
            <div style={{ fontSize:12, color:C.text, lineHeight:1.6, fontWeight:500 }}>{ctx.text}</div>
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
          {s.options.map(opt => {
            const sel = answers[s.id] === opt.value;
            return (
              <button key={opt.value} onClick={() => select(opt.value)} style={{
                display:"flex", alignItems:"center", gap:14, padding:"15px 17px", borderRadius:14,
                textAlign:"left", cursor:"pointer",
                background: sel ? C.accentDim : C.card,
                border:`1.5px solid ${sel ? C.accent : C.border}`,
                transition:"border-color 0.12s, background 0.12s",
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color: sel ? C.accent : C.text, marginBottom:3, lineHeight:1.3 }}>{opt.label}</div>
                  <div style={{ fontSize:10, color:C.muted, lineHeight:1.4 }}>{opt.sub}</div>
                </div>
                <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, background: sel ? C.accent : C.border, display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.12s" }}>
                  {sel && <span style={{ color:C.bg, fontSize:10, fontWeight:900, lineHeight:1 }}>✓</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, padding:"14px 20px 38px", background:`${C.bg}f2`, backdropFilter:"blur(24px)", borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", zIndex:190 }}>
        {step > 0
          ? <button onClick={() => setStep(s => s - 1)} style={{ background:"none", border:"none", color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer", padding:"8px 0" }}>← Back</button>
          : <div />
        }
        <button onClick={() => onComplete(answers)} style={{ background:"none", border:"none", color:C.muted, fontSize:12, cursor:"pointer", padding:"8px 0" }}>Skip for now</button>
      </div>
    </div>
  );
}

// ─── Action Plan ─────────────────────────────────────────────────────────────
function buildActionPlan(p, txData) {
  if (!p) return [];

  const f = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);

  // Real numbers from actual transaction data
  const realDelivery    = txData?.avgDelivery    || 0;
  const realTobacco     = txData?.avgTobacco     || 0;
  const realCash        = txData?.avgCash        || 0;
  const realFees        = txData?.avgFees        || 0;
  const realGroceries   = txData?.avgGroceries   || 0;
  const realIncome      = txData?.avgIncome      || 0;
  const realTotalSpend  = txData?.avgTotalSpend  || 0;
  const realRedFlags    = realTobacco + realCash + realFees;
  const realSurplus     = Math.max(0, realIncome - realTotalSpend);

  // Profile-based fallbacks when no tx data
  const INCOME_FALLBACK = 2000; // Conservative default when no statement data yet
  const income    = realIncome > 0 ? realIncome : INCOME_FALLBACK;
  const debtMap   = { none:0,under_2k:1000,"2k_10k":6000,"10k_30k":20000,over_30k:40000 };
  const debt      = debtMap[p.debt_total] || 0;
  const surplus   = realSurplus > 0 ? realSurplus : Math.max(0, income * 0.15);
  const savGoal   = Math.max(50, Math.round(income * 0.10));

  const dreamLabels = { freedom:"Financial Freedom",home:"Owning a Home",time:"Buying Back Your Time",experiences:"Experiences",family:"Family Security",build:"Building Something" };
  const dream = dreamLabels[p.rich_life_vision] || "Your Goal";

  const steps = [];

  // ── STEP 1: Get visible ─────────────────────────────────────────────────────
  const hasData = txData?.months > 0;
  steps.push({
    id:"visible", icon:"👁️", color:"#3b82f6",
    title: hasData ? "Your data is in — review it" : "Upload your bank statement",
    timeline: "This week",
    action: hasData
      ? `You have ${txData.txCount} transactions across ${txData.months} months. Your average monthly spend is ${f(realTotalSpend)} against ${f(income)} income — a ${realIncome>realTotalSpend?"surplus":"deficit"} of ${f(Math.abs(realIncome-realTotalSpend))}. Go to Ledger and make sure every transaction is categorized correctly. Anything marked ❓ Unclear needs your attention.`
      : `Upload your last bank statement so Pursuivo can show you exactly where every dollar went. You can't fix what you can't see. Export as CSV from your bank's website — usually under Downloads or Statements.`,
    metric: hasData
      ? `${txData.unclearCount} unclear transaction${txData.unclearCount!==1?"s":""} still need categorizing. Ledger → tap each one → assign a category.`
      : "Upload statement → Ledger → confirm all categories look right.",
  });

  // ── STEP 2: Red flags ───────────────────────────────────────────────────────
  if (realRedFlags > 30 || realTobacco > 0) {
    const annualRF = Math.round(realRedFlags * 12);
    const parts = [];
    if (realTobacco > 0) parts.push(`tobacco ${f(realTobacco)}/mo`);
    if (realCash > 0)    parts.push(`cash withdrawals ${f(realCash)}/mo`);
    if (realFees > 0)    parts.push(`bank fees ${f(realFees)}/mo`);
    steps.push({
      id:"redflags", icon:"🚩", color:"#ef4444",
      title: `Stop the ${f(realRedFlags)}/month bleed`,
      timeline: "Immediately",
      action: `Your red flag spending — ${parts.join(", ")} — totals ${f(realRedFlags)}/month. That's ${f(annualRF)}/year leaving your account on things that don't build anything. This is the highest-priority cut because it's entirely controllable.

${realTobacco>0?"Tobacco alone is "+f(realTobacco*12)+"/year. That's not a judgment — that's the number. ":""} ${realFees>0?f(realFees)+"/month in bank fees means your balance is hitting zero. A $500 buffer eliminates these entirely.":""}`,
      metric: `Reduce red flag spending from ${f(realRedFlags)} to under ${f(Math.round(realRedFlags*0.4))}/month. That frees ${f(Math.round(realRedFlags*0.6)*12)}/year.`,
    });
  }

  // ── STEP 3: Emergency fund ──────────────────────────────────────────────────
  const noNet = p.safety_net === "zero" || p.safety_net === "under_500";
  const partialNet = p.safety_net === "under_1k";
  if (noNet || partialNet) {
    const monthlyToSave = Math.max(50, Math.min(surplus * 0.5, 300));
    const monthsTo1k    = Math.ceil(1000 / monthlyToSave);
    const feeContext    = realFees > 20 ? ` Right now you're paying ${f(realFees)}/month in overdraft fees because there's no buffer. A $500 emergency fund eliminates that cost permanently.` : "";
    steps.push({
      id:"emergency", icon:"🛡️", color:"#f59e0b",
      title: noNet ? "Build your first $1,000" : "Complete your emergency fund",
      timeline: `${monthsTo1k} month${monthsTo1k!==1?"s":""}`,
      action: `${noNet?"You have no safety net.":"You're close — keep going."} Set up an automatic transfer of ${f(monthlyToSave)}/month to a separate savings account on payday — before you can spend it.${feeContext} This single step changes everything: one bad month stops being a crisis.`,
      metric: `${f(monthlyToSave)}/month → $1,000 in ${monthsTo1k} months. Open a separate account (Marcus, Ally, SoFi all pay 4-5% APY). Label it "Emergency Only."`,
    });
  }

  // ── STEP 4: Kill the biggest spend leak ─────────────────────────────────────
  if (realDelivery > 50) {
    const cutAmt      = Math.round(realDelivery * 0.5);
    const monthsToEF  = Math.ceil(1000 / cutAmt);
    steps.push({
      id:"delivery", icon:"🚗", color:"#f97316",
      title: `Cut delivery from ${f(realDelivery)} to ${f(cutAmt)}/month`,
      timeline: "Starting this week",
      action: `Your real 3-month average for delivery is ${f(realDelivery)}/month — ${Math.round(realDelivery/income*100)}% of your income. That's ${f(realDelivery*12)}/year. Cutting it in half saves ${f(cutAmt)}/month.

This isn't about never ordering food. It's about a hard cap: when the budget hits ${f(cutAmt)}, you cook. Set that number in the Budget tab right now. The friction of seeing it gone changes the behavior.`,
      metric: `${f(cutAmt)} saved/month → ${f(cutAmt*12)}/year → emergency fund funded in ${monthsToEF} month${monthsToEF!==1?"s":""} from delivery savings alone.`,
    });
  }

  // ── STEP 5: Debt ─────────────────────────────────────────────────────────────
  if (debt > 2000 && p.debt_total && p.debt_total !== "none") {
    const extra       = Math.max(50, Math.round(surplus * 0.4));
    const monthsToPay = Math.ceil(debt / extra);
    steps.push({
      id:"debt", icon:"⚔️", color:"#f43f5e",
      title: `Attack ${f(debt)} in debt`,
      timeline: debt < 10000 ? "6–18 months" : "1–3 years",
      action: `List every debt smallest to largest. Pay minimums on all. Throw every extra dollar at the smallest balance until it's gone — then attack the next. Don't close the accounts, don't add new debt, don't skip a payment.

The psychological win of eliminating a balance completely is real. It builds momentum. Start with the smallest number, not the highest rate.`,
      metric: `At ${f(extra)}/month extra: ${monthsToPay} months to pay off ${f(debt)}. Every extra dollar cuts that timeline.`,
    });
  }

  // ── STEP 6: Build savings habit ──────────────────────────────────────────────
  const actualSavRate = realIncome > 0 ? Math.round((realIncome-realTotalSpend)/realIncome*100) : 0;
  const targetRate    = 15;
  const targetSavAmt  = Math.max(savGoal, Math.round(income * 0.10));
  steps.push({
    id:"savings", icon:"📈", color:"#00e5a0",
    title: `Save ${f(targetSavAmt)}/month consistently`,
    timeline: "Ongoing",
    action: `${actualSavRate > 0 ? `You're currently saving about ${actualSavRate}% of your income.` : "You're currently spending everything you earn."} The target is ${targetRate}%. At ${f(income)}/month income that's ${f(Math.round(income*targetRate/100))}.

Automate it. Set up a recurring transfer of ${f(targetSavAmt)} on payday before you touch anything else. Not what's left over — what comes off the top. If you can't afford it now, start with ${f(Math.round(targetSavAmt*0.5))} and increase by ${f(25)} every 3 months.`,
    metric: `${f(targetSavAmt)}/month = ${f(targetSavAmt*12)}/year. In 3 years at 4% APY: ${f(Math.round(targetSavAmt*12*3*1.04))}. That's real money.`,
  });

  // ── STEP 7: Dream goal ───────────────────────────────────────────────────────
  const dreamActions = {
    home:        { action:`You said you want to own a home. A down payment is typically 5–20% of the purchase price. At your income level, with ${f(targetSavAmt)}/month directed to savings, you're looking at a ${Math.ceil(20000/targetSavAmt)}-month runway to a $20k down payment. Open a dedicated HYSA labeled "House Fund" and automate a portion there now.` },
    freedom:     { action:`Financial freedom means your investments generate enough to live on without working. The rule of 25: multiply your annual expenses by 25 — that's your number. At ${f(realTotalSpend*12)}/year in expenses, your freedom number is ${f(realTotalSpend*12*25)}. Every dollar invested gets you closer. Start with your employer's 401k match — that's an instant 50-100% return.` },
    time:        { action:`Buying back time means building enough passive income to reduce how much you work. Every ${f(1000)} saved and invested at 7% generates ${f(70)}/year passively. You need ${f(Math.round(realTotalSpend*12))} annually to cover expenses — that's a ${f(Math.round(realTotalSpend*12/0.07))} investment portfolio. Build toward it one month at a time.` },
    experiences: { action:`Open a dedicated "Experiences" savings bucket — separate account, automated contribution. Decide the annual number: a trip, a concert run, whatever actually matters. Divide by 12, automate that amount monthly. When it's funded, spend it without guilt — that's the whole point. Everything else gets cut so this doesn't.` },
    family:      { action:`Financial security for the people you love starts with your own stability. Emergency fund first, then term life insurance (cheap in your 20s-30s, expensive later), then a beneficiary designation on every account. None of that requires being wealthy — it requires being organized. Do it this week.` },
    build:       { action:`Building something requires runway — money you can live on while the business finds its footing. The standard is 6–12 months of personal expenses: ${f(Math.round(realTotalSpend*6))}–${f(Math.round(realTotalSpend*12))}. Every dollar you save now is a month of optionality later. Don't start the business until you have at least 3 months banked.` },
  };
  const ds = dreamActions[p.rich_life_vision];
  if (ds) {
    steps.push({
      id:"dream", icon:{ freedom:"🔓",home:"🏠",time:"⏰",experiences:"✈️",family:"👨‍👩‍👧",build:"🚀" }[p.rich_life_vision]||"🎯",
      color:"#8b5cf6",
      title: `Build toward ${dream}`,
      timeline: { now:"Starting now",  "1yr":"This year", "3yr":"1–3 years", "5yr":"3–5 years", "10yr":"5–10 years" }[p.goal_timeline] || "Long term",
      action: ds.action,
      metric: `This is the reason for all of it. Keep it visible. Review this step every month and ask: did what I did this month move me closer to this?`,
    });
  }

  return steps;
}

function ActionPlan({ profile, txData, onDone }) {
  const C = useC();
  const steps   = buildActionPlan(profile, txData);
  const PLAN_KEY = "pursuivo_plan_progress";
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PLAN_KEY) || "{}"); } catch { return {}; }
  });
  const [expanded, setExpanded] = useState(() => {
    // Auto-open first incomplete step
    const doneIds = JSON.parse(localStorage.getItem(PLAN_KEY) || "{}");
    const first = steps.findIndex(s => !doneIds[s.id]);
    return first >= 0 ? first : 0;
  });

  const toggleDone = (id) => {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    try { localStorage.setItem(PLAN_KEY, JSON.stringify(next)); } catch {}
  };

  const completedCount = steps.filter(s => done[s.id]).length;
  const progressPct    = steps.length ? Math.round(completedCount/steps.length*100) : 0;

  const dreamLabels = { freedom:"Financial Freedom",home:"Owning a Home",time:"Buying Back Time",experiences:"Experiences",family:"Family Security",build:"Building Something" };
  const dream = dreamLabels[profile?.rich_life_vision] || "Your Goal";

  return (
    <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",maxWidth:430,margin:"0 auto",background:C.bg,fontFamily:F.sans}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap'); *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;} ::-webkit-scrollbar{display:none;} button{font-family:inherit;}`}</style>

      {/* Header */}
      <div style={{padding:"52px 20px 20px",background:`linear-gradient(160deg,${C.accent}15 0%,${C.bg} 65%)`,borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <div style={{fontSize:10,color:C.accent,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Your Action Plan</div>
            <div style={{fontSize:22,fontWeight:800,color:C.text,lineHeight:1.2,letterSpacing:"-0.02em",marginBottom:6}}>
              Path to <span style={{color:C.accent}}>{dream}</span>
            </div>
            <div style={{fontSize:12,color:C.textDim,lineHeight:1.5}}>{steps.length} steps · in priority order · built from your real data</div>
          </div>
          <button onClick={onDone} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.muted,borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0}}>Close</button>
        </div>

        {/* Progress bar */}
        <div style={{marginTop:4}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:10,color:C.muted,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{completedCount} of {steps.length} complete</span>
            <span style={{fontSize:10,color:progressPct===100?C.accent:C.muted,fontFamily:F.mono,fontWeight:700}}>{progressPct}%</span>
          </div>
          <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
            <div style={{height:6,background:C.accent,width:`${progressPct}%`,borderRadius:3,transition:"width 0.5s ease",boxShadow:progressPct>0?`0 0 8px ${C.accent}60`:"none"}} />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div style={{flex:1,padding:"14px 16px 100px",overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
        {steps.map((step,i) => {
          const isOpen  = expanded === i;
          const isDone  = !!done[step.id];
          const color   = isDone ? C.muted : step.color;
          return (
            <div key={step.id} style={{borderRadius:16,border:`1.5px solid ${isOpen?color+"50":isDone?C.border+"80":C.border}`,background:isOpen?`${color}08`:isDone?`${C.surface}88`:C.card,transition:"all 0.2s",opacity:isDone?0.7:1}}>
              <button onClick={()=>setExpanded(isOpen?null:i)} style={{width:"100%",padding:"15px 16px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  {/* Checkbox */}
                  <button onClick={e=>{e.stopPropagation();toggleDone(step.id);}} style={{width:28,height:28,borderRadius:8,border:`2px solid ${isDone?C.accent:color}`,background:isDone?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",transition:"all 0.15s"}}>
                    {isDone && <span style={{color:C.bg,fontSize:13,fontWeight:900,lineHeight:1}}>✓</span>}
                  </button>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                      <span style={{fontSize:14,lineHeight:1}}>{step.icon}</span>
                      <span style={{fontSize:10,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:isDone?C.muted:color}}>Step {i+1} · {step.timeline}</span>
                    </div>
                    <div style={{fontSize:14,fontWeight:isDone?600:800,color:isDone?C.muted:C.text,lineHeight:1.2,textDecoration:isDone?"line-through":"none"}}>{step.title}</div>
                  </div>
                  <span style={{fontSize:14,color:isDone?C.muted:color,transform:isOpen?"rotate(90deg)":"rotate(0deg)",transition:"transform 0.2s",display:"inline-block",flexShrink:0}}>›</span>
                </div>
              </button>

              {isOpen && !isDone && (
                <div style={{padding:"0 16px 18px"}}>
                  <div style={{height:1,background:`${color}25`,marginBottom:14}} />
                  <div style={{fontSize:13,color:C.text,lineHeight:1.8,marginBottom:14,fontWeight:500,whiteSpace:"pre-line"}}>{step.action}</div>
                  <div style={{background:C.bg,borderRadius:12,padding:"12px 14px",border:`1px solid ${color}22`,marginBottom:12}}>
                    <div style={{fontSize:10,color:color,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>📏 How to know it's working</div>
                    <div style={{fontSize:12,color:C.textDim,lineHeight:1.65}}>{step.metric}</div>
                  </div>
                  <button onClick={()=>toggleDone(step.id)} style={{width:"100%",padding:"13px",background:`${color}18`,border:`1.5px solid ${color}40`,borderRadius:11,color,fontSize:13,fontWeight:800,cursor:"pointer"}}>
                    Mark as done ✓
                  </button>
                </div>
              )}
              {isOpen && isDone && (
                <div style={{padding:"0 16px 16px"}}>
                  <div style={{height:1,background:C.border,marginBottom:12}} />
                  <button onClick={()=>toggleDone(step.id)} style={{fontSize:10,color:C.muted,background:"none",border:"none",cursor:"pointer",padding:0}}>↩ Mark as not done</button>
                </div>
              )}
            </div>
          );
        })}

        {/* Sequence reminder */}
        <div style={{background:`${C.accent}08`,border:`1px solid ${C.accent}20`,borderRadius:14,padding:"16px",marginTop:4}}>
          <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:6}}>The sequence matters</div>
          <div style={{fontSize:12,color:C.textDim,lineHeight:1.75}}>Do these in order. Don't invest before you have an emergency fund. Don't aggressively save while carrying high-interest debt. The steps are arranged by return-on-effort, not by difficulty.</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"14px 20px 40px",background:`${C.bg}f4`,backdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`}}>
        <button onClick={onDone} style={{width:"100%",padding:"16px",background:C.accent,border:"none",borderRadius:13,color:C.bg,fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:`0 4px 20px ${C.accent}45`}}>
          {completedCount===0?"Let's get started →":completedCount===steps.length?"All done — keep going →":"Back to the app →"}
        </button>
      </div>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────
function SettingsSheet({profile, notifPermission, onRequestNotif, onEditProfile, onClose, onResetData, theme, onThemeChange }) {
  const C = useC();
  const [currency,  setCurrency]  = useState(() => localStorage.getItem("pursuivo_currency") || "USD");
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pursuivo_notif_prefs") || "{}"); } catch { return {}; }
  });

  const saveNotifPref = (key, val) => {
    const next = { ...notifPrefs, [key]: val };
    setNotifPrefs(next);
    try { localStorage.setItem("pursuivo_notif_prefs", JSON.stringify(next)); } catch {}
  };

  const pref = (key, def=true) => notifPrefs[key] !== undefined ? notifPrefs[key] : def;

  const Section = ({ title, children }) => (
    <div style={{marginBottom:24}}>
      <div style={{fontSize:10,color:C.muted,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12,paddingLeft:4}}>{title}</div>
      <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden"}}>{children}</div>
    </div>
  );

  const Row = ({ icon, label, sub, right, onTap, danger }) => (
    <button onClick={onTap||undefined} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"15px 16px",background:"transparent",border:"none",borderBottom:`1px solid ${C.border}18`,cursor:onTap?"pointer":"default",textAlign:"left"}}>
      <div style={{width:36,height:36,borderRadius:10,background:danger?`${C.red}15`:`${C.accent}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14}}>{icon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:danger?C.red:C.text,fontFamily:F.sans}}>{label}</div>
        {sub && <div style={{fontSize:10,color:C.muted,marginTop:2,lineHeight:1.4}}>{sub}</div>}
      </div>
      {right}
    </button>
  );

  const Toggle = ({ value, onChange }) => (
    <button onClick={()=>onChange(!value)} style={{width:44,height:26,borderRadius:13,background:value?C.accent:C.border,border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
      <div style={{position:"absolute",top:3,left:value?20:3,width:20,height:20,borderRadius:"50%",background:"white",transition:"left 0.2s",boxShadow:"0 1px 4px #00000040"}} />
    </button>
  );

  const notifGranted = notifPermission === "granted";
  const notifDenied  = notifPermission === "denied";
  const notifUnsupported = notifPermission === "unsupported";

  return (
    <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,zIndex:400,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div style={{position:"absolute",top:0,right:0,bottom:0,left:0,background:"#00000090"}} onClick={onClose} />
      <div style={{position:"relative",background:C.bg,borderRadius:"22px 22px 0 0",maxHeight:"92vh",display:"flex",flexDirection:"column",boxShadow:"0 -12px 48px #00000080"}}>

        {/* Header */}
        <div style={{padding:"20px 20px 16px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <div style={{width:40,height:4,borderRadius:2,background:C.border,margin:"0 auto 20px"}} />
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:18,fontWeight:800,color:C.text,fontFamily:F.sans}}>Settings</div>
            <button onClick={onClose} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.muted,borderRadius:9,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:F.sans,fontWeight:600}}>Done</button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{overflowY:"auto",flex:1,padding:"20px 16px 48px"}}>

          {/* NOTIFICATIONS */}
          <Section title="Notifications">
            {notifUnsupported && (
              <Row icon="🔔" label="Notifications unsupported" sub="Your browser doesn't support web push notifications. Install as a PWA for full support." />
            )}
            {!notifUnsupported && !notifGranted && (
              <Row icon="🔔" label={notifDenied?"Notifications blocked":"Enable notifications"}
                sub={notifDenied?"Blocked in browser settings. Go to Settings → Safari → Pursuivo → Notifications.":"Get spending alerts, daily summaries, and budget warnings."}
                onTap={notifDenied?undefined:onRequestNotif}
                right={!notifDenied&&<div style={{fontSize:10,color:C.accent,fontWeight:700,fontFamily:F.sans,background:C.accentDim,padding:"5px 12px",borderRadius:8}}>Enable</div>}
              />
            )}
            {notifGranted && (
              <>
                <Row icon="🌅" label="Daily summary" sub="Every day at 9 PM — what you spent and budget remaining."
                  right={<Toggle value={pref("daily")} onChange={v=>saveNotifPref("daily",v)} />} />
                <Row icon="⚠️" label="Budget warnings" sub="When a category hits 80% or goes over."
                  right={<Toggle value={pref("budget_caps")} onChange={v=>saveNotifPref("budget_caps",v)} />} />
                <Row icon="🚩" label="Red flag alerts" sub="Instant alert when tobacco, cash, fees, or gambling appear."
                  right={<Toggle value={pref("red_flags")} onChange={v=>saveNotifPref("red_flags",v)} />} />
                <Row icon="📊" label="Weekly report" sub="Sunday mornings — biggest category and trend vs last week."
                  right={<Toggle value={pref("weekly")} onChange={v=>saveNotifPref("weekly",v)} />} />
              </>
            )}
          </Section>

          {/* PROFILE */}
          <Section title="Profile">
            <Row icon="👤" label="Financial profile"
              sub={profile ? "Update your goals, situation, and habits." : "Complete your profile to unlock personalized insights."}
              onTap={() => { onEditProfile(); onClose(); }}
              right={<span style={{fontSize:14,color:C.muted}}>›</span>}
            />
            <Row icon="🎯" label="Your action plan"
              sub="See your personalized step-by-step financial plan."
              onTap={() => { onClose(); }}
              right={<span style={{fontSize:14,color:C.muted}}>›</span>}
            />
          </Section>

          {/* APPEARANCE */}
          <Section title="Appearance">
            <div style={{padding:"14px 16px"}}>
              <div style={{fontSize:13,fontWeight:600,color:C.text,fontFamily:F.sans,marginBottom:12}}>🎨 Theme</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[
                  {id:"dark",     label:"Dark",     dot:"#0a0d14", sub:"Deep navy"},
                  {id:"light",    label:"Light",    dot:"#f8f7f4", sub:"Warm white"},
                  {id:"midnight", label:"Midnight", dot:"#c084fc", sub:"Purple haze"},
                  {id:"tape",     label:"Tape",     dot:"#e8a020", sub:"Analog amber"},
                ].map(t => {
                  const active = theme === t.id;
                  return (
                    <button key={t.id} onClick={()=>onThemeChange(t.id)} style={{
                      display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
                      borderRadius:12, border:`1.5px solid ${active ? C.accent : C.border}`,
                      background: active ? C.accentDim : C.surface,
                      cursor:"pointer", textAlign:"left"
                    }}>
                      <div style={{width:28,height:28,borderRadius:8,background:t.dot,flexShrink:0,border:`1px solid ${C.border}`,boxShadow:active?`0 0 0 2px ${C.accent}`:undefined}} />
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:active?C.accent:C.text,fontFamily:F.sans,lineHeight:1.2}}>{t.label}</div>
                        <div style={{fontSize:10,color:C.muted,fontFamily:F.sans,marginTop:2}}>{t.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <Row icon="💱" label="Currency" sub="All amounts display in this currency." right={
              <div style={{display:"flex",gap:6}}>
                {["USD","EUR","GBP"].map(cur=>(
                  <button key={cur} onClick={()=>{setCurrency(cur);try{localStorage.setItem("pursuivo_currency",cur);}catch{}}}
                    style={{padding:"5px 12px",borderRadius:8,border:`1.5px solid ${currency===cur?C.accent:C.border}`,background:currency===cur?C.accentDim:C.surface,color:currency===cur?C.accent:C.muted,fontSize:10,fontWeight:700,fontFamily:F.mono,cursor:"pointer"}}>{cur}</button>
                ))}
              </div>
            } />
          </Section>

          {/* APP INFO */}
          <Section title="App">
            <Row icon="📱" label="Install as app" sub="Add to Home Screen for full-screen mode and notifications." onTap={()=>{
              // Trigger beforeinstallprompt if available
              if (window.__pwaPrompt) { window.__pwaPrompt.prompt(); }
              else { alert("Open in Safari → Share → Add to Home Screen"); }
            }} right={<span style={{fontSize:14,color:C.muted}}>›</span>} />
            <Row icon="📤" label="Export data" sub="Download all your transactions as CSV." onTap={()=>{
              const allTx = JSON.parse(localStorage.getItem("pursuivo_tx") ?? "[]"||"[]");
              if (!allTx.length) { alert("No transactions to export."); return; }
              const headers = ["date","description","amount","type","category"];
              const rows = allTx.map(t => headers.map(h => `"${String(t[h]||"").replace(/"/g,'""')}"`).join(","));
              const csv  = [headers.join(","), ...rows].join("\n");
              const blob = new Blob([csv], {type:"text/csv"});
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement("a");
              a.href=url; a.download=`pursuivo-export-${new Date().toISOString().slice(0,10)}.csv`;
              a.click(); URL.revokeObjectURL(url);
            }} right={<span style={{fontSize:14,color:C.muted}}>›</span>} />
            <Row icon="ℹ️" label="Version" sub="Pursuivo 1.0 — built with React + Recharts." right={
              <span style={{fontSize:10,color:C.muted,fontFamily:F.mono}}>v1.0</span>
            } />
          </Section>

          {/* DANGER ZONE */}
          <Section title="Danger Zone">
            <Row icon="🗑️" label="Reset all data" danger sub="Clears all transactions, profile, and budget assignments. Cannot be undone."
              onTap={() => {
                if (!window.confirm("This will permanently delete all your data. Are you sure?")) return;
                ["pursuivo_tx","pursuivo_assigned","pursuivo_collapsed","pursuivo_profile","pursuivo_item_id","pursuivo_notif_prefs"].forEach(k => localStorage.removeItem(k));
                onResetData();
                onClose();
              }}
              right={<span style={{fontSize:10,color:C.red,fontWeight:700,fontFamily:F.sans}}>Reset</span>}
            />
          </Section>

        </div>
      </div>
    </div>
  );
}

// ─── Insight list ─────────────────────────────────────────────────────────────
// ─── Red Flag Sheet ───────────────────────────────────────────────────────────
const RF_META = {
  "🚩 Tobacco":  { label:"Tobacco",     color:"#a78bfa", icon:"🚬", tip:"Every pack is money spent on something working against you. The annual cost is what you should be looking at." },
  "🚩 Cash":     { label:"Cash",        color:"#94a3b8", icon:"💵", tip:"Cash withdrawals are invisible spending. The money leaves and leaves no trace — which is exactly why it keeps happening." },
  "🚩 Fees":     { label:"Fees",        color:"#ef4444", icon:"🏦", tip:"Overdraft and ATM fees are entirely preventable. Every fee is your bank charging you for running low — which means the real fix is earlier." },
  "🚩 Gambling": { label:"Gambling",    color:"#f97316", icon:"🎲", tip:"Small amounts feel harmless. But consistent monthly gambling is a pattern, not recreation." },
};

function RedFlagSheet({ allTx, months, onClose }) {
  const C = useC();
  const [selectedCat, setSelectedCat] = useState(null);
  const rfCats = Object.keys(RF_META);
  const moLabels = months.map(m => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m.split("-")[1]-1]);

  // Per-cat per-month totals
  const catByMo = {};
  rfCats.forEach(cat => {
    catByMo[cat] = months.map(mo =>
      allTx.filter(t=>t.date.startsWith(mo)&&t.category===cat&&t.type==="expense")
            .reduce((s,t)=>s+Math.abs(t.amount),0)
    );
  });

  const grandTotal3Mo = rfCats.reduce((s,cat)=>s+catByMo[cat].reduce((a,v)=>a+v,0),0);
  const activeMos     = months.filter(m=>allTx.some(t=>t.date.startsWith(m))).length || 1;
  const annualised    = Math.round(grandTotal3Mo/activeMos*12);
  const allRfTx       = allTx.filter(t=>rfCats.includes(t.category)&&t.type==="expense").sort((a,b)=>b.date.localeCompare(a.date));
  const filteredTx    = selectedCat ? allRfTx.filter(t=>t.category===selectedCat) : allRfTx;

  const monthTotals = months.map((_,i) =>
    selectedCat ? catByMo[selectedCat][i] : rfCats.reduce((s,cat)=>s+catByMo[cat][i],0)
  );
  const maxSpend    = Math.max(...monthTotals,1);
  const isFlatlining= monthTotals.every(v=>v===0);
  const isDying     = monthTotals[monthTotals.length-1]>monthTotals[0]*1.5&&monthTotals[0]>0;
  const isImproving = monthTotals[monthTotals.length-1]<monthTotals[0]*0.7&&monthTotals[0]>0;
  const statusColor = isFlatlining?C.muted:isDying?"#ef4444":isImproving?"#22c55e":C.red;

  const catTotals = rfCats.map(cat=>({
    cat, meta:RF_META[cat],
    total:catByMo[cat].reduce((s,v)=>s+v,0),
    byMo:catByMo[cat],
    count:allRfTx.filter(t=>t.category===cat).length,
    trend:catByMo[cat][catByMo[cat].length-1]>catByMo[cat][0]*1.1?"up"
         :catByMo[cat][catByMo[cat].length-1]<catByMo[cat][0]*0.9?"down":"flat",
  })).filter(c=>c.total>0);

  // Shared sparkline — smooth bezier
  const Spark = ({values, color, width=100, height=40}) => {
    if (values.every(v=>v===0)) return null;
    const max=Math.max(...values,1);
    const pts=values.map((v,i)=>({
      x:(i/(values.length-1||1))*(width-8)+4,
      y:height-6-(v/max)*(height-12)
    }));
    let d=`M ${pts[0].x} ${pts[0].y}`;
    for(let i=1;i<pts.length;i++){
      const cpx=pts[i-1].x+(pts[i].x-pts[i-1].x)*0.5;
      d+=` C ${cpx} ${pts[i-1].y} ${cpx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
    }
    const fill=d+` L ${pts[pts.length-1].x} ${height} L ${pts[0].x} ${height} Z`;
    const tColor=values[values.length-1]>values[0]*1.1?"#ef4444"
                :values[values.length-1]<values[0]*0.9?"#22c55e":color;
    const gid=`rf-${color.replace("#","")}`;
    return (
      <svg width={width} height={height} style={{display:"block"}}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tColor} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={tColor} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={fill} fill={`url(#${gid})`}/>
        <path d={d} fill="none" stroke={tColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p,i)=>(
          <circle key={i} cx={p.x} cy={p.y}
            r={i===pts.length-1?3:2}
            fill={i===pts.length-1?tColor:`${tColor}70`}/>
        ))}
      </svg>
    );
  };

  // Thin arc
  const Arc = ({pct,color,size=44})=>{
    const r=17,cx=size/2,cy=size/2,circ=2*Math.PI*r;
    const c=pct>1?"#ef4444":pct>=0.8?"#f59e0b":pct>0?"#22c55e":color;
    return (
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${color}15`} strokeWidth={2.5}/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth={2.5}
          strokeLinecap="round" strokeDasharray={`${Math.min(pct,1)*circ} ${circ}`}
          style={{transition:"stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)"}}/>
      </svg>
    );
  };

  // EKG path builder
  const EKG_W=360, EKG_H=130;
  const buildEKG=(totals)=>{
    const segW=EKG_W/totals.length, baseY=EKG_H*0.72; let d="",x=0;
    totals.forEach((total,i)=>{
      const sev=total/maxSpend, spikeH=sev*(EKG_H*0.62), cx=x+segW*0.5;
      if(i===0) d+=`M ${x} ${baseY} `;
      d+=`L ${cx-segW*0.33} ${baseY} `;
      if(!total){ d+=`L ${cx} ${baseY-3} L ${cx+segW*0.05} ${baseY} `; }
      else {
        d+=`Q ${cx-segW*0.22} ${baseY-spikeH*0.13} ${cx-segW*0.14} ${baseY} `;
        d+=`L ${cx-segW*0.06} ${baseY+spikeH*0.11} `;
        d+=`L ${cx} ${baseY-spikeH} `;
        d+=`L ${cx+segW*0.06} ${baseY+spikeH*0.08} `;
        d+=`Q ${cx+segW*0.18} ${baseY-spikeH*0.18} ${cx+segW*0.28} ${baseY} `;
      }
      d+=`L ${x+segW} ${baseY} `; x+=segW;
    });
    return {d, baseY};
  };
  const ekg = buildEKG(monthTotals);

  return (
    <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,zIndex:400,display:"flex",flexDirection:"column",background:C.bg,maxWidth:430,margin:"0 auto",fontFamily:F.sans}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes ekg-draw{from{stroke-dashoffset:1600}to{stroke-dashoffset:0}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes flatline{0%,100%{opacity:1}50%{opacity:0.1}}
        @keyframes slidein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .ekg-line{stroke-dasharray:1600;stroke-dashoffset:1600;animation:ekg-draw 2.4s cubic-bezier(.4,0,.2,1) forwards}
        .ekg-glow{opacity:0;animation:pulse 2s ease-in-out infinite;animation-delay:2.4s;animation-fill-mode:forwards}
        .pulse{animation:pulse 1.6s ease-in-out infinite}
        .flatline{animation:flatline 0.9s ease-in-out infinite}
        .slidein{animation:slidein 0.3s ease both}
      `}</style>

      {/* ── Hero header ── */}
      <div style={{
        padding:"52px 20px 20px",
        background:`linear-gradient(180deg,${statusColor}20 0%,${C.bg} 90%)`,
        borderBottom:`1px solid ${statusColor}25`,
        flexShrink:0,
      }}>
        {/* Status + close */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div className={isFlatlining?"flatline":"pulse"} style={{width:7,height:7,borderRadius:"50%",background:statusColor,boxShadow:`0 0 8px ${statusColor}`}}/>
              <span style={{fontSize:10,color:statusColor,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase"}}>
                {isFlatlining?"CLEAN · NO ACTIVITY":isDying?"CRITICAL · WORSENING":isImproving?"IMPROVING · TREND DOWN":"ACTIVE · RED FLAG"}
              </span>
            </div>
            <div style={{fontSize:38,fontWeight:800,fontFamily:F.mono,letterSpacing:"-0.04em",color:C.text,lineHeight:1}}>{fmt(grandTotal3Mo)}</div>
            <div style={{display:"flex",gap:14,marginTop:6}}>
              <div>
                <div style={{fontSize:8,color:C.muted,fontFamily:F.mono,letterSpacing:"0.1em",textTransform:"uppercase"}}>Annualised</div>
                <div style={{fontSize:13,fontWeight:700,fontFamily:F.mono,color:statusColor}}>{fmt(annualised)}</div>
              </div>
              <div style={{width:1,background:C.border}}/>
              <div>
                <div style={{fontSize:8,color:C.muted,fontFamily:F.mono,letterSpacing:"0.1em",textTransform:"uppercase"}}>Transactions</div>
                <div style={{fontSize:13,fontWeight:700,fontFamily:F.mono,color:C.textDim}}>{allRfTx.length}</div>
              </div>
              <div style={{width:1,background:C.border}}/>
              <div>
                <div style={{fontSize:8,color:C.muted,fontFamily:F.mono,letterSpacing:"0.1em",textTransform:"uppercase"}}>Period</div>
                <div style={{fontSize:13,fontWeight:700,fontFamily:F.mono,color:C.textDim}}>{months.length} mo</div>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.muted,borderRadius:10,padding:"9px 16px",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>Done</button>
        </div>

        {/* Filter pills */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[{id:null,label:"All",color:statusColor},...catTotals.map(c=>({id:c.cat,label:c.meta.label,color:c.meta.color}))].map(({id,label,color})=>{
            const active = selectedCat===id;
            return (
              <button key={id||"all"} onClick={()=>setSelectedCat(id)}
                style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${active?color:C.border}`,background:active?`${color}18`:C.surface,color:active?color:C.muted,fontSize:10,fontWeight:700,cursor:"pointer",transition:"all 0.15s"}}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 60px"}}>

        {/* EKG card */}
        <div className="slidein" key={`ekg-${selectedCat||"all"}`}
          style={{background:C.card,border:`1.5px solid ${isDying?"#ef444430":isImproving?"#22c55e25":C.border}`,borderRadius:20,padding:"18px 16px 14px",marginBottom:14,position:"relative",overflow:"hidden"}}>

          {/* Grid bg */}
          <svg style={{position:"absolute",top:0,left:0,right:0,bottom:0,width:"100%",height:"100%",opacity:0.03,pointerEvents:"none"}}>
            <defs><pattern id="rfgrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0L0 0 0 20" fill="none" stroke={statusColor} strokeWidth="0.8"/></pattern></defs>
            <rect width="100%" height="100%" fill="url(#rfgrid)"/>
          </svg>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,position:"relative",zIndex:1}}>
            <span style={{fontSize:8,color:C.muted,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase"}}>
              {isFlatlining?"── FLATLINE ──":isDying?"⚠ CRITICAL":isImproving?"↓ IMPROVING":"VITAL SIGNS"}
            </span>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div className={isFlatlining?"flatline":"pulse"} style={{width:5,height:5,borderRadius:"50%",background:statusColor,boxShadow:`0 0 5px ${statusColor}80`}}/>
              <span style={{fontSize:8,color:statusColor,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.08em"}}>
                {isFlatlining?"NO ACTIVITY":isDying?"WORSENING":isImproving?"GETTING BETTER":"ACTIVE"}
              </span>
            </div>
          </div>

          <svg key={`ekg-path-${selectedCat||"all"}`} viewBox={`0 0 ${EKG_W} ${EKG_H}`} style={{width:"100%",height:EKG_H,display:"block",position:"relative",zIndex:1}}>
            <line x1="0" y1={ekg.baseY} x2={EKG_W} y2={ekg.baseY} stroke={C.border} strokeWidth="0.8" strokeDasharray="4 4" opacity="0.4"/>
            <defs>
              <linearGradient id="ekgfade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={statusColor} stopOpacity="0.18"/>
                <stop offset="100%" stopColor={statusColor} stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d={ekg.d+` L ${EKG_W} ${ekg.baseY} L 0 ${ekg.baseY} Z`} fill="url(#ekgfade)"/>
            <path d={ekg.d} fill="none" stroke={statusColor} strokeWidth="8" strokeOpacity="0.06" strokeLinecap="round" strokeLinejoin="round" className="ekg-glow"/>
            <path d={ekg.d} fill="none" stroke={statusColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`ekg-line${isFlatlining?" flatline":""}`}/>
            {!isFlatlining&&monthTotals.map((v,i)=>{
              if(!v) return null;
              const segW=EKG_W/months.length, cx=segW*i+segW*0.5;
              const cy=ekg.baseY-(v/maxSpend)*(EKG_H*0.62);
              const isMax=v===Math.max(...monthTotals);
              return <g key={i}>
                {isMax&&<circle cx={cx} cy={cy} r={9} fill="none" stroke={statusColor} strokeWidth="1" opacity="0.3" className="pulse"/>}
                <circle cx={cx} cy={cy} r={isMax?3.5:2.5} fill={statusColor} className="pulse"/>
              </g>;
            })}
          </svg>

          {/* Month labels */}
          <div style={{display:"flex",justifyContent:"space-around",marginTop:8,position:"relative",zIndex:1}}>
            {months.map((_,i)=>{
              const v=monthTotals[i];
              const isMax=v===Math.max(...monthTotals)&&v>0;
              const isBest=v===Math.min(...monthTotals.filter(x=>x>0))&&v>0&&monthTotals.filter(x=>x>0).length>1;
              return (
                <div key={i} style={{textAlign:"center",flex:1}}>
                  <div style={{fontSize:13,fontWeight:800,fontFamily:F.mono,color:isMax?statusColor:isBest?"#22c55e":v>0?C.textDim:C.muted,lineHeight:1}}>{v>0?fmt(v):"—"}</div>
                  <div style={{fontSize:8,color:C.muted,fontFamily:F.mono,marginTop:3,letterSpacing:"0.06em"}}>{moLabels[i]}</div>
                  {isMax&&<div style={{fontSize:8,color:statusColor,fontFamily:F.mono,marginTop:1,fontWeight:700}}>PEAK</div>}
                  {isBest&&<div style={{fontSize:8,color:"#22c55e",fontFamily:F.mono,marginTop:1,fontWeight:700}}>BEST</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-category breakdown — full width stacked, same language as budget cards */}
        {!selectedCat && catTotals.length>0 && (
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
            {catTotals.map(({cat,meta,total,count,trend,byMo})=>{
              const annual=Math.round(total/activeMos*12);
              const tColor=trend==="down"?"#22c55e":trend==="up"?"#ef4444":meta.color;
              return (
                <button key={cat} onClick={()=>setSelectedCat(cat)}
                  style={{width:"100%",textAlign:"left",background:`linear-gradient(135deg,${meta.color}12,${meta.color}04)`,border:`1px solid ${meta.color}25`,borderRadius:18,padding:"16px",cursor:"pointer",transition:"border-color 0.2s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    {/* Arc */}
                    <div style={{position:"relative",flexShrink:0}}>
                      <Arc pct={0} color={meta.color} size={44}/>
                      <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{fontSize:14}}>{meta.icon}</span>
                      </div>
                    </div>
                    {/* Info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{fontSize:12,fontWeight:700,color:C.text}}>{meta.label}</div>
                        <span style={{fontSize:10,fontWeight:700,color:tColor,fontFamily:F.mono}}>
                          {trend==="down"?"↓ improving":trend==="up"?"↑ worse":"→ flat"}
                        </span>
                      </div>
                      <div style={{display:"flex",alignItems:"baseline",gap:8,marginTop:2}}>
                        <span style={{fontSize:22,fontWeight:800,fontFamily:F.mono,letterSpacing:"-0.02em",color:C.text}}>{fmt(total)}</span>
                        <span style={{fontSize:10,color:C.muted,fontFamily:F.sans}}>{fmt(annual)}/yr · {count} txn{count!==1?"s":""}</span>
                      </div>
                    </div>
                    {/* Sparkline */}
                    <div style={{flexShrink:0}}>
                      <Spark values={byMo} color={meta.color} width={80} height={36}/>
                      <div style={{display:"flex",justifyContent:"space-between",width:80,marginTop:2}}>
                        {moLabels.map((l,i)=><span key={i} style={{fontSize:8,color:i===moLabels.length-1?meta.color:C.muted,fontFamily:F.mono,fontWeight:i===moLabels.length-1?700:400}}>{l}</span>)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected cat insight */}
        {selectedCat&&RF_META[selectedCat]&&(
          <div className="slidein" style={{background:`linear-gradient(135deg,${RF_META[selectedCat].color}14,${RF_META[selectedCat].color}04)`,border:`1px solid ${RF_META[selectedCat].color}30`,borderRadius:16,padding:"16px",marginBottom:14}}>
            <div style={{fontSize:10,color:RF_META[selectedCat].color,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>
              {RF_META[selectedCat].icon} {RF_META[selectedCat].label} · Reality Check
            </div>
            <div style={{fontSize:13,color:C.text,lineHeight:1.8,fontWeight:500}}>{RF_META[selectedCat].tip}</div>
          </div>
        )}

        {/* Transaction list */}
        <div style={{fontSize:8,color:C.muted,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:10,paddingLeft:2}}>
          {filteredTx.length} Transaction{filteredTx.length!==1?"s":" "} · {selectedCat?RF_META[selectedCat]?.label:"All Red Flags"}
        </div>

        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
          {filteredTx.length===0
            ? <div style={{padding:"40px",textAlign:"center",color:C.muted,fontSize:13}}>No transactions in this period</div>
            : filteredTx.map((t,i)=>{
                const meta=RF_META[t.category];
                const isLast=i===filteredTx.length-1;
                return (
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:isLast?undefined:`1px solid ${C.border}12`,background:i%2===0?"transparent":`${C.surface}40`}}>
                    <div style={{width:38,height:38,borderRadius:12,background:`linear-gradient(135deg,${meta?.color||C.muted}20,${meta?.color||C.muted}08)`,border:`1px solid ${meta?.color||C.muted}25`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14}}>
                      {meta?.icon||"🚩"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.description}</div>
                      <div style={{display:"flex",gap:7,marginTop:3,alignItems:"center"}}>
                        <span style={{fontSize:8,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:meta?.color||C.muted,background:`${meta?.color||C.muted}15`,padding:"2px 8px",borderRadius:4}}>{meta?.label||t.category}</span>
                        <span style={{fontSize:10,color:C.muted,fontFamily:F.mono}}>{fmtDate(t.date)}</span>
                      </div>
                    </div>
                    <div style={{fontSize:14,fontWeight:700,fontFamily:F.mono,color:meta?.color||C.red,flexShrink:0}}>-{fmtFull(Math.abs(t.amount))}</div>
                  </div>
                );
              })
          }
        </div>

        {filteredTx.length>0&&(
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 4px 0"}}>
            <span style={{fontSize:10,color:C.muted,fontFamily:F.mono}}>{filteredTx.length} transactions</span>
            <span style={{fontSize:12,fontFamily:F.mono,fontWeight:800,color:statusColor}}>{fmt(filteredTx.reduce((s,t)=>s+Math.abs(t.amount),0))}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Auto-Calibrate ───────────────────────────────────────────────────────────
function computeSuggestedTargets(allTx, groups) {
  const CAT_TO_BUDGET = {
    "🛒 Groceries":"groceries","🍽 Dining Out":"dining","🚗 Delivery":"delivery",
    "🔔 Subscriptions":"subscriptions",Travel:"travel",Transport:"transport",
    Shopping:"shopping",Entertainment:"entertainment",Health:"health",
    Utilities:"electric","Food":"groceries",
  };
  // Get unique months in data
  const moSet = new Set(allTx.filter(t=>t.type==="expense").map(t=>t.date.slice(0,7)));
  const months = [...moSet].sort();
  if (months.length === 0) return {};

  // Count days in each month's data to weight partials
  const daysByMo = {};
  months.forEach(mo => {
    const days = allTx.filter(t=>t.date.startsWith(mo));
    const dates = [...new Set(days.map(t=>t.date))].sort();
    daysByMo[mo] = dates.length;
  });
  const maxDays = Math.max(...Object.values(daysByMo));

  // Sum spending per budget cat per month
  const byBudget = {};
  allTx.filter(t=>t.type==="expense").forEach(t => {
    const budId = CAT_TO_BUDGET[t.category];
    if (!budId) return;
    const mo = t.date.slice(0,7);
    if (!byBudget[budId]) byBudget[budId] = {};
    byBudget[budId][mo] = (byBudget[budId][mo]||0) + Math.abs(t.amount);
  });

  const suggestions = {};
  groups.flatMap(g=>g.cats).forEach(cat => {
    const moData = byBudget[cat.id];
    if (!moData) return;
    // Weighted average — months with fewer days count less
    let weightedSum = 0, weightTotal = 0;
    months.forEach(mo => {
      const amt = moData[mo]||0;
      if (amt === 0) return;
      const weight = daysByMo[mo] / maxDays;
      weightedSum += amt * weight;
      weightTotal += weight;
    });
    if (weightTotal === 0) return;
    const avg = weightedSum / weightTotal;
    // Round up to nearest $5, min $10
    suggestions[cat.id] = Math.max(10, Math.ceil(avg/5)*5);
  });

  return suggestions;
}

function AutoCalibrate({allTx, groups, currentAssigned, onApply, onClose }) {
  const C = useC();
  const suggestions  = useMemo(() => computeSuggestedTargets(allTx, groups), [allTx, groups]);
  const [approved, setApproved] = useState(() => {
    // Pre-select only cats where suggestion differs from current by >$10
    const init = {};
    Object.entries(suggestions).forEach(([id, sug]) => {
      init[id] = Math.abs(sug - (currentAssigned[id]||0)) > 10;
    });
    return init;
  });
  const [customVals, setCustomVals] = useState({});

  const changed = Object.entries(suggestions).filter(([id]) => Math.abs(suggestions[id]-(currentAssigned[id]||0)) > 10);
  const unchanged = Object.entries(suggestions).filter(([id]) => Math.abs(suggestions[id]-(currentAssigned[id]||0)) <= 10);
  const selectedCount = Object.values(approved).filter(Boolean).length;

  const fmt = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);

  const handleApply = () => {
    const updates = {};
    Object.entries(approved).forEach(([id, isOn]) => {
      if (!isOn) return;
      updates[id] = parseFloat(customVals[id]) || suggestions[id];
    });
    onApply(updates);
    onClose();
  };

  const catLabel = id => groups.flatMap(g=>g.cats).find(c=>c.id===id)?.label || id;
  const groupOf  = id => groups.find(g=>g.cats.some(c=>c.id===id))?.label || "";

  return (
    <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,zIndex:400,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div style={{position:"absolute",top:0,right:0,bottom:0,left:0,background:"#00000090"}} onClick={onClose} />
      <div style={{position:"relative",background:C.card,borderRadius:"22px 22px 0 0",maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 -12px 48px #00000080"}}>
        {/* Header */}
        <div style={{padding:"20px 20px 0"}}>
          <div style={{width:40,height:4,borderRadius:2,background:C.border,margin:"0 auto 20px"}} />
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <div>
              <div style={{fontSize:18,fontWeight:800,color:C.text,fontFamily:F.sans}}>Auto-Calibrate Targets</div>
              <div style={{fontSize:12,color:C.textDim,marginTop:4,lineHeight:1.5}}>Based on your real spending across {[...new Set(allTx.map(t=>t.date.slice(0,7)))].length} months of data.</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer",padding:"0 0 0 12px",lineHeight:1}}>×</button>
          </div>
          {changed.length > 0 && (
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <button onClick={()=>setApproved(a=>{const n={...a};changed.forEach(([id])=>n[id]=true);return n;})}
                style={{flex:1,padding:"9px",borderRadius:10,border:`1px solid ${C.accent}40`,background:C.accentDim,color:C.accent,fontSize:12,fontWeight:700,fontFamily:F.sans,cursor:"pointer"}}>
                Select all {changed.length}
              </button>
              <button onClick={()=>setApproved(a=>{const n={...a};Object.keys(n).forEach(k=>n[k]=false);return n;})}
                style={{flex:1,padding:"9px",borderRadius:10,border:`1px solid ${C.border}`,background:C.surface,color:C.muted,fontSize:12,fontWeight:700,fontFamily:F.sans,cursor:"pointer"}}>
                Deselect all
              </button>
            </div>
          )}
          <div style={{height:1,background:C.border}} />
        </div>

        {/* Scrollable list */}
        <div style={{overflowY:"auto",flex:1,padding:"12px 20px"}}>
          {changed.length === 0 && (
            <div style={{textAlign:"center",padding:"32px 0",color:C.textDim,fontSize:13}}>
              ✓ All targets are already well-calibrated to your spending.
            </div>
          )}

          {changed.length > 0 && (
            <>
              <div style={{fontSize:10,color:C.muted,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>
                Recommended updates ({changed.length})
              </div>
              {changed.map(([id, sug]) => {
                const cur     = currentAssigned[id]||0;
                const diff    = sug - cur;
                const isOn    = approved[id]||false;
                const custom  = customVals[id];
                const displayVal = custom !== undefined ? custom : sug;
                const label   = catLabel(id);
                const group   = groupOf(id);
                return (
                  <div key={id} style={{marginBottom:10,borderRadius:14,border:`1.5px solid ${isOn?C.accent+"50":C.border}`,background:isOn?C.accentDim:C.surface,overflow:"hidden",transition:"all 0.15s"}}>
                    <button onClick={()=>setApproved(a=>({...a,[id]:!a[id]}))}
                      style={{width:"100%",padding:"14px 16px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${isOn?C.accent:C.border}`,background:isOn?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
                        {isOn && <span style={{color:C.bg,fontSize:10,fontWeight:900,lineHeight:1}}>✓</span>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                          <div>
                            <span style={{fontSize:13,fontWeight:700,color:isOn?C.text:C.textDim}}>{label}</span>
                            <span style={{fontSize:10,color:C.muted,marginLeft:8,fontFamily:F.mono}}>{group}</span>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                            <span style={{fontSize:10,color:C.muted,fontFamily:F.mono,textDecoration:"line-through"}}>{fmt(cur)}</span>
                            <span style={{fontSize:13,fontWeight:800,fontFamily:F.mono,color:diff>0?C.gold:C.accent}}>{fmt(sug)}</span>
                          </div>
                        </div>
                        <div style={{fontSize:10,color:diff>0?C.gold:C.accent,fontFamily:F.sans}}>
                          {diff>0?"▲":"▼"} {fmt(Math.abs(diff))} {diff>0?"increase":"decrease"} — based on your actual average
                        </div>
                      </div>
                    </button>
                    {isOn && (
                      <div style={{padding:"0 16px 14px",display:"flex",alignItems:"center",gap:10}}>
                        <div style={{fontSize:10,color:C.muted,flexShrink:0}}>Adjust:</div>
                        <div style={{position:"relative",flex:1}}>
                          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,fontFamily:F.mono,fontSize:13}}>$</span>
                          <input type="number" value={displayVal}
                            onChange={e=>setCustomVals(v=>({...v,[id]:e.target.value}))}
                            style={{width:"100%",paddingLeft:24,paddingRight:10,paddingTop:9,paddingBottom:9,background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,fontFamily:F.mono,outline:"none"}} />
                        </div>
                        <button onClick={()=>setCustomVals(v=>{const n={...v};delete n[id];return n;})}
                          style={{fontSize:10,color:C.muted,background:"none",border:"none",cursor:"pointer",flexShrink:0}}>Reset</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {unchanged.length > 0 && (
            <>
              <div style={{fontSize:10,color:C.muted,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",margin:"16px 0 10px"}}>
                Already calibrated ({unchanged.length})
              </div>
              {unchanged.map(([id, sug]) => (
                <div key={id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:10,background:C.surface,marginBottom:6,opacity:0.6}}>
                  <div>
                    <span style={{fontSize:12,color:C.text,fontWeight:600}}>{catLabel(id)}</span>
                    <span style={{fontSize:10,color:C.muted,marginLeft:8,fontFamily:F.mono}}>{groupOf(id)}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10,color:C.accent,fontFamily:F.mono}}>✓ {fmt(sug)}</span>
                  </div>
                </div>
              ))}
            </>
          )}
          <div style={{height:8}} />
        </div>

        {/* Footer CTA */}
        <div style={{padding:"14px 20px 40px",borderTop:`1px solid ${C.border}`}}>
          <button onClick={handleApply} disabled={selectedCount===0}
            style={{width:"100%",padding:"16px",background:selectedCount>0?C.accent:C.border,border:"none",borderRadius:13,color:selectedCount>0?C.bg:C.muted,fontSize:14,fontWeight:800,fontFamily:F.sans,cursor:selectedCount>0?"pointer":"default",boxShadow:selectedCount>0?`0 4px 20px ${C.accent}45`:"none",transition:"all 0.2s"}}>
            {selectedCount===0?"Select targets to update":`Apply ${selectedCount} update${selectedCount!==1?"s":""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function InsightsList({insights }) {
  const C = useC();
  const [expanded, setExpanded] = useState(null);
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:10, color:C.muted, fontFamily:F.sans, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>💡 Patterns & Insights</div>
        <div style={{ fontSize:10, color:C.muted, fontFamily:F.mono }}>{insights.length} findings</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {insights.map((ins, i) => {
          const isOpen    = expanded === i;
          const col       = ins.type === "bad" ? C.red : ins.type === "good" ? C.accent : C.gold;
          const bgOpen    = ins.type === "bad" ? `${C.red}10` : ins.type === "good" ? `${C.accent}10` : `${C.gold}10`;
          const typeLabel = ins.type === "bad" ? "Action needed" : ins.type === "good" ? "On track" : "Worth knowing";
          return (
            <div key={i} style={{ borderRadius:16, overflow:"hidden", border:`1px solid ${isOpen ? col+"50" : C.border}`, background: isOpen ? bgOpen : C.card, transition:"border-color 0.2s, background 0.2s", boxShadow: isOpen ? `0 4px 24px ${col}12` : "none" }}>
              <button onClick={() => setExpanded(isOpen ? null : i)} style={{ width:"100%", padding:"15px 16px", background:"transparent", border:"none", cursor:"pointer", textAlign:"left" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:3, height:44, borderRadius:2, background:col, flexShrink:0 }} />
                  <div style={{ width:42, height:42, borderRadius:12, background:`${col}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18 }}>{ins.emoji}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:10, fontFamily:F.mono, fontWeight:700, letterSpacing:"0.09em", textTransform:"uppercase", color:col, marginBottom:4 }}>{typeLabel}</div>
                    <div style={{ fontSize:13, fontWeight:800, fontFamily:F.sans, color:C.text, lineHeight:1.2 }}>{ins.title}</div>
                  </div>
                  <div style={{ width:28, height:28, borderRadius:8, background:`${col}14`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontSize:13, color:col, display:"inline-block", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition:"transform 0.2s", lineHeight:1 }}>›</span>
                  </div>
                </div>
              </button>
              {isOpen && (
                <div style={{ padding:"0 16px 18px 16px" }}>
                  <div style={{ height:1, background:`${col}25`, marginBottom:14 }} />
                  <div style={{ fontSize:13, color:C.text, fontFamily:F.sans, lineHeight:1.75, marginBottom:14, fontWeight:500 }}>{ins.body}</div>
                  <div style={{ background:C.bg, borderRadius:12, padding:"14px", border:`1px solid ${col}22` }}>
                    <div style={{ fontSize:10, color:col, fontFamily:F.mono, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>→ What to do</div>
                    <div style={{ fontSize:13, color:C.textDim, fontFamily:F.sans, lineHeight:1.75 }}>{ins.tip}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CatSheet ────────────────────────────────────────────────────────────────
function CatSheet({cat, assigned, spent, onAssign, onClose }) {
  const C = useC();
  const [val, setVal] = useState(String(assigned));
  const status = catStatus(assigned, cat.target, spent);
  const col    = STATUS_COLOR[status];
  return (
    <div style={{ position:"fixed", top:0, right:0, bottom:0, left:0, zIndex:300, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div style={{ position:"absolute", top:0, right:0, bottom:0, left:0, background:"#00000088" }} onClick={onClose} />
      <div style={{ position:"relative", background:C.card, borderRadius:"22px 22px 0 0", padding:"8px 20px 44px", boxShadow:"0 -12px 48px #00000070" }}>
        <div style={{ width:40, height:4, borderRadius:2, background:C.border, margin:"16px auto 20px" }} />
        <div style={{ fontSize:18, fontWeight:800, fontFamily:F.sans, color:C.text, marginBottom:4 }}>{cat.label}</div>
        <div style={{ fontSize:12, color:C.muted, fontFamily:F.mono, marginBottom:20 }}>Target: {fmt(cat.target)}/month · Spent: {fmt(spent)}</div>
        <div style={{ fontSize:10, color:C.muted, fontFamily:F.sans, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>Assign</div>
        <div style={{ position:"relative", marginBottom:20 }}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:C.muted, fontFamily:F.mono, fontSize:14 }}>$</span>
          <input type="number" value={val} onChange={e => setVal(e.target.value)} style={{ width:"100%", paddingLeft:28, paddingRight:14, paddingTop:14, paddingBottom:14, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, color:C.text, fontSize:18, fontFamily:F.mono, outline:"none" }} />
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          {[0, cat.target * 0.5, cat.target, cat.target * 1.5].map(v => (
            <button key={v} onClick={() => setVal(String(Math.round(v)))} style={{ flex:1, padding:"9px 4px", borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, color:C.muted, fontSize:10, fontFamily:F.mono, cursor:"pointer" }}>{fmt(v)}</button>
          ))}
        </div>
        <button onClick={() => { onAssign(parseFloat(val)||0); onClose(); }} style={{ width:"100%", padding:"15px", background:C.accent, border:"none", borderRadius:12, color:C.bg, fontSize:14, fontWeight:800, fontFamily:F.sans, cursor:"pointer", boxShadow:`0 4px 16px ${C.accent}40` }}>
          Assign {fmt(parseFloat(val)||0)}
        </button>
      </div>
    </div>
  );
}

// ─── CashIncomeSheet ─────────────────────────────────────────────────────────
const CASH_SOURCES = [
  { id:"tips",      label:"Tips",        icon:"💵", desc:"Service, bartending, delivery" },
  { id:"freelance", label:"Freelance",   icon:"💻", desc:"Project work, contracts" },
  { id:"side_job",  label:"Side job",    icon:"🔧", desc:"Gigs, odd jobs, labor" },
  { id:"gift",      label:"Gift",        icon:"🎁", desc:"Cash gift from someone" },
  { id:"sell",      label:"Sold something", icon:"📦", desc:"Marketplace, yard sale" },
  { id:"other",     label:"Other cash",  icon:"💰", desc:"Anything else" },
];

function CashIncomeSheet({ onSave, onClose }) {
  const C = useC();
  const [amount,  setAmount]  = useState("");
  const [source,  setSource]  = useState(null);
  const [date,    setDate]    = useState(new Date().toISOString().split("T")[0]);
  const [note,    setNote]    = useState("");

  const canSave = !!source && parseFloat(amount) > 0;

  const handleSave = () => {
    if (!canSave) return;
    const src = CASH_SOURCES.find(s=>s.id===source);
    onSave({
      id:          Date.now(),
      date,
      description: note.trim() || `Cash — ${src.label}`,
      amount:      Math.abs(parseFloat(amount)),
      type:        "income",
      category:    "Income",
      cashSource:  source,
    });
    onClose();
  };

  return (
    <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,zIndex:300,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:"#00000088"}} onClick={onClose}/>
      <div style={{position:"relative",background:C.card,borderRadius:"22px 22px 0 0",padding:"8px 20px 48px",boxShadow:"0 -12px 48px #00000070",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{width:40,height:4,borderRadius:2,background:C.border,margin:"16px auto 20px"}}/>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:C.text,fontFamily:F.sans,marginBottom:4}}>Log Cash Income</div>
            <div style={{fontSize:12,color:C.muted,fontFamily:F.sans}}>Money received but not in your bank account</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>×</button>
        </div>

        {/* Amount */}
        <div style={{marginBottom:20}}>
          <span style={{fontSize:10,color:C.muted,fontFamily:F.sans,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:7,display:"block"}}>Amount received</span>
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:C.accent,fontFamily:F.mono,fontSize:18,fontWeight:700}}>$</span>
            <input
              autoFocus
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e=>setAmount(e.target.value)}
              style={{width:"100%",paddingLeft:30,paddingRight:14,paddingTop:16,paddingBottom:16,background:C.surface,border:`1.5px solid ${amount?C.accent:C.border}`,borderRadius:14,color:C.text,fontSize:22,fontFamily:F.mono,fontWeight:800,outline:"none",letterSpacing:"-0.01em"}}/>
          </div>
          {/* Quick amounts */}
          <div style={{display:"flex",gap:6,marginTop:8}}>
            {[20,50,100,200].map(v=>(
              <button key={v} onClick={()=>setAmount(String(v))}
                style={{flex:1,padding:"8px 4px",borderRadius:9,border:`1px solid ${C.border}`,background:parseFloat(amount)===v?C.accentDim:C.surface,color:parseFloat(amount)===v?C.accent:C.muted,fontSize:12,fontFamily:F.mono,fontWeight:700,cursor:"pointer"}}>
                ${v}
              </button>
            ))}
          </div>
        </div>

        {/* Source */}
        <div style={{marginBottom:20}}>
          <span style={{fontSize:10,color:C.muted,fontFamily:F.sans,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,display:"block"}}>Where did it come from?</span>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {CASH_SOURCES.map(s=>{
              const active = source===s.id;
              return (
                <button key={s.id} onClick={()=>setSource(s.id)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:14,border:`1.5px solid ${active?C.accent:C.border}`,background:active?C.accentDim:C.surface,cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                  <span style={{fontSize:18,flexShrink:0}}>{s.icon}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:active?C.accent:C.text,lineHeight:1.2}}>{s.label}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:2,lineHeight:1.3}}>{s.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date + note */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
          <div>
            <span style={{fontSize:10,color:C.muted,fontFamily:F.sans,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:7,display:"block"}}>Date</span>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              style={{width:"100%",padding:"12px 14px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,color:C.text,fontSize:13,fontFamily:F.mono,outline:"none"}}/>
          </div>
          <div>
            <span style={{fontSize:10,color:C.muted,fontFamily:F.sans,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:7,display:"block"}}>Note (optional)</span>
            <input type="text" value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Friday tips"
              style={{width:"100%",padding:"12px 14px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,color:C.text,fontSize:13,fontFamily:F.sans,outline:"none"}}/>
          </div>
        </div>

        <button onClick={handleSave} disabled={!canSave}
          style={{width:"100%",padding:"16px",background:canSave?C.accent:C.border,border:"none",borderRadius:14,color:canSave?C.bg:C.muted,fontSize:14,fontWeight:800,fontFamily:F.sans,cursor:canSave?"pointer":"default",boxShadow:canSave?`0 4px 20px ${C.accent}40`:"none",transition:"all 0.2s"}}>
          {canSave ? ("Log " + (amount ? "$" + parseFloat(amount).toFixed(2) + " " : "") + "Cash Income →") : "Select a source to continue"}
        </button>
      </div>
    </div>
  );
}

// ─── TxSheet ─────────────────────────────────────────────────────────────────
const ALL_CATS_TX = ["🛒 Groceries","🍽 Dining Out","🚗 Delivery","🔔 Subscriptions","Transport","Travel","Shopping","Entertainment","Health","Utilities","Income","Other","🚩 Tobacco","🚩 Cash","🚩 Fees","🚩 Gambling","❓ Unclear"];

function TxSheet({tx, onSave, onDelete, onClose }) {
  const C = useC();
  const isEdit = !!tx;
  const [desc,   setDesc]   = useState(tx?.description || "");
  const [amount, setAmount] = useState(tx ? String(Math.abs(tx.amount)) : "");
  const [type,   setType]   = useState(tx?.type || "expense");
  const [cat,    setCat]    = useState(tx?.category || "🛒 Groceries");
  const [date,   setDate]   = useState(tx?.date || new Date().toISOString().split("T")[0]);
  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!desc.trim() || isNaN(amt) || amt <= 0) return;
    onSave({ id:tx?.id||Date.now(), date, description:desc.trim(), amount:type==="expense"?-Math.abs(amt):Math.abs(amt), type, category:cat });
    onClose();
  };
  const inputStyle = { width:"100%", padding:"13px 14px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, color:C.text, fontSize:14, fontFamily:F.mono, outline:"none" };
  const labelStyle = { fontSize:10, color:C.muted, fontFamily:F.sans, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:7, display:"block" };
  return (
    <div style={{ position:"fixed", top:0, right:0, bottom:0, left:0, zIndex:300, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div style={{ position:"absolute", top:0, right:0, bottom:0, left:0, background:"#00000088" }} onClick={onClose} />
      <div style={{ position:"relative", background:C.card, borderRadius:"22px 22px 0 0", padding:"8px 20px 40px", boxShadow:"0 -12px 48px #00000070", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ width:40, height:4, borderRadius:2, background:C.border, margin:"16px auto 20px" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <div style={{ fontSize:18, fontWeight:800, fontFamily:F.sans, color:C.text }}>{isEdit?"Edit Transaction":"Add Transaction"}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:22, cursor:"pointer" }}>×</button>
        </div>
        <div style={{ marginBottom:18 }}>
          <span style={labelStyle}>Type</span>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {["expense","income"].map(t => (
              <button key={t} onClick={() => { setType(t); if(t==="income") setCat("Income"); else if(cat==="Income") setCat("🛒 Groceries"); }} style={{ padding:"12px", borderRadius:11, border:`1.5px solid ${type===t?(t==="expense"?C.red:C.accent):C.border}`, background:type===t?(t==="expense"?`${C.red}15`:C.accentDim):C.surface, color:type===t?(t==="expense"?C.red:C.accent):C.muted, fontSize:13, fontWeight:800, fontFamily:F.sans, cursor:"pointer", textTransform:"capitalize" }}>
              {t==="expense"?"💸 Expense":"💰 Income"}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:16 }}><span style={labelStyle}>Description</span><input placeholder="e.g. Chipotle, Rent, Salary" value={desc} onChange={e=>setDesc(e.target.value)} style={inputStyle} /></div>
        <div style={{ marginBottom:16 }}><span style={labelStyle}>Amount</span><div style={{ position:"relative" }}><span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:C.muted, fontFamily:F.mono, fontSize:14 }}>$</span><input type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)} style={{...inputStyle, paddingLeft:28}} /></div></div>
        <div style={{ marginBottom:16 }}><span style={labelStyle}>Date</span><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inputStyle} /></div>
        <div style={{ marginBottom:24 }}>
          <span style={labelStyle}>Category</span>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
            {ALL_CATS_TX.filter(c => type==="income"?c==="Income":c!=="Income").map(c => {
              const col = CAT_TX_COLOR[c]||C.muted; const active = cat===c;
              return <button key={c} onClick={() => setCat(c)} style={{ padding:"7px 13px", borderRadius:20, border:`1.5px solid ${active?col:C.border}`, background:active?`${col}20`:C.surface, color:active?col:C.muted, fontSize:10, fontWeight:700, fontFamily:F.sans, cursor:"pointer" }}>{c}</button>;
            })}
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {isEdit && <button onClick={()=>{onDelete(tx.id);onClose();}} style={{ padding:"14px 18px", borderRadius:12, border:`1px solid ${C.red}40`, background:`${C.red}12`, color:C.red, fontSize:13, fontWeight:700, fontFamily:F.sans, cursor:"pointer" }}>Delete</button>}
          <button onClick={handleSave} style={{ flex:1, padding:"15px", borderRadius:12, border:"none", background:C.accent, color:C.bg, fontSize:14, fontWeight:800, fontFamily:F.sans, cursor:"pointer", boxShadow:`0 4px 16px ${C.accent}40` }}>{isEdit?"Save Changes":"Add Transaction"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── ClarifySheet ────────────────────────────────────────────────────────────
function ClarifySheet({tx, onSave, onClose }) {
  const C = useC();
  const cats = ALL_CATS_TX.filter(c => c !== "❓ Unclear" && c !== "Income");
  return (
    <div style={{ position:"fixed", top:0, right:0, bottom:0, left:0, zIndex:350, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div style={{ position:"absolute", top:0, right:0, bottom:0, left:0, background:"#00000088" }} onClick={onClose} />
      <div style={{ position:"relative", background:C.card, borderRadius:"22px 22px 0 0", padding:"8px 20px 44px", boxShadow:"0 -12px 48px #00000070" }}>
        <div style={{ width:40, height:4, borderRadius:2, background:C.border, margin:"16px auto 20px" }} />
        <div style={{ fontSize:10, color:"#94a3b8", fontFamily:F.sans, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8 }}>❓ What was this charge for?</div>
        <div style={{ fontSize:18, fontWeight:800, fontFamily:F.sans, color:"#e2e8f0", marginBottom:4 }}>{tx.description}</div>
        <div style={{ display:"flex", gap:12, fontSize:12, fontFamily:F.mono, color:"#94a3b8", marginBottom:16 }}>
          <span>{tx.date}</span><span style={{ color:"#f43f5e", fontWeight:700 }}>{fmtFull(Math.abs(tx.amount))}</span>
        </div>
        <div style={{ height:1, background:"#1e2636", margin:"8px 0 16px" }} />
        <div style={{ fontSize:10, color:"#475569", fontFamily:F.sans, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>Pick a category</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {cats.map(cat => {
            const col = CAT_TX_COLOR[cat]||"#475569";
            return <button key={cat} onClick={()=>{onSave({...tx,category:cat});onClose();}} style={{ padding:"9px 16px", borderRadius:10, border:`1.5px solid ${col}40`, background:`${col}12`, color:col, fontSize:12, fontWeight:700, fontFamily:F.sans, cursor:"pointer" }}>{cat}</button>;
          })}
        </div>
        <button onClick={onClose} style={{ width:"100%", marginTop:16, padding:"13px", background:"transparent", border:`1px solid #1e2636`, borderRadius:12, color:"#475569", fontSize:12, fontFamily:F.sans, fontWeight:600, cursor:"pointer" }}>Skip for now</button>
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({icon, title, body, action, onAction }) {
  const C = useC();
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"56px 32px", textAlign:"center", gap:16 }}>
      <div style={{ fontSize:38, lineHeight:1 }}>{icon}</div>
      <div style={{ fontSize:18, fontWeight:700, fontFamily:F.sans, color:C.text }}>{title}</div>
      <div style={{ fontSize:13, color:C.textDim, fontFamily:F.sans, lineHeight:1.6, maxWidth:260 }}>{body}</div>
      {action && <button onClick={onAction} style={{ marginTop:8, background:C.accent, color:C.bg, border:"none", borderRadius:12, padding:"13px 28px", fontSize:13, fontWeight:800, fontFamily:F.sans, cursor:"pointer", boxShadow:`0 4px 16px ${C.accent}40` }}>{action}</button>}
    </div>
  );
}

// ─── Pill / Label / Card / ChartTip ──────────────────────────────────────────
function Pill({status, label }) {
  const C = useC();
  return <span style={{ fontSize:10, fontWeight:700, fontFamily:F.sans, letterSpacing:"0.06em", textTransform:"uppercase", color:STATUS_COLOR[status], background:STATUS_BG[status], padding:"3px 8px", borderRadius:4 }}>{label}</span>;
}
function Label({children, style }) {
  const C = useC();
  return <div style={{ fontSize:10, color:C.muted, fontFamily:F.sans, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12, ...style }}>{children}</div>;
}
function Card({children, style }) {
  const C = useC();
  return <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, ...style }}>{children}</div>;
}
function ChartTip({active, payload, label }) {
  const C = useC();
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 12px" }}>
      {label && <div style={{ fontSize:10, color:C.muted, fontFamily:F.mono, marginBottom:4 }}>{label}</div>}
      {payload.map((p,i) => <div key={i} style={{ fontSize:12, color:p.color||C.text, fontFamily:F.mono }}>{p.name}: {typeof p.value==="number"?fmtFull(p.value):p.value}</div>)}
    </div>
  );
}
// ─── Transaction data ─────────────────────────────────────────────────────────
const INITIAL_TX = [
  // ── DEC 18 – JAN 16 (verified from Fifth Third statement) ─────────────────────
  {id:1, date:"2025-12-18",description:"Spotify",              amount:-12.71, type:"expense", category:"🔔 Subscriptions"},
  {id:2, date:"2025-12-19",description:"Amazon Prime",         amount:-15.89, type:"expense", category:"🔔 Subscriptions"},
  {id:3, date:"2025-12-22",description:"Riot Games",           amount:-10.99, type:"expense", category:"Entertainment"},
  {id:4, date:"2025-12-22",description:"Riot Games",           amount:-10.99, type:"expense", category:"Entertainment"},
  {id:5, date:"2025-12-22",description:"Riot Games",           amount:-10.99, type:"expense", category:"Entertainment"},
  {id:6, date:"2025-12-22",description:"Crunchyroll",          amount:-12.70, type:"expense", category:"🔔 Subscriptions"},
  {id:7, date:"2025-12-22",description:"DoorDash Popeyes",     amount:-25.09, type:"expense", category:"🚗 Delivery"},
  {id:8, date:"2025-12-22",description:"Crunch Fitness",       amount:-33.99, type:"expense", category:"Health"},
  {id:9, date:"2025-12-22",description:"Dollar General",       amount:-7.50,  type:"expense", category:"🛒 Groceries"},
  {id:10,date:"2025-12-22",description:"Dollar General",       amount:-18.50, type:"expense", category:"🛒 Groceries"},
  {id:11,date:"2025-12-23",description:"Steam Purchase",       amount:-12.27, type:"expense", category:"Entertainment"},
  {id:12,date:"2025-12-23",description:"DoorDash Eggsu",       amount:-34.83, type:"expense", category:"🚗 Delivery"},
  {id:13,date:"2025-12-24",description:"Steam Purchase",       amount:-5.00,  type:"expense", category:"Entertainment"},
  {id:14,date:"2025-12-26",description:"Steam Purchase",       amount:-5.00,  type:"expense", category:"Entertainment"},
  {id:15,date:"2025-12-26",description:"Amazon Prime",         amount:-15.89, type:"expense", category:"🔔 Subscriptions"},
  {id:16,date:"2025-12-26",description:"Spectrum",             amount:-192.37,type:"expense", category:"Utilities"},
  {id:17,date:"2025-12-29",description:"Crunchyroll",          amount:-12.70, type:"expense", category:"🔔 Subscriptions"},
  {id:18,date:"2025-12-29",description:"DoorDash Eggsu",       amount:-25.79, type:"expense", category:"🚗 Delivery"},
  {id:19,date:"2025-12-29",description:"DoorDash Burger",      amount:-28.00, type:"expense", category:"🚗 Delivery"},
  {id:20,date:"2025-12-29",description:"DoorDash Sully",       amount:-30.63, type:"expense", category:"🚗 Delivery"},
  {id:21,date:"2025-12-29",description:"Steam Games",          amount:-39.97, type:"expense", category:"Entertainment"},
  {id:22,date:"2025-12-29",description:"Steam Purchase",       amount:-56.47, type:"expense", category:"Entertainment"},
  {id:23,date:"2025-12-31",description:"DoorDash Popeyes",     amount:-24.35, type:"expense", category:"🚗 Delivery"},
  {id:24,date:"2025-12-31",description:"DoorDash Burger",      amount:-26.16, type:"expense", category:"🚗 Delivery"},
  {id:25,date:"2026-01-02",description:"Spotify",              amount:-12.71, type:"expense", category:"🔔 Subscriptions"},
  {id:26,date:"2026-01-02",description:"DoorDash Sully",       amount:-20.89, type:"expense", category:"🚗 Delivery"},
  {id:27,date:"2026-01-05",description:"Steam Games",          amount:-1.49,  type:"expense", category:"Entertainment"},
  {id:28,date:"2026-01-05",description:"DoorDash DashPass",    amount:-10.59, type:"expense", category:"🚗 Delivery"},
  {id:29,date:"2026-01-05",description:"Unlimited Tobacco",    amount:-18.01, type:"expense", category:"🚩 Tobacco"},
  {id:30,date:"2026-01-05",description:"Crunch Fitness",       amount:-18.99, type:"expense", category:"Health"},
  {id:31,date:"2026-01-05",description:"DoorDash Burger",      amount:-28.00, type:"expense", category:"🚗 Delivery"},
  {id:32,date:"2026-01-05",description:"DoorDash Burger",      amount:-29.69, type:"expense", category:"🚗 Delivery"},
  {id:33,date:"2026-01-05",description:"Dollar General",       amount:-33.75, type:"expense", category:"🛒 Groceries"},
  {id:34,date:"2026-01-05",description:"Schwab Brokerage",     amount:600.00, type:"income",  category:"Income"},
  {id:35,date:"2026-01-06",description:"DoorDash Burger",      amount:-25.78, type:"expense", category:"🚗 Delivery"},
  {id:36,date:"2026-01-06",description:"Sid's Tobacco",       amount:-47.70, type:"expense", category:"🚩 Tobacco"},
  {id:37,date:"2026-01-07",description:"DoorDash 7-Eleven",    amount:-19.50, type:"expense", category:"🚗 Delivery"},
  {id:38,date:"2026-01-07",description:"Amazon",               amount:-34.00, type:"expense", category:"Shopping"},
  {id:39,date:"2026-01-08",description:"DoorDash Marco",       amount:-23.31, type:"expense", category:"🚗 Delivery"},
  {id:40,date:"2026-01-08",description:"DoorDash Popeyes",     amount:-28.93, type:"expense", category:"🚗 Delivery"},
  {id:41,date:"2026-01-09",description:"Dollar General",       amount:-7.50,  type:"expense", category:"🛒 Groceries"},
  {id:42,date:"2026-01-12",description:"DoorDash Marco",       amount:-23.31, type:"expense", category:"🚗 Delivery"},
  {id:43,date:"2026-01-12",description:"Sid's Tobacco",       amount:-47.70, type:"expense", category:"🚩 Tobacco"},
  {id:44,date:"2026-01-12",description:"Spectrum",             amount:-192.37,type:"expense", category:"Utilities"},
  {id:45,date:"2026-01-13",description:"DoorDash Eggsu",       amount:-28.51, type:"expense", category:"🚗 Delivery"},
  {id:46,date:"2026-01-13",description:"Walmart",              amount:-15.97, type:"expense", category:"🛒 Groceries"},
  {id:47,date:"2026-01-14",description:"DoorDash Eggsu",       amount:-28.97, type:"expense", category:"🚗 Delivery"},
  {id:48,date:"2026-01-14",description:"Dollar General",       amount:-10.90, type:"expense", category:"🛒 Groceries"},
  {id:49,date:"2026-01-16",description:"DoorDash Sully",       amount:-15.03, type:"expense", category:"🚗 Delivery"},
  // ── JAN 17 – FEB 17 ─────────────────────────────────────────────────────────
  {id:50, date:"2026-01-17",description:"Schwab Brokerage",    amount:1200.00,type:"income",  category:"Income"},
  {id:51, date:"2026-01-18",description:"Spectrum",            amount:-198.00,type:"expense", category:"Utilities"},
  {id:52, date:"2026-01-18",description:"DoorDash Popeyes",    amount:-32.14, type:"expense", category:"🚗 Delivery"},
  {id:53, date:"2026-01-19",description:"DoorDash Marco",      amount:-21.88, type:"expense", category:"🚗 Delivery"},
  {id:54, date:"2026-01-20",description:"ShopRite",            amount:-55.32, type:"expense", category:"🛒 Groceries"},
  {id:55, date:"2026-01-20",description:"Exxon",               amount:-42.17, type:"expense", category:"Transport"},
  {id:56, date:"2026-01-21",description:"DoorDash Eggsu",      amount:-18.43, type:"expense", category:"🚗 Delivery"},
  {id:57, date:"2026-01-21",description:"Sid's Tobacco",       amount:-23.10, type:"expense", category:"🚩 Tobacco"},
  {id:58, date:"2026-01-22",description:"DoorDash Sully",      amount:-29.54, type:"expense", category:"🚗 Delivery"},
  {id:59, date:"2026-01-23",description:"ALDI",                amount:-47.88, type:"expense", category:"🛒 Groceries"},
  {id:60, date:"2026-01-23",description:"DoorDash Joy of",     amount:-33.21, type:"expense", category:"🚗 Delivery"},
  {id:61, date:"2026-01-24",description:"Crunch Fitness",      amount:-18.99, type:"expense", category:"Health"},
  {id:62, date:"2026-01-24",description:"DoorDash McDonald's", amount:-24.67, type:"expense", category:"🚗 Delivery"},
  {id:63, date:"2026-01-25",description:"ATM Withdrawal",      amount:-100.00,type:"expense", category:"🚩 Cash"},
  {id:64, date:"2026-01-25",description:"ATM Fee",             amount:-3.50,  type:"expense", category:"🚩 Fees"},
  {id:65, date:"2026-01-26",description:"Audible",             amount:-14.95, type:"expense", category:"🔔 Subscriptions"},
  {id:66, date:"2026-01-26",description:"DoorDash Burger",     amount:-27.89, type:"expense", category:"🚗 Delivery"},
  {id:67, date:"2026-01-27",description:"Stop & Shop",         amount:-38.44, type:"expense", category:"🛒 Groceries"},
  {id:68, date:"2026-01-27",description:"DoorDash Insom",      amount:-22.31, type:"expense", category:"🚗 Delivery"},
  {id:69, date:"2026-01-28",description:"Shell",               amount:-39.88, type:"expense", category:"Transport"},
  {id:70, date:"2026-01-28",description:"Unlimited Tobacco",   amount:-24.50, type:"expense", category:"🚩 Tobacco"},
  {id:71, date:"2026-01-29",description:"DoorDash Shop",       amount:-41.23, type:"expense", category:"🚗 Delivery"},
  {id:72, date:"2026-01-29",description:"Zelle from Miraj",    amount:400.00, type:"income",  category:"Income"},
  {id:73, date:"2026-01-30",description:"Target",              amount:-67.43, type:"expense", category:"Shopping"},
  {id:74, date:"2026-01-30",description:"DoorDash Popeyes",    amount:-26.78, type:"expense", category:"🚗 Delivery"},
  {id:75, date:"2026-01-31",description:"Sarmarket",           amount:-9.32,  type:"expense", category:"🛒 Groceries"},
  {id:76, date:"2026-01-31",description:"DoorDash Marco",      amount:-19.44, type:"expense", category:"🚗 Delivery"},
  {id:77, date:"2026-01-31",description:"Steam Games",         amount:-29.99, type:"expense", category:"Entertainment"},
  {id:78, date:"2026-02-01",description:"DoorDash Eggsu",      amount:-23.87, type:"expense", category:"🚗 Delivery"},
  {id:79, date:"2026-02-01",description:"Sid's Tobacco",       amount:-20.30, type:"expense", category:"🚩 Tobacco"},
  {id:80, date:"2026-02-02",description:"ShopRite",            amount:-61.22, type:"expense", category:"🛒 Groceries"},
  {id:81, date:"2026-02-02",description:"DoorDash Sully",      amount:-31.54, type:"expense", category:"🚗 Delivery"},
  {id:82, date:"2026-02-03",description:"YMCA",                amount:-5.00,  type:"expense", category:"Health"},
  {id:83, date:"2026-02-03",description:"DoorDash Joy of",     amount:-28.90, type:"expense", category:"🚗 Delivery"},
  {id:84, date:"2026-02-04",description:"Exxon",               amount:-44.55, type:"expense", category:"Transport"},
  {id:85, date:"2026-02-04",description:"DoorDash McDonald's", amount:-22.43, type:"expense", category:"🚗 Delivery"},
  {id:86, date:"2026-02-05",description:"Ross Stores",         amount:-43.21, type:"expense", category:"Shopping"},
  {id:87, date:"2026-02-05",description:"DoorDash Burger",     amount:-24.17, type:"expense", category:"🚗 Delivery"},
  {id:88, date:"2026-02-06",description:"ATM Withdrawal",      amount:-80.00, type:"expense", category:"🚩 Cash"},
  {id:89, date:"2026-02-06",description:"ATM Fee",             amount:-3.50,  type:"expense", category:"🚩 Fees"},
  {id:90, date:"2026-02-06",description:"DoorDash Insom",      amount:-19.88, type:"expense", category:"🚗 Delivery"},
  {id:91, date:"2026-02-07",description:"Spotify",             amount:-13.77, type:"expense", category:"🔔 Subscriptions"},
  {id:92, date:"2026-02-07",description:"DoorDash Shop",       amount:-35.67, type:"expense", category:"🚗 Delivery"},
  {id:93, date:"2026-02-08",description:"Stop & Shop",         amount:-79.48, type:"expense", category:"🛒 Groceries"},
  {id:94, date:"2026-02-08",description:"Unlimited Tobacco",   amount:-22.80, type:"expense", category:"🚩 Tobacco"},
  {id:95, date:"2026-02-09",description:"DoorDash Popeyes",    amount:-30.92, type:"expense", category:"🚗 Delivery"},
  {id:96, date:"2026-02-09",description:"Best Buy",            amount:-243.79,type:"expense", category:"Shopping"},
  {id:97, date:"2026-02-10",description:"DoorDash Marco",      amount:-23.31, type:"expense", category:"🚗 Delivery"},
  {id:98, date:"2026-02-10",description:"Crunch Fitness",      amount:-18.99, type:"expense", category:"Health"},
  {id:99, date:"2026-02-11",description:"DoorDash Eggsu",      amount:-29.43, type:"expense", category:"🚗 Delivery"},
  {id:100,date:"2026-02-11",description:"Discord Nitro",       amount:-6.35,  type:"expense", category:"🔔 Subscriptions"},
  {id:101,date:"2026-02-12",description:"DoorDash Sully",      amount:-33.43, type:"expense", category:"🚗 Delivery"},
  {id:102,date:"2026-02-12",description:"Zelle from Diana Ho", amount:736.00, type:"income",  category:"Income"},
  {id:103,date:"2026-02-13",description:"ShopRite",            amount:-18.54, type:"expense", category:"🛒 Groceries"},
  {id:104,date:"2026-02-13",description:"DoorDash Joy of",     amount:-27.14, type:"expense", category:"🚗 Delivery"},
  {id:105,date:"2026-02-14",description:"Shell",               amount:-37.92, type:"expense", category:"Transport"},
  {id:106,date:"2026-02-14",description:"DraftKings",          amount:-25.00, type:"expense", category:"🚩 Gambling"},
  {id:107,date:"2026-02-14",description:"DoorDash McDonald's", amount:-40.15, type:"expense", category:"🚗 Delivery"},
  {id:108,date:"2026-02-15",description:"Walgreens",           amount:-12.33, type:"expense", category:"Health"},
  {id:109,date:"2026-02-15",description:"DoorDash Burger",     amount:-17.70, type:"expense", category:"🚗 Delivery"},
  {id:110,date:"2026-02-16",description:"TJ Maxx",             amount:-58.44, type:"expense", category:"Shopping"},
  {id:111,date:"2026-02-16",description:"Sid's Tobacco",       amount:-21.20, type:"expense", category:"🚩 Tobacco"},
  {id:112,date:"2026-02-16",description:"DoorDash Insom",      amount:-20.54, type:"expense", category:"🚗 Delivery"},
  {id:113,date:"2026-02-16",description:"Sarmarket",           amount:-3.92,  type:"expense", category:"🛒 Groceries"},
  {id:114,date:"2026-02-17",description:"Schwab Brokerage",    amount:1200.00,type:"income",  category:"Income"},
  {id:115,date:"2026-02-17",description:"Stop & Shop",         amount:-18.98, type:"expense", category:"🛒 Groceries"},
  {id:116,date:"2026-02-17",description:"DoorDash Shop",       amount:-33.86, type:"expense", category:"🚗 Delivery"},
  // ── FEB 18 – MAR 17 ─────────────────────────────────────────────────────────
  {id:117,date:"2026-02-19",description:"Domino's",            amount:-21.71, type:"expense", category:"🍽 Dining Out"},
  {id:118,date:"2026-02-20",description:"Spectrum",            amount:-230.00,type:"expense", category:"Utilities"},
  {id:119,date:"2026-02-20",description:"DoorDash Popeyes",    amount:-30.44, type:"expense", category:"🚗 Delivery"},
  {id:120,date:"2026-02-21",description:"ShopRite",            amount:-7.98,  type:"expense", category:"🛒 Groceries"},
  {id:121,date:"2026-02-21",description:"ShopRite",            amount:-12.48, type:"expense", category:"🛒 Groceries"},
  {id:122,date:"2026-02-22",description:"DoorDash Marco",      amount:-25.67, type:"expense", category:"🚗 Delivery"},
  {id:123,date:"2026-02-22",description:"Dunkin'",             amount:-9.21,  type:"expense", category:"🍽 Dining Out"},
  {id:124,date:"2026-02-23",description:"Audible",             amount:-14.95, type:"expense", category:"🔔 Subscriptions"},
  {id:125,date:"2026-02-24",description:"DoorDash McDonald's", amount:-40.15, type:"expense", category:"🚗 Delivery"},
  {id:126,date:"2026-02-24",description:"Exxon",               amount:-36.44, type:"expense", category:"Transport"},
  {id:127,date:"2026-02-25",description:"Stop & Shop",         amount:-79.48, type:"expense", category:"🛒 Groceries"},
  {id:128,date:"2026-02-25",description:"ATM Withdrawal",      amount:-128.50,type:"expense", category:"🚩 Cash"},
  {id:129,date:"2026-02-25",description:"ATM Fee",             amount:-3.50,  type:"expense", category:"🚩 Fees"},
  {id:130,date:"2026-02-26",description:"DoorDash Eggsu",      amount:-22.88, type:"expense", category:"🚗 Delivery"},
  {id:131,date:"2026-02-26",description:"Unlimited Tobacco",   amount:-23.60, type:"expense", category:"🚩 Tobacco"},
  {id:132,date:"2026-02-27",description:"Crunch Fitness",      amount:-18.99, type:"expense", category:"Health"},
  {id:133,date:"2026-02-27",description:"DoorDash Sully",      amount:-28.43, type:"expense", category:"🚗 Delivery"},
  {id:134,date:"2026-02-28",description:"YMCA",                amount:-5.00,  type:"expense", category:"Health"},
  {id:135,date:"2026-02-28",description:"DoorDash Joy of",     amount:-31.22, type:"expense", category:"🚗 Delivery"},
  {id:136,date:"2026-03-01",description:"DoorDash Burger",     amount:-19.88, type:"expense", category:"🚗 Delivery"},
  {id:137,date:"2026-03-01",description:"Sid's Tobacco",       amount:-20.10, type:"expense", category:"🚩 Tobacco"},
  {id:138,date:"2026-03-02",description:"YMCA",                amount:-5.00,  type:"expense", category:"Health"},
  {id:139,date:"2026-03-02",description:"Exxon",               amount:-11.27, type:"expense", category:"Transport"},
  {id:140,date:"2026-03-02",description:"Spotify",             amount:-13.77, type:"expense", category:"🔔 Subscriptions"},
  {id:141,date:"2026-03-02",description:"YMCA",                amount:-15.00, type:"expense", category:"Health"},
  {id:142,date:"2026-03-02",description:"Shell",               amount:-15.17, type:"expense", category:"Transport"},
  {id:143,date:"2026-03-02",description:"ATM Withdrawal",      amount:-52.95, type:"expense", category:"🚩 Cash"},
  {id:144,date:"2026-03-02",description:"ShopRite",            amount:-55.89, type:"expense", category:"🛒 Groceries"},
  {id:145,date:"2026-03-02",description:"Supercharged",        amount:-67.90, type:"expense", category:"❓ Unclear"},
  {id:146,date:"2026-03-02",description:"ATM Fee",             amount:-3.50,  type:"expense", category:"🚩 Fees"},
  {id:147,date:"2026-03-03",description:"ATM Withdrawal",      amount:-82.00, type:"expense", category:"🚩 Cash"},
  {id:148,date:"2026-03-03",description:"ATM Fee",             amount:-3.50,  type:"expense", category:"🚩 Fees"},
  {id:149,date:"2026-03-13",description:"Walgreens",           amount:-6.32,  type:"expense", category:"Health"},
  {id:150,date:"2026-03-13",description:"Zelle from Diana Ho", amount:200.00, type:"income",  category:"Income"},
  {id:151,date:"2026-03-16",description:"Discord Nitro",       amount:-6.35,  type:"expense", category:"🔔 Subscriptions"},
  {id:152,date:"2026-03-16",description:"DoorDash DashPass",   amount:-10.59, type:"expense", category:"🚗 Delivery"},
  {id:153,date:"2026-03-16",description:"Crunch Fitness",      amount:-18.99, type:"expense", category:"Health"},
  {id:154,date:"2026-03-16",description:"DraftKings",          amount:-25.00, type:"expense", category:"🚩 Gambling"},
  {id:155,date:"2026-03-16",description:"Stop & Shop",         amount:-55.75, type:"expense", category:"🛒 Groceries"},
  {id:156,date:"2026-03-16",description:"ATM Withdrawal",      amount:-102.00,type:"expense", category:"🚩 Cash"},
  {id:157,date:"2026-03-16",description:"ATM Fee",             amount:-3.50,  type:"expense", category:"🚩 Fees"},
  {id:158,date:"2026-03-16",description:"Zelle from Diana Ho", amount:100.00, type:"income",  category:"Income"},
  {id:159,date:"2026-03-17",description:"Breeze Airways",      amount:-98.00, type:"expense", category:"Travel"},
  {id:160,date:"2026-03-17",description:"Overdraft Fee",       amount:-35.00, type:"expense", category:"🚩 Fees"},
];
// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useTheme();
  const [tx,          setTx]          = useState(INITIAL_TX);
  const [assigned,    setAssigned]    = useState(() => ls("pursuivo_assigned", {
    rent:700, electric:80, internet:50, phone:40,
    groceries:180, transport:100, health:60, household:30,
    dining:50, delivery:100, entertainment:40, subscriptions:50, shopping:90, travel:50,
    emergency:100, vacation:50, investing:80,
  }));
  const [collapsed,   setCollapsed]   = useState(() => ls("pursuivo_collapsed", {}));
  const [isConn,      setConn]        = useState(() => { try { return !!localStorage.getItem("pursuivo_item_id"); } catch { return false; } });
  const [bankStatus,  setBankStatus]  = useState(() => { try { return localStorage.getItem("pursuivo_item_id") ? "Connected" : "No bank linked"; } catch { return "No bank linked"; } });
  const [syncing,     setSyncing]     = useState(false);
  const [tab,         setTab]         = useState("overview");
  const [activeCat,   setActiveCat]   = useState(null);
  const [search,      setSearch]      = useState("");
  const [txFilter,    setTxFilter]    = useState("m0");
  const [sort,        setSort]        = useState("desc");
  const [insightCat,  setInsightCat]  = useState(null);
  const [insightMonth,setInsightMonth]= useState("m0");
  const [txSheet,     setTxSheet]     = useState(null);
  const [clarifyTx,   setClarifyTx]   = useState(null);
  const [showUpload,  setShowUpload]  = useState(false);
  const [uploadMsg,   setUploadMsg]   = useState("");
  const [showCalibrate, setShowCalibrate] = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const [showRedFlags,  setShowRedFlags]  = useState(false);
  const [showCashIncome,setShowCashIncome]= useState(false);
  const [rfTargets, setRfTargets] = useState(() => { try { return JSON.parse(localStorage.getItem("pursuivo_rf_targets")||"{}"); } catch { return {}; } });
  const [rfCommits, setRfCommits] = useState(() => { try { return JSON.parse(localStorage.getItem("pursuivo_rf_commits")||"{}"); } catch { return {}; } });
  const [rfEditingCat, setRfEditingCat] = useState(null);
  const [rfEditVal,    setRfEditVal]    = useState("");
  const [profile,     setProfile]     = useState(() => ls("pursuivo_profile", null));
  const [showProfile, setShowProfile] = useState(false);
  const [showActionPlan, setShowActionPlan] = useState(false);

  const NOW_MONTH    = useMemo(() => getNowMonth(),    []);
  const LAST_MONTH   = useMemo(() => getLastMonth(),   []);
  const MONTH_MINUS2 = useMemo(() => getMonthMinus2(), []);

  const thisTx   = useMemo(() => tx.filter(t => t.date.startsWith(NOW_MONTH)),    [tx, NOW_MONTH]);
  const lastTx   = useMemo(() => tx.filter(t => t.date.startsWith(LAST_MONTH)),   [tx, LAST_MONTH]);
  const minus2Tx = useMemo(() => tx.filter(t => t.date.startsWith(MONTH_MINUS2)), [tx, MONTH_MINUS2]);

  const totalIncome = useMemo(() => thisTx.filter(t => t.type === "income").reduce((s,t) => s+t.amount, 0), [thisTx]);
  const totalSpent  = useMemo(() => thisTx.filter(t => t.type === "expense").reduce((s,t) => s+Math.abs(t.amount), 0), [thisTx]);

  const spentByCat = useMemo(() => {
    const map = {};
    thisTx.filter(t => t.type === "expense").forEach(t => {
      const id = txToBudgetCat(t);
      if (id) map[id] = (map[id] || 0) + Math.abs(t.amount);
    });
    return map;
  }, [thisTx]);

  const totalAssigned = useMemo(() => Object.values(assigned).reduce((s,v) => s+v, 0), [assigned]);
  const readyToAssign = totalIncome - totalAssigned;

  const groupTotals = useMemo(() => {
    const out = {};
    GROUPS.forEach(g => {
      const assigned_g = g.cats.reduce((s,c) => s+(assigned[c.id]||0), 0);
      const spent_g    = g.cats.reduce((s,c) => s+(spentByCat[c.id]||0), 0);
      out[g.id] = { assigned:assigned_g, spent:spent_g, available:assigned_g - spent_g };
    });
    return out;
  }, [assigned, spentByCat]);

  const statusCounts = useMemo(() => {
    const counts = { funded:0, underfunded:0, overspent:0, empty:0 };
    ALL_CATS.forEach(cat => {
      const st = catStatus(assigned[cat.id]||0, cat.target, spentByCat[cat.id]||0);
      counts[st]++;
    });
    return counts;
  }, [assigned, spentByCat]);

  const ageOfMoney = useMemo(() => {
    const incTx = thisTx.filter(t => t.type==="income").sort((a,b) => a.date.localeCompare(b.date));
    const expTx = thisTx.filter(t => t.type==="expense").sort((a,b) => a.date.localeCompare(b.date));
    if (!incTx.length || !expTx.length) return null;
    const lastInc = new Date(incTx[incTx.length-1].date);
    const lastExp = new Date(expTx[expTx.length-1].date);
    return Math.max(0, Math.round((lastExp-lastInc)/86400000));
  }, [thisTx]);

  const areaData = useMemo(() => {
    const map = {};
    thisTx.forEach(t => {
      const d = t.date.slice(8);
      if (!map[d]) map[d] = { date:d, income:0, expenses:0 };
      if (t.type==="income")   map[d].income   += t.amount;
      if (t.type==="expense")  map[d].expenses += Math.abs(t.amount);
    });
    return Object.values(map).sort((a,b) => a.date.localeCompare(b.date));
  }, [thisTx]);

  const ledgerSource = useMemo(() => {
    if (txFilter==="m0") return thisTx;
    if (txFilter==="m1") return lastTx;
    if (txFilter==="m2") return minus2Tx;
    return tx;
  }, [tx, thisTx, lastTx, minus2Tx, txFilter]);

  const ledgerTx = useMemo(() => {
    let list = [...ledgerSource];
    if (search) list = list.filter(t => t.description.toLowerCase().includes(search.toLowerCase()));
    return list.sort((a,b) => sort==="desc" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
  }, [ledgerSource, search, sort]);

  const groupedLedger = useMemo(() => {
    const groups = {};
    ledgerTx.forEach(t => { groups[t.date] = (groups[t.date]||[]).concat(t); });
    return Object.entries(groups).sort(([a],[b]) => sort==="desc" ? b.localeCompare(a) : a.localeCompare(b));
  }, [ledgerTx, sort]);

  const PIE_COLOR_MAP = useMemo(() => {
    const palette = [C.accent,C.blue,C.purple,C.gold,C.orange,C.cyan,C.red,"#ec4899","#14b8a6","#84cc16"];
    const fixed = {
      "🛒 Groceries":C.accent,"🍽 Dining Out":C.cyan,"🚗 Delivery":C.orange,
      "🔔 Subscriptions":"#8b5cf6",Transport:C.blue,Shopping:C.purple,Entertainment:C.gold,
      Health:"#f97316",Utilities:C.cyan,Travel:"#60a5fa",
      "🚩 Tobacco":"#a78bfa","🚩 Cash":"#64748b","🚩 Fees":"#ef4444","🚩 Gambling":"#f97316",
      "❓ Unclear":"#94a3b8",Other:C.muted,
    };
    const map = {...fixed};
    let idx = 0;
    [...new Set(tx.map(t=>t.category))].forEach(cat => { if (!map[cat]) { map[cat]=palette[idx%palette.length]; idx++; } });
    return map;
  }, [tx]);

  useEffect(() => { try { localStorage.setItem("pursuivo_assigned",  JSON.stringify(assigned));  } catch {} }, [assigned]);
  useEffect(() => { try { localStorage.setItem("pursuivo_collapsed", JSON.stringify(collapsed)); } catch {} }, [collapsed]);
  useEffect(() => { try { localStorage.setItem("pursuivo_tx",        JSON.stringify(tx));        } catch {} }, [tx]);

  // ── PWA: register service worker + capture install prompt ────────────────
  useEffect(() => {
    // Capture install prompt for Settings → Install as app
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      window.__pwaPrompt = e;
    });
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" })
        .then(reg => {
          // Handle notification clicks from SW — navigate to correct tab
          navigator.serviceWorker.addEventListener("message", (e) => {
            if (e.data?.type === "NOTIFICATION_CLICK" && e.data.url) {
              const url = new URL(e.data.url, window.location.origin);
              const tabParam = url.searchParams.get("tab");
              if (tabParam) setTab(tabParam);
            }
          });
        })
        .catch(() => {}); // SW registration non-critical
    }
  }, []);

  // ── Notifications: request permission once profile is complete ────────────
  const [notifPermission, setNotifPermission] = useState(() => {
    if (typeof Notification === "undefined") return "unsupported";
    return Notification.permission;
  });

  const requestNotifPermission = async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  // ── Notification helper ───────────────────────────────────────────────────
  const sendNotif = useCallback(async ({ title, body, tag, url: nUrl }) => {
    if (notifPermission !== "granted") return;
    try {
      const reg = await navigator.serviceWorker?.ready;
      if (reg?.active) {
        reg.active.postMessage({ type: "SHOW_NOTIFICATION", title, body, tag, url: nUrl || "/" });
      } else {
        new Notification(title, { body, icon: "/icons/icon-192.png", tag });
      }
    } catch {}
  }, [notifPermission]);

  // ── Budget cap alerts — fire when spending hits 80% or 100% ─────────────
  useEffect(() => {
    if (notifPermission !== "granted") return;
    const fmt = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
    const mo  = NOW_MONTH;
    ALL_CATS.forEach(cat => {
      const spent  = spentByCat[cat.id] || 0;
      const target = assigned[cat.id]   || 0;
      if (target === 0 || spent === 0) return;
      const pct = spent / target;
      if (pct >= 0.8 && pct < 1.0) {
        const key = `pursuivo_notif_80_${cat.id}_${mo}`;
        try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch {}
        sendNotif({ title:`${cat.label} at ${Math.round(pct*100)}%`, body:`${fmt(spent)} spent of ${fmt(target)} budget — ${fmt(target-spent)} left.`, tag:`cap-${cat.id}`, url:"/?tab=budget" });
      } else if (pct >= 1.0) {
        const key = `pursuivo_notif_over_${cat.id}_${mo}`;
        try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch {}
        sendNotif({ title:`${cat.label} over budget`, body:`${fmt(spent)} spent against a ${fmt(target)} budget — ${fmt(spent-target)} over.`, tag:`over-${cat.id}`, url:"/?tab=budget" });
      }
    });
  }, [spentByCat, assigned, notifPermission, NOW_MONTH, sendNotif]);

  // ── Red flag alert — fires when a red flag tx is added ───────────────────
  const prevTxCount = useRef(tx.length);
  useEffect(() => {
    if (notifPermission !== "granted") return;
    if (tx.length <= prevTxCount.current) { prevTxCount.current = tx.length; return; }
    const newTx = tx.slice(prevTxCount.current);
    prevTxCount.current = tx.length;
    const fmt = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
    const rfLabels = {"🚩 Tobacco":"Tobacco charge","🚩 Cash":"Cash withdrawal","🚩 Fees":"Bank fee","🚩 Gambling":"Gambling charge"};
    newTx.filter(t=>t.type==="expense"&&rfLabels[t.category]).forEach(t => {
      sendNotif({ title:`${rfLabels[t.category]} detected`, body:`${t.description} — ${fmt(Math.abs(t.amount))}. Not in your budget.`, tag:"red-flag", url:"/?tab=ledger" });
    });
  }, [tx, notifPermission, sendNotif]);

  // ── Daily 9pm summary — scheduled on mount ────────────────────────────────
  useEffect(() => {
    if (notifPermission !== "granted") return;
    const scheduleSummary = () => {
      const now    = new Date();
      const target = new Date();
      target.setHours(21, 0, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      return setTimeout(() => {
        const today   = new Date().toISOString().split("T")[0];
        const todayTx = tx.filter(t => t.date === today && t.type === "expense");
        const spent   = todayTx.reduce((s,t) => s+Math.abs(t.amount), 0);
        if (spent === 0) { timerId = scheduleSummary(); return; }
        const fmt     = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);
        const delSpent = todayTx.filter(t=>t.category==="🚗 Delivery").reduce((s,t)=>s+Math.abs(t.amount),0);
        const delLeft  = (assigned["delivery"]||0) - (spentByCat["delivery"]||0);
        let body = `You spent ${fmt(spent)} today.`;
        if (delLeft > 0)  body += ` ${fmt(delLeft)} left in delivery.`;
        if (delLeft < 0)  body += ` Delivery is ${fmt(Math.abs(delLeft))} over budget.`;
        sendNotif({ title:"Pursuivo Daily Summary", body, tag:"daily-summary", url:"/?tab=overview" });
        timerId = scheduleSummary();
      }, target - now);
    };
    let timerId = scheduleSummary();
    return () => clearTimeout(timerId);
  }, [notifPermission, tx, assigned, spentByCat, sendNotif]);

  const unclearTx  = useMemo(() => tx.filter(t => t.category==="❓ Unclear"), [tx]);
  const saveTx     = (t) => setTx(prev => { const idx=prev.findIndex(x=>x.id===t.id); if(idx>=0){const n=[...prev];n[idx]=t;return n;} return [...prev,t]; });
  const deleteTx   = (id) => setTx(prev => prev.filter(t => t.id!==id));
  const assignCat  = (catId, amount) => setAssigned(a => ({...a, [catId]:Math.max(0,amount)}));
  const toggleGroup= id => setCollapsed(c => ({...c, [id]:!c[id]}));
  const activeCatObj = activeCat ? ALL_CATS.find(c=>c.id===activeCat) : null;
  const switchTab  = (id) => { setTab(id); if(id!=="insights") setInsightCat(null); };

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (file.size > 10*1024*1024) { setUploadMsg("⚠ File too large (max 10MB)"); return; }
    if (!file.name.toLowerCase().endsWith(".csv")) { setUploadMsg("⚠ Upload a .csv file"); return; }
    setUploadMsg("Reading…");
    try {
      const text  = await file.text();
      const lines = text.trim().split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) { setUploadMsg("⚠ No transactions found"); return; }

      // Proper CSV row parser — handles quoted fields containing commas
      const parseRow = (line) => {
        const vals = []; let cur = "", inQ = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') { inQ = !inQ; continue; }
          if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ""; continue; }
          cur += ch;
        }
        vals.push(cur.trim());
        return vals;
      };

      // Amount: handles $1,234.56 / (25.09) negatives / plain -25.09
      const parseAmt = (str) => {
        if (!str) return NaN;
        str = str.trim().replace(/[$, ]/g, "");
        if (str.startsWith("(") && str.endsWith(")")) return -parseFloat(str.slice(1,-1));
        return parseFloat(str);
      };

      // Date → YYYY-MM-DD: handles MM/DD/YYYY, M/D/YYYY, MM/DD/YY, ISO
      const parseDate = (str) => {
        if (!str) return null;
        str = str.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0,10);
        const m1 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (m1) return `${m1[3]}-${m1[1].padStart(2,"0")}-${m1[2].padStart(2,"0")}`;
        const m2 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
        if (m2) return `20${m2[3]}-${m2[1].padStart(2,"0")}-${m2[2].padStart(2,"0")}`;
        return null;
      };

      // Merchant normalisation — maps raw bank strings to clean names
      const MERCHANT_MAP = [
        [/DD \*DOORDASH POPEY/i,"DoorDash Popeyes"],[/DD \*DOORDASH EGGSU/i,"DoorDash Eggsu"],
        [/DD \*DOORDASH BURGE/i,"DoorDash Burger"],[/DD \*DOORDASH SULLY/i,"DoorDash Sully"],
        [/DD \*DOORDASH MARCO/i,"DoorDash Marco"],[/DD \*DOORDASH 7-ELE/i,"DoorDash 7-Eleven"],
        [/DD \*DOORDASH JOY/i,"DoorDash Joy of"],[/DD \*DOORDASHDASHPA/i,"DoorDash DashPass"],
        [/DD \*DOORDASH INSOM/i,"DoorDash Insom"],[/DD \*DOORDASH/i,"DoorDash"],
        [/ABC\*.*CRUNCH|CRUNCH FITNESS/i,"Crunch Fitness"],[/CRUNCHYROLL/i,"Crunchyroll"],
        [/STEAMGAMES|WL \*STEAM|STEAM PURCHASE/i,"Steam"],[/RIOT\*/i,"Riot Games"],
        [/SPECTRUM/i,"Spectrum"],[/SCHWAB BROKERAGE/i,"Schwab Brokerage"],
        [/SID.*TOBACCO/i,"Sid's Tobacco"],[/UNLIMITED TOBACCO/i,"Unlimited Tobacco"],
        [/DOLLAR GENERAL/i,"Dollar General"],[/WAL-MART|WALMART/i,"Walmart"],
        [/AMAZON PRIME/i,"Amazon Prime"],[/AMAZON MKTPL|AMAZON/i,"Amazon"],
        [/Spotify/i,"Spotify"],[/AUDIBLE/i,"Audible"],[/DISCORD/i,"Discord Nitro"],
        [/KINDLE/i,"Kindle Unlimited"],[/EXXON/i,"Exxon"],[/\bSHELL\b/i,"Shell"],
        [/BREEZE AIRWAYS/i,"Breeze Airways"],[/SHOPRITE/i,"ShopRite"],
        [/STOP.*SHOP/i,"Stop & Shop"],[/\bALDI\b/i,"ALDI"],[/WALGREENS/i,"Walgreens"],
        [/\bTARGET\b/i,"Target"],[/ROSS STORES/i,"Ross Stores"],[/TJ MAXX|TJX/i,"TJ Maxx"],
        [/BEST BUY/i,"Best Buy"],[/MCDONALD/i,"McDonald's"],[/DOMINO/i,"Domino's"],
        [/DUNKIN/i,"Dunkin'"],[/DRAFTKINGS/i,"DraftKings"],[/\bYMCA\b/i,"YMCA"],
        [/ZELLE FROM/i, (r) => { const m=r.match(/ZELLE FROM (.+)/i); return m?"Zelle from "+m[1].trim().replace(/\s+\d+.*$/,""):"Zelle"; }],
      ];

      const cleanDesc = (raw) => {
        if (!raw) return "Unknown";
        for (const [pat, name] of MERCHANT_MAP) {
          if (pat.test(raw)) return typeof name === "function" ? name(raw) : name;
        }
        let d = raw
          .replace(/^(RECURRING PURCHASE AT|DEBIT CARD PURCHASE AT|MERCHANT PAYMENT|WEB INITIATED PAYMENT AT|EARLY PAY:|DEBIT PURCHASE AT|POS PURCHASE|ACH DEBIT|ACH CREDIT)\s+/i,"")
          .replace(/,\s*[A-Z ]+,\s*[A-Z]{2}\s*$/i,"")
          .replace(/\s+[A-Z]{2}\s+\d{5}(-\d{4})?$/i,"")
          .replace(/\s+ON\s+\d{6}.*$/i,"")
          .replace(/\s+FROM\s+CARD#.*$/i,"")
          .replace(/\*[A-Z0-9]{6,}$/i,"")
          .replace(/\s+[A-Z0-9]{10,}$/,"")
          .replace(/[\s\-#*]+$/,"").trim();
        return d.length > 0 ? d.charAt(0).toUpperCase() + d.slice(1) : "Unknown";
      };

      // Detect columns
      const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/"/g,"").trim());
      const hIdx = (...candidates) => { for (const c of candidates) { const i=headers.findIndex(h=>h.includes(c)); if(i>=0) return i; } return -1; };
      const dateIdx   = hIdx("date","posted","transaction date","post date");
      const descIdx   = hIdx("description","payee","memo","narrative","name","details");
      const amtIdx    = hIdx("amount","transaction amount");
      const debitIdx  = hIdx("debit","withdrawal","debit amount");
      const creditIdx = hIdx("credit","deposit","credit amount");
      // Wells Fargo has no real headers — detect by all-numeric/empty header row
      const isWellsFargo = headers.length >= 5 && headers.every(h => !isNaN(parseFloat(h)) || h==="" || h==="*");

      const parsed = lines.slice(1).map((line,i) => {
        const vals = parseRow(line);
        if (vals.every(v=>!v)) return null;
        let rawDate, rawDesc, amount;
        if (isWellsFargo) {
          rawDate=vals[0]; amount=parseAmt(vals[1]); rawDesc=vals[4]||vals[3];
        } else {
          rawDate = dateIdx>=0 ? vals[dateIdx] : vals[0];
          rawDesc = descIdx>=0 ? vals[descIdx] : "";
          if (amtIdx>=0 && vals[amtIdx]!==undefined) {
            amount = parseAmt(vals[amtIdx]);
          } else if (debitIdx>=0||creditIdx>=0) {
            const d=debitIdx>=0?parseAmt(vals[debitIdx])||0:0;
            const cr=creditIdx>=0?parseAmt(vals[creditIdx])||0:0;
            amount = cr>0 ? cr : -Math.abs(d);
          } else {
            amount = parseAmt(vals[1]);
          }
        }
        const date = parseDate(rawDate);
        if (!date||isNaN(amount)) return null;
        const description = cleanDesc(rawDesc||"");
        const category    = guessCategory(rawDesc||description);
        return { id:Date.now()+i, date, description, amount, type:amount>=0?"income":"expense", category };
      }).filter(Boolean);

      if (!parsed.length) { setUploadMsg("⚠ No valid rows found. Check your CSV format."); return; }

      setTx(prev => {
        const existing = new Set(prev.map(t=>`${t.date}|${t.description}|${t.amount}`));
        const newOnes  = parsed.filter(t=>!existing.has(`${t.date}|${t.description}|${t.amount}`));
        const dupes    = parsed.length - newOnes.length;
        setUploadMsg(newOnes.length>0
          ? `✓ ${newOnes.length} imported${dupes>0?", "+dupes+" duplicates skipped":""}`
          : `⚠ All ${dupes} transactions already exist`);
        setTimeout(() => { setShowUpload(false); setUploadMsg(""); }, 2000);
        return [...prev, ...newOnes];
      });

    } catch(err) {
      console.error(err);
      setUploadMsg("⚠ Error reading file — check format");
    }
  }, []);

  const fetchTx = useCallback(async (itemId) => {
    setSyncing(true); setBankStatus("Syncing…");
    try {
      const res  = await fetch(`${API_BASE}/api/get_transactions`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({item_id:itemId})});
      const data = await res.json();
      if (data.transactions) { setTx(data.transactions); setConn(true); setBankStatus(`Synced · ${data.count} transactions`); }
      else setBankStatus("Sync failed — tap to retry");
    } catch { setBankStatus("Connection error"); } finally { setSyncing(false); }
  }, []);

  useEffect(() => { const id=localStorage.getItem("pursuivo_item_id"); if(id) fetchTx(id); }, [fetchTx]);

  const openPlaid = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/create_link_token`,{method:"POST",headers:{"Content-Type":"application/json"}});
      const data = await res.json();
      if (!data.link_token) throw new Error("No link token");
      if (!window.Plaid) { await new Promise((resolve,reject) => { const s=document.createElement("script"); s.src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"; s.onload=resolve; s.onerror=reject; document.head.appendChild(s); }); }
      window.Plaid.create({
        token:data.link_token,
        onSuccess:async(pt) => {
          const ex=await fetch(`${API_BASE}/api/exchange_token`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({public_token:pt})});
          const exd=await ex.json();
          if (exd.item_id) { try{localStorage.setItem("pursuivo_item_id",exd.item_id);}catch{} fetchTx(exd.item_id); }
        },
        onExit:err => { if(err) console.error(err); },
      }).open();
    } catch(e) { console.error(e); alert("Could not connect to bank. Make sure your backend is deployed."); }
  }, [fetchTx]);

  const disconnect = () => {
    if (!window.confirm("Disconnect your bank and clear transaction data?")) return;
    try{localStorage.removeItem("pursuivo_item_id");localStorage.removeItem("pursuivo_tx");}catch{}
    setTx([]); setConn(false); setBankStatus("No bank linked");
  };

  const completeProfile = (answers) => {
    try { localStorage.setItem("pursuivo_profile",JSON.stringify(answers)); } catch {}
    setProfile(answers);
    setShowProfile(false);
    setShowActionPlan(true);
  };

  if (!profile || showProfile) {
    const allMosP = [minus2Tx, lastTx, thisTx].filter(m=>m.length>0);
    const moCntP  = allMosP.length || 1;
    const avgPF   = cat => allMosP.reduce((s,m)=>s+m.filter(t=>t.category===cat&&t.type==="expense").reduce((a,t)=>a+Math.abs(t.amount),0),0)/moCntP;
    const txCtx   = tx.length > 0 ? {
      avgDelivery:   Math.round(avgPF("🚗 Delivery")),
      avgFees:       Math.round(avgPF("🚩 Fees")),
      avgIncome:     Math.round(allMosP.reduce((s,m)=>s+m.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0),0)/moCntP),
      avgTotalSpend: Math.round(allMosP.reduce((s,m)=>s+m.filter(t=>t.type==="expense").reduce((a,t)=>a+Math.abs(t.amount),0),0)/moCntP),
    } : null;
    return <ProfileFlow onComplete={completeProfile} txContext={txCtx} />;
  }
  if (showActionPlan) {
    // Compute real averages from actual transaction data
    const allMos = [minus2Tx, lastTx, thisTx].filter(m=>m.length>0);
    const moCount = allMos.length || 1;
    const avg = (cat) => allMos.reduce((s,m)=>s+m.filter(t=>t.category===cat&&t.type==="expense").reduce((a,t)=>a+Math.abs(t.amount),0),0)/moCount;
    const txData = {
      months:       moCount,
      txCount:      tx.length,
      unclearCount: tx.filter(t=>t.category==="❓ Unclear").length,
      avgDelivery:  Math.round(avg("🚗 Delivery")),
      avgTobacco:   Math.round(avg("🚩 Tobacco")),
      avgCash:      Math.round(avg("🚩 Cash")),
      avgFees:      Math.round(avg("🚩 Fees")),
      avgGroceries: Math.round(avg("🛒 Groceries")),
      avgIncome:    Math.round(allMos.reduce((s,m)=>s+m.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0),0)/moCount),
      avgTotalSpend:Math.round(allMos.reduce((s,m)=>s+m.filter(t=>t.type==="expense").reduce((a,t)=>a+Math.abs(t.amount),0),0)/moCount),
    };
    return <ActionPlan profile={profile} txData={txData} onDone={() => setShowActionPlan(false)} />;
  }

  const TAB_H = 66, TOP_H = 58;
  const NAV = [
    {id:"budget",   label:"Budget",   icon:"◎"},
    {id:"ledger",   label:"Ledger",   icon:"☰"},
    {id:"insights", label:"Insights", icon:"◑"},
    {id:"overview", label:"Overview", icon:"◉"},
  ];
  return (
    <div key={theme} style={{display:"flex",flexDirection:"column",minHeight:"100vh",maxWidth:430,margin:"0 auto",background:C.bg,color:C.text,position:"relative"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
        ::-webkit-scrollbar { display:none; }
        input::placeholder { color:${C.muted}; }
        input:focus { outline:none; border-color:${C.accent}70 !important; }
        button:active { opacity:0.8; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(0.5); }
      `}</style>

      {/* ── Header ── */}
      <header style={{position:"fixed",top:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:200,background:`${C.bg}f2`,backdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`,height:TOP_H,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px"}}>
        <div>
          <div style={{fontSize:14,fontWeight:800,fontFamily:F.sans,letterSpacing:"-0.01em"}}>
            <span style={{color:C.accent,fontFamily:F.mono}}>$</span> Pursuivo
          </div>
          <div style={{fontSize:10,fontFamily:F.mono,letterSpacing:"0.06em",marginTop:2,color:isConn?C.accent:C.muted}}>
            {isConn?"● ":""}{bankStatus}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setShowUpload(true)} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.textDim,borderRadius:9,padding:"7px 10px",fontSize:14,cursor:"pointer"}} title="Upload">↑</button>
          {isConn ? (
            <>
              <button onClick={()=>fetchTx(localStorage.getItem("pursuivo_item_id"))} disabled={syncing} style={{background:C.accentDim,border:`1px solid ${C.accent}50`,color:C.accent,borderRadius:9,padding:"7px 12px",fontSize:12,fontFamily:F.sans,fontWeight:700,cursor:"pointer",opacity:syncing?0.5:1}}>{syncing?"…":"↻ Sync"}</button>
              <button onClick={disconnect} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.muted,borderRadius:9,padding:"7px 10px",fontSize:12,cursor:"pointer"}}>✕</button>
            </>
          ) : (
            <button onClick={openPlaid} style={{background:C.accent,color:C.bg,border:"none",borderRadius:9,padding:"8px 16px",fontSize:12,fontFamily:F.sans,fontWeight:800,cursor:"pointer",boxShadow:`0 4px 14px ${C.accent}40`}}>🏦 Connect</button>
          )}
          <button onClick={()=>setShowSettings(true)} style={{background:C.surface,border:`1px solid ${C.border}`,color:C.textDim,borderRadius:9,padding:"7px 10px",fontSize:14,cursor:"pointer",lineHeight:1}} title="Settings">⚙️</button>
        </div>
      </header>

      {/* ── Upload sheet ── */}
      {showUpload && (
        <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,zIndex:300,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
          <div style={{position:"absolute",top:0,right:0,bottom:0,left:0,background:"#00000088"}} onClick={()=>{setShowUpload(false);setUploadMsg("");}} />
          <div style={{position:"relative",background:C.card,borderRadius:"22px 22px 0 0",padding:"8px 22px 44px",boxShadow:"0 -12px 48px #00000070"}}>
            <div style={{width:40,height:4,borderRadius:2,background:C.border,margin:"16px auto 24px"}} />
            <div style={{fontSize:18,fontWeight:800,fontFamily:F.sans,color:C.text,marginBottom:6}}>Upload Statement</div>
            <div style={{fontSize:12,color:C.textDim,marginBottom:24,lineHeight:1.6}}>Upload a CSV from your bank's export. New transactions will be merged with existing data — duplicates are skipped.</div>
            <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,padding:"28px 20px",borderRadius:14,cursor:"pointer",border:`2px dashed ${uploadMsg.startsWith("✓")?C.accent:uploadMsg.startsWith("⚠")?C.red:C.border}`,background:uploadMsg.startsWith("✓")?C.fundedBg:uploadMsg.startsWith("⚠")?C.overspentBg:C.surface}}>
              <input type="file" accept=".csv" style={{display:"none"}} onChange={e=>handleFile(e.target.files?.[0])} />
              <span style={{fontSize:32}}>{uploadMsg.startsWith("✓")?"✅":uploadMsg.startsWith("⚠")?"⚠️":uploadMsg?"⏳":"📄"}</span>
              <div style={{fontSize:13,fontWeight:700,color:uploadMsg?(uploadMsg.startsWith("✓")?C.accent:uploadMsg.startsWith("⚠")?C.red:C.textDim):C.text}}>{uploadMsg||"Tap to choose a CSV file"}</div>
              {!uploadMsg && <div style={{fontSize:10,color:C.muted,fontFamily:F.mono}}>CSV · max 10MB</div>}
            </label>
            <div style={{marginTop:14,padding:"10px 14px",background:`${C.blue}12`,border:`1px solid ${C.blue}25`,borderRadius:10}}>
              <div style={{fontSize:10,color:C.textDim,lineHeight:1.6}}>💡 <strong style={{color:C.text}}>Most banks</strong> let you export transactions as CSV under "Download" or "Export" in online banking.</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Notification permission banner ── */}
      {notifPermission === "default" && profile && (
        <div style={{position:"fixed",top:TOP_H,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:150,padding:"10px 14px 0"}}>
          <div style={{background:`${C.accent}15`,border:`1px solid ${C.accent}30`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:18,flexShrink:0}}>🔔</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:2}}>Enable spending alerts</div>
              <div style={{fontSize:10,color:C.textDim,lineHeight:1.4}}>Daily summaries, budget warnings, red flag alerts.</div>
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <button onClick={()=>setNotifPermission("denied")} style={{background:"none",border:"none",color:C.muted,fontSize:10,cursor:"pointer",padding:"6px 8px",fontFamily:F.sans}}>Later</button>
              <button onClick={requestNotifPermission} style={{background:C.accent,border:"none",borderRadius:8,color:C.bg,fontSize:10,fontWeight:800,cursor:"pointer",padding:"6px 14px",fontFamily:F.sans}}>Enable</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Scrollable body ── */}
      <div style={{flex:1,paddingTop:notifPermission==="default"&&profile?TOP_H+62:TOP_H,paddingBottom:TAB_H+10,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>

        {/* ════ BUDGET TAB ════ */}
        {tab==="budget" && (
          <div>
            {/* Ready to Assign — sleek header */}
            <div style={{padding:"16px 18px 14px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                <div>
                  <div style={{fontSize:8,color:C.muted,fontFamily:F.mono,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:5}}>Unassigned · {fmtMonthLabel(NOW_MONTH)}</div>
                  <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                    <div style={{fontSize:28,fontWeight:800,fontFamily:F.mono,letterSpacing:"-0.03em",color:readyToAssign<0?C.red:readyToAssign===0?C.accent:C.text,lineHeight:1}}>{fmt(readyToAssign)}</div>
                    <div style={{fontSize:10,color:C.muted,fontFamily:F.sans,paddingBottom:2}}>
                      {readyToAssign===0?"every dollar assigned ✓":readyToAssign>0?"to assign":readyToAssign<0?"over-assigned":""}
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {/* Income / Assigned micro stats */}
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:8,color:C.muted,fontFamily:F.mono,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>Income</div>
                    <div style={{fontSize:12,fontFamily:F.mono,color:C.textDim,fontWeight:600}}>{fmt(totalIncome)}</div>
                  </div>
                  <div style={{width:1,height:24,background:C.border}}/>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:8,color:C.muted,fontFamily:F.mono,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>Budgeted</div>
                    <div style={{fontSize:12,fontFamily:F.mono,color:C.textDim,fontWeight:600}}>{fmt(totalAssigned)}</div>
                  </div>
                  <button onClick={()=>setShowCalibrate(true)} style={{fontSize:10,color:C.accent,fontWeight:700,fontFamily:F.mono,background:`${C.accent}12`,border:`1px solid ${C.accent}25`,borderRadius:6,padding:"5px 9px",cursor:"pointer",letterSpacing:"0.06em",textTransform:"uppercase"}}>⚡</button>
                </div>
              </div>

              {/* Allocation bar — ultra thin, shows how much of income is assigned */}
              {totalIncome > 0 && (
                <div style={{marginTop:10,height:1,background:C.border,borderRadius:1,overflow:"visible",position:"relative"}}>
                  <div style={{height:1,background:readyToAssign<0?C.red:C.accent,width:`${Math.min(100,Math.round(totalAssigned/totalIncome*100))}%`,transition:"width 0.6s ease"}}/>
                  {/* Marker at 100% */}
                  <div style={{position:"absolute",right:0,top:-3,width:1,height:7,background:`${C.border}`,borderRadius:1}}/>
                </div>
              )}
            </div>

            {/* Missing income prompt — if past day 10 and no income logged */}
            {(()=>{
              const dayOfMonth = new Date().getDate();
              const hasIncome  = thisTx.some(t=>t.type==="income");
              if (dayOfMonth < 10 || hasIncome) return null;
              return (
                <div style={{margin:"10px 14px 0",display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:`${C.accent}08`,border:`1px solid ${C.accent}25`,borderRadius:14,cursor:"pointer"}} onClick={()=>setShowCashIncome(true)}>
                  <span style={{fontSize:22,flexShrink:0}}>💵</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.text}}>Got paid in cash this month?</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>No income recorded yet — log it so your numbers are accurate.</div>
                  </div>
                  <span style={{fontSize:12,color:C.accent,fontWeight:700,fontFamily:F.mono,flexShrink:0}}>Log →</span>
                </div>
              );
            })()}
            {(()=>{
              const RF_CATS = ["🚩 Tobacco","🚩 Cash","🚩 Fees","🚩 Gambling"];
              const RF_INFO = {
                "🚩 Tobacco":  {icon:"🚬", label:"Tobacco",  color:"#c084fc", gradient:"135deg,#c084fc18,#c084fc05"},
                "🚩 Cash":     {icon:"💵", label:"Cash",     color:"#64748b", gradient:"135deg,#64748b18,#64748b05"},
                "🚩 Fees":     {icon:"🏦", label:"Fees",     color:"#ef4444", gradient:"135deg,#ef444418,#ef444405"},
                "🚩 Gambling": {icon:"🎲", label:"Gambling", color:"#f97316", gradient:"135deg,#f9731618,#f9731605"},
              };

              const spendByCat = {};
              RF_CATS.forEach(cat => {
                spendByCat[cat] = thisTx.filter(t=>t.category===cat&&t.type==="expense").reduce((s,t)=>s+Math.abs(t.amount),0);
              });
              const trend3Mo = (cat) => [minus2Tx,lastTx,thisTx].map(m=>
                m.filter(t=>t.category===cat&&t.type==="expense").reduce((s,t)=>s+Math.abs(t.amount),0)
              );

              const activeCats = RF_CATS.filter(cat=>spendByCat[cat]>0||trend3Mo(cat).some(v=>v>0));
              if (!activeCats.length) return null;

              const saveTarget = (cat, val) => {
                const next = {...rfTargets,[cat]:Math.max(0,parseFloat(val)||0)};
                setRfTargets(next);
                try { localStorage.setItem("pursuivo_rf_targets",JSON.stringify(next)); } catch {}
                setRfEditingCat(null);
              };
              const toggleCommit = (cat) => {
                const next = {...rfCommits,[cat]:!rfCommits[cat]};
                setRfCommits(next);
                try { localStorage.setItem("pursuivo_rf_commits",JSON.stringify(next)); } catch {}
              };

              const totalRFSpend  = activeCats.reduce((s,c)=>s+spendByCat[c],0);
              const totalRFAnnual = Math.round(totalRFSpend*12);

              // SVG sparkline — smooth bezier curve
              const Spark = ({values, color, width=80, height=28}) => {
                if (values.every(v=>v===0)) return (
                  <svg width={width} height={height}>
                    <line x1={0} y1={height*0.7} x2={width} y2={height*0.7} stroke={`${color}30`} strokeWidth={1} strokeDasharray="3 3"/>
                    <text x={width/2} y={height*0.7+8} textAnchor="middle" fontSize={7} fill={color} opacity={0.4}>no activity</text>
                  </svg>
                );
                const max = Math.max(...values,1);
                const pts = values.map((v,i)=>({
                  x: (i/(values.length-1))*(width-4)+2,
                  y: height-4-(v/max)*(height-8)
                }));
                // Smooth bezier path
                let d = `M ${pts[0].x} ${pts[0].y}`;
                for (let i=1; i<pts.length; i++) {
                  const cp1x = pts[i-1].x+(pts[i].x-pts[i-1].x)*0.5;
                  const cp2x = pts[i-1].x+(pts[i].x-pts[i-1].x)*0.5;
                  d += ` C ${cp1x} ${pts[i-1].y} ${cp2x} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
                }
                const fillD = `${d} L ${pts[pts.length-1].x} ${height} L ${pts[0].x} ${height} Z`;
                const trending = values[values.length-1] > values[0]*1.1 ? "up"
                               : values[values.length-1] < values[0]*0.9 ? "down" : "flat";
                const lineColor = trending==="down" ? "#22c55e" : trending==="up" ? "#ef4444" : color;
                return (
                  <svg width={width} height={height} style={{overflow:"visible"}}>
                    <defs>
                      <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={lineColor} stopOpacity="0.2"/>
                        <stop offset="100%" stopColor={lineColor} stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d={fillD} fill={`url(#sg-${color.replace("#","")})`}/>
                    <path d={d} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    {pts.map((p,i)=>(
                      <circle key={i} cx={p.x} cy={p.y} r={i===pts.length-1?2.5:1.5}
                        fill={i===pts.length-1?lineColor:`${lineColor}60`}/>
                    ))}
                  </svg>
                );
              };

              // Arc progress — thin, elegant
              const Arc = ({pct, color, size=52}) => {
                const r=20, cx=size/2, cy=size/2;
                const circ=2*Math.PI*r;
                const clamp=Math.min(pct,1);
                const arcColor = pct>1?"#ef4444":pct>=0.8?"#f59e0b":pct>0?"#22c55e90":color;
                return (
                  <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${color}15`} strokeWidth={3}/>
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={arcColor} strokeWidth={3}
                      strokeLinecap="round" strokeDasharray={`${clamp*circ} ${circ}`}
                      style={{transition:"stroke-dasharray 0.7s cubic-bezier(.4,0,.2,1)"}}/>
                  </svg>
                );
              };

              return (
                <div style={{padding:"16px 16px 4px"}}>

                  {/* Section header */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14}}>
                    <div>
                      <div style={{fontSize:10,color:C.muted,fontFamily:F.mono,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:4}}>Red Flag Spending</div>
                      <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                        <span style={{fontSize:22,fontWeight:800,fontFamily:F.mono,color:C.red,letterSpacing:"-0.02em"}}>{fmt(totalRFSpend)}</span>
                        <span style={{fontSize:10,color:C.muted,fontFamily:F.sans}}>this month · {fmt(totalRFAnnual)}/yr</span>
                      </div>
                    </div>
                    <button onClick={()=>setShowRedFlags(true)}
                      style={{fontSize:10,color:C.accent,fontWeight:700,fontFamily:F.mono,letterSpacing:"0.08em",textTransform:"uppercase",background:"none",border:"none",cursor:"pointer",padding:0}}>
                      Full history →
                    </button>
                  </div>

                  {/* Full-width stacked cards */}
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {activeCats.map(cat => {
                      const info      = RF_INFO[cat];
                      const spent     = spendByCat[cat];
                      const target    = rfTargets[cat]!==undefined ? rfTargets[cat] : 0;
                      const committed = !!rfCommits[cat];
                      const pct       = target>0 ? spent/target : 0;
                      const isOver    = target>0 && spent>target;
                      const isClean   = spent===0;
                      const t3        = trend3Mo(cat);
                      const isEditing = rfEditingCat===cat;
                      const annual    = Math.round(spent*12);
                      const moLabels  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                      const t3Labels  = [minus2Tx,lastTx,thisTx].map((_,i)=>
                        moLabels[+[MONTH_MINUS2,LAST_MONTH,NOW_MONTH][i].split("-")[1]-1]
                      );
                      const trending  = t3[2]>t3[0]*1.1?"up":t3[2]<t3[0]*0.9?"down":"flat";

                      return (
                        <div key={cat} style={{
                          background:`linear-gradient(${info.gradient})`,
                          border:"1px solid "+(committed?info.color+"60":isOver?C.red+"40":info.color+"20"),
                          borderRadius:18,overflow:"hidden",
                          boxShadow:committed?`0 4px 24px ${info.color}18`:"none",
                          transition:"box-shadow 0.3s",
                        }}>
                          {/* Committed bar */}
                          {committed&&<div style={{height:2,background:`linear-gradient(90deg,${info.color},${info.color}50)`,transition:"opacity 0.3s"}}/>}

                          <div style={{padding:"16px 16px 14px"}}>
                            {/* Main row */}
                            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>

                              {/* Arc + icon */}
                              <div style={{position:"relative",flexShrink:0}}>
                                <Arc pct={pct} color={info.color} size={52}/>
                                <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                                  <span style={{fontSize:isClean?16:14}}>{isClean?"✓":info.icon}</span>
                                </div>
                              </div>

                              {/* Label + amount */}
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:2}}>
                                  <div style={{fontSize:12,fontWeight:700,color:committed?info.color:C.text,letterSpacing:"0.01em"}}>{info.label}</div>
                                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                                    {trending!=="flat"&&!isClean&&(
                                      <span style={{fontSize:10,fontWeight:700,color:trending==="down"?"#22c55e":"#ef4444",fontFamily:F.mono}}>
                                        {trending==="down"?"↓ improving":"↑ worse"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                                  <span style={{fontSize:22,fontWeight:800,fontFamily:F.mono,letterSpacing:"-0.03em",color:isClean?"#22c55e":isOver?C.red:C.text,lineHeight:1}}>
                                    {isClean?"$0":fmt(spent)}
                                  </span>
                                  {target>0&&(
                                    <span style={{fontSize:10,color:C.muted,fontFamily:F.mono}}>/ {fmt(target)}</span>
                                  )}
                                </div>
                                {annual>0&&(
                                  <div style={{fontSize:10,color:C.muted,marginTop:2,fontFamily:F.sans}}>
                                    {fmt(annual)}/year at this rate
                                  </div>
                                )}
                              </div>

                              {/* Sparkline */}
                              <div style={{flexShrink:0}}>
                                <Spark values={t3} color={info.color} width={72} height={30}/>
                                <div style={{display:"flex",justifyContent:"space-between",marginTop:3,width:72}}>
                                  {t3Labels.map((l,i)=>(
                                    <span key={i} style={{fontSize:8,color:i===2?info.color:C.muted,fontFamily:F.mono,fontWeight:i===2?700:400}}>{l}</span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Target + commit row */}
                            {isEditing ? (
                              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                                <div style={{flex:1,position:"relative"}}>
                                  <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.muted,fontFamily:F.mono,fontSize:12}}>$</span>
                                  <input autoFocus type="number" value={rfEditVal}
                                    onChange={e=>setRfEditVal(e.target.value)}
                                    onKeyDown={e=>{if(e.key==="Enter")saveTarget(cat,rfEditVal);if(e.key==="Escape")setRfEditingCat(null);}}
                                    placeholder="Set your target"
                                    style={{width:"100%",paddingLeft:22,paddingRight:10,paddingTop:9,paddingBottom:9,background:C.bg,border:`1.5px solid ${info.color}60`,borderRadius:10,color:C.text,fontSize:13,fontFamily:F.mono,outline:"none"}}/>
                                </div>
                                <button onClick={()=>saveTarget(cat,rfEditVal)}
                                  style={{padding:"9px 14px",background:info.color,border:"none",borderRadius:10,color:C.bg,fontSize:12,fontWeight:800,cursor:"pointer"}}>Set</button>
                                <button onClick={()=>setRfEditingCat(null)}
                                  style={{padding:"9px 10px",background:"none",border:`1px solid ${C.border}`,borderRadius:10,color:C.muted,fontSize:10,cursor:"pointer"}}>✕</button>
                              </div>
                            ) : (
                              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                                <button onClick={()=>{setRfEditingCat(cat);setRfEditVal(target>0?String(target):"");}}
                                  style={{flex:1,padding:"9px 12px",background:`${info.color}12`,border:`1px solid ${info.color}25`,borderRadius:10,color:info.color,fontSize:10,fontWeight:700,fontFamily:F.sans,cursor:"pointer",textAlign:"center",letterSpacing:"0.03em"}}>
                                  {target>0?`Target: ${fmt(target)} — edit`:"Set a reduction target"}
                                </button>
                                <button onClick={()=>toggleCommit(cat)}
                                  style={{padding:"9px 12px",background:committed?`${info.color}20`:C.surface,border:`1.5px solid ${committed?info.color:C.border}`,borderRadius:10,color:committed?info.color:C.muted,fontSize:10,fontWeight:700,cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap"}}>
                                  {committed?"🎯 On it":"Commit"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            {/* Budget header */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 72px 72px 72px",padding:"8px 18px 6px",borderBottom:`1px solid ${C.border}18`}}>
              {["Category","Assigned","Spent","Left"].map((h,i) => (
                <div key={h} style={{fontSize:8,color:C.muted,fontFamily:F.mono,letterSpacing:"0.12em",textTransform:"uppercase",textAlign:i>0?"right":"left",fontWeight:500}}>{h}</div>
              ))}
            </div>
            {/* Groups */}
            {GROUPS.map(g => {
              const gt = groupTotals[g.id];
              const isCollapsed = collapsed[g.id];
              const groupPct = gt.assigned>0 ? Math.min(100,Math.round(gt.spent/gt.assigned*100)) : 0;
              const groupStatus = gt.available<0?"overspent":gt.spent===0?"empty":"active";
              return (
                <div key={g.id}>
                  {/* Group header — clean, minimal */}
                  <button onClick={()=>toggleGroup(g.id)} style={{width:"100%",display:"grid",gridTemplateColumns:"1fr 72px 72px 72px",padding:"11px 18px 10px",background:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,cursor:"pointer",textAlign:"left"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <span style={{fontSize:10,color:C.muted,lineHeight:1,transform:isCollapsed?"rotate(-90deg)":"rotate(0deg)",transition:"transform 0.2s",display:"inline-block"}}>▾</span>
                      <span style={{fontSize:10,fontWeight:700,fontFamily:F.sans,color:C.textDim,letterSpacing:"0.04em",textTransform:"uppercase"}}>{g.label}</span>
                    </div>
                    <div style={{textAlign:"right",fontSize:10,fontFamily:F.mono,color:C.muted}}>{fmt(gt.assigned)}</div>
                    <div style={{textAlign:"right",fontSize:10,fontFamily:F.mono,color:C.muted}}>{fmt(gt.spent)}</div>
                    <div style={{textAlign:"right",fontSize:10,fontFamily:F.mono,color:gt.available<0?C.red:C.muted,fontWeight:gt.available<0?700:400}}>{fmt(gt.available)}</div>
                  </button>

                  {!isCollapsed && g.cats.map((cat,catIdx) => {
                    const sp  = spentByCat[cat.id]||0;
                    const asg = assigned[cat.id]||0;
                    const st  = catStatus(asg, cat.target, sp);
                    const pct = asg>0 ? Math.min(1, sp/asg) : sp>0 ? 1 : 0;
                    const left = asg - sp;
                    const col = STATUS_COLOR[st];
                    const isLast = catIdx === g.cats.length - 1;
                    return (
                      <button key={cat.id} onClick={()=>setActiveCat(cat.id)}
                        style={{width:"100%",display:"grid",gridTemplateColumns:"1fr 72px 72px 72px",padding:"12px 18px 10px",background:"transparent",border:"none",borderBottom:isLast?`1px solid ${C.border}`:`1px solid ${C.border}18`,cursor:"pointer",textAlign:"left",position:"relative"}}>

                        {/* Left accent line — only when overspent or funded */}
                        {st==="overspent"&&<div style={{position:"absolute",left:0,top:"20%",bottom:"20%",width:2,background:C.red,borderRadius:1}}/>}
                        {st==="funded"&&<div style={{position:"absolute",left:0,top:"20%",bottom:"20%",width:2,background:C.accent,borderRadius:1,opacity:0.5}}/>}

                        <div style={{display:"flex",flexDirection:"column",gap:5,minWidth:0}}>
                          <div style={{fontSize:13,fontFamily:F.sans,color:st==="overspent"?C.red:C.text,fontWeight:500}}>{cat.label}</div>
                          {/* Thin hairline progress — just 1px */}
                          <div style={{height:1,background:C.border,borderRadius:1,overflow:"hidden",width:"90%"}}>
                            <div style={{height:1,background:col,width:`${pct*100}%`,transition:"width 0.5s ease",opacity: pct>0?1:0}}/>
                          </div>
                        </div>

                        <div style={{textAlign:"right",fontSize:12,fontFamily:F.mono,color:C.muted,alignSelf:"center"}}>{asg>0?fmt(asg):"—"}</div>
                        <div style={{textAlign:"right",fontSize:12,fontFamily:F.mono,color:sp>0?C.textDim:C.muted,alignSelf:"center"}}>{sp>0?fmt(sp):"—"}</div>
                        <div style={{textAlign:"right",alignSelf:"center"}}>
                          {asg===0&&sp===0
                            ? <span style={{fontSize:10,color:C.muted,fontFamily:F.mono}}>—</span>
                            : <span style={{fontSize:12,fontFamily:F.mono,fontWeight:st==="overspent"?700:400,color:col}}>{fmt(left)}</span>
                          }
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
            <div style={{height:20}} />
          </div>
        )}

        {/* ════ LEDGER TAB ════ */}
        {tab==="ledger" && (
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            <div style={{padding:"14px 14px 0",display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",gap:8}}>
                <div style={{position:"relative",flex:1}}>
                  <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:13,pointerEvents:"none"}}>⌕</span>
                  <input placeholder="Search transactions…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:"100%",paddingLeft:36,paddingRight:search?36:14,paddingTop:13,paddingBottom:13,background:C.surface,border:`1.5px solid ${search?C.accent:C.border}`,borderRadius:14,color:C.text,fontSize:13,fontFamily:F.sans,fontWeight:500}} />
                  {search && <button onClick={()=>setSearch("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,fontSize:14,cursor:"pointer",lineHeight:1,padding:0}}>×</button>}
                </div>
                <button onClick={()=>setShowCashIncome(true)} style={{background:C.accentDim,border:`1.5px solid ${C.accent}40`,borderRadius:14,padding:"13px 14px",fontSize:12,fontWeight:800,color:C.accent,cursor:"pointer",flexShrink:0,fontFamily:F.sans,letterSpacing:"-0.01em",whiteSpace:"nowrap"}}>+ Cash</button>
                <button onClick={()=>setTxSheet("new")} style={{background:C.accent,border:"none",borderRadius:14,padding:"13px 16px",fontSize:18,fontWeight:700,color:C.bg,cursor:"pointer",flexShrink:0,boxShadow:`0 4px 14px ${C.accent}35`,lineHeight:1}}>+</button>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <div style={{display:"flex",gap:6}}>
                  {[
                    {id:"m0", label:"This month"},
                    {id:"m1", label:"Last month"},
                    {id:"all", label:"All"},
                  ].map(f => (
                    <button key={f.id} onClick={()=>setTxFilter(f.id)}
                      style={{padding:"7px 14px",borderRadius:10,border:`1.5px solid ${txFilter===f.id?C.accent:C.border}`,background:txFilter===f.id?C.accentDim:C.surface,color:txFilter===f.id?C.accent:C.muted,fontSize:10,fontFamily:F.sans,fontWeight:700,cursor:"pointer"}}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:10,color:C.muted,fontFamily:F.mono}}>{ledgerTx.length} tx</span>
                  <button onClick={()=>setSort(s=>s==="desc"?"asc":"desc")} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.muted,fontSize:10,fontFamily:F.sans,fontWeight:700,cursor:"pointer"}}>{sort==="desc"?"↓":"↑"} {sort==="desc"?"Newest":"Oldest"}</button>
                </div>
              </div>
              {search && (
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:`${C.blue}12`,border:`1px solid ${C.blue}25`,borderRadius:10}}>
                  <span style={{fontSize:10,color:C.textDim}}>{ledgerTx.length} result{ledgerTx.length!==1?"s":""} for <strong style={{color:C.text}}>"{search}"</strong></span>
                  <button onClick={()=>setSearch("")} style={{fontSize:10,color:C.accent,fontWeight:700,background:"none",border:"none",cursor:"pointer",padding:0}}>Clear</button>
                </div>
              )}
            </div>
            <div style={{height:1,background:C.border,margin:"14px 0 0"}} />
            {/* Showing label */}
            <div style={{padding:"8px 14px 4px"}}>
              <span style={{fontSize:10,color:C.muted,fontFamily:F.mono,letterSpacing:"0.06em",textTransform:"uppercase"}}>
                Showing · {txFilter==="m0"?fmtMonthLabel(NOW_MONTH):txFilter==="m1"?fmtMonthLabel(LAST_MONTH):txFilter==="m2"?fmtMonthLabel(MONTH_MINUS2):"All Time"}
              </span>
            </div>
            {/* Unclear banner */}
            {unclearTx.length>0 && (
              <div style={{margin:"0 14px 8px"}}>
                <div style={{background:"#94a3b814",border:"1px solid #94a3b830",borderRadius:12,padding:"14px 16px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{fontSize:13,fontWeight:700,fontFamily:F.sans,color:C.text}}>❓ {unclearTx.length} transaction{unclearTx.length!==1?"s need":" needs"} a category</div>
                    <span style={{fontSize:10,color:"#94a3b8",fontFamily:F.mono}}>{fmt(unclearTx.reduce((s,t)=>s+Math.abs(t.amount),0))}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {unclearTx.slice(0,3).map(t => (
                      <button key={t.id} onClick={()=>setClarifyTx(t)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:"#0e121988",border:"1px solid #1e263680",borderRadius:9,cursor:"pointer",textAlign:"left"}}>
                        <div><div style={{fontSize:13,fontWeight:600,color:C.text}}>{t.description}</div><div style={{fontSize:10,color:"#475569",fontFamily:F.mono,marginTop:2}}>{t.date}</div></div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:13,fontWeight:700,fontFamily:F.mono,color:"#f43f5e"}}>-{fmtFull(Math.abs(t.amount))}</span>
                          <span style={{fontSize:10,color:"#94a3b8",background:"#94a3b815",border:"1px solid #94a3b830",padding:"3px 8px",borderRadius:6,fontWeight:600}}>Categorize →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* Transaction list */}
            <div style={{padding:"0 14px 14px",display:"flex",flexDirection:"column",gap:10}}>
              {ledgerTx.length===0 ? (
                <EmptyState icon="📝" title="No transactions yet" body="Tap + to add one manually or upload a bank statement." action="Add Transaction" onAction={()=>setTxSheet("new")} />
              ) : groupedLedger.map(([date,txs]) => (
                <div key={date}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 2px 6px"}}>
                    <div style={{fontSize:10,color:C.muted,fontFamily:F.mono,letterSpacing:"0.08em",textTransform:"uppercase"}}>{fmtDate(date)}</div>
                    <div style={{fontSize:10,color:C.muted,fontFamily:F.mono}}>{fmtFull(txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0))}</div>
                  </div>
                  <Card style={{overflow:"hidden"}}>
                    {txs.map((t,i) => (
                      <button key={t.id} onClick={()=>setTxSheet(t)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 15px",borderBottom:i<txs.length-1?`1px solid ${C.border}18`:undefined,background:"transparent",border:"none",width:"100%",cursor:"pointer",textAlign:"left"}}>
                        <div style={{display:"flex",alignItems:"center",gap:11,minWidth:0}}>
                          <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:`${CAT_TX_COLOR[t.category]||C.muted}16`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <div style={{width:9,height:9,borderRadius:"50%",background:CAT_TX_COLOR[t.category]||C.muted}} />
                          </div>
                          <div style={{minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,fontFamily:F.sans,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:170}}>{t.description}</div>
                            <span style={{fontSize:10,fontWeight:700,fontFamily:F.sans,letterSpacing:"0.06em",textTransform:"uppercase",color:CAT_TX_COLOR[t.category]||C.muted,background:`${CAT_TX_COLOR[t.category]||C.muted}14`,padding:"2px 7px",borderRadius:4}}>{t.category}</span>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0,marginLeft:10}}>
                          <div style={{fontSize:14,fontWeight:600,fontFamily:F.mono,color:t.amount>=0?C.accent:C.red}}>{t.amount>=0?"+":""}{fmtFull(t.amount)}</div>
                          <span style={{fontSize:14,color:C.muted}}>›</span>
                        </div>
                      </button>
                    ))}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ════ INSIGHTS TAB ════ */}
        {tab==="insights" && (
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            <div style={{padding:"14px 14px 0",display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",gap:6}}>
                {[{id:"m0",month:NOW_MONTH},{id:"m1",month:LAST_MONTH},{id:"m2",month:MONTH_MINUS2}].map(f => {
                  const label = MONTHS_SHORT[+f.month.split("-")[1]-1];
                  const active = insightMonth===f.id&&!insightCat;
                  return <button key={f.id} onClick={()=>{setInsightMonth(f.id);setInsightCat(null);}} style={{padding:"8px 18px",borderRadius:10,border:`1.5px solid ${active?C.accent:C.border}`,background:active?C.accentDim:C.surface,color:active?C.accent:C.muted,fontSize:13,fontFamily:F.sans,fontWeight:700,cursor:"pointer"}}>{label}</button>;
                })}
              </div>
              <div style={{height:1,background:C.border}} />
            </div>
            <div style={{padding:"12px 14px 14px",display:"flex",flexDirection:"column",gap:12}}>
              {tx.length===0 ? (
                <Card><EmptyState icon="📊" title="No data yet" body="Upload a statement or connect your bank to see insights." action="Upload" onAction={()=>setShowUpload(true)} /></Card>
              ) : (() => {
                const selTx    = insightMonth==="m0"?thisTx:insightMonth==="m1"?lastTx:minus2Tx;
                const selMonth = insightMonth==="m0"?NOW_MONTH:insightMonth==="m1"?LAST_MONTH:MONTH_MINUS2;
                const prevMonth= insightMonth==="m0"?LAST_MONTH:insightMonth==="m1"?MONTH_MINUS2:null;
                const prevTx   = insightMonth==="m0"?lastTx:insightMonth==="m1"?minus2Tx:[];
                const pieMap   = {};
                selTx.filter(t=>t.type==="expense").forEach(t => { pieMap[t.category]=(pieMap[t.category]||0)+Math.abs(t.amount); });
                const pieData  = Object.entries(pieMap).map(([name,value])=>({name,value:Math.round(value*100)/100})).sort((a,b)=>b.value-a.value);
                const catMap   = {};
                selTx.filter(t=>t.type==="expense").forEach(t => { if(!catMap[t.category]) catMap[t.category]={total:0,count:0}; catMap[t.category].total+=Math.abs(t.amount); catMap[t.category].count+=1; });
                const cats     = Object.entries(catMap).sort((a,b)=>b[1].total-a[1].total);
                const grandTotal = cats.reduce((s,[,v])=>s+v.total, 0);

                if (insightCat) {
                  const catTx     = selTx.filter(t=>t.type==="expense"&&t.category===insightCat);
                  const total     = catTx.reduce((s,t)=>s+Math.abs(t.amount),0);
                  const avg       = catTx.length?total/catTx.length:0;
                  const color     = PIE_COLOR_MAP[insightCat]||C.muted;
                  const prevCatTx = prevTx.filter(t=>t.type==="expense"&&t.category===insightCat);
                  const prevTotal = prevCatTx.reduce((s,t)=>s+Math.abs(t.amount),0);
                  const delta     = prevTotal>0?Math.round((total-prevTotal)/prevTotal*100):null;
                  const merchants = {};
                  catTx.forEach(t=>{ merchants[t.description]=(merchants[t.description]||0)+Math.abs(t.amount); });
                  const topMerchants = Object.entries(merchants).sort((a,b)=>b[1]-a[1]);
                  return (
                    <div style={{display:"flex",flexDirection:"column",gap:12}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <button onClick={()=>setInsightCat(null)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"7px 12px",fontSize:12,color:C.muted,fontFamily:F.sans,fontWeight:700,cursor:"pointer"}}>← Back</button>
                        <div><div style={{fontSize:14,fontWeight:800,fontFamily:F.sans,color:C.text}}>{insightCat}</div><div style={{fontSize:10,color:C.muted,fontFamily:F.mono}}>{fmtMonthLabel(selMonth)}</div></div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                        {[{label:"Total",value:fmt(total),color},{label:"# Txns",value:catTx.length,color:C.blue},{label:"Avg",value:fmt(avg),color:C.gold}].map(s => (
                          <Card key={s.label} style={{padding:"14px 10px",textAlign:"center"}}>
                            <div style={{fontSize:10,color:C.muted,fontFamily:F.sans,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{s.label}</div>
                            <div style={{fontSize:14,fontWeight:700,fontFamily:F.mono,color:s.color}}>{s.value}</div>
                          </Card>
                        ))}
                      </div>
                      {delta!==null&&prevMonth&&(
                        <Card style={{padding:"14px 16px",background:delta>0?C.overspentBg:C.fundedBg,border:`1px solid ${delta>0?C.overspent:C.funded}30`}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div><div style={{fontSize:10,color:C.muted,marginBottom:3}}>vs {fmtMonthLabel(prevMonth)}</div><div style={{fontSize:13,color:delta>0?C.red:C.accent,fontFamily:F.mono,fontWeight:700}}>{delta>0?"▲":"▼"} {Math.abs(delta)}% {delta>0?"more":"less"}</div></div>
                            <div style={{textAlign:"right"}}><div style={{fontSize:10,color:C.muted,fontFamily:F.mono}}>{fmtMonthLabel(prevMonth)}</div><div style={{fontSize:14,color:C.textDim,fontFamily:F.mono,fontWeight:600}}>{fmt(prevTotal)}</div></div>
                          </div>
                        </Card>
                      )}
                      {topMerchants.length>0&&(
                        <Card style={{overflow:"hidden"}}>
                          <div style={{padding:"14px 14px 10px"}}><Label style={{marginBottom:0}}>Top Merchants</Label></div>
                          {topMerchants.map(([name,amt])=>{ const pct=total>0?Math.round(amt/total*100):0; return (
                            <div key={name} style={{padding:"12px 14px",borderTop:`1px solid ${C.border}`}}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,fontWeight:600,color:C.text}}>{name}</span><span style={{fontSize:13,fontFamily:F.mono,color,fontWeight:700}}>{fmtFull(amt)}</span></div>
                              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:4,background:C.border,borderRadius:2,overflow:"hidden"}}><div style={{height:4,borderRadius:2,background:color,width:`${pct}%`,boxShadow:`0 0 6px ${color}50`}} /></div><span style={{fontSize:10,color:C.muted,fontFamily:F.mono,flexShrink:0}}>{pct}%</span></div>
                            </div>
                          );})}
                        </Card>
                      )}
                      <Card style={{overflow:"hidden"}}>
                        <div style={{padding:"14px 14px 10px"}}><Label style={{marginBottom:0}}>All Transactions · {fmtMonthLabel(selMonth)}</Label></div>
                        {catTx.length===0?<div style={{padding:"24px",textAlign:"center",color:C.muted,fontSize:12,fontFamily:F.mono}}>No transactions</div>:[...catTx].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>(
                          <div key={t.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 14px",borderTop:`1px solid ${C.border}`}}>
                            <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                              <div style={{width:36,height:36,borderRadius:10,background:`${color}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><div style={{width:9,height:9,borderRadius:"50%",background:color}} /></div>
                              <div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:180}}>{t.description}</div><div style={{fontSize:10,color:C.muted,fontFamily:F.mono,marginTop:2}}>{fmtDate(t.date)}</div></div>
                            </div>
                            <div style={{fontSize:14,fontWeight:700,fontFamily:F.mono,color,flexShrink:0,marginLeft:10}}>-{fmtFull(Math.abs(t.amount))}</div>
                          </div>
                        ))}
                        <div style={{padding:"10px 14px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between"}}>
                          <span style={{fontSize:10,color:C.muted,fontFamily:F.mono}}>{catTx.length} transaction{catTx.length!==1?"s":""}</span>
                          <span style={{fontSize:10,fontFamily:F.mono,color,fontWeight:700}}>{fmt(total)} total</span>
                        </div>
                      </Card>
                    </div>
                  );
                }
                return (
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"2px 0"}}>
                      <div style={{fontSize:14,fontWeight:800,fontFamily:F.sans,color:C.text}}>{fmtMonthLabel(selMonth)}</div>
                      <div style={{fontSize:13,fontFamily:F.mono,color:C.accent,fontWeight:700}}>{fmt(grandTotal)} spent</div>
                    </div>

                    {pieData.length>0&&(
                      <Card style={{padding:"16px"}}>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" strokeWidth={0} onClick={d=>setInsightCat(d.name)}
                              label={({name,percent})=>percent>0.06?`${Math.round(percent*100)}%`:""} labelLine={false} style={{fontSize:10,fontFamily:F.mono,fontWeight:700,fill:C.bg}}>
                              {pieData.map((d,i)=><Cell key={i} fill={PIE_COLOR_MAP[d.name]||C.muted} style={{cursor:"pointer"}} />)}
                            </Pie>
                            <Tooltip content={<ChartTip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{textAlign:"center",fontSize:10,color:C.muted,marginTop:4}}>Tap a slice or row to drill in</div>
                      </Card>
                    )}
                    {cats.length===0?<Card><EmptyState icon="📭" title="No expenses" body={`No spending recorded for ${fmtMonthLabel(selMonth)}.`} /></Card>:(
                      <Card style={{overflow:"hidden"}}>
                        {cats.map(([name,data],i)=>{
                          const color=PIE_COLOR_MAP[name]||CAT_TX_COLOR[name]||C.muted;
                          const pct=grandTotal>0?Math.round(data.total/grandTotal*100):0;
                          const isRed=name.startsWith("🚩");
                          return (
                            <button key={name} onClick={()=>setInsightCat(name)} style={{display:"flex",alignItems:"center",width:"100%",padding:"14px 14px",borderTop:i>0?`1px solid ${C.border}`:"none",background:isRed?`${C.red}08`:"transparent",border:"none",cursor:"pointer",textAlign:"left",gap:12}}>
                              <div style={{width:10,height:10,borderRadius:"50%",background:color,flexShrink:0}} />
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,fontWeight:600,color:isRed?C.red:C.text}}>{name}</span><span style={{fontSize:13,fontFamily:F.mono,fontWeight:700,color,marginLeft:8,flexShrink:0}}>{fmt(data.total)}</span></div>
                                <div style={{height:4,background:C.border,borderRadius:2,overflow:"hidden"}}><div style={{height:4,borderRadius:2,background:color,width:`${pct}%`,boxShadow:`0 0 6px ${color}40`}} /></div>
                                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{fontSize:10,color:C.muted,fontFamily:F.mono}}>{data.count} transaction{data.count!==1?"s":""}</span><span style={{fontSize:10,color:C.muted,fontFamily:F.mono}}>{pct}% of spending</span></div>
                              </div>
                              <span style={{fontSize:14,color:C.muted,flexShrink:0}}>›</span>
                            </button>
                          );
                        })}
                      </Card>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        {/* ════ OVERVIEW TAB ════ */}
        {tab==="overview" && (()=>{
          const saved       = totalIncome - totalSpent;
          const savedLast   = lastTx.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0)-Math.abs(lastTx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0));
          const lastSpent   = Math.abs(lastTx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0));
          const spendDelta  = lastSpent>0?Math.round((totalSpent-lastSpent)/lastSpent*100):null;
          const catSpend    = {};
          thisTx.filter(t=>t.type==="expense").forEach(t=>{ catSpend[t.category]=(catSpend[t.category]||0)+Math.abs(t.amount); });
          const topCat      = Object.entries(catSpend).sort((a,b)=>b[1]-a[1])[0];
          const topCatPct   = topCat&&totalSpent>0?Math.round(topCat[1]/totalSpent*100):0;
          const topTx       = [...thisTx].filter(t=>t.type==="expense").sort((a,b)=>Math.abs(b.amount)-Math.abs(a.amount)).slice(0,10);
          const redFlagTx   = thisTx.filter(t=>t.type==="expense"&&t.category.startsWith("🚩"));
          const redFlagTotal= redFlagTx.reduce((s,t)=>s+Math.abs(t.amount),0);
          const allIncome3Mo= [...thisTx,...lastTx,...minus2Tx].filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
          const monthsWithIncome=[thisTx,lastTx,minus2Tx].filter(m=>m.some(t=>t.type==="income")).length||1;
          const avgMonthlyIncome=allIncome3Mo/monthsWithIncome;
          const HOURS_PER_MONTH = 160; // Standard full-time work hours
          const hourlyRate  = Math.max(avgMonthlyIncome,totalIncome)/HOURS_PER_MONTH;

          // ── 3-MONTH PATTERN ENGINE ──────────────────────────────────────────
          // Build per-category totals across all 3 months
          const allMonths   = [minus2Tx, lastTx, thisTx];
          const allMonthNames = [MONTH_MINUS2, LAST_MONTH, NOW_MONTH];
          const catBy3Mo    = {}; // { category: [mo0, mo1, mo2] }
          allMonths.forEach((mTx, mi) => {
            mTx.filter(t=>t.type==="expense").forEach(t => {
              if (!catBy3Mo[t.category]) catBy3Mo[t.category] = [0,0,0];
              catBy3Mo[t.category][mi] += Math.abs(t.amount);
            });
          });

          // Red flags across 3 months
          const rfCats      = ["🚩 Tobacco","🚩 Cash","🚩 Fees","🚩 Gambling"];
          const rfBy3Mo     = allMonths.map(mTx => mTx.filter(t=>rfCats.includes(t.category)).reduce((s,t)=>s+Math.abs(t.amount),0));
          const rfTrend     = rfBy3Mo.filter(v=>v>0).length >= 2 ? (rfBy3Mo[2]-rfBy3Mo[1]) : 0;
          const rfEscalating= rfBy3Mo[0]>0&&rfBy3Mo[1]>rfBy3Mo[0] || rfBy3Mo[1]>0&&rfBy3Mo[2]>rfBy3Mo[1];
          const rfTotal3Mo  = rfBy3Mo.reduce((s,v)=>s+v,0);

          // Recurring categories (present all 3 months)
          const recurring   = Object.entries(catBy3Mo).filter(([,v])=>v.every(x=>x>0));

          // Categories trending up (each month higher than last)
          const trendingUp  = Object.entries(catBy3Mo).filter(([,v])=>v[0]>0&&v[1]>v[0]&&v[2]>v[1]);

          // Categories trending down (good)
          const trendingDown= Object.entries(catBy3Mo).filter(([,v])=>v[0]>0&&v[1]<v[0]&&v[2]<v[1]);

          // Delivery 3-month trajectory
          const delivery3Mo = (catBy3Mo["🚗 Delivery"]||[0,0,0]);
          const deliveryTrend = delivery3Mo[2] > delivery3Mo[1] && delivery3Mo[1] > delivery3Mo[0] ? "up"
                              : delivery3Mo[2] < delivery3Mo[1] && delivery3Mo[1] < delivery3Mo[0] ? "down" : "mixed";

          // Total spent 3-month
          const totalSpent3Mo = allMonths.map(mTx => mTx.filter(t=>t.type==="expense").reduce((s,t)=>s+Math.abs(t.amount),0));

          const insights    = [];

          // 1. DELIVERY
          const deliverySpend = catSpend["🚗 Delivery"]||0;
          if (deliverySpend>0) {
            const deliveryPct   = Math.round(deliverySpend/totalSpent*100);
            const deliveryHours = hourlyRate>0?Math.round(deliverySpend/hourlyRate):0;
            const dreamIsHome   = profile?.rich_life_vision==="home";
            const dreamIsFreedom= profile?.rich_life_vision==="freedom"||profile?.rich_life_vision==="time";
            const blockerSpend  = profile?.real_obstacle==="overspend"||profile?.real_obstacle==="no_system";
            const priorityCut   = profile?.first_win==="stop_bleed"||profile?.first_win==="habit";
            let tip = `Cutting delivery in half saves ${fmt(Math.round(deliverySpend*0.5))}/month — ${fmt(Math.round(deliverySpend*6))} back by year end.`;
            if (dreamIsHome)    tip=`You want to own a home. ${fmt(Math.round(deliverySpend*0.5))}/month saved from cutting delivery = ${fmt(Math.round(deliverySpend*6))} toward a down payment by year end.`;
            if (dreamIsFreedom) tip=`Financial freedom means your money works for you. Cutting delivery in half frees ${fmt(Math.round(deliverySpend*6))} a year to save or invest.`;
            if (blockerSpend)   tip=`You flagged spending as your biggest obstacle. Delivery is where it shows up most. Even cutting 2 orders a week saves ${fmt(Math.round(deliverySpend*0.3))}/month.`;
            if (priorityCut)    tip=`This is your highest-ROI cut right now. Delivery at ${deliveryPct}% of spending is the single biggest lever you can pull this month.`;
            insights.push({type:deliveryPct>20?"bad":"neutral",emoji:"🚗",title:deliveryPct>20?"Delivery is your biggest leak":"Delivery snapshot",body:`You spent ${fmt(deliverySpend)} on delivery — ${deliveryPct}% of all spending. That's ${fmt(deliverySpend*12)}/year${deliveryHours>0?", or roughly "+deliveryHours+" hours of work":""}`,tip});
          }

          // 2. EMERGENCY FUND
          const emergencyCat    = GROUPS.flatMap(g=>g.cats).find(c=>c.id==="emergency");
          const emergencyTarget = emergencyCat?.target||500;
          const emergencyAsg    = assigned["emergency"]||0;
          const monthsToTarget  = emergencyAsg>0?Math.ceil(emergencyTarget/emergencyAsg):null;
          const atEdge          = saved <= 0 || (totalSpent > totalIncome * 0.95 && totalIncome > 0);
          if (emergencyAsg<emergencyTarget) {
            insights.push({type:emergencyAsg===0?"bad":"neutral",emoji:"🛡️",title:emergencyAsg===0?"No emergency fund assigned":"Emergency fund in progress",
              body:emergencyAsg===0?`You have $0 assigned to emergencies. One unexpected expense and everything else breaks.`:`You're putting ${fmt(emergencyAsg)}/month toward emergencies. You'll hit your ${fmt(emergencyTarget)} target in ${monthsToTarget} month${monthsToTarget!==1?"s":""}.`,
              tip:atEdge?`You're at the edge. Even $25/month changes this. The first $500 saved is the most important financial move — it's what keeps one bad week from becoming a crisis.`:`Start with ${fmt(Math.min(50,Math.round(avgMonthlyIncome*0.02)))}/month. It protects every other goal you have.`});
          } else {
            insights.push({type:"good",emoji:"✅",title:"Emergency fund solid",body:`Your safety net is in place. One bad month doesn't become a crisis.`,tip:"Redirect savings above your target toward investing. That money should now be working for you."});
          }

          // 3. SAVINGS RATE
          const savingsRate    = totalIncome>0?Math.round(saved/totalIncome*100):0;
          const dreamBig       = profile?.rich_life_vision==="freedom"||profile?.rich_life_vision==="time";
          const isLowIncMonth  = totalIncome>0&&totalIncome<avgMonthlyIncome*0.6;
          let rateMsg, rateType, displayRate;
          displayRate = savingsRate;
          if (displayRate<0)       {rateMsg=`You're spending ${fmt(Math.abs(saved))} more than you earn. Everything else is secondary until this reverses.`;rateType="bad";}
          else if (displayRate<5)  {rateMsg=`${displayRate}% savings rate. The habit matters more than the amount — even $20 more saved this month changes the pattern.`;rateType="bad";}
          else if (displayRate<15) {rateMsg=`${displayRate}% savings rate. Good start — 15–20% is where wealth accumulates${dreamBig?", and your goal requires getting there":""}.`;rateType="neutral";}
          else if (displayRate<20) {rateMsg=`A ${displayRate}% savings rate puts you well ahead of most people at your income level.`;rateType="good";}
          else                     {rateMsg=`A ${displayRate}% savings rate means you're building wealth significantly faster than average.`;rateType="good";}
          if (totalIncome>0||avgMonthlyIncome>0) insights.push({type:rateType,emoji:displayRate>=15?"💎":displayRate>=5?"📊":"⚠️",title:`${displayRate}% savings rate this month`,body:rateMsg,
            tip:profile?.automation==="manual"||profile?.automation==="some"?`Automate your savings before you can spend it. Set up a ${fmt(Math.round(avgMonthlyIncome*0.01))} auto-transfer on payday.`:`Find one ${fmt(Math.round(avgMonthlyIncome*0.01))}/month cut and redirect it automatically. Sustained 12 months: ${fmt(Math.round(avgMonthlyIncome*0.12))}.`});

          // 4. RED FLAGS
          if (redFlagTotal>0&&hourlyRate>0) {
            const redFlagHours = Math.round(redFlagTotal/hourlyRate);
            const isPattern    = profile?.spending_trigger==="emotional"||profile?.spending_trigger==="impulse"||profile?.spending_trigger==="no_tracking";
            insights.push({type:"bad",emoji:"⏰",title:`${fmt(redFlagTotal)} in flagged spending`,
              body:`Tobacco, cash withdrawals, fees, and gambling cost you ${fmt(redFlagTotal)} this month. At your income that's roughly ${redFlagHours} hours of work.`,
              tip:isPattern?`This pattern has shown up before. These charges are small in the moment — but ${fmt(redFlagTotal*12)}/year is a real number. Name the specific habit driving it and make one change this week.`:`${redFlagHours} hours of your work went to charges you wouldn't consciously choose. That's the test.`});
          }

          // 5. SMALL PURCHASES
          const smallTx    = thisTx.filter(t=>t.type==="expense"&&Math.abs(t.amount)<15);
          const smallTotal = smallTx.reduce((s,t)=>s+Math.abs(t.amount),0);
          const smallCount = smallTx.length;
          if (smallCount>=5) insights.push({type:smallTotal>100?"neutral":"good",emoji:"☕",title:`${smallCount} small purchases · ${fmt(smallTotal)}`,
            body:`${smallCount} transactions under $15 this month — ${fmt(smallTotal)} total. Annualized: ${fmt(smallTotal*12)}.`,
            tip:profile?.spending_trigger==="convenience"?`Check which of these ${smallCount} genuinely saved you time vs. which were just easy in the moment. Cut the automatic ones.`:`Go through these ${smallCount} one by one. Cut the automatic ones — they're leaving quietly.`});

          // 6. INCOME CONCENTRATION
          const incomeTx = thisTx.filter(t=>t.type==="income");
          if (incomeTx.length===1) insights.push({type:"neutral",emoji:"📅",title:"Single income source",
            body:`All income came from one source. One disruption and your entire budget breaks.`,
            tip:profile?.income_pattern==="variable"||profile?.income_pattern==="gig"?`With variable income, a one-month buffer isn't optional. Build it before anything else.`:`A one-month expense buffer means last month's income pays this month's bills — the paycheck-to-paycheck stress disappears.`});

          // 7. SPENDING TREND
          if (spendDelta!==null) {
            const isAvoidance = profile?.real_obstacle==="avoidance"||profile?.spending_trigger==="no_tracking";
            if (spendDelta<-5) insights.push({type:"good",emoji:"📉",title:`Spending down ${Math.abs(spendDelta)}% from last month`,body:`You spent ${fmt(Math.abs(totalSpent-lastSpent))} less than last month.`,tip:`Sustain this and you'll save an extra ${fmt(Math.round((lastSpent-totalSpent)*12))} over the next 12 months.`});
            else if (spendDelta>20) insights.push({type:"bad",emoji:"📈",title:`Spending up ${spendDelta}% from last month`,body:`You spent ${fmt(totalSpent-lastSpent)} more than last month.`,
              tip:isAvoidance?`You mentioned avoiding your finances. Name what drove this — one-time or pattern — and decide right now.`:`One-time expense? Move on. New pattern? Name it and make a decision this week.`});
          }

          // 8. SAVINGS HABIT (from profile)
          if (profile?.savings_habit==="never"||profile?.savings_habit==="sometimes") {
            insights.push({type:"bad",emoji:"🔁",title:"No consistent saving habit yet",
              body:`You said saving doesn't happen regularly. Without a system, good intentions don't become savings — the month ends and it's gone.`,
              tip:`Set up one automatic transfer of ${fmt(Math.max(25,Math.round(avgMonthlyIncome*0.03)))} on payday. Before you can see it, it's saved.`});
          }

          // ── CROSS-MONTH DOT-CONNECTOR INSIGHTS ─────────────────────────────

          // 9. RED FLAG ESCALATION — most important pattern
          if (rfTotal3Mo > 0 && allMonths.filter(m=>m.length>0).length >= 2) {
            const moNames = [MONTHS_SHORT[+MONTH_MINUS2.split("-")[1]-1], MONTHS_SHORT[+LAST_MONTH.split("-")[1]-1], MONTHS_SHORT[+NOW_MONTH.split("-")[1]-1]];
            const rfBreakdown = rfCats.map(cat => {
              const total = (catBy3Mo[cat]||[0,0,0]).reduce((s,v)=>s+v,0);
              return total > 0 ? `${cat} ${fmt(total)}` : null;
            }).filter(Boolean).join(" · ");

            if (rfEscalating) {
              const projected = rfBy3Mo[2] * 12;
              insights.push({type:"bad", emoji:"📈", title:`Red flag spending is growing every month`,
                body:`${moNames[0]}: ${fmt(rfBy3Mo[0])} → ${moNames[1]}: ${fmt(rfBy3Mo[1])} → ${moNames[2]}: ${fmt(rfBy3Mo[2])}. That's ${fmt(rfTotal3Mo)} in ${allMonths.filter(m=>m.length>0).length} months — and the trend is up, not down. At this rate: ${fmt(projected)}/year.`,
                tip:`The pattern is clear in the data. Each month is higher than the last. This won't fix itself — name the specific habit (tobacco, ATM cash, fees) and make one concrete change this week, not next month.`});
            } else if (rfTotal3Mo > 200) {
              insights.push({type:"bad", emoji:"🚩", title:`${fmt(rfTotal3Mo)} in unbudgeted charges over 3 months`,
                body:`${rfBreakdown}. None of this appears in your budget — it's invisible spending that silently drains your account every month.`,
                tip:`This money isn't going anywhere useful. Pick the single biggest category and make a plan to eliminate or cap it. Start there.`});
            }
          }

          // 10. DELIVERY TRAJECTORY
          if (delivery3Mo.some(v=>v>0) && allMonths.filter(m=>m.length>0).length >= 2) {
            const moNames = [MONTHS_SHORT[+MONTH_MINUS2.split("-")[1]-1], MONTHS_SHORT[+LAST_MONTH.split("-")[1]-1], MONTHS_SHORT[+NOW_MONTH.split("-")[1]-1]];
            const delivTotal3Mo = delivery3Mo.reduce((s,v)=>s+v,0);
            const delivCount3Mo = allMonths.reduce((s,mTx)=>s+mTx.filter(t=>t.category==="🚗 Delivery").length,0);
            if (deliveryTrend==="up") {
              insights.push({type:"bad", emoji:"🚗", title:"Delivery spending is climbing every month",
                body:`${moNames[0]}: ${fmt(delivery3Mo[0])} → ${moNames[1]}: ${fmt(delivery3Mo[1])} → ${moNames[2]}: ${fmt(delivery3Mo[2])}. ${delivCount3Mo} orders totaling ${fmt(delivTotal3Mo)} in 3 months — ${fmt(delivTotal3Mo*4)}/year at this pace.`,
                tip:`Each order is a choice. The trend in your data shows this is getting harder to control, not easier. Delete the app from your phone for 2 weeks and see what happens to your balance.`});
            } else if (delivTotal3Mo > 300) {
              insights.push({type:"neutral", emoji:"🚗", title:`${fmt(delivTotal3Mo)} on delivery in 3 months`,
                body:`${delivCount3Mo} orders across ${moNames.filter((_,i)=>delivery3Mo[i]>0).join(", ")}. That's ${fmt(Math.round(delivTotal3Mo/delivCount3Mo))} per order on average.`,
                tip:`${fmt(delivTotal3Mo*4)}/year is what this habit costs annually. Even cutting to once a week saves ${fmt(Math.round(delivTotal3Mo*0.5))}/month.`});
            }
          }

          // 11. RECURRING CATEGORY DRAIN
          recurring.filter(([cat])=>!rfCats.includes(cat)&&cat!=="Utilities").forEach(([cat, vals]) => {
            const total = vals.reduce((s,v)=>s+v,0);
            const avg   = total/3;
            const trend = vals[2]>vals[0]*1.2 ? "up" : vals[2]<vals[0]*0.8 ? "down" : "flat";
            if (avg > 80 && trend === "up") {
              insights.push({type:"neutral", emoji:"📅", title:`${cat} up every month for 3 months`,
                body:`${fmt(vals[0])} → ${fmt(vals[1])} → ${fmt(vals[2])}. Consistent and growing. At this rate: ${fmt(avg*12)}/year.`,
                tip:`Recurring costs that grow quietly are the hardest to catch. Set a hard monthly cap for ${cat} and treat it like a bill.`});
            }
          });

          // 12. CASH WITHDRAWAL PATTERN
          const cashBy3Mo = catBy3Mo["🚩 Cash"]||[0,0,0];
          const cashTotal3Mo = cashBy3Mo.reduce((s,v)=>s+v,0);
          if (cashTotal3Mo > 100) {
            const cashCount = allMonths.reduce((s,mTx)=>s+mTx.filter(t=>t.category==="🚩 Cash").length,0);
            insights.push({type:"bad", emoji:"💸", title:`${fmt(cashTotal3Mo)} in cash withdrawals — untracked`,
              body:`${cashCount} ATM withdrawals over 3 months. Cash disappears without a trace — you can't see what it was spent on, and it doesn't count against any budget category.`,
              tip:`Cash is a budget leak by design. Every dollar you withdraw is a dollar that vanishes from your tracking. Switch to card for everything — your future self will be able to see where it went.`});
          }

          // 13. TOBACCO HABIT COST
          const tobaccoBy3Mo = catBy3Mo["🚩 Tobacco"]||[0,0,0];
          const tobaccoTotal3Mo = tobaccoBy3Mo.reduce((s,v)=>s+v,0);
          if (tobaccoTotal3Mo > 0) {
            const annualised = Math.round((tobaccoTotal3Mo/allMonths.filter(m=>m.length>0).length)*12);
            insights.push({type:"bad", emoji:"🚬", title:`Tobacco: ${fmt(tobaccoTotal3Mo)} in 3 months`,
              body:`At this rate you're spending ${fmt(annualised)}/year on tobacco. That's not a small line item — it's a car payment, a vacation, or ${fmt(annualised)} toward financial freedom.`,
              tip:`This one is worth being honest about. ${fmt(annualised)}/year is the actual cost. What would change if that money stayed in your account?`});
          }

          // 14. TOTAL SPENDING TREND (3-month)
          const spentMonths = totalSpent3Mo.filter(v=>v>0);
          if (spentMonths.length >= 2) {
            const overallTrend = totalSpent3Mo[2] > totalSpent3Mo[1]*1.15 ? "spiking"
                               : totalSpent3Mo[2] < totalSpent3Mo[1]*0.85 ? "dropping"
                               : "stable";
            if (overallTrend==="spiking" && totalSpent3Mo[1]>0) {
              const spike = Math.round((totalSpent3Mo[2]-totalSpent3Mo[1])/totalSpent3Mo[1]*100);
              insights.push({type:"bad", emoji:"⚡", title:`Total spending up ${spike}% — biggest month yet`,
                body:`${MONTHS_SHORT[+MONTH_MINUS2.split("-")[1]-1]}: ${fmt(totalSpent3Mo[0])} → ${MONTHS_SHORT[+LAST_MONTH.split("-")[1]-1]}: ${fmt(totalSpent3Mo[1])} → ${MONTHS_SHORT[+NOW_MONTH.split("-")[1]-1]}: ${fmt(totalSpent3Mo[2])}. This month is your highest spending month in the data.`,
                tip:`A spike this size usually has one or two specific causes. Go to Insights → drill into the category that grew most. Find it, name it, decide if it was worth it.`});
            }
          }

          // 15. SUBSCRIPTION AUDIT
          const subTotal3Mo = (catBy3Mo["🔔 Subscriptions"]||[0,0,0]).reduce((s,v)=>s+v,0);
          const subCount    = allMonths.reduce((s,mTx)=>s+mTx.filter(t=>t.category==="🔔 Subscriptions").length,0);
          if (subTotal3Mo > 50) {
            const subTxAll = allMonths.flatMap(mTx=>mTx.filter(t=>t.category==="🔔 Subscriptions"));
            const uniqueSubs = [...new Set(subTxAll.map(t=>t.description))];
            insights.push({type:"neutral", emoji:"📱", title:`${uniqueSubs.length} active subscriptions — ${fmt(subTotal3Mo/Math.max(1,allMonths.filter(m=>m.length>0).length))}/month`,
              body:`${uniqueSubs.join(", ")}. Total over 3 months: ${fmt(subTotal3Mo)} — ${fmt(subTotal3Mo*4)}/year.`,
              tip:`Go through each one and ask: did I use this in the last 30 days? Cancel any you can't answer yes to immediately. Subscriptions are the easiest money to recover.`});
          }

          // Sort: bad → neutral → good
          insights.sort((a,b)=>({bad:0,neutral:1,good:2}[a.type]-{bad:0,neutral:1,good:2}[b.type]));

          // Hero
          const heroMsg = () => {
            if (!totalIncome) return {emoji:"👋",title:"Welcome to Pursuivo",sub:"Upload a statement or connect your bank to get started.",color:C.accent};
            if (saved<0)   return {emoji:"⚠️",title:`You spent ${fmt(Math.abs(saved))} more than you earned`,sub:profile?.real_obstacle==="avoidance"?"You already know. Now let's look at it together.":"Let's find where the money went and make a plan.",color:C.red};
            if (saved===0) return {emoji:"⚖️",title:"Breaking even this month",sub:"Every dollar in went right back out. One step from saving.",color:C.gold};
            if (saved<200) return {emoji:"📈",title:`You saved ${fmt(saved)} this month`,sub:saved < 50 && totalIncome > 0 ?"You broke the pattern this month. That matters.":"Small progress is still progress.",color:C.gold};
            return {emoji:"🎯",title:`You saved ${fmt(saved)} this month`,sub:spendDelta<0?`Spending is down ${Math.abs(spendDelta)}% from last month.`:(profile?.rich_life_vision==="freedom"?"Every saved dollar is a step toward freedom.":"You're building real momentum."),color:C.accent};
          };
          const hero = heroMsg();
          const monthsSaved=[savedLast,lastTx.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0)-Math.abs(minus2Tx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0))];
          let streak=saved>0?1:0;
          for (const m of monthsSaved) { if(streak>0&&m>0) streak++; else break; }

          return (
            <div style={{display:"flex",flexDirection:"column",gap:0}}>
              {/* Hero */}
              <div style={{padding:"28px 20px 24px",background:`linear-gradient(160deg, ${hero.color}18 0%, ${C.bg} 60%)`,borderBottom:`1px solid ${C.border}`}}>
                <div style={{fontSize:38,marginBottom:12,lineHeight:1}}>{hero.emoji}</div>
                <div style={{fontSize:22,fontWeight:800,color:C.text,lineHeight:1.2,letterSpacing:"-0.02em",marginBottom:10}}>{hero.title}</div>
                <div style={{fontSize:13,color:C.textDim,lineHeight:1.6,marginBottom:20}}>{hero.sub}</div>
                {streak>=2&&<div style={{display:"inline-flex",alignItems:"center",gap:6,background:`${C.gold}15`,border:`1px solid ${C.gold}30`,borderRadius:20,padding:"6px 14px"}}><span style={{fontSize:14}}>🔥</span><span style={{fontSize:12,fontWeight:700,color:C.gold}}>{streak} months saving in a row</span></div>}
              </div>

              <div style={{padding:"16px 14px",display:"flex",flexDirection:"column",gap:12}}>

                {/* Missing cash income prompt */}
                {(()=>{
                  const dayOfMonth = new Date().getDate();
                  const hasIncome  = thisTx.some(t=>t.type==="income");
                  if (dayOfMonth < 10 || hasIncome) return null;
                  return (
                    <button onClick={()=>setShowCashIncome(true)}
                      style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:`${C.accent}08`,border:`1px solid ${C.accent}25`,borderRadius:16,cursor:"pointer",textAlign:"left"}}>
                      <span style={{fontSize:24,flexShrink:0}}>💵</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:2}}>Got paid in cash this month?</div>
                        <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>No income recorded yet. Logging it keeps your savings rate and surplus accurate.</div>
                      </div>
                      <span style={{fontSize:14,color:C.accent,flexShrink:0}}>›</span>
                    </button>
                  );
                })()}

                {/* Action Plan card — compact, always visible */}
                {profile && (()=>{
                  const planProgress = (() => { try { return JSON.parse(localStorage.getItem("pursuivo_plan_progress")||"{}"); } catch { return {}; } })();
                  const allMosPlan   = [minus2Tx,lastTx,thisTx].filter(m=>m.length>0);
                  const moCount      = allMosPlan.length||1;
                  const avgP         = cat => allMosPlan.reduce((s,m)=>s+m.filter(t=>t.category===cat&&t.type==="expense").reduce((a,t)=>a+Math.abs(t.amount),0),0)/moCount;
                  const txDataPlan   = {
                    months:moCount, txCount:tx.length,
                    unclearCount:tx.filter(t=>t.category==="❓ Unclear").length,
                    avgDelivery:Math.round(avgP("🚗 Delivery")),
                    avgTobacco:Math.round(avgP("🚩 Tobacco")),
                    avgCash:Math.round(avgP("🚩 Cash")),
                    avgFees:Math.round(avgP("🚩 Fees")),
                    avgGroceries:Math.round(avgP("🛒 Groceries")),
                    avgIncome:Math.round(allMosPlan.reduce((s,m)=>s+m.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0),0)/moCount),
                    avgTotalSpend:Math.round(allMosPlan.reduce((s,m)=>s+m.filter(t=>t.type==="expense").reduce((a,t)=>a+Math.abs(t.amount),0),0)/moCount),
                  };
                  const planSteps    = buildActionPlan(profile, txDataPlan);
                  const doneCount    = planSteps.filter(s=>planProgress[s.id]).length;
                  const pct          = planSteps.length ? Math.round(doneCount/planSteps.length*100) : 0;
                  const nextStep     = planSteps.find(s=>!planProgress[s.id]);
                  const allDone      = doneCount === planSteps.length;
                  const dreamLabels  = {freedom:"Financial Freedom",home:"Own a Home",time:"Buy Back Time",experiences:"Experiences",family:"Family Security",build:"Build Something"};
                  const dream        = dreamLabels[profile?.rich_life_vision]||"Your Goal";

                  return (
                    <button onClick={()=>setShowActionPlan(true)} style={{width:"100%",background:C.card,border:`1.5px solid ${allDone?C.accent:nextStep?nextStep.color+"40":C.border}`,borderRadius:16,padding:"16px",textAlign:"left",cursor:"pointer",boxShadow:nextStep?`0 2px 12px ${nextStep.color}12`:"none"}}>
                      {/* Header row */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:10,color:allDone?C.accent:nextStep?nextStep.color:C.muted,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:5}}>
                            {allDone?"✓ Complete":nextStep?"Next Step":"Your Plan"} · {dream}
                          </div>
                          <div style={{fontSize:14,fontWeight:800,color:C.text,lineHeight:1.25,marginBottom:4}}>
                            {allDone?"All steps complete 🎉":nextStep?`${nextStep.icon} ${nextStep.title}`:"Loading plan…"}
                          </div>
                          {nextStep&&!allDone&&(
                            <div style={{fontSize:10,color:C.textDim,lineHeight:1.5}}>
                              {nextStep.timeline} · {doneCount} of {planSteps.length} done
                            </div>
                          )}
                        </div>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0,marginLeft:12}}>
                          <span style={{fontSize:18,fontWeight:800,fontFamily:F.mono,color:allDone?C.accent:nextStep?nextStep.color:C.muted}}>{pct}%</span>
                          <span style={{fontSize:12,color:C.muted,fontFamily:F.sans}}>View →</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden",marginBottom:10}}>
                        <div style={{height:6,borderRadius:3,background:allDone?C.accent:nextStep?nextStep.color:C.accent,width:`${pct}%`,transition:"width 0.5s ease",boxShadow:pct>0?`0 0 8px ${allDone?C.accent:nextStep?.color||C.accent}50`:"none"}} />
                      </div>

                      {/* Step dots with labels */}
                      <div style={{display:"flex",alignItems:"center",gap:3}}>
                        {planSteps.map((s,i)=>{
                          const isDone    = !!planProgress[s.id];
                          const isCurrent = !isDone && !planSteps.slice(0,i).some(ps=>!planProgress[ps.id]);
                          return (
                            <div key={s.id} title={s.title} style={{flex:isCurrent?2:1,height:8,borderRadius:4,background:isDone?C.accent:isCurrent?(nextStep?.color||C.accent):C.border,transition:"all 0.3s",boxShadow:isCurrent?`0 0 8px ${nextStep?.color||C.accent}70`:"none",position:"relative"}}>
                              {isDone&&<span style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:8,color:C.bg,fontWeight:900}}>✓</span>}
                            </div>
                          );
                        })}
                        <span style={{fontSize:10,color:C.muted,fontFamily:F.mono,marginLeft:6,flexShrink:0}}>{doneCount}/{planSteps.length}</span>
                      </div>
                    </button>
                  );
                })()}

                {/* Insights */}
                {insights.length>0&&<InsightsList insights={insights} />}

                {/* Delivery Intervention Card */}
                {(()=>{
                  const deliverySpend = catSpend["🚗 Delivery"]||0;
                  if (!deliverySpend) return null;

                  // 3-month delivery data
                  const del3Mo      = [minus2Tx,lastTx,thisTx].map(m=>m.filter(t=>t.category==="🚗 Delivery"&&t.type==="expense").reduce((s,t)=>s+Math.abs(t.amount),0));
                  const delAvg      = Math.round(del3Mo.reduce((s,v)=>s+v,0)/del3Mo.filter(v=>v>0).length||1);
                  const delBudget   = assigned["delivery"]||120;
                  const delLeft     = delBudget - deliverySpend;
                  const delOrders   = thisTx.filter(t=>t.category==="🚗 Delivery"&&t.type==="expense").length;
                  const avgOrder    = delOrders>0 ? Math.round(deliverySpend/delOrders) : 25;
                  const ordersLeft  = delLeft>0 ? Math.floor(delLeft/avgOrder) : 0;
                  const pctUsed     = Math.min(100,Math.round(deliverySpend/delBudget*100));
                  const isOver      = deliverySpend > delBudget;
                  const isCritical  = pctUsed >= 80;
                  const barColor    = isOver ? C.red : isCritical ? C.gold : C.orange;
                  const moLabels    = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                  const del3MoLabels= [minus2Tx,lastTx,thisTx].map((_,i)=>{
                    const mo = [NOW_MONTH,LAST_MONTH,MONTH_MINUS2].reverse()[i];
                    return moLabels[+mo.split("-")[1]-1];
                  });
                  const maxDel = Math.max(...del3Mo,1);

                  return (
                    <div style={{background:C.card,border:`1.5px solid ${isOver?C.red+"50":isCritical?C.gold+"40":C.orange+"30"}`,borderRadius:16,overflow:"hidden"}}>

                      {/* Header */}
                      <div style={{padding:"16px 16px 12px",background:isOver?`${C.red}08`:isCritical?`${C.gold}06`:`${C.orange}06`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                          <div>
                            <div style={{fontSize:10,color:barColor,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>
                              🚗 {isOver?"Over Budget":isCritical?"Almost There":"Delivery"}
                            </div>
                            <div style={{fontSize:22,fontWeight:800,fontFamily:F.mono,color:C.text,letterSpacing:"-0.02em",lineHeight:1}}>{fmt(deliverySpend)}</div>
                            <div style={{fontSize:10,color:C.textDim,marginTop:4}}>
                              {isOver
                                ? `${fmt(Math.abs(delLeft))} over your ${fmt(delBudget)} budget`
                                : `${fmt(delLeft)} left · ${ordersLeft} order${ordersLeft!==1?"s":""} at avg ${fmt(avgOrder)}`
                              }
                            </div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:13,fontWeight:700,fontFamily:F.mono,color:barColor}}>{pctUsed}%</div>
                            <div style={{fontSize:10,color:C.muted,fontFamily:F.mono,marginTop:2}}>{delOrders} orders</div>
                          </div>
                        </div>

                        {/* Budget bar */}
                        <div style={{height:8,background:C.border,borderRadius:4,overflow:"hidden"}}>
                          <div style={{height:8,borderRadius:4,background:barColor,width:`${pctUsed}%`,transition:"width 0.5s ease",boxShadow:`0 0 8px ${barColor}50`}} />
                        </div>
                      </div>

                      {/* 3-month mini chart */}
                      <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`}}>
                        <div style={{fontSize:10,color:C.muted,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>3-Month Trend</div>
                        <div style={{display:"flex",alignItems:"flex-end",gap:8,height:48}}>
                          {del3Mo.map((v,i)=>{
                            const h  = Math.max(v/maxDel*44,v>0?4:1);
                            const isCur = i===del3Mo.length-1;
                            return (
                              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                                <div style={{fontSize:10,fontWeight:700,fontFamily:F.mono,color:isCur?barColor:v>0?C.textDim:C.muted}}>{v>0?fmt(v):"—"}</div>
                                <div style={{width:"100%",height:h,borderRadius:"3px 3px 0 0",background:isCur?barColor:v>0?`${C.orange}50`:`${C.border}`,transition:"height 0.4s ease"}} />
                                <div style={{fontSize:10,color:isCur?barColor:C.muted,fontFamily:F.mono,fontWeight:isCur?700:400}}>{del3MoLabels[i]}</div>
                              </div>
                            );
                          })}
                        </div>
                        {delAvg>0&&(
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,padding:"8px 10px",background:C.bg,borderRadius:8}}>
                            <span style={{fontSize:10,color:C.textDim,fontFamily:F.sans}}>3-month average</span>
                            <span style={{fontSize:12,fontWeight:700,fontFamily:F.mono,color:C.orange}}>{fmt(delAvg)}/mo</span>
                          </div>
                        )}
                      </div>

                      {/* Action row */}
                      <div style={{padding:"10px 16px 14px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
                        <button onClick={()=>setTab("budget")} style={{flex:1,padding:"10px",background:`${barColor}15`,border:`1px solid ${barColor}30`,borderRadius:10,color:barColor,fontSize:12,fontWeight:700,fontFamily:F.sans,cursor:"pointer"}}>
                          {isOver?"Adjust budget →":"Set limit →"}
                        </button>
                        <button onClick={()=>{setInsightCat("🚗 Delivery");setInsightMonth("m0");setTab("insights");}} style={{flex:1,padding:"10px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,color:C.muted,fontSize:12,fontWeight:700,fontFamily:F.sans,cursor:"pointer"}}>
                          See orders →
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Delivery Intervention Card */}
                {(()=>{
                  const deliveryTx    = thisTx.filter(t=>t.category==="🚗 Delivery"&&t.type==="expense");
                  const deliverySpent = deliveryTx.reduce((s,t)=>s+Math.abs(t.amount),0);
                  if (deliverySpent === 0) return null;

                  const deliveryBudget  = assigned["delivery"] || 120;
                  const deliveryLeft    = deliveryBudget - deliverySpent;
                  const orderCount      = deliveryTx.length;
                  const avgOrder        = orderCount > 0 ? Math.round(deliverySpent / orderCount) : 0;
                  const ordersLeft      = deliveryLeft > 0 && avgOrder > 0 ? Math.floor(deliveryLeft / avgOrder) : 0;
                  const pctUsed         = Math.min(Math.round(deliverySpent / deliveryBudget * 100), 100);
                  const isOver          = deliverySpent > deliveryBudget;
                  const isWarning       = pctUsed >= 80 && !isOver;
                  const color           = isOver ? C.red : isWarning ? C.gold : C.orange;

                  // 3-month trend
                  const allMosDel   = [minus2Tx, lastTx, thisTx];
                  const moLabelsDel = [MONTHS_SHORT[+MONTH_MINUS2.split("-")[1]-1], MONTHS_SHORT[+LAST_MONTH.split("-")[1]-1], MONTHS_SHORT[+NOW_MONTH.split("-")[1]-1]];
                  const moTotals    = allMosDel.map(m=>m.filter(t=>t.category==="🚗 Delivery"&&t.type==="expense").reduce((s,t)=>s+Math.abs(t.amount),0));
                  const maxMo       = Math.max(...moTotals, 1);

                  return (
                    <div style={{background:C.card,border:`1.5px solid ${color}35`,borderRadius:16,overflow:"hidden"}}>
                      {/* Color bar top */}
                      <div style={{height:3,background:color,width:`${pctUsed}%`,transition:"width 0.6s ease",boxShadow:`0 0 8px ${color}50`}} />

                      <div style={{padding:"16px 16px 14px"}}>
                        {/* Header */}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                          <div>
                            <div style={{fontSize:10,color:color,fontFamily:F.mono,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>
                              🚗 {isOver?"Over Budget":isWarning?"Almost Out":"Delivery Budget"}
                            </div>
                            <div style={{fontSize:22,fontWeight:800,fontFamily:F.mono,color:C.text,letterSpacing:"-0.02em",lineHeight:1}}>
                              {fmt(deliverySpent)}
                              <span style={{fontSize:13,fontWeight:500,color:C.muted,letterSpacing:0}}> / {fmt(deliveryBudget)}</span>
                            </div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{orderCount} orders</div>
                            <div style={{fontSize:10,color:C.muted}}>{fmt(avgOrder)} avg</div>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{height:8,background:C.border,borderRadius:4,overflow:"hidden",marginBottom:10}}>
                          <div style={{height:8,borderRadius:4,background:color,width:`${pctUsed}%`,transition:"width 0.6s ease",boxShadow:`0 0 6px ${color}40`}} />
                        </div>

                        {/* Status message */}
                        <div style={{fontSize:12,color:C.textDim,marginBottom:14,lineHeight:1.5}}>
                          {isOver
                            ? `${fmt(Math.abs(deliveryLeft))} over budget — every new order makes it worse.`
                            : isWarning
                            ? `${fmt(deliveryLeft)} left — about ${ordersLeft} order${ordersLeft!==1?"s":""} at your average of ${fmt(avgOrder)}.`
                            : `${fmt(deliveryLeft)} remaining — roughly ${ordersLeft} order${ordersLeft!==1?"s":""} left this month.`
                          }
                        </div>

                        {/* 3-month mini bars */}
                        <div style={{display:"flex",gap:6,alignItems:"flex-end",marginBottom:12}}>
                          {moTotals.map((v,i)=>{
                            const h = Math.max(v/maxMo*36, v>0?4:2);
                            const isCurrent = i===2;
                            return (
                              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                                <div style={{fontSize:10,fontFamily:F.mono,color:isCurrent?color:C.muted,fontWeight:isCurrent?700:400}}>{v>0?fmt(v):""}</div>
                                <div style={{width:"100%",height:h,borderRadius:3,background:isCurrent?color:`${color}40`,boxShadow:isCurrent?`0 0 6px ${color}50`:undefined,transition:"height 0.4s ease"}} />
                                <div style={{fontSize:10,color:C.muted,fontFamily:F.mono}}>{moLabelsDel[i]}</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Action row */}
                        <div style={{display:"flex",gap:8}}>
                          <button onClick={()=>setTab("budget")} style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${color}40`,background:`${color}12`,color,fontSize:10,fontWeight:700,fontFamily:F.sans,cursor:"pointer"}}>
                            Adjust budget →
                          </button>
                          <button onClick={()=>{setInsightMonth("m0");setInsightCat("🚗 Delivery");setTab("insights");}} style={{flex:1,padding:"10px",borderRadius:10,border:`1px solid ${C.border}`,background:C.surface,color:C.muted,fontSize:10,fontWeight:700,fontFamily:F.sans,cursor:"pointer"}}>
                            See all orders →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Top transactions */}
                {topTx.length>0&&(
                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
                    <div style={{padding:"14px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${C.border}`}}>
                      <div>
                        <div style={{fontSize:8,color:C.muted,fontFamily:F.mono,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>Top Spend · {fmtMonthLabel(NOW_MONTH)}</div>
                        <div style={{fontSize:22,fontWeight:800,fontFamily:F.mono,color:C.text,letterSpacing:"-0.02em",lineHeight:1}}>{fmt(totalSpent)}</div>
                      </div>
                      {redFlagTotal>0&&(
                        <button onClick={()=>setShowRedFlags(true)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",background:`${C.red}10`,border:`1px solid ${C.red}25`,borderRadius:10,cursor:"pointer"}}>
                          <span style={{fontSize:10,fontWeight:700,color:C.red,fontFamily:F.mono}}>{fmt(redFlagTotal)}</span>
                          <span style={{fontSize:10,color:C.red}}>🚩</span>
                        </button>
                      )}
                    </div>
                    {topTx.map((t,i)=>{
                      const color=CAT_TX_COLOR[t.category]||C.muted;
                      const isRed=t.category.startsWith("🚩");
                      const pct=totalSpent>0?Math.round(Math.abs(t.amount)/totalSpent*100):0;
                      return (
                        <button key={t.id} onClick={()=>setTxSheet(t)}
                          style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<topTx.length-1?`1px solid ${C.border}10`:"none",background:"transparent",border:"none",width:"100%",cursor:"pointer",textAlign:"left"}}>
                          <div style={{fontSize:10,color:C.muted,fontFamily:F.mono,width:16,flexShrink:0,textAlign:"center"}}>{i+1}</div>
                          <div style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:600,color:isRed?C.red:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.description}</div>
                            <div style={{fontSize:10,color:C.muted,fontFamily:F.mono,marginTop:2}}>{t.category} · {fmtDate(t.date)}</div>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontSize:13,fontWeight:700,fontFamily:F.mono,color:isRed?C.red:C.text}}>-{fmtFull(Math.abs(t.amount))}</div>
                            <div style={{fontSize:10,color:C.muted,fontFamily:F.mono,marginTop:1}}>{pct}%</div>
                          </div>
                        </button>
                      );
                    })}
                    <div style={{padding:"10px 16px",borderTop:`1px solid ${C.border}`,textAlign:"right"}}>
                      <button onClick={()=>setTab("ledger")} style={{fontSize:10,color:C.accent,fontWeight:700,fontFamily:F.mono,background:"none",border:"none",cursor:"pointer",letterSpacing:"0.06em",textTransform:"uppercase"}}>All transactions →</button>
                    </div>
                  </div>
                )}

                {/* Profile card */}
                {profile&&(
                  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <div style={{fontSize:12,fontWeight:700,color:C.text}}>Your Financial Profile</div>
                      <div style={{display:"flex",gap:10}}>
                        <button onClick={()=>setShowActionPlan(true)} style={{fontSize:10,color:C.accent,fontWeight:700,background:"none",border:"none",cursor:"pointer",padding:0}}>View Plan →</button>
                        <button onClick={()=>setShowProfile(true)} style={{fontSize:10,color:C.muted,fontWeight:600,background:"none",border:"none",cursor:"pointer",padding:0}}>Edit</button>
                      </div>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {[
                        {label:{freedom:"Financial freedom",home:"Own a home",time:"Buy back time",experiences:"Experiences",family:"Family first",build:"Build something"}[profile.rich_life_vision],icon:"🌟"},
                        {label:{income_gap:"Income gap",debt_anchor:"Debt anchor",no_system:"No system",overspend:"Overspending",avoidance:"Avoidance",lost:"Getting started"}[profile.real_obstacle],icon:"🚧"},
                        {label:{see_truth:"See the truth",stop_bleed:"Stop leaks",first_1k:"First $1k",debt_start:"Kill debt",habit:"Build habit",understand:"Get clarity"}[profile.first_win],icon:"🎯"},
                        {label:{never:"Not saving yet",sometimes:"Saving sometimes",manual:"Saving manually",automated:"Automated savings"}[profile.savings_habit],icon:"🔁"},
                      ].filter(t=>t.label).map((tag,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",background:C.card,border:`1px solid ${C.border}`,borderRadius:20}}>
                          <span style={{fontSize:10}}>{tag.icon}</span>
                          <span style={{fontSize:10,color:C.textDim,fontFamily:F.sans,fontWeight:600}}>{tag.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tx.length===0&&<Card><EmptyState icon="💳" title="No transactions yet" body="Upload a statement or connect your bank." action="Upload Statement" onAction={()=>setShowUpload(true)} /></Card>}

              </div>
            </div>
          );
        })()}

      </div>{/* end scrollable */}

      {/* ── Sheets ── */}
      {showRedFlags && <RedFlagSheet allTx={tx} months={[MONTH_MINUS2,LAST_MONTH,NOW_MONTH]} onClose={()=>setShowRedFlags(false)} />}
      {showCashIncome && <CashIncomeSheet onSave={t=>{saveTx(t);setShowCashIncome(false);}} onClose={()=>setShowCashIncome(false)} />}
      {showSettings && <SettingsSheet
        profile={profile}
        notifPermission={notifPermission}
        onRequestNotif={requestNotifPermission}
        onEditProfile={()=>setShowProfile(true)}
        onResetData={()=>{ setTx([]); setProfile(null); setAssigned({rent:700,electric:80,internet:50,phone:40,groceries:180,transport:100,health:60,household:30,dining:50,delivery:100,entertainment:40,subscriptions:50,shopping:90,travel:50,emergency:100,vacation:50,investing:80}); }}
        onClose={()=>setShowSettings(false)}
        theme={theme}
        onThemeChange={setTheme}
      />}
      {showCalibrate && <AutoCalibrate allTx={tx} groups={GROUPS} currentAssigned={assigned} onApply={updates=>setAssigned(a=>({...a,...updates}))} onClose={()=>setShowCalibrate(false)} />}
      {clarifyTx&&<ClarifySheet tx={clarifyTx} onSave={saveTx} onClose={()=>setClarifyTx(null)} />}
      {txSheet&&<TxSheet tx={txSheet==="new"?null:txSheet} onSave={saveTx} onDelete={deleteTx} onClose={()=>setTxSheet(null)} />}
      {activeCat&&activeCatObj&&<CatSheet cat={activeCatObj} assigned={assigned[activeCat]||0} spent={spentByCat[activeCat]||0} onAssign={v=>assignCat(activeCat,v)} onClose={()=>setActiveCat(null)} />}

      {/* ── Bottom nav ── */}
      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,height:TAB_H,background:`${C.tabBar}f6`,backdropFilter:"blur(24px)",borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"stretch",zIndex:100}}>
        {NAV.map(item=>{
          const active=tab===item.id;
          return (
            <button key={item.id} onClick={()=>switchTab(item.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,background:"transparent",border:"none",cursor:"pointer",color:active?C.accent:C.muted,position:"relative",transition:"color 0.15s"}}>
              {active&&<div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:28,height:2,background:C.accent,borderRadius:"0 0 2px 2px",boxShadow:`0 0 10px ${C.accent}`}} />}
              <span style={{fontSize:18,lineHeight:1}}>{item.icon}</span>
              <span style={{fontSize:10,fontFamily:F.sans,fontWeight:active?700:500,letterSpacing:"0.03em"}}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

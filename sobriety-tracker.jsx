import { useState, useEffect, useMemo, useCallback } from "react";
import { Calendar, CheckCircle2, Circle, ChevronLeft, ChevronRight, Home, BookOpen, PenLine, ClipboardCheck, Sun, Moon, TrendingUp, Heart, Shield, Star, Award, Flame, X, Plus, Save, BarChart3, Coffee, Droplets } from "lucide-react";

// ─── Data persistence ───
const load = (key, fallback) => {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
};
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// ─── Date helpers ───
const fmt = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const toKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
};
const today = () => toKey(new Date());
const daysBetween = (a, b) => {
  const d1 = new Date(a + "T00:00:00");
  const d2 = new Date(b + "T00:00:00");
  return Math.floor((d2 - d1) / 86400000);
};

// ─── 12 Steps Data ───
const STEPS = [
  { num: 1, title: "Honesty", step: "We admitted we were powerless over alcohol — that our lives had become unmanageable.",
    about: "Step 1 is about breaking through denial. It asks you to honestly acknowledge that your relationship with alcohol has caused real damage and that willpower alone isn't enough. This isn't about weakness — it's about honesty. Most sponsors say this is the only step you need to do perfectly.",
    exercises: [
      "Write out specific examples of how your life became unmanageable due to drinking.",
      "List times you tried to control your drinking and failed.",
      "Describe the consequences alcohol brought to your relationships, health, work, and finances.",
      "Write about what powerlessness means to you personally."
    ],
    questions: ["What does powerlessness over alcohol mean to me?", "How has my life become unmanageable?", "What consequences have I faced from drinking?", "When did I first realize I couldn't stop on my own?"],
    requiresWriting: true
  },
  { num: 2, title: "Hope", step: "Came to believe that a Power greater than ourselves could restore us to sanity.",
    about: "Step 2 is about finding hope. 'Insanity' here means doing the same thing over and over expecting different results. This step asks you to open up to the idea that something beyond your own willpower can help. Your Higher Power can be anything — God, the group, the universe, love, nature, or simply the collective wisdom of people in recovery.",
    exercises: [
      "Write about what 'insanity' looked like in your drinking — repeated patterns expecting different outcomes.",
      "Describe what 'restored to sanity' would look like in your life.",
      "Explore what a Higher Power means to you — it doesn't have to be religious.",
      "List moments when something greater than yourself helped you."
    ],
    questions: ["What does insanity mean in the context of my addiction?", "What would 'sanity' look like in my daily life?", "What is my concept of a Higher Power?", "Can I point to moments of hope in my recovery so far?"],
    requiresWriting: true
  },
  { num: 3, title: "Faith", step: "Made a decision to turn our will and our lives over to the care of God as we understood Him.",
    about: "Step 3 is about letting go of the need to control everything. It's a decision — not perfection. You're choosing to stop trying to run the show by sheer force of will and instead trust in something bigger. Many people use the Serenity Prayer as the foundation of this step: 'God, grant me the serenity to accept the things I cannot change, courage to change the things I can, and wisdom to know the difference.'",
    exercises: [
      "Write about areas of your life where you try to maintain control and how that has worked out.",
      "Practice the Third Step Prayer daily for two weeks and journal about the experience.",
      "List things you're willing to 'turn over' and things you're still holding onto.",
      "Describe what 'turning it over' looks like in practical daily terms."
    ],
    questions: ["What am I trying to control that I need to let go of?", "What does 'turning my will over' look like day to day?", "What fears come up when I think about letting go?", "How has trying to control everything affected my life?"],
    requiresWriting: false
  },
  { num: 4, title: "Courage", step: "Made a searching and fearless moral inventory of ourselves.",
    about: "Step 4 is the big writing step. You create a thorough, honest inventory of your resentments, fears, and sexual/relationship conduct. This isn't about beating yourself up — it's about understanding the patterns that drove your addiction. Most sponsors use the Big Book's column format: who you resent, what happened, what part of you it affected (self-esteem, security, ambitions, relationships), and what YOUR part was.",
    exercises: [
      "RESENTMENT INVENTORY: List every person, institution, or principle you resent. For each: what happened, what it affected in you, and what was your part.",
      "FEAR INVENTORY: List all your fears. For each: why do you have it, and how has it affected your life?",
      "SEX/RELATIONSHIP INVENTORY: Review your romantic and sexual relationships. Where were you selfish, dishonest, or hurtful?",
      "ASSETS INVENTORY: Also list your positive qualities and strengths — this is about a complete picture."
    ],
    questions: ["Who or what do I resent, and why?", "What are my deepest fears?", "Where have I been selfish, dishonest, or inconsiderate in relationships?", "What patterns do I see repeating across my inventory?"],
    requiresWriting: true
  },
  { num: 5, title: "Integrity", step: "Admitted to God, to ourselves, and to another human being the exact nature of our wrongs.",
    about: "Step 5 is where you share your Step 4 inventory with your sponsor (or another trusted person). This is often described as one of the most freeing experiences in recovery. Secrets keep us sick — sharing them takes away their power. Your sponsor has likely heard it all before. This step builds genuine connection through vulnerability.",
    exercises: [
      "Schedule a dedicated time with your sponsor to share your Step 4 inventory.",
      "Read your entire inventory aloud — don't skip the parts that embarrass you most.",
      "After sharing, write about how the experience felt and what surprised you.",
      "Note any patterns your sponsor pointed out that you hadn't seen."
    ],
    questions: ["Am I ready to be completely honest with another person?", "What am I most afraid to share?", "How did I feel after sharing my inventory?", "What patterns were revealed that I hadn't noticed?"],
    requiresWriting: false
  },
  { num: 6, title: "Willingness", step: "Were entirely ready to have God remove all these defects of character.",
    about: "Step 6 is about willingness to change. After identifying your character defects in Steps 4 and 5 — things like selfishness, dishonesty, fear, resentment — this step asks: are you ready to let them go? Most people find they're attached to some defects because they served a purpose. This step is about becoming willing, not about being perfect.",
    exercises: [
      "List all the character defects identified in your Step 4/5 work.",
      "For each defect, write about how it has served you and why you might be reluctant to let it go.",
      "Rate your willingness to release each defect on a scale of 1-10.",
      "Write about what your life would look like without these defects."
    ],
    questions: ["Which character defects am I most attached to?", "How have my defects served me?", "Am I truly willing to change, or just willing to be willing?", "What would my life look like without these defects?"],
    requiresWriting: true
  },
  { num: 7, title: "Humility", step: "Humbly asked Him to remove our shortcomings.",
    about: "Step 7 is about humility — not humiliation. It's recognizing that you can't fix yourself by yourself, and asking for help. Many people use the Seventh Step Prayer: 'My Creator, I am now willing that you should have all of me, good and bad. I pray that you now remove from me every single defect of character which stands in the way of my usefulness to you and my fellows.' This step is practiced daily, not just once.",
    exercises: [
      "Practice the Seventh Step Prayer daily for at least two weeks.",
      "When you notice a character defect showing up in your day, pause and ask your Higher Power for help.",
      "Journal about moments when you noticed growth — times your old defects didn't control you.",
      "Write a letter to your Higher Power about what you want to become."
    ],
    questions: ["What does humility mean to me?", "How is humility different from humiliation?", "Where am I seeing growth already?", "Can I ask for help without feeling weak?"],
    requiresWriting: false
  },
  { num: 8, title: "Willingness to Make Amends", step: "Made a list of all persons we had harmed, and became willing to make amends to them all.",
    about: "Step 8 is about preparing to clean up the wreckage of your past. Using your Step 4 inventory as a starting point, you create a list of everyone you've harmed. Then you work on becoming willing to make amends to each person — even the ones who hurt you too. This step is about YOUR side of the street, not theirs.",
    exercises: [
      "Create a complete list of people you have harmed — use your Step 4 inventory as a starting point.",
      "For each person, write specifically what harm you caused.",
      "Rate your willingness to make amends to each person (willing, somewhat willing, not yet willing).",
      "For the people you're not yet willing to address, write about what's blocking you."
    ],
    questions: ["Who have I harmed and how?", "Who am I willing to make amends to right now?", "Who am I NOT willing to face, and why?", "Am I focusing on my part, or still blaming others?"],
    requiresWriting: true
  },
  { num: 9, title: "Justice", step: "Made direct amends to such people wherever possible, except when to do so would injure them or others.",
    about: "Step 9 is where you take action. You go to the people on your Step 8 list and make amends — not just apologies, but changed behavior. The key exception: don't make amends if doing so would hurt the other person or someone else. Work closely with your sponsor on each amend before making it. Some amends are direct conversations, some are financial, some are 'living amends' where you simply change your behavior going forward.",
    exercises: [
      "Work with your sponsor to prioritize your amends list and plan each conversation.",
      "For each amend, write out what you want to say and practice it.",
      "After each amend, journal about how it went and how you feel.",
      "Identify any 'living amends' — ongoing behavioral changes you need to make."
    ],
    questions: ["What amends have I made, and how did they go?", "Which amends am I avoiding, and why?", "Are there amends that would harm someone if I made them?", "What living amends do I need to make?"],
    requiresWriting: true
  },
  { num: 10, title: "Perseverance", step: "Continued to take personal inventory and when we were wrong promptly admitted it.",
    about: "Step 10 is a daily practice — it's Steps 4-9 in miniature, done continuously. At the end of each day (and throughout the day), you take inventory: Where was I selfish, dishonest, resentful, or afraid? Did I owe anyone an apology? Was I kind and loving? This step prevents the buildup of resentments and keeps your side of the street clean. Your evening check-in in this app is essentially Step 10 work.",
    exercises: [
      "Do a daily evening inventory every night for 30 days straight.",
      "When you catch yourself being wrong during the day, admit it immediately — don't wait.",
      "Track patterns in your daily inventories — what defects keep showing up?",
      "Practice spot-check inventories when emotions run high during the day."
    ],
    questions: ["Where was I selfish, dishonest, or afraid today?", "Do I owe anyone an apology?", "What did I do well today?", "What patterns am I noticing in my daily inventories?"],
    requiresWriting: true
  },
  { num: 11, title: "Spiritual Awareness", step: "Sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.",
    about: "Step 11 is about building a daily spiritual practice — whatever that means to you. Prayer, meditation, mindfulness, time in nature, journaling. The goal is conscious contact with your Higher Power and seeking guidance rather than trying to force your will on the world. Many people start with just 5-10 minutes of quiet reflection each morning.",
    exercises: [
      "Establish a daily morning meditation or prayer practice (start with 5 minutes).",
      "Try different forms of meditation and find what works for you.",
      "Before making important decisions, pause and ask: what would my Higher Power want me to do?",
      "Write about your spiritual growth over the past months."
    ],
    questions: ["What does my spiritual practice look like?", "How do I seek guidance in my daily life?", "What has meditation or prayer done for me?", "Am I trying to force my will or seeking guidance?"],
    requiresWriting: false
  },
  { num: 12, title: "Service", step: "Having had a spiritual awakening as the result of these Steps, we practiced these principles in all our affairs and tried to carry this message to alcoholics who still suffer.",
    about: "Step 12 is about giving back what was freely given to you. Service can be as simple as sharing your story at a meeting, sponsoring someone, setting up chairs, or just being available when someone reaches out. 'Spiritual awakening' doesn't mean a lightning bolt — it's the gradual shift in how you see the world. You help others not out of obligation but because it keeps YOU sober.",
    exercises: [
      "Write about your spiritual awakening — how has your perspective on life changed?",
      "Find ways to be of service: volunteer at meetings, help a newcomer, sponsor someone.",
      "Practice these principles in ALL your affairs — work, relationships, daily life.",
      "Reflect on how helping others strengthens your own recovery."
    ],
    questions: ["How has my life changed through working the steps?", "How can I be of service to others in recovery?", "Am I practicing these principles in all areas of my life?", "What does my spiritual awakening look like?"],
    requiresWriting: true
  }
];

// ─── Check-in questions ───
const MORNING_QS = [
  { id: "pledge", q: "I pledge to stay sober today.", type: "toggle" },
  { id: "mood_am", q: "How are you feeling this morning?", type: "scale" },
  { id: "sleep", q: "How did you sleep last night?", type: "scale" },
  { id: "intention", q: "What is your intention for today?", type: "text" },
  { id: "gratitude", q: "Name 3 things you're grateful for:", type: "text" },
  { id: "triggers_plan", q: "Any potential triggers today? What's your plan?", type: "text" },
];
const EVENING_QS = [
  { id: "kept_pledge", q: "Did you stay sober today?", type: "toggle" },
  { id: "thc_today", q: "Did you use THC today?", type: "toggle" },
  { id: "mood_pm", q: "How are you feeling tonight?", type: "scale" },
  { id: "energy", q: "Energy level today?", type: "scale" },
  { id: "selfish", q: "Was I selfish, dishonest, or afraid today?", type: "text" },
  { id: "amends", q: "Do I owe anyone an apology?", type: "text" },
  { id: "proud", q: "What am I proud of today?", type: "text" },
  { id: "cravings", q: "Rate craving intensity today:", type: "scale" },
  { id: "highlights", q: "What was the best part of today?", type: "text" },
];

// ─── Serenity Prayer & AA Promises ───
const SERENITY = "God, grant me the serenity to accept the things I cannot change, courage to change the things I can, and wisdom to know the difference.";
const PROMISES = [
  "We are going to know a new freedom and a new happiness.",
  "We will not regret the past nor wish to shut the door on it.",
  "We will comprehend the word serenity and we will know peace.",
  "No matter how far down the scale we have gone, we will see how our experience can benefit others.",
  "That feeling of uselessness and self-pity will disappear.",
  "We will lose interest in selfish things and gain interest in our fellows.",
  "Self-seeking will slip away.",
  "Our whole attitude and outlook upon life will change.",
  "Fear of people and of economic insecurity will leave us.",
  "We will intuitively know how to handle situations which used to baffle us.",
  "We will suddenly realize that God is doing for us what we could not do for ourselves."
];

// ─── Main App ───
export default function App() {
  const [tab, setTab] = useState("home");
  const [soberDate] = useState(() => load("soberDate", "2025-09-19"));
  const [thcSoberDate, setThcSoberDate] = useState(() => load("thcSoberDate", today()));
  const [thcDays, setThcDays] = useState(() => load("thcDays", {}));
  const [checkIns, setCheckIns] = useState(() => load("checkIns", {}));
  const [stepData, setStepData] = useState(() => load("stepData", {}));
  const [journal, setJournal] = useState(() => load("journal", []));
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [activeStep, setActiveStep] = useState(null);
  const [checkinMode, setCheckinMode] = useState(null); // "morning" | "evening"
  const [showPromises, setShowPromises] = useState(false);

  // Persist
  useEffect(() => save("thcSoberDate", thcSoberDate), [thcSoberDate]);
  useEffect(() => save("thcDays", thcDays), [thcDays]);
  useEffect(() => save("checkIns", checkIns), [checkIns]);
  useEffect(() => save("stepData", stepData), [stepData]);
  useEffect(() => save("journal", journal), [journal]);

  const soberDays = daysBetween(soberDate, today());
  const thcCleanDays = daysBetween(thcSoberDate, today());

  // ─── Navigation ───
  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "checkin", icon: ClipboardCheck, label: "Check-in" },
    { id: "calendar", icon: Calendar, label: "Calendar" },
    { id: "steps", icon: BookOpen, label: "12 Steps" },
    { id: "journal", icon: PenLine, label: "Journal" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 px-4 py-3 text-center shadow-lg">
        <h1 className="text-lg font-bold tracking-wide text-white flex items-center justify-center gap-2">
          <Shield className="w-5 h-5 text-indigo-300" /> One Day at a Time
        </h1>
        <p className="text-xs text-indigo-300 mt-0.5 italic">{SERENITY}</p>
      </div>

      {/* Content */}
      <div className="pb-20 px-3 pt-3 max-w-lg mx-auto">
        {tab === "home" && <HomeTab soberDays={soberDays} soberDate={soberDate} thcCleanDays={thcCleanDays} thcSoberDate={thcSoberDate} checkIns={checkIns} stepData={stepData} showPromises={showPromises} setShowPromises={setShowPromises} setTab={setTab} />}
        {tab === "checkin" && <CheckInTab checkinMode={checkinMode} setCheckinMode={setCheckinMode} checkIns={checkIns} setCheckIns={setCheckIns} thcDays={thcDays} setThcDays={setThcDays} thcSoberDate={thcSoberDate} setThcSoberDate={setThcSoberDate} />}
        {tab === "calendar" && <CalendarTab calMonth={calMonth} setCalMonth={setCalMonth} checkIns={checkIns} thcDays={thcDays} />}
        {tab === "steps" && <StepsTab activeStep={activeStep} setActiveStep={setActiveStep} stepData={stepData} setStepData={setStepData} />}
        {tab === "journal" && <JournalTab journal={journal} setJournal={setJournal} />}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-around py-2 px-1 z-50">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${tab === t.id ? "text-indigo-400" : "text-gray-500 hover:text-gray-300"}`}>
            <t.icon className="w-5 h-5" />
            <span className="text-xs">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// HOME TAB
// ═══════════════════════════════════════
function HomeTab({ soberDays, soberDate, thcCleanDays, thcSoberDate, checkIns, stepData, showPromises, setShowPromises, setTab }) {
  const todayCheckin = checkIns[today()];
  const completedSteps = STEPS.filter(s => stepData[s.num]?.completed).length;
  const streak = useMemo(() => {
    let count = 0;
    let d = new Date();
    while (true) {
      const k = toKey(d);
      if (checkIns[k]?.morning || checkIns[k]?.evening) { count++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return count;
  }, [checkIns]);

  return (
    <div className="space-y-4">
      {/* Sobriety Counter */}
      <div className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 rounded-2xl p-5 text-center shadow-xl border border-indigo-700/30">
        <Droplets className="w-8 h-8 text-indigo-300 mx-auto mb-2" />
        <div className="text-6xl font-black text-white tracking-tight">{soberDays}</div>
        <div className="text-indigo-300 font-semibold text-sm mt-1">Days Sober from Alcohol</div>
        <div className="text-indigo-400/70 text-xs mt-1">Since {fmt(soberDate)}</div>
        {soberDays >= 180 && <div className="mt-2 inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-300 text-xs px-3 py-1 rounded-full"><Award className="w-3 h-3" /> 6+ Months!</div>}
      </div>

      {/* THC Counter */}
      <div className="bg-gradient-to-br from-emerald-900/80 to-teal-900/80 rounded-2xl p-4 text-center shadow-xl border border-emerald-700/30">
        <Coffee className="w-6 h-6 text-emerald-300 mx-auto mb-1" />
        <div className="text-4xl font-black text-white">{thcCleanDays}</div>
        <div className="text-emerald-300 font-semibold text-xs mt-1">Days Without THC</div>
        <div className="text-emerald-400/70 text-xs mt-0.5">Since {fmt(thcSoberDate)}</div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{streak}</div>
          <div className="text-gray-500 text-xs">Check-in Streak</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{completedSteps}/12</div>
          <div className="text-gray-500 text-xs">Steps Done</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-3 text-center border border-gray-800">
          <Heart className="w-5 h-5 text-pink-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-white">{Object.keys(checkIns).length}</div>
          <div className="text-gray-500 text-xs">Check-ins</div>
        </div>
      </div>

      {/* Today's Status */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Today — {fmt(new Date())}</h3>
        <div className="flex gap-3">
          <button onClick={() => setTab("checkin")} className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${todayCheckin?.morning ? "bg-indigo-900/50 text-indigo-300 border border-indigo-700/30" : "bg-gray-800 text-gray-400 border border-gray-700"}`}>
            <Sun className="w-3 h-3" /> Morning {todayCheckin?.morning ? "✓" : ""}
          </button>
          <button onClick={() => setTab("checkin")} className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${todayCheckin?.evening ? "bg-purple-900/50 text-purple-300 border border-purple-700/30" : "bg-gray-800 text-gray-400 border border-gray-700"}`}>
            <Moon className="w-3 h-3" /> Evening {todayCheckin?.evening ? "✓" : ""}
          </button>
        </div>
      </div>

      {/* AA Promises */}
      <button onClick={() => setShowPromises(!showPromises)} className="w-full bg-gray-900 rounded-xl p-4 border border-gray-800 text-left">
        <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> The AA Promises {showPromises ? "▴" : "▾"}</h3>
        {showPromises && (
          <div className="mt-3 space-y-2">
            {PROMISES.map((p, i) => (
              <p key={i} className="text-xs text-gray-400 leading-relaxed pl-3 border-l-2 border-yellow-900/50">"{p}"</p>
            ))}
            <p className="text-xs text-yellow-600 italic mt-2">— From the Big Book, pages 83-84</p>
          </div>
        )}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════
// CHECK-IN TAB
// ═══════════════════════════════════════
function CheckInTab({ checkinMode, setCheckinMode, checkIns, setCheckIns, thcDays, setThcDays, thcSoberDate, setThcSoberDate }) {
  const todayKey = today();
  const todayData = checkIns[todayKey] || {};
  const [answers, setAnswers] = useState({});
  const questions = checkinMode === "morning" ? MORNING_QS : EVENING_QS;

  useEffect(() => {
    if (checkinMode && todayData[checkinMode]) setAnswers(todayData[checkinMode]);
    else setAnswers({});
  }, [checkinMode]);

  const saveCheckin = () => {
    const updated = { ...checkIns, [todayKey]: { ...todayData, [checkinMode]: answers } };
    setCheckIns(updated);
    // If evening and THC was used, update THC tracking
    if (checkinMode === "evening" && answers.thc_today === true) {
      setThcDays({ ...thcDays, [todayKey]: true });
      setThcSoberDate(todayKey);
    }
    setCheckinMode(null);
  };

  if (!checkinMode) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Daily Check-in</h2>
        <p className="text-sm text-gray-400">Your daily practice keeps you grounded. Morning sets your intention, evening takes your inventory (Step 10).</p>

        <button onClick={() => setCheckinMode("morning")} className="w-full bg-gradient-to-r from-amber-900/60 to-orange-900/60 rounded-xl p-5 border border-amber-700/30 text-left">
          <div className="flex items-center gap-3">
            <Sun className="w-8 h-8 text-amber-400" />
            <div>
              <h3 className="font-bold text-amber-200">Morning Check-in</h3>
              <p className="text-xs text-amber-400/70 mt-0.5">Set your intention, take your pledge, practice gratitude</p>
            </div>
          </div>
          {todayData.morning && <div className="mt-2 text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed today</div>}
        </button>

        <button onClick={() => setCheckinMode("evening")} className="w-full bg-gradient-to-r from-indigo-900/60 to-purple-900/60 rounded-xl p-5 border border-indigo-700/30 text-left">
          <div className="flex items-center gap-3">
            <Moon className="w-8 h-8 text-indigo-400" />
            <div>
              <h3 className="font-bold text-indigo-200">Evening Inventory</h3>
              <p className="text-xs text-indigo-400/70 mt-0.5">Step 10 daily practice — review your day honestly</p>
            </div>
          </div>
          {todayData.evening && <div className="mt-2 text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed today</div>}
        </button>

        {/* Past check-ins */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Recent Check-ins</h3>
          {Object.keys(checkIns).sort().reverse().slice(0, 7).map(date => (
            <div key={date} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <span className="text-xs text-gray-400">{fmt(date)}</span>
              <div className="flex gap-2">
                {checkIns[date].morning && <span className="text-xs bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded"><Sun className="w-3 h-3 inline" /> AM</span>}
                {checkIns[date].evening && <span className="text-xs bg-indigo-900/30 text-indigo-400 px-2 py-0.5 rounded"><Moon className="w-3 h-3 inline" /> PM</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => setCheckinMode(null)} className="text-gray-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {checkinMode === "morning" ? <><Sun className="w-5 h-5 text-amber-400" /> Morning Check-in</> : <><Moon className="w-5 h-5 text-indigo-400" /> Evening Inventory</>}
        </h2>
      </div>

      {checkinMode === "evening" && (
        <p className="text-xs text-gray-500 italic border-l-2 border-indigo-800 pl-3">"Continued to take personal inventory and when we were wrong promptly admitted it." — Step 10</p>
      )}

      <div className="space-y-4">
        {questions.map(q => (
          <div key={q.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <label className="text-sm font-medium text-gray-200 block mb-2">{q.q}</label>
            {q.type === "toggle" && (
              <button
                onClick={() => setAnswers({ ...answers, [q.id]: !answers[q.id] })}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${answers[q.id] ? "bg-green-900/50 text-green-300 border border-green-700/30" : "bg-gray-800 text-gray-400 border border-gray-700"}`}
              >
                {answers[q.id] ? "✓ Yes" : "Tap to confirm"}
              </button>
            )}
            {q.type === "scale" && (
              <div className="flex gap-1">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => setAnswers({ ...answers, [q.id]: n })}
                    className={`flex-1 py-2 rounded text-xs font-bold transition-all ${answers[q.id] === n ? "bg-indigo-600 text-white" : answers[q.id] >= n ? "bg-indigo-900/40 text-indigo-400" : "bg-gray-800 text-gray-600"}`}>
                    {n}
                  </button>
                ))}
              </div>
            )}
            {q.type === "text" && (
              <textarea
                value={answers[q.id] || ""}
                onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-indigo-600"
                rows={3}
                placeholder="Write your thoughts..."
              />
            )}
          </div>
        ))}
      </div>

      <button onClick={saveCheckin} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
        <Save className="w-4 h-4" /> Save {checkinMode === "morning" ? "Morning" : "Evening"} Check-in
      </button>
    </div>
  );
}

// ═══════════════════════════════════════
// CALENDAR TAB
// ═══════════════════════════════════════
function CalendarTab({ calMonth, setCalMonth, checkIns, thcDays }) {
  const { y, m } = calMonth;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstDay = new Date(y, m, 1).getDay();
  const monthName = new Date(y, m).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prev = () => setCalMonth(m === 0 ? { y: y-1, m: 11 } : { y, m: m-1 });
  const next = () => setCalMonth(m === 11 ? { y: y+1, m: 0 } : { y, m: m+1 });

  const getStatus = (day) => {
    if (!day) return null;
    const key = `${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const isFuture = new Date(key) > new Date();
    if (isFuture) return "future";
    const usedThc = thcDays[key];
    const hasCheckin = checkIns[key];
    if (usedThc) return "thc";
    if (hasCheckin) return "clean";
    return "none";
  };

  const statusColors = {
    clean: "bg-green-900/60 text-green-300 border-green-700/40",
    thc: "bg-amber-900/60 text-amber-300 border-amber-700/40",
    none: "bg-gray-800/40 text-gray-500 border-gray-800",
    future: "bg-gray-900/20 text-gray-700 border-gray-900",
  };

  // Count stats for month
  const monthStats = useMemo(() => {
    let clean = 0, thc = 0, checkins = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      if (thcDays[key]) thc++;
      if (checkIns[key]) { checkins++; if (!thcDays[key]) clean++; }
    }
    return { clean, thc, checkins };
  }, [y, m, thcDays, checkIns, daysInMonth]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={prev} className="p-2 text-gray-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
        <h2 className="text-lg font-bold text-white">{monthName}</h2>
        <button onClick={next} className="p-2 text-gray-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-800 inline-block" /> Clean</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-800 inline-block" /> THC Use</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-800 inline-block" /> No Data</span>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-xs font-semibold text-gray-600 py-1">{d}</div>
        ))}
        {cells.map((day, i) => {
          const status = getStatus(day);
          const isToday = day && toKey(new Date(y, m, day)) === today();
          return (
            <div key={i} className={`aspect-square flex items-center justify-center rounded-lg text-xs font-semibold border transition-all ${day ? statusColors[status] || statusColors.none : ""} ${isToday ? "ring-2 ring-indigo-500" : ""}`}>
              {day || ""}
            </div>
          );
        })}
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="bg-green-900/20 rounded-lg p-3 text-center border border-green-800/30">
          <div className="text-2xl font-bold text-green-400">{monthStats.clean}</div>
          <div className="text-xs text-green-500">Clean Days</div>
        </div>
        <div className="bg-amber-900/20 rounded-lg p-3 text-center border border-amber-800/30">
          <div className="text-2xl font-bold text-amber-400">{monthStats.thc}</div>
          <div className="text-xs text-amber-500">THC Days</div>
        </div>
        <div className="bg-indigo-900/20 rounded-lg p-3 text-center border border-indigo-800/30">
          <div className="text-2xl font-bold text-indigo-400">{monthStats.checkins}</div>
          <div className="text-xs text-indigo-500">Check-ins</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// 12 STEPS TAB
// ═══════════════════════════════════════
function StepsTab({ activeStep, setActiveStep, stepData, setStepData }) {
  if (activeStep !== null) {
    const s = STEPS.find(x => x.num === activeStep);
    const data = stepData[s.num] || { completed: false, notes: {}, exerciseDone: {} };

    const updateData = (patch) => {
      setStepData({ ...stepData, [s.num]: { ...data, ...patch } });
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveStep(null)} className="text-gray-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
          <h2 className="text-lg font-bold text-white">Step {s.num}: {s.title}</h2>
        </div>

        {/* The Step */}
        <div className="bg-indigo-900/30 rounded-xl p-4 border border-indigo-700/30">
          <p className="text-sm text-indigo-200 italic leading-relaxed">"{s.step}"</p>
        </div>

        {/* About */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Understanding This Step</h3>
          <p className="text-sm text-gray-400 leading-relaxed">{s.about}</p>
          {s.requiresWriting && <p className="mt-2 text-xs text-amber-400 flex items-center gap-1"><PenLine className="w-3 h-3" /> This step involves written work</p>}
        </div>

        {/* Exercises */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Exercises & Assignments</h3>
          <div className="space-y-3">
            {s.exercises.map((ex, i) => (
              <div key={i} className="flex gap-2">
                <button onClick={() => updateData({ exerciseDone: { ...data.exerciseDone, [i]: !data.exerciseDone?.[i] } })} className="mt-0.5 flex-shrink-0">
                  {data.exerciseDone?.[i] ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-600" />}
                </button>
                <p className={`text-sm leading-relaxed ${data.exerciseDone?.[i] ? "text-gray-500 line-through" : "text-gray-300"}`}>{ex}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reflection Questions */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Reflection Questions</h3>
          <div className="space-y-4">
            {s.questions.map((q, i) => (
              <div key={i}>
                <p className="text-sm text-indigo-300 font-medium mb-1">{q}</p>
                <textarea
                  value={data.notes?.[`q${i}`] || ""}
                  onChange={e => updateData({ notes: { ...data.notes, [`q${i}`]: e.target.value } })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-indigo-600"
                  rows={3}
                  placeholder="Write your answer..."
                />
              </div>
            ))}
          </div>
        </div>

        {/* Step Journal */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Step {s.num} Journal</h3>
          <textarea
            value={data.notes?.journal || ""}
            onChange={e => updateData({ notes: { ...data.notes, journal: e.target.value } })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-indigo-600"
            rows={6}
            placeholder={`Free-write about your Step ${s.num} experience...`}
          />
        </div>

        {/* Mark Complete */}
        <button
          onClick={() => updateData({ completed: !data.completed, completedDate: !data.completed ? today() : null })}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${data.completed ? "bg-green-900/50 text-green-300 border border-green-700/30" : "bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"}`}
        >
          {data.completed ? <><CheckCircle2 className="w-5 h-5" /> Step {s.num} Completed — {fmt(data.completedDate)}</> : <><Circle className="w-5 h-5" /> Mark Step {s.num} as Complete</>}
        </button>
      </div>
    );
  }

  // Steps List
  const completedCount = STEPS.filter(s => stepData[s.num]?.completed).length;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">The 12 Steps</h2>
      <p className="text-sm text-gray-400">Work these steps with your sponsor. Each step builds on the last. Take your time — there's no deadline.</p>

      {/* Progress */}
      <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>{completedCount} / 12</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${(completedCount/12)*100}%` }} />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map(s => {
          const data = stepData[s.num] || {};
          const hasNotes = data.notes && Object.values(data.notes).some(v => v);
          return (
            <button key={s.num} onClick={() => setActiveStep(s.num)} className="w-full bg-gray-900 rounded-xl p-4 border border-gray-800 text-left hover:border-gray-700 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${data.completed ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                  {data.completed ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-200">Step {s.num}: {s.title}</h3>
                    {s.requiresWriting && <PenLine className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{s.step}</p>
                  {hasNotes && <span className="text-xs text-indigo-500 mt-1 inline-block">Has notes</span>}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// JOURNAL TAB
// ═══════════════════════════════════════
function JournalTab({ journal, setJournal }) {
  const [writing, setWriting] = useState(false);
  const [entry, setEntry] = useState("");
  const [entryType, setEntryType] = useState("reflection");

  const PROMPTS = [
    "What am I grateful for in my sobriety today?",
    "What patterns have I noticed in my recovery?",
    "How have my relationships changed since getting sober?",
    "What does freedom mean to me now?",
    "What was the hardest part of my week and how did I handle it?",
    "Write a letter to my past self about where I am now.",
    "What triggers did I notice this week and how did I respond?",
    "How has my self-image changed in recovery?",
  ];
  const [prompt, setPrompt] = useState("");

  const saveEntry = () => {
    if (!entry.trim()) return;
    const newEntry = { id: Date.now(), date: today(), content: entry, type: entryType, prompt: prompt || null };
    setJournal([newEntry, ...journal]);
    setEntry("");
    setPrompt("");
    setWriting(false);
  };

  const deleteEntry = (id) => {
    setJournal(journal.filter(j => j.id !== id));
  };

  if (writing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setWriting(false)} className="text-gray-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
          <h2 className="text-xl font-bold text-white">New Journal Entry</h2>
        </div>

        {/* Type selector */}
        <div className="flex gap-2">
          {[["reflection", "Reflection"], ["gratitude", "Gratitude"], ["trigger", "Trigger Log"], ["free", "Free Write"]].map(([val, label]) => (
            <button key={val} onClick={() => setEntryType(val)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${entryType === val ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400"}`}>{label}</button>
          ))}
        </div>

        {/* Prompt suggestions */}
        <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
          <p className="text-xs text-gray-500 mb-2">Need a prompt? Tap one:</p>
          <div className="space-y-1">
            {PROMPTS.map((p, i) => (
              <button key={i} onClick={() => { setPrompt(p); if (!entry) setEntry(""); }} className={`block w-full text-left text-xs py-1.5 px-2 rounded transition-colors ${prompt === p ? "bg-indigo-900/40 text-indigo-300" : "text-gray-400 hover:bg-gray-800"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {prompt && <p className="text-sm text-indigo-300 italic border-l-2 border-indigo-700 pl-3">{prompt}</p>}

        <textarea
          value={entry}
          onChange={e => setEntry(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-indigo-600"
          rows={10}
          placeholder="Write freely. This is your safe space..."
          autoFocus
        />

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">{entry.split(/\s+/).filter(Boolean).length} words</span>
          <button onClick={saveEntry} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition-colors">
            <Save className="w-4 h-4" /> Save Entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Journal</h2>
        <button onClick={() => setWriting(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1 transition-colors">
          <Plus className="w-4 h-4" /> New Entry
        </button>
      </div>

      <p className="text-sm text-gray-400">Writing is one of the most powerful tools in recovery. Get honest on paper.</p>

      {journal.length === 0 ? (
        <div className="text-center py-12">
          <PenLine className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">No journal entries yet.</p>
          <p className="text-gray-600 text-sm">Tap "New Entry" to start writing.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {journal.map(j => (
            <div key={j.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs text-gray-500">{fmt(j.date)}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    j.type === "gratitude" ? "bg-yellow-900/30 text-yellow-400" :
                    j.type === "trigger" ? "bg-red-900/30 text-red-400" :
                    j.type === "reflection" ? "bg-indigo-900/30 text-indigo-400" :
                    "bg-gray-800 text-gray-400"
                  }`}>{j.type}</span>
                </div>
                <button onClick={() => deleteEntry(j.id)} className="text-gray-700 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
              {j.prompt && <p className="text-xs text-indigo-400/70 italic mb-1">{j.prompt}</p>}
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{j.content.length > 200 ? j.content.slice(0, 200) + "..." : j.content}</p>
              <span className="text-xs text-gray-600 mt-1 block">{j.content.split(/\s+/).filter(Boolean).length} words</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
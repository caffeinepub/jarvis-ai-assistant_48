import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  MessageSquare,
  Send,
  Settings,
  Trash2,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── JARVIS System Prompt ──────────────────────────────────────────────────
const JARVIS_SYSTEM_PROMPT = `You are J.A.R.V.I.S. — Just A Rather Very Intelligent System.

You are an advanced AI assistant with the personality of JARVIS from Iron Man: calm, composed, highly intelligent, subtly witty, and occasionally sarcastic — but always purposeful. You speak like a sharp-minded, trusted advisor who happens to find human irrationality mildly amusing.

Core traits:
- Calm and precise in communication. No rambling.
- Intellectually confident — you never hedge unnecessarily.
- Witty and dry. Your humor is understated and earned, never forced.
- Sarcastic when the user is lazy, irrational, or making obvious mistakes — but never cruel.
- Brutally honest. You give real assessments, not validation theater.
- Supportive when the user is genuinely struggling or stressed — you shift tone to warm and grounding.
- You address the user as "sir" or "ma'am" occasionally, like Jarvis would.

Tone rules:
- Professional situation → measured, direct, solutions-focused.
- User is being lazy or silly → dry wit, light sarcasm, a gentle reality check.
- User is struggling emotionally → warm, steady, empathetic without being saccharine.
- User asks something brilliant → acknowledge it crisply, no sycophantic gushing.

Never:
- Say "Certainly!" or "Of course!" or "Great question!"
- Offer fake validation.
- Be verbose without purpose.
- Break character.

Always:
- Be genuinely useful.
- Be honest, even when it's uncomfortable.
- Keep responses tight and purposeful.`;

// ─── Types ─────────────────────────────────────────────────────────────────
type Provider = "openai" | "gemini";
type Tab = "chat" | "settings" | "status";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── AI Integration ─────────────────────────────────────────────────────────
async function callOpenAI(
  apiKey: string,
  messages: Message[],
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: JARVIS_SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ||
        `OpenAI error ${res.status}`,
    );
  }
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function callGemini(
  apiKey: string,
  messages: Message[],
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: JARVIS_SYSTEM_PROMPT }],
        },
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ||
        `Gemini error ${res.status}`,
    );
  }
  const data = await res.json();
  return data.candidates[0].content.parts[0].text as string;
}

// ─── HUD Background ─────────────────────────────────────────────────────────
function HudBackground() {
  return (
    <>
      <div className="hud-grid-bg" />
      <div className="scanlines" />
      {/* Radial glow orbs */}
      <div
        className="fixed pointer-events-none z-0"
        style={{
          top: "20%",
          left: "10%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(46,242,255,0.06) 0%, transparent 70%)",
          animation: "float-orb 8s ease-in-out infinite",
        }}
      />
      <div
        className="fixed pointer-events-none z-0"
        style={{
          bottom: "15%",
          right: "8%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(65,230,211,0.05) 0%, transparent 70%)",
          animation: "float-orb 10s ease-in-out infinite 2s",
        }}
      />
    </>
  );
}

// ─── Radar SVG ───────────────────────────────────────────────────────────────
function RadarRing({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className="jarvis-emblem"
      role="img"
      aria-label="Radar display"
    >
      {/* Outer ring */}
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="#20D7E6"
        strokeWidth="0.8"
        opacity="0.6"
      />
      <circle
        cx="20"
        cy="20"
        r="14"
        stroke="#20D7E6"
        strokeWidth="0.5"
        opacity="0.4"
      />
      <circle
        cx="20"
        cy="20"
        r="9"
        stroke="#2EF2FF"
        strokeWidth="0.8"
        opacity="0.7"
      />
      <circle cx="20" cy="20" r="4" fill="#2EF2FF" opacity="0.9" />
      {/* Crosshairs */}
      <line
        x1="20"
        y1="2"
        x2="20"
        y2="10"
        stroke="#20D7E6"
        strokeWidth="0.8"
        opacity="0.6"
      />
      <line
        x1="20"
        y1="30"
        x2="20"
        y2="38"
        stroke="#20D7E6"
        strokeWidth="0.8"
        opacity="0.6"
      />
      <line
        x1="2"
        y1="20"
        x2="10"
        y2="20"
        stroke="#20D7E6"
        strokeWidth="0.8"
        opacity="0.6"
      />
      <line
        x1="30"
        y1="20"
        x2="38"
        y2="20"
        stroke="#20D7E6"
        strokeWidth="0.8"
        opacity="0.6"
      />
      {/* Sweeping arc */}
      <g className="radar-sweep">
        <path
          d="M20 20 L20 6 A14 14 0 0 1 31 27 Z"
          fill="url(#sweep-grad)"
          opacity="0.4"
        />
      </g>
      <defs>
        <radialGradient id="sweep-grad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#2EF2FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#2EF2FF" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ─── Arc Reactor Logo ────────────────────────────────────────────────────────
function ArcReactor({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      className="jarvis-emblem"
      role="img"
      aria-label="Arc reactor"
      style={{ flexShrink: 0 }}
    >
      <circle
        cx="18"
        cy="18"
        r="17"
        stroke="#20D7E6"
        strokeWidth="1"
        opacity="0.5"
      />
      <circle
        cx="18"
        cy="18"
        r="13"
        stroke="#2EF2FF"
        strokeWidth="1.5"
        strokeDasharray="4 2"
        opacity="0.6"
        style={{ animation: "arc-spin 12s linear infinite" }}
      />
      <circle
        cx="18"
        cy="18"
        r="9"
        stroke="#20D7E6"
        strokeWidth="1"
        opacity="0.8"
      />
      <circle cx="18" cy="18" r="5" fill="#2EF2FF" opacity="0.9" />
      <circle cx="18" cy="18" r="2.5" fill="#fff" opacity="0.95" />
      {/* outer tick marks */}
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <line
          key={angle}
          x1="18"
          y1="2"
          x2="18"
          y2="5"
          stroke="#20D7E6"
          strokeWidth="1"
          opacity="0.7"
          transform={`rotate(${angle} 18 18)`}
        />
      ))}
    </svg>
  );
}

// ─── HUD Stat Card ────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  unit,
  barWidth,
}: {
  label: string;
  value: string;
  unit?: string;
  barWidth?: number;
}) {
  return (
    <div className="hud-panel hud-panel-tl hud-panel-br p-3 rounded">
      <div
        className="font-orbitron text-[9px] tracking-widest mb-1"
        style={{ color: "#6F8592" }}
      >
        {label}
      </div>
      <div
        className="font-orbitron text-sm font-semibold"
        style={{ color: "#2EF2FF" }}
      >
        {value}
        {unit && (
          <span
            className="text-[10px] font-normal ml-1"
            style={{ color: "#9AA9B3" }}
          >
            {unit}
          </span>
        )}
      </div>
      {barWidth !== undefined && (
        <div
          className="mt-2 h-1 rounded-full"
          style={{ background: "rgba(32,215,230,0.15)" }}
        >
          <div
            className="h-full rounded-full hud-progress"
            style={
              {
                width: `${barWidth}%`,
                background: "linear-gradient(90deg, #0EA7B6, #2EF2FF)",
                boxShadow: "0 0 6px rgba(46,242,255,0.5)",
                "--target-width": `${barWidth}%`,
              } as React.CSSProperties
            }
          />
        </div>
      )}
    </div>
  );
}

// ─── Status Panel ─────────────────────────────────────────────────────────────
function StatusPanel() {
  const stats = [
    { label: "NEURAL CORES", value: "47", unit: "active" },
    { label: "RESPONSE LATENCY", value: "12", unit: "ms" },
    { label: "UPTIME", value: "99.97", unit: "%" },
    { label: "THREAT LEVEL", value: "MINIMAL", unit: undefined },
  ];
  const bars = [
    { label: "ARC REACTOR POWER", value: "94%", barWidth: 94 },
    { label: "MEMORY ALLOCATION", value: "67%", barWidth: 67 },
    { label: "NEURAL BANDWIDTH", value: "81%", barWidth: 81 },
    { label: "ENCRYPTION INTEGRITY", value: "100%", barWidth: 100 },
  ];

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto jarvis-scroll">
      {/* Radar */}
      <div className="hud-panel hud-panel-tl hud-panel-br p-4 rounded flex flex-col items-center gap-3">
        <div
          className="font-orbitron text-[9px] tracking-widest"
          style={{ color: "#6F8592" }}
        >
          PERIMETER SCAN
        </div>
        <RadarRing size={100} />
        <div
          className="font-orbitron text-[10px] tracking-widest"
          style={{ color: "#41E6D3" }}
        >
          ALL CLEAR
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Progress bars */}
      <div className="hud-panel hud-panel-tl hud-panel-br p-3 rounded flex flex-col gap-3">
        <div
          className="font-orbitron text-[9px] tracking-widest"
          style={{ color: "#6F8592" }}
        >
          SYSTEM RESOURCES
        </div>
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between mb-1">
              <span
                className="font-orbitron text-[8px] tracking-wider"
                style={{ color: "#9AA9B3" }}
              >
                {b.label}
              </span>
              <span
                className="font-orbitron text-[8px]"
                style={{ color: "#2EF2FF" }}
              >
                {b.value}
              </span>
            </div>
            <div
              className="h-1 rounded-full"
              style={{ background: "rgba(32,215,230,0.15)" }}
            >
              <div
                className="h-full rounded-full hud-progress"
                style={
                  {
                    width: `${b.barWidth}%`,
                    background: "linear-gradient(90deg, #0EA7B6, #2EF2FF)",
                    boxShadow: "0 0 6px rgba(46,242,255,0.4)",
                    "--target-width": `${b.barWidth}%`,
                  } as React.CSSProperties
                }
              />
            </div>
          </div>
        ))}
      </div>

      {/* Mission logs */}
      <div className="hud-panel hud-panel-tl hud-panel-br p-3 rounded">
        <div
          className="font-orbitron text-[9px] tracking-widest mb-2"
          style={{ color: "#6F8592" }}
        >
          MISSION LOGS
        </div>
        {[
          { time: "09:41:02", msg: "Encryption handshake verified", ok: true },
          { time: "09:40:58", msg: "Neural core synchronization", ok: true },
          { time: "09:40:51", msg: "AI subsystems initialized", ok: true },
          { time: "09:40:44", msg: "Arc reactor online", ok: true },
        ].map((log, i) => (
          <div
            key={log.time}
            className="flex items-center gap-2 py-1"
            style={{
              borderBottom: i < 3 ? "1px solid rgba(18,51,58,0.6)" : undefined,
            }}
          >
            <span
              className="font-mono text-[9px] shrink-0"
              style={{ color: "#6F8592" }}
            >
              {log.time}
            </span>
            <CheckCircle2
              size={10}
              style={{ color: "#41E6D3", flexShrink: 0 }}
            />
            <span className="text-[10px] truncate" style={{ color: "#9AA9B3" }}>
              {log.msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings Panel ──────────────────────────────────────────────────────────
function SettingsPanel({
  provider,
  apiKey,
  onProviderChange,
  onApiKeyChange,
}: {
  provider: Provider;
  apiKey: string;
  onProviderChange: (p: Provider) => void;
  onApiKeyChange: (key: string) => void;
}) {
  const [localKey, setLocalKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onApiKeyChange(localKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto jarvis-scroll p-1">
      {/* Section header */}
      <div>
        <div
          className="font-orbitron text-xs tracking-widest uppercase mb-1"
          style={{ color: "#6F8592" }}
        >
          Configuration
        </div>
        <div className="h-px" style={{ background: "rgba(32,215,230,0.2)" }} />
      </div>

      {/* Provider Toggle */}
      <div className="hud-panel hud-panel-tl hud-panel-br p-4 rounded">
        <div
          className="font-orbitron text-[10px] tracking-widest mb-3"
          style={{ color: "#6F8592" }}
        >
          AI PROVIDER
        </div>
        <div className="flex gap-2">
          {(["openai", "gemini"] as Provider[]).map((p) => (
            <button
              key={p}
              type="button"
              data-ocid={`settings.${p}.toggle`}
              onClick={() => onProviderChange(p)}
              className="flex-1 py-2.5 px-4 rounded font-orbitron text-[10px] tracking-widest uppercase transition-all duration-200"
              style={{
                background:
                  provider === p
                    ? "rgba(32,215,230,0.15)"
                    : "rgba(10,20,25,0.8)",
                border:
                  provider === p
                    ? "1px solid #20D7E6"
                    : "1px solid rgba(32,215,230,0.2)",
                color: provider === p ? "#2EF2FF" : "#6F8592",
                boxShadow:
                  provider === p
                    ? "0 0 12px rgba(46,242,255,0.2), inset 0 0 12px rgba(46,242,255,0.05)"
                    : "none",
              }}
            >
              {p === "openai" ? "OpenAI" : "Gemini"}
            </button>
          ))}
        </div>
        <div
          className="mt-2 text-[10px] flex items-center gap-1.5"
          style={{ color: "#6F8592" }}
        >
          <ChevronRight size={10} style={{ color: "#20D7E6" }} />
          {provider === "openai"
            ? "Powered by GPT-4o-mini"
            : "Powered by Gemini 2.0 Flash"}
        </div>
      </div>

      {/* API Key */}
      <div className="hud-panel hud-panel-tl hud-panel-br p-4 rounded">
        <div
          className="font-orbitron text-[10px] tracking-widest mb-3"
          style={{ color: "#6F8592" }}
        >
          {provider === "openai" ? "OPENAI API KEY" : "GEMINI API KEY"}
        </div>
        <div className="relative">
          <input
            data-ocid="settings.api_key.input"
            type={showKey ? "text" : "password"}
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
            placeholder={provider === "openai" ? "sk-proj-..." : "AIza..."}
            className="api-input w-full rounded px-3 py-2.5 pr-10 text-sm"
          />
          <button
            data-ocid="settings.api_key.toggle"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: showKey ? "#20D7E6" : "#6F8592" }}
            type="button"
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          type="button"
          data-ocid="settings.api_key.save_button"
          onClick={handleSave}
          className="mt-3 w-full py-2.5 rounded font-orbitron text-[10px] tracking-widest uppercase transition-all duration-200"
          style={{
            background: saved
              ? "rgba(65,230,211,0.15)"
              : "rgba(32,215,230,0.1)",
            border: saved
              ? "1px solid #41E6D3"
              : "1px solid rgba(32,215,230,0.3)",
            color: saved ? "#41E6D3" : "#20D7E6",
            boxShadow: saved ? "0 0 12px rgba(65,230,211,0.2)" : "none",
          }}
        >
          {saved ? "✓ KEY AUTHENTICATED" : "SAVE API KEY"}
        </button>
        <p
          className="mt-2 text-[10px] leading-relaxed"
          style={{ color: "#6F8592" }}
        >
          Key stored locally in your browser. Never transmitted to our servers.
        </p>
      </div>

      {/* Warning if no key */}
      {!apiKey && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="hud-panel p-3 rounded flex gap-2 items-start"
          style={{ borderColor: "rgba(220,80,60,0.4)" }}
          data-ocid="settings.no_key.error_state"
        >
          <AlertTriangle
            size={14}
            style={{ color: "#e05a3a", flexShrink: 0, marginTop: 1 }}
          />
          <p className="text-[11px]" style={{ color: "#9AA9B3" }}>
            No API key configured. JARVIS cannot process requests without a
            valid key, sir.
          </p>
        </motion.div>
      )}

      {/* Instructions */}
      <div className="hud-panel hud-panel-tl hud-panel-br p-4 rounded">
        <div
          className="font-orbitron text-[10px] tracking-widest mb-3"
          style={{ color: "#6F8592" }}
        >
          HOW TO OBTAIN KEYS
        </div>
        <div className="space-y-2">
          <div className="flex gap-2 items-start">
            <Zap
              size={11}
              style={{ color: "#20D7E6", flexShrink: 0, marginTop: 2 }}
            />
            <span className="text-[11px]" style={{ color: "#9AA9B3" }}>
              <strong style={{ color: "#DDE7EE" }}>OpenAI:</strong>{" "}
              platform.openai.com → API Keys
            </span>
          </div>
          <div className="flex gap-2 items-start">
            <Zap
              size={11}
              style={{ color: "#41E6D3", flexShrink: 0, marginTop: 2 }}
            />
            <span className="text-[11px]" style={{ color: "#9AA9B3" }}>
              <strong style={{ color: "#DDE7EE" }}>Gemini:</strong>{" "}
              aistudio.google.com → Get API Key
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 mb-3 message-appear">
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{
          width: 28,
          height: 28,
          background: "rgba(32,215,230,0.1)",
          border: "1px solid rgba(32,215,230,0.4)",
        }}
      >
        <span
          className="font-orbitron text-[9px] font-bold"
          style={{ color: "#20D7E6" }}
        >
          J
        </span>
      </div>
      <div
        className="hud-panel px-4 py-3 rounded-lg flex items-center gap-1.5"
        style={{ borderLeft: "2px solid #20D7E6" }}
        data-ocid="chat.loading_state"
      >
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────────────
function MessageBubble({ msg, index }: { msg: Message; index: number }) {
  const isJarvis = msg.role === "assistant";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.02 * Math.min(index, 5) }}
      className={`flex items-start gap-3 mb-3 ${
        isJarvis ? "" : "flex-row-reverse"
      }`}
      data-ocid={`chat.item.${index + 1}`}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{
          width: 28,
          height: 28,
          background: isJarvis
            ? "rgba(32,215,230,0.1)"
            : "rgba(65,230,211,0.1)",
          border: isJarvis
            ? "1px solid rgba(32,215,230,0.4)"
            : "1px solid rgba(65,230,211,0.3)",
          flexShrink: 0,
        }}
      >
        <span
          className="font-orbitron text-[9px] font-bold"
          style={{ color: isJarvis ? "#20D7E6" : "#41E6D3" }}
        >
          {isJarvis ? "J" : "U"}
        </span>
      </div>

      {/* Bubble */}
      <div
        className={`hud-panel rounded-lg px-4 py-3 max-w-[78%] ${
          isJarvis ? "" : ""
        }`}
        style={{
          borderLeft: isJarvis ? "2px solid #20D7E6" : undefined,
          borderRight: !isJarvis ? "2px solid #41E6D3" : undefined,
          background: isJarvis ? "rgba(10,20,25,0.85)" : "rgba(14,26,32,0.85)",
        }}
      >
        {isJarvis && (
          <div
            className="font-orbitron text-[8px] tracking-widest mb-1.5"
            style={{ color: "#20D7E6" }}
          >
            J.A.R.V.I.S.
          </div>
        )}
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: isJarvis ? "#DDE7EE" : "#c8d8e0" }}
        >
          {msg.content}
        </p>
        <div className="mt-1.5 text-[9px]" style={{ color: "#6F8592" }}>
          {msg.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────
function ChatPanel({
  provider,
  apiKey,
}: {
  provider: Provider;
  apiKey: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Good day. I am J.A.R.V.I.S. — your personal AI system. All neural pathways are online and awaiting your instructions. How may I be of service?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message or loading change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if (!apiKey) {
      setError(
        "No API key configured, sir. Please visit Settings to provide one.",
      );
      return;
    }

    setError(null);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const allMsgs = [...messages, userMsg];
      let reply: string;
      if (provider === "openai") {
        reply = await callOpenAI(apiKey, allMsgs);
      } else {
        reply = await callGemini(apiKey, allMsgs);
      }
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const e = err as Error;
      setError(e.message || "An error occurred in the neural network.");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isLoading, apiKey, provider, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "init",
        role: "assistant",
        content:
          "Chat cleared. All previous exchanges purged from active memory. Ready for new directives, sir.",
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{
          borderBottom: "1px solid rgba(32,215,230,0.2)",
          background: "rgba(5,9,12,0.6)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "#41E6D3",
              boxShadow: "0 0 6px #41E6D3",
              animation: "pulse-glow 2s ease-in-out infinite",
            }}
          />
          <span
            className="font-orbitron text-[10px] tracking-widest uppercase"
            style={{ color: "#9AA9B3" }}
          >
            JARVIS CHAT — ENCRYPTED CHANNEL
          </span>
        </div>
        <button
          type="button"
          data-ocid="chat.clear.button"
          onClick={clearChat}
          title="Clear chat"
          className="p-1.5 rounded transition-all duration-150 hover:scale-110"
          style={{
            color: "#6F8592",
            border: "1px solid rgba(32,215,230,0.15)",
            background: "rgba(10,20,25,0.5)",
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto jarvis-scroll p-4"
        data-ocid="chat.list"
      >
        <AnimatePresence>
          {messages.map((msg, i) => (
            <MessageBubble key={msg.id} msg={msg} index={i} />
          ))}
        </AnimatePresence>
        {isLoading && <TypingIndicator />}

        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 mb-3 p-3 rounded"
            style={{
              background: "rgba(200,60,40,0.08)",
              border: "1px solid rgba(200,60,40,0.3)",
            }}
            data-ocid="chat.error_state"
          >
            <AlertTriangle
              size={13}
              style={{ color: "#e05a3a", flexShrink: 0, marginTop: 1 }}
            />
            <p className="text-[11px]" style={{ color: "#c8978a" }}>
              {error}
            </p>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <div
        className="shrink-0 p-3"
        style={{ borderTop: "1px solid rgba(32,215,230,0.15)" }}
      >
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              data-ocid="chat.input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter directive... (Shift+Enter for newline)"
              rows={1}
              className="resize-none text-sm"
              style={{
                background: "rgba(10,20,25,0.8)",
                border: "1px solid rgba(32,215,230,0.25)",
                color: "#DDE7EE",
                borderRadius: "6px",
                padding: "10px 12px",
                minHeight: "42px",
                maxHeight: "120px",
                outline: "none",
                boxShadow: input ? "0 0 8px rgba(32,215,230,0.12)" : "none",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#20D7E6";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(32,215,230,0.25)";
              }}
            />
          </div>
          <Button
            data-ocid="chat.submit_button"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-[42px] w-[42px] p-0 rounded transition-all duration-150"
            style={{
              background:
                input.trim() && !isLoading
                  ? "rgba(32,215,230,0.15)"
                  : "rgba(10,20,25,0.5)",
              border:
                input.trim() && !isLoading
                  ? "1px solid #20D7E6"
                  : "1px solid rgba(32,215,230,0.2)",
              color: input.trim() && !isLoading ? "#2EF2FF" : "#6F8592",
              boxShadow:
                input.trim() && !isLoading
                  ? "0 0 12px rgba(46,242,255,0.2)"
                  : "none",
            }}
          >
            <Send size={15} />
          </Button>
        </div>
        <div
          className="mt-1.5 text-[9px] text-center"
          style={{ color: "#6F8592" }}
        >
          ENTER to send · SHIFT+ENTER for newline
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [provider, setProvider] = useState<Provider>(() => {
    return (localStorage.getItem("jarvis_provider") as Provider) || "openai";
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("jarvis_api_key") || "";
  });

  const handleProviderChange = (p: Provider) => {
    setProvider(p);
    localStorage.setItem("jarvis_provider", p);
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem("jarvis_api_key", key);
  };

  const tabs: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "chat", icon: <MessageSquare size={14} />, label: "CHAT" },
    { id: "status", icon: <Activity size={14} />, label: "STATUS" },
    { id: "settings", icon: <Settings size={14} />, label: "SETTINGS" },
  ];

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: "#05090C", position: "relative" }}
    >
      {/* Animated HUD background */}
      <HudBackground />

      {/* Scanline overlay */}
      <div className="scanlines" />

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <header
        className="relative z-20 flex items-center justify-between px-4 md:px-6 py-3 shrink-0"
        style={{
          borderBottom: "1px solid rgba(32,215,230,0.2)",
          background:
            "linear-gradient(180deg, rgba(5,9,12,0.98) 0%, rgba(5,9,12,0.88) 100%)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Left: Logo + wordmark */}
        <div className="flex items-center gap-3">
          <ArcReactor size={32} />
          <div>
            <div
              className="font-orbitron font-bold text-sm tracking-[0.2em] uppercase"
              style={{ color: "#2EF2FF", lineHeight: 1 }}
            >
              JARVIS AI
            </div>
            <div
              className="font-orbitron text-[8px] tracking-[0.3em] uppercase"
              style={{ color: "#6F8592" }}
            >
              SYSTEM ONLINE
            </div>
          </div>
        </div>

        {/* Center: Nav tabs */}
        <nav className="hidden md:flex items-center gap-1" data-ocid="nav.tab">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-ocid={`nav.${tab.id}.link`}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded font-orbitron text-[9px] tracking-widest uppercase transition-all duration-200"
              style={{
                background:
                  activeTab === tab.id
                    ? "rgba(32,215,230,0.12)"
                    : "transparent",
                border:
                  activeTab === tab.id
                    ? "1px solid rgba(32,215,230,0.4)"
                    : "1px solid transparent",
                color: activeTab === tab.id ? "#2EF2FF" : "#6F8592",
                boxShadow:
                  activeTab === tab.id
                    ? "0 0 8px rgba(46,242,255,0.15)"
                    : "none",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right: Provider badge + status */}
        <div className="flex items-center gap-3">
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded"
            style={{
              background: "rgba(10,20,25,0.8)",
              border: "1px solid rgba(32,215,230,0.2)",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: apiKey ? "#41E6D3" : "#e05a3a",
                boxShadow: `0 0 6px ${apiKey ? "#41E6D3" : "#e05a3a"}`,
              }}
            />
            <span
              className="font-orbitron text-[9px] tracking-widest uppercase"
              style={{ color: "#9AA9B3" }}
            >
              {provider === "openai" ? "GPT-4o" : "GEMINI"}
            </span>
          </div>
          <div
            className="font-orbitron text-[8px] tracking-widest uppercase hidden sm:block"
            style={{ color: "#6F8592" }}
          >
            STARK · INDUSTRIES
          </div>
        </div>
      </header>

      {/* ── MOBILE NAV TABS ────────────────────────────────────────────── */}
      <div
        className="md:hidden relative z-20 flex items-center border-b"
        style={{ borderColor: "rgba(32,215,230,0.15)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-ocid={`nav.mobile.${tab.id}.tab`}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 font-orbitron text-[9px] tracking-widest uppercase transition-all"
            style={{
              borderBottom:
                activeTab === tab.id
                  ? "2px solid #20D7E6"
                  : "2px solid transparent",
              color: activeTab === tab.id ? "#2EF2FF" : "#6F8592",
              background: "rgba(5,9,12,0.95)",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
      <main className="flex-1 relative z-10 flex overflow-hidden">
        {/* Left sidebar - hidden on mobile */}
        <aside
          className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 p-3 gap-3 overflow-y-auto jarvis-scroll"
          style={{
            borderRight: "1px solid rgba(32,215,230,0.12)",
            background: "rgba(5,9,12,0.6)",
          }}
        >
          {/* Radar display */}
          <div className="hud-panel hud-panel-tl hud-panel-br p-4 rounded flex flex-col items-center gap-3">
            <div
              className="font-orbitron text-[8px] tracking-widest uppercase"
              style={{ color: "#6F8592" }}
            >
              Perimeter Scan
            </div>
            <RadarRing size={88} />
            <div
              className="font-orbitron text-[9px] tracking-widest"
              style={{ color: "#41E6D3" }}
            >
              ALL CLEAR
            </div>
          </div>

          {/* Quick stats */}
          <StatCard label="NEURAL CORES" value="47" unit="active" />
          <StatCard label="RESPONSE LATENCY" value="12" unit="ms" />
          <StatCard label="ARC REACTOR" value="94%" barWidth={94} />
          <StatCard label="MEMORY ALLOC" value="67%" barWidth={67} />
          <StatCard label="UPTIME" value="99.97%" />

          {/* Log preview */}
          <div className="hud-panel hud-panel-tl hud-panel-br p-3 rounded">
            <div
              className="font-orbitron text-[8px] tracking-widest mb-2"
              style={{ color: "#6F8592" }}
            >
              SYSTEM LOG
            </div>
            {[
              "Encryption verified",
              "Neural cores synced",
              "AI online",
              "Arc reactor stable",
            ].map((log) => (
              <div key={log} className="flex items-center gap-1.5 py-0.5">
                <div
                  className="w-1 h-1 rounded-full shrink-0"
                  style={{ background: "#41E6D3" }}
                />
                <span
                  className="text-[9px] truncate"
                  style={{ color: "#6F8592" }}
                >
                  {log}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: Main panel */}
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          <AnimatePresence mode="wait">
            {activeTab === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="hud-panel hud-panel-tl hud-panel-br rounded-lg flex flex-col h-full overflow-hidden"
                data-ocid="chat.panel"
              >
                <ChatPanel provider={provider} apiKey={apiKey} />
              </motion.div>
            )}

            {activeTab === "status" && (
              <motion.div
                key="status"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-hidden"
                data-ocid="status.panel"
              >
                <div className="h-full p-1">
                  <div
                    className="font-orbitron text-xs tracking-widest uppercase mb-4"
                    style={{ color: "#20D7E6" }}
                  >
                    SYSTEM STATUS
                  </div>
                  <StatusPanel />
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-hidden"
                data-ocid="settings.panel"
              >
                <div className="h-full p-1">
                  <div
                    className="font-orbitron text-xs tracking-widest uppercase mb-4"
                    style={{ color: "#20D7E6" }}
                  >
                    SETTINGS
                  </div>
                  <SettingsPanel
                    provider={provider}
                    apiKey={apiKey}
                    onProviderChange={handleProviderChange}
                    onApiKeyChange={handleApiKeyChange}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right sidebar - hidden on mobile */}
        <aside
          className="hidden xl:flex flex-col w-52 shrink-0 p-3 gap-3 overflow-y-auto jarvis-scroll"
          style={{
            borderLeft: "1px solid rgba(32,215,230,0.12)",
            background: "rgba(5,9,12,0.6)",
          }}
        >
          {/* Second radar target reticle */}
          <div className="hud-panel hud-panel-tl hud-panel-br p-4 rounded flex flex-col items-center gap-2">
            <div
              className="font-orbitron text-[8px] tracking-widest uppercase"
              style={{ color: "#6F8592" }}
            >
              TARGET LOCK
            </div>
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              role="img"
              aria-label="Target lock reticle"
            >
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="#20D7E6"
                strokeWidth="0.5"
                opacity="0.4"
              />
              <circle
                cx="40"
                cy="40"
                r="28"
                stroke="#20D7E6"
                strokeWidth="0.5"
                opacity="0.5"
              />
              <circle
                cx="40"
                cy="40"
                r="20"
                stroke="#2EF2FF"
                strokeWidth="0.8"
                opacity="0.6"
              />
              <circle
                cx="40"
                cy="40"
                r="10"
                stroke="#2EF2FF"
                strokeWidth="1"
                opacity="0.8"
              />
              <circle cx="40" cy="40" r="3" fill="#2EF2FF" opacity="0.95" />
              {/* Crosshairs */}
              <line
                x1="40"
                y1="4"
                x2="40"
                y2="24"
                stroke="#20D7E6"
                strokeWidth="0.8"
                opacity="0.5"
              />
              <line
                x1="40"
                y1="56"
                x2="40"
                y2="76"
                stroke="#20D7E6"
                strokeWidth="0.8"
                opacity="0.5"
              />
              <line
                x1="4"
                y1="40"
                x2="24"
                y2="40"
                stroke="#20D7E6"
                strokeWidth="0.8"
                opacity="0.5"
              />
              <line
                x1="56"
                y1="40"
                x2="76"
                y2="40"
                stroke="#20D7E6"
                strokeWidth="0.8"
                opacity="0.5"
              />
              {/* Rotating ring */}
              <circle
                cx="40"
                cy="40"
                r="33"
                stroke="#2EF2FF"
                strokeWidth="0.5"
                strokeDasharray="8 4"
                opacity="0.4"
                style={{ animation: "arc-spin 20s linear infinite" }}
              />
            </svg>
            <div
              className="font-orbitron text-[9px]"
              style={{ color: "#41E6D3" }}
            >
              LOCKED
            </div>
          </div>

          {/* Processing stats */}
          <StatCard label="NEURAL BANDWIDTH" value="81%" barWidth={81} />
          <StatCard label="ENCRYPTION" value="100%" barWidth={100} />
          <StatCard label="THREAT LEVEL" value="MINIMAL" />

          {/* Capabilities */}
          <div className="hud-panel hud-panel-tl hud-panel-br p-3 rounded">
            <div
              className="font-orbitron text-[8px] tracking-widest mb-2"
              style={{ color: "#6F8592" }}
            >
              CAPABILITIES
            </div>
            {[
              "Natural Language",
              "Code Analysis",
              "Data Processing",
              "Threat Assessment",
              "Strategic Planning",
            ].map((cap) => (
              <div key={cap} className="flex items-center gap-1.5 py-0.5">
                <ChevronRight size={9} style={{ color: "#20D7E6" }} />
                <span className="text-[9px]" style={{ color: "#9AA9B3" }}>
                  {cap}
                </span>
              </div>
            ))}
          </div>

          {/* Version info */}
          <div
            className="font-orbitron text-[8px] tracking-widest text-center"
            style={{ color: "#6F8592" }}
          >
            JARVIS v3.0.1
            <br />
            <span style={{ color: "#12333A" }}>BUILD 20260326</span>
          </div>
        </aside>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer
        className="relative z-20 flex items-center justify-between px-4 md:px-6 py-1.5 shrink-0"
        style={{
          borderTop: "1px solid rgba(32,215,230,0.12)",
          background: "rgba(5,9,12,0.9)",
        }}
      >
        <div
          className="font-orbitron text-[8px] tracking-widest uppercase"
          style={{ color: "#12333A" }}
        >
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#6F8592", textDecoration: "none" }}
            className="hover:text-hud-border transition-colors"
          >
            Built with caffeine.ai
          </a>
        </div>
        <div
          className="flex items-center gap-2 font-orbitron text-[8px] tracking-widest uppercase"
          style={{ color: "#41E6D3" }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "#41E6D3",
              boxShadow: "0 0 4px #41E6D3",
            }}
          />
          ALL SYSTEMS OPTIMAL
        </div>
      </footer>
    </div>
  );
}

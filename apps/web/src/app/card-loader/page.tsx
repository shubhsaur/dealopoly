"use client";

import React, { useState, useRef } from "react";
import { CardLoader, type CardLoaderVariant } from "../_components/card-loader";
import { CardBack } from "../_components/card";
import { MarketingNav } from "../_components/marketing-nav";
import { MarketingFooter } from "../_components/marketing-footer";

export default function CardLoaderTestPage() {
  const [game, setGame] = useState<CardLoaderVariant>("arcade");
  const [size, setSize] = useState<"sm" | "md" | "lg" | "full">("md");
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
  const [text, setText] = useState("SHUFFLING...");
  const [theme, setTheme] = useState<"dark" | "casino" | "navy" | "studio">("dark");
  const [isPaused, setIsPaused] = useState(false);
  const [showReflection, setShowReflection] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Mode: automatic live loop vs manual progress percentage
  const [useManualProgress, setUseManualProgress] = useState(false);
  const [progressValue, setProgressValue] = useState(55);

  // Real-time Flow Simulation State
  const [simulationState, setSimulationState] = useState<string | null>(null);
  const simulationTimerRef = useRef<NodeJS.Timeout[]>([]);

  const runSimulation = (type: "create" | "join" | "launch") => {
    simulationTimerRef.current.forEach(clearTimeout);
    simulationTimerRef.current = [];

    setUseManualProgress(true);
    setIsPaused(false);

    if (type === "create") {
      setSimulationState("Phase 1: Initializing room API...");
      setText("Creating Lobby...");
      setProgressValue(18);

      const t1 = setTimeout(() => {
        setSimulationState("Phase 2: Room code allocated, connecting socket...");
        setText("Connecting to Lobby...");
        setProgressValue(68);
      }, 1000);

      const t2 = setTimeout(() => {
        setSimulationState("Phase 3: Socket connected! Rushing to 100%...");
        setText("Lobby Ready!");
        setProgressValue(100);
      }, 2000);

      const t3 = setTimeout(() => {
        setSimulationState("✓ Complete: Lobby page ready to reveal!");
      }, 2600);

      simulationTimerRef.current = [t1, t2, t3];
    } else if (type === "join") {
      setSimulationState("Phase 1: Validating invite code & session...");
      setText("Connecting to Lobby...");
      setProgressValue(26);

      const t1 = setTimeout(() => {
        setSimulationState("Phase 2: Syncing room state & socket...");
        setText("Connecting to Lobby...");
        setProgressValue(72);
      }, 800);

      const t2 = setTimeout(() => {
        setSimulationState("Phase 3: Joined! Rushing to 100%...");
        setText("Lobby Ready!");
        setProgressValue(100);
      }, 1600);

      const t3 = setTimeout(() => {
        setSimulationState("✓ Complete: Lobby view revealed!");
      }, 2200);

      simulationTimerRef.current = [t1, t2, t3];
    } else if (type === "launch") {
      setSimulationState("Phase 1: Shuffling deck and dealing hands...");
      setText("Dealing Hands...");
      setProgressValue(28);

      const t1 = setTimeout(() => {
        setSimulationState("Phase 2: Connecting to game table...");
        setText("Dealing Cards...");
        setProgressValue(76);
      }, 900);

      const t2 = setTimeout(() => {
        setSimulationState("Phase 3: Game table ready! Rushing to 100%...");
        setText("Table Ready!");
        setProgressValue(100);
      }, 1800);

      const t3 = setTimeout(() => {
        setSimulationState("✓ Complete: Game board mounts smoothly!");
      }, 2400);

      simulationTimerRef.current = [t1, t2, t3];
    }
  };

  const bgStyles: Record<string, React.CSSProperties> = {
    dark: {
      background: "#0c1015",
      backgroundImage:
        "radial-gradient(circle at 50% 30%, #171f2c 0%, transparent 85%), linear-gradient(rgba(168, 200, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 200, 255, 0.03) 1px, transparent 1px)",
      backgroundSize: "100% 100%, 40px 40px, 40px 40px",
    },
    casino: {
      background: "#062817",
      backgroundImage:
        "radial-gradient(circle at 50% 40%, rgba(16, 185, 129, 0.15) 0%, transparent 75%), radial-gradient(rgba(245, 158, 11, 0.08) 1px, transparent 1px)",
      backgroundSize: "100% 100%, 36px 36px",
    },
    navy: {
      background: "#09121f",
      backgroundImage:
        "radial-gradient(circle at 50% 30%, rgba(56, 189, 248, 0.18) 0%, transparent 80%), radial-gradient(rgba(56, 189, 248, 0.06) 1px, transparent 1px)",
      backgroundSize: "100% 100%, 36px 36px",
    },
    studio: {
      background: "#18181b",
      backgroundImage:
        "radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.08) 0%, transparent 80%)",
      backgroundSize: "100% 100%",
    },
  };

  return (
    <div className="marketing-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <MarketingNav game={game} />

      <main style={{ flex: 1, padding: "36px 20px 80px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Header Title */}
        <div style={{ maxWidth: "860px", width: "100%", textAlign: "center", marginBottom: "28px" }}>
          <div className="hero-badge" style={{ margin: "0 auto 14px" }}>
            <span className="badge-dot" style={{ background: "#38bdf8" }} />
            <span className="badge-text" style={{ color: "#38bdf8" }}>LIVE SHUFFLER LOADER</span>
          </div>
          <h1 style={{ fontSize: "2.6rem", fontWeight: 900, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
            Dealopoly <span className="glow-word">Card Loader</span>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "1.05rem", margin: "0 auto", maxWidth: "680px", lineHeight: 1.6 }}>
            Official Dealopoly card shuffling artwork with an authentic live animated neon progress bar, leading white glow head, and lacquer table reflection.
          </p>
        </div>

        {/* ── TOOLBAR CONTROLS ───────────────────────────────────── */}
        <div
          style={{
            maxWidth: "860px",
            width: "100%",
            background: "rgba(22, 27, 34, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "18px",
            padding: "20px 24px",
            backdropFilter: "blur(14px)",
            display: "flex",
            flexWrap: "wrap",
            gap: "18px",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.45)",
          }}
        >
          {/* Game Brand Theme Selector */}
          <div>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Game Theme
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              {(
                [
                  { id: "arcade", label: "Arcade (Cyan)", color: "#38bdf8" },
                  { id: "monodeal", label: "Monodeal (Emerald)", color: "#34d399" },
                  { id: "lowdeck", label: "Lowdeck (Gold)", color: "#facc15" },
                ] as const
              ).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGame(g.id)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "8px",
                    border: game === g.id ? `1.5px solid ${g.color}` : "1px solid rgba(255, 255, 255, 0.15)",
                    background: game === g.id ? `${g.color}22` : "rgba(30, 41, 59, 0.6)",
                    color: game === g.id ? "#ffffff" : "#94a3b8",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Device Canvas Orientation */}
          <div>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Device Canvas
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setOrientation("landscape")}
                style={{
                  padding: "7px 12px",
                  borderRadius: "8px",
                  border: orientation === "landscape" ? "1.5px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.15)",
                  background: orientation === "landscape" ? "rgba(56, 189, 248, 0.2)" : "rgba(30, 41, 59, 0.6)",
                  color: orientation === "landscape" ? "#ffffff" : "#94a3b8",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🖥️ Desktop (3:2)
              </button>
              <button
                type="button"
                onClick={() => setOrientation("portrait")}
                style={{
                  padding: "7px 12px",
                  borderRadius: "8px",
                  border: orientation === "portrait" ? "1.5px solid #a855f7" : "1px solid rgba(255, 255, 255, 0.15)",
                  background: orientation === "portrait" ? "rgba(168, 85, 247, 0.2)" : "rgba(30, 41, 59, 0.6)",
                  color: orientation === "portrait" ? "#ffffff" : "#94a3b8",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                📱 Mobile (9:16)
              </button>
              <button
                type="button"
                onClick={() => setOrientation("auto")}
                style={{
                  padding: "7px 12px",
                  borderRadius: "8px",
                  border: orientation === "auto" ? "1.5px solid #34d399" : "1px solid rgba(255, 255, 255, 0.15)",
                  background: orientation === "auto" ? "rgba(52, 211, 153, 0.2)" : "rgba(30, 41, 59, 0.6)",
                  color: orientation === "auto" ? "#ffffff" : "#94a3b8",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🔄 Auto Responsive
              </button>
            </div>
          </div>

          {/* Progress Mode Toggle */}
          <div>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Progress Mode
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setUseManualProgress(false)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: !useManualProgress ? "1.5px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.15)",
                  background: !useManualProgress ? "rgba(56, 189, 248, 0.2)" : "rgba(30, 41, 59, 0.6)",
                  color: !useManualProgress ? "#ffffff" : "#94a3b8",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ⚡ Live Shuffle Loop
              </button>
              <button
                type="button"
                onClick={() => setUseManualProgress(true)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: useManualProgress ? "1.5px solid #facc15" : "1px solid rgba(255, 255, 255, 0.15)",
                  background: useManualProgress ? "rgba(250, 204, 21, 0.2)" : "rgba(30, 41, 59, 0.6)",
                  color: useManualProgress ? "#ffffff" : "#94a3b8",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                📊 Manual Percentage
              </button>
            </div>
          </div>

          {/* Live Lifecycle Flow Simulations */}
          <div style={{ width: "100%", background: "rgba(15, 23, 42, 0.6)", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.76rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                ⚡ Test Live Flow Transitions (Dynamic Messages + 100% Finish Fill)
              </span>
              {simulationState && (
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#34d399" }}>
                  {simulationState}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => runSimulation("create")}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid #38bdf8",
                  color: "#38bdf8",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ▶ Simulate Lobby Creation
              </button>
              <button
                type="button"
                onClick={() => runSimulation("join")}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "rgba(52, 211, 153, 0.15)",
                  border: "1px solid #34d399",
                  color: "#34d399",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ▶ Simulate Lobby Join
              </button>
              <button
                type="button"
                onClick={() => runSimulation("launch")}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "rgba(250, 204, 21, 0.15)",
                  border: "1px solid #facc15",
                  color: "#fde047",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ▶ Simulate Game Launch
              </button>
            </div>
          </div>

          {/* Size Scale Selector */}
          <div>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Size Scale
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              {(
                [
                  { id: "sm", label: "SM (420px)" },
                  { id: "md", label: "MD (620px)" },
                  { id: "lg", label: "LG (820px)" },
                  { id: "full", label: "Full Edge-to-Edge" },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSize(s.id)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "8px",
                    border: size === s.id ? "1.5px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.15)",
                    background: size === s.id ? "rgba(56, 189, 248, 0.2)" : "rgba(30, 41, 59, 0.6)",
                    color: size === s.id ? "#ffffff" : "#94a3b8",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Backdrop Theme */}
          <div>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Backdrop
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              {(
                [
                  { id: "dark", label: "Obsidian" },
                  { id: "navy", label: "Navy" },
                  { id: "casino", label: "Felt" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "8px",
                    border: theme === t.id ? "1.5px solid #34d399" : "1px solid rgba(255, 255, 255, 0.15)",
                    background: theme === t.id ? "rgba(52, 211, 153, 0.18)" : "rgba(30, 41, 59, 0.6)",
                    color: theme === t.id ? "#ffffff" : "#94a3b8",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reflection Toggle & Playback */}
          <div>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Effects
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setShowReflection(!showReflection)}
                style={{
                  padding: "7px 12px",
                  borderRadius: "8px",
                  border: showReflection ? "1.5px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.15)",
                  background: showReflection ? "rgba(56, 189, 248, 0.18)" : "rgba(30, 41, 59, 0.6)",
                  color: showReflection ? "#ffffff" : "#94a3b8",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {showReflection ? "✓ Table Reflection" : "No Reflection"}
              </button>
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                style={{
                  padding: "7px 12px",
                  borderRadius: "8px",
                  border: isPaused ? "1.5px solid #facc15" : "1px solid rgba(255, 255, 255, 0.15)",
                  background: isPaused ? "rgba(250, 204, 21, 0.18)" : "rgba(30, 41, 59, 0.6)",
                  color: isPaused ? "#fde047" : "#e2e8f0",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isPaused ? "▶ Resume" : "⏸ Pause"}
              </button>
              <button
                type="button"
                onClick={() => setIsFullScreen(true)}
                style={{
                  padding: "7px 12px",
                  borderRadius: "8px",
                  border: "1.5px solid #a855f7",
                  background: "rgba(168, 85, 247, 0.18)",
                  color: "#e9d5ff",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ⛶ Fullscreen Preview
              </button>
            </div>
          </div>

          {/* Manual Progress Slider (when in manual mode) */}
          {useManualProgress && (
            <div style={{ width: "100%", marginTop: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#facc15", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Set Progress: {progressValue}%
                </span>
                <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
                  Drag slider to test fill levels
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progressValue}
                onChange={(e) => setProgressValue(Number(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: "#38bdf8",
                  cursor: "pointer",
                }}
              />
            </div>
          )}

          {/* Custom Loading Message Input */}
          <div style={{ width: "100%", marginTop: "4px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#94a3b8", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Custom Loader Message
            </span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter custom text..."
                style={{
                  flex: 1,
                  minWidth: "220px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
              {(["SHUFFLING...", "CONNECTING TO LOBBY...", "DEALING HANDS..."] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setText(preset)}
                  style={{
                    padding: "8px 12px",
                    background: text === preset ? "rgba(56, 189, 248, 0.25)" : "rgba(30, 41, 59, 0.8)",
                    border: text === preset ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "8px",
                    color: text === preset ? "#38bdf8" : "#e2e8f0",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {preset.replace("...", "")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN STAGE DISPLAY CONTAINER ───────────────────────── */}
        <div
          style={{
            maxWidth: size === "full" ? "100%" : "920px",
            width: "100%",
            minHeight: "520px",
            borderRadius: size === "full" ? "16px" : "24px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: size === "full" ? "24px 12px" : "48px 24px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.7)",
            transition: "max-width 0.3s ease, padding 0.3s ease",
            ...bgStyles[theme],
          }}
        >
          <CardLoader
            game={game}
            size={size}
            orientation={orientation}
            text={text}
            progress={useManualProgress ? progressValue : undefined}
            isComplete={useManualProgress && progressValue === 100}
            paused={isPaused}
            showReflection={showReflection}
          />
        </div>

        {/* ── ALL SIZES PRODUCTION COMPARISON ────────────────────── */}
        <div style={{ maxWidth: "860px", width: "100%", marginTop: "64px" }}>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "20px", textAlign: "center" }}>
            All Sizes Production Comparison
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
              width: "100%",
            }}
          >
            {(["sm", "md", "lg"] as const).map((s) => (
              <div
                key={s}
                style={{
                  background: "rgba(17, 20, 21, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "24px 16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#facc15", marginBottom: "16px", textTransform: "uppercase" }}>
                  Size: {s.toUpperCase()}
                </span>
                <CardLoader
                  game={game}
                  size={s}
                  orientation={orientation}
                  text={text}
                  progress={useManualProgress ? progressValue : undefined}
                  isComplete={useManualProgress && progressValue === 100}
                  paused={isPaused}
                  showReflection={showReflection}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── ORIGINAL DEALOPOLY CARD BACK SHOWCASE ──────────────── */}
        <section
          id="original-card-back-section"
          style={{
            maxWidth: "860px",
            width: "100%",
            marginTop: "72px",
            paddingTop: "48px",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div className="hero-badge" style={{ margin: "0 auto 14px" }}>
            <span className="badge-dot" style={{ background: "#38bdf8" }} />
            <span className="badge-text" style={{ color: "#38bdf8" }}>ORIGINAL BRAND ASSET</span>
          </div>

          <h2 style={{ fontSize: "1.9rem", fontWeight: 900, margin: "0 0 10px", textAlign: "center", letterSpacing: "-0.01em" }}>
            Original <span className="glow-word">Dealopoly Card Back</span>
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.96rem", textAlign: "center", maxWidth: "640px", margin: "0 0 36px", lineHeight: 1.6 }}>
            The official Dealopoly card back asset (<code style={{ color: "#38bdf8", background: "rgba(56, 189, 248, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>/card-back.png</code>). Features the midnight navy architectural skyline, 3D embossed golden header, isometric banknotes, and dice.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "28px",
              width: "100%",
              alignItems: "stretch",
            }}
          >
            {/* 1. Full High-Res Artwork Card */}
            <div
              style={{
                background: "rgba(22, 27, 34, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "20px",
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: "0 12px 36px rgba(0, 0, 0, 0.45)",
                backdropFilter: "blur(12px)",
              }}
            >
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#38bdf8", marginBottom: "18px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                High-Resolution Asset Preview
              </span>

              <div
                style={{
                  position: "relative",
                  width: "210px",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "2px solid rgba(212, 175, 55, 0.45)",
                  boxShadow: "0 16px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(56, 189, 248, 0.2)",
                  background: "#081325",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                }}
              >
                <img
                  src="/card-back.png"
                  alt="Original Dealopoly Card Back Artwork"
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </div>

              <div style={{ marginTop: "18px", textAlign: "center" }}>
                <span style={{ color: "#f8fafc", fontSize: "0.9rem", fontWeight: 700, display: "block" }}>
                  Dealopoly Card Back
                </span>
                <span style={{ color: "#64748b", fontSize: "0.78rem" }}>
                  public/card-back.png • 512 × 682 px
                </span>
              </div>
            </div>

            {/* 2. In-Game Interactive CardBack Components */}
            <div
              style={{
                background: "rgba(22, 27, 34, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "20px",
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 12px 36px rgba(0, 0, 0, 0.45)",
                backdropFilter: "blur(12px)",
              }}
            >
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#facc15", marginBottom: "18px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Live In-Game Component (&lt;CardBack /&gt;)
              </span>

              {/* Side-by-side interactive sizes */}
              <div style={{ display: "flex", gap: "20px", alignItems: "flex-end", justifyContent: "center", padding: "12px 0" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <CardBack size="sm" isInteractive={true} />
                  <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600 }}>SM</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <CardBack size="md" isInteractive={true} />
                  <span style={{ fontSize: "0.72rem", color: "#facc15", fontWeight: 700 }}>MD (Default)</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <CardBack size="lg" isInteractive={true} />
                  <span style={{ fontSize: "0.72rem", color: "#38bdf8", fontWeight: 700 }}>LG</span>
                </div>
              </div>

              {/* Asset Specs Details */}
              <div
                style={{
                  width: "100%",
                  marginTop: "18px",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>Component:</span>
                  <strong style={{ color: "#e2e8f0" }}>&lt;CardBack /&gt;</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span>CSS Class:</span>
                  <strong style={{ color: "#e2e8f0" }}>.dealopoly-card-back</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Effects:</span>
                  <strong style={{ color: "#34d399" }}>3D Hover Lift &amp; Shadow</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {isFullScreen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000 }}>
          <CardLoader
            fullScreen
            game={game}
            size="lg"
            orientation={orientation}
            text={text}
            progress={useManualProgress ? progressValue : undefined}
            isComplete={useManualProgress && progressValue === 100}
            paused={isPaused}
            showReflection={showReflection}
          />
          <button
            type="button"
            onClick={() => setIsFullScreen(false)}
            style={{
              position: "fixed",
              top: "24px",
              right: "24px",
              zIndex: 10001,
              background: "rgba(15, 23, 42, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
            }}
          >
            ✕ Exit Fullscreen
          </button>
        </div>
      )}

      <MarketingFooter game={game} />
    </div>
  );
}


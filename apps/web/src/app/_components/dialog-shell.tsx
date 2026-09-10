"use client";

import type { ReactNode } from "react";
import { useEscapeKey } from "../../lib/use-interactions";

type DialogShellSize = "sm" | "md" | "wide" | "table";

interface DialogShellProps {
  /** Whether the dialog is open. Renders nothing when false. */
  isOpen: boolean;
  /** Called when the user wants to close (scrim click, Escape key). */
  onClose: () => void;
  /** Panel size variant. Defaults to undefined (default panel size). */
  size?: DialogShellSize;
  /** Whether to show the mobile bottom sheet drag handle. Default true. */
  showHandle?: boolean;
  /** Override the z-index. Defaults to 300. */
  zIndex?: number;
  /** Content rendered inside the dialog panel. */
  children: ReactNode;
}

/**
 * Reusable dialog shell that handles the overlay, scrim, panel, texture overlay,
 * mobile sheet handle, Escape key, and aria attributes.
 *
 * Usage:
 * ```tsx
 * <DialogShell isOpen={showDialog} onClose={() => setShowDialog(false)} size="sm">
 *   <div className="dialog-header">...</div>
 *   <div className="dialog-body">...</div>
 * </DialogShell>
 * ```
 */
export function DialogShell({
  isOpen,
  onClose,
  size,
  showHandle = true,
  zIndex = 300,
  children,
}: DialogShellProps) {
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const panelClass = size
    ? `dialog-panel dialog-panel--${size}`
    : "dialog-panel";

  return (
    <div
      className="join-dialog-overlay"
      role="dialog"
      aria-modal="true"
      style={{ zIndex }}
    >
      <div className="dialog-scrim" onClick={onClose} aria-hidden="true" />
      <div className={panelClass}>
        <div className="texture-overlay" />
        {showHandle && <div className="sheet-handle" />}
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ErrorBar — standardized red pill-shaped error notification
// ---------------------------------------------------------------------------

interface ErrorBarProps {
  /** The error message to display. Renders nothing when null. */
  error: string | null;
}

export function ErrorBar({ error }: ErrorBarProps) {
  if (!error) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: "60px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        background: "#93000a",
        border: "1px solid #ffb4ab",
        color: "#ffdad6",
        padding: "6px 16px",
        borderRadius: "999px",
        fontSize: "0.78rem",
        fontWeight: 600,
        boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
      }}
    >
      {error}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AlertBox — standardized alert containers
// ---------------------------------------------------------------------------

type AlertBoxVariant = "error" | "warning" | "info" | "success";

interface AlertBoxProps {
  variant?: AlertBoxVariant;
  children: ReactNode;
  style?: React.CSSProperties;
}

const ALERT_STYLES: Record<AlertBoxVariant, React.CSSProperties> = {
  error: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    color: "#fca5a5",
  },
  warning: {
    background: "rgba(245, 158, 11, 0.15)",
    border: "1px solid rgba(245, 158, 11, 0.4)",
    color: "#fde68a",
  },
  info: {
    background: "rgba(56, 189, 248, 0.15)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    color: "#38bdf8",
  },
  success: {
    background: "rgba(34, 197, 94, 0.15)",
    border: "1px solid rgba(34, 197, 94, 0.4)",
    color: "#86efac",
  },
};

export function AlertBox({ variant = "info", children, style }: AlertBoxProps) {
  return (
    <div
      style={{
        borderRadius: "8px",
        fontSize: "0.78rem",
        lineHeight: 1.5,
        ...ALERT_STYLES[variant],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GameTableShell — game table wrapper with theme/animation classes + texture overlay
// ---------------------------------------------------------------------------

interface GameTableShellProps {
  tableTheme: string;
  animationSpeed: string;
  children: ReactNode;
}

export function GameTableShell({ tableTheme, animationSpeed, children }: GameTableShellProps) {
  return (
    <div className={`game-table-shell settings-felt--${tableTheme} game-anim--${animationSpeed}`}>
      <div
        className="texture-overlay"
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
      />
      {children}
    </div>
  );
}

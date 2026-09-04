"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function UserNav() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  if (status === "loading") {
    return (
      <div
        style={{
          width: "82px",
          height: "34px",
          borderRadius: "8px",
          background: "var(--surface)",
          border: "1px solid var(--outline-variant)",
          opacity: 0.4,
        }}
      />
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="user-nav-signin-btn"
      >
        <span className="material-symbols-outlined user-nav-signin-icon">
          login
        </span>
        <span>Sign In</span>
      </Link>
    );
  }

  const user = session.user;
  const initials = (user.name || user.email || "Player")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User Avatar"}
            referrerPolicy="no-referrer"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "2px solid var(--primary)",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            className="user-avatar-badge"
            style={{
              background: "linear-gradient(135deg, #0055A4 0%, #27A644 100%)",
              color: "#fff",
              border: "2px solid var(--primary)",
            }}
          >
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop to dismiss */}
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
          />

          {/* Dropdown Menu */}
          <div
            className="glass-panel"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: "220px",
              borderRadius: "14px",
              padding: "8px",
              zIndex: 100,
              background: "rgba(29, 32, 33, 0.95)",
              border: "1px solid var(--outline-variant)",
              boxShadow: "0 12px 32px rgba(0, 0, 0, 0.6)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text)" }}>
                {user.name || "Player"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.email}
              </div>
            </div>

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                borderRadius: "8px",
                color: "var(--text)",
                textDecoration: "none",
                fontSize: "0.85rem",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary)" }}>
                person
              </span>
              My Profile & Stats
            </Link>

            <Link
              href="/history"
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                borderRadius: "8px",
                color: "var(--text)",
                textDecoration: "none",
                fontSize: "0.85rem",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--green)" }}>
                history
              </span>
              Match History
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                borderRadius: "8px",
                color: "var(--text)",
                textDecoration: "none",
                fontSize: "0.85rem",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--tertiary)" }}>
                settings
              </span>
              Game Settings
            </Link>

            <div style={{ height: "1px", background: "var(--line)", margin: "4px 0" }} />

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                borderRadius: "8px",
                background: "none",
                border: "none",
                color: "var(--error)",
                cursor: "pointer",
                fontSize: "0.85rem",
                width: "100%",
                textAlign: "left",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                logout
              </span>
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

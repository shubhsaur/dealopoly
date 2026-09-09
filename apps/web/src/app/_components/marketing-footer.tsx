import Link from "next/link";
import { Brand } from "./brand";

export interface MarketingFooterProps {
  game?: "arcade" | "monodeal" | "lowdeck";
}

export function MarketingFooter({ game = "arcade" }: MarketingFooterProps) {
  return (
    <footer className="marketing-footer">
      <div className="shell" style={{ position: "relative", zIndex: 5, width: "100%" }}>
        <div className="footer-inner">
          <div className="footer-brand-wrap">
            <Brand game={game} />
            <span className="footer-version">v1.2.0</span>
          </div>

          <nav className="footer-links" aria-label="Footer navigation">
            {game === "monodeal" ? (
              <>
                <Link href="/monodeal/cards">Card Catalogue</Link>
                <Link href="/monodeal/how-to-play">How to Play</Link>
                <Link href="/monodeal/rules">Official Rules</Link>
              </>
            ) : game === "lowdeck" ? (
              <>
                <Link href="/lowdeck/cards">Deck Cards (52)</Link>
                <Link href="/lowdeck/how-to-play">How to Play</Link>
                <Link href="/lowdeck/rules">Official Rules</Link>
              </>
            ) : null}

            <a
              href="https://www.github.com/shubhsaur"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              title="GitHub"
              aria-label="GitHub Profile"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </a>

            <a
              href="https://www.x.com/shubhsaur"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              title="X"
              aria-label="X Profile"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </nav>
        </div>

        <div style={{ textAlign: "center", marginTop: "16px", fontSize: "0.78rem", color: "#64748b" }}>
          © 2026 Dealopoly • The Real-Time Multiplayer Card Platform
        </div>
      </div>
    </footer>
  );
}

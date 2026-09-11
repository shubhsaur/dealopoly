"use client";

import { useState } from "react";
import { MarketingNav } from "../_components/marketing-nav";
import { MarketingFooter } from "../_components/marketing-footer";
import { ArcadeGameCards } from "../_components/arcade-game-cards";
import { PlayBotsDialog } from "../_components/play-bots-dialog";

export default function BrowseGamesPage() {
  const [isBotsOpen, setIsBotsOpen] = useState(false);
  const [defaultGameForBots, setDefaultGameForBots] = useState<"monodeal" | "least_count">("monodeal");

  const handleOpenBots = (game: "monodeal" | "least_count") => {
    setDefaultGameForBots(game);
    setIsBotsOpen(true);
  };

  return (
    <div className="marketing-page">
      <MarketingNav game="arcade" activeTab="games" />

      <main>
        <section className="shell" style={{ padding: "32px 16px 56px" }}>
          <div
            className="section-header"
            style={{ textAlign: "center", marginBottom: "40px" }}
          >
            <p className="kicker">SELECT YOUR GAME</p>
            <h1 style={{ fontSize: "2.4rem", fontWeight: 900 }}>Browse Games</h1>
            <p style={{ color: "#94a3b8", maxWidth: "600px", margin: "0 auto" }}>
              Choose a card game below to jump straight into live bot matches,
              multiplayer rooms, or explore official rules and card catalogues.
            </p>
          </div>

          <ArcadeGameCards onOpenBots={handleOpenBots} />
        </section>
      </main>

      <MarketingFooter game="arcade" />

      <PlayBotsDialog
        isOpen={isBotsOpen}
        onClose={() => setIsBotsOpen(false)}
        defaultGame={defaultGameForBots}
      />
    </div>
  );
}

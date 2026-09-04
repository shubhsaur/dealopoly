"use client";

import { CardLoader } from "./_components/card-loader";
import { useRealisticProgress } from "../lib/use-realistic-progress";

export default function RootLoading() {
  const { progress } = useRealisticProgress({
    initialProgress: 20,
    maxStallProgress: 90,
  });

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <CardLoader
        fullScreen
        game="arcade"
        size="lg"
        text="Entering Dealopoly Arcade…"
        progress={progress}
      />
    </div>
  );
}

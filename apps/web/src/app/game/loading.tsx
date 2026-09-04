"use client";

import { CardLoader } from "../_components/card-loader";
import { useRealisticProgress } from "../../lib/use-realistic-progress";

export default function GameLoading() {
  const { progress } = useRealisticProgress({
    initialProgress: 25,
    maxStallProgress: 92,
  });

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <CardLoader
        fullScreen
        size="lg"
        text="Preparing Game Table…"
        progress={progress}
      />
    </div>
  );
}

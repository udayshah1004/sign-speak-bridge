import { type GestureResult } from "@/lib/gestureClassifier";

interface GestureDisplayProps {
  gesture: GestureResult | null;
  handsDetected: number;
}

const GestureDisplay = ({ gesture, handsDetected }: GestureDisplayProps) => {
  return (
    <div className="rounded-lg border border-border bg-card p-6 glow-border">
      <div className="mb-3 flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${handsDetected > 0 ? "bg-primary pulse-glow" : "bg-muted-foreground"}`} />
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
          {handsDetected > 0 ? `${handsDetected} hand${handsDetected > 1 ? "s" : ""} detected` : "No hands detected"}
        </span>
      </div>

      {gesture && gesture.confidence > 0.5 ? (
        <div className="gesture-detected">
          <div className="mb-2 text-6xl">{gesture.emoji}</div>
          <h2 className="text-2xl font-bold text-primary glow-text">{gesture.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{gesture.meaning}</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${gesture.confidence * 100}%` }}
              />
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {Math.round(gesture.confidence * 100)}%
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="mb-2 text-4xl opacity-30">🤚</div>
          <p className="text-sm text-muted-foreground">Show a hand gesture to the camera</p>
        </div>
      )}
    </div>
  );
};

export default GestureDisplay;

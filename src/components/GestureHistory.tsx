import { type GestureResult } from "@/lib/gestureClassifier";
import { Volume2 } from "lucide-react";

interface GestureHistoryProps {
  history: GestureResult[];
  onSpeak: (text: string) => void;
}

const GestureHistory = ({ history, onSpeak }: GestureHistoryProps) => {
  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-3 font-mono text-xs text-muted-foreground uppercase tracking-widest">
          Gesture History
        </h3>
        <p className="text-sm text-muted-foreground text-center py-4">
          Detected gestures will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="mb-3 font-mono text-xs text-muted-foreground uppercase tracking-widest">
        Gesture History
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {history.map((g, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 group hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{g.emoji}</span>
              <div>
                <span className="text-sm font-medium text-card-foreground">{g.name}</span>
                <p className="text-xs text-muted-foreground">{g.meaning}</p>
              </div>
            </div>
            <button
              onClick={() => onSpeak(`${g.name}. ${g.meaning}`)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
              title="Speak this gesture"
            >
              <Volume2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestureHistory;

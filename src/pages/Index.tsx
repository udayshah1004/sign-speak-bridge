import { useState, useCallback } from "react";
import { Camera, CameraOff, Volume2, VolumeX, Hand } from "lucide-react";
import { useHandDetection } from "@/hooks/useHandDetection";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { type GestureResult } from "@/lib/gestureClassifier";
import GestureDisplay from "@/components/GestureDisplay";
import GestureHistory from "@/components/GestureHistory";

const SUPPORTED_GESTURES = [
  { emoji: "👍", name: "Thumbs Up" },
  { emoji: "👎", name: "Thumbs Down" },
  { emoji: "👌", name: "OK Sign" },
  { emoji: "✌️", name: "Peace Sign" },
  { emoji: "☝️", name: "Pointing" },
  { emoji: "🖐️", name: "Open Palm" },
  { emoji: "✊", name: "Fist" },
  { emoji: "🤘", name: "Rock On" },
  { emoji: "🤙", name: "Call Me" },
  { emoji: "👉", name: "Finger Gun" },
  { emoji: "3️⃣", name: "Three" },
  { emoji: "4️⃣", name: "Four" },
];

const Index = () => {
  const [history, setHistory] = useState<GestureResult[]>([]);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const { speak, stop, isSpeaking } = useTextToSpeech();

  const handleGesture = useCallback(
    (gesture: GestureResult) => {
      setHistory((prev) => [gesture, ...prev].slice(0, 50));
      if (autoSpeak) {
        speak(`${gesture.name}`);
      }
    },
    [autoSpeak, speak]
  );

  const {
    videoRef,
    canvasRef,
    isLoading,
    isRunning,
    error,
    currentGesture,
    handsDetected,
    startCamera,
    stopCamera,
  } = useHandDetection({ onGesture: handleGesture });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
              <Hand className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">GestureSpeak</h1>
              <p className="text-xs text-muted-foreground font-mono">AI Sign Language Recognition</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAutoSpeak(!autoSpeak);
                if (isSpeaking) stop();
              }}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors border ${
                autoSpeak
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span className="hidden sm:inline">Auto-Speak</span>
            </button>

            <button
              onClick={isRunning ? stopCamera : startCamera}
              disabled={isLoading}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                isRunning
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isRunning ? <CameraOff size={16} /> : <Camera size={16} />}
              {isLoading ? "Loading Model..." : isRunning ? "Stop" : "Start Camera"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Video Feed */}
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-lg border border-border bg-card glow-border">
              <div className="relative aspect-video bg-muted">
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover -scale-x-100"
                  playsInline
                  muted
                  style={{ display: isRunning ? "none" : "none" }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ display: isRunning ? "block" : "none" }}
                />

                {!isRunning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                      <Camera className="h-8 w-8 text-primary/60" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {isLoading ? "Loading hand detection model..." : "Click \"Start Camera\" to begin"}
                    </p>
                    {isLoading && (
                      <div className="mt-3 h-1 w-32 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                )}

                {/* Status overlay */}
                {isRunning && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 rounded-md bg-card/80 backdrop-blur-sm px-3 py-1.5 border border-border">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-mono text-xs text-foreground">LIVE</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <GestureDisplay gesture={currentGesture} handsDetected={handsDetected} />
            <GestureHistory history={history} onSpeak={speak} />
          </div>
        </div>

        {/* Supported Gestures */}
        <section className="mt-8">
          <h3 className="mb-4 font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Supported Gestures
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {SUPPORTED_GESTURES.map((g) => (
              <div
                key={g.name}
                className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <span className="text-2xl">{g.emoji}</span>
                <span className="text-xs text-muted-foreground text-center">{g.name}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;

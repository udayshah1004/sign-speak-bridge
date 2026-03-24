import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { classifyGesture, type GestureResult } from "@/lib/gestureClassifier";

interface UseHandDetectionOptions {
  onGesture?: (gesture: GestureResult) => void;
}

export function useHandDetection({ onGesture }: UseHandDetectionOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGesture, setCurrentGesture] = useState<GestureResult | null>(null);
  const [handsDetected, setHandsDetected] = useState(0);

  const lastGestureRef = useRef<string>("");
  const onGestureRef = useRef(onGesture);
  onGestureRef.current = onGesture;

  const initMediaPipe = useCallback(async () => {
    try {
      setIsLoading(true);
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });
      setIsLoading(false);
    } catch (e) {
      console.error("MediaPipe init error:", e);
      setError("Failed to load hand detection model. Please refresh.");
      setIsLoading(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsRunning(true);
      }
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    cancelAnimationFrame(animFrameRef.current);
    setIsRunning(false);
    setCurrentGesture(null);
    setHandsDetected(0);
  }, []);

  const detectFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = handLandmarkerRef.current;

    if (!video || !canvas || !landmarker || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    const ctx = canvas.getContext("2d")!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Mirror the canvas
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    const result = landmarker.detectForVideo(video, performance.now());

    setHandsDetected(result.landmarks?.length ?? 0);

    if (result.landmarks && result.landmarks.length > 0) {
      // Draw landmarks
      for (const hand of result.landmarks) {
        for (const lm of hand) {
          const x = (1 - lm.x) * canvas.width; // mirror
          const y = lm.y * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = "hsl(150, 80%, 50%)";
          ctx.fill();
          ctx.strokeStyle = "hsl(150, 80%, 30%)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Draw connections
        const connections = [
          [0,1],[1,2],[2,3],[3,4],
          [0,5],[5,6],[6,7],[7,8],
          [5,9],[9,10],[10,11],[11,12],
          [9,13],[13,14],[14,15],[15,16],
          [13,17],[17,18],[18,19],[19,20],
          [0,17],
        ];
        ctx.strokeStyle = "hsl(150, 60%, 40%)";
        ctx.lineWidth = 2;
        for (const [a, b] of connections) {
          const ax = (1 - hand[a].x) * canvas.width;
          const ay = hand[a].y * canvas.height;
          const bx = (1 - hand[b].x) * canvas.width;
          const by = hand[b].y * canvas.height;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }

      // Classify first hand
      const gesture = classifyGesture(result.landmarks[0]);
      if (gesture && gesture.confidence > 0.5) {
        setCurrentGesture(gesture);
        if (gesture.name !== lastGestureRef.current) {
          lastGestureRef.current = gesture.name;
          onGestureRef.current?.(gesture);
        }
      }
    } else {
      setCurrentGesture(null);
      lastGestureRef.current = "";
    }

    animFrameRef.current = requestAnimationFrame(detectFrame);
  }, []);

  useEffect(() => {
    initMediaPipe();
    return () => {
      stopCamera();
      handLandmarkerRef.current?.close();
    };
  }, [initMediaPipe, stopCamera]);

  useEffect(() => {
    if (isRunning) {
      animFrameRef.current = requestAnimationFrame(detectFrame);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isRunning, detectFrame]);

  return {
    videoRef,
    canvasRef,
    isLoading,
    isRunning,
    error,
    currentGesture,
    handsDetected,
    startCamera,
    stopCamera,
  };
}

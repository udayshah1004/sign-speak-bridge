// Gesture classification using hand landmarks
// We use geometric rules based on finger positions relative to palm

export interface GestureResult {
  name: string;
  emoji: string;
  meaning: string;
  confidence: number;
}

interface Landmark {
  x: number;
  y: number;
  z: number;
}

// Finger tip and pip (proximal interphalangeal) indices
const THUMB_TIP = 4;
const THUMB_IP = 3;
const THUMB_MCP = 2;
const INDEX_TIP = 8;
const INDEX_PIP = 6;
const INDEX_MCP = 5;
const MIDDLE_TIP = 12;
const MIDDLE_PIP = 10;
const RING_TIP = 16;
const RING_PIP = 14;
const PINKY_TIP = 20;
const PINKY_PIP = 18;
const WRIST = 0;

function dist(a: Landmark, b: Landmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function isFingerExtended(lm: Landmark[], tip: number, pip: number): boolean {
  // A finger is extended if tip is further from wrist than pip
  return dist(lm[tip], lm[WRIST]) > dist(lm[pip], lm[WRIST]);
}

function isThumbUp(lm: Landmark[]): boolean {
  return lm[THUMB_TIP].y < lm[THUMB_MCP].y && lm[THUMB_TIP].y < lm[WRIST].y;
}

function isThumbDown(lm: Landmark[]): boolean {
  return lm[THUMB_TIP].y > lm[THUMB_MCP].y && lm[THUMB_TIP].y > lm[WRIST].y;
}

export function classifyGesture(landmarks: Landmark[]): GestureResult | null {
  if (!landmarks || landmarks.length < 21) return null;

  const lm = landmarks;

  const thumbExtended = isFingerExtended(lm, THUMB_TIP, THUMB_IP);
  const indexExtended = isFingerExtended(lm, INDEX_TIP, INDEX_PIP);
  const middleExtended = isFingerExtended(lm, MIDDLE_TIP, MIDDLE_PIP);
  const ringExtended = isFingerExtended(lm, RING_TIP, RING_PIP);
  const pinkyExtended = isFingerExtended(lm, PINKY_TIP, PINKY_PIP);

  const extendedCount = [thumbExtended, indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

  // Thumbs up: only thumb extended, pointing up
  if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended && isThumbUp(lm)) {
    return { name: "Thumbs Up", emoji: "👍", meaning: "Approval or agreement", confidence: 0.9 };
  }

  // Thumbs down: only thumb extended, pointing down
  if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended && isThumbDown(lm)) {
    return { name: "Thumbs Down", emoji: "👎", meaning: "Disapproval or disagreement", confidence: 0.9 };
  }

  // OK sign: thumb and index tips touching, others extended
  const thumbIndexDist = dist(lm[THUMB_TIP], lm[INDEX_TIP]);
  if (thumbIndexDist < 0.06 && middleExtended && ringExtended && pinkyExtended) {
    return { name: "OK Sign", emoji: "👌", meaning: "Everything is fine", confidence: 0.85 };
  }

  // Peace sign: index and middle extended, others curled
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
    return { name: "Peace Sign", emoji: "✌️", meaning: "Peace or victory", confidence: 0.9 };
  }

  // Pointing: only index extended
  if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended && !thumbExtended) {
    return { name: "Pointing", emoji: "☝️", meaning: "Directing attention", confidence: 0.85 };
  }

  // Rock/horns: index and pinky extended, others curled
  if (indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
    return { name: "Rock On", emoji: "🤘", meaning: "Excitement or rock music", confidence: 0.85 };
  }

  // Namaste/prayer: detect if both hands are needed - single hand fist with thumb visible
  // For single hand: all fingers curled tightly
  if (extendedCount === 0) {
    return { name: "Fist", emoji: "✊", meaning: "Strength or solidarity", confidence: 0.85 };
  }

  // Open palm: all fingers extended
  if (extendedCount === 5) {
    return { name: "Open Palm", emoji: "🖐️", meaning: "Stop, greeting, or high-five", confidence: 0.9 };
  }

  // Three fingers: index, middle, ring
  if (indexExtended && middleExtended && ringExtended && !pinkyExtended && !thumbExtended) {
    return { name: "Three", emoji: "3️⃣", meaning: "Number three", confidence: 0.8 };
  }

  // Four fingers: all except thumb
  if (indexExtended && middleExtended && ringExtended && pinkyExtended && !thumbExtended) {
    return { name: "Four", emoji: "4️⃣", meaning: "Number four", confidence: 0.8 };
  }

  // Call me / shaka: thumb and pinky extended
  if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
    return { name: "Call Me", emoji: "🤙", meaning: "Call me or hang loose", confidence: 0.85 };
  }

  // Finger gun: thumb and index extended
  if (thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return { name: "Finger Gun", emoji: "👉", meaning: "Pointing or acknowledgment", confidence: 0.8 };
  }

  return { name: "Unknown Gesture", emoji: "❓", meaning: "Gesture not recognized", confidence: 0.3 };
}

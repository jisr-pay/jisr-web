export interface StoryWaypoint {
  id: string;
  /** Scroll progress (0-1) where the camera is exactly at this waypoint */
  t: number;
  /** Camera position in 3D space */
  position: [number, number, number];
  /** Point the camera looks at */
  lookAt: [number, number, number];
}

/**
 * Six beats, camera moves forward (-z) and rises (+y) as t increases
 */
export const STORY_WAYPOINTS: StoryWaypoint[] = [
  { id: "bridge-open", t: 0.0, position: [0, 0, 10], lookAt: [0, 0, 0] },
  { id: "pain-points", t: 0.2, position: [-2, 1, 6], lookAt: [-2, 1, 0] },
  { id: "agent-pipeline", t: 0.4, position: [0, 2, 3], lookAt: [0, 2, -2] },
  { id: "corridor-table", t: 0.6, position: [2, 3, 0], lookAt: [2, 3, -3] },
  { id: "settlement", t: 0.8, position: [0, 4, -3], lookAt: [0, 4, -6] },
  { id: "cta-rise", t: 1.0, position: [0, 6, -6], lookAt: [0, 6, -9] },
];

/** Real pain points from corridors.ts fee comparisons */
export const PAIN_POINTS = [
  { label: "Bank Wire", detail: "6.5% + $15 · 2 days" },
  { label: "Cash Pickup", detail: "5.0% + $10 · 30 mins" },
  { label: "Mobile Money", detail: "3.5% + $2 · 15 mins" },
];

/** 3-agent pipeline */
export const AGENT_NODES = [
  { label: "Rate-Scout", detail: "Finds the best live route" },
  { label: "Router", detail: "Executes via Soroban/Stellar" },
  { label: "Reconciler", detail: "Confirms settlement, issues receipt" },
];

/** Supported corridors */
export const CORRIDORS = [
  { from: "AED", to: "NGN", note: "UAE → Nigeria" },
  { from: "SAR", to: "KES", note: "Saudi Arabia → Kenya" },
  { from: "KWD", to: "GHS", note: "Kuwait → Ghana" },
  { from: "QAR", to: "ETB", note: "Qatar → Ethiopia" },
];

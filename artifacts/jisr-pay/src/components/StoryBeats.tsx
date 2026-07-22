import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useLocation } from "wouter";
import {
  STORY_WAYPOINTS,
  PAIN_POINTS,
  AGENT_NODES,
  CORRIDORS,
} from "./storyWaypoints";
import { computeWaypointOpacity } from "./CameraRig";

interface BeatProps {
  progressRef: RefObject<number>;
}

const waypointById = (id: string) =>
  STORY_WAYPOINTS.find((w) => w.id === id)!;

function useFadeRef(progressRef: RefObject<number>, waypointT: number) {
  const divRef = useRef<HTMLDivElement>(null);
  useFrame(() => {
    const t = progressRef.current ?? 0;
    const opacity = computeWaypointOpacity(t, waypointT);
    if (divRef.current) {
      divRef.current.style.opacity = String(opacity);
      divRef.current.style.transform = `translateY(${(1 - opacity) * 12}px)`;
    }
  });
  return divRef;
}

export function PainPointsBeat({ progressRef }: BeatProps) {
  const wp = waypointById("pain-points");
  const fadeRef = useFadeRef(progressRef, wp.t);

  return (
    <Html position={wp.lookAt} transform occlude={false} distanceFactor={4}>
      <div ref={fadeRef} className="w-72 rounded-xl border border-border bg-card/90 p-4 backdrop-blur shadow-2xl">
        <p className="mb-2 text-xs font-mono font-bold uppercase tracking-wide text-amber-500">
          The Old Remittance Way
        </p>
        <ul className="space-y-2">
          {PAIN_POINTS.map((p) => (
            <li key={p.label} className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">{p.label}</span>
              <span className="text-muted-foreground font-mono text-xs">{p.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </Html>
  );
}

export function AgentPipelineBeat({ progressRef }: BeatProps) {
  const wp = waypointById("agent-pipeline");
  const fadeRef = useFadeRef(progressRef, wp.t);

  return (
    <Html position={wp.lookAt} transform occlude={false} distanceFactor={4}>
      <div ref={fadeRef} className="flex w-[26rem] gap-3">
        {AGENT_NODES.map((agent, i) => (
          <div
            key={agent.label}
            className="flex-1 rounded-xl border border-primary/30 bg-card/90 p-3 text-center backdrop-blur shadow-2xl"
          >
            <p className="mb-1 text-[10px] font-mono font-bold text-primary">{`0${i + 1}`}</p>
            <p className="text-sm font-extrabold text-foreground">{agent.label}</p>
            <p className="mt-1 text-xs text-muted-foreground leading-tight">{agent.detail}</p>
          </div>
        ))}
      </div>
    </Html>
  );
}

export function CorridorTableBeat({ progressRef }: BeatProps) {
  const wp = waypointById("corridor-table");
  const fadeRef = useFadeRef(progressRef, wp.t);

  return (
    <Html position={wp.lookAt} transform occlude={false} distanceFactor={4}>
      <div ref={fadeRef} className="w-80 overflow-hidden rounded-xl border border-border bg-card/90 backdrop-blur shadow-2xl">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted text-[10px] uppercase font-mono text-muted-foreground border-b border-border">
              <th className="px-3 py-2 text-left">From</th>
              <th className="px-3 py-2 text-left">To</th>
              <th className="px-3 py-2 text-left">Corridor</th>
            </tr>
          </thead>
          <tbody>
            {CORRIDORS.map((c) => (
              <tr key={`${c.from}-${c.to}`} className="border-t border-border/50">
                <td className="px-3 py-2 font-bold text-primary">{c.from}</td>
                <td className="px-3 py-2 font-bold text-emerald-400">{c.to}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Html>
  );
}

export function SettlementBeat({ progressRef }: BeatProps) {
  const wp = waypointById("settlement");
  const fadeRef = useFadeRef(progressRef, wp.t);

  return (
    <Html position={wp.lookAt} transform occlude={false} distanceFactor={4}>
      <div ref={fadeRef} className="text-center p-6 rounded-2xl bg-card/80 border border-primary/40 backdrop-blur shadow-2xl">
        <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#00D6FF] to-emerald-400">
          0.4% flat
        </p>
        <p className="mt-2 text-base font-semibold text-foreground">~5 seconds settlement on Stellar</p>
      </div>
    </Html>
  );
}

export function CtaBeat({ progressRef }: BeatProps) {
  const wp = waypointById("cta-rise");
  const fadeRef = useFadeRef(progressRef, wp.t);
  const [, navigate] = useLocation();

  return (
    <Html position={wp.lookAt} transform occlude={false} distanceFactor={4}>
      <div ref={fadeRef} className="text-center p-8 rounded-3xl bg-card/90 border border-primary/40 backdrop-blur shadow-2xl">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
          Send Your First Transfer
        </h2>
        <p className="text-xs text-muted-foreground mt-2 mb-6">Autonomous AI Remittance Engine on Stellar</p>
        <button
          onClick={() => navigate('/app')}
          className="rounded-full bg-gradient-to-r from-primary to-[#00D6FF] px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_25px_rgba(124,58,237,0.5)] transition-all hover:scale-105"
        >
          Initialize Bridge Transfer
        </button>
      </div>
    </Html>
  );
}

import { useMemo, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { BridgeParticles } from "./BridgeParticles";
import { CameraRig } from "./CameraRig";
import {
  PainPointsBeat,
  AgentPipelineBeat,
  CorridorTableBeat,
  SettlementBeat,
  CtaBeat,
} from "./StoryBeats";

interface StorySceneProps {
  progressRef: RefObject<number>;
}

function useLocalBridgeProgress(globalProgressRef: RefObject<number>, endT = 0.25) {
  const localRef = useMemo(() => ({ current: 0 }), []);
  useFrame(() => {
    const t = globalProgressRef.current ?? 0;
    localRef.current = Math.min(1, t / endT);
  });
  return localRef;
}

function BridgeBackdrop({ progressRef }: StorySceneProps) {
  const bridgeProgressRef = useLocalBridgeProgress(progressRef);
  return <BridgeParticles progressRef={bridgeProgressRef} count={1200} />;
}

export function StoryScene({ progressRef }: StorySceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1} color="#7c3aed" />
      <directionalLight position={[0, 5, 5]} intensity={1} color="#ffffff" />

      <CameraRig progressRef={progressRef} />

      {/* Opening beat backdrop particle bridge */}
      <BridgeBackdrop progressRef={progressRef} />

      {/* 3D Positioned Story Beats */}
      <PainPointsBeat progressRef={progressRef} />
      <AgentPipelineBeat progressRef={progressRef} />
      <CorridorTableBeat progressRef={progressRef} />
      <SettlementBeat progressRef={progressRef} />
      <CtaBeat progressRef={progressRef} />
    </Canvas>
  );
}

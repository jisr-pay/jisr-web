import { useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float } from "@react-three/drei";
import * as THREE from "three";
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

/**
 * The original metallic Torus arc mesh from HeroScene
 */
function MetallicBridgeArc() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={[0, -1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4, 0.2, 48, 96, Math.PI]} />
        <meshPhysicalMaterial
          color="#c0c0cc"
          metalness={0.95}
          roughness={0.1}
          envMapIntensity={1.8}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
        />
      </mesh>
    </Float>
  );
}

export function StoryScene({ progressRef }: StorySceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        precision: "mediump",
      }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 5, 0]} intensity={2} color="#7c3aed" />
      <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />

      {/* 3D Camera Rig along Catmull-Rom spline */}
      <CameraRig progressRef={progressRef} />

      {/* Original Metallic 3D Bridge Ring Arc */}
      <MetallicBridgeArc />

      {/* Optimized Procedural Environment Lightformers for metallic reflections */}
      <Environment resolution={128} background={false}>
        <Lightformer
          intensity={2}
          position={[0, 4, -6]}
          scale={[12, 12, 1]}
          color="#7c3aed"
        />
        <Lightformer
          intensity={1.6}
          position={[6, 1, 4]}
          scale={[10, 10, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={1}
          position={[-6, 0, 4]}
          scale={[10, 10, 1]}
          color="#f59e0b"
        />
      </Environment>

      {/* 3D Positioned Story Beats */}
      <PainPointsBeat progressRef={progressRef} />
      <AgentPipelineBeat progressRef={progressRef} />
      <CorridorTableBeat progressRef={progressRef} />
      <SettlementBeat progressRef={progressRef} />
      <CtaBeat progressRef={progressRef} />
    </Canvas>
  );
}

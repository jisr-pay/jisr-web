import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface BridgeParticlesProps {
  progressRef: RefObject<number>;
  count?: number;
  /** Royal Violet — matches --primary token */
  color?: string;
}

/**
 * Two states, interpolated by scroll progress:
 *  - t=0: particles sit along a smooth arc (the "bridge")
 *  - t=0.5: the arc disperses into a turbulent stream (value "in transit")
 *  - t=1: particles converge into a tight cluster on the far side (settlement)
 */
export function BridgeParticles({
  progressRef,
  count = 2000,
  color = "#7c3aed",
}: BridgeParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Precompute the two endpoint layouts for every particle once.
  const { arcPositions, streamPositions, endPositions } = useMemo(() => {
    const arc = new Float32Array(count * 3);
    const stream = new Float32Array(count * 3);
    const end = new Float32Array(count * 3);

    const radius = 3.2;
    const arcSpan = Math.PI * 0.75; // how much of the circle the bridge covers

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = -arcSpan / 2 + t * arcSpan;

      // Arc formation: clean bridge shape
      arc[i * 3] = Math.cos(angle) * radius;
      arc[i * 3 + 1] = Math.sin(angle) * radius * 0.55;
      arc[i * 3 + 2] = (Math.random() - 0.5) * 0.3;

      // Stream formation: turbulent, spread along the travel axis
      const streamT = t;
      stream[i * 3] = (streamT - 0.5) * radius * 2.2;
      stream[i * 3 + 1] = (Math.random() - 0.5) * 1.6 + Math.sin(streamT * Math.PI * 6) * 0.3;
      stream[i * 3 + 2] = (Math.random() - 0.5) * 1.4;

      // End formation: converge on the right side (destination currency)
      const cluster = Math.random() * 0.6;
      const clusterAngle = Math.random() * Math.PI * 2;
      end[i * 3] = radius * 0.9 + Math.cos(clusterAngle) * cluster;
      end[i * 3 + 1] = Math.sin(clusterAngle) * cluster;
      end[i * 3 + 2] = (Math.random() - 0.5) * cluster;
    }

    return { arcPositions: arc, streamPositions: stream, endPositions: end };
  }, [count]);

  const livePositions = useMemo(() => new Float32Array(count * 3), [count]);

  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useFrame((_, delta) => {
    // Respect OS-level reduced-motion preference: hold a static arc
    // instead of driving particles off scroll position.
    const t = reducedMotion ? 0 : progressRef.current ?? 0;
    const geom = pointsRef.current?.geometry;
    if (!geom) return;

    // Two-phase blend: arc -> stream (0 to 0.5), stream -> end (0.5 to 1)
    const phase1 = Math.min(1, t / 0.5);
    const phase2 = Math.max(0, (t - 0.5) / 0.5);

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const midX = THREE.MathUtils.lerp(arcPositions[ix], streamPositions[ix], phase1);
      const midY = THREE.MathUtils.lerp(arcPositions[ix + 1], streamPositions[ix + 1], phase1);
      const midZ = THREE.MathUtils.lerp(arcPositions[ix + 2], streamPositions[ix + 2], phase1);

      livePositions[ix] = THREE.MathUtils.lerp(midX, endPositions[ix], phase2);
      livePositions[ix + 1] = THREE.MathUtils.lerp(midY, endPositions[ix + 1], phase2);
      livePositions[ix + 2] = THREE.MathUtils.lerp(midZ, endPositions[ix + 2], phase2);
    }

    geom.attributes.position.needsUpdate = true;

    // Gentle ambient rotation using delta (no deprecated state.clock)
    if (pointsRef.current && !reducedMotion) {
      pointsRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={livePositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

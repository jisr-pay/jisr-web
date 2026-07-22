import { useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float } from "@react-three/drei";
import { BridgeParticles } from "./BridgeParticles";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import * as THREE from "three";

interface ScrollHeroSectionProps {
  /** Overlaid text/CTA content, positioned above the canvas */
  children?: ReactNode;
  /** Scroll distance the animation plays over. 300 = 3 viewport heights. */
  scrollHeightVh?: number;
}

/**
 * Floating metallic ring arc — exact original geometry & materials
 */
function BridgeArc() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={[0, -0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4, 0.2, 64, 128, Math.PI]} />
        <meshPhysicalMaterial
          color="#c0c0cc"
          metalness={0.95}
          roughness={0.1}
          envMapIntensity={2}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
    </Float>
  );
}

export function ScrollHeroSection({
  children,
  scrollHeightVh = 300,
}: ScrollHeroSectionProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const progressRef = useScrollProgress(containerRef);

  return (
    <section
      ref={containerRef as React.RefObject<HTMLElement>}
      className="relative"
      style={{ height: `${scrollHeightVh}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-background">
        <Canvas
          camera={{ position: [0, 1, 8], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[0, 5, 0]} intensity={2} color="#7c3aed" />
          <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
          
          {/* Metallic Bridge Arc Ring */}
          <BridgeArc />

          {/* Scroll-scrubbed particles */}
          <BridgeParticles progressRef={progressRef} />

          {/* Procedural environment lighting & reflections */}
          <Environment resolution={256} background={false}>
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
        </Canvas>

        {children && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto w-full">{children}</div>
          </div>
        )}
      </div>
    </section>
  );
}

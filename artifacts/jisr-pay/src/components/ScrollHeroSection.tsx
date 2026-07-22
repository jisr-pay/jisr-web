import { useRef, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { BridgeParticles } from "./BridgeParticles";
import { useScrollProgress } from "@/hooks/useScrollProgress";

interface ScrollHeroSectionProps {
  /** Overlaid text/CTA content, positioned above the canvas */
  children?: ReactNode;
  /** Scroll distance the animation plays over. 300 = 3 viewport heights. */
  scrollHeightVh?: number;
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
          camera={{ position: [0, 0, 8], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={0.8} color="#7c3aed" />
          <BridgeParticles progressRef={progressRef} />
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

import { useRef, useState, type ReactNode, type MouseEvent, type CSSProperties } from "react";
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
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update CSS variables for the radial reveal mask
    containerRef.current.style.setProperty('--reveal-x', `${x}px`);
    containerRef.current.style.setProperty('--reveal-y', `${y}px`);
  };

  return (
    <section
      ref={containerRef as React.RefObject<HTMLElement>}
      className="relative"
      style={{ height: `${scrollHeightVh}vh` }}
    >
      <div
        className="sticky top-0 h-screen w-full overflow-hidden bg-background group"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ '--reveal-x': '50%', '--reveal-y': '50%' } as CSSProperties}
      >
        {/* 3D Particle Canvas */}
        <Canvas
          camera={{ position: [0, 0, 8], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={0.8} color="#7c3aed" />
          
          {/* Scroll-scrubbed Particle Ring */}
          <BridgeParticles progressRef={progressRef} />
        </Canvas>

        {/* Interactive Mouse Radial Reveal Mask Effect (from original Hero) */}
        <div
          className="hero-overlay absolute inset-0 z-10 transition-opacity duration-500 ease-out pointer-events-none"
          style={{
            background: `radial-gradient(circle 280px at var(--reveal-x) var(--reveal-y), transparent 0%, var(--hero-overlay-color, rgba(10,10,15,0.92)) 100%)`,
            opacity: isHovered ? 0.75 : 0.95,
          }}
        />

        {/* Hero Text Overlays */}
        {children && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="pointer-events-auto w-full">{children}</div>
          </div>
        )}
      </div>
    </section>
  );
}

import { useRef } from "react";
import { StoryScene } from "./StoryScene";
import { useScrollProgress } from "@/hooks/useScrollProgress";

interface StoryLandingSectionProps {
  /**
   * Total scroll distance for all 6 beats combined. 600vh means each
   * beat gets roughly 100vh of scroll to itself.
   */
  scrollHeightVh?: number;
}

export function StoryLandingSection({ scrollHeightVh = 600 }: StoryLandingSectionProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const progressRef = useScrollProgress(containerRef);

  return (
    <section
      ref={containerRef as React.RefObject<HTMLElement>}
      className="relative"
      style={{ height: `${scrollHeightVh}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-background">
        <StoryScene progressRef={progressRef} />
      </div>
    </section>
  );
}

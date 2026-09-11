import { useRef, useState, type MouseEvent, type CSSProperties } from "react";
import { StoryScene } from "./StoryScene";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { SceneErrorBoundary } from './HeroScene';
import { useI18nContext } from '@/contexts/I18nContext';
import { Link } from 'wouter';

interface StoryLandingSectionProps {
  scrollHeightVh?: number;
}

export function StoryLandingSection(props: StoryLandingSectionProps) {
  const { t } = useI18nContext();
  const fallback = (
    <section className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 text-center bg-gradient-to-br from-background to-primary/20">
      <h1 className="text-4xl font-bold">{t('heroTitle')}</h1>
      <p className="max-w-xl text-muted-foreground">{t('heroSubtitle')}</p>
      <Link href="/app" className="rounded-lg bg-primary px-6 py-3 text-primary-foreground">{t('launchApp')}</Link>
    </section>
  );
  return <SceneErrorBoundary fallback={fallback}><StoryLandingContent {...props} /></SceneErrorBoundary>;
}

function StoryLandingContent({ scrollHeightVh = 600 }: StoryLandingSectionProps) {
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
        {/* 3D Story Canvas */}
        <StoryScene progressRef={progressRef} />

        {/* Interactive Mouse Radial Spotlight Reveal Mask */}
        <div
          className="hero-overlay absolute inset-0 z-10 transition-opacity duration-500 ease-out pointer-events-none"
          style={{
            background: `radial-gradient(circle 280px at var(--reveal-x) var(--reveal-y), transparent 0%, var(--hero-overlay-color, rgba(10,10,15,0.92)) 100%)`,
            opacity: isHovered ? 0.75 : 0.95,
          }}
        />
      </div>
    </section>
  );
}

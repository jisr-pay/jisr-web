import { useRef, useState, useEffect, Suspense, CSSProperties, MouseEvent } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

function BridgeArc() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  // A graceful arc using TorusGeometry, but only showing a portion of it
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={[0, -1, 0]} rotation={[Math.PI / 2, 0, 0]}>
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

export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    };
    setHasWebGL(checkWebGL());
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update CSS variables for the reveal mask
    containerRef.current.style.setProperty('--reveal-x', `${x}px`);
    containerRef.current.style.setProperty('--reveal-y', `${y}px`);
  };

  const useFallback = !hasWebGL || reducedMotion;

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden bg-background group"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ '--reveal-x': '50%', '--reveal-y': '50%' } as CSSProperties}
    >
      {!useFallback ? (
        <>
          <div className="absolute inset-0 z-0">
            <Suspense fallback={null}>
              <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[0, 5, 0]} intensity={2} color="#7c3aed" />
                <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
                <BridgeArc />
                <Environment preset="city" background={false} />
              </Canvas>
            </Suspense>
          </div>
          <div 
            className="hero-overlay absolute inset-0 z-10 transition-opacity duration-500 ease-out"
            style={{
              background: `radial-gradient(circle 250px at var(--reveal-x) var(--reveal-y), transparent 0%, rgba(10,10,15,0.95) 100%)`,
              opacity: isHovered ? 0.7 : 1,
              pointerEvents: 'none',
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a0a0f] via-[#111118] to-[#2e1065] opacity-80" />
      )}
    </div>
  );
}

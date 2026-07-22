import { useRef, Component, ReactNode, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

class SceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFullFromError() {
    return { hasError: true };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

interface BridgeProps {
  progress: number;
}

function Scrollytelling3DScene({ progress }: BridgeProps) {
  const bridgeRef = useRef<THREE.Group>(null);
  const outerArchRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const nodesGroupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Corridor node positions
  const node1Ref = useRef<THREE.Mesh>(null); // AED
  const node2Ref = useRef<THREE.Mesh>(null); // SAR
  const node3Ref = useRef<THREE.Mesh>(null); // NGN
  const node4Ref = useRef<THREE.Mesh>(null); // KES

  useFrame((_, delta) => {
    // Target rotation & scale based on scroll progress (0 to 1)
    if (bridgeRef.current) {
      // Rotation on Y & X axis bound to scroll progress
      const targetRotY = progress * Math.PI * 2;
      const targetRotX = (Math.sin(progress * Math.PI) * 0.4) + 0.2;
      
      bridgeRef.current.rotation.y += (targetRotY - bridgeRef.current.rotation.y) * 0.08;
      bridgeRef.current.rotation.x += (targetRotX - bridgeRef.current.rotation.x) * 0.08;
    }

    // Outer arch dynamics (Disassembles/expands at stage 2, locks at stage 5)
    if (outerArchRef.current) {
      const archScale = 1 + Math.sin(progress * Math.PI) * 0.35;
      outerArchRef.current.scale.set(archScale, archScale, archScale);
    }

    // Inner smart-contract ring spin & tilt
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z += delta * 0.5;
      innerRingRef.current.rotation.y = Math.cos(progress * Math.PI * 2) * 0.8;
    }

    // Floating corridor nodes (Drift apart during Rate-Scout, condense at Reconciler/Done)
    const drift = (1 - Math.abs(progress - 0.5) * 2) * 2.5; // Max drift around 0.5 progress
    if (node1Ref.current) node1Ref.current.position.set(-2.5 - drift, 1.2 + drift * 0.5, 0);
    if (node2Ref.current) node2Ref.current.position.set(2.5 + drift, 1.2 + drift * 0.5, 0);
    if (node3Ref.current) node3Ref.current.position.set(-2.8 - drift * 0.8, -1.2 - drift * 0.5, 0);
    if (node4Ref.current) node4Ref.current.position.set(2.8 + drift * 0.8, -1.2 - drift * 0.5, 0);

    // Particle galaxy condensation
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.1;
      const particleScale = progress > 0.7 ? 1 - (progress - 0.7) * 1.5 : 1 + progress * 0.5;
      particlesRef.current.scale.set(particleScale, particleScale, particleScale);
    }
  });

  // Particle positions
  const particleCount = 150;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
  }

  return (
    <group ref={bridgeRef}>
      {/* Background Particle Galaxy */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#7c3aed"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Main Bridge Arch */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh ref={outerArchRef} position={[0, 0, 0]}>
          <torusGeometry args={[3.2, 0.18, 32, 100, Math.PI * 1.5]} />
          <meshPhysicalMaterial
            color="#7c3aed"
            metalness={0.9}
            roughness={0.1}
            emissive="#4c1d95"
            emissiveIntensity={0.5}
            clearcoat={1}
          />
        </mesh>
      </Float>

      {/* Inner Smart Contract Router Ring */}
      <mesh ref={innerRingRef} position={[0, 0, 0]}>
        <torusGeometry args={[2.0, 0.06, 24, 80]} />
        <meshStandardMaterial
          color="#00D6FF"
          emissive="#0050FF"
          emissiveIntensity={1.2}
          wireframe
        />
      </mesh>

      {/* Center Settlement Core */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshPhysicalMaterial
          color="#f59e0b"
          emissive="#d97706"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Corridor Nodes (Gulf <-> Africa) */}
      <group ref={nodesGroupRef}>
        {/* Node 1: AED */}
        <mesh ref={node1Ref} position={[-2.5, 1.2, 0]}>
          <sphereGeometry args={[0.35, 24, 24]} />
          <meshStandardMaterial color="#7c3aed" emissive="#6d28d9" emissiveIntensity={1} />
        </mesh>

        {/* Node 2: SAR */}
        <mesh ref={node2Ref} position={[2.5, 1.2, 0]}>
          <sphereGeometry args={[0.35, 24, 24]} />
          <meshStandardMaterial color="#00D6FF" emissive="#0284c7" emissiveIntensity={1} />
        </mesh>

        {/* Node 3: NGN */}
        <mesh ref={node3Ref} position={[-2.8, -1.2, 0]}>
          <sphereGeometry args={[0.35, 24, 24]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={1} />
        </mesh>

        {/* Node 4: KES */}
        <mesh ref={node4Ref} position={[2.8, -1.2, 0]}>
          <sphereGeometry args={[0.35, 24, 24]} />
          <meshStandardMaterial color="#f59e0b" emissive="#b45309" emissiveIntensity={1} />
        </mesh>
      </group>
    </group>
  );
}

export function ScrollytellingBridge({ progress }: BridgeProps) {
  const gradientFallback = (
    <div className="absolute inset-0 bg-gradient-to-br from-[#050505] via-[#0b061a] to-[#050505]" />
  );

  return (
    <div className="w-full h-full relative">
      <SceneErrorBoundary fallback={gradientFallback}>
        <Suspense fallback={gradientFallback}>
          <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <pointLight position={[0, 4, 4]} intensity={3} color="#7c3aed" />
            <pointLight position={[0, -4, -4]} intensity={2} color="#00D6FF" />
            <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
            
            <Scrollytelling3DScene progress={progress} />

            {/* Custom light formers for realistic metallic reflections */}
            <Lightformer intensity={2} position={[0, 5, -5]} scale={[10, 10, 1]} color="#7c3aed" />
            <Lightformer intensity={1.5} position={[-5, 0, 5]} scale={[8, 8, 1]} color="#00D6FF" />
          </Canvas>
        </Suspense>
      </SceneErrorBoundary>
    </div>
  );
}

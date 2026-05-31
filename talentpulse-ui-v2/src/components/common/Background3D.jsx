import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

// Interactive Stage with extremely gentle mouse-following parallax
const InteractiveStage = ({ children }) => {
  const ref = useRef();
  
  useFrame((state) => {
    if (!ref.current) return;
    const { x, y } = state.pointer;
    
    // Very gentle parallax scaling factors suitable for strict corporate UI
    ref.current.rotation.y = ref.current.rotation.y + (x * 0.08 - ref.current.rotation.y) * 0.03;
    ref.current.rotation.x = ref.current.rotation.x + (-y * 0.05 - ref.current.rotation.x) * 0.03;
    ref.current.position.x = ref.current.position.x + (x * 0.4 - ref.current.position.x) * 0.03;
    ref.current.position.y = ref.current.position.y + (y * 0.3 - ref.current.position.y) * 0.03;
  });

  return <group ref={ref}>{children}</group>;
};

// Clean, subtle enterprise node network (constellation style)
const TechnicalNetwork = () => {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      // Slow, calm rotation
      ref.current.rotation.y += 0.0003;
      ref.current.rotation.x += 0.00015;
    }
  });

  return (
    <group ref={ref} position={[0, 0, -9]}>
      {/* Primary structural connection shell */}
      <mesh>
        <icosahedronGeometry args={[9.5, 1]} />
        <meshBasicMaterial color="#6345ed" wireframe opacity={0.05} transparent />
      </mesh>
      {/* Inner complementary structure */}
      <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <dodecahedronGeometry args={[7, 1]} />
        <meshBasicMaterial color="#00f2fe" wireframe opacity={0.025} transparent />
      </mesh>
    </group>
  );
};

export const Background3D = ({ className = "absolute inset-0 z-0 overflow-hidden bg-transparent" }) => {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.5} />
        {/* Soft, low-contrast directional light */}
        <directionalLight position={[5, 10, 5]} intensity={1.0} color="#ffffff" />
        <directionalLight position={[-10, -5, -5]} intensity={0.5} color="#6345ed" />
        
        {/* Soft, calm background space dust particles */}
        <Stars radius={100} depth={40} count={1200} factor={3.5} saturation={0.1} fade speed={0.6} />
        
        {/* Extremely gentle mouse-following parallax group */}
        <InteractiveStage>
          <TechnicalNetwork />
        </InteractiveStage>
      </Canvas>
    </div>
  );
};

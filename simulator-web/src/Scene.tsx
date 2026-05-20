import {
  Component,
  type ReactNode,
  Suspense,
  useMemo,
  useRef,
} from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Grid, Html, OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Vignette,
  Scanline,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { type Status, statusColor } from "./lib/threshold";

interface Props {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightOn: boolean;
  showLabels: boolean;
  tempStatus: Status;
  humStatus: Status;
  soilStatus: Status;
}

export function Scene({
  temperature,
  humidity,
  soilMoisture,
  lightOn,
  showLabels,
  tempStatus,
  humStatus,
  soilStatus,
}: Props) {
  return (
    <>
      {/* Three-point lighting. */}
      <ambientLight intensity={0.18} color="#a8d0ff" />
      <directionalLight
        position={[-6, 8, 4]}
        intensity={1.2}
        color="#a8d0ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        position={[6, 4, -2]}
        intensity={0.6}
        color="#ffd9a8"
      />
      <pointLight position={[0, -1, 2]} intensity={0.3} color="#00d4ff" />

      {/* Grid floor. */}
      <Grid
        position={[0, -1.5, 0]}
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1e2838"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#2a3650"
        fadeDistance={30}
        fadeStrength={1.2}
        infiniteGrid
        followCamera={false}
      />

      {/* Plant + pot + LED. */}
      <PlantBoundary>
        <Suspense fallback={<PlantPlaceholder />}>
          <PlantModel />
        </Suspense>
      </PlantBoundary>
      <PotAndLed lightOn={lightOn} />

      {/* Particle field. */}
      <ParticleField />

      {/* Floating sensor labels (HTML overlays in 3D space). */}
      {showLabels && (
        <>
          <SensorBadge
            position={[1.4, 1.6, 0.2]}
            label="T"
            value={`${temperature.toFixed(1)}°`}
            status={tempStatus}
          />
          <SensorBadge
            position={[-1.6, 0.9, 0.2]}
            label="H"
            value={`${humidity.toFixed(0)}%`}
            status={humStatus}
          />
          <SensorBadge
            position={[1.4, -0.4, 0.2]}
            label="S"
            value={`${soilMoisture.toFixed(0)}%`}
            status={soilStatus}
          />
        </>
      )}

      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom
        autoRotate
        autoRotateSpeed={0.4}
        minDistance={3}
        maxDistance={10}
        minPolarAngle={0.4}
        maxPolarAngle={Math.PI / 2 + 0.1}
      />

      <EffectComposer multisampling={0}>
        {/* Subtle bloom — only the emissive LEDs glow, nothing else blows out */}
        <Bloom
          intensity={0.18}
          luminanceThreshold={0.72}
          luminanceSmoothing={0.5}
        />
        <ChromaticAberration
          offset={new THREE.Vector2(0.00025, 0.00025)}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette eskil={false} offset={0.45} darkness={0.38} />
        <Scanline density={1.2} opacity={0.04} />
      </EffectComposer>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Plant                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

class PlantBoundary extends Component<
  { children: ReactNode },
  { errored: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { errored: false };
  }
  static getDerivedStateFromError() {
    return { errored: true };
  }
  componentDidCatch(err: unknown) {
    // eslint-disable-next-line no-console
    console.warn("plant.glb failed to load — using placeholder", err);
  }
  render() {
    if (this.state.errored) return <PlantPlaceholder />;
    return this.props.children;
  }
}

function PlantModel() {
  const url = `${import.meta.env.BASE_URL}plant.glb`;
  const gltf = useLoader(GLTFLoader, url) as unknown as {
    scene: THREE.Object3D;
  };

  const { object, scale, offset } = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    // Enable shadows on all meshes.
    cloned.traverse((node) => {
      const m = node as THREE.Mesh;
      if ((m as { isMesh?: boolean }).isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bbox.getSize(size);
    bbox.getCenter(center);
    const targetHeight = 2.4;
    const s = size.y > 0 ? targetHeight / size.y : 1;
    return {
      object: cloned,
      scale: s,
      offset: new THREE.Vector3(
        -center.x * s,
        -bbox.min.y * s - 0.7,
        -center.z * s,
      ),
    };
  }, [gltf]);

  return (
    <primitive
      object={object}
      position={[offset.x, offset.y, offset.z]}
      scale={[scale, scale, scale]}
    />
  );
}

function PlantPlaceholder() {
  return (
    <group>
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 1.5, 12]} />
        <meshStandardMaterial color="#3a5f0b" />
      </mesh>
      <mesh castShadow position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshStandardMaterial color="#4caf50" />
      </mesh>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Pot + LED                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

const LED_COUNT = 20;
const LED_RADIUS = 0.78;

function PotAndLed({ lightOn }: { lightOn: boolean }) {
  const ledRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    ledRefs.current.forEach((mat, i) => {
      if (!mat) return;
      if (lightOn) {
        // Stagger the pulse across LEDs slightly for a warm ripple effect.
        const phase = (i / LED_COUNT) * Math.PI * 0.6;
        mat.emissiveIntensity = 0.75 + Math.sin(t * 2.5 + phase) * 0.2;
      } else {
        mat.emissiveIntensity = 0;
      }
    });
  });

  const ledPositions = useMemo(
    () =>
      Array.from({ length: LED_COUNT }, (_, i) => {
        const angle = (i / LED_COUNT) * Math.PI * 2;
        return [Math.cos(angle) * LED_RADIUS, 0, Math.sin(angle) * LED_RADIUS] as [
          number,
          number,
          number,
        ];
      }),
    [],
  );

  // 4 point lights spread around the ring for diffuse plant illumination.
  const lightPositions = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        return [Math.cos(angle) * LED_RADIUS * 0.8, 1.2, Math.sin(angle) * LED_RADIUS * 0.8] as [
          number,
          number,
          number,
        ];
      }),
    [],
  );

  return (
    <group>
      {/* Pot body */}
      <mesh castShadow receiveShadow position={[0, -0.85, 0]}>
        <cylinderGeometry args={[0.7, 0.55, 0.7, 32]} />
        <meshStandardMaterial color="#1a2332" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Pot rim trim */}
      <mesh position={[0, -0.5, 0]}>
        <torusGeometry args={[0.7, 0.03, 8, 48]} />
        <meshStandardMaterial color="#2a3650" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.51, 0]}>
        <cylinderGeometry args={[0.66, 0.66, 0.04, 32]} />
        <meshStandardMaterial color="#0d1118" />
      </mesh>

      {/* LED strip housing — dark aluminum channel around the pot rim */}
      <group position={[0, -0.38, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[LED_RADIUS, 0.042, 16, 96]} />
          <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.25} />
        </mesh>

        {/* Individual LED emitters — warm pink/purple like real grow LEDs */}
        {ledPositions.map((pos, i) => (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshStandardMaterial
              ref={(el) => { ledRefs.current[i] = el; }}
              color={lightOn ? "#ffd4f0" : "#1a1a2e"}
              emissive="#ee44cc"
              emissiveIntensity={0}
            />
          </mesh>
        ))}

        {/* Distributed point lights for realistic soft plant illumination */}
        {lightOn &&
          lightPositions.map((pos, i) => (
            <pointLight
              key={i}
              position={pos}
              intensity={1.5}
              distance={5}
              color="#ffb8f0"
            />
          ))}

        {/* Central downward light to illuminate soil */}
        {lightOn && (
          <pointLight
            position={[0, 1.5, 0]}
            intensity={0.7}
            distance={5}
            color="#ffe4f8"
            castShadow={false}
          />
        )}
      </group>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Particles                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function ParticleField() {
  const COUNT = 200;
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = Math.random() * 8 - 1;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    return arr;
  }, []);

  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    const geom = ref.current.geometry as THREE.BufferGeometry;
    const attr = geom.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] += 0.0025;
      if (arr[i * 3 + 1] > 7) arr[i * 3 + 1] = -1;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#ffffff"
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Sensor labels                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

function SensorBadge({
  position,
  label,
  value,
  status,
}: {
  position: [number, number, number];
  label: string;
  value: string;
  status: Status;
}) {
  const color = statusColor(status);
  return (
    <Html position={position} center distanceFactor={8} zIndexRange={[10, 0]}>
      <div
        className="font-mono text-[10px] uppercase tracking-wide2"
        style={{
          background: "rgba(10, 14, 26, 0.85)",
          border: `1px solid ${color}66`,
          color,
          padding: "3px 6px",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
          boxShadow: `0 0 12px ${color}33`,
        }}
      >
        <span style={{ color: "#8a96a8", marginRight: 4 }}>{label}</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
      </div>
    </Html>
  );
}

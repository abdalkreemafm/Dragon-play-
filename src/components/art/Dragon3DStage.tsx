import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DuckAuraId, DuckGearId, DuckSkinId, Rarity } from '../../types/game';
import { DragonIllustration } from './DuckArt';

export interface Dragon3DStageProps {
  skin: DuckSkinId;
  rarity: Rarity;
  level: number;
  customLevel: number;
  gear?: DuckGearId;
  aura?: DuckAuraId;
  isFever?: boolean;
  feedPulseNonce: number;
  levelBurstNonce: number;
  onTapStage: (clientX: number, clientY: number) => void;
}

interface Palette3D {
  body: string;
  belly: string;
  wing: string;
  horn: string;
  eye: string;
  ember: string;
}

const SKIN_3D_PALETTES: Record<DuckSkinId, Palette3D> = {
  aqua: { body: '#06b6d4', belly: '#fde68a', wing: '#fb7185', horn: '#fde047', eye: '#38bdf8', ember: '#38bdf8' },
  lilac: { body: '#9333ea', belly: '#fce7f3', wing: '#f59e0b', horn: '#fef08a', eye: '#f472b6', ember: '#c084fc' },
  classic: { body: '#f97316', belly: '#fef08a', wing: '#fbbf24', horn: '#f8fafc', eye: '#facc15', ember: '#fb923c' },
  dj: { body: '#4f46e5', belly: '#e0e7ff', wing: '#22d3ee', horn: '#38bdf8', eye: '#22d3ee', ember: '#818cf8' },
  gamer: { body: '#10b981', belly: '#ecfdf5', wing: '#34d399', horn: '#a3e635', eye: '#4ade80', ember: '#34d399' },
  cupid: { body: '#ec4899', belly: '#fff1f2', wing: '#f472b6', horn: '#fef08a', eye: '#fb7185', ember: '#f472b6' },
  pumpkin: { body: '#ea580c', belly: '#ffedd5', wing: '#f97316', horn: '#bef264', eye: '#fde047', ember: '#f97316' },
  skeleton: { body: '#94a3b8', belly: '#f8fafc', wing: '#334155', horn: '#e2e8f0', eye: '#22d3ee', ember: '#38bdf8' },
  bride: { body: '#e2e8f0', belly: '#ffffff', wing: '#bae6fd', horn: '#bae6fd', eye: '#38bdf8', ember: '#e0f2fe' },
  cool: { body: '#2563eb', belly: '#eff6ff', wing: '#60a5fa', horn: '#e0f2fe', eye: '#67e8f9', ember: '#60a5fa' },
  pharaoh: { body: '#d97706', belly: '#fef9c3', wing: '#38bdf8', horn: '#fef08a', eye: '#38bdf8', ember: '#facc15' },
  royal: { body: '#eab308', belly: '#fffbeb', wing: '#dc2626', horn: '#ffffff', eye: '#f43f5e', ember: '#facc15' },
  coffee: { body: '#991b1b', belly: '#fed7aa', wing: '#f97316', horn: '#fdba74', eye: '#fb923c', ember: '#ef4444' },
  ninja: { body: '#1e293b', belly: '#475569', wing: '#e11d48', horn: '#f43f5e', eye: '#fb7185', ember: '#f43f5e' },
};

function detectSoftwareWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createProceduralScaleTexture(hexColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = hexColor;
    ctx.fillRect(0, 0, 128, 128);
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const x = col * 16 + (row % 2) * 8;
        const y = row * 16;
        ctx.fillStyle = 'rgba(255,255,255,0.11)';
        ctx.beginPath();
        ctx.arc(x, y, 6.5, 0, Math.PI);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.22)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(x, y + 1, 7, 0, Math.PI);
        ctx.stroke();
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function createRadialParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,215,100,0.85)');
    grad.addColorStop(0.7, 'rgba(251,113,56,0.35)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
    grad.addColorStop(0, 'rgba(0,0,0,0.72)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.28)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const Dragon3DStage: React.FC<Dragon3DStageProps> = ({
  skin,
  rarity,
  level,
  customLevel,
  gear = 'none',
  aura = 'auto',
  isFever = false,
  feedPulseNonce,
  levelBurstNonce,
  onTapStage,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [qualityLabel, setQualityLabel] = useState<'HIGH' | 'MEDIUM' | 'ECO'>('HIGH');

  const propsRef = useRef({ skin, rarity, level, customLevel, gear, aura, isFever });
  propsRef.current = { skin, rarity, level, customLevel, gear, aura, isFever };

  const pulseStateRef = useRef({
    squashImpulse: 0,
    burstEnergy: 0,
    dragYaw: 0,
    targetYaw: 0,
    isDragging: false,
    lastPointerX: 0,
    downPointerX: 0,
    downPointerY: 0,
  });

  const lastFeedNonceRef = useRef(feedPulseNonce);
  const lastLevelNonceRef = useRef(levelBurstNonce);

  useEffect(() => {
    if (feedPulseNonce !== lastFeedNonceRef.current) {
      lastFeedNonceRef.current = feedPulseNonce;
      pulseStateRef.current.squashImpulse = 1;
      pulseStateRef.current.burstEnergy = Math.min(2.2, pulseStateRef.current.burstEnergy + 0.85);
    }
  }, [feedPulseNonce]);

  useEffect(() => {
    if (levelBurstNonce !== lastLevelNonceRef.current) {
      lastLevelNonceRef.current = levelBurstNonce;
      pulseStateRef.current.squashImpulse = 1.45;
      pulseStateRef.current.burstEnergy = 2.8;
    }
  }, [levelBurstNonce]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const lowMem =
      typeof navigator !== 'undefined' &&
      'deviceMemory' in navigator &&
      Number((navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8) <= 3;

    const isSoftwareGl = detectSoftwareWebGL();
    let tier: 'HIGH' | 'MEDIUM' | 'ECO' = isSoftwareGl || prefersReduced ? 'ECO' : lowMem ? 'MEDIUM' : 'HIGH';
    setQualityLabel(tier);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: tier === 'HIGH',
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    const width = Math.max(220, container.clientWidth);
    const height = Math.max(220, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(tier === 'HIGH' ? Math.min(window.devicePixelRatio || 1, 1.75) : 1);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = tier === 'HIGH';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvasEl = renderer.domElement;
    canvasEl.style.width = '100%';
    canvasEl.style.height = '100%';
    canvasEl.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(canvasEl);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglFailed(true);
    };
    const onContextRestored = () => {
      setWebglFailed(false);
    };
    canvasEl.addEventListener('webglcontextlost', onContextLost);
    canvasEl.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0d14, 0.055);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 40);
    camera.position.set(0, 1.85, 5.4);
    camera.lookAt(0, 0.85, 0);

    // 3-Point Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e1b4b, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 1.75);
    keyLight.position.set(3.4, 5.2, 4.0);
    keyLight.castShadow = tier === 'HIGH';
    keyLight.shadow.mapSize.width = 512;
    keyLight.shadow.mapSize.height = 512;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.45);
    rimLight.position.set(-3.2, 2.8, -3.5);
    scene.add(rimLight);

    const auraPointLight = new THREE.PointLight(0xf97316, 1.4, 8, 2);
    auraPointLight.position.set(0, 1.1, 1.2);
    scene.add(auraPointLight);

    // Disposable resource registry
    const disposables: { dispose: () => void }[] = [envTex];
    const track = <T extends { dispose: () => void }>(res: T): T => {
      disposables.push(res);
      return res;
    };

    // Ground Stone Pedestal & Contact Shadow (pivoted bottom-center so nothing floats)
    const pedestalGroup = new THREE.Group();
    scene.add(pedestalGroup);

    const shadowTex = track(createContactShadowTexture());
    const contactPlane = new THREE.Mesh(
      track(new THREE.PlaneGeometry(3.4, 3.4)),
      track(
        new THREE.MeshBasicMaterial({
          map: shadowTex,
          transparent: true,
          depthWrite: false,
          opacity: 0.52,
        })
      )
    );
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.y = 0.01;
    pedestalGroup.add(contactPlane);

    const stoneMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0x1a1f2e,
        roughness: 0.72,
        metalness: 0.25,
        clearcoat: 0.15,
      })
    );
    const pedestalBase = new THREE.Mesh(track(new THREE.CylinderGeometry(1.38, 1.56, 0.24, 24)), stoneMat);
    pedestalBase.position.y = 0.12;
    pedestalBase.receiveShadow = true;
    pedestalGroup.add(pedestalBase);

    const runeRingMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.9,
        roughness: 0.25,
        metalness: 0.85,
      })
    );
    const runeRing = new THREE.Mesh(track(new THREE.TorusGeometry(1.32, 0.032, 10, 48)), runeRingMat);
    runeRing.rotation.x = Math.PI / 2;
    runeRing.position.y = 0.245;
    pedestalGroup.add(runeRing);

    // Composite 10+ Part Dragon Rig
    const dragonRoot = new THREE.Group();
    dragonRoot.position.y = 0.24;
    scene.add(dragonRoot);

    const scaleTex = track(createProceduralScaleTexture('#06b6d4'));
    const bodyMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0x06b6d4,
        map: scaleTex,
        roughness: 0.32,
        metalness: 0.22,
        clearcoat: 0.65,
        clearcoatRoughness: 0.25,
      })
    );
    const bellyMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xfde68a,
        roughness: 0.62,
        metalness: 0.08,
      })
    );
    const wingMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xfb7185,
        roughness: 0.45,
        metalness: 0.15,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      })
    );
    const hornMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xfde047,
        roughness: 0.22,
        metalness: 0.88,
        clearcoat: 0.8,
      })
    );
    const eyeMat = track(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x38bdf8,
        emissiveIntensity: 2.1,
        roughness: 0.1,
      })
    );
    const goldGearMat = track(
      new THREE.MeshPhysicalMaterial({
        color: 0xfacc15,
        roughness: 0.18,
        metalness: 0.94,
        clearcoat: 1.0,
      })
    );

    const rigPivot = new THREE.Group();
    dragonRoot.add(rigPivot);

    // 1. Torso
    const torso = new THREE.Mesh(track(new THREE.SphereGeometry(0.62, 24, 20)), bodyMat);
    torso.scale.set(0.95, 1.12, 1.05);
    torso.position.set(0, 0.78, 0);
    torso.castShadow = true;
    rigPivot.add(torso);

    // 2. Belly Armor
    const belly = new THREE.Mesh(track(new THREE.SphereGeometry(0.5, 20, 16)), bellyMat);
    belly.scale.set(0.84, 0.96, 0.72);
    belly.position.set(0, 0.72, 0.31);
    rigPivot.add(belly);

    // 3. Chest Core Gem (emits more energy with customLevel)
    const coreGem = new THREE.Mesh(track(new THREE.OctahedronGeometry(0.14, 0)), eyeMat);
    coreGem.position.set(0, 0.86, 0.59);
    rigPivot.add(coreGem);

    // 4. Feet (Grounded)
    const footGeo = track(new THREE.SphereGeometry(0.22, 14, 12));
    const footL = new THREE.Mesh(footGeo, bodyMat);
    footL.scale.set(0.95, 0.55, 1.35);
    footL.position.set(-0.34, 0.13, 0.24);
    footL.castShadow = true;
    const footR = new THREE.Mesh(footGeo, bodyMat);
    footR.scale.set(0.95, 0.55, 1.35);
    footR.position.set(0.34, 0.13, 0.24);
    footR.castShadow = true;
    rigPivot.add(footL, footR);

    // 5. Head & Snout Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.5, 0.18);
    rigPivot.add(headGroup);

    const cranium = new THREE.Mesh(track(new THREE.SphereGeometry(0.42, 22, 18)), bodyMat);
    cranium.scale.set(1.0, 0.94, 1.08);
    cranium.castShadow = true;
    headGroup.add(cranium);

    const snout = new THREE.Mesh(track(new THREE.CylinderGeometry(0.19, 0.28, 0.45, 16)), bodyMat);
    snout.rotation.x = Math.PI / 2.15;
    snout.position.set(0, -0.06, 0.36);
    headGroup.add(snout);

    // Eyes
    const eyeGeo = track(new THREE.SphereGeometry(0.082, 12, 12));
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.22, 0.08, 0.34);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.22, 0.08, 0.34);
    headGroup.add(eyeL, eyeR);

    // Horns (scale with level)
    const hornGeo = track(new THREE.ConeGeometry(0.085, 0.56, 12));
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-0.22, 0.42, -0.06);
    hornL.rotation.set(-0.35, 0, 0.32);
    const hornR = new THREE.Mesh(hornGeo, hornMat);
    hornR.position.set(0.22, 0.42, -0.06);
    hornR.rotation.set(-0.35, 0, -0.32);
    headGroup.add(hornL, hornR);

    // 6. Articulated Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.quadraticCurveTo(0.85, 0.65, 1.25, 0.15);
    wingShape.quadraticCurveTo(0.85, -0.25, 0.55, -0.45);
    wingShape.quadraticCurveTo(0.25, -0.2, 0, -0.35);
    wingShape.closePath();

    const wingGeo = track(
      new THREE.ExtrudeGeometry(wingShape, {
        depth: 0.035,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.015,
        bevelSegments: 2,
      })
    );

    const wingPivotL = new THREE.Group();
    wingPivotL.position.set(-0.38, 1.08, -0.28);
    const wingMeshL = new THREE.Mesh(wingGeo, wingMat);
    wingMeshL.rotation.y = Math.PI + 0.35;
    wingMeshL.castShadow = true;
    wingPivotL.add(wingMeshL);

    const wingPivotR = new THREE.Group();
    wingPivotR.position.set(0.38, 1.08, -0.28);
    const wingMeshR = new THREE.Mesh(wingGeo, wingMat);
    wingMeshR.rotation.y = -0.35;
    wingMeshR.castShadow = true;
    wingPivotR.add(wingMeshR);
    rigPivot.add(wingPivotL, wingPivotR);

    // 7. Curved Segmented Tail
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.42, -0.45),
      new THREE.Vector3(0, 0.36, -0.95),
      new THREE.Vector3(0.35, 0.52, -1.25),
      new THREE.Vector3(0.65, 0.85, -1.05),
    ]);
    const tailGeo = track(new THREE.TubeGeometry(tailCurve, 18, 0.12, 10, false));
    const tailMesh = new THREE.Mesh(tailGeo, bodyMat);
    tailMesh.castShadow = true;
    const tailTip = new THREE.Mesh(track(new THREE.ConeGeometry(0.14, 0.32, 6)), hornMat);
    tailTip.position.set(0.68, 0.94, -1.01);
    tailTip.rotation.z = -0.45;
    rigPivot.add(tailMesh, tailTip);

    // 8. Dorsal Spines
    const spineGeo = track(new THREE.ConeGeometry(0.075, 0.24, 6));
    for (let s = 0; s < 4; s++) {
      const sp = new THREE.Mesh(spineGeo, hornMat);
      sp.position.set(0, 1.24 - s * 0.18, -0.42 - s * 0.08);
      sp.rotation.x = -0.8;
      rigPivot.add(sp);
    }

    // 9. Gear Attachments (Crown / Helmet / Shades / Extra Wings)
    const crownGroup = new THREE.Group();
    const crownBand = new THREE.Mesh(track(new THREE.TorusGeometry(0.24, 0.045, 8, 24)), goldGearMat);
    crownBand.rotation.x = Math.PI / 2;
    crownGroup.add(crownBand);
    for (let c = 0; c < 5; c++) {
      const ang = (c / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(track(new THREE.ConeGeometry(0.05, 0.18, 6)), goldGearMat);
      spike.position.set(Math.cos(ang) * 0.22, 0.09, Math.sin(ang) * 0.22);
      crownGroup.add(spike);
    }
    crownGroup.position.set(0, 0.44, 0.02);
    headGroup.add(crownGroup);

    const helmetMesh = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.45, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.56)),
      goldGearMat
    );
    helmetMesh.position.set(0, 0.04, 0);
    headGroup.add(helmetMesh);

    const shadesMesh = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.56, 0.13, 0.14)),
      track(new THREE.MeshPhysicalMaterial({ color: 0x0f172a, roughness: 0.08, metalness: 0.8, clearcoat: 1.0 }))
    );
    shadesMesh.position.set(0, 0.08, 0.39);
    headGroup.add(shadesMesh);

    // 10. Star Customization Orbital Ring (visible when customLevel >= 1)
    const starOrbitGroup = new THREE.Group();
    starOrbitGroup.position.set(0, 1.0, 0);
    dragonRoot.add(starOrbitGroup);

    const orbitRing = new THREE.Mesh(track(new THREE.TorusGeometry(1.18, 0.025, 8, 48)), runeRingMat);
    orbitRing.rotation.x = Math.PI / 2.2;
    starOrbitGroup.add(orbitRing);

    const starSatellites: THREE.Mesh[] = [];
    const satGeo = track(new THREE.OctahedronGeometry(0.08, 0));
    for (let i = 0; i < 6; i++) {
      const sat = new THREE.Mesh(satGeo, goldGearMat);
      const a = (i / 6) * Math.PI * 2;
      sat.position.set(Math.cos(a) * 1.18, 0, Math.sin(a) * 1.18);
      starOrbitGroup.add(sat);
      starSatellites.push(sat);
    }

    // 11. Live 3D Fire & Ember Particle System
    const particleCount = tier === 'HIGH' ? 72 : tier === 'MEDIUM' ? 40 : 22;
    const pPositions = new Float32Array(particleCount * 3);
    const pVelocities = new Float32Array(particleCount * 3);
    const pLife = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 0.2 + Math.random() * 1.15;
      pPositions[i * 3] = Math.cos(ang) * rad;
      pPositions[i * 3 + 1] = Math.random() * 2.2;
      pPositions[i * 3 + 2] = Math.sin(ang) * rad;
      pVelocities[i * 3] = (Math.random() - 0.5) * 0.28;
      pVelocities[i * 3 + 1] = 0.55 + Math.random() * 0.95;
      pVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.28;
      pLife[i] = Math.random();
    }

    const particleGeo = track(new THREE.BufferGeometry());
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const emberTex = track(createRadialParticleTexture());
    const particleMat = track(
      new THREE.PointsMaterial({
        color: 0xfb923c,
        map: emberTex,
        size: tier === 'HIGH' ? 0.24 : 0.28,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const emberPoints = new THREE.Points(particleGeo, particleMat);
    scene.add(emberPoints);

    // Pre-allocated math helpers (Zero GC inside render loop)
    const _colorA = new THREE.Color();
    const _colorB = new THREE.Color();
    let lastSkinSynced: DuckSkinId | null = null;
    let lastAuraSynced: DuckAuraId | null = null;

    const clock = new THREE.Clock();
    let frameId = 0;
    let slowFrames = 0;
    let disposed = false;

    const applySkinAndState = (elapsed: number) => {
      const cur = propsRef.current;
      const pal = SKIN_3D_PALETTES[cur.skin] ?? SKIN_3D_PALETTES.aqua;

      if (lastSkinSynced !== cur.skin || lastAuraSynced !== cur.aura) {
        lastSkinSynced = cur.skin;
        lastAuraSynced = cur.aura;
        bodyMat.color.set(pal.body);
        bellyMat.color.set(pal.belly);
        wingMat.color.set(pal.wing);
        hornMat.color.set(pal.horn);
        eyeMat.emissive.set(pal.eye);

        const auraHex =
          cur.aura === 'gold'
            ? '#facc15'
            : cur.aura === 'flame'
              ? '#f43f5e'
              : cur.aura === 'emerald'
                ? '#34d399'
                : pal.ember;

        runeRingMat.color.set(auraHex);
        runeRingMat.emissive.set(auraHex);
        particleMat.color.set(auraHex);
        auraPointLight.color.set(auraHex);
        rimLight.color.set(auraHex);
      }

      // Evolution scaling across LVL 1..5 + Gear visibility
      const evoScale = 0.78 + (cur.level - 1) * 0.085;
      const pulse = pulseStateRef.current;
      const squash = 1 - pulse.squashImpulse * 0.14;
      const stretch = 1 + pulse.squashImpulse * 0.16;
      dragonRoot.scale.set(evoScale * stretch, evoScale * squash, evoScale * stretch);

      const hornGrowth = 0.65 + cur.level * 0.14;
      hornL.scale.setScalar(hornGrowth);
      hornR.scale.setScalar(hornGrowth);

      const wingScale = (cur.level >= 2 ? 0.68 + cur.level * 0.12 : 0.42) * (cur.gear === 'wings' ? 1.24 : 1);
      wingPivotL.scale.setScalar(wingScale);
      wingPivotR.scale.setScalar(wingScale);

      crownGroup.visible = cur.gear === 'crown';
      helmetMesh.visible = cur.gear === 'helmet';
      shadesMesh.visible = cur.gear === 'shades';

      // Star customization aura
      starOrbitGroup.visible = cur.customLevel >= 1;
      if (starOrbitGroup.visible) {
        starOrbitGroup.rotation.y = elapsed * (0.7 + cur.customLevel * 0.08);
        starOrbitGroup.rotation.z = Math.sin(elapsed * 0.9) * 0.12;
        const activeSats = Math.min(6, Math.max(1, Math.ceil(cur.customLevel / 2)));
        starSatellites.forEach((sat, idx) => {
          sat.visible = idx < activeSats;
          sat.rotation.y = elapsed * 2;
        });
      }

      // Fever or Burst light boost
      const glowMult = cur.isFever ? 1.8 : 1 + pulse.burstEnergy * 0.6;
      auraPointLight.intensity = 1.2 * glowMult + Math.sin(elapsed * 3.5) * 0.25;
      _colorA.set(pal.ember);
      _colorB.set('#f43f5e');
      if (cur.isFever) {
        particleMat.color.lerpColors(_colorA, _colorB, 0.5 + 0.5 * Math.sin(elapsed * 6));
      }
    };

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const stateVal = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (stateVal === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      // Adaptive performance downgrade on struggling devices
      if (dt > 0.036 && tier !== 'ECO' && !isSoftwareGl) {
        slowFrames++;
        if (slowFrames >= 18) {
          tier = tier === 'HIGH' ? 'MEDIUM' : 'ECO';
          renderer.setPixelRatio(1);
          renderer.shadowMap.enabled = false;
          setQualityLabel(tier);
          slowFrames = 0;
        }
      } else {
        slowFrames = Math.max(0, slowFrames - 1);
      }

      const pulse = pulseStateRef.current;
      pulse.squashImpulse = THREE.MathUtils.damp(pulse.squashImpulse, 0, 14, dt);
      pulse.burstEnergy = THREE.MathUtils.damp(pulse.burstEnergy, 0, 4.5, dt);

      if (!pulse.isDragging) {
        pulse.targetYaw = Math.sin(elapsed * 0.55) * 0.24;
      }
      pulse.dragYaw = THREE.MathUtils.damp(pulse.dragYaw, pulse.targetYaw, 6, dt);
      rigPivot.rotation.y = pulse.dragYaw;

      // Breathing & Wing Flap
      const cur = propsRef.current;
      const flapSpeed = cur.isFever ? 7.5 : 2.6 + pulse.burstEnergy * 1.8;
      rigPivot.position.y = Math.sin(elapsed * 2.3) * 0.045;
      headGroup.rotation.x = Math.sin(elapsed * 1.8) * 0.06 - pulse.squashImpulse * 0.22;
      wingPivotL.rotation.z = -0.25 + Math.sin(elapsed * flapSpeed) * 0.26;
      wingPivotR.rotation.z = 0.25 - Math.sin(elapsed * flapSpeed) * 0.26;

      applySkinAndState(elapsed);

      // Animate Fire/Ember Particles
      const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const speedMult = (cur.isFever ? 2.1 : 1) + pulse.burstEnergy * 1.3;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        arr[idx] += pVelocities[idx] * dt * speedMult;
        arr[idx + 1] += pVelocities[idx + 1] * dt * speedMult;
        arr[idx + 2] += pVelocities[idx + 2] * dt * speedMult;
        pLife[i] += dt * (0.45 + pulse.burstEnergy * 0.35);
        if (pLife[i] >= 1 || arr[idx + 1] > 2.8) {
          const ang = (i * 1.7 + elapsed) % (Math.PI * 2);
          const rad = 0.22 + (i % 5) * 0.22;
          arr[idx] = Math.cos(ang) * rad;
          arr[idx + 1] = 0.22 + (i % 3) * 0.1;
          arr[idx + 2] = Math.sin(ang) * rad;
          pLife[i] = 0;
        }
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);

      if (isSoftwareGl || prefersReduced) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (!isSoftwareGl && tier === 'HIGH') {
      renderer.compile(scene, camera);
    }
    tick();

    const handleResize = () => {
      if (!container || disposed) return;
      const w = Math.max(220, container.clientWidth);
      const h = Math.max(220, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      canvasEl.removeEventListener('webglcontextlost', onContextLost);
      canvasEl.removeEventListener('webglcontextrestored', onContextRestored);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, []);

  if (webglFailed) {
    return (
      <button
        type="button"
        onClick={(e) => onTapStage(e.clientX, e.clientY)}
        className="relative w-full h-full flex items-center justify-center cursor-pointer select-none focus:outline-none"
      >
        <DragonIllustration
          skin={skin}
          level={level}
          customLevel={customLevel}
          gear={gear}
          aura={aura}
          showEvolutionEffects={true}
          mood={isFever ? 'fever' : 'idle'}
          className="w-44 h-44 sm:w-52 sm:h-52"
        />
      </button>
    );
  }

  return (
    <div
      className="relative w-full h-full select-none touch-pan-y cursor-pointer"
      onPointerDown={(e) => {
        pulseStateRef.current.isDragging = true;
        pulseStateRef.current.lastPointerX = e.clientX;
        pulseStateRef.current.downPointerX = e.clientX;
        pulseStateRef.current.downPointerY = e.clientY;
      }}
      onPointerMove={(e) => {
        if (!pulseStateRef.current.isDragging) return;
        const dx = e.clientX - pulseStateRef.current.lastPointerX;
        pulseStateRef.current.lastPointerX = e.clientX;
        pulseStateRef.current.targetYaw = THREE.MathUtils.clamp(
          pulseStateRef.current.targetYaw + dx * 0.012,
          -1.2,
          1.2
        );
      }}
      onPointerUp={(e) => {
        const moved = Math.hypot(
          e.clientX - pulseStateRef.current.downPointerX,
          e.clientY - pulseStateRef.current.downPointerY
        );
        pulseStateRef.current.isDragging = false;
        if (moved < 12) {
          onTapStage(e.clientX, e.clientY);
        }
      }}
      onPointerLeave={() => {
        pulseStateRef.current.isDragging = false;
      }}
    >
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};

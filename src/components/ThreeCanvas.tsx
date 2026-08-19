import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GameState, FallingItem } from '../types';

interface ThreeCanvasProps {
  gameState: GameState;
  gameTimer?: number;
  anxietyLevel: number;
  notificationSpeed: number;
  onItemCollect: (itemType: FallingItem['type']) => void;
  playerPosRef: React.MutableRefObject<number>;
  umbrellaActive?: boolean;
  outdoorShieldActive?: boolean;
}

// Helper for proper WebGL GPU memory cleanup of unique mesh instances
function disposeObject3D(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      // Only dispose unique non-cached geometries (e.g., ground rings)
      if (mesh.name === 'beaconRing' && mesh.geometry) {
        mesh.geometry.dispose();
      }
    }
  });
}

// Dynamic Canvas procedural texture for Animated R15 Face reacting to Anxiety Levels
function createR15FaceTexture(anxietyLevel: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Smooth skin tone base
  ctx.fillStyle = '#f5c09e';
  ctx.fillRect(0, 0, 256, 256);

  if (anxietyLevel < 35) {
    // --- LOW ANXIETY (0-34%): RELAXED / SERENE FOCUS ---
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(80, 115, 20, 13, -0.05, 0, Math.PI * 2);
    ctx.ellipse(176, 115, 20, 13, 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(82, 115, 9, 0, Math.PI * 2);
    ctx.arc(174, 115, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(79, 112, 3.5, 0, Math.PI * 2);
    ctx.arc(171, 112, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1e1b18';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(58, 92);
    ctx.quadraticCurveTo(80, 85, 102, 92);
    ctx.moveTo(154, 92);
    ctx.quadraticCurveTo(176, 85, 198, 92);
    ctx.stroke();

    ctx.strokeStyle = '#9f5841';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(108, 168);
    ctx.quadraticCurveTo(128, 175, 148, 168);
    ctx.stroke();
  } else if (anxietyLevel < 70) {
    // --- MEDIUM ANXIETY (35-69%): FOCUSED / ALERT ---
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(80, 115, 19, 11, 0, 0, Math.PI * 2);
    ctx.ellipse(176, 115, 19, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(80, 115, 8, 0, Math.PI * 2);
    ctx.arc(176, 115, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(78, 113, 3, 0, Math.PI * 2);
    ctx.arc(174, 113, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1e1b18';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(58, 86);
    ctx.lineTo(102, 94);
    ctx.moveTo(154, 94);
    ctx.lineTo(198, 86);
    ctx.stroke();

    ctx.strokeStyle = '#9f5841';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(108, 170);
    ctx.lineTo(148, 170);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(205, 110, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // --- HIGH ANXIETY (70-100%): TENSE / OVERWHELMED ---
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(80, 115, 16, 0, Math.PI * 2);
    ctx.arc(176, 115, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(80, 115, 10, 0, Math.PI * 2);
    ctx.arc(176, 115, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1e1b18';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(55, 82);
    ctx.lineTo(102, 98);
    ctx.moveTo(154, 98);
    ctx.lineTo(201, 82);
    ctx.stroke();

    ctx.strokeStyle = '#881337';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(108, 172);
    ctx.quadraticCurveTo(128, 164, 148, 172);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(210, 105, 5, 0, Math.PI * 2);
    ctx.arc(45, 110, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Procedural High-Fidelity FIFA Pro Match Soccer Ball Texture with 32-panel truncated icosahedron geometry
function createRealisticSoccerBallTexture(): THREE.CanvasTexture {
  // --- 3D CLASSIC TELSTAR SOCCER BALL (BOLA DE FUTEBOL CLÁSSICA) TEXTURE GENERATOR ---
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Pure White Leather Base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1024, 512);

  // Micro-leather grain texture
  ctx.fillStyle = 'rgba(15, 23, 42, 0.035)';
  for (let i = 0; i < 6000; i++) {
    ctx.fillRect(Math.random() * 1024, Math.random() * 512, 1.2, 1.2);
  }

  // Helper to draw geometric panel (Pentagon / Hexagon)
  const drawPolygon = (
    cx: number,
    cy: number,
    radius: number,
    sides: number,
    rotation: number,
    fillStyle: string,
    strokeStyle: string
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    ctx.fillStyle = fillStyle;
    ctx.fill();

    ctx.lineWidth = 4.0;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();

    // Double-stitched seam thread lines
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  };

  // Surrounding white hexagonal leather panels grid
  for (let c = 0; c < 8; c++) {
    for (let r = 0; r < 4; r++) {
      const hx = (c + 0.5) * 128;
      const hy = (r + 0.5) * 128;
      drawPolygon(hx, hy, 76, 6, Math.PI / 6, '#f8fafc', '#1e293b');
    }
  }

  // Iconic Black Pentagons on sphere UV map
  const pentCenters = [
    { x: 170, y: 128, rot: 0 },
    { x: 512, y: 128, rot: Math.PI / 5 },
    { x: 854, y: 128, rot: 0 },
    { x: 341, y: 384, rot: Math.PI / 5 },
    { x: 683, y: 384, rot: 0 },
    { x: 1024, y: 384, rot: Math.PI / 5 },
    { x: 0, y: 384, rot: Math.PI / 5 },
    { x: 256, y: 256, rot: 0.2 },
    { x: 768, y: 256, rot: -0.2 },
  ];

  pentCenters.forEach(({ x, y, rot }) => {
    drawPolygon(x, y, 56, 5, rot, '#111827', '#000000');
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

// 12 Mathematical Vertices of a Regular Icosahedron for Perfect Spherical Pentagon Placement
const PHI_VAL = (1 + Math.sqrt(5)) / 2;
const ICO_VERTICES: [number, number, number][] = [
  [0, 1, PHI_VAL],
  [0, 1, -PHI_VAL],
  [0, -1, PHI_VAL],
  [0, -1, -PHI_VAL],
  [1, PHI_VAL, 0],
  [1, -PHI_VAL, 0],
  [-1, PHI_VAL, 0],
  [-1, -PHI_VAL, 0],
  [PHI_VAL, 0, 1],
  [PHI_VAL, 0, -1],
  [-PHI_VAL, 0, 1],
  [-PHI_VAL, 0, -1],
];

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  gameState,
  gameTimer = 0,
  anxietyLevel,
  notificationSpeed,
  onItemCollect,
  playerPosRef,
  umbrellaActive = false,
  outdoorShieldActive = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<FallingItem[]>([]);
  const active3DObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const anxietyRef = useRef(anxietyLevel);
  anxietyRef.current = anxietyLevel;
  const gameTimerRef = useRef(gameTimer);
  gameTimerRef.current = gameTimer;
  const notificationSpeedRef = useRef(notificationSpeed);
  notificationSpeedRef.current = notificationSpeed;
  const umbrellaActiveRef = useRef(umbrellaActive);
  umbrellaActiveRef.current = umbrellaActive;
  const outdoorShieldActiveRef = useRef(outdoorShieldActive);
  outdoorShieldActiveRef.current = outdoorShieldActive;

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);
    scene.fog = new THREE.FogExp2(0x050508, 0.015);

    const initialCamX = playerPosRef.current;

    // --- Camera (Roblox 2.5D Perspective with Responsive FOV) ---
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(initialCamX, 14.4, 32);
    camera.lookAt(initialCamX, 9.4, 0);

    // Responsive FOV adjustment to ensure playing area is always fully visible on portrait or narrow screens
    const adjustCameraFOV = (cam: THREE.PerspectiveCamera, w: number, h: number) => {
      const aspect = w / h;
      cam.aspect = aspect;
      if (aspect < 1.7) {
        const targetWidth = 48; // Safe platform boundary width
        const distance = 32.4;  // Approximate camera distance to z=0 plane
        const requiredFovRad = 2 * Math.atan(targetWidth / (2 * distance * aspect));
        const requiredFovDeg = requiredFovRad * (180 / Math.PI);
        cam.fov = Math.max(50, Math.min(85, requiredFovDeg));
      } else {
        cam.fov = 50;
      }
      cam.updateProjectionMatrix();
    };

    adjustCameraFOV(camera, width, height);

    // --- High Performance Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    containerRef.current.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(initialCamX + 15, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 512;
    dirLight.shadow.mapSize.height = 512;
    scene.add(dirLight);

    // Neon Accent Lights
    const cyanLight = new THREE.PointLight(0x00f3ff, 2.5, 35);
    cyanLight.position.set(initialCamX - 22, 15, 5);
    scene.add(cyanLight);

    const magentaLight = new THREE.PointLight(0xff007f, 2.5, 35);
    magentaLight.position.set(initialCamX + 22, 15, 5);
    scene.add(magentaLight);

    // --- Environment / Platform (Expanded 600-unit Wide Sidewalk/Street Area) ---
    const floorGeo = new THREE.PlaneGeometry(620, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937, // dark gray street pavement
      roughness: 0.65,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid Overlay for expanded street layout
    const gridHelper = new THREE.GridHelper(620, 180, 0x475569, 0x334155);
    gridHelper.position.y = 0.05;
    scene.add(gridHelper);

    // --- Background Sidewalk Street Scenery Line Along Expanded Walkway ---
    const sceneryGroup = new THREE.Group();
    sceneryGroup.position.set(0, 0, -6); // closer to the walking track for real depth

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a }); // warm street lamp glow
    const lampConeMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const treeFoliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    const coniferFoliageMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.7 }); // deeper green
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 }); // stone slate gray
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 }); // bright bush green
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 }); // soft grass green
    const flowerMats = [
      new THREE.MeshBasicMaterial({ color: 0xf43f5e }), // pink flower
      new THREE.MeshBasicMaterial({ color: 0xeab308 }), // yellow flower
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 })  // cyan flower
    ];

    // Seed-based random generator to keep the scenery stable and deterministic
    let seed = 42;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Distribute highly detailed, dense plaza scenery across X = -290 to +290 with 7.5 unit intervals
    for (let x = -290; x <= 290; x += 7.5) {
      const r = random();
      
      // Determine what decoration type to spawn in this slot:
      // 0: Street Lamp with light cone
      // 1: Leafy Tree (Type A)
      // 2: Conifer/Pine Tree (Type B)
      // 3: Garden Rock Cluster
      // 4: Plush Bush Cluster
      // 5: Lawn/Grass Bed with flowers
      // 6: Cozy Bench
      // 7: Bench with side bush/rocks
      const typeChoice = Math.floor(r * 8);

      if (typeChoice === 0) {
        // --- STREET LAMPPOST WITH LIGHT CONE ---
        const lampPostGroup = new THREE.Group();
        lampPostGroup.position.set(x, 0, 0);

        // Main metal pole
        const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 9, 8);
        const pole = new THREE.Mesh(poleGeo, metalMat);
        pole.position.y = 4.5;
        lampPostGroup.add(pole);

        // Horizontal hanging bar
        const barGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
        const bar = new THREE.Mesh(barGeo, metalMat);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0.6, 8.8, 0);
        lampPostGroup.add(bar);

        // Hanging lantern cover
        const lanternGeo = new THREE.CylinderGeometry(0.3, 0.45, 0.8, 8);
        const lantern = new THREE.Mesh(lanternGeo, metalMat);
        lantern.position.set(1.2, 8.4, 0);
        lampPostGroup.add(lantern);

        // Glowing warm light bulb
        const bulbGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const bulb = new THREE.Mesh(bulbGeo, lampGlowMat);
        bulb.position.set(1.2, 8.0, 0);
        lampPostGroup.add(bulb);

        // BEAUTIFUL TRANSLUCENT LIGHT CONE (Poste de Iluminação)
        const coneGeo = new THREE.CylinderGeometry(0.25, 3.8, 8, 16, 1, true);
        const cone = new THREE.Mesh(coneGeo, lampConeMat);
        cone.position.set(1.2, 4.0, 0);
        lampPostGroup.add(cone);

        // Add a small decorative bush next to the pole base
        const baseBush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 1), bushMat);
        baseBush.position.set(-0.5, 0.3, 0.2);
        lampPostGroup.add(baseBush);

        sceneryGroup.add(lampPostGroup);
      } else if (typeChoice === 1) {
        // --- STREET SIDEWALK TREE TYPE A (Árvore Frondosa com Canteiro) ---
        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, 0, 0);

        // Wood Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 6, 8);
        const trunk = new THREE.Mesh(trunkGeo, treeTrunkMat);
        trunk.position.y = 3;
        treeGroup.add(trunk);

        // Leafy top crown
        const leavesGeo = new THREE.DodecahedronGeometry(2.3 + random() * 0.5, 1);
        const leaves = new THREE.Mesh(leavesGeo, treeFoliageMat);
        leaves.position.y = 6.5;
        leaves.rotation.y = random() * Math.PI;
        treeGroup.add(leaves);

        // Circular dark stone planter bed at base
        const planterGeo = new THREE.TorusGeometry(0.8, 0.18, 8, 16);
        const planterMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
        const planter = new THREE.Mesh(planterGeo, planterMat);
        planter.rotation.x = -Math.PI / 2;
        planter.position.y = 0.1;
        treeGroup.add(planter);

        sceneryGroup.add(treeGroup);
      } else if (typeChoice === 2) {
        // --- CONIFER / PINE TREE TYPE B (Árvore Conífera de Praça) ---
        const pineGroup = new THREE.Group();
        pineGroup.position.set(x, 0, 0);

        // Trunk
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 4, 8), treeTrunkMat);
        trunk.position.y = 2;
        pineGroup.add(trunk);

        // Foliage - 3 overlapping stacked cone tiers
        const tier1 = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.2, 6), coniferFoliageMat);
        tier1.position.y = 3.6;
        pineGroup.add(tier1);

        const tier2 = new THREE.Mesh(new THREE.ConeGeometry(1.7, 2.5, 6), coniferFoliageMat);
        tier2.position.y = 5.2;
        pineGroup.add(tier2);

        const tier3 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.8, 6), coniferFoliageMat);
        tier3.position.y = 6.6;
        pineGroup.add(tier3);

        // Square wooden barrier around trunk base
        const barrierGeo = new THREE.BoxGeometry(1.3, 0.2, 1.3);
        const barrierMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
        const barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.position.y = 0.1;
        pineGroup.add(barrier);

        sceneryGroup.add(pineGroup);
      } else if (typeChoice === 3) {
        // --- GARDEN ROCK CLUSTER (Pedras de Jardim) ---
        const rockGroup = new THREE.Group();
        rockGroup.position.set(x, 0, (random() - 0.5) * 1.5);

        // Rock 1: Large
        const r1Geo = new THREE.DodecahedronGeometry(0.85, 0);
        const r1 = new THREE.Mesh(r1Geo, rockMat);
        r1.position.set(0, 0.5, 0);
        r1.rotation.set(random() * 2, random() * 2, random() * 2);
        r1.scale.set(1.2, 0.8, 1.0);
        rockGroup.add(r1);

        // Rock 2: Medium
        const r2 = new THREE.Mesh(r1Geo, rockMat);
        r2.position.set(-0.7, 0.35, 0.3);
        r2.rotation.set(random() * 2, random() * 2, random() * 2);
        r2.scale.set(0.7, 0.6, 0.8);
        rockGroup.add(r2);

        // Rock 3: Small
        const r3 = new THREE.Mesh(r1Geo, rockMat);
        r3.position.set(0.6, 0.25, -0.4);
        r3.rotation.set(random() * 2, random() * 2, random() * 2);
        r3.scale.set(0.4, 0.4, 0.5);
        rockGroup.add(r3);

        sceneryGroup.add(rockGroup);
      } else if (typeChoice === 4) {
        // --- PLUSH BUSH CLUSTER (Moitas / Arbustos de Praça) ---
        const bushGroup = new THREE.Group();
        bushGroup.position.set(x, 0, (random() - 0.5) * 1.2);

        const b1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 1), bushMat);
        b1.position.set(0, 0.6, 0);
        bushGroup.add(b1);

        const b2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 1), bushMat);
        b2.position.set(-0.7, 0.45, 0.3);
        bushGroup.add(b2);

        const b3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 1), bushMat);
        b3.position.set(0.7, 0.4, -0.3);
        bushGroup.add(b3);

        sceneryGroup.add(bushGroup);
      } else if (typeChoice === 5) {
        // --- CANTEIRO DE GRAMADO COM FLORES (Lawn Patch with flowers) ---
        const lawnGroup = new THREE.Group();
        lawnGroup.position.set(x, 0, 0);

        // Green lawn base box
        const lawnGeo = new THREE.BoxGeometry(4.2, 0.15, 3.2);
        const lawn = new THREE.Mesh(lawnGeo, grassMat);
        lawn.position.y = 0.08;
        lawnGroup.add(lawn);

        // Mini wood/stone borders
        const borderGeo = new THREE.BoxGeometry(4.4, 0.22, 0.15);
        const borderMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
        const borderF = new THREE.Mesh(borderGeo, borderMat);
        borderF.position.set(0, 0.11, 1.6);
        lawnGroup.add(borderF);

        const borderB = new THREE.Mesh(borderGeo, borderMat);
        borderB.position.set(0, 0.11, -1.6);
        lawnGroup.add(borderB);

        // Spawn a couple of beautiful little colorful flowers!
        for (let i = 0; i < 4; i++) {
          const fx = -1.4 + i * 0.95 + (random() - 0.5) * 0.3;
          const fz = (random() - 0.5) * 2.0;

          const flowerGroup = new THREE.Group();
          flowerGroup.position.set(fx, 0.15, fz);

          // Stem
          const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4);
          const stem = new THREE.Mesh(stemGeo, treeFoliageMat);
          stem.position.y = 0.2;
          flowerGroup.add(stem);

          // Flower Head
          const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), flowerMats[i % flowerMats.length]);
          headMesh.position.y = 0.4;
          flowerGroup.add(headMesh);

          lawnGroup.add(flowerGroup);
        }

        sceneryGroup.add(lawnGroup);
      } else if (typeChoice === 6) {
        // --- COZY STREET BENCH (Banco de Praça) ---
        const benchGroup = new THREE.Group();
        benchGroup.position.set(x, 0, 0);

        // Wooden Seat
        const seatGeo = new THREE.BoxGeometry(3.2, 0.15, 1.0);
        const seat = new THREE.Mesh(seatGeo, woodMat);
        seat.position.set(0, 0.8, 0);
        benchGroup.add(seat);

        // Wooden Backrest
        const backGeo = new THREE.BoxGeometry(3.2, 0.7, 0.15);
        const back = new THREE.Mesh(backGeo, woodMat);
        back.position.set(0, 1.5, -0.45);
        back.rotation.x = -0.15;
        benchGroup.add(back);

        // Sidewalk support legs
        const legGeo = new THREE.BoxGeometry(0.18, 0.8, 1.1);
        const leftLeg = new THREE.Mesh(legGeo, metalMat);
        leftLeg.position.set(-1.4, 0.4, 0);
        benchGroup.add(leftLeg);

        const rightLeg = leftLeg.clone();
        rightLeg.position.x = 1.4;
        benchGroup.add(rightLeg);

        sceneryGroup.add(benchGroup);
      } else {
        // --- COZY BENCH COUPLING WITH SIDE BUSHES/FLOWERS ---
        const coupledGroup = new THREE.Group();
        coupledGroup.position.set(x, 0, 0);

        // The Bench
        const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 0.95), woodMat);
        seat.position.set(0, 0.8, 0);
        coupledGroup.add(seat);

        const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 0.15), woodMat);
        back.position.set(0, 1.45, -0.4);
        back.rotation.x = -0.15;
        coupledGroup.add(back);

        const legGeo = new THREE.BoxGeometry(0.16, 0.8, 1.05);
        const leftLeg = new THREE.Mesh(legGeo, metalMat);
        leftLeg.position.set(-1.05, 0.4, 0);
        coupledGroup.add(leftLeg);

        const rightLeg = leftLeg.clone();
        rightLeg.position.x = 1.05;
        coupledGroup.add(rightLeg);

        // A nice plush bush on the right side of the bench
        const sideBush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 1), bushMat);
        sideBush.position.set(1.9, 0.45, 0.1);
        coupledGroup.add(sideBush);

        // A small natural stone on the left side of the bench
        const sideStone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), rockMat);
        sideStone.position.set(-1.9, 0.25, 0.25);
        sideStone.rotation.set(random(), random(), random());
        coupledGroup.add(sideStone);

        sceneryGroup.add(coupledGroup);
      }
    }
    scene.add(sceneryGroup);

    // --- PLAYER ROBLOX R15 CASUAL AVATAR WITH HIGH-DEF PBR ---
    const playerGroup = new THREE.Group();

    // High Quality PBR Surface Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5c09e, roughness: 0.35, metalness: 0.05 });
    
    // Casual Classic Red Hoodie & Clean Denim Pants
    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.45,
      metalness: 0.1,
    });
    const hoodCollarMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      roughness: 0.5,
      metalness: 0.1,
    });
    const jeansMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.6,
      metalness: 0.05,
    });
    const charcoalSneakerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.2 });
    const whiteSoleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });

    // 1. Torso (Classic Casual Blue Hoodie)
    const torsoGroup = new THREE.Group();
    const mainTorsoGeo = new THREE.BoxGeometry(1.85, 2.25, 1.15);
    const mainTorso = new THREE.Mesh(mainTorsoGeo, shirtMat);
    mainTorso.position.y = 2.1;
    mainTorso.castShadow = true;
    torsoGroup.add(mainTorso);

    // Front Kangaroo Hoodie Pocket
    const pocketGeo = new THREE.BoxGeometry(1.2, 0.7, 0.2);
    const pocket = new THREE.Mesh(pocketGeo, hoodCollarMat);
    pocket.position.set(0, 1.5, 0.55);
    torsoGroup.add(pocket);

    // 3D Hood Collar around Base of Neck
    const hoodCollarGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.4, 16);
    const hoodCollar = new THREE.Mesh(hoodCollarGeo, hoodCollarMat);
    hoodCollar.position.set(0, 3.15, -0.05);
    torsoGroup.add(hoodCollar);

    playerGroup.add(torsoGroup);

    // Pre-create and memoize face textures for zero canvas allocation churn during gameplay
    const faceTexLow = createR15FaceTexture(10);
    const faceTexMed = createR15FaceTexture(50);
    const faceTexHigh = createR15FaceTexture(85);
    const soccerBallTexture = createRealisticSoccerBallTexture();

    // 2. Head with Animated Facial Micro-Expressions & Multi-Strand 3D Mesh Hair
    const headGroup = new THREE.Group();
    headGroup.position.y = 3.8;

    const headGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Face Plane with Reactive Expression Texture
    const faceGeo = new THREE.PlaneGeometry(1.18, 1.18);
    const faceMat = new THREE.MeshBasicMaterial({ map: faceTexLow, transparent: true });
    const facePlane = new THREE.Mesh(faceGeo, faceMat);
    facePlane.position.z = 0.61;
    headGroup.add(facePlane);

    // Multi-Strand 3D High-Definition Mesh Hair Assembly
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.2 });
    
    // Hair Top Volume Dome
    const hairTopGeo = new THREE.SphereGeometry(0.72, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
    hairTop.position.set(0, 0.45, -0.05);
    headGroup.add(hairTop);

    // Side Tapered 3D Hair Strands
    const strandGeo = new THREE.ConeGeometry(0.15, 0.7, 6);
    strandGeo.rotateX(Math.PI);
    for (let i = -3; i <= 3; i++) {
      const strand = new THREE.Mesh(strandGeo, hairMat);
      strand.position.set(i * 0.18, 0.38, 0.62);
      strand.rotation.z = i * 0.12;
      headGroup.add(strand);
    }

    // Sideburn / Ear framing locks
    const sideLockL = new THREE.Mesh(strandGeo, hairMat);
    sideLockL.position.set(-0.62, 0.1, 0.3);
    sideLockL.scale.set(1.2, 1.4, 1.2);
    headGroup.add(sideLockL);

    const sideLockR = new THREE.Mesh(strandGeo, hairMat);
    sideLockR.position.set(0.62, 0.1, 0.3);
    sideLockR.scale.set(1.2, 1.4, 1.2);
    headGroup.add(sideLockR);

    // --- DISCREET TECH ACCESSORIES ---
    // In-Ear Wireless Earbuds
    const earbudGeo = new THREE.BoxGeometry(0.12, 0.22, 0.15);
    const earbudMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.8, roughness: 0.1 });
    
    const earbudL = new THREE.Mesh(earbudGeo, earbudMat);
    earbudL.position.set(-0.62, -0.05, 0.08);
    headGroup.add(earbudL);

    const earbudR = new THREE.Mesh(earbudGeo, earbudMat);
    earbudR.position.set(0.62, -0.05, 0.08);
    headGroup.add(earbudR);

    // Earbud Status LEDs
    const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const ledL = new THREE.Mesh(ledGeo, ledMat);
    ledL.position.set(-0.68, -0.05, 0.12);
    headGroup.add(ledL);
    const ledR = new THREE.Mesh(ledGeo, ledMat);
    ledR.position.set(0.68, -0.05, 0.12);
    headGroup.add(ledR);

    playerGroup.add(headGroup);

    // 3. Jointed Arms & Smartwatch Accessory
    const upperArmGeo = new THREE.BoxGeometry(0.65, 1.1, 0.65);
    const lowerArmGeo = new THREE.BoxGeometry(0.6, 1.0, 0.6);

    // Left Arm Group
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-1.25, 2.8, 0);
    const leftUpperArm = new THREE.Mesh(upperArmGeo, shirtMat);
    leftUpperArm.position.y = -0.55;
    leftArmGroup.add(leftUpperArm);

    const leftLowerArmGroup = new THREE.Group();
    leftLowerArmGroup.position.y = -1.1;
    const leftLowerArm = new THREE.Mesh(lowerArmGeo, shirtMat);
    leftLowerArm.position.y = -0.5;
    leftLowerArmGroup.add(leftLowerArm);

    // Smartwatch Accessory on Left Wrist
    const watchCaseGeo = new THREE.BoxGeometry(0.48, 0.18, 0.52);
    const watchCaseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.15 });
    const watchCase = new THREE.Mesh(watchCaseGeo, watchCaseMat);
    watchCase.position.set(0, -0.85, 0.32);
    leftLowerArmGroup.add(watchCase);

    const watchScreenGeo = new THREE.PlaneGeometry(0.38, 0.38);
    const watchScreenMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const watchScreen = new THREE.Mesh(watchScreenGeo, watchScreenMat);
    watchScreen.rotation.x = -Math.PI / 2;
    watchScreen.position.set(0, -0.75, 0.32);
    leftLowerArmGroup.add(watchScreen);

    // Hand
    const handGeo = new THREE.BoxGeometry(0.45, 0.35, 0.45);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.y = -1.1;
    leftLowerArmGroup.add(leftHand);

    // 3D Gym Dumbbell Prop (Halteres) for Physical Exercise
    const createDumbbellMesh = () => {
      const db = new THREE.Group();
      
      // Central Chrome Grip Handle
      const barGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 12);
      const barMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.rotation.z = Math.PI / 2;
      db.add(bar);

      // Heavy Cast Iron Hex/Round Plates on Both Sides
      const plateGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.14, 12);
      const plateMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
      
      const leftPlate = new THREE.Mesh(plateGeo, plateMat);
      leftPlate.rotation.z = Math.PI / 2;
      leftPlate.position.x = -0.28;
      db.add(leftPlate);

      const rightPlate = new THREE.Mesh(plateGeo, plateMat);
      rightPlate.rotation.z = Math.PI / 2;
      rightPlate.position.x = 0.28;
      db.add(rightPlate);

      // Emerald/Cyan Workout Weight Ring Accents
      const ringGeo = new THREE.TorusGeometry(0.18, 0.025, 8, 16);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.8 });
      
      const leftRing = new THREE.Mesh(ringGeo, ringMat);
      leftRing.rotation.y = Math.PI / 2;
      leftRing.position.x = -0.36;
      db.add(leftRing);

      const rightRing = new THREE.Mesh(ringGeo, ringMat);
      rightRing.rotation.y = Math.PI / 2;
      rightRing.position.x = 0.36;
      db.add(rightRing);

      return db;
    };

    const leftDumbbell = createDumbbellMesh();
    leftDumbbell.position.set(0, -1.15, 0.15);
    leftDumbbell.visible = false;
    leftLowerArmGroup.add(leftDumbbell);

    leftArmGroup.add(leftLowerArmGroup);
    playerGroup.add(leftArmGroup);

    // Right Arm Group
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(1.25, 2.8, 0);
    const rightUpperArm = new THREE.Mesh(upperArmGeo, shirtMat);
    rightUpperArm.position.y = -0.55;
    rightArmGroup.add(rightUpperArm);

    const rightLowerArmGroup = new THREE.Group();
    rightLowerArmGroup.position.y = -1.1;
    const rightLowerArm = new THREE.Mesh(lowerArmGeo, shirtMat);
    rightLowerArm.position.y = -0.5;
    rightLowerArmGroup.add(rightLowerArm);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.y = -1.1;
    rightLowerArmGroup.add(rightHand);

    const rightDumbbell = createDumbbellMesh();
    rightDumbbell.position.set(0, -1.15, 0.15);
    rightDumbbell.visible = false;
    rightLowerArmGroup.add(rightDumbbell);

    rightArmGroup.add(rightLowerArmGroup);
    playerGroup.add(rightArmGroup);

    // 4. Classic Denim Jeans & Sneakers
    const upperLegGeo = new THREE.BoxGeometry(0.68, 1.1, 0.68);
    const lowerLegGeo = new THREE.BoxGeometry(0.62, 1.0, 0.62);

    // Left Leg Group
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.5, 1.8, 0);
    const leftUpperLeg = new THREE.Mesh(upperLegGeo, jeansMat);
    leftUpperLeg.position.y = -0.55;
    leftLegGroup.add(leftUpperLeg);

    const leftLowerLegGroup = new THREE.Group();
    leftLowerLegGroup.position.y = -1.1;
    const leftLowerLeg = new THREE.Mesh(lowerLegGeo, jeansMat);
    leftLowerLeg.position.y = -0.5;
    leftLowerLegGroup.add(leftLowerLeg);

    // Left Shoe
    const shoeBodyGeo = new THREE.BoxGeometry(0.72, 0.45, 1.15);
    const shoeSoleGeo = new THREE.BoxGeometry(0.76, 0.18, 1.18);
    const leftShoe = new THREE.Mesh(shoeBodyGeo, charcoalSneakerMat);
    leftShoe.position.set(0, -1.1, 0.15);
    const leftSole = new THREE.Mesh(shoeSoleGeo, whiteSoleMat);
    leftSole.position.set(0, -1.35, 0.15);
    leftLowerLegGroup.add(leftShoe);
    leftLowerLegGroup.add(leftSole);

    leftLegGroup.add(leftLowerLegGroup);
    playerGroup.add(leftLegGroup);

    // Right Leg Group
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.5, 1.8, 0);
    const rightUpperLeg = new THREE.Mesh(upperLegGeo, jeansMat);
    rightUpperLeg.position.y = -0.55;
    rightLegGroup.add(rightUpperLeg);

    const rightLowerLegGroup = new THREE.Group();
    rightLowerLegGroup.position.y = -1.1;
    const rightLowerLeg = new THREE.Mesh(lowerLegGeo, jeansMat);
    rightLowerLeg.position.y = -0.5;
    rightLowerLegGroup.add(rightLowerLeg);

    // Right Shoe
    const rightShoe = new THREE.Mesh(shoeBodyGeo, charcoalSneakerMat);
    rightShoe.position.set(0, -1.1, 0.15);
    const rightSole = new THREE.Mesh(shoeSoleGeo, whiteSoleMat);
    rightSole.position.set(0, -1.35, 0.15);
    rightLowerLegGroup.add(rightShoe);
    rightLowerLegGroup.add(rightSole);

    rightLegGroup.add(rightLowerLegGroup);
    playerGroup.add(rightLegGroup);

    // 5. PROPS & SCENE SPECIAL EFFECTS
    // High Metallic Stool
    const stoolGroup = new THREE.Group();
    const stoolSeatGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.2, 16);
    const stoolMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
    const stoolSeat = new THREE.Mesh(stoolSeatGeo, stoolMat);
    stoolGroup.add(stoolSeat);

    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8);
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
      const leg = new THREE.Mesh(legGeo, stoolMat);
      leg.position.set(Math.cos(angle) * 0.65, -0.8, Math.sin(angle) * 0.65);
      stoolGroup.add(leg);
    }
    stoolGroup.position.set(0, 0.8, 0);
    stoolGroup.visible = false;
    playerGroup.add(stoolGroup);

    // Builder helper for high-fidelity classical acoustic guitar
    const createAcousticGuitarMesh = () => {
      const g = new THREE.Group();

      const woodTopMat = new THREE.MeshStandardMaterial({
        color: 0xd97706, // Spruce amber golden top
        roughness: 0.22,
        metalness: 0.08,
      });
      const woodSideMat = new THREE.MeshStandardMaterial({
        color: 0x451a03, // Dark rosewood sides & back
        roughness: 0.32,
        metalness: 0.05,
      });
      const neckWoodMat = new THREE.MeshStandardMaterial({
        color: 0x78350f,
        roughness: 0.3,
      });
      const fretboardMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a, // Ebony fretboard
        roughness: 0.4,
      });
      const silverMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.92,
        roughness: 0.1,
      });
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.85,
        roughness: 0.2,
      });

      // 1. Classical Hourglass Acoustic Body (Dual Bouts)
      const lowerBout = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.28, 24), woodSideMat);
      lowerBout.rotation.z = Math.PI / 2;
      lowerBout.position.set(0, -0.38, 0);
      g.add(lowerBout);

      const upperBout = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.28, 24), woodSideMat);
      upperBout.rotation.z = Math.PI / 2;
      upperBout.position.set(0, 0.38, 0);
      g.add(upperBout);

      const waist = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.58, 0.28), woodSideMat);
      waist.position.set(0, 0.02, 0);
      g.add(waist);

      // Soundboard Face Plate (Spruce Top)
      const soundboard = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.62, 0.02), woodTopMat);
      soundboard.position.set(0, 0, 0.145);
      g.add(soundboard);

      // Back Plate
      const backPlate = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.62, 0.02), woodSideMat);
      backPlate.position.set(0, 0, -0.145);
      g.add(backPlate);

      // 2. Rosette Rings & Soundhole
      const rosetteOuter = new THREE.Mesh(
        new THREE.RingGeometry(0.22, 0.32, 24),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
      );
      rosetteOuter.position.set(0, 0.24, 0.158);
      g.add(rosetteOuter);

      const rosetteInner = new THREE.Mesh(
        new THREE.RingGeometry(0.24, 0.28, 24),
        new THREE.MeshBasicMaterial({ color: 0x92400e, side: THREE.DoubleSide })
      );
      rosetteInner.position.set(0, 0.24, 0.159);
      g.add(rosetteInner);

      const soundhole = new THREE.Mesh(
        new THREE.CircleGeometry(0.22, 24),
        new THREE.MeshBasicMaterial({ color: 0x09090b, side: THREE.DoubleSide })
      );
      soundhole.position.set(0, 0.24, 0.157);
      g.add(soundhole);

      // Tortoiseshell Style Pickguard
      const pickguard = new THREE.Mesh(
        new THREE.PlaneGeometry(0.26, 0.38),
        new THREE.MeshStandardMaterial({ color: 0x271306, roughness: 0.15, side: THREE.DoubleSide })
      );
      pickguard.position.set(0.2, 0.12, 0.158);
      pickguard.rotation.z = -0.25;
      g.add(pickguard);

      // 3. Wooden Bridge with Bone Saddle
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.15, 0.04), fretboardMat);
      bridge.position.set(0, -0.42, 0.165);
      g.add(bridge);

      const saddle = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.03, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
      );
      saddle.position.set(0, -0.41, 0.185);
      g.add(saddle);

      // 4. Mahogany Neck & Ebony Fretboard
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 0.12), neckWoodMat);
      neck.position.set(0, 1.35, 0.02);
      g.add(neck);

      const fretboard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 0.03), fretboardMat);
      fretboard.position.set(0, 1.35, 0.09);
      g.add(fretboard);

      // Frets (Silver Wires)
      for (let f = 0; f < 9; f++) {
        const fret = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.015, 0.01), silverMat);
        fret.position.set(0, 0.65 + f * 0.16, 0.108);
        g.add(fret);
      }

      // Pearloid Inlay Marker Dots
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const dotGeo = new THREE.CircleGeometry(0.018, 8);
      [0.97, 1.29, 1.61, 1.93].forEach((yPos) => {
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(0, yPos, 0.11);
        g.add(dot);
      });

      // 5. Slotted Classical Headstock with Gold Tuners
      const headstock = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.48, 0.09), woodSideMat);
      headstock.position.set(0, 2.32, 0.02);
      headstock.rotation.x = -0.12;
      g.add(headstock);

      for (let p = 0; p < 3; p++) {
        const pegL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 8), goldMat);
        pegL.rotation.z = Math.PI / 2;
        pegL.position.set(-0.16, 2.2 + p * 0.12, 0.02);
        g.add(pegL);

        const pegR = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 8), goldMat);
        pegR.rotation.z = Math.PI / 2;
        pegR.position.set(0.16, 2.2 + p * 0.12, 0.02);
        g.add(pegR);
      }

      // 6. Six Metallic Guitar Strings
      const stringMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
      for (let s = 0; s < 6; s++) {
        const xOffset = -0.065 + s * 0.026;
        const str = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 2.7, 4), stringMat);
        str.position.set(xOffset, 0.9, 0.125);
        g.add(str);
      }

      return g;
    };

    // Realistic High-Fidelity Guitar Prop for Player
    const guitarGroup = createAcousticGuitarMesh();
    guitarGroup.position.set(0.15, 1.95, 0.72);
    guitarGroup.rotation.set(-0.22, 0.24, -0.65);
    guitarGroup.visible = false;
    playerGroup.add(guitarGroup);

    // Realistic Soccer Ball Prop for Juggling (Embaixadinhas)
    const soccerJuggleGroup = new THREE.Group();
    const soccerBallMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 36, 36),
      new THREE.MeshStandardMaterial({
        map: soccerBallTexture,
        bumpMap: soccerBallTexture,
        bumpScale: 0.03,
        roughness: 0.15,
        metalness: 0.08,
      })
    );
    soccerBallMesh.castShadow = true;
    soccerJuggleGroup.add(soccerBallMesh);

    const sPatchGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.012, 5);
    const sPatchMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.2, metalness: 0.1 });
    ICO_VERTICES.forEach(([vx, vy, vz]) => {
      const dir = new THREE.Vector3(vx, vy, vz).normalize();
      const p = new THREE.Mesh(sPatchGeo, sPatchMat);
      p.position.copy(dir.clone().multiplyScalar(0.581));
      p.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      soccerJuggleGroup.add(p);
    });
    soccerJuggleGroup.position.set(0.4, 0.8, 0.7);
    soccerJuggleGroup.visible = false;
    playerGroup.add(soccerJuggleGroup);

    // Realistic Steaming Ceramic Coffee Cup for Drinking
    const coffeeCupProp = new THREE.Group();
    const cMugGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.55, 16);
    const cMugMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.15, metalness: 0.1 });
    const cMug = new THREE.Mesh(cMugGeo, cMugMat);
    coffeeCupProp.add(cMug);

    const cHandleGeo = new THREE.TorusGeometry(0.18, 0.04, 8, 16, Math.PI * 1.2);
    const cHandle = new THREE.Mesh(cHandleGeo, cMugMat);
    cHandle.position.set(0.28, 0, 0);
    cHandle.rotation.z = -Math.PI / 2;
    coffeeCupProp.add(cHandle);

    const cLiquidGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16);
    const cLiquidMat = new THREE.MeshStandardMaterial({ color: 0x3e1f0e, roughness: 0.2 });
    const cLiquid = new THREE.Mesh(cLiquidGeo, cLiquidMat);
    cLiquid.position.y = 0.24;
    coffeeCupProp.add(cLiquid);

    const cFoamGeo = new THREE.CircleGeometry(0.1, 12);
    const cFoamMat = new THREE.MeshBasicMaterial({ color: 0xfef3c7 });
    const cFoam = new THREE.Mesh(cFoamGeo, cFoamMat);
    cFoam.rotation.x = -Math.PI / 2;
    cFoam.position.y = 0.27;
    coffeeCupProp.add(cFoam);

    const cSaucerGeo = new THREE.CylinderGeometry(0.42, 0.32, 0.06, 16);
    const cSaucer = new THREE.Mesh(cSaucerGeo, cMugMat);
    cSaucer.position.y = -0.3;
    coffeeCupProp.add(cSaucer);

    const cSteamGeo = new THREE.TorusGeometry(0.08, 0.018, 6, 12, Math.PI);
    const cSteamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    const cSteam1 = new THREE.Mesh(cSteamGeo, cSteamMat);
    cSteam1.position.set(-0.06, 0.45, 0);
    cSteam1.rotation.z = Math.PI / 2;
    coffeeCupProp.add(cSteam1);

    const cSteam2 = new THREE.Mesh(cSteamGeo, cSteamMat);
    cSteam2.position.set(0.06, 0.52, 0);
    cSteam2.rotation.z = Math.PI / 2;
    coffeeCupProp.add(cSteam2);

    coffeeCupProp.position.set(0, 3.15, 0.72);
    coffeeCupProp.visible = false;
    playerGroup.add(coffeeCupProp);

    // Realistic Gourmet Hamburger Prop for Eating
    const burgerProp = new THREE.Group();
    const bgBunMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55, metalness: 0.1 });
    const bgPattyMat = new THREE.MeshStandardMaterial({ color: 0x381808, roughness: 0.8, metalness: 0.05 });
    const bgCheeseMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, metalness: 0.1 });
    const bgLettuceMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5, metalness: 0.05 });
    const bgTomatoMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.1 });

    const bgBBun = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.36, 0.14, 16), bgBunMat);
    bgBBun.position.y = -0.18;
    burgerProp.add(bgBBun);

    const bgPatty = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.12, 16), bgPattyMat);
    bgPatty.position.y = -0.05;
    burgerProp.add(bgPatty);

    const bgCheese = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.03, 0.48), bgCheeseMat);
    bgCheese.position.y = 0.02;
    bgCheese.rotation.y = Math.PI / 4;
    burgerProp.add(bgCheese);

    const bgTomato = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 16), bgTomatoMat);
    bgTomato.position.y = 0.06;
    burgerProp.add(bgTomato);

    const bgLettuce = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 16), bgLettuceMat);
    bgLettuce.position.y = 0.1;
    burgerProp.add(bgLettuce);

    const bgTBun = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), bgBunMat);
    bgTBun.position.y = 0.12;
    bgTBun.scale.set(1, 0.6, 1);
    burgerProp.add(bgTBun);

    const bgSeedGeo = new THREE.SphereGeometry(0.025, 4, 4);
    const bgSeedMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.3 });
    for (let i = 0; i < 8; i++) {
      const seed = new THREE.Mesh(bgSeedGeo, bgSeedMat);
      const ang = (i * Math.PI * 2) / 8;
      const rad = 0.15 + (i % 2) * 0.1;
      seed.position.set(Math.cos(ang) * rad, 0.32, Math.sin(ang) * rad);
      seed.scale.set(1.5, 0.6, 0.8);
      burgerProp.add(seed);
    }
    burgerProp.position.set(0, 3.1, 0.7);
    burgerProp.visible = false;
    playerGroup.add(burgerProp);

    // Realistic Open Hardcover Book Prop for Reading
    const bookProp = new THREE.Group();
    const bkCoverMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.25, metalness: 0.3 });
    const bkPageMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.5 });
    const bkGoldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });

    const bkLeftPage = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.06), bkPageMat);
    bkLeftPage.position.set(-0.33, 0, 0);
    bkLeftPage.rotation.y = 0.25;
    bookProp.add(bkLeftPage);

    const bkRightPage = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.06), bkPageMat);
    bkRightPage.position.set(0.33, 0, 0);
    bkRightPage.rotation.y = -0.25;
    bookProp.add(bkRightPage);

    const bkLeftCover = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.94, 0.03), bkCoverMat);
    bkLeftCover.position.set(-0.34, 0, -0.04);
    bkLeftCover.rotation.y = 0.25;
    bookProp.add(bkLeftCover);

    const bkRightCover = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.94, 0.03), bkCoverMat);
    bkRightCover.position.set(0.34, 0, -0.04);
    bkRightCover.rotation.y = -0.25;
    bookProp.add(bkRightCover);

    const bkSpine = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.94, 12, 1, false, 0, Math.PI), bkGoldMat);
    bkSpine.position.set(0, 0, -0.07);
    bkSpine.rotation.x = Math.PI / 2;
    bookProp.add(bkSpine);

    const bkRibbon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.02), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    bkRibbon.position.set(0.05, -0.3, 0.05);
    bookProp.add(bkRibbon);

    const bkLineMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    for (let i = 0; i < 5; i++) {
      const lineL = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.03), bkLineMat);
      lineL.position.set(-0.33, 0.3 - i * 0.14, 0.04);
      lineL.rotation.y = 0.25;
      bookProp.add(lineL);

      const lineR = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.03), bkLineMat);
      lineR.position.set(0.33, 0.3 - i * 0.14, 0.04);
      lineR.rotation.y = -0.25;
      bookProp.add(lineR);
    }
    bookProp.position.set(0, 2.5, 0.85);
    bookProp.rotation.x = -0.45;
    bookProp.visible = false;
    playerGroup.add(bookProp);

    // --- 3D PET DOG PROP (Cachorrinho para carinho) ---
    const dogProp = new THREE.Group();
    const dpFurMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.6 });
    const dpTummyMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.7 });
    const dpEyeMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.1 });
    const dpCollarMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.2 });

    const dpBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.2), dpFurMat);
    dpBody.position.set(0, 0.3, 0);
    dogProp.add(dpBody);

    const dpNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.4, 8), dpFurMat);
    dpNeck.position.set(0, 0.6, 0.4);
    dpNeck.rotation.x = 0.25;
    dogProp.add(dpNeck);

    const dpHeadGroup = new THREE.Group();
    dpHeadGroup.position.set(0, 0.95, 0.55);

    const dpHeadMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.6), dpFurMat);
    dpHeadGroup.add(dpHeadMesh);

    const dpSnout = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.3), dpTummyMat);
    dpSnout.position.set(0, -0.07, 0.3);
    dpHeadGroup.add(dpSnout);

    const dpNose = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.1), dpEyeMat);
    dpNose.position.set(0, -0.01, 0.43);
    dpHeadGroup.add(dpNose);

    const dpEarL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.25), dpTummyMat);
    dpEarL.position.set(-0.34, -0.05, 0);
    dpEarL.rotation.z = -0.15;
    dpHeadGroup.add(dpEarL);

    const dpEarR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 0.25), dpTummyMat);
    dpEarR.position.set(0.34, -0.05, 0);
    dpEarR.rotation.z = 0.15;
    dpHeadGroup.add(dpEarR);

    const dpEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), dpEyeMat);
    dpEyeL.position.set(-0.18, 0.1, 0.26);
    dpHeadGroup.add(dpEyeL);

    const dpEyeR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), dpEyeMat);
    dpEyeR.position.set(0.18, 0.1, 0.26);
    dpHeadGroup.add(dpEyeR);

    dogProp.add(dpHeadGroup);

    const dpCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.08, 8), dpCollarMat);
    dpCollar.position.set(0, 0.68, 0.45);
    dpCollar.rotation.x = 0.25;
    dogProp.add(dpCollar);

    const dpTail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.5, 8), dpFurMat);
    dpTail.position.set(0, 0.6, -0.65);
    dpTail.rotation.x = -1.1;
    dogProp.add(dpTail);

    const dpLegGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.4, 8);
    const dpFL = new THREE.Mesh(dpLegGeo, dpFurMat);
    dpFL.position.set(-0.25, 0.05, 0.35);
    dogProp.add(dpFL);

    const dpFR = new THREE.Mesh(dpLegGeo, dpFurMat);
    dpFR.position.set(0.25, 0.05, 0.35);
    dogProp.add(dpFR);

    const dpBL = new THREE.Mesh(dpLegGeo, dpFurMat);
    dpBL.position.set(-0.25, 0.05, -0.35);
    dogProp.add(dpBL);

    const dpBR = new THREE.Mesh(dpLegGeo, dpFurMat);
    dpBR.position.set(0.25, 0.05, -0.35);
    dogProp.add(dpBR);

    dogProp.scale.set(1.3, 1.3, 1.3);
    dogProp.position.set(0.65, 0, 0.85); // Stand on the right side slightly forward of the avatar
    dogProp.rotation.y = -0.35; // Face slightly towards the player
    dogProp.visible = false;
    playerGroup.add(dogProp);

    // Soundwave Shockwave Ring
    const soundwaveGeo = new THREE.RingGeometry(0.5, 0.8, 32);
    const soundwaveMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const soundwaveRing = new THREE.Mesh(soundwaveGeo, soundwaveMat);
    soundwaveRing.rotation.x = -Math.PI / 2;
    soundwaveRing.position.y = 0.1;
    playerGroup.add(soundwaveRing);

    // Translucent Red Damage Aura Sphere
    const auraGeo = new THREE.SphereGeometry(2.4, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0,
      wireframe: true,
    });
    const damageAura = new THREE.Mesh(auraGeo, auraMat);
    damageAura.position.y = 2.2;
    playerGroup.add(damageAura);

    // Glowing Green Zen Protection Shield Sphere
    const zenPillarGeo = new THREE.SphereGeometry(2.6, 24, 24);
    const zenPillarMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0,
      emissive: 0x14532d,
      roughness: 0.1,
      metalness: 0.1,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const zenPillar = new THREE.Mesh(zenPillarGeo, zenPillarMat);
    zenPillar.position.y = 1.8;
    playerGroup.add(zenPillar);

    // --- 3D PROTECTIVE UMBRELLA ---
    const umbrellaGroup = new THREE.Group();
    umbrellaGroup.name = 'umbrellaProp';

    // Umbrella shaft/stick (Haste)
    const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.2, 8);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Silver/Grey metallic stick
      metalness: 0.8,
      roughness: 0.2,
    });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = 1.6;
    umbrellaGroup.add(shaft);

    // Realistic curved J-Handle at the bottom of the shaft
    const handleGroup = new THREE.Group();
    handleGroup.position.set(0, 0.1, 0);

    const handleMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 }); // Black plastic/matte handle
    const handleStemGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.4, 8);
    const handleStem = new THREE.Mesh(handleStemGeo, handleMat);
    handleStem.position.y = -0.1;
    handleGroup.add(handleStem);

    // Curve portion of J (Torus)
    const hookGeo = new THREE.TorusGeometry(0.18, 0.065, 8, 16, Math.PI);
    const hook = new THREE.Mesh(hookGeo, handleMat);
    hook.position.set(0.18, -0.3, 0);
    hook.rotation.z = Math.PI; // Flip it to hook upwards like a real handle hook
    handleGroup.add(hook);

    // Rounded tip of the J-handle hook
    const hookTipGeo = new THREE.SphereGeometry(0.065, 8, 8);
    const hookTip = new THREE.Mesh(hookTipGeo, handleMat);
    hookTip.position.set(0.36, -0.3, 0);
    handleGroup.add(hookTip);

    umbrellaGroup.add(handleGroup);

    // Umbrella Canopy (Cúpula - octagonal open cone fabric)
    const canopyGeo = new THREE.ConeGeometry(2.0, 0.8, 8, 1, true); // Octagonal open cone
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9, // Vibrant Cyan protective blue
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
      roughness: 0.35,
      metalness: 0.25,
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 2.8; // Align with upper half of shaft
    umbrellaGroup.add(canopy);

    // 8 Realistic Metal Ribs (Varetas) extending along the octagonal canopy seams
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.15 });
    const ribLength = Math.sqrt(2.0 * 2.0 + 0.8 * 0.8);
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const ribGeo = new THREE.CylinderGeometry(0.015, 0.015, ribLength, 8);
      const rib = new THREE.Mesh(ribGeo, ribMat);
      
      // Position and angle the rib exactly along the cone crease
      rib.position.set(Math.cos(angle) * 1.0, 2.8 - 0.4, Math.sin(angle) * 1.0);
      rib.rotation.y = -angle;
      rib.rotation.z = Math.atan2(2.0, -0.8);
      
      umbrellaGroup.add(rib);
    }

    // Sliding runner collar (Manga de correr) under canopy
    const runnerGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 12);
    const runner = new THREE.Mesh(runnerGeo, shaftMat);
    runner.position.y = 2.2;
    umbrellaGroup.add(runner);

    // Tip Ferrule on top of canopy
    const tipGeo = new THREE.CylinderGeometry(0.015, 0.05, 0.5, 8);
    const tip = new THREE.Mesh(tipGeo, shaftMat);
    tip.position.y = 3.45;
    umbrellaGroup.add(tip);

    // Position the umbrella over the character's head
    umbrellaGroup.position.set(0, 2.3, 0);
    umbrellaGroup.visible = false; // Hidden by default!
    playerGroup.add(umbrellaGroup);

    // --- 3D TRANSLUCENT OUTDOOR PROTECTION SHIELD SPHERE (Escudo Ar Livre - Transparência 5%) ---
    const outdoorShieldSphereGeo = new THREE.SphereGeometry(3.2, 32, 32);
    const outdoorShieldSphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8, // Vibrant Sky Blue / Cyan Translucent Shield
      transparent: true,
      opacity: 0.05, // 5% opacity (95% translucent) as requested
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.9,
      ior: 1.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const outdoorShieldMesh = new THREE.Mesh(outdoorShieldSphereGeo, outdoorShieldSphereMat);
    outdoorShieldMesh.position.set(0, 2.2, 0);
    outdoorShieldMesh.visible = false;
    playerGroup.add(outdoorShieldMesh);

    // Dynamic Wireframe Shell to accentuate 3D protective sphere
    const outdoorShieldRingGeo = new THREE.SphereGeometry(3.24, 20, 20);
    const outdoorShieldRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      wireframe: true,
      depthWrite: false,
    });
    const outdoorShieldRingMesh = new THREE.Mesh(outdoorShieldRingGeo, outdoorShieldRingMat);
    outdoorShieldRingMesh.position.set(0, 2.2, 0);
    outdoorShieldRingMesh.visible = false;
    playerGroup.add(outdoorShieldRingMesh);

    // --- 3D FRIEND AVATAR FOR HUG ANIMATION (Abraço de Amigo / Encontro Presencial) ---
    const friendHugGroup = new THREE.Group();
    friendHugGroup.name = 'friendHugGroup';
    friendHugGroup.position.set(0, 0, 0.85); // Directly in front of player
    friendHugGroup.rotation.y = Math.PI; // Facing player

    // Friend Head
    const friendHeadGeo = new THREE.SphereGeometry(0.75, 16, 16);
    const friendSkinMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 });
    const friendHead = new THREE.Mesh(friendHeadGeo, friendSkinMat);
    friendHead.position.y = 3.2;
    friendHugGroup.add(friendHead);

    // Friend Facial Features (Eyes & Smile)
    const friendEyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const friendEyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), friendEyeMat);
    friendEyeLeft.position.set(-0.24, 3.32, 0.68);
    const friendEyeRight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), friendEyeMat);
    friendEyeRight.position.set(0.24, 3.32, 0.68);
    friendHugGroup.add(friendEyeLeft);
    friendHugGroup.add(friendEyeRight);

    const friendSmileGeo = new THREE.TorusGeometry(0.2, 0.04, 8, 12, Math.PI);
    const friendSmileMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 });
    const friendSmile = new THREE.Mesh(friendSmileGeo, friendSmileMat);
    friendSmile.position.set(0, 3.08, 0.68);
    friendSmile.rotation.z = Math.PI;
    friendHugGroup.add(friendSmile);

    // Friend Hair
    const friendHairGeo = new THREE.SphereGeometry(0.78, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const friendHairMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 });
    const friendHair = new THREE.Mesh(friendHairGeo, friendHairMat);
    friendHair.position.set(0, 3.25, 0);
    friendHugGroup.add(friendHair);

    // Friend Torso
    const friendTorsoGeo = new THREE.BoxGeometry(1.2, 1.4, 0.7);
    const friendShirtMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.6 });
    const friendTorso = new THREE.Mesh(friendTorsoGeo, friendShirtMat);
    friendTorso.position.y = 2.0;
    friendHugGroup.add(friendTorso);

    // Friend Arms for Hugging
    const friendArmMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.6 });
    const friendArmGeo = new THREE.BoxGeometry(0.35, 1.1, 0.35);

    const friendLeftArmGroup = new THREE.Group();
    friendLeftArmGroup.position.set(-0.75, 2.5, 0);
    const friendLeftArm = new THREE.Mesh(friendArmGeo, friendArmMat);
    friendLeftArm.position.y = -0.55;
    friendLeftArmGroup.add(friendLeftArm);
    friendHugGroup.add(friendLeftArmGroup);

    const friendRightArmGroup = new THREE.Group();
    friendRightArmGroup.position.set(0.75, 2.5, 0);
    const friendRightArm = new THREE.Mesh(friendArmGeo, friendArmMat);
    friendRightArm.position.y = -0.55;
    friendRightArmGroup.add(friendRightArm);
    friendHugGroup.add(friendRightArmGroup);

    // Friend Legs
    const friendLegMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const friendLegGeo = new THREE.BoxGeometry(0.45, 1.3, 0.45);
    const friendLeftLeg = new THREE.Mesh(friendLegGeo, friendLegMat);
    friendLeftLeg.position.set(-0.32, 0.65, 0);
    const friendRightLeg = new THREE.Mesh(friendLegGeo, friendLegMat);
    friendRightLeg.position.set(0.32, 0.65, 0);
    friendHugGroup.add(friendLeftLeg);
    friendHugGroup.add(friendRightLeg);

    // Warm Friendship Heart Ring Aura
    const friendHeartRingGeo = new THREE.RingGeometry(1.2, 1.6, 24);
    const friendHeartRingMat = new THREE.MeshBasicMaterial({ color: 0xec4899, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const friendHeartRing = new THREE.Mesh(friendHeartRingGeo, friendHeartRingMat);
    friendHeartRing.rotation.x = Math.PI / 2;
    friendHeartRing.position.set(0, 0.1, 0);
    friendHugGroup.add(friendHeartRing);

    friendHugGroup.visible = false;
    playerGroup.add(friendHugGroup);

    playerGroup.position.set(initialCamX, 0, 0);
    scene.add(playerGroup);

    // --- High-Performance Cached 3D Mesh Template Factory ---
    const meshTemplateCache = new Map<FallingItem['type'], THREE.Object3D>();

    const create3DItemMesh = (type: FallingItem['type']): THREE.Object3D => {
      const cachedTemplate = meshTemplateCache.get(type);
      if (cachedTemplate) {
        return cachedTemplate.clone(true);
      }

      const group = new THREE.Group();

      if (type === 'Feed') {
        // --- 1. HIGH-FIDELITY SOCIAL MEDIA FEED CARD ---
        // Smartphone/Card Frame
        const cardGeo = new THREE.BoxGeometry(2.2, 3.0, 0.25);
        const cardMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.2,
          metalness: 0.7,
        });
        const card = new THREE.Mesh(cardGeo, cardMat);
        group.add(card);

        // Glossy Screen
        const screenGeo = new THREE.PlaneGeometry(1.9, 2.7);
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.z = 0.13;
        group.add(screen);

        // Header: User Avatar Circle
        const avatarGeo = new THREE.CircleGeometry(0.22, 16);
        const avatarMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const avatar = new THREE.Mesh(avatarGeo, avatarMat);
        avatar.position.set(-0.6, 1.0, 0.14);
        group.add(avatar);

        // Header: Username Bar
        const userBarGeo = new THREE.PlaneGeometry(0.8, 0.1);
        const userBarMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
        const userBar = new THREE.Mesh(userBarGeo, userBarMat);
        userBar.position.set(0.0, 1.0, 0.14);
        group.add(userBar);

        // Main Feed Photo Container
        const photoGeo = new THREE.PlaneGeometry(1.7, 1.3);
        const photoMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
        const photo = new THREE.Mesh(photoGeo, photoMat);
        photo.position.set(0, 0.1, 0.14);
        group.add(photo);

        // Camera / Image Icon inside photo
        const imgIconGeo = new THREE.CircleGeometry(0.2, 12);
        const imgIconMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
        const imgIcon = new THREE.Mesh(imgIconGeo, imgIconMat);
        imgIcon.position.set(0, 0.1, 0.15);
        group.add(imgIcon);

        // Action Icons Bar: Heart Like
        const heartShape = new THREE.Shape();
        heartShape.moveTo(0, 0);
        heartShape.bezierCurveTo(0, 0.15, -0.2, 0.3, -0.3, 0.15);
        heartShape.bezierCurveTo(-0.4, 0, -0.2, -0.2, 0, -0.35);
        heartShape.bezierCurveTo(0.2, -0.2, 0.4, 0, 0.3, 0.15);
        heartShape.bezierCurveTo(0.2, 0.3, 0, 0.15, 0, 0);

        const heartGeo = new THREE.ShapeGeometry(heartShape);
        const heartMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const heart = new THREE.Mesh(heartGeo, heartMat);
        heart.scale.set(0.6, 0.6, 0.6);
        heart.position.set(-0.6, -0.8, 0.14);
        group.add(heart);

        // Red Notification Badge "+1"
        const badgeGeo = new THREE.CircleGeometry(0.2, 16);
        const badgeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const badge = new THREE.Mesh(badgeGeo, badgeMat);
        badge.position.set(0.7, 1.1, 0.16);
        group.add(badge);

        const feedGlow = new THREE.PointLight(0x3b82f6, 2, 8);
        group.add(feedGlow);

      } else if (type === 'Like') {
        // --- 2. HIGH-FIDELITY GLOSSY 3D LIKE HEART ---
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.bezierCurveTo(0, 0.6, -1.0, 1.3, -1.4, 0.7);
        shape.bezierCurveTo(-1.8, 0, -1.2, -0.9, 0, -1.6);
        shape.bezierCurveTo(1.2, -0.9, 1.8, 0, 1.4, 0.7);
        shape.bezierCurveTo(1.0, 1.3, 0, 0.6, 0, 0);

        const extrudeSettings = { depth: 0.5, bevelEnabled: true, bevelSegments: 4, steps: 1, bevelSize: 0.15, bevelThickness: 0.15 };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xec4899,
          roughness: 0.1,
          metalness: 0.8,
          emissive: 0x9d174d,
          emissiveIntensity: 0.6,
        });
        const heart = new THREE.Mesh(geo, mat);
        heart.scale.set(0.75, 0.75, 0.75);
        group.add(heart);

        // Floating "+1" Badge Bubble
        const bubbleGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16);
        const bubbleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, emissive: 0xf472b6 });
        const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
        bubble.rotation.x = Math.PI / 2;
        bubble.position.set(0.7, 0.8, 0.3);
        group.add(bubble);

        const pinkGlow = new THREE.PointLight(0xec4899, 3, 10);
        group.add(pinkGlow);

      } else if (type === 'Wifi') {
        // --- 3. HIGH-FIDELITY CONCENTRIC WI-FI TOWER ---
        // Base Transmitter Dot
        const dotGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const cyanEmissiveMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x083344,
          emissiveIntensity: 0.9,
          roughness: 0.1,
        });
        const dot = new THREE.Mesh(dotGeo, cyanEmissiveMat);
        dot.position.y = -0.8;
        group.add(dot);

        // 3 Concentric Radiating Signal Waves
        for (let i = 1; i <= 3; i++) {
          const arcGeo = new THREE.TorusGeometry(i * 0.55, 0.12, 12, 32, Math.PI * 0.75);
          const arc = new THREE.Mesh(arcGeo, cyanEmissiveMat);
          arc.rotation.z = -Math.PI / 8;
          arc.position.y = -0.8;
          group.add(arc);
        }

        const wifiGlow = new THREE.PointLight(0x06b6d4, 3, 10);
        group.add(wifiGlow);

      } else if (type === 'Smartphone') {
        // --- 4. HIGH-FIDELITY SMARTPHONE WITH FLASHING NOTIFICATIONS ---
        // Metallic Body Chassis
        const phoneGeo = new THREE.BoxGeometry(1.8, 3.2, 0.22);
        const phoneMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.15,
          metalness: 0.85,
        });
        const phone = new THREE.Mesh(phoneGeo, phoneMat);
        group.add(phone);

        // Glossy Screen Surface
        const screenGeo = new THREE.PlaneGeometry(1.6, 2.9);
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.z = 0.12;
        group.add(screen);

        // Camera Notch Pill
        const notchGeo = new THREE.PlaneGeometry(0.4, 0.08);
        const notchMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
        const notch = new THREE.Mesh(notchGeo, notchMat);
        notch.position.set(0, 1.32, 0.13);
        group.add(notch);

        // Vibrant Red/Pink Message Bubble
        const msgGeo = new THREE.PlaneGeometry(1.3, 0.6);
        const msgMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 });
        const msg = new THREE.Mesh(msgGeo, msgMat);
        msg.position.set(0, 0.4, 0.13);
        group.add(msg);

        // Notification Text Bar Lines
        const lineGeo = new THREE.PlaneGeometry(0.9, 0.08);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const line1 = new THREE.Mesh(lineGeo, lineMat);
        line1.position.set(-0.1, 0.48, 0.14);
        group.add(line1);

        const line2 = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.06), lineMat);
        line2.position.set(-0.25, 0.32, 0.14);
        group.add(line2);

        // Red Circle Badge "+99"
        const badgeGeo = new THREE.CircleGeometry(0.25, 16);
        const badgeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const badge = new THREE.Mesh(badgeGeo, badgeMat);
        badge.position.set(0.5, 0.6, 0.15);
        group.add(badge);

        // Pulsing Red Glow Light for Cellular Vibration
        const phoneGlow = new THREE.PointLight(0xe11d48, 3.5, 10);
        group.add(phoneGlow);

      } else if (type === 'Geometric') {
        // --- 4. HIGH-FIDELITY BROWSER SPAM / POP-UP ALERT WINDOW ---
        // Outer Window Frame
        const frameGeo = new THREE.BoxGeometry(2.6, 2.1, 0.25);
        const frameMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.2,
          metalness: 0.8,
        });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        group.add(frame);

        // Window Top Title Bar
        const barGeo = new THREE.BoxGeometry(2.5, 0.35, 0.27);
        const barMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.y = 0.75;
        group.add(bar);

        // Window Close/Minimize Dots (Red, Yellow, Green)
        const dotGeo = new THREE.CircleGeometry(0.06, 12);
        const redDot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        redDot.position.set(-1.0, 0.75, 0.15);
        group.add(redDot);

        const yellowDot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0xeab308 }));
        yellowDot.position.set(-0.8, 0.75, 0.15);
        group.add(yellowDot);

        const greenDot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0x22c55e }));
        greenDot.position.set(-0.6, 0.75, 0.15);
        group.add(greenDot);

        // Warning Hazard Surface
        const screenGeo = new THREE.PlaneGeometry(2.3, 1.4);
        const screenMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, -0.15, 0.14);
        group.add(screen);

        // Warning Triangle
        const triShape = new THREE.Shape();
        triShape.moveTo(0, 0.45);
        triShape.lineTo(-0.45, -0.35);
        triShape.lineTo(0.45, -0.35);
        triShape.closePath();
        const triGeo = new THREE.ShapeGeometry(triShape);
        const triMat = new THREE.MeshBasicMaterial({ color: 0x78350f });
        const tri = new THREE.Mesh(triGeo, triMat);
        tri.position.set(0, -0.15, 0.15);
        group.add(tri);

        // Exclamation Mark
        const exclBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.05), new THREE.MeshBasicMaterial({ color: 0xffedd5 }));
        exclBar.position.set(0, -0.1, 0.17);
        group.add(exclBar);

        const exclDot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), new THREE.MeshBasicMaterial({ color: 0xffedd5 }));
        exclDot.position.set(0, -0.32, 0.17);
        group.add(exclDot);

        // Orbiting Algorithmic Rings
        const ringGeo = new THREE.TorusGeometry(1.65, 0.05, 8, 24);
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0xd97706,
          metalness: 0.9,
          roughness: 0.1,
        });
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.rotation.x = Math.PI / 3;
        group.add(ring1);

        const alertLight = new THREE.PointLight(0xf59e0b, 2.5, 8);
        group.add(alertLight);

      } else if (type === 'Coffee') {
        // --- 5. HIGH-FIDELITY ARTISAN CERAMIC COFFEE MUG WITH LATTE ART ---
        // Mug Ceramic Body
        const mugGeo = new THREE.CylinderGeometry(0.85, 0.72, 1.6, 24);
        const mugMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.12, metalness: 0.08 });
        const mug = new THREE.Mesh(mugGeo, mugMat);
        group.add(mug);

        // Curved Side Handle
        const handleGeo = new THREE.TorusGeometry(0.52, 0.12, 12, 24, Math.PI * 1.15);
        const handle = new THREE.Mesh(handleGeo, mugMat);
        handle.rotation.z = -Math.PI / 2;
        handle.position.set(0.85, 0.05, 0);
        group.add(handle);

        // Saucer Plate
        const saucerGeo = new THREE.CylinderGeometry(1.25, 0.9, 0.14, 24);
        const saucer = new THREE.Mesh(saucerGeo, mugMat);
        saucer.position.y = -0.85;
        group.add(saucer);

        // Rich Espresso Coffee Liquid
        const liquidGeo = new THREE.CylinderGeometry(0.78, 0.78, 0.08, 24);
        const liquidMat = new THREE.MeshStandardMaterial({ color: 0x3b1d0c, roughness: 0.25 });
        const liquid = new THREE.Mesh(liquidGeo, liquidMat);
        liquid.position.y = 0.72;
        group.add(liquid);

        // Latte Art Foam Heart / Rosetta
        const foamShape = new THREE.Shape();
        foamShape.moveTo(0, 0);
        foamShape.bezierCurveTo(0, 0.2, -0.3, 0.45, -0.45, 0.25);
        foamShape.bezierCurveTo(-0.6, 0, -0.4, -0.3, 0, -0.5);
        foamShape.bezierCurveTo(0.4, -0.3, 0.6, 0, 0.45, 0.25);
        foamShape.bezierCurveTo(0.3, 0.45, 0, 0.2, 0, 0);

        const foamGeo = new THREE.ShapeGeometry(foamShape);
        const foamMat = new THREE.MeshBasicMaterial({ color: 0xfef3c7, side: THREE.DoubleSide });
        const foam = new THREE.Mesh(foamGeo, foamMat);
        foam.rotation.x = -Math.PI / 2;
        foam.scale.set(0.65, 0.65, 0.65);
        foam.position.set(0, 0.77, 0.05);
        group.add(foam);

        // Rising Steam Spirals
        for (let i = -1; i <= 1; i += 2) {
          const steamGeo = new THREE.TorusGeometry(0.22, 0.04, 8, 16, Math.PI);
          const steamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
          const steam = new THREE.Mesh(steamGeo, steamMat);
          steam.position.set(i * 0.28, 1.28, 0);
          steam.rotation.z = Math.PI / 2;
          group.add(steam);
        }

        const coffeeLight = new THREE.PointLight(0xd97706, 2.5, 8);
        coffeeLight.position.y = 1.0;
        group.add(coffeeLight);

      } else if (type === 'Book') {
        // --- 6. HIGH-FIDELITY OPENED LEATHER HARDCOVER BOOK ---
        // Left & Right Curved Open Pages
        const pageShape = new THREE.Shape();
        pageShape.moveTo(0, 0);
        pageShape.quadraticCurveTo(0.6, 0.18, 1.2, 0);
        pageShape.lineTo(1.2, -1.6);
        pageShape.quadraticCurveTo(0.6, -1.42, 0, -1.6);
        pageShape.closePath();

        const extrudePage = { depth: 0.12, bevelEnabled: true, bevelSize: 0.02 };
        const pageGeo = new THREE.ExtrudeGeometry(pageShape, extrudePage);
        const pageMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

        // Left Page
        const leftPage = new THREE.Mesh(pageGeo, pageMat);
        leftPage.rotation.y = Math.PI;
        leftPage.position.set(0, 0.8, 0);
        group.add(leftPage);

        // Right Page
        const rightPage = new THREE.Mesh(pageGeo, pageMat);
        rightPage.position.set(0, 0.8, 0);
        group.add(rightPage);

        // Navy Blue Leather Hardcover Backing
        const coverShape = new THREE.Shape();
        coverShape.moveTo(0, 0.05);
        coverShape.quadraticCurveTo(0.65, 0.22, 1.26, 0.05);
        coverShape.lineTo(1.26, -1.65);
        coverShape.quadraticCurveTo(0.65, -1.48, 0, -1.65);
        coverShape.closePath();

        const coverGeo = new THREE.ExtrudeGeometry(coverShape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.01 });
        const coverMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.3, metalness: 0.2 });

        const leftCover = new THREE.Mesh(coverGeo, coverMat);
        leftCover.rotation.y = Math.PI;
        leftCover.position.set(0, 0.8, -0.06);
        group.add(leftCover);

        const rightCover = new THREE.Mesh(coverGeo, coverMat);
        rightCover.position.set(0, 0.8, -0.06);
        group.add(rightCover);

        // Gold Embossed Book Spine
        const spineGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.75, 16, 1, false, 0, Math.PI);
        const spineMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 });
        const spine = new THREE.Mesh(spineGeo, spineMat);
        spine.rotation.x = Math.PI / 2;
        spine.position.set(0, 0, -0.07);
        group.add(spine);

        // Printed Text Lines on Pages
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
        for (let i = 0; i < 6; i++) {
          const l1 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.04), lineMat);
          l1.position.set(-0.6, 0.5 - i * 0.22, 0.13);
          group.add(l1);

          const l2 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.04), lineMat);
          l2.position.set(0.6, 0.5 - i * 0.22, 0.13);
          group.add(l2);
        }

        // Satin Red Bookmark Ribbon
        const ribbonGeo = new THREE.BoxGeometry(0.12, 0.9, 0.02);
        const ribbonMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
        ribbon.position.set(0.1, -0.45, 0.14);
        group.add(ribbon);

        const bookLight = new THREE.PointLight(0x38bdf8, 2.5, 8);
        group.add(bookLight);

      } else if (type === 'Exercício Físico') {
        // --- 7. HIGH-FIDELITY OLYMPIC DUMBBELL ---
        // Knurled Metallic Bar
        const barGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.5, 16);
        const barMat = new THREE.MeshStandardMaterial({ color: 0xc084fc, metalness: 0.9, roughness: 0.15 });
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.rotation.z = Math.PI / 2;
        group.add(bar);

        // Hexagonal Green Weight Plates
        const plateGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.35, 6);
        const plateMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.2, emissive: 0x052e16 });

        const pLeft = new THREE.Mesh(plateGeo, plateMat);
        pLeft.rotation.z = Math.PI / 2;
        pLeft.position.x = -0.95;
        group.add(pLeft);

        const pRight = new THREE.Mesh(plateGeo, plateMat);
        pRight.rotation.z = Math.PI / 2;
        pRight.position.x = 0.95;
        group.add(pRight);

        // Silver Collar Collars
        const collarGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 12);
        const collarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 });
        const cLeft = new THREE.Mesh(collarGeo, collarMat);
        cLeft.rotation.z = Math.PI / 2;
        cLeft.position.x = -0.65;
        group.add(cLeft);

        const cRight = new THREE.Mesh(collarGeo, collarMat);
        cRight.rotation.z = Math.PI / 2;
        cRight.position.x = 0.65;
        group.add(cRight);

        const gymLight = new THREE.PointLight(0x22c55e, 2.5, 8);
        group.add(gymLight);

      } else if (type === 'Atividade ao Ar Livre') {
        // --- 8. HIGH-FIDELITY NATURE PINE TREE WITH SUN ORB ---
        // Bark Trunk
        const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 0.9, 12);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = -0.6;
        group.add(trunk);

        // Multi-tiered Pine Canopy
        const tierMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.3, emissive: 0x022c22 });
        for (let i = 0; i < 3; i++) {
          const coneGeo = new THREE.ConeGeometry(1.2 - i * 0.25, 1.1, 10);
          const cone = new THREE.Mesh(coneGeo, tierMat);
          cone.position.y = -0.1 + i * 0.6;
          group.add(cone);
        }

        // Floating Golden Sun Orb
        const sunGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xfcb316 });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        sun.position.set(0.8, 1.4, 0);
        group.add(sun);

        const sunGlow = new THREE.PointLight(0xf59e0b, 3, 10);
        sunGlow.position.set(0.8, 1.4, 0);
        group.add(sunGlow);

      } else if (type === 'Desconexão') {
        // --- 9. HIGH-FIDELITY UNPLUGGED ELECTRIC POWER PLUG ---
        // Power Plug Body
        const plugBodyGeo = new THREE.BoxGeometry(0.8, 0.9, 0.6);
        const plugBodyMat = new THREE.MeshStandardMaterial({ color: 0x0e7490, metalness: 0.5, roughness: 0.2 });
        const plugBody = new THREE.Mesh(plugBodyGeo, plugBodyMat);
        group.add(plugBody);

        // Metallic Prongs
        const prongGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 12);
        const prongMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.9, roughness: 0.1 });

        const p1 = new THREE.Mesh(prongGeo, prongMat);
        p1.position.set(-0.2, 0.7, 0);
        group.add(p1);

        const p2 = new THREE.Mesh(prongGeo, prongMat);
        p2.position.set(0.2, 0.7, 0);
        group.add(p2);

        // Glowing Cyan Shield Ring
        const ringGeo = new THREE.TorusGeometry(1.2, 0.1, 12, 32);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0891b2, emissiveIntensity: 0.9 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        const cyanLight = new THREE.PointLight(0x06b6d4, 3, 10);
        group.add(cyanLight);

      } else if (type === 'Bola de Futebol') {
        // --- 10. CLASSIC BLACK & WHITE SOCCER BALL (TELSTAR STYLE) ---
        const ballGeo = new THREE.SphereGeometry(1.05, 48, 48);
        const ballMat = new THREE.MeshStandardMaterial({
          map: soccerBallTexture,
          bumpMap: soccerBallTexture,
          bumpScale: 0.02,
          roughness: 0.15,
          metalness: 0.05,
        });
        const ball = new THREE.Mesh(ballGeo, ballMat);
        ball.castShadow = true;
        group.add(ball);

        // 12 Flush Black Pentagonal Leather Panels mapped to Icosahedron Vertices
        const patchGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.015, 5);
        const patchMat = new THREE.MeshStandardMaterial({
          color: 0x111827,
          roughness: 0.2,
          metalness: 0.1,
        });

        ICO_VERTICES.forEach(([vx, vy, vz]) => {
          const dir = new THREE.Vector3(vx, vy, vz).normalize();
          const patch = new THREE.Mesh(patchGeo, patchMat);
          patch.position.copy(dir.clone().multiplyScalar(1.052));
          patch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          group.add(patch);
        });

        // Warm Neutral Sports Spotlight
        const ballGlow = new THREE.PointLight(0xffffff, 1.2, 8);
        group.add(ballGlow);

      } else if (type === 'Encontro Presencial') {
        // --- 11. HIGH-FIDELITY IN-PERSON HUMAN EMBRACE / ABRAÇO ---
        const figureMat1 = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.25 });
        const figureMat2 = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.25 });

        // Person 1 (Rose Jacket)
        const body1Geo = new THREE.CylinderGeometry(0.32, 0.48, 1.2, 16);
        const head1Geo = new THREE.SphereGeometry(0.38, 16, 16);
        const body1 = new THREE.Mesh(body1Geo, figureMat1);
        body1.position.set(-0.48, -0.2, 0);
        body1.rotation.z = -0.28;
        group.add(body1);

        const head1 = new THREE.Mesh(head1Geo, figureMat1);
        head1.position.set(-0.62, 0.58, 0);
        group.add(head1);

        // Person 2 (Blue Jacket)
        const body2Geo = new THREE.CylinderGeometry(0.32, 0.48, 1.2, 16);
        const head2Geo = new THREE.SphereGeometry(0.38, 16, 16);
        const body2 = new THREE.Mesh(body2Geo, figureMat2);
        body2.position.set(0.48, -0.2, 0);
        body2.rotation.z = 0.28;
        group.add(body2);

        const head2 = new THREE.Mesh(head2Geo, figureMat2);
        head2.position.set(0.62, 0.58, 0);
        group.add(head2);

        // Glowing Golden Heart of Human Connection
        const heartShape = new THREE.Shape();
        heartShape.moveTo(0, 0);
        heartShape.bezierCurveTo(0, 0.35, -0.55, 0.85, -0.85, 0.45);
        heartShape.bezierCurveTo(-1.15, 0, -0.75, -0.55, 0, -0.95);
        heartShape.bezierCurveTo(0.75, -0.55, 1.15, 0, 0.85, 0.45);
        heartShape.bezierCurveTo(0.55, 0.85, 0, 0.35, 0, 0);

        const heartGeo = new THREE.ExtrudeGeometry(heartShape, { depth: 0.22, bevelEnabled: true, bevelSize: 0.06 });
        const heartMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 0.9,
          roughness: 0.1,
        });
        const heart = new THREE.Mesh(heartGeo, heartMat);
        heart.scale.set(0.55, 0.55, 0.55);
        heart.position.set(0, 0.85, 0.2);
        group.add(heart);

        const warmthLight = new THREE.PointLight(0xfbbf24, 3.5, 10);
        warmthLight.position.set(0, 0.85, 0.5);
        group.add(warmthLight);
      } else if (type === 'CardNotificacao') {
        // --- 12. HIGH-FIDELITY COMPACT MOBILE NOTIFICATION CARD (GROUND OBSTACLE) ---
        // Rounded Card Base
        const cardBaseGeo = new THREE.BoxGeometry(2.1, 0.8, 0.16);
        const cardBaseMat = new THREE.MeshStandardMaterial({
          color: 0xef4444, // Bright Alert Red
          roughness: 0.15,
          metalness: 0.45,
        });
        const cardBase = new THREE.Mesh(cardBaseGeo, cardBaseMat);
        group.add(cardBase);

        // Inner Sleek Display Panel
        const innerPanelGeo = new THREE.BoxGeometry(1.9, 0.65, 0.18);
        const innerPanelMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a, // Deep charcoal screen
          roughness: 0.1,
          metalness: 0.8,
        });
        const innerPanel = new THREE.Mesh(innerPanelGeo, innerPanelMat);
        innerPanel.position.set(0, 0, 0.01);
        group.add(innerPanel);

        // Little circular Red Badge Icon (simulating the notification bell/dot)
        const bellBadgeGeo = new THREE.SphereGeometry(0.18, 12, 12);
        const bellBadgeMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e }); // Rose red
        const bellBadge = new THREE.Mesh(bellBadgeGeo, bellBadgeMat);
        bellBadge.position.set(-0.6, 0, 0.12);
        group.add(bellBadge);

        // Miniature horizontal message lines (2 white/cyan bars)
        const lineGeo = new THREE.BoxGeometry(0.8, 0.08, 0.05);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const line1 = new THREE.Mesh(lineGeo, lineMat);
        line1.position.set(0.15, 0.1, 0.12);
        group.add(line1);

        const line2 = new THREE.Mesh(lineGeo, lineMat);
        line2.position.set(0.15, -0.1, 0.12);
        group.add(line2);

        // Pulsing/Glowing Notification point light
        const notifLight = new THREE.PointLight(0xef4444, 3, 6);
        notifLight.position.set(-0.6, 0, 0.2);
        group.add(notifLight);
      } else if (type === 'CardNotifPendente') {
        // --- 13. HIGH-FIDELITY COMPACT MOBILE PENDING NOTIFICATION CARD ---
        // Rounded Card Base
        const cardBaseGeo = new THREE.BoxGeometry(2.1, 0.8, 0.16);
        const cardBaseMat = new THREE.MeshStandardMaterial({
          color: 0xf97316, // Vivid Amber/Orange Alert
          roughness: 0.15,
          metalness: 0.45,
        });
        const cardBase = new THREE.Mesh(cardBaseGeo, cardBaseMat);
        group.add(cardBase);

        // Inner Sleek Display Panel
        const innerPanelGeo = new THREE.BoxGeometry(1.9, 0.65, 0.18);
        const innerPanelMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a, // Deep charcoal screen
          roughness: 0.1,
          metalness: 0.8,
        });
        const innerPanel = new THREE.Mesh(innerPanelGeo, innerPanelMat);
        innerPanel.position.set(0, 0, 0.01);
        group.add(innerPanel);

        // Bell Body (Cone & Sphere combined)
        const bellConeGeo = new THREE.ConeGeometry(0.15, 0.25, 8);
        const bellConeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // Gold bell
        const bellCone = new THREE.Mesh(bellConeGeo, bellConeMat);
        bellCone.position.set(-0.6, 0.05, 0.12);
        group.add(bellCone);

        const bellRingerGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const bellRinger = new THREE.Mesh(bellRingerGeo, bellConeMat);
        bellRinger.position.set(-0.6, -0.1, 0.12);
        group.add(bellRinger);

        // Miniature horizontal message lines (2 orange/amber bars)
        const lineGeo = new THREE.BoxGeometry(0.8, 0.08, 0.05);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
        const line1 = new THREE.Mesh(lineGeo, lineMat);
        line1.position.set(0.15, 0.1, 0.12);
        group.add(line1);

        const line2 = new THREE.Mesh(lineGeo, lineMat);
        line2.position.set(0.15, -0.1, 0.12);
        group.add(line2);

        // Amber point light
        const notifLight = new THREE.PointLight(0xf97316, 3, 6);
        notifLight.position.set(-0.6, 0, 0.2);
        group.add(notifLight);

      } else if (type === 'CardFeed') {
        // --- 14. HIGH-FIDELITY COMPACT MOBILE NEW FEED CARD ---
        // Rounded Card Base
        const cardBaseGeo = new THREE.BoxGeometry(2.1, 0.8, 0.16);
        const cardBaseMat = new THREE.MeshStandardMaterial({
          color: 0x3b82f6, // Royal/Social Blue
          roughness: 0.15,
          metalness: 0.45,
        });
        const cardBase = new THREE.Mesh(cardBaseGeo, cardBaseMat);
        group.add(cardBase);

        // Inner Sleek Display Panel
        const innerPanelGeo = new THREE.BoxGeometry(1.9, 0.65, 0.18);
        const innerPanelMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a, // Deep charcoal screen
          roughness: 0.1,
          metalness: 0.8,
        });
        const innerPanel = new THREE.Mesh(innerPanelGeo, innerPanelMat);
        innerPanel.position.set(0, 0, 0.01);
        group.add(innerPanel);

        // Feed Image icon placeholder
        const imgGeo = new THREE.BoxGeometry(0.32, 0.32, 0.05);
        const imgMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
        const imgMesh = new THREE.Mesh(imgGeo, imgMat);
        imgMesh.position.set(-0.6, 0, 0.12);
        group.add(imgMesh);

        // Miniature horizontal message lines (2 blue-tinted bars)
        const lineGeo = new THREE.BoxGeometry(0.8, 0.08, 0.05);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xdbeafe });
        const line1 = new THREE.Mesh(lineGeo, lineMat);
        line1.position.set(0.15, 0.1, 0.12);
        group.add(line1);

        const line2 = new THREE.Mesh(lineGeo, lineMat);
        line2.position.set(0.15, -0.1, 0.12);
        group.add(line2);

        // Blue point light
        const notifLight = new THREE.PointLight(0x3b82f6, 3, 6);
        notifLight.position.set(-0.6, 0, 0.2);
        group.add(notifLight);
      } else if (type === 'Hamburguer') {
        // --- 15. HIGH-FIDELITY GOURMET 3D HAMBURGER MODEL ---
        const bunMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55, metalness: 0.1 });
        const pattyMat = new THREE.MeshStandardMaterial({ color: 0x381808, roughness: 0.8, metalness: 0.05 });
        const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, metalness: 0.1 });
        const lettuceMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5, metalness: 0.05 });
        const tomatoMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.1 });

        // Bottom Bun
        const bottomBun = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.76, 0.28, 16), bunMat);
        bottomBun.position.y = -0.32;
        group.add(bottomBun);

        // Grilled Beef Patty
        const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.24, 16), pattyMat);
        patty.position.y = -0.06;
        group.add(patty);

        // Melted Golden Cheddar Slice
        const cheese = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.04, 0.98), cheeseMat);
        cheese.position.y = 0.08;
        cheese.rotation.y = Math.PI / 4;
        group.add(cheese);

        // Sliced Ripe Tomato
        const tomato = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.07, 16), tomatoMat);
        tomato.position.y = 0.14;
        group.add(tomato);

        // Crisp Lettuce
        const lettuce = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.06, 16), lettuceMat);
        lettuce.position.y = 0.21;
        group.add(lettuce);

        // Top Sesame Bun Dome
        const topBun = new THREE.Mesh(new THREE.SphereGeometry(0.82, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), bunMat);
        topBun.position.y = 0.24;
        topBun.scale.set(1, 0.62, 1);
        group.add(topBun);

        // Sesame Seeds
        const seedGeo = new THREE.SphereGeometry(0.04, 4, 4);
        const seedMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.3 });
        for (let i = 0; i < 10; i++) {
          const seed = new THREE.Mesh(seedGeo, seedMat);
          const ang = (i * Math.PI * 2) / 10;
          const rad = 0.3 + (i % 2) * 0.2;
          seed.position.set(Math.cos(ang) * rad, 0.65, Math.sin(ang) * rad);
          seed.scale.set(1.4, 0.6, 0.8);
          group.add(seed);
        }

        const burgerLight = new THREE.PointLight(0xf59e0b, 2.5, 6);
        burgerLight.position.set(0, 0.2, 0.2);
        group.add(burgerLight);
      } else if (type === 'Violão') {
        // Collectible Classical Acoustic Guitar Item
        const guitarMesh = createAcousticGuitarMesh();
        guitarMesh.scale.set(0.9, 0.9, 0.9);
        guitarMesh.rotation.z = -0.35;
        group.add(guitarMesh);

        const musicLight = new THREE.PointLight(0x06b6d4, 3, 7);
        musicLight.position.set(0, 0.5, 0.4);
        group.add(musicLight);

      } else if (type === 'Cachorro') {
        // --- CUTE PUPPY DOG 3D MODEL ---
        const furMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7, metalness: 0.1 });
        const darkFurMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });

        // Puppy Body
        const dogBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.42), furMat);
        dogBody.position.y = 0.05;
        group.add(dogBody);

        // Puppy Head
        const dogHead = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), furMat);
        dogHead.position.set(0.42, 0.32, 0);
        group.add(dogHead);

        // Floppy Ears
        const earGeo = new THREE.BoxGeometry(0.12, 0.22, 0.08);
        const leftEar = new THREE.Mesh(earGeo, darkFurMat);
        leftEar.position.set(0.45, 0.48, 0.22);
        leftEar.rotation.z = -0.2;
        group.add(leftEar);

        const rightEar = new THREE.Mesh(earGeo, darkFurMat);
        rightEar.position.set(0.45, 0.48, -0.22);
        rightEar.rotation.z = -0.2;
        group.add(rightEar);

        // Tail
        const tailGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.3, 8);
        const tail = new THREE.Mesh(tailGeo, furMat);
        tail.position.set(-0.45, 0.3, 0);
        tail.rotation.z = 0.6;
        group.add(tail);

        const dogLight = new THREE.PointLight(0xf59e0b, 3, 6);
        dogLight.position.set(0, 0.4, 0);
        group.add(dogLight);

      } else if (type === 'WhatsApp') {
        // --- WHATSAPP ICON (Green bubble & phone) ---
        const waBaseGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.18, 24);
        const waMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.3, metalness: 0.2 });
        const waBase = new THREE.Mesh(waBaseGeo, waMat);
        waBase.rotation.x = Math.PI / 2;
        group.add(waBase);

        const phoneMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.05), phoneMat);
        phoneBody.position.set(0, 0, 0.1);
        group.add(phoneBody);

        const waLight = new THREE.PointLight(0x22c55e, 2.5, 6);
        waLight.position.set(0, 0, 0.3);
        group.add(waLight);

      } else if (type === 'YouTube') {
        // --- YOUTUBE ICON (Red rounded rectangle & play triangle) ---
        const ytBaseGeo = new THREE.BoxGeometry(1.6, 1.0, 0.2);
        const ytMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.2 });
        const ytBase = new THREE.Mesh(ytBaseGeo, ytMat);
        group.add(ytBase);

        const triGeo = new THREE.ConeGeometry(0.35, 0.45, 3);
        const triMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const tri = new THREE.Mesh(triGeo, triMat);
        tri.rotation.z = -Math.PI / 2;
        tri.position.set(0.05, 0, 0.12);
        group.add(tri);

        const ytLight = new THREE.PointLight(0xef4444, 2.5, 6);
        ytLight.position.set(0, 0, 0.3);
        group.add(ytLight);

      } else if (type === 'Facebook') {
        // --- FACEBOOK ICON (Blue badge & white 'f') ---
        const fbBaseGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.18, 24);
        const fbMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.2 });
        const fbBase = new THREE.Mesh(fbBaseGeo, fbMat);
        fbBase.rotation.x = Math.PI / 2;
        group.add(fbBase);

        const fMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const fStem = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.05), fMat);
        fStem.position.set(-0.08, 0, 0.1);
        group.add(fStem);

        const fBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.05), fMat);
        fBar1.position.set(0.02, 0.14, 0.1);
        group.add(fBar1);

        const fBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.05), fMat);
        fBar2.position.set(0, 0.0, 0.1);
        group.add(fBar2);

        const fbLight = new THREE.PointLight(0x2563eb, 2.5, 6);
        fbLight.position.set(0, 0, 0.3);
        group.add(fbLight);
      }

      group.castShadow = true;
      meshTemplateCache.set(type, group);
      return group.clone(true);
    };

    // --- Animation & State Loop ---
    let animationFrameId: number;
    let spawnTimerFalling = 0;
    let spawnTimerGround = 0;
    let spawnTimerCard = 0;
    let guitarAnimTimer = 0;
    let exerciseAnimTimer = 0;
    let soccerAnimTimer = 0;
    let coffeeDrinkAnimTimer = 0;
    let burgerEatAnimTimer = 0;
    let bookReadAnimTimer = 0;
    let hugAnimTimer = 0;
    let dogPetAnimTimer = 0;
    let damageFlashTimer = 0;
    let lastAnxietyLevelTracked = anxietyLevel;

    // --- 3D MESH OBJECT POOLING ENGINE (Zero GC Pressure & Smooth 60 FPS) ---
    const itemMeshPool = new Map<FallingItem['type'], THREE.Object3D[]>();

    const getPooled3DItemMesh = (type: FallingItem['type']): THREE.Object3D => {
      let pool = itemMeshPool.get(type);
      if (!pool) {
        pool = [];
        itemMeshPool.set(type, pool);
      }
      if (pool.length > 0) {
        const obj = pool.pop()!;
        obj.visible = true;
        obj.scale.set(1.0, 1.0, 1.0);
        obj.rotation.set(0, 0, 0);
        return obj;
      }
      return create3DItemMesh(type);
    };

    const recyclePooled3DItemMesh = (type: FallingItem['type'], obj: THREE.Object3D) => {
      scene.remove(obj);
      obj.visible = false;
      let pool = itemMeshPool.get(type);
      if (!pool) {
        pool = [];
        itemMeshPool.set(type, pool);
      }
      if (pool.length < 30) {
        pool.push(obj);
      } else {
        disposeObject3D(obj);
      }
    };

    // --- PRE-ALLOCATED PARTICLE RING BUFFER FOR EXPLOSIONS ---
    interface PooledParticle {
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      lifetime: number;
      maxLifetime: number;
      active: boolean;
    }

    const particlePoolSize = 60;
    const particlePool: PooledParticle[] = [];
    const particleGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const particleBaseMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 1.0 });

    for (let i = 0; i < particlePoolSize; i++) {
      const pMesh = new THREE.Mesh(particleGeo, particleBaseMat.clone());
      pMesh.visible = false;
      scene.add(pMesh);
      particlePool.push({
        mesh: pMesh,
        velocity: new THREE.Vector3(),
        lifetime: 0,
        maxLifetime: 1.0,
        active: false,
      });
    }

    const createExplosion = (x: number, y: number, z: number) => {
      const colors = [0xef4444, 0xf43f5e, 0xf59e0b, 0x00f3ff];
      let spawned = 0;
      for (let i = 0; i < particlePool.length && spawned < 16; i++) {
        const p = particlePool[i];
        if (!p.active) {
          p.active = true;
          p.mesh.visible = true;
          p.mesh.position.set(x + (Math.random() - 0.5) * 0.4, y + Math.random() * 0.5, z + (Math.random() - 0.5) * 0.4);

          const angle = Math.random() * Math.PI * 2;
          const speed = 4 + Math.random() * 6;
          p.velocity.set(
            Math.cos(angle) * speed,
            5 + Math.random() * 8,
            Math.sin(angle) * speed
          );
          p.lifetime = 0.5 + Math.random() * 0.4;
          p.maxLifetime = p.lifetime;

          const chosenColor = colors[Math.floor(Math.random() * colors.length)];
          (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(chosenColor);
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1.0;
          spawned++;
        }
      }
    };

    // --- FLYOVER CREATURES SYSTEM (Águias e Pássaros em Sobrevoo / Rasantes) ---
    interface FlyoverCreature {
      group: THREE.Group;
      leftWing: THREE.Mesh;
      rightWing: THREE.Mesh;
      velocity: THREE.Vector3;
      isEagle: boolean;
      swoopPhase: number;
    }

    const flyoverCreatures: FlyoverCreature[] = [];
    let spawnTimerFlyover = 0;

    const createFlyoverCreature = (isEagle: boolean): FlyoverCreature => {
      const group = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({
        color: isEagle ? 0x78350f : 0x334155,
        roughness: 0.8,
      });
      const wingMat = new THREE.MeshStandardMaterial({
        color: isEagle ? 0x92400e : 0x475569,
        roughness: 0.8,
      });

      const bodyGeo = isEagle ? new THREE.ConeGeometry(0.35, 1.4, 6) : new THREE.ConeGeometry(0.18, 0.7, 5);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.x = Math.PI / 2;
      group.add(body);

      const wingGeo = isEagle ? new THREE.BoxGeometry(2.4, 0.08, 0.5) : new THREE.BoxGeometry(1.1, 0.05, 0.25);
      
      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.set(- (isEagle ? 1.2 : 0.55), 0, 0);
      group.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.position.set(isEagle ? 1.2 : 0.55, 0, 0);
      group.add(rightWing);

      if (isEagle) {
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfef3c7 }));
        head.position.set(0, 0.1, 0.7);
        group.add(head);
      }

      scene.add(group);

      const startLeft = Math.random() < 0.5;
      const startX = startLeft ? playerGroup.position.x - 70 : playerGroup.position.x + 70;
      const startY = 15 + Math.random() * 8;
      const startZ = 2 + Math.random() * 6;
      group.position.set(startX, startY, startZ);

      const speedX = (startLeft ? 1 : -1) * (isEagle ? (12 + Math.random() * 6) : (16 + Math.random() * 8));

      return {
        group,
        leftWing,
        rightWing,
        velocity: new THREE.Vector3(speedX, 0, 0),
        isEagle,
        swoopPhase: Math.random() * Math.PI * 2,
      };
    };

    // --- FPS GUARD & PERFORMANCE METRICS MONITOR ---
    let frameCount = 0;
    let fpsTimer = 0;
    let isHighDPI = window.devicePixelRatio > 1.0;

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // FPS Guard: Adaptive pixel ratio reduction for low-performance devices
      frameCount++;
      fpsTimer += delta;
      if (fpsTimer >= 3.0) {
        const currentFps = frameCount / fpsTimer;
        frameCount = 0;
        fpsTimer = 0;

        if (currentFps < 40 && isHighDPI) {
          isHighDPI = false;
          renderer.setPixelRatio(1.0);
        } else if (currentFps > 55 && !isHighDPI && window.devicePixelRatio > 1.0) {
          isHighDPI = true;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
        }
      }

      // Update pre-allocated explosion particles ring buffer
      for (let i = 0; i < particlePool.length; i++) {
        const p = particlePool[i];
        if (!p.active) continue;

        p.lifetime -= delta;
        if (p.lifetime <= 0) {
          p.active = false;
          p.mesh.visible = false;
        } else {
          // Apply gravity and movement
          p.velocity.y -= 18 * delta;
          p.mesh.position.x += p.velocity.x * delta;
          p.mesh.position.y += p.velocity.y * delta;
          p.mesh.position.z += p.velocity.z * delta;

          const progress = Math.max(0.001, p.lifetime / p.maxLifetime);
          p.mesh.scale.set(progress, progress, progress);
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = progress;
        }
      }

      // Update Flyover Creatures (Birds & Eagles)
      spawnTimerFlyover += delta;
      if (spawnTimerFlyover >= 3.2 && flyoverCreatures.length < 5) {
        spawnTimerFlyover = 0;
        const isEagle = Math.random() < 0.25;
        flyoverCreatures.push(createFlyoverCreature(isEagle));
      }

      for (let i = flyoverCreatures.length - 1; i >= 0; i--) {
        const fc = flyoverCreatures[i];
        fc.swoopPhase += delta * 3.0;

        fc.group.position.x += fc.velocity.x * delta;

        const distToPlayer = fc.group.position.x - playerGroup.position.x;
        if (Math.abs(distToPlayer) < 28) {
          const swoopY = 11 - Math.sin(fc.swoopPhase) * 6.0;
          fc.group.position.y += (swoopY - fc.group.position.y) * delta * 3.0;
        } else {
          fc.group.position.y += (18 - fc.group.position.y) * delta * 2.0;
        }

        const flapSpeed = fc.isEagle ? 7.5 : 16.0;
        const flapAngle = Math.sin(time * flapSpeed) * (fc.isEagle ? 0.35 : 0.6);
        fc.leftWing.rotation.z = flapAngle;
        fc.rightWing.rotation.z = -flapAngle;

        fc.group.rotation.z = Math.sin(time * 2) * 0.1;
        fc.group.rotation.y = fc.velocity.x > 0 ? 0 : Math.PI;

        if (Math.abs(fc.group.position.x - playerGroup.position.x) > 90) {
          scene.remove(fc.group);
          fc.group.traverse((child) => {
            if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
          });
          flyoverCreatures.splice(i, 1);
        }
      }

      // Sync umbrella visibility in 3D scene
      if (umbrellaGroup) {
        umbrellaGroup.visible = !!umbrellaActiveRef.current;
        if (umbrellaActiveRef.current) {
          umbrellaGroup.rotation.y += delta * 1.8;
        }
      }

      // Dynamic Facial Micro-Expression Update based on Anxiety using memoized textures
      const currentAnxiety = anxietyRef.current;

      // Trigger beautiful guitar strumming pose if anxiety level drops to exactly 0 (Zen Level)
      if (currentAnxiety === 0 && lastAnxietyLevelTracked > 0) {
        guitarAnimTimer = 3.5;
      }
      lastAnxietyLevelTracked = currentAnxiety;

      const targetFaceTex = currentAnxiety >= 70 ? faceTexHigh : currentAnxiety >= 35 ? faceTexMed : faceTexLow;
      if (facePlane.material.map !== targetFaceTex) {
        facePlane.material.map = targetFaceTex;
        facePlane.material.needsUpdate = true;
      }

      // Smooth & Instant Responsive Player Position along X
      const targetX = playerPosRef.current;
      const deltaX = targetX - playerGroup.position.x;
      playerGroup.position.x += deltaX * 0.45;

      const isMoving = Math.abs(deltaX) > 0.08;

      // Screen Shake (Tela Trêmula) based on Anxiety Level
      const shakeFactor = Math.max(0, (currentAnxiety - 25) / 75);
      const shakeX = shakeFactor > 0 ? (Math.random() - 0.5) * 0.85 * shakeFactor : 0;
      const shakeY = shakeFactor > 0 ? (Math.random() - 0.5) * 0.85 * shakeFactor : 0;

      // --- SMOOTH CAMERA FOLLOW (Foco Contínuo e Fluido no Avatar) ---
      const targetCamX = playerGroup.position.x;
      const currentCamX = camera.position.x;
      const nextCamX = currentCamX + (targetCamX - currentCamX) * 0.08;

      camera.position.set(nextCamX + shakeX, 14.4 + shakeY, 32);
      camera.lookAt(nextCamX + shakeX, 9.4, 0);

      // Dynamic Lights Tracking with Avatar
      cyanLight.position.set(nextCamX - 22, 15, 5);
      magentaLight.position.set(nextCamX + 22, 15, 5);
      dirLight.position.set(nextCamX + 15, 30, 20);
      dirLight.target.position.set(nextCamX, 0, 0);
      dirLight.target.updateMatrixWorld();

      // Handle Damage Flash Aura
      if (damageFlashTimer > 0) {
        damageFlashTimer -= delta;
        damageAura.material.opacity = Math.max(0, damageFlashTimer * 2);
      } else {
        damageAura.material.opacity = 0;
      }

      // --- HELPER TO RESET ALL PROPS ---
      const hideAllProps = () => {
        leftDumbbell.visible = false;
        rightDumbbell.visible = false;
        soccerJuggleGroup.visible = false;
        coffeeCupProp.visible = false;
        burgerProp.visible = false;
        bookProp.visible = false;
        stoolGroup.visible = false;
        guitarGroup.visible = false;
        friendHugGroup.visible = false;
        dogProp.visible = false;
        soundwaveMat.opacity = 0;
        zenPillarMat.opacity = 0;
        headGroup.rotation.set(0, 0, 0);
      };

      // --- POSES & ANIMATION STATES ---
      if (guitarAnimTimer > 0) {
        // --- POSE: REALISTIC ACOUSTIC GUITAR PLAYING & STRUMMING (SIMULAR O MOVIMENTO TOCANDO VIOLÃO) ---
        hideAllProps();
        guitarAnimTimer -= delta;
        stoolGroup.visible = true;
        guitarGroup.visible = true;

        playerGroup.position.y = 0.8;
        playerGroup.rotation.y = 0;

        // Realistic relaxed seated posture on the high stool
        leftLegGroup.rotation.set(1.15, 0.15, -0.1);
        rightLegGroup.rotation.set(0.95, -0.15, 0.1);
        leftLowerLegGroup.rotation.set(-1.05, 0, 0);
        rightLowerLegGroup.rotation.set(-0.85, 0, 0);

        // Classical guitar resting naturally across the lap and angled upwards towards left shoulder
        guitarGroup.position.set(0.16, 1.96, 0.72);
        guitarGroup.rotation.set(-0.22, 0.24, -0.65 + Math.sin(time * 3.5) * 0.03);

        // Musical tempos and fluid strumming / fingerpicking dynamics
        const strumSpeed = 16.0;
        const strumCycle = Math.sin(time * strumSpeed);
        const strumWrist = Math.cos(time * strumSpeed);
        const chordShift = Math.sin(time * 3.0);

        // RIGHT ARM: Arches over soundboard, sweeping up and down across the strings over the soundhole
        rightArmGroup.rotation.set(0.92, -0.22, 0.28);
        rightLowerArmGroup.rotation.set(-1.62, -0.48 + strumCycle * 0.24, 0.26 + strumWrist * 0.28);

        // LEFT ARM: Holds neck, fingers pressing frets and sliding across chord positions
        leftArmGroup.rotation.set(0.86 + chordShift * 0.06, 0.28, -0.44);
        leftLowerArmGroup.rotation.set(-1.42, 0.46, -0.18 + chordShift * 0.14);

        // HEAD: Expressive musical groove and rhythmic head nodding
        headGroup.rotation.set(
          0.16 + Math.sin(time * 8.0) * 0.12,
          Math.sin(time * 4.0) * 0.14,
          Math.cos(time * 4.0) * 0.06
        );

        // Torso subtle musical sway
        torsoGroup.rotation.z = Math.sin(time * 4.0) * 0.03;

        // Radiating harmonic pulse ring expanding from the soundhole
        const waveProgress = (3.5 - guitarAnimTimer) / 3.5;
        const waveScale = 1.0 + waveProgress * 14.0;
        soundwaveRing.position.set(0, 0.1, 0);
        soundwaveRing.scale.set(waveScale, waveScale, 1);
        soundwaveMat.opacity = Math.max(0, Math.sin(guitarAnimTimer * 2.5) * 0.75);
      } else if (exerciseAnimTimer > 0) {
        // --- POSE: 3-SECOND INTENSE PHYSICAL EXERCISE / DUMBBELL BICEP CURLS ---
        hideAllProps();
        exerciseAnimTimer -= delta;
        leftDumbbell.visible = true;
        rightDumbbell.visible = true;

        // Athletic workout rhythm (bicep curls reps)
        const repSpeed = 7.5;
        playerGroup.position.y = Math.abs(Math.sin(time * repSpeed)) * 0.12;

        // Left arm bicep curl
        leftArmGroup.rotation.x = 0.35 + Math.sin(time * repSpeed) * 0.25;
        leftArmGroup.rotation.z = -0.2;
        leftLowerArmGroup.rotation.x = -1.4 - Math.sin(time * repSpeed) * 0.95;

        // Right arm bicep curl (alternating with power)
        rightArmGroup.rotation.x = 0.35 + Math.sin(time * repSpeed + Math.PI) * 0.25;
        rightArmGroup.rotation.z = 0.2;
        rightLowerArmGroup.rotation.x = -1.4 - Math.sin(time * repSpeed + Math.PI) * 0.95;

        if (isMoving && gameState === 'PLAYING') {
          const runSwing = Math.sin(time * 14) * 0.85;
          leftLegGroup.rotation.x = runSwing;
          rightLegGroup.rotation.x = -runSwing;
          leftLowerLegGroup.rotation.x = runSwing > 0 ? -0.4 : 0;
          rightLowerLegGroup.rotation.x = runSwing < 0 ? -0.4 : 0;
          playerGroup.rotation.y = deltaX > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          // Solid athletic standing posture
          leftLegGroup.rotation.set(0.15, 0.1, -0.12);
          rightLegGroup.rotation.set(0.15, -0.1, 0.12);
          leftLowerLegGroup.rotation.set(-0.2, 0, 0);
          rightLowerLegGroup.rotation.set(-0.2, 0, 0);
          playerGroup.rotation.y = 0;
        }
      } else if (soccerAnimTimer > 0) {
        // --- POSE: 3-SECOND SOCCER BALL KEEPIE-UPPIES (EMBAIXADINHAS) ---
        hideAllProps();
        soccerAnimTimer -= delta;
        soccerJuggleGroup.visible = true;

        const juggleSpeed = 8.5;
        const ballY = 0.45 + Math.abs(Math.sin(time * juggleSpeed)) * 1.4;
        soccerJuggleGroup.position.set(0.4, ballY, 0.7);
        soccerBallMesh.rotation.x += delta * 12;
        soccerBallMesh.rotation.y += delta * 6;

        // Right leg does rhythmic kick touches
        const kickCycle = Math.sin(time * juggleSpeed);
        rightLegGroup.rotation.x = -0.4 - kickCycle * 0.65;
        rightLowerLegGroup.rotation.x = 0.35 + kickCycle * 0.45;

        // Left leg stands firm balancing
        leftLegGroup.rotation.set(0.1, 0.05, -0.1);
        leftLowerLegGroup.rotation.set(-0.15, 0, 0);

        // Arms outspread for dynamic athletic balance
        leftArmGroup.rotation.set(0.25, 0, -0.65);
        leftLowerArmGroup.rotation.set(-0.35, 0, 0);
        rightArmGroup.rotation.set(0.25, 0, 0.65);
        rightLowerArmGroup.rotation.set(-0.35, 0, 0);

        // Head focuses down on the ball
        headGroup.rotation.set(0.35, 0.15, 0);

        if (isMoving && gameState === 'PLAYING') {
          playerGroup.rotation.y = deltaX > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          playerGroup.rotation.y = 0;
        }
      } else if (coffeeDrinkAnimTimer > 0) {
        // --- POSE: 3-SECOND REALISTIC MINDFUL COFFEE DRINKING (TOMAR CAFÉ) ---
        hideAllProps();
        coffeeDrinkAnimTimer -= delta;
        coffeeCupProp.visible = true;

        const elapsed = 3.0 - coffeeDrinkAnimTimer;
        // Two smooth, natural tasting & sipping cycles
        const cycle = (elapsed % 1.5) / 1.5;
        let sipFactor = 0;
        if (cycle < 0.2) {
          // Raising cup towards mouth
          const t = cycle / 0.2;
          sipFactor = Math.sin((t * Math.PI) / 2) * 0.45;
        } else if (cycle < 0.75) {
          // Sipping phase: cup tips at mouth, head tilts back
          const t = (cycle - 0.2) / 0.55;
          sipFactor = 0.45 + 0.55 * Math.sin(t * Math.PI);
        } else {
          // Lowering cup slightly, relaxed breath of satisfaction
          const t = (cycle - 0.75) / 0.25;
          sipFactor = 0.45 * (1 - Math.sin((t * Math.PI) / 2));
        }

        // Cup position and realistic drinking tilt towards lips
        coffeeCupProp.position.set(0, 3.15 + sipFactor * 0.22, 0.72 - sipFactor * 0.08);
        coffeeCupProp.rotation.set(-0.48 * sipFactor, 0, -0.08 * sipFactor);

        // Animate rising steam vapor spirals
        cSteam1.position.y = 0.42 + Math.sin(time * 5) * 0.08;
        cSteam2.position.y = 0.48 + Math.cos(time * 4) * 0.08;
        const sScale1 = 1 + Math.sin(time * 4) * 0.2;
        const sScale2 = 1 + Math.cos(time * 4) * 0.2;
        cSteam1.scale.set(sScale1, sScale1, 1);
        cSteam2.scale.set(sScale2, sScale2, 1);

        // Right arm grips mug handle and brings it to lips
        rightArmGroup.rotation.set(1.02 + sipFactor * 0.22, 0, -0.32 - sipFactor * 0.08);
        rightLowerArmGroup.rotation.set(-1.62 - sipFactor * 0.25, -0.35, 0.15);

        // Left arm cradles the warm saucer / mug base in comfortable 2-handed coffee posture
        leftArmGroup.rotation.set(0.95 + sipFactor * 0.2, 0, 0.32 + sipFactor * 0.08);
        leftLowerArmGroup.rotation.set(-1.62 - sipFactor * 0.22, 0.38, -0.15);

        // Head gently tilts back synchronously during each sip
        headGroup.rotation.x = -0.34 * sipFactor;
        headGroup.rotation.y = Math.sin(time * 2.5) * 0.04;

        // Subtle relaxed breathing in torso
        playerGroup.position.y = Math.sin(time * 3) * 0.04;

        // Legs posture
        if (isMoving && gameState === 'PLAYING') {
          const runSwing = Math.sin(time * 14) * 0.85;
          leftLegGroup.rotation.x = runSwing;
          rightLegGroup.rotation.x = -runSwing;
          leftLowerLegGroup.rotation.x = runSwing > 0 ? -0.4 : 0;
          rightLowerLegGroup.rotation.x = runSwing < 0 ? -0.4 : 0;
          playerGroup.rotation.y = deltaX > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          leftLegGroup.rotation.set(0, 0, 0);
          rightLegGroup.rotation.set(0, 0, 0);
          leftLowerLegGroup.rotation.set(0, 0, 0);
          rightLowerLegGroup.rotation.set(0, 0, 0);
          playerGroup.rotation.y = 0;
        }
      } else if (burgerEatAnimTimer > 0) {
        // --- POSE: 3-SECOND HAMBURGER EATING & SATISFACTION (COMER HAMBÚRGUER) ---
        hideAllProps();
        burgerEatAnimTimer -= delta;
        burgerProp.visible = true;

        const chewCycle = Math.sin(time * 12);
        // Both hands hold burger up to mouth
        leftArmGroup.rotation.set(0.95, 0, 0.45);
        leftLowerArmGroup.rotation.set(-1.65, 0.4, 0);
        rightArmGroup.rotation.set(0.95, 0, -0.45);
        rightLowerArmGroup.rotation.set(-1.65, -0.4, 0);

        // Head bites and nods with culinary joy
        headGroup.rotation.x = 0.12 + chewCycle * 0.08;
        burgerProp.position.set(0, 3.1 + chewCycle * 0.03, 0.65);

        // Small happy bounce
        playerGroup.position.y = Math.abs(Math.sin(time * 6)) * 0.08;

        if (isMoving && gameState === 'PLAYING') {
          playerGroup.rotation.y = deltaX > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          playerGroup.rotation.y = 0;
        }
      } else if (bookReadAnimTimer > 0) {
        // --- POSE: 3-SECOND MINDFUL BOOK READING (SIMULAR LEITURA) ---
        hideAllProps();
        bookReadAnimTimer -= delta;
        bookProp.visible = true;

        // Both hands hold open book at chest height
        leftArmGroup.rotation.set(0.78, 0, 0.32);
        leftLowerArmGroup.rotation.set(-1.35, 0.3, 0);
        rightArmGroup.rotation.set(0.78, 0, -0.32);
        rightLowerArmGroup.rotation.set(-1.35, -0.3, 0);

        // Head looks down and sweeps eyes left-to-right reading the pages
        headGroup.rotation.x = 0.38;
        headGroup.rotation.y = Math.sin(time * 3.0) * 0.16;

        bookProp.position.set(0, 2.5 + Math.sin(time * 1.5) * 0.03, 0.85);

        if (isMoving && gameState === 'PLAYING') {
          const runSwing = Math.sin(time * 14) * 0.85;
          leftLegGroup.rotation.x = runSwing;
          rightLegGroup.rotation.x = -runSwing;
          leftLowerLegGroup.rotation.x = runSwing > 0 ? -0.4 : 0;
          rightLowerLegGroup.rotation.x = runSwing < 0 ? -0.4 : 0;
          playerGroup.rotation.y = deltaX > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          leftLegGroup.rotation.set(0, 0, 0);
          rightLegGroup.rotation.set(0, 0, 0);
          leftLowerLegGroup.rotation.set(0, 0, 0);
          rightLowerLegGroup.rotation.set(0, 0, 0);
          playerGroup.rotation.y = 0;
        }
      } else if (hugAnimTimer > 0) {
        // --- POSE: JOYFUL BODY SHAKE, CROSSED ARMS & HAPPY SWAYING ANIMATION (ENCONTRO PRESENCIAL) ---
        hideAllProps();
        hugAnimTimer -= delta;
        friendHugGroup.visible = true;

        const swayCycle = Math.sin(time * 7.0);
        const shake = Math.sin(time * 32.0) * 0.06; // High-frequency energetic body shake / chacoalhar
        const bounce = Math.abs(Math.sin(time * 10.0)) * 0.28; // Bouncy happy hop

        // 1. Player Body Shake, Sway & Hop
        playerGroup.position.y = bounce;
        playerGroup.position.x += shake * 0.02;
        playerGroup.rotation.z = swayCycle * 0.24 + shake * 0.05;
        playerGroup.rotation.y = Math.sin(time * 4.5) * 0.15;
        torsoGroup.rotation.z = swayCycle * 0.1 + shake * 0.08;

        // 2. Player Crossed Arms over chest (cruzar os braços)
        leftArmGroup.rotation.set(0.95, 0.72, -0.72);
        leftLowerArmGroup.rotation.set(-1.65, 0.75, 0);
        rightArmGroup.rotation.set(0.95, -0.72, 0.72);
        rightLowerArmGroup.rotation.set(-1.65, -0.75, 0);

        // 3. Friend Avatar Mirroring Joyful Crossed Arms & Swaying
        friendHugGroup.position.set(0, bounce, 0.95);
        friendHugGroup.rotation.z = -swayCycle * 0.24 - shake * 0.05;
        friendHugGroup.rotation.y = Math.PI + Math.sin(time * 4.5) * 0.15;

        friendLeftArmGroup.rotation.set(0.95, 0.72, -0.72);
        friendRightArmGroup.rotation.set(0.95, -0.72, 0.72);

        // 4. Heads tilting and shaking happily
        headGroup.rotation.set(
          Math.sin(time * 14.0) * 0.15,
          swayCycle * 0.2,
          swayCycle * 0.15 + shake * 0.1
        );
        friendHead.rotation.set(
          Math.sin(time * 14.0) * 0.15,
          -swayCycle * 0.2,
          -swayCycle * 0.15 - shake * 0.1
        );

        // 5. Heart pulse aura ring expands
        const heartScale = 1.0 + Math.abs(Math.sin(time * 8.0)) * 0.45;
        friendHeartRing.scale.set(heartScale, heartScale, 1);
        friendHeartRingMat.opacity = 0.6 + Math.sin(time * 10.0) * 0.35;

        // 6. Legs dancing & swaying
        const legBounce = Math.sin(time * 10.0) * 0.2;
        leftLegGroup.rotation.set(legBounce, 0.1, -0.12);
        rightLegGroup.rotation.set(-legBounce, -0.1, 0.12);
        leftLowerLegGroup.rotation.set(-0.2, 0, 0);
        rightLowerLegGroup.rotation.set(-0.2, 0, 0);
      } else if (dogPetAnimTimer > 0) {
        // --- POSE: 3-SECOND PETTING THE DOG (CARINHO NA CABEÇA DO CACHORRO) ---
        hideAllProps();
        dogPetAnimTimer -= delta;
        dogProp.visible = true;

        const petCycle = Math.sin(time * 8.5); // Hand moving up and down to pet
        const tailWag = Math.sin(time * 28.0); // Wag tail furiously with happiness!

        // Avatar bends knees and leans forward slightly to reach the dog
        playerGroup.position.y = -0.15;
        torsoGroup.rotation.x = 0.22; // Lean forward
        headGroup.rotation.x = 0.38; // Look down at the dog

        // LEFT ARM: Comfortably resting on hip or balanced
        leftArmGroup.rotation.set(0.28, 0, 0.28);
        leftLowerArmGroup.rotation.set(-0.4, 0, 0);

        // RIGHT ARM: Reaches out and down towards the dog's head, petting it
        // The dog is positioned slightly forward on the right: (0.65, 0, 0.85)
        rightArmGroup.rotation.set(0.95 + petCycle * 0.12, -0.32, 0.15);
        rightLowerArmGroup.rotation.set(-1.15 - petCycle * 0.14, -0.18, 0);

        // Dog reacts:
        // 1. Wag tail furiously
        dpTail.rotation.y = tailWag * 0.65;
        // 2. Head tilts up happily to receive the pet
        dpHeadGroup.rotation.x = -0.22 + Math.abs(petCycle) * 0.18;
        dpHeadGroup.rotation.z = Math.sin(time * 5.0) * 0.1; // Tilts side-to-side joyfully
        // 3. Floppy ears bounce
        dpEarL.rotation.z = -0.15 - Math.abs(petCycle) * 0.15;
        dpEarR.rotation.z = 0.15 + Math.abs(petCycle) * 0.15;

        if (isMoving && gameState === 'PLAYING') {
          playerGroup.rotation.y = deltaX > 0 ? Math.PI / 2 : -Math.PI / 2;
        } else {
          playerGroup.rotation.y = 0;
        }
      } else if (gameState === 'MODO_ZEN' || gameState === 'VITORIA') {
        // --- POSE: MODO ZEN LOTUS POSE ---
        hideAllProps();

        playerGroup.position.y = 0.5 + Math.sin(time * 2.5) * 0.15;
        playerGroup.rotation.y = 0;

        leftLegGroup.rotation.x = 1.35;
        leftLegGroup.rotation.y = 0.7;
        leftLegGroup.rotation.z = -0.4;
        leftLowerLegGroup.rotation.x = -1.2;

        rightLegGroup.rotation.x = 1.35;
        rightLegGroup.rotation.y = -0.7;
        rightLegGroup.rotation.z = 0.4;
        rightLowerLegGroup.rotation.x = -1.2;

        leftArmGroup.rotation.x = 0.6;
        leftArmGroup.rotation.z = -0.5;
        rightArmGroup.rotation.x = 0.6;
        rightArmGroup.rotation.z = 0.5;

        zenPillarMat.opacity = 0.35 + Math.sin(time * 4) * 0.15;
        zenPillar.rotation.y += delta * 0.5;
      } else if (isMoving && gameState === 'PLAYING') {
        // --- POSE: FLUID RUNNING ANIMATION ---
        hideAllProps();

        playerGroup.position.y = Math.abs(Math.sin(time * 14)) * 0.25;
        playerGroup.rotation.y = deltaX > 0 ? Math.PI / 2 : -Math.PI / 2;

        const runSwing = Math.sin(time * 14) * 0.85;

        leftLegGroup.rotation.x = runSwing;
        rightLegGroup.rotation.x = -runSwing;
        leftLowerLegGroup.rotation.x = runSwing > 0 ? -0.4 : 0;
        rightLowerLegGroup.rotation.x = runSwing < 0 ? -0.4 : 0;

        leftArmGroup.rotation.x = -runSwing;
        leftArmGroup.rotation.z = 0;
        rightArmGroup.rotation.x = runSwing;
        rightArmGroup.rotation.z = 0;
      } else {
        // --- POSE: IDLE STANDING POSE ---
        hideAllProps();

        playerGroup.position.y = 0;
        playerGroup.rotation.y = 0;

        leftLegGroup.rotation.set(0, 0, 0);
        rightLegGroup.rotation.set(0, 0, 0);
        leftLowerLegGroup.rotation.set(0, 0, 0);
        rightLowerLegGroup.rotation.set(0, 0, 0);

        leftArmGroup.rotation.x = Math.sin(time * 2) * 0.08;
        leftArmGroup.rotation.z = 0;
        rightArmGroup.rotation.x = -Math.sin(time * 2) * 0.08;
        rightArmGroup.rotation.z = 0;
      }

      // Protective Umbrella visibility sync
      if (umbrellaGroup) {
        umbrellaGroup.visible = !!umbrellaActiveRef.current;
      }

      // Outdoor Translucent Shield Sphere visibility & rotation sync
      if (outdoorShieldMesh) {
        outdoorShieldMesh.visible = !!outdoorShieldActiveRef.current;
        outdoorShieldRingMesh.visible = !!outdoorShieldActiveRef.current;
        if (outdoorShieldActiveRef.current) {
          outdoorShieldMesh.rotation.y += delta * 1.5;
          outdoorShieldRingMesh.rotation.y -= delta * 1.2;
          outdoorShieldRingMesh.rotation.x += delta * 0.8;
        }
      }

      // Lighting & State Effects
      if (gameState === 'MODO_ZEN') {
        scene.background = new THREE.Color(0x063970);
        scene.fog = new THREE.FogExp2(0x063970, 0.01);
        ambientLight.color.setHex(0xe0f2fe);
        ambientLight.intensity = 1.2;
      } else if (gameState === 'DERROTA') {
        scene.background = new THREE.Color(0x450a0a);
        scene.fog = new THREE.FogExp2(0x450a0a, 0.03);
        ambientLight.color.setHex(0xef4444);
        ambientLight.intensity = 0.8;
      } else {
        scene.background = new THREE.Color(0x0c0f1d);
        scene.fog = new THREE.FogExp2(0x0c0f1d, 0.015);
        ambientLight.color.setHex(0xffffff);
        ambientLight.intensity = 0.65;
      }

      // --- SPAWNING SYSTEM ---
      if (gameState === 'PLAYING' || gameState === 'MODO_ZEN') {
        // Time Progression: difficulty ramps up smoothly as gameTimer counts up
        const timeElapsed = Math.max(0, gameTimerRef.current);
        const difficultyScale = Math.min(3.2, 1 + (timeElapsed / 35)); // 1.0x at start -> 3.2x max cap

        // 1. Spawning Harmful Items Falling From Above (Increased quantity by 70% and progressive spawn rate)
        spawnTimerFalling += delta;
        const currentSpeed = notificationSpeedRef.current;
        const currentInterval = Math.max(0.015, (0.059 / currentSpeed) / difficultyScale);

        if (spawnTimerFalling >= currentInterval) {
          spawnTimerFalling = 0;
          const harmfulTypes: FallingItem['type'][] = [
            'Feed', 'Like', 'Wifi', 'Smartphone', 'Geometric', 
            'CardNotificacao', 'CardNotifPendente', 'CardFeed',
            'WhatsApp', 'YouTube', 'Facebook'
          ];
          const chosenHarmful = harmfulTypes[Math.floor(Math.random() * harmfulTypes.length)];
          
          // Spawn items dynamically within active player navigation range on the expanded street [-170, 170]
          const pX = playerGroup.position.x;
          const randomX = Math.max(-170, Math.min(170, pX + (Math.random() - 0.5) * 60));

          // Ensure no overlap with any other active falling item that is currently high up in that vertical strip
          let hasOverlap = false;
          const minOverlapDistanceX = 6.8;
          for (const item of itemsRef.current) {
            if (!item.isGroundItem && item.position[1] > 8.0) {
              if (Math.abs(item.position[0] - randomX) < minOverlapDistanceX) {
                hasOverlap = true;
                break;
              }
            }
          }

          if (!hasOverlap) {
            // Falling speed speeds up as time passes
            const fallSpeed = (12 + Math.random() * 9) * currentSpeed * difficultyScale;

            const newItem: FallingItem = {
              id: Math.random().toString(36).substring(2, 9),
              type: chosenHarmful,
              position: [randomX, 30, 0],
              speed: fallSpeed,
              rotation: [Math.random(), Math.random(), Math.random()],
              color: '#ff4444',
              isGroundItem: false,
            };

            itemsRef.current.push(newItem);

            const mesh = getPooled3DItemMesh(chosenHarmful);
            // Normal standard size (100% scale) for all falling notifications and stimuli
            mesh.scale.set(1.0, 1.0, 1.0);
            mesh.position.set(randomX, 30, 0);
            scene.add(mesh);
            active3DObjectsRef.current.set(newItem.id, mesh);
          } else {
            // Retry very shortly to keep item flow consistent but non-overlapping
            spawnTimerFalling = currentInterval * 0.4;
          }
        }

        // 2. Spawning Beneficial Wellness Items ON THE GROUND PATH
        if (gameState === 'PLAYING') {
          spawnTimerGround += delta;
          if (spawnTimerGround >= 2.2) {
            spawnTimerGround = 0;
            const wellnessTypes: FallingItem['type'][] = [
              'Bola de Futebol',
              'Encontro Presencial',
              'Exercício Físico',
              'Atividade ao Ar Livre',
              'Desconexão',
              'Coffee',
              'Book',
              'Hamburguer',
              'Violão',
              'Cachorro',
            ];
            const chosenWellness = wellnessTypes[Math.floor(Math.random() * wellnessTypes.length)];
            const pX = playerGroup.position.x;
            const pathX = Math.max(-170, Math.min(170, pX + (Math.random() - 0.5) * 48));

            const groundItem: FallingItem = {
              id: Math.random().toString(36).substring(2, 9),
              type: chosenWellness,
              position: [pathX, 1.2, 0],
              speed: 0,
              rotation: [0, 0, 0],
              color: '#10b981',
              isGroundItem: true,
              lifetime: 6.0,
              maxLifetime: 6.0,
            };

            itemsRef.current.push(groundItem);

            const itemGroup = getPooled3DItemMesh(chosenWellness);
            
            // Ensure Glowing Ground Ring Beacon exists
            let ring = itemGroup.getObjectByName('beaconRing') as THREE.Mesh;
            if (!ring) {
              const ringGeo = new THREE.RingGeometry(1.2, 1.6, 24);
              const ringMat = new THREE.MeshBasicMaterial({
                color: chosenWellness === 'Desconexão' || chosenWellness === 'Violão' ? 0x06b6d4 : chosenWellness === 'Hamburguer' ? 0xf59e0b : 0x22c55e,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
              });
              ring = new THREE.Mesh(ringGeo, ringMat);
              ring.rotation.x = -Math.PI / 2;
              ring.position.y = -1.15;
              ring.name = 'beaconRing';
              itemGroup.add(ring);
            }

            itemGroup.position.set(pathX, 1.2, 0);
            scene.add(itemGroup);
            active3DObjectsRef.current.set(groundItem.id, itemGroup);
          }
        }
      }

      // Clear Items in Game Over
      if (gameState === 'DERROTA' || gameState === 'VITORIA') {
        itemsRef.current.forEach((item) => {
          const obj = active3DObjectsRef.current.get(item.id);
          if (obj) {
            recyclePooled3DItemMesh(item.type, obj);
          }
        });
        itemsRef.current = [];
        active3DObjectsRef.current.clear();
      }

      // Update Item Positions, Lifetime and Collision Detection
      if (gameState === 'PLAYING' || gameState === 'MODO_ZEN' || gameState === 'PAUSED_SAS') {
        const pX = playerGroup.position.x;
        const pY = 1.8;

        for (let i = itemsRef.current.length - 1; i >= 0; i--) {
          const item = itemsRef.current[i];
          const meshGroup = active3DObjectsRef.current.get(item.id);

          if (!meshGroup) continue;

          if (item.isGroundItem) {
            // --- GROUND WELLNESS ITEM ---
            item.lifetime = (item.lifetime || 6.0) - delta;

            meshGroup.position.y = 1.2 + Math.sin(time * 5) * 0.25;
            meshGroup.rotation.y += delta * 1.5;

            const beaconRing = meshGroup.getObjectByName('beaconRing') as THREE.Mesh;
            if (beaconRing) {
              const ratio = Math.max(0, item.lifetime / (item.maxLifetime || 6.0));
              beaconRing.scale.set(ratio * 1.2, ratio * 1.2, 1);
            }

            const distX = Math.abs(item.position[0] - pX);
            if (distX < 2.2) {
              if (item.type === 'CardNotificacao') {
                createExplosion(item.position[0], item.position[1], item.position[2]);
              }
              onItemCollect(item.type);
              if (item.type === 'Exercício Físico') {
                exerciseAnimTimer = 3.0; // 3 seconds of bicep curls
              } else if (item.type === 'Bola de Futebol') {
                soccerAnimTimer = 3.0; // 3 seconds of embaixadinhas (keepie-uppies)
              } else if (item.type === 'Coffee') {
                coffeeDrinkAnimTimer = 3.0; // 3 seconds of drinking coffee
              } else if (item.type === 'Hamburguer') {
                burgerEatAnimTimer = 3.0; // 3 seconds of eating burger
              } else if (item.type === 'Book') {
                bookReadAnimTimer = 3.0; // 3 seconds of reading book
              } else if (item.type === 'Violão') {
                guitarAnimTimer = 3.5; // 3.5 seconds of playing acoustic guitar
              } else if (item.type === 'Encontro Presencial') {
                hugAnimTimer = 3.0; // 3 seconds of warm friendship hug animation
              } else if (item.type === 'Cachorro') {
                dogPetAnimTimer = 3.0; // 3 seconds of petting the dog
              }
              recyclePooled3DItemMesh(item.type, meshGroup);
              active3DObjectsRef.current.delete(item.id);
              itemsRef.current.splice(i, 1);
            } else if (item.lifetime <= 0) {
              recyclePooled3DItemMesh(item.type, meshGroup);
              active3DObjectsRef.current.delete(item.id);
              itemsRef.current.splice(i, 1);
            }
          } else {
            // --- FALLING HARMFUL ITEM ---
            item.position[1] -= item.speed * delta;
            meshGroup.position.y = item.position[1];
            meshGroup.rotation.x += delta * 2;
            meshGroup.rotation.y += delta * 2;

            const dx = item.position[0] - pX;
            const dy = item.position[1] - pY;
            const distSq = dx * dx + dy * dy;

            if (distSq < 3.4225) { // 1.85^2 = 3.4225
              if (item.type === 'CardNotificacao' || item.type === 'CardNotifPendente' || item.type === 'CardFeed') {
                createExplosion(item.position[0], item.position[1], item.position[2]);
              }
              if (umbrellaActiveRef.current || outdoorShieldActiveRef.current) {
                // Completely protected by Umbrella or Outdoor Translucent Shield Sphere!
                const isHarmful = item.type === 'CardNotificacao' || item.type === 'CardNotifPendente' || item.type === 'CardFeed' ||
                                  item.type === 'Feed' || item.type === 'Like' || item.type === 'Wifi' || item.type === 'Smartphone' || item.type === 'Geometric';
                if (!isHarmful) {
                  onItemCollect(item.type);
                  if (item.type === 'Encontro Presencial') hugAnimTimer = 3.0;
                } else {
                  createExplosion(item.position[0], item.position[1], item.position[2]);
                }
              } else if (gameState === 'MODO_ZEN') {
                // Protected by green shield!
              } else {
                damageFlashTimer = 0.4;
                onItemCollect(item.type);
                if (item.type === 'Encontro Presencial') hugAnimTimer = 3.0;
              }
              recyclePooled3DItemMesh(item.type, meshGroup);
              active3DObjectsRef.current.delete(item.id);
              itemsRef.current.splice(i, 1);
            } else if (item.position[1] < -2) {
              recyclePooled3DItemMesh(item.type, meshGroup);
              active3DObjectsRef.current.delete(item.id);
              itemsRef.current.splice(i, 1);
            }
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler with ResizeObserver
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w > 0 && h > 0) {
        adjustCameraFOV(camera, w, h);
        renderer.setSize(w, h);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      
      // Clear active particle pool on unmount
      particlePool.forEach((p) => {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (Array.isArray(p.mesh.material)) {
          p.mesh.material.forEach((m) => m.dispose());
        } else {
          p.mesh.material.dispose();
        }
      });
      particlePool.length = 0;

      // Clear flyover creatures on unmount
      flyoverCreatures.forEach((fc) => {
        scene.remove(fc.group);
        fc.group.traverse((child) => {
          if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
        });
      });
      flyoverCreatures.length = 0;
    };
  }, [gameState]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-slate-950 rounded-2xl border border-slate-800/60 shadow-2xl"
    />
  );
};

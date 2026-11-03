import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GameState, FallingItem, GameSettings, DEFAULT_GAME_SETTINGS, PlayerSkills, CharacterId } from '../types';
import { playFishingCatchSFX, playFishingSplashSFX, playHorsePettingSFX, playPigeonFeedingSFX, playSoccerKickSFX, playSoccerGoalSFX, playDogBarkSFX, playCollectWellnessSFX, updateWeatherAmbient, stopWeatherAmbient } from '../utils/audio';

interface ThreeCanvasProps {
  gameState: GameState;
  gameTimer?: number;
  anxietyLevel: number;
  notificationSpeed: number;
  onItemCollect: (itemType: FallingItem['type']) => void;
  playerPosRef: React.MutableRefObject<number>;
  keysDownRef?: React.MutableRefObject<{ left: boolean; right: boolean; jump: boolean; crouch: boolean; up?: boolean; down?: boolean }>;
  umbrellaActive?: boolean;
  outdoorShieldActive?: boolean;
  jumpActiveRef?: React.MutableRefObject<boolean>;
  crouchActiveRef?: React.MutableRefObject<boolean>;
  avatarRespawnFlash?: boolean;
  gameSettings?: GameSettings;
  medicineSideEffectsActive?: boolean;
  showMedicinePurchaseModal?: boolean;
  graceTimer?: number | null;
  goldCoinsCount?: number;
  playerSkills?: PlayerSkills;
  selectedCharacter?: CharacterId;
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

// --- Module-Level Reusable Math Objects to Prevent GC Allocation Stutter ---
const _tempVec3_1 = new THREE.Vector3();
const _tempVec3_2 = new THREE.Vector3();
const _tempQuat_1 = new THREE.Quaternion();
const _tempBox_1 = new THREE.Box3();
const _tempColor_1 = new THREE.Color();

const neonTextCache = new Map<string, THREE.CanvasTexture>();
function getCachedNeonTextTexture(text: string, color: string, bgColor: string = 'rgba(0,0,0,0.8)'): THREE.CanvasTexture {
  const cacheKey = `${text}_${color}_${bgColor}`;
  let tex = neonTextCache.get(cacheKey);
  if (!tex) {
    tex = createNeonTextTexture(text, color, bgColor);
    neonTextCache.set(cacheKey, tex);
  }
  return tex;
}

function createNeonTextTexture(text: string, color: string, bgColor: string = 'rgba(0,0,0,0.8)'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  if (bgColor === 'transparent') {
    ctx.clearRect(0, 0, 512, 256);
  } else {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 512, 256);
  }
  
  // Neon glow effect
  ctx.shadowColor = color;
  ctx.shadowBlur = 25;
  ctx.fillStyle = color;
  ctx.font = 'bold 80px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.fillText(text, 256, 128);
  ctx.fillText(text, 256, 128); // double draw for extra brightness
  
  // Outer border if not transparent
  if (bgColor !== 'transparent') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 492, 236);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Dynamic Canvas procedural texture for Animated R15 Face reacting to Anxiety Levels
function createR15FaceTexture(anxietyLevel: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Clear skin tone base to keep background transparent,
  // allowing the 3D-shaded head mesh underneath to show through.
  ctx.clearRect(0, 0, 256, 256);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const darkColor = '#0f172a'; // High-contrast slate-900

  if (anxietyLevel < 35) {
    // --- LOW ANXIETY (0-34%): RELAXED / SERENE FOCUS ---
    // Eyes Background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(80, 115, 20, 15, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(176, 115, 20, 15, 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Eyes Outlines (Sharp and high-contrast)
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(80, 115, 20, 15, -0.05, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(176, 115, 20, 15, 0.05, 0, Math.PI * 2);
    ctx.stroke();

    // Pupils
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.arc(82, 115, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(174, 115, 8, 0, Math.PI * 2);
    ctx.fill();

    // Highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(79, 112, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(171, 112, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Brows
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(56, 90);
    ctx.quadraticCurveTo(80, 82, 104, 90);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(152, 90);
    ctx.quadraticCurveTo(176, 82, 200, 90);
    ctx.stroke();

    // Cute Nose
    ctx.strokeStyle = '#854d0e'; // Warm dark amber-brown
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(122, 136);
    ctx.quadraticCurveTo(128, 142, 134, 136);
    ctx.stroke();

    // Mouth (Friendly curved smile)
    ctx.strokeStyle = '#9f1239'; // High-contrast deep rose
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(105, 172);
    ctx.quadraticCurveTo(128, 184, 151, 172);
    ctx.stroke();
  } else if (anxietyLevel < 70) {
    // --- MEDIUM ANXIETY (35-69%): FOCUSED / ALERT ---
    // Eyes Background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(80, 115, 20, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(176, 115, 20, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes Outlines
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(80, 115, 20, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(176, 115, 20, 18, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Pupils
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.arc(80, 115, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(176, 115, 10, 0, Math.PI * 2);
    ctx.fill();

    // Highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(77, 111, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(173, 111, 4, 0, Math.PI * 2);
    ctx.fill();

    // Brows
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(56, 94);
    ctx.lineTo(104, 98);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(152, 98);
    ctx.lineTo(200, 94);
    ctx.stroke();

    // Cute Nose
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(122, 136);
    ctx.quadraticCurveTo(128, 142, 134, 136);
    ctx.stroke();

    // Mouth (Straight tense line)
    ctx.strokeStyle = '#9f1239';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(105, 172);
    ctx.lineTo(151, 172);
    ctx.stroke();

    // Glitch
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(205, 110, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // --- HIGH ANXIETY (70-100%): TENSE / OVERWHELMED ---
    // Eyes Background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(80, 115, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(176, 115, 18, 0, Math.PI * 2);
    ctx.fill();

    // Eyes Outlines
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(80, 115, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(176, 115, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Pupils
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.arc(80, 115, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(176, 115, 12, 0, Math.PI * 2);
    ctx.fill();

    // Highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(77, 110, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(173, 110, 4, 0, Math.PI * 2);
    ctx.fill();

    // Brows
    ctx.strokeStyle = '#4c0519';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(56, 98);
    ctx.lineTo(104, 88);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(152, 88);
    ctx.lineTo(200, 98);
    ctx.stroke();

    // Cute Nose
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(122, 136);
    ctx.quadraticCurveTo(128, 142, 134, 136);
    ctx.stroke();

    // Mouth (Tense wavy line)
    ctx.strokeStyle = '#9f1239';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(105, 178);
    ctx.quadraticCurveTo(116, 168, 128, 178);
    ctx.quadraticCurveTo(140, 188, 151, 178);
    ctx.stroke();

    // Glitch
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(210, 105, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(46, 110, 6, 0, Math.PI * 2);
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

// Procedural Red Brick Wall Texture
function createBrickWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Red Brick Base
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(0, 0, 512, 512);

  // Mortar Lines
  ctx.strokeStyle = '#d6d3d1';
  ctx.lineWidth = 15;
  ctx.beginPath();
  for (let i = 0; i <= 512; i += 128) {
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
  }
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.needsUpdate = true;
  return texture;
}

// Procedural Plaster Cast Texture for Léo (Gesso com Assinaturas e Desenhos)
function createArmCastTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  for (let i = 0; i < 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 40, 256);
    ctx.stroke();
  }

  ctx.font = 'bold 36px cursive, sans-serif';
  ctx.fillStyle = '#16a34a';
  ctx.fillText('PESQUISA', 30, 80);

  ctx.fillStyle = '#2563eb';
  ctx.fillText('AUTOCUIDADO', 180, 150);

  ctx.fillStyle = '#ef4444';
  ctx.font = '32px sans-serif';
  ctx.fillText('❤️', 400, 70);
  ctx.fillText('❤️', 110, 200);

  ctx.fillStyle = '#eab308';
  ctx.fillText('★', 320, 210);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Procedural Guto Sweatshirt Chest Logo
function createGutoSweatshirtTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f2b5c';
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PESQUISADORES', 256, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Procedural Léo White T-Shirt
function createLeoShirtTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 38px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PESQUISADORES', 256, 100);

  ctx.fillStyle = '#eab308';
  ctx.fillRect(60, 170, 392, 12);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(60, 188, 392, 12);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Procedural High-Resolution Realistic Human Skin Pore Bump Texture
function createRealisticSkinTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Smooth warm skin base gradient
  const grad = ctx.createRadialGradient(512, 512, 10, 512, 512, 600);
  grad.addColorStop(0, '#fdf2e9'); // Realistic light skin tone
  grad.addColorStop(1, '#ffd8be');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  // Microscopic human skin pores noise (high-fidelity pattern)
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8; // realistic pore bump noise
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
    data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8); // Repeated for micro-pores scale
  texture.needsUpdate = true;
  return texture;
}

// Module-level cached singletons for procedural textures to prevent canvas churn and CPU memory leaks
const faceTextureCache = new Map<number, THREE.CanvasTexture>();
function getCachedR15FaceTexture(anxietyLevel: number): THREE.CanvasTexture {
  const bucket = anxietyLevel < 35 ? 10 : anxietyLevel < 70 ? 50 : 85;
  let tex = faceTextureCache.get(bucket);
  if (!tex) {
    tex = createR15FaceTexture(bucket);
    faceTextureCache.set(bucket, tex);
  }
  return tex;
}

let cachedSoccerBallTexture: THREE.CanvasTexture | null = null;
function getCachedSoccerBallTexture(): THREE.CanvasTexture {
  if (!cachedSoccerBallTexture) {
    cachedSoccerBallTexture = createRealisticSoccerBallTexture();
  }
  return cachedSoccerBallTexture;
}

let cachedBrickWallTexture: THREE.CanvasTexture | null = null;
function getCachedBrickWallTexture(): THREE.CanvasTexture {
  if (!cachedBrickWallTexture) {
    cachedBrickWallTexture = createBrickWallTexture();
  }
  return cachedBrickWallTexture;
}

// Procedural High-Fidelity WhatsApp Logo Texture with Speech Bubble & Phone Handset
function createWhatsAppLogoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 236;
  const radius = 188;

  // Outer glow
  ctx.save();
  ctx.shadowColor = 'rgba(37, 211, 102, 0.8)';
  ctx.shadowBlur = 32;

  // Speech bubble path with bottom-left pointer tail
  ctx.beginPath();
  ctx.arc(cx, cy, radius, THREE.MathUtils.degToRad(140), THREE.MathUtils.degToRad(75), false);
  ctx.lineTo(135, 435);
  ctx.closePath();

  const grad = ctx.createLinearGradient(120, 60, 400, 420);
  grad.addColorStop(0, '#2fe674');
  grad.addColorStop(0.45, '#25d366');
  grad.addColorStop(1, '#128c7e');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // White clean border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = 14;
  ctx.stroke();

  // Subtle glossy surface reflection
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx - 20, cy - 20, radius - 24, 0, Math.PI * 2);
  const innerGrad = ctx.createRadialGradient(cx - 50, cy - 50, 10, cx - 20, cy - 20, radius - 20);
  innerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  innerGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0.05)');
  innerGrad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
  ctx.fillStyle = innerGrad;
  ctx.fill();
  ctx.restore();

  // White telephone handset icon
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 16);

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;

  ctx.beginPath();
  ctx.moveTo(35, -95);
  ctx.bezierCurveTo(75, -80, 95, -45, 90, -10);
  ctx.bezierCurveTo(85, 25, 65, 60, 30, 90);
  ctx.bezierCurveTo(0, 115, -45, 120, -80, 100);
  ctx.bezierCurveTo(-105, 85, -115, 60, -95, 35);
  ctx.bezierCurveTo(-80, 15, -60, 20, -45, 35);
  ctx.bezierCurveTo(-35, 45, -20, 35, -5, 20);
  ctx.bezierCurveTo(15, 0, 25, -15, 15, -30);
  ctx.bezierCurveTo(5, -45, 0, -60, 15, -80);
  ctx.bezierCurveTo(25, -95, 40, -100, 35, -95);
  ctx.closePath();
  ctx.fill();

  // Subtle speaker holes
  ctx.fillStyle = 'rgba(18, 140, 126, 0.6)';
  ctx.beginPath();
  ctx.arc(58, -48, 4, 0, Math.PI * 2);
  ctx.arc(68, -34, 4, 0, Math.PI * 2);
  ctx.arc(-78, 64, 4, 0, Math.PI * 2);
  ctx.arc(-64, 78, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

let cachedWhatsAppTexture: THREE.CanvasTexture | null = null;
function getCachedWhatsAppTexture(): THREE.CanvasTexture {
  if (!cachedWhatsAppTexture) {
    cachedWhatsAppTexture = createWhatsAppLogoTexture();
  }
  return cachedWhatsAppTexture;
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
  keysDownRef,
  umbrellaActive = false,
  outdoorShieldActive = false,
  jumpActiveRef,
  crouchActiveRef,
  avatarRespawnFlash = false,
  gameSettings = DEFAULT_GAME_SETTINGS,
  medicineSideEffectsActive = false,
  showMedicinePurchaseModal = false,
  graceTimer = null,
  goldCoinsCount = 0,
  playerSkills,
  selectedCharacter = 'guto',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<FallingItem[]>([]);
  const active3DObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const respawnFlashRef = useRef<boolean>(false);
  const hitObstacleIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    respawnFlashRef.current = !!avatarRespawnFlash;
  }, [avatarRespawnFlash]);
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
  const settingsRef = useRef(gameSettings);
  settingsRef.current = gameSettings;
  const medicineSideEffectsActiveRef = useRef(medicineSideEffectsActive);
  medicineSideEffectsActiveRef.current = medicineSideEffectsActive;
  const showMedicinePurchaseModalRef = useRef(showMedicinePurchaseModal);
  showMedicinePurchaseModalRef.current = showMedicinePurchaseModal;
  const graceTimerRef = useRef(graceTimer);
  graceTimerRef.current = graceTimer;
  const goldCoinsCountRef = useRef(goldCoinsCount);
  goldCoinsCountRef.current = goldCoinsCount;
  const playerSkillsRef = useRef(playerSkills);
  playerSkillsRef.current = playerSkills;
  const lastRemedioSpawnTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x60a5fa); // Initial Day Color
    scene.fog = new THREE.FogExp2(0x60a5fa, 0.007);

    const initialCamX = playerPosRef.current;

    // --- Camera (Roblox 2.5D Perspective with Responsive FOV) ---
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(initialCamX, 14.4, 22);
    camera.lookAt(initialCamX, 9.4, 0);

    // Responsive FOV adjustment to ensure playing area is always fully visible on portrait or narrow screens
    const adjustCameraFOV = (cam: THREE.PerspectiveCamera, w: number, h: number) => {
      const aspect = w / h;
      cam.aspect = aspect;
      if (aspect < 1.7) {
        const targetWidth = 48; // Safe platform boundary width
        const distance = 22.4;  // Approximate camera distance to z=0 plane
        const requiredFovRad = 2 * Math.atan(targetWidth / (2 * distance * aspect));
        const requiredFovDeg = requiredFovRad * (180 / Math.PI);
        cam.fov = Math.max(50, Math.min(85, requiredFovDeg));
      } else {
        cam.fov = 50;
      }
      cam.updateProjectionMatrix();
    };

    adjustCameraFOV(camera, width, height);

    // --- Performance Preset & Adaptive Renderer Setup ---
    const preset = settingsRef.current.graphicsPreset || 'equilibrado';
    const isDesempenho = preset === 'desempenho' || settingsRef.current.enableShadows === false;
    const isUltra = preset === 'ultra';

    const userResScale = settingsRef.current.resolutionScale ?? (isDesempenho ? 0.75 : isUltra ? 1.25 : 1.0);
    const targetPixelRatio = Math.min(window.devicePixelRatio * userResScale, isUltra ? 2.0 : isDesempenho ? 1.0 : 1.25);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isDesempenho,
      alpha: false,
      powerPreference: isDesempenho ? 'low-power' : 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(targetPixelRatio);
    renderer.shadowMap.enabled = settingsRef.current.enableShadows !== false && !isDesempenho;
    renderer.shadowMap.type = isUltra ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;

    containerRef.current.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, isDesempenho ? 0.85 : 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(initialCamX + 15, 30, 20);
    dirLight.castShadow = settingsRef.current.enableShadows !== false && !isDesempenho;
    dirLight.shadow.mapSize.width = isUltra ? 1024 : 512;
    dirLight.shadow.mapSize.height = isUltra ? 1024 : 512;
    scene.add(dirLight);
    scene.add(dirLight.target);

    // Neon Accent Lights
    const cyanLight = new THREE.PointLight(0x00f3ff, 2.5, 35);
    cyanLight.position.set(initialCamX - 22, 15, 5);
    scene.add(cyanLight);

    const magentaLight = new THREE.PointLight(0xff007f, 2.5, 35);
    magentaLight.position.set(initialCamX + 22, 15, 5);
    scene.add(magentaLight);

    // --- PROCEDURAL TEXTURED FIELD GRASS TEXTURE GENERATOR ---
    const createFieldGrassTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Base lush pasture green
      ctx.fillStyle = '#1b5e20';
      ctx.fillRect(0, 0, 512, 512);

      // Intercalated shades of green for countryside field appearance
      const fieldPalette = [
        '#15803d', // vibrant emerald
        '#16a34a', // lush meadow green
        '#22c55e', // fresh spring green
        '#14532d', // deep forest green
        '#166534', // rich pasture green
        '#4d7c0f', // golden olive field
        '#65a30d', // sunlit farm lawn
        '#2e7d32', // botanical green
        '#365314', // deep earthy moss
        '#84cc16', // bright chartreuse pasture highlight
      ];

      // Draw broad agricultural field parcels and crop rows
      for (let y = 0; y < 512; y += 32) {
        for (let x = 0; x < 512; x += 64) {
          const shadeIndex = Math.floor((Math.sin(x * 0.04) + Math.cos(y * 0.06) + 2) * 2.5) % fieldPalette.length;
          ctx.fillStyle = fieldPalette[shadeIndex];
          ctx.fillRect(x, y, 64, 32);
        }
      }

      // Organic textural noise and micro grass blade stippling
      for (let i = 0; i < 18000; i++) {
        const rx = Math.random() * 512;
        const ry = Math.random() * 512;
        const shade = fieldPalette[Math.floor(Math.random() * fieldPalette.length)];
        ctx.fillStyle = shade;
        ctx.globalAlpha = 0.35 + Math.random() * 0.45;
        const w = 1 + Math.random() * 2.5;
        const h = 2 + Math.random() * 4.5;
        ctx.fillRect(rx, ry, w, h);
      }
      ctx.globalAlpha = 1.0;

      // Gentle agricultural furrow grid lines for authentic countryside aesthetic
      ctx.strokeStyle = 'rgba(20, 83, 45, 0.22)';
      ctx.lineWidth = 1.5;
      for (let y = 0; y <= 512; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }
      for (let x = 0; x <= 512; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(40, 10);
      texture.anisotropy = 4;
      return texture;
    };

    const fieldGrassTexture = createFieldGrassTexture();

    // --- EXPANSIVE TEXTURED FIELD / LAWN COVERING ENTIRE HORIZON & FENCE AREA ---
    // 1. Back Meadow/Field stretching from back fence (z = -12) all the way into deep horizon (z = -200)
    const grassBackGeo = new THREE.PlaneGeometry(680, 190);
    const grassBackMat = new THREE.MeshStandardMaterial({
      map: fieldGrassTexture,
      color: 0xffffff,
      roughness: 0.90,
      metalness: 0.05,
    });
    const grassBack = new THREE.Mesh(grassBackGeo, grassBackMat);
    grassBack.rotation.x = -Math.PI / 2;
    grassBack.position.set(0, -0.02, -105); // covers z = -10 to z = -200
    grassBack.receiveShadow = true;
    scene.add(grassBack);

    // 2. Front Meadow stretching in front of the front fence (z = 12 to z = 42)
    const grassFrontGeo = new THREE.PlaneGeometry(680, 30);
    const grassFrontMat = new THREE.MeshStandardMaterial({
      map: fieldGrassTexture,
      color: 0xffffff,
      roughness: 0.90,
      metalness: 0.05,
    });
    const grassFront = new THREE.Mesh(grassFrontGeo, grassFrontMat);
    grassFront.rotation.x = -Math.PI / 2;
    grassFront.position.set(0, -0.02, 27); // covers z = 12 to z = 42
    grassFront.receiveShadow = true;
    scene.add(grassFront);

    // --- Intercalated Multi-Tone Countryside Field Swathes & Rolling Mounds ---
    const fieldBandsGroup = new THREE.Group();
    const fieldMatPalette = [
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 }), // Emerald
      new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 }), // Rich Clover
      new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.85 }), // Golden Olive
      new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.85 }), // Spring Green
      new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.85 }), // Deep Forest Green
      new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.85 }), // Sunlit Lawn
    ];

    const parcelGeo = new THREE.PlaneGeometry(36, 22);
    const moundGeo = new THREE.SphereGeometry(8, 8, 6);

    // Place intercalated agricultural field patches and rolling pasture mounds across the horizon (strictly outside interactive park zones)
    for (let x = -280; x <= 280; x += 35) {
      for (let z = -25; z >= -115; z -= 24) {
        // Strict boundary filters to prevent ANY terrain patch from overlapping the soccer field, house or other park zones
        const isSoccerZone = (x >= 48 && x <= 128) && (z >= -72 && z <= -18);
        const isLakeZone = (x >= -62 && x <= -14) && (z >= -48 && z <= -14);
        const isHorseZone = (x >= 4 && x <= 44) && (z >= -40 && z <= -14);
        const isPigeonZone = (x >= 40 && x <= 64) && (z >= -34 && z <= -14);
        const isHouseZone = (x >= -78 && x <= -34) && (z >= -46 && z <= -12);

        if (isSoccerZone || isLakeZone || isHorseZone || isPigeonZone || isHouseZone) {
          continue;
        }

        const matIndex = Math.abs(Math.floor((x * 7 + z * 3) / 11)) % fieldMatPalette.length;
        const parcelMesh = new THREE.Mesh(parcelGeo, fieldMatPalette[matIndex]);
        parcelMesh.rotation.x = -Math.PI / 2;
        parcelMesh.position.set(x + (Math.sin(z) * 4), -0.01, z);
        parcelMesh.receiveShadow = true;
        fieldBandsGroup.add(parcelMesh);
      }

      // Add gentle rolling pastoral hills/mounds exclusively in the deep horizon (Z <= -100)
      const moundZ = -105 + (Math.sin(x * 0.1) * 14);
      const hillMatIndex = (Math.abs(x) % fieldMatPalette.length);
      const moundMesh = new THREE.Mesh(moundGeo, fieldMatPalette[hillMatIndex]);
      moundMesh.scale.set(3.2, 0.28, 2.0);
      moundMesh.position.set(x + 10, -0.4, moundZ);
      moundMesh.receiveShadow = true;
      fieldBandsGroup.add(moundMesh);
    }
    scene.add(fieldBandsGroup);

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

    const streetLampsList: { bulbMat: THREE.MeshStandardMaterial; coneMesh: THREE.Mesh }[] = [];
    const soccerFloodlightsList: { bulbMat: THREE.MeshStandardMaterial; coneMesh: THREE.Mesh; pointLight: THREE.PointLight }[] = [];
    const houseNightLightsList: { windowsMat: THREE.MeshStandardMaterial; porchBulbMat: THREE.MeshStandardMaterial; bedsideLampMat: THREE.MeshStandardMaterial; interiorLight: THREE.PointLight; porchLight: THREE.PointLight; fireplaceLight: THREE.PointLight }[] = [];
    const houseChimneySmokeList: { mesh: THREE.Mesh; startY: number; speedY: number; offset: number }[] = [];
    const houseZzzParticlesList: { group: THREE.Group; startY: number; speedY: number; phase: number }[] = [];
    const dynamicSceneryItems: { group: THREE.Group; initialX: number; isTree: boolean; isHorizon: boolean }[] = [];

    // --- STREET BENCHES & AUTONOMOUS NPCS WITH INTELLIGENT AI & DYNAMIC SEATING ---
    interface StreetBenchItem {
      benchX: number;
      benchZ: number;
      benchGroup: THREE.Group;
      haloLeftRing: THREE.Mesh;
      haloLeftGlow: THREE.Mesh;
      haloRightRing: THREE.Mesh;
      haloRightGlow: THREE.Mesh;
      seatedNpcLeft: AutonomousNpcItem | null;
      seatedNpcRight: AutonomousNpcItem | null;
      lastSatTime: number;
    }

    interface AutonomousNpcItem {
      id: number;
      npcName: string;
      preset: {
        name: string;
        shirtColor: number;
        pantsColor: number;
        skinColor: number;
        hairColor: number;
        shoeColor: number;
        hairType: string;
        hasHeadphones: boolean;
        accessory: string;
      };
      npcGroup: THREE.Group;
      headGroup: THREE.Group;
      armL: THREE.Group;
      armR: THREE.Group;
      legLGroup: THREE.Group;
      legRGroup: THREE.Group;
      calfLGroup: THREE.Group;
      calfRGroup: THREE.Group;
      chatBubbleGroup?: THREE.Group;

      // Intelligence & Behavior State
      state: 'WALKING' | 'PAUSED' | 'WALKING_TO_BENCH' | 'SITTING_DOWN' | 'SEATED' | 'STANDING_UP';
      x: number;
      z: number;
      targetX: number;
      targetZ: number;
      facingDir: 1 | -1;
      walkSpeed: number;
      walkPhase: number;
      assignedBenchIdx: number | null;
      assignedSeatSide: -1.45 | 1.45;
      seatedTimer: number;
      seatedDuration: number;
      pausedTimer: number;
      pausedDuration: number;
      sitProgress: number; // 0 (standing) to 1 (seated)
    }

    const streetBenchesList: StreetBenchItem[] = [];
    const autonomousNpcsList: AutonomousNpcItem[] = [];

    // --- BLEACHER SPECTATOR NPCS AT SOCCER FIELD ---
    interface BleacherNpcItem {
      id: number;
      npcName: string;
      preset: {
        name: string;
        shirtColor: number;
        pantsColor: number;
        skinColor: number;
        hairColor: number;
        shoeColor: number;
        hairType: string;
        hasHeadphones: boolean;
      };
      npcGroup: THREE.Group;
      headGroup: THREE.Group;
      armL: THREE.Group;
      armR: THREE.Group;
      legLGroup: THREE.Group;
      legRGroup: THREE.Group;
      calfLGroup: THREE.Group;
      calfRGroup: THREE.Group;

      state: 'WATCHING' | 'STANDING_UP' | 'WALKING_DOWN_STEPS' | 'WALKING_TO_STREET' | 'STREET_ACTIVITY' | 'WALKING_TO_BLEACHERS' | 'CLIMBING_STEPS';

      tierRow: number;
      seatRelX: number;
      seatRelZ: number;
      seatRelY: number;

      currentWorldX: number;
      currentWorldY: number;
      currentWorldZ: number;

      targetWorldX: number;
      targetWorldZ: number;

      walkSpeed: number;
      walkPhase: number;

      watchingTimer: number;
      watchingDuration: number;
      streetTimer: number;
      streetDuration: number;
      sitProgress: number;
    }

    const bleacherNpcsList: BleacherNpcItem[] = [];

    // --- NOCTURNAL MONSTERS (ARANHAS E ESCORPIÕES) ---
    interface NocturnalMonsterItem {
      id: number;
      type: 'SPIDER' | 'SCORPION';
      group: THREE.Group;
      legGroups: THREE.Group[];
      pincerL?: THREE.Group;
      pincerR?: THREE.Group;
      tailGroup?: THREE.Group;
      stingerMesh?: THREE.Mesh;
      fangsGroup?: THREE.Group;

      x: number;
      z: number;
      y: number;

      speed: number;
      walkPhase: number;
      attackCooldown: number;
      active: boolean;
    }

    const nocturnalMonstersList: NocturnalMonsterItem[] = [];
    let dayNightCycleTimer = 0;
    const wasNightLastFrameRef = { current: false };

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
    const planterMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 }); // Added definition
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

    // Reusable Geometry Definitions for Scenery (drastically minimizes buffer allocations & GC pressure)
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 6, 8);
    const leavesGeo = new THREE.DodecahedronGeometry(2.3, 1);
    const planterGeo = new THREE.TorusGeometry(0.8, 0.18, 8, 16);
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 9, 8);
    const barGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
    const lanternGeo = new THREE.CylinderGeometry(0.3, 0.45, 0.8, 8);
    const bulbGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const coneGeo = new THREE.CylinderGeometry(0.25, 3.8, 8, 16, 1, true);
    const pineTrunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 4, 8);
    const pineTier1Geo = new THREE.ConeGeometry(2.2, 3.2, 6);
    const pineTier2Geo = new THREE.ConeGeometry(1.7, 2.5, 6);
    const pineTier3Geo = new THREE.ConeGeometry(1.2, 1.8, 6);
    const barrierGeo = new THREE.BoxGeometry(1.3, 0.2, 1.3);
    const r1Geo = new THREE.DodecahedronGeometry(0.85, 0);
    const bush1Geo = new THREE.DodecahedronGeometry(1.0, 1);
    const bush2Geo = new THREE.DodecahedronGeometry(0.7, 1);
    const bush3Geo = new THREE.DodecahedronGeometry(0.6, 1);
    const lawnGeo = new THREE.BoxGeometry(4.2, 0.15, 3.2);
    const borderGeo = new THREE.BoxGeometry(4.4, 0.22, 0.15);
    const flowerStemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4);
    const flowerHeadGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const seatGeo = new THREE.BoxGeometry(3.2, 0.15, 1.0);
    const backGeo = new THREE.BoxGeometry(3.2, 0.7, 0.15);
    const benchLegGeo = new THREE.BoxGeometry(0.18, 0.8, 1.1);
    const coupledSeatGeo = new THREE.BoxGeometry(2.4, 0.15, 0.95);
    const coupledBackGeo = new THREE.BoxGeometry(2.4, 0.65, 0.15);
    const coupledLegGeo = new THREE.BoxGeometry(0.16, 0.8, 1.05);
    const sideBushGeo = new THREE.DodecahedronGeometry(0.85, 1);
    const sideStoneGeo = new THREE.DodecahedronGeometry(0.55, 0);
    
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
        const pole = new THREE.Mesh(poleGeo, metalMat);
        pole.position.y = 4.5;
        lampPostGroup.add(pole);

        // Horizontal hanging bar
        const bar = new THREE.Mesh(barGeo, metalMat);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0.6, 8.8, 0);
        lampPostGroup.add(bar);

        // Hanging lantern cover
        const lantern = new THREE.Mesh(lanternGeo, metalMat);
        lantern.position.set(1.2, 8.4, 0);
        lampPostGroup.add(lantern);

        // Glowing warm light bulb with dynamic night emissive control
        const lampBulbMat = new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xfef08a,
          emissiveIntensity: 0.0,
          roughness: 0.2,
        });
        const bulb = new THREE.Mesh(bulbGeo, lampBulbMat);
        bulb.position.set(1.2, 8.0, 0);
        lampPostGroup.add(bulb);

        // BEAUTIFUL TRANSLUCENT LIGHT CONE (Poste de Iluminação)
        const cone = new THREE.Mesh(coneGeo, lampConeMat);
        cone.position.set(1.2, 4.0, 0);
        cone.visible = false; // Off during day
        lampPostGroup.add(cone);

        streetLampsList.push({ bulbMat: lampBulbMat, coneMesh: cone });

        // Add a small decorative bush next to the pole base
        const baseBush = new THREE.Mesh(bush3Geo, bushMat);
        baseBush.position.set(-0.5, 0.3, 0.2);
        lampPostGroup.add(baseBush);

        sceneryGroup.add(lampPostGroup);
      } else if (typeChoice === 1) {
        // --- STREET SIDEWALK TREE TYPE A (Árvore Frondosa com Canteiro) ---
        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, 0, 0);

        // Wood Trunk
        const trunk = new THREE.Mesh(trunkGeo, treeTrunkMat);
        trunk.position.y = 3;
        treeGroup.add(trunk);

        // Leafy top crown
        const leaves = new THREE.Mesh(leavesGeo, treeFoliageMat);
        const leafScale = 1.0 + random() * 0.2;
        leaves.scale.set(leafScale, leafScale, leafScale);
        leaves.position.y = 6.5;
        leaves.rotation.y = random() * Math.PI;
        treeGroup.add(leaves);

        // Circular dark stone planter bed at base
        const planter = new THREE.Mesh(planterGeo, planterMat);
        planter.rotation.x = -Math.PI / 2;
        planter.position.y = 0.1;
        treeGroup.add(planter);

        // Desobstrução do portão central de entrada da casa (X = -140.0)
        const isHouseWalkwayCenter = Math.abs(x - (-140.0)) < 5.0;
        if (!isHouseWalkwayCenter) {
          sceneryGroup.add(treeGroup);
          dynamicSceneryItems.push({ group: treeGroup, initialX: x, isTree: true, isHorizon: false });
        }
      } else if (typeChoice === 2) {
        // --- CONIFER / PINE TREE TYPE B (Árvore Conífera de Praça / Pinheiro) ---
        // Removido da entrada e fachada da casa (Refúgio Tranquilo em X = -140.0)
        const isNearHouseEntrance = Math.abs(x - (-140.0)) <= 25.0;
        if (!isNearHouseEntrance) {
          const pineGroup = new THREE.Group();
          pineGroup.position.set(x, 0, 0);

          // Trunk
          const trunk = new THREE.Mesh(pineTrunkGeo, treeTrunkMat);
          trunk.position.y = 2;
          pineGroup.add(trunk);

          // Foliage - 3 overlapping stacked cone tiers
          const tier1 = new THREE.Mesh(pineTier1Geo, coniferFoliageMat);
          tier1.position.y = 3.6;
          pineGroup.add(tier1);

          const tier2 = new THREE.Mesh(pineTier2Geo, coniferFoliageMat);
          tier2.position.y = 5.2;
          pineGroup.add(tier2);

          const tier3 = new THREE.Mesh(pineTier3Geo, coniferFoliageMat);
          tier3.position.y = 6.6;
          pineGroup.add(tier3);

          // Square wooden barrier around trunk base
          const barrierMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
          const barrier = new THREE.Mesh(barrierGeo, barrierMat);
          barrier.position.y = 0.1;
          pineGroup.add(barrier);

          sceneryGroup.add(pineGroup);
          dynamicSceneryItems.push({ group: pineGroup, initialX: x, isTree: true, isHorizon: false });
        }
      } else if (typeChoice === 3) {
        // --- GARDEN ROCK CLUSTER (Pedras de Jardim) ---
        const rockGroup = new THREE.Group();
        rockGroup.position.set(x, 0, (random() - 0.5) * 1.5);

        // Rock 1: Large
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

        const b1 = new THREE.Mesh(bush1Geo, bushMat);
        b1.position.set(0, 0.6, 0);
        bushGroup.add(b1);

        const b2 = new THREE.Mesh(bush2Geo, bushMat);
        b2.position.set(-0.7, 0.45, 0.3);
        bushGroup.add(b2);

        const b3 = new THREE.Mesh(bush3Geo, bushMat);
        b3.position.set(0.7, 0.4, -0.3);
        bushGroup.add(b3);

        sceneryGroup.add(bushGroup);
      } else if (typeChoice === 5) {
        // --- CANTEIRO DE GRAMADO COM FLORES (Lawn Patch with flowers) ---
        const lawnGroup = new THREE.Group();
        lawnGroup.position.set(x, 0, 0);

        // Green lawn base box
        const lawn = new THREE.Mesh(lawnGeo, grassMat);
        lawn.position.y = 0.08;
        lawnGroup.add(lawn);

        // Mini wood/stone borders
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
          const stem = new THREE.Mesh(flowerStemGeo, treeFoliageMat);
          stem.position.y = 0.2;
          flowerGroup.add(stem);

          // Flower Head
          const headMesh = new THREE.Mesh(flowerHeadGeo, flowerMats[i % flowerMats.length]);
          headMesh.position.y = 0.4;
          flowerGroup.add(headMesh);

          lawnGroup.add(flowerGroup);
        }

        sceneryGroup.add(lawnGroup);
      } else if (typeChoice === 6) {
        // --- PLUSH BUSH & FLOWER BED CLUSTER (Canteiro com Moitas e Flores) ---
        const flowerBedGroup = new THREE.Group();
        flowerBedGroup.position.set(x, 0, 0);

        const bedLawn = new THREE.Mesh(lawnGeo, grassMat);
        bedLawn.position.y = 0.08;
        flowerBedGroup.add(bedLawn);

        const b1 = new THREE.Mesh(bush1Geo, bushMat);
        b1.position.set(-0.9, 0.45, 0);
        flowerBedGroup.add(b1);

        const b2 = new THREE.Mesh(bush2Geo, bushMat);
        b2.position.set(0.9, 0.4, 0);
        flowerBedGroup.add(b2);

        sceneryGroup.add(flowerBedGroup);
      } else {
        // --- COZY GARDEN SHRUBBERY & PEBBLES (Arbustos de Praça) ---
        const shrubGroup = new THREE.Group();
        shrubGroup.position.set(x, 0, 0);

        const sideBush = new THREE.Mesh(sideBushGeo, bushMat);
        sideBush.position.set(0.6, 0.45, 0.1);
        shrubGroup.add(sideBush);

        const sideStone = new THREE.Mesh(sideStoneGeo, rockMat);
        sideStone.position.set(-0.6, 0.25, 0.2);
        shrubGroup.add(sideStone);

        sceneryGroup.add(shrubGroup);
      }
    }
    scene.add(sceneryGroup);

    // =========================================================================
    // --- BANCOS DE RUA DA PRAÇA & NPCS AUTÔNOMOS COM INTELIGÊNCIA ARTIFICIAL ---
    // =========================================================================
    const streetBenchesGroup = new THREE.Group();
    scene.add(streetBenchesGroup);

    const streetBenchPositions = [-165, -125, -70, -32, -16, 16, 42, 85, 138, 162];

    const npcPresets = [
      { name: 'Sofia', shirtColor: 0x8b5cf6, pantsColor: 0x1e293b, skinColor: 0xfbbf24, hairColor: 0x78350f, shoeColor: 0xf8fafc, hairType: 'bob', hasHeadphones: true, accessory: 'headphones' },
      { name: 'Lucas', shirtColor: 0x06b6d4, pantsColor: 0x334155, skinColor: 0xfde047, hairColor: 0x0f172a, shoeColor: 0x0284c7, hairType: 'cap', hasHeadphones: false, accessory: 'coffee' },
      { name: 'Mariana', shirtColor: 0xf43f5e, pantsColor: 0x1e1b4b, skinColor: 0xd97706, hairColor: 0x1e293b, shoeColor: 0xfb7185, hairType: 'afro', hasHeadphones: false, accessory: 'book' },
      { name: 'Gabriel', shirtColor: 0x10b981, pantsColor: 0x475569, skinColor: 0x854d0e, hairColor: 0x0f172a, shoeColor: 0x1e293b, hairType: 'curly', hasHeadphones: true, accessory: 'headphones' },
      { name: 'Beatriz', shirtColor: 0xf59e0b, pantsColor: 0x374151, skinColor: 0xfecdd3, hairColor: 0xb45309, shoeColor: 0xfef08a, hairType: 'ponytail', hasHeadphones: false, accessory: 'book' },
      { name: 'Rafael', shirtColor: 0x3b82f6, pantsColor: 0x1f2937, skinColor: 0xfde047, hairColor: 0x78350f, shoeColor: 0xffffff, hairType: 'beanie', hasHeadphones: false, accessory: 'coffee' },
      { name: 'Camila', shirtColor: 0xec4899, pantsColor: 0x334155, skinColor: 0xfbbf24, hairColor: 0x0f172a, shoeColor: 0x10b981, hairType: 'bob', hasHeadphones: true, accessory: 'headphones' },
      { name: 'Matheus', shirtColor: 0x14b8a6, pantsColor: 0x1e293b, skinColor: 0xd97706, hairColor: 0x451a03, shoeColor: 0x0f172a, hairType: 'cap', hasHeadphones: false, accessory: 'coffee' },
      { name: 'Larissa', shirtColor: 0xa855f7, pantsColor: 0x1e1b4b, skinColor: 0xfde047, hairColor: 0xb45309, shoeColor: 0xf472b6, hairType: 'ponytail', hasHeadphones: false, accessory: 'book' },
      { name: 'Thiago', shirtColor: 0xeab308, pantsColor: 0x334155, skinColor: 0x854d0e, hairColor: 0x0f172a, shoeColor: 0xffffff, hairType: 'curly', hasHeadphones: true, accessory: 'headphones' }
    ];

    // 1. CRIAR OS BANCOS DE PRAÇA COM HALOS INDICADORES DE ASSENTOS VAGOS
    streetBenchPositions.forEach((bx) => {
      const benchGroup = new THREE.Group();
      benchGroup.position.set(bx, 0, -4.5);

      const benchMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.65 });
      const castIronMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.85 });

      // Assento ripado
      for (let s = 0; s < 6; s++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.09, 0.16), benchMat);
        slat.position.set(0, 0.82, -0.42 + s * 0.17);
        benchGroup.add(slat);
      }

      // Encosto ripado
      for (let b = 0; b < 5; b++) {
        const bSlat = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.18, 0.09), benchMat);
        bSlat.position.set(0, 1.20 + b * 0.28, -0.55 - b * 0.06);
        bSlat.rotation.x = -0.16;
        benchGroup.add(bSlat);
      }

      // Pés de ferro fundido
      [-2.6, 0, 2.6].forEach((legX) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.82, 1.25), castIronMat);
        leg.position.set(legX, 0.41, -0.05);
        benchGroup.add(leg);

        const backLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.85, 0.16), castIronMat);
        backLeg.position.set(legX, 1.65, -0.68);
        backLeg.rotation.x = -0.16;
        benchGroup.add(backLeg);

        const armRest = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.10, 1.05), castIronMat);
        armRest.position.set(legX, 1.32, -0.05);
        benchGroup.add(armRest);
      });

      // Halo Assento Esquerdo (-1.45)
      const haloLeftRing = new THREE.Mesh(
        new THREE.RingGeometry(0.45, 0.75, 24),
        new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
      );
      haloLeftRing.rotation.x = -Math.PI / 2;
      haloLeftRing.position.set(-1.45, 0.84, 0.05);
      benchGroup.add(haloLeftRing);

      const haloLeftGlow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.65, 0.50, 16),
        new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false })
      );
      haloLeftGlow.position.set(-1.45, 1.10, 0.05);
      benchGroup.add(haloLeftGlow);

      // Halo Assento Direito (+1.45)
      const haloRightRing = new THREE.Mesh(
        new THREE.RingGeometry(0.45, 0.75, 24),
        new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
      );
      haloRightRing.rotation.x = -Math.PI / 2;
      haloRightRing.position.set(1.45, 0.84, 0.05);
      benchGroup.add(haloRightRing);

      const haloRightGlow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.65, 0.50, 16),
        new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false })
      );
      haloRightGlow.position.set(1.45, 1.10, 0.05);
      benchGroup.add(haloRightGlow);

      streetBenchesGroup.add(benchGroup);

      streetBenchesList.push({
        benchX: bx,
        benchZ: -4.5,
        benchGroup,
        haloLeftRing,
        haloLeftGlow,
        haloRightRing,
        haloRightGlow,
        seatedNpcLeft: null,
        seatedNpcRight: null,
        lastSatTime: -999,
      });
    });

    // 2. CRIAR OS NPCS AUTÔNOMOS ARTICULADOS E INICIALIZAR SEUS ESTADOS
    npcPresets.forEach((preset, idx) => {
      const npcGroup = new THREE.Group();

      const shirtMat = new THREE.MeshStandardMaterial({ color: preset.shirtColor, roughness: 0.6 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: preset.pantsColor, roughness: 0.8 });
      const skinMat = new THREE.MeshStandardMaterial({ color: preset.skinColor, roughness: 0.75 });
      const hairMat = new THREE.MeshStandardMaterial({ color: preset.hairColor, roughness: 0.85 });
      const shoeMat = new THREE.MeshStandardMaterial({ color: preset.shoeColor, roughness: 0.6 });

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.33, 1.62, 0.83), shirtMat);
      torso.position.y = 1.63;
      torso.castShadow = true;
      npcGroup.add(torso);

      // Cabeça
      const npcHeadGroup = new THREE.Group();
      npcHeadGroup.position.set(0, 2.82, 0);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 16), skinMat);
      npcHeadGroup.add(head);

      // Olhos & Sorriso
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const eyeHighlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      [-0.16, 0.16].forEach((ex) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), eyeMat);
        eye.position.set(ex, 0.08, 0.43);
        npcHeadGroup.add(eye);
        const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.022, 4, 4), eyeHighlightMat);
        highlight.position.set(ex + 0.02, 0.10, 0.47);
        npcHeadGroup.add(highlight);
      });

      const smile = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 12, Math.PI), new THREE.MeshBasicMaterial({ color: 0x7f1d1d }));
      smile.position.set(0, -0.12, 0.42);
      smile.rotation.x = Math.PI / 2;
      npcHeadGroup.add(smile);

      // Cabelo
      if (preset.hairType === 'afro') {
        const afro = new THREE.Mesh(new THREE.DodecahedronGeometry(0.56, 1), hairMat);
        afro.position.y = 0.12;
        npcHeadGroup.add(afro);
      } else if (preset.hairType === 'cap') {
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.32, 16), shirtMat);
        cap.position.y = 0.28;
        npcHeadGroup.add(cap);
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.06, 0.35), shirtMat);
        visor.position.set(0, 0.18, 0.56);
        npcHeadGroup.add(visor);
      } else if (preset.hairType === 'beanie') {
        const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.50, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7), shirtMat);
        beanie.position.y = 0.15;
        npcHeadGroup.add(beanie);
        const pompom = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), shoeMat);
        pompom.position.y = 0.60;
        npcHeadGroup.add(pompom);
      } else if (preset.hairType === 'ponytail') {
        const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.49, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
        hairBase.position.y = 0.06;
        npcHeadGroup.add(hairBase);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.20, 0.55, 8), hairMat);
        tail.position.set(0, 0.22, -0.45);
        tail.rotation.x = -0.6;
        npcHeadGroup.add(tail);
      } else {
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.49, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
        hair.position.y = 0.06;
        npcHeadGroup.add(hair);
      }

      if (preset.hasHeadphones) {
        const hpMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.3 });
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.045, 6, 20, Math.PI), hpMat);
        band.position.set(0, 0.08, 0);
        band.rotation.z = Math.PI / 2;
        npcHeadGroup.add(band);
        [-0.48, 0.48].forEach((cx) => {
          const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.09, 12), hpMat);
          cup.rotation.z = Math.PI / 2;
          cup.position.set(cx, 0.03, 0);
          npcHeadGroup.add(cup);
        });
      }

      npcGroup.add(npcHeadGroup);

      // Braço Esquerdo
      const npcArmL = new THREE.Group();
      npcArmL.position.set(-0.88, 2.25, 0);
      const armLUpper = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.72, 0.40), shirtMat);
      armLUpper.position.y = -0.36;
      npcArmL.add(armLUpper);
      const armLLower = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.68, 0.36), skinMat);
      armLLower.position.set(0, -0.96, 0.15);
      armLLower.rotation.x = 0.4;
      npcArmL.add(armLLower);
      const handL = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.24, 0.30), skinMat);
      handL.position.set(0, -1.35, 0.32);
      npcArmL.add(handL);
      npcGroup.add(npcArmL);

      // Braço Direito
      const npcArmR = new THREE.Group();
      npcArmR.position.set(0.88, 2.25, 0);
      const armRUpper = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.72, 0.40), shirtMat);
      armRUpper.position.y = -0.36;
      npcArmR.add(armRUpper);
      const armRLower = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.68, 0.36), skinMat);
      armRLower.position.set(0, -0.96, 0.15);
      armRLower.rotation.x = 0.4;
      npcArmR.add(armRLower);
      const handR = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.24, 0.30), skinMat);
      handR.position.set(0, -1.35, 0.32);
      npcArmR.add(handR);

      if (preset.accessory === 'coffee') {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.26, 12), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
        cup.position.set(0, -1.35, 0.45);
        npcArmR.add(cup);
      } else if (preset.accessory === 'book') {
        const book = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.48), new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5 }));
        book.position.set(0, -1.32, 0.45);
        npcArmR.add(book);
      }

      npcGroup.add(npcArmR);

      // PERNAS ARTICULADAS (Pivô quadril y = 1.15, joelho y = -0.70)
      const legLGroup = new THREE.Group();
      legLGroup.position.set(-0.35, 1.15, 0);
      const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.70, 0.44), pantsMat);
      thighL.position.y = -0.35;
      legLGroup.add(thighL);

      const calfLGroup = new THREE.Group();
      calfLGroup.position.set(0, -0.70, 0);
      const calfL = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.65, 0.40), pantsMat);
      calfL.position.y = -0.325;
      calfLGroup.add(calfL);
      const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.82), shoeMat);
      shoeL.position.set(0, -0.65, 0.15);
      calfLGroup.add(shoeL);
      legLGroup.add(calfLGroup);
      npcGroup.add(legLGroup);

      const legRGroup = new THREE.Group();
      legRGroup.position.set(0.35, 1.15, 0);
      const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.70, 0.44), pantsMat);
      thighR.position.y = -0.35;
      legRGroup.add(thighR);

      const calfRGroup = new THREE.Group();
      calfRGroup.position.set(0, -0.70, 0);
      const calfR = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.65, 0.40), pantsMat);
      calfR.position.y = -0.325;
      calfRGroup.add(calfR);
      const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.82), shoeMat);
      shoeR.position.set(0, -0.65, 0.15);
      calfRGroup.add(shoeR);
      legRGroup.add(calfRGroup);
      npcGroup.add(legRGroup);

      scene.add(npcGroup);

      // Determinar estado inicial (3 NPCs começam sentados em bancos aleatórios, 7 caminham livremente)
      const initialSeatedBenchIndices = [1, 4, 7];
      const isInitiallySeated = initialSeatedBenchIndices.includes(idx);

      let initState: AutonomousNpcItem['state'] = 'WALKING';
      let initX = -180 + idx * 36 + (Math.random() - 0.5) * 15.0;
      let initZ = -2.5 + (Math.random() - 0.5) * 0.8;
      let assignedBenchIdx: number | null = null;
      let assignedSeatSide: -1.45 | 1.45 = -1.45;
      let sitProgress = 0.0;
      let seatedTimer = 0;
      let seatedDuration = 0;

      if (isInitiallySeated && streetBenchesList[idx]) {
        initState = 'SEATED';
        sitProgress = 1.0;
        assignedBenchIdx = idx;
        assignedSeatSide = -1.45;
        initX = streetBenchesList[idx].benchX + assignedSeatSide;
        initZ = -4.5;
        npcGroup.position.set(initX, 0.82, initZ);
        npcGroup.rotation.y = 0;

        legLGroup.rotation.x = -Math.PI / 2 + 0.1;
        legRGroup.rotation.x = -Math.PI / 2 + 0.1;
        calfLGroup.rotation.x = Math.PI / 2;
        calfRGroup.rotation.x = Math.PI / 2;

        seatedTimer = Math.random() * 6.0;
        seatedDuration = 12.0 + Math.random() * 18.0;
      } else {
        npcGroup.position.set(initX, 0.0, initZ);
      }

      const facingDir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
      const walkSpeed = 1.6 + Math.random() * 0.9;

      const npcItem: AutonomousNpcItem = {
        id: idx,
        npcName: preset.name,
        preset,
        npcGroup,
        headGroup: npcHeadGroup,
        armL: npcArmL,
        armR: npcArmR,
        legLGroup,
        legRGroup,
        calfLGroup,
        calfRGroup,
        chatBubbleGroup: undefined,

        state: initState,
        x: initX,
        z: initZ,
        targetX: initX + facingDir * (40 + Math.random() * 60),
        targetZ: initZ,
        facingDir,
        walkSpeed,
        walkPhase: Math.random() * 10,
        assignedBenchIdx,
        assignedSeatSide,
        seatedTimer,
        seatedDuration,
        pausedTimer: 0,
        pausedDuration: 0,
        sitProgress,
      };

      if (isInitiallySeated && streetBenchesList[idx]) {
        streetBenchesList[idx].seatedNpcLeft = npcItem;
      }

      autonomousNpcsList.push(npcItem);
    });

    // --- OUTDOOR CALISTHENICS / GYMNASTICS ACADEMY GROUP ---
    const gymAcademyGroup = new THREE.Group();
    gymAcademyGroup.position.set(0.0, 0, -22.0); // Located close to back fence (Z = -22.0)
    gymAcademyGroup.scale.set(1.5, 1.5, 1.5);
    scene.add(gymAcademyGroup);

    // Athletic rubber green turf floor platform
    const gymBaseGeo = new THREE.PlaneGeometry(36, 11);
    const gymBaseMat = new THREE.MeshStandardMaterial({
      color: 0x059669, // Athletic rubber emerald green tone
      roughness: 0.8,
      metalness: 0.1,
    });
    const gymBase = new THREE.Mesh(gymBaseGeo, gymBaseMat);
    gymBase.rotation.x = -Math.PI / 2;
    gymBase.position.set(0, 0.015, -1.0); // Spans X from -18 to +18, Z from -6.5 to +4.5
    gymBase.receiveShadow = true;
    gymAcademyGroup.add(gymBase);

    // White boundary lines for design
    const gymBoundaryGeo = new THREE.PlaneGeometry(36.4, 11.4);
    const gymBoundaryMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const gymBoundary = new THREE.Mesh(gymBoundaryGeo, gymBoundaryMat);
    gymBoundary.rotation.x = -Math.PI / 2;
    gymBoundary.position.set(0, 0.01, -1.0);
    gymAcademyGroup.add(gymBoundary);

    // Apparatus 1: PULL-UP CALISTHENICS STATION (Barra de Flexão) (X = -8)
    const pullupGroup = new THREE.Group();
    pullupGroup.position.set(-8, 0, 0);

    const postGeo = new THREE.CylinderGeometry(0.12, 0.15, 4.4, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
    
    const pPost1 = new THREE.Mesh(postGeo, postMat);
    pPost1.position.set(0, 2.2, -1.4);
    pullupGroup.add(pPost1);

    const pPost2 = new THREE.Mesh(postGeo, postMat);
    pPost2.position.set(0, 2.2, 1.4);
    pullupGroup.add(pPost2);

    const gymPullupBarGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 12);
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const pBar = new THREE.Mesh(gymPullupBarGeo, steelMat);
    pBar.rotation.x = Math.PI / 2;
    pBar.position.set(0, 4.2, 0);
    pullupGroup.add(pBar);

    // Glowing Activation Ring underneath
    const triggerRingGeo = new THREE.RingGeometry(1.6, 1.8, 16);
    const triggerRingMat1 = new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const triggerRing1 = new THREE.Mesh(triggerRingGeo, triggerRingMat1);
    triggerRing1.rotation.x = -Math.PI / 2;
    triggerRing1.position.set(0, 0.03, 0);
    pullupGroup.add(triggerRing1);

    gymAcademyGroup.add(pullupGroup);

    // Apparatus 2: PARALLEL BARS (Barras Paralelas) (X = 0)
    const parallelGroup = new THREE.Group();
    parallelGroup.position.set(0, 0, 0);

    const parPostGeo = new THREE.CylinderGeometry(0.09, 0.11, 2.0, 8);
    
    const lPost1 = new THREE.Mesh(parPostGeo, postMat); lPost1.position.set(-0.8, 1.0, -0.6); parallelGroup.add(lPost1);
    const lPost2 = new THREE.Mesh(parPostGeo, postMat); lPost2.position.set(0.8, 1.0, -0.6); parallelGroup.add(lPost2);
    const lRail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 12), steelMat);
    lRail.rotation.z = Math.PI / 2;
    lRail.position.set(0, 2.0, -0.6);
    parallelGroup.add(lRail);

    const rPost1 = new THREE.Mesh(parPostGeo, postMat); rPost1.position.set(-0.8, 1.0, 0.6); parallelGroup.add(rPost1);
    const rPost2 = new THREE.Mesh(parPostGeo, postMat); rPost2.position.set(0.8, 1.0, 0.6); parallelGroup.add(rPost2);
    const rRail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 12), steelMat);
    rRail.rotation.z = Math.PI / 2;
    rRail.position.set(0, 2.0, 0.6);
    parallelGroup.add(rRail);

    const triggerRingMat2 = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const triggerRing2 = new THREE.Mesh(triggerRingGeo, triggerRingMat2);
    triggerRing2.rotation.x = -Math.PI / 2;
    triggerRing2.position.set(0, 0.03, 0);
    parallelGroup.add(triggerRing2);

    gymAcademyGroup.add(parallelGroup);

    // Apparatus 3: CALISTHENICS RINGS (Argolas) (X = 8)
    const ringsGroup = new THREE.Group();
    ringsGroup.position.set(8, 0, 0);

    const rPillar1 = new THREE.Mesh(postGeo, postMat); rPillar1.position.set(0, 2.2, -1.3); ringsGroup.add(rPillar1);
    const rPillar2 = new THREE.Mesh(postGeo, postMat); rPillar2.position.set(0, 2.2, 1.3); ringsGroup.add(rPillar2);
    const rCross = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.8, 12), postMat);
    rCross.rotation.x = Math.PI / 2;
    rCross.position.set(0, 4.4, 0);
    ringsGroup.add(rCross);

    const stringMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const stringGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.8, 6);
    
    const ringLeftStr = new THREE.Mesh(stringGeo, stringMat); ringLeftStr.position.set(0, 3.5, -0.45); ringsGroup.add(ringLeftStr);
    const ringRightStr = new THREE.Mesh(stringGeo, stringMat); ringRightStr.position.set(0, 3.5, 0.45); ringsGroup.add(ringRightStr);

    const torusGeo = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
    const ringLeft = new THREE.Mesh(torusGeo, steelMat); ringLeft.position.set(0, 2.5, -0.45); ringLeft.rotation.y = Math.PI / 2; ringsGroup.add(ringLeft);
    const ringRight = new THREE.Mesh(torusGeo, steelMat); ringRight.position.set(0, 2.5, 0.45); ringRight.rotation.y = Math.PI / 2; ringsGroup.add(ringRight);

    const triggerRingMat3 = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const triggerRing3 = new THREE.Mesh(triggerRingGeo, triggerRingMat3);
    triggerRing3.rotation.x = -Math.PI / 2;
    triggerRing3.position.set(0, 0.03, 0);
    ringsGroup.add(triggerRing3);

    gymAcademyGroup.add(ringsGroup);

    // --- REALISTIC 3D INTERNET CLOUDS (ORIGIN OF HARMFUL DIGITAL ITEMS) ---
    const internetCloudsGroup = new THREE.Group();
    internetCloudsGroup.position.set(0, 19.5, 0);

    const cloudPuffMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.05,
      emissive: 0x0284c7,
      emissiveIntensity: 0.20,
      transparent: true,
      opacity: 0.60,
    });
    const cloudCoreGlowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    });
    const cloudWifiDataRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.60,
      side: THREE.DoubleSide,
    });

    const puffGeo1 = new THREE.DodecahedronGeometry(2.4, 1);
    const puffGeo2 = new THREE.DodecahedronGeometry(1.8, 1);
    const puffGeo3 = new THREE.DodecahedronGeometry(1.4, 1);
    const cloudGlowGeo = new THREE.SphereGeometry(3.2, 12, 12);
    const cloudRingGeo = new THREE.TorusGeometry(2.2, 0.12, 8, 24);

    for (let x = -285; x <= 285; x += 22) {
      const cloudUnit = new THREE.Group();
      const yOffset = Math.sin(x * 0.08) * 1.5;
      const zOffset = Math.cos(x * 0.05) * 1.8;
      cloudUnit.position.set(x, yOffset, zOffset);

      const puff1 = new THREE.Mesh(puffGeo1, cloudPuffMat);
      cloudUnit.add(puff1);

      const puff2 = new THREE.Mesh(puffGeo1, cloudPuffMat);
      puff2.position.set(2.2, -0.3, 0.4);
      cloudUnit.add(puff2);

      const puff3 = new THREE.Mesh(puffGeo1, cloudPuffMat);
      puff3.position.set(-2.2, -0.3, -0.4);
      cloudUnit.add(puff3);

      const puff4 = new THREE.Mesh(puffGeo2, cloudPuffMat);
      puff4.position.set(1.1, 1.2, 0.2);
      cloudUnit.add(puff4);

      const puff5 = new THREE.Mesh(puffGeo2, cloudPuffMat);
      puff5.position.set(-1.1, 1.1, -0.2);
      cloudUnit.add(puff5);

      const puff6 = new THREE.Mesh(puffGeo3, cloudPuffMat);
      puff6.position.set(3.4, -0.6, 0);
      cloudUnit.add(puff6);

      const puff7 = new THREE.Mesh(puffGeo3, cloudPuffMat);
      puff7.position.set(-3.4, -0.6, 0);
      cloudUnit.add(puff7);

      const glowCore = new THREE.Mesh(cloudGlowGeo, cloudCoreGlowMat);
      glowCore.position.set(0, -0.2, 0);
      cloudUnit.add(glowCore);

      const dataRing = new THREE.Mesh(cloudRingGeo, cloudWifiDataRingMat);
      dataRing.rotation.x = Math.PI / 2;
      dataRing.position.set(0, -1.2, 0);
      cloudUnit.add(dataRing);

      internetCloudsGroup.add(cloudUnit);
    }
    scene.add(internetCloudsGroup);

    // --- HORIZON SCENERY: MOUNTAINS, FORESTS, HOUSES, FENCES & ANIMALS ---
    const horizonSceneryGroup = new THREE.Group();

    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, metalness: 0.1 });
    const mountainSnowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const houseWallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 });
    const houseRoofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });
    const houseRoofMat2 = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
    const horizonTreeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    const horizonBirchTrunkMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
    const horizonTreeLeavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    const horizonTreeLeavesMat2 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 });
    const horizonTreeLeavesMat3 = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.7 }); // Autumn Orange
    const horizonTreeLeavesMat4 = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.7 }); // Golden Yellow
    const horizonPineMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.7 }); // Dark Pine
    const horizonPineMat2 = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.7 }); // Forest Pine
    const fenceWoodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
    const cowBodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const cowSpotMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });
    const sheepWoolMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const sheepHeadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });

    const mountainGeo = new THREE.ConeGeometry(55, 45, 6);
    const mountainGeoLarge = new THREE.ConeGeometry(85, 65, 6);
    const houseBaseGeo = new THREE.BoxGeometry(6, 4, 5);
    const houseRoofGeo = new THREE.ConeGeometry(5, 3, 4);
    const horizonTrunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 3, 6);
    const horizonLeavesGeo = new THREE.DodecahedronGeometry(2.3, 1);
    const sphereCanopyGeo = new THREE.SphereGeometry(2.0, 6, 6);
    const pineGeo = new THREE.ConeGeometry(2.2, 5.5, 6);
    const pineGeoSmall = new THREE.ConeGeometry(1.6, 4.0, 6);
    const cowBodyGeo = new THREE.BoxGeometry(2.2, 1.2, 1.2);
    const cowHeadGeo = new THREE.BoxGeometry(0.8, 0.8, 0.9);
    const cowLegGeo = new THREE.BoxGeometry(0.3, 0.9, 0.3);
    const sheepBodyGeo = new THREE.BoxGeometry(1.6, 1.0, 1.1);

    // 1. Distant Mountains (Pushed far back in depth Z = -130 to -160, safely clear of soccer field)
    for (let x = -280; x <= 280; x += 75) {
      const mGroup = new THREE.Group();
      const isLarge = Math.abs(x) % 150 === 0;
      const mMesh = new THREE.Mesh(isLarge ? mountainGeoLarge : mountainGeo, mountainMat);
      const h = isLarge ? 65 : 45;
      mMesh.position.set(x + (Math.sin(x) * 18), h / 2 - 2, -145 + (Math.cos(x) * 15));
      mMesh.scale.set(1.4 + Math.sin(x) * 0.3, 1, 0.9);
      mGroup.add(mMesh);

      if (isLarge) {
        const snowMesh = new THREE.Mesh(new THREE.ConeGeometry(28, 16, 6), mountainSnowMat);
        snowMesh.position.set(mMesh.position.x, h * 0.65, mMesh.position.z);
        mGroup.add(snowMesh);
      }
      horizonSceneryGroup.add(mGroup);
    }

    // 2. Forests, Houses & Animals along horizon (Positioned safely outside or behind active interactive zones)
    for (let x = -275; x <= 275; x += 24) {
      const isSoccerZone = (x >= 145 && x <= 215);
      const isLakeZone = (x >= -110 && x <= -70);
      const isHorseZone = (x >= 45 && x <= 85);
      const isCozyHouseZone = (x >= -160 && x <= -120);
      const isSpecialHorizonZone = isSoccerZone || isLakeZone || isHorseZone || isCozyHouseZone;

      // In soccer field, lake, or horse zones, strictly place background forests behind the field and skip buildings/animals in the pitch
      const isHouse = !isSpecialHorizonZone && (Math.abs(x + 12) % 72 === 0);
      const isBarn = !isSpecialHorizonZone && (Math.abs(x + 36) % 96 === 0);
      const hasAnimals = !isSpecialHorizonZone && (Math.abs(x + 20) % 48 === 0);
      const xPos = x + (Math.sin(x * 12) * 4);

      if (isHouse || isBarn) {
        const houseGroup = new THREE.Group();
        const baseGeo = isBarn ? new THREE.BoxGeometry(7, 4.5, 6) : houseBaseGeo;
        const wallMat = isBarn ? new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 }) : houseWallMat; // Red barn
        const base = new THREE.Mesh(baseGeo, wallMat);
        base.position.set(xPos, isBarn ? 2.25 : 2, -42);
        houseGroup.add(base);

        const roof = new THREE.Mesh(houseRoofGeo, (Math.abs(x) % 150 === 0) ? houseRoofMat2 : houseRoofMat);
        roof.position.set(xPos, isBarn ? 5.8 : 5.5, -42);
        roof.rotation.y = Math.PI / 4;
        houseGroup.add(roof);

        const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.1), doorMat);
        door.position.set(xPos, 1.1, -39.45);
        houseGroup.add(door);

        if (!isBarn) {
          const win1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.1), windowMat);
          win1.position.set(xPos - 1.6, 2.5, -39.45);
          houseGroup.add(win1);

          const win2 = win1.clone();
          win2.position.x = xPos + 1.6;
          houseGroup.add(win2);
        } else {
          // Add a silo next to barn
          const siloGeo = new THREE.CylinderGeometry(1.2, 1.2, 6, 8);
          const siloMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
          const silo = new THREE.Mesh(siloGeo, siloMat);
          silo.position.set(xPos + 4.5, 3, -42);
          houseGroup.add(silo);
        }

        horizonSceneryGroup.add(houseGroup);
      } else {
        const forestGroup = new THREE.Group();
        // Rich dense cluster of 10 to 14 diverse trees
        const treeCount = 10 + Math.floor(Math.abs(Math.sin(x)) * 5);
        // Position backdrop trees behind soccer field (Z = -82..-90) or behind lake/pasture/house (Z = -54..-62)
        const baseForestZ = isSoccerZone ? -84 : isSpecialHorizonZone ? -56 : -44;

        for (let t = 0; t < treeCount; t++) {
          const tX = xPos + (t * 1.2) - 6 + (Math.sin(t * 13) * 2);
          const tZ = baseForestZ + ((t % 4) * 2.2) + (Math.cos(t * 9) * 1.5);
          
          // Determine tree type based on index / position for high diversity
          const treeType = (t + Math.abs(x)) % 5;
          const isBirch = treeType === 0;
          const isPine = treeType === 1 || treeType === 2;
          const isAutumn = treeType === 3;

          const trunkMat = isBirch ? horizonBirchTrunkMat : horizonTreeTrunkMat;
          const trunk = new THREE.Mesh(horizonTrunkGeo, trunkMat);
          const treeHeightScale = 0.8 + ((t * 7) % 5) * 0.12;
          trunk.position.set(tX, 1.5 * treeHeightScale, tZ);
          trunk.scale.set(1, treeHeightScale, 1);
          forestGroup.add(trunk);

          if (isPine) {
            const pineMat = (t % 2 === 0) ? horizonPineMat : horizonPineMat2;
            const pine = new THREE.Mesh(t % 3 === 0 ? pineGeoSmall : pineGeo, pineMat);
            pine.position.set(tX, 3.2 * treeHeightScale, tZ);
            pine.scale.set(0.9 + (t % 3) * 0.15, treeHeightScale, 0.9 + (t % 3) * 0.15);
            forestGroup.add(pine);
          } else if (isAutumn) {
            const autumnMat = (t % 2 === 0) ? horizonTreeLeavesMat3 : horizonTreeLeavesMat4;
            const leaves = new THREE.Mesh(t % 2 === 0 ? sphereCanopyGeo : horizonLeavesGeo, autumnMat);
            leaves.position.set(tX, 4.0 * treeHeightScale, tZ);
            leaves.scale.set(1.1, 1.3, 1.1);
            forestGroup.add(leaves);
          } else {
            const leafMat = (t % 2 === 0) ? horizonTreeLeavesMat : horizonTreeLeavesMat2;
            const leaves = new THREE.Mesh(t % 3 === 0 ? sphereCanopyGeo : horizonLeavesGeo, leafMat);
            leaves.position.set(tX, 3.8 * treeHeightScale, tZ);
            leaves.scale.set(1.2 + (t % 2) * 0.2, 1.3, 1.2 + (t % 2) * 0.2);
            forestGroup.add(leaves);
          }
        }
        horizonSceneryGroup.add(forestGroup);
        dynamicSceneryItems.push({ group: forestGroup, initialX: xPos, isTree: true, isHorizon: true });
      }

      // Add background herds of animals grazing in the background meadows
      if (hasAnimals) {
        const herdGroup = new THREE.Group();
        const herdSize = 3 + (Math.abs(x) % 3);
        for (let a = 0; a < herdSize; a++) {
          const aX = xPos + (a * 2.5) - 3 + ((a * 7) % 2);
          const aZ = -37 - ((a * 3) % 4);
          const isCow = (a % 2 === 0);

          if (isCow) {
            const body = new THREE.Mesh(cowBodyGeo, cowBodyMat);
            body.position.set(aX, 0.6, aZ);
            herdGroup.add(body);

            const head = new THREE.Mesh(cowHeadGeo, cowBodyMat);
            head.position.set(aX + 1.2, 0.9, aZ);
            herdGroup.add(head);

            [-0.7, 0.7].forEach(lx => {
              [-0.4, 0.4].forEach(lz => {
                const leg = new THREE.Mesh(cowLegGeo, cowSpotMat);
                leg.position.set(aX + lx, 0.45, aZ + lz);
                herdGroup.add(leg);
              });
            });
          } else {
            const body = new THREE.Mesh(sheepBodyGeo, sheepWoolMat);
            body.position.set(aX, 0.5, aZ);
            herdGroup.add(body);

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.7), sheepHeadMat);
            head.position.set(aX + 0.9, 0.6, aZ);
            herdGroup.add(head);

            [-0.5, 0.5].forEach(lx => {
              [-0.3, 0.3].forEach(lz => {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), sheepHeadMat);
                leg.position.set(aX + lx, 0.3, aZ + lz);
                herdGroup.add(leg);
              });
            });
          }
        }
        horizonSceneryGroup.add(herdGroup);
      }
    }

    // 3. Fences & Animals along track sides
    const fenceDarkWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const fenceLightWoodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
    const fenceCapMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
    const flowerMat1 = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const flowerMat2 = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const flowerMat3 = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const grassGreenMat1 = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 }); // emerald
    const grassGreenMat2 = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.75 }); // dark clover
    const grassGreenMat3 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.75 }); // spring green
    const grassGreenMat4 = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.75 }); // sunlit olive

    const fencePostGeo = new THREE.BoxGeometry(0.45, 2.2, 0.45);
    const fencePostCapGeo = new THREE.ConeGeometry(0.35, 0.45, 4);
    const fenceRailGeo = new THREE.BoxGeometry(18.2, 0.22, 0.2);

    const picketGeo = new THREE.BoxGeometry(0.25, 1.5, 0.12);

    [-15.5, 15.5].forEach((zSide) => {
      const fenceAnimalGroup = new THREE.Group();
      for (let x = -260; x <= 260; x += 18) {
        // Skip placing horizon animals & fences where interactive landmarks (cozy house, lake, pigeons, gym, horse pasture, friends circle, soccer field) are located
        if (zSide < 0 && x >= -160 && x <= 220) {
          continue;
        }

        // Main Post (with slight random height variation for rustic look)
        const post = new THREE.Mesh(fencePostGeo, fenceLightWoodMat);
        post.position.set(x, 1.1, zSide);
        post.castShadow = true;
        fenceAnimalGroup.add(post);

        // Post Cap (Pyramid top)
        const cap = new THREE.Mesh(fencePostCapGeo, fenceCapMat);
        cap.position.set(x, 2.25, zSide);
        cap.rotation.y = Math.PI / 4;
        fenceAnimalGroup.add(cap);

        // 3 Horizontal Rails (Top, Middle, Bottom)
        const railTop = new THREE.Mesh(fenceRailGeo, fenceDarkWoodMat);
        railTop.position.set(x + 9, 1.6, zSide);
        fenceAnimalGroup.add(railTop);

        const railMid = new THREE.Mesh(fenceRailGeo, fenceDarkWoodMat);
        railMid.position.set(x + 9, 1.05, zSide);
        fenceAnimalGroup.add(railMid);

        const railBot = new THREE.Mesh(fenceRailGeo, fenceDarkWoodMat);
        railBot.position.set(x + 9, 0.5, zSide);
        fenceAnimalGroup.add(railBot);



        // Vertical Pickets (decorative slats between posts)
        for (let p = 3; p <= 15; p += 3) {
          const picket = new THREE.Mesh(picketGeo, fenceDarkWoodMat);
          picket.position.set(x + p, 0.9, zSide + 0.04);
          fenceAnimalGroup.add(picket);
        }

        // Rich Base Landscaping Along Fence: Multi-tone grass tufts & wildflowers
        const grassTuftMat = (Math.abs(x) % 72 === 0) ? grassGreenMat1 : (Math.abs(x) % 72 === 18) ? grassGreenMat2 : (Math.abs(x) % 72 === 36) ? grassGreenMat3 : grassGreenMat4;
        const grassTuft = new THREE.Mesh(new THREE.SphereGeometry(0.55, 6, 6), grassTuftMat);
        grassTuft.position.set(x - 0.6, 0.25, zSide + (zSide > 0 ? 0.7 : -0.7));
        grassTuft.scale.set(1.4, 0.65, 1.3);
        fenceAnimalGroup.add(grassTuft);

        // Additional staggered tuft on the other side of post with alternate green
        const grassTuft2Mat = (Math.abs(x) % 72 === 0) ? grassGreenMat3 : (Math.abs(x) % 72 === 18) ? grassGreenMat4 : grassGreenMat1;
        const grassTuft2 = new THREE.Mesh(new THREE.SphereGeometry(0.45, 6, 6), grassTuft2Mat);
        grassTuft2.position.set(x + 4.5, 0.2, zSide + (zSide > 0 ? 0.5 : -0.5));
        grassTuft2.scale.set(1.2, 0.55, 1.1);
        fenceAnimalGroup.add(grassTuft2);

        if (Math.abs(x) % 18 === 0) {
          const flMat = (Math.abs(x) % 54 === 0) ? flowerMat1 : (Math.abs(x) % 54 === 18) ? flowerMat2 : flowerMat3;
          const flower1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22), flMat);
          flower1.position.set(x - 0.7, 0.5, zSide + (zSide > 0 ? 0.6 : -0.6));
          fenceAnimalGroup.add(flower1);
        }

        if (Math.abs(x) % 54 === 0) {
          const isCow = (Math.abs(x) % 108 === 0);
          const animalGroup = new THREE.Group();
          const aX = x + 5;
          const aZ = zSide > 0 ? zSide + 3.5 : zSide - 3.5;

          if (isCow) {
            const body = new THREE.Mesh(cowBodyGeo, cowBodyMat);
            body.position.set(aX, 0.6, aZ);
            animalGroup.add(body);

            const head = new THREE.Mesh(cowHeadGeo, cowBodyMat);
            head.position.set(aX + 1.2, 0.9, aZ);
            animalGroup.add(head);

            [-0.7, 0.7].forEach(lx => {
              [-0.4, 0.4].forEach(lz => {
                const leg = new THREE.Mesh(cowLegGeo, cowSpotMat);
                leg.position.set(aX + lx, 0.45, aZ + lz);
                animalGroup.add(leg);
              });
            });
          } else {
            const body = new THREE.Mesh(sheepBodyGeo, sheepWoolMat);
            body.position.set(aX, 0.5, aZ);
            animalGroup.add(body);

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.7), sheepHeadMat);
            head.position.set(aX + 0.9, 0.6, aZ);
            animalGroup.add(head);

            [-0.5, 0.5].forEach(lx => {
              [-0.3, 0.3].forEach(lz => {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), sheepHeadMat);
                leg.position.set(aX + lx, 0.3, aZ + lz);
                animalGroup.add(leg);
              });
            });
          }
          fenceAnimalGroup.add(animalGroup);
        }
      }
      horizonSceneryGroup.add(fenceAnimalGroup);
    });

    scene.add(horizonSceneryGroup);

    // --- PLAYER ROBLOX R15 CASUAL AVATAR WITH HIGH-DEF PBR ---
    const playerGroup = new THREE.Group();

    // High Quality PBR Surface Materials with realistic procedural 8k skin pores texture
    const skinPoreTex = createRealisticSkinTexture();
    const skinMat = new THREE.MeshStandardMaterial({ 
      color: 0xfbd5b3, // Warm realistic skin tone
      bumpMap: skinPoreTex,
      bumpScale: 0.012, // subtle 8k skin micro pores
      roughness: 0.38, 
      metalness: 0.04 
    });
    
    // Determine dynamic character selection
    const characterSelection = selectedCharacter || 'guto';

    let shirtMat: THREE.MeshStandardMaterial;
    let hoodCollarMat: THREE.MeshStandardMaterial;
    let jeansMat: THREE.MeshStandardMaterial;

    if (characterSelection === 'guto') {
      // Guto: Navy Blue Sweatshirt ("Moletom Azul")
      shirtMat = new THREE.MeshStandardMaterial({
        color: 0x0f2b5c, // Deep Navy Blue
        roughness: 0.45,
        metalness: 0.08,
      });
      hoodCollarMat = new THREE.MeshStandardMaterial({
        color: 0x0f2b5c,
        roughness: 0.5,
        metalness: 0.08,
      });
      jeansMat = new THREE.MeshStandardMaterial({
        color: 0x1e3a8a, // Blue Jeans denim
        roughness: 0.6,
        metalness: 0.05,
      });
    } else if (characterSelection === 'leo') {
      // Léo: White T-Shirt
      shirtMat = new THREE.MeshStandardMaterial({
        color: 0xffffff, // Crisp White
        roughness: 0.5,
        metalness: 0.04,
      });
      hoodCollarMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
        metalness: 0.04,
      });
      jeansMat = new THREE.MeshStandardMaterial({
        color: 0x475569, // Gray comfortable shorts
        roughness: 0.65,
        metalness: 0.05,
      });
    } else {
      // Caio: Bright Green T-Shirt under open blue jacket
      shirtMat = new THREE.MeshStandardMaterial({
        color: 0x16a34a, // Green Shirt
        roughness: 0.45,
        metalness: 0.05,
      });
      hoodCollarMat = new THREE.MeshStandardMaterial({
        color: 0x16a34a,
        roughness: 0.45,
        metalness: 0.05,
      });
      jeansMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b, // Stylish dark pants
        roughness: 0.55,
        metalness: 0.05,
      });
    }

    const charcoalSneakerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.2 });
    const whiteSoleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });

    // 1. Torso
    const torsoGroup = new THREE.Group();
    const mainTorsoGeo = new THREE.BoxGeometry(1.85, 2.25, 1.15);
    const mainTorso = new THREE.Mesh(mainTorsoGeo, shirtMat);
    mainTorso.position.y = 2.45;
    mainTorso.castShadow = true;
    torsoGroup.add(mainTorso);

    // Front Kangaroo Hoodie Pocket (Only for Guto's hoodie)
    const pocketGeo = new THREE.BoxGeometry(1.2, 0.7, 0.2);
    const pocket = new THREE.Mesh(pocketGeo, hoodCollarMat);
    pocket.position.set(0, 1.85, 0.55);
    pocket.visible = (characterSelection === 'guto');
    torsoGroup.add(pocket);

    // 3D Hood Collar around Base of Neck (Only for Guto's hoodie)
    const hoodCollarGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.4, 16);
    const hoodCollar = new THREE.Mesh(hoodCollarGeo, hoodCollarMat);
    hoodCollar.position.set(0, 3.5, -0.05);
    hoodCollar.visible = (characterSelection === 'guto');
    torsoGroup.add(hoodCollar);

    // Dynamic chest branding logos ("PESQUISADORES")
    const logoPlaneGeo = new THREE.PlaneGeometry(1.5, 0.75);
    let logoMat: THREE.MeshBasicMaterial | null = null;

    if (characterSelection === 'guto') {
      logoMat = new THREE.MeshBasicMaterial({
        map: createGutoSweatshirtTexture(),
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
    } else if (characterSelection === 'leo') {
      logoMat = new THREE.MeshBasicMaterial({
        map: createLeoShirtTexture(),
        transparent: true,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
    }

    if (logoMat) {
      const logoPlane = new THREE.Mesh(logoPlaneGeo, logoMat);
      logoPlane.position.set(0, 2.45, 0.585);
      torsoGroup.add(logoPlane);
    }

    // Caio's Open Blue Jacket Flaps (Casaco aberto por cima da camiseta verde)
    if (characterSelection === 'caio') {
      const jacketMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4, metalness: 0.1 });
      
      // Left flap
      const leftFlapGeo = new THREE.BoxGeometry(0.48, 2.27, 0.35);
      const leftFlap = new THREE.Mesh(leftFlapGeo, jacketMat);
      leftFlap.position.set(-0.72, 2.45, 0.48);
      torsoGroup.add(leftFlap);

      // Right flap
      const rightFlapGeo = new THREE.BoxGeometry(0.48, 2.27, 0.35);
      const rightFlap = new THREE.Mesh(rightFlapGeo, jacketMat);
      rightFlap.position.set(0.72, 2.45, 0.48);
      torsoGroup.add(rightFlap);

      // Back of Jacket
      const backJacketGeo = new THREE.BoxGeometry(1.88, 2.28, 0.2);
      const backJacket = new THREE.Mesh(backJacketGeo, jacketMat);
      backJacket.position.set(0, 2.45, -0.5);
      torsoGroup.add(backJacket);
    }

    // Léo's Arm Sling (Tipóia straps on chest)
    if (characterSelection === 'leo') {
      const strapMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
      const strap1Geo = new THREE.BoxGeometry(0.12, 1.7, 0.12);
      const strap1 = new THREE.Mesh(strap1Geo, strapMat);
      strap1.position.set(0.55, 2.7, 0.52);
      strap1.rotation.z = -0.55; // angled from shoulder to arm support
      torsoGroup.add(strap1);

      const strap2Geo = new THREE.BoxGeometry(0.12, 1.7, 0.12);
      const strap2 = new THREE.Mesh(strap2Geo, strapMat);
      strap2.position.set(-0.2, 2.9, 0.52);
      strap2.rotation.z = 0.5; // supporting neck loop
      torsoGroup.add(strap2);
    }

    // Garrafa Isotérmica de Chá Calmante & Hidratação Consciente (Camomila & Mel)
    if (playerSkills?.calmingTea) {
      const bottleGroup = new THREE.Group();
      
      // Main insulated flask cylinder (sleek stainless steel / pearl finish)
      const bottleBodyGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.85, 16);
      const bottleBodyMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.85,
        roughness: 0.2,
      });
      const bottleBody = new THREE.Mesh(bottleBodyGeo, bottleBodyMat);
      bottleGroup.add(bottleBody);

      // Chamomile & Honey golden accent band in center
      const bandGeo = new THREE.CylinderGeometry(0.225, 0.225, 0.22, 16);
      const bandMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.5,
        roughness: 0.3,
      });
      const band = new THREE.Mesh(bandGeo, bandMat);
      bottleGroup.add(band);

      // Stainless screw cap & loop handle
      const capGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.2, 16);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.1 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.5;
      bottleGroup.add(cap);

      const loopGeo = new THREE.TorusGeometry(0.09, 0.025, 8, 16);
      const loop = new THREE.Mesh(loopGeo, capMat);
      loop.position.set(0, 0.65, 0);
      bottleGroup.add(loop);

      // Position snugly on right hip/waist of torso
      bottleGroup.position.set(1.18, 2.15, -0.15);
      bottleGroup.rotation.z = -0.15;
      torsoGroup.add(bottleGroup);
    }

    playerGroup.add(torsoGroup);

    // Pre-create and memoize face textures for zero canvas allocation churn during gameplay
    const faceTexLow = getCachedR15FaceTexture(10);
    const faceTexMed = getCachedR15FaceTexture(50);
    const faceTexHigh = getCachedR15FaceTexture(85);
    const soccerBallTexture = getCachedSoccerBallTexture();
    const brickWallTexture = getCachedBrickWallTexture();

    // 2. Head with Animated Facial Micro-Expressions & Multi-Strand 3D Mesh Hair
    const headGroup = new THREE.Group();
    headGroup.position.y = 4.15;

    const headGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Face Plane with Reactive Expression Texture
    const faceGeo = new THREE.PlaneGeometry(1.18, 1.18);
    const faceMat = new THREE.MeshBasicMaterial({
      map: faceTexLow,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    const facePlane = new THREE.Mesh(faceGeo, faceMat);
    facePlane.position.z = 0.62;
    headGroup.add(facePlane);

    // Dynamic hair colors & geometries
    let hairColor = 0x0f172a; // Default black/dark
    if (characterSelection === 'guto') {
      hairColor = 0x5c3818; // Guto: chestnut brown hair
    } else if (characterSelection === 'leo') {
      hairColor = 0x1c1917; // Léo: neat dark charcoal hair
    } else {
      hairColor = 0x271c19; // Caio: curly dark base
    }

    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.45, metalness: 0.1 });
    
    if (characterSelection === 'caio') {
      // Caio's Voluminous Curly Hair with Caramel & Golden Highlights
      const curlyHairGroup = new THREE.Group();
      curlyHairGroup.position.set(0, 0.45, -0.05);

      const darkCurlMat = new THREE.MeshStandardMaterial({ color: 0x1c1410, roughness: 0.88 });
      const caramelHighlightMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6, metalness: 0.2 });
      const goldenHighlightMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, metalness: 0.25 });

      // Structured curls for crown, bangs, temples, and back
      const curlNodes: { x: number; y: number; z: number; r: number; colorType: 'dark' | 'caramel' | 'golden' }[] = [];

      // 1. Crown dome curls
      const crownRings = 4;
      for (let cr = 0; cr < crownRings; cr++) {
        const radius = 0.55 + cr * 0.07;
        const count = 8 + cr * 4;
        for (let c = 0; c < count; c++) {
          const angle = (c / count) * Math.PI * 2;
          const x = Math.cos(angle) * (radius * 0.95);
          const z = Math.sin(angle) * (radius * 0.95);
          const y = 0.55 + Math.sin(c * 1.5) * 0.06 + (cr === 0 ? 0.15 : 0.04);
          const rand = (c + cr) % 5;
          const colorType = rand === 0 ? 'golden' : rand === 1 ? 'caramel' : 'dark';
          curlNodes.push({ x, y, z: z - 0.05, r: 0.19, colorType });
        }
      }

      // 2. Forehead Fringe / Curly Bangs
      const bangs = [-0.36, -0.18, 0, 0.18, 0.36];
      bangs.forEach((bx, idx) => {
        const by = 0.48 - Math.abs(bx) * 0.2;
        const bz = 0.65 - Math.abs(bx) * 0.08;
        curlNodes.push({ x: bx, y: by, z: bz, r: 0.17, colorType: idx % 2 === 0 ? 'caramel' : 'golden' });
      });

      // 3. Side Curls & Temples
      [-0.65, 0.65].forEach((sx, sIdx) => {
        for (let sy = 0; sy < 4; sy++) {
          const y = 0.35 - sy * 0.14;
          const z = 0.15 + (sy % 2) * 0.15;
          curlNodes.push({ x: sx, y, z, r: 0.18, colorType: sIdx === 0 && sy === 1 ? 'caramel' : 'dark' });
        }
      });

      // 4. Back Volume
      for (let by = -0.1; by <= 0.45; by += 0.16) {
        for (let bx = -0.45; bx <= 0.45; bx += 0.22) {
          curlNodes.push({ x: bx, y: by, z: -0.65, r: 0.19, colorType: 'dark' });
        }
      }

      curlNodes.forEach((c) => {
        const mat = c.colorType === 'golden' ? goldenHighlightMat : c.colorType === 'caramel' ? caramelHighlightMat : darkCurlMat;
        const curlMesh = new THREE.Mesh(new THREE.SphereGeometry(c.r, 8, 8), mat);
        curlMesh.position.set(c.x, c.y, c.z);
        curlMesh.scale.set(1.05, 0.95, 1.05);
        curlyHairGroup.add(curlMesh);
      });

      headGroup.add(curlyHairGroup);
    } else {
      // Guto and Léo: Styled classical hair dome
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
    }

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

    // Optional Cap Accessory
    if (playerSkills?.cap) {
      const capHex = playerSkills?.capColor || '#ef4444';
      const capMat = new THREE.MeshStandardMaterial({ color: capHex, roughness: 0.4 });
      const capDomeGeo = new THREE.SphereGeometry(0.66, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const capDome = new THREE.Mesh(capDomeGeo, capMat);
      capDome.position.set(0, 0.45, 0);
      headGroup.add(capDome);

      const brimGeo = new THREE.BoxGeometry(0.95, 0.08, 0.75);
      const brim = new THREE.Mesh(brimGeo, capMat);
      brim.position.set(0, 0.35, 0.68);
      brim.rotation.x = -0.15;
      headGroup.add(brim);
    }

    playerGroup.add(headGroup);

    // 3. Jointed Arms & Smartwatch Accessory
    const upperArmGeo = new THREE.BoxGeometry(0.65, 1.2, 0.65);
    const lowerArmGeo = new THREE.BoxGeometry(0.6, 1.1, 0.6);

    // Dynamic arm sleeve/skin textures depending on character shirt type
    // Guto wears long sweatshirt sleeves, Léo wears short t-shirt sleeves (exposing skin arms), Caio wears green t-shirt sleeves under open jacket
    const leftUpperArmMat = (characterSelection === 'leo') ? shirtMat : ((characterSelection === 'caio') ? shirtMat : shirtMat);
    const leftLowerArmMat = (characterSelection === 'guto') ? shirtMat : skinMat;

    // Left Arm Group
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-1.28, 3.15, 0);
    leftArmGroup.scale.set(0.85, 0.85, 0.85);
    const leftUpperArm = new THREE.Mesh(upperArmGeo, leftUpperArmMat);
    leftUpperArm.position.y = -0.6;
    leftArmGroup.add(leftUpperArm);

    const leftLowerArmGroup = new THREE.Group();
    leftLowerArmGroup.position.y = -1.2;
    const leftLowerArm = new THREE.Mesh(lowerArmGeo, leftLowerArmMat);
    leftLowerArm.position.y = -0.55;
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
    leftHand.position.y = -1.18;
    leftLowerArmGroup.add(leftHand);

    // 3D Gym Dumbbell Prop
    const createDumbbellMesh = () => {
      const db = new THREE.Group();
      const barGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 12);
      const barMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.rotation.z = Math.PI / 2;
      db.add(bar);

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
    leftDumbbell.position.set(0, -1.2, 0.15);
    leftDumbbell.visible = false;
    leftLowerArmGroup.add(leftDumbbell);

    leftArmGroup.add(leftLowerArmGroup);
    playerGroup.add(leftArmGroup);

    // Right Arm Group
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(1.28, 3.15, 0);
    rightArmGroup.scale.set(0.85, 0.85, 0.85);
    const rightUpperArm = new THREE.Mesh(upperArmGeo, leftUpperArmMat);
    rightUpperArm.position.y = -0.6;
    rightArmGroup.add(rightUpperArm);

    const rightLowerArmGroup = new THREE.Group();
    rightLowerArmGroup.position.y = -1.2;
    const rightLowerArm = new THREE.Mesh(lowerArmGeo, leftLowerArmMat);
    rightLowerArm.position.y = -0.55;
    rightLowerArmGroup.add(rightLowerArm);

    // Smartband Anti-Pânico (Treino de Respiração Diafragmática 4-7-8) on Right Wrist
    if (playerSkills?.breathingBand) {
      const smartbandCaseGeo = new THREE.BoxGeometry(0.48, 0.16, 0.48);
      const smartbandCaseMat = new THREE.MeshStandardMaterial({ color: 0x0f2e2e, metalness: 0.85, roughness: 0.2 });
      const smartbandCase = new THREE.Mesh(smartbandCaseGeo, smartbandCaseMat);
      smartbandCase.position.set(0, -0.85, 0.32);
      rightLowerArmGroup.add(smartbandCase);

      const smartbandScreenGeo = new THREE.PlaneGeometry(0.36, 0.36);
      const smartbandScreenMat = new THREE.MeshBasicMaterial({ color: 0x14b8a6 });
      const smartbandScreen = new THREE.Mesh(smartbandScreenGeo, smartbandScreenMat);
      smartbandScreen.rotation.x = -Math.PI / 2;
      smartbandScreen.position.set(0, -0.76, 0.32);
      rightLowerArmGroup.add(smartbandScreen);
    }

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.y = -1.18;
    rightLowerArmGroup.add(rightHand);

    const rightDumbbell = createDumbbellMesh();
    rightDumbbell.position.set(0, -1.2, 0.15);
    rightDumbbell.visible = false;
    rightLowerArmGroup.add(rightDumbbell);

    // Grass/Pasture Feed Prop for feeding horses
    const feedGrassGroup = new THREE.Group();
    const feedGrassMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e, // Vibrant grass green
      roughness: 0.8,
      emissive: 0x15803d,
      emissiveIntensity: 0.15
    });
    const grassStemGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.85, 6);
    for (let i = 0; i < 5; i++) {
      const stem = new THREE.Mesh(grassStemGeo, feedGrassMat);
      const angle = (i * Math.PI * 2) / 5;
      stem.position.set(Math.cos(angle) * 0.12, -0.4, Math.sin(angle) * 0.12);
      stem.rotation.set(0.35, angle, 0.25);
      feedGrassGroup.add(stem);
    }
    const tieMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.9 });
    const tie = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 8, 16), tieMat);
    tie.rotation.x = Math.PI / 2;
    tie.position.y = -0.55;
    feedGrassGroup.add(tie);

    // Position it at hand level pointing out of rightLowerArmGroup
    feedGrassGroup.position.set(0, -1.2, 0.15);
    feedGrassGroup.rotation.set(Math.PI / 2, 0, 0);
    feedGrassGroup.visible = false;
    rightLowerArmGroup.add(feedGrassGroup);

    // Léo's Plaster Cast (Gesso) with drawings & doodles wrapping right lower arm
    if (characterSelection === 'leo') {
      const castMat = new THREE.MeshStandardMaterial({
        map: createArmCastTexture(),
        roughness: 0.75,
        metalness: 0.05,
      });
      const castGeo = new THREE.BoxGeometry(0.72, 0.98, 0.72);
      const castMesh = new THREE.Mesh(castGeo, castMat);
      castMesh.position.y = -0.55;
      castMesh.castShadow = true;
      rightLowerArmGroup.add(castMesh);
    }

    // Caio's Coffee Mug Accessory (holds hot coffee)
    if (characterSelection === 'caio') {
      const mugGroup = new THREE.Group();
      
      const mugBodyGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.48, 12);
      const mugMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.1 });
      const mugBody = new THREE.Mesh(mugBodyGeo, mugMat);
      mugGroup.add(mugBody);

      const mugHandleGeo = new THREE.TorusGeometry(0.14, 0.04, 6, 12);
      const mugHandle = new THREE.Mesh(mugHandleGeo, mugMat);
      mugHandle.position.set(0.24, 0, 0);
      mugGroup.add(mugHandle);

      const coffeeGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.02, 12);
      const coffeeMat = new THREE.MeshBasicMaterial({ color: 0x3b2314 });
      const coffeeMesh = new THREE.Mesh(coffeeGeo, coffeeMat);
      coffeeMesh.position.y = 0.21;
      mugGroup.add(coffeeMesh);

      mugGroup.position.set(0, -1.35, 0.15);
      mugGroup.rotation.x = Math.PI / 2;
      rightLowerArmGroup.add(mugGroup);
    }

    rightArmGroup.add(rightLowerArmGroup);
    playerGroup.add(rightArmGroup);

    // 4. Classic Denim Jeans & Sneakers (Pernas de comprimento proporcional)
    const upperLegGeo = new THREE.BoxGeometry(0.76, 1.32, 0.76);
    const lowerLegGeo = new THREE.BoxGeometry(0.72, 1.26, 0.72);

    // Léo wears shorts, so lower legs are skin colored. Others wear long pants.
    const lowerLegMat = (characterSelection === 'leo') ? skinMat : jeansMat;

    // Left Leg Group
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.52, 2.35, 0);
    const leftUpperLeg = new THREE.Mesh(upperLegGeo, jeansMat);
    leftUpperLeg.position.y = -0.66;
    leftLegGroup.add(leftUpperLeg);

    const leftLowerLegGroup = new THREE.Group();
    leftLowerLegGroup.position.y = -1.32;
    const leftLowerLeg = new THREE.Mesh(lowerLegGeo, lowerLegMat);
    leftLowerLeg.position.y = -0.63;
    leftLowerLegGroup.add(leftLowerLeg);

    // Left Shoe
    const shoeBodyGeo = new THREE.BoxGeometry(0.82, 0.52, 1.35);
    const shoeSoleGeo = new THREE.BoxGeometry(0.86, 0.22, 1.38);
    const leftShoe = new THREE.Mesh(shoeBodyGeo, charcoalSneakerMat);
    leftShoe.position.set(0, -1.32, 0.18);
    const leftSole = new THREE.Mesh(shoeSoleGeo, whiteSoleMat);
    leftSole.position.set(0, -1.50, 0.18);
    leftLowerLegGroup.add(leftShoe);
    leftLowerLegGroup.add(leftSole);

    leftLegGroup.add(leftLowerLegGroup);
    playerGroup.add(leftLegGroup);

    // Right Leg Group
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.52, 2.35, 0);
    const rightUpperLeg = new THREE.Mesh(upperLegGeo, jeansMat);
    rightUpperLeg.position.y = -0.66;
    rightLegGroup.add(rightUpperLeg);

    const rightLowerLegGroup = new THREE.Group();
    rightLowerLegGroup.position.y = -1.32;
    const rightLowerLeg = new THREE.Mesh(lowerLegGeo, lowerLegMat);
    rightLowerLeg.position.y = -0.63;
    rightLowerLegGroup.add(rightLowerLeg);

    // Right Shoe
    const rightShoe = new THREE.Mesh(shoeBodyGeo, charcoalSneakerMat);
    rightShoe.position.set(0, -1.32, 0.18);
    const rightSole = new THREE.Mesh(shoeSoleGeo, whiteSoleMat);
    rightSole.position.set(0, -1.50, 0.18);
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

    // --- 3D FISHING ROD PROP ON AVATAR (VARA DE PESCAR) ---
    const fishingRodGroup = new THREE.Group();
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const rodTipMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xd97706, emissiveIntensity: 0.6 });
    const rodHandleMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 });

    const rodHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), rodHandleMat);
    rodHandle.position.set(0, 0.4, 0);
    fishingRodGroup.add(rodHandle);

    const rodPole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.065, 3.2, 8), rodMat);
    rodPole.position.set(0, 2.0, 0);
    fishingRodGroup.add(rodPole);

    const rodTip = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), rodTipMat);
    rodTip.position.set(0, 3.6, 0);
    fishingRodGroup.add(rodTip);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.8 });
    const fishingLine = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 3.8, 4), lineMat);
    fishingLine.position.set(0, 1.9, 1.3);
    fishingLine.rotation.x = 0.32;
    fishingRodGroup.add(fishingLine);

    const floatMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xd97706, emissiveIntensity: 0.8 });
    const fishingBober = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), floatMat);
    fishingBober.position.set(0, 0.1, 2.5);
    fishingRodGroup.add(fishingBober);

    fishingRodGroup.position.set(0.6, 2.2, 0.4);
    fishingRodGroup.rotation.set(0.8, 0.2, -0.2);
    fishingRodGroup.visible = false;
    playerGroup.add(fishingRodGroup);

    // --- VEHICLES (Bicycle, Skate, Patinete) PROPORTIONAL TO R15 AVATAR ---
    const activeVehInitial = playerSkillsRef.current?.activeVehicle || (playerSkillsRef.current?.bicycle ? 'bicycle' : 'none');

    // Helper to create tubular cylinders connecting point A to point B
    const createFrameTube = (from: [number, number, number], to: [number, number, number], radius: number, mat: THREE.Material) => {
      const vFrom = new THREE.Vector3(...from);
      const vTo = new THREE.Vector3(...to);
      const dist = vFrom.distanceTo(vTo);
      const geo = new THREE.CylinderGeometry(radius, radius, dist, 8);
      const mesh = new THREE.Mesh(geo, mat);
      const mid = new THREE.Vector3().addVectors(vFrom, vTo).multiplyScalar(0.5);
      mesh.position.copy(mid);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vTo.clone().sub(vFrom).normalize());
      return mesh;
    };

    // 1. BICICLETA URBANA (High-Fidelity Urban Bicycle)
    const bicycleGroup = new THREE.Group();
    const bikeFrameMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.85 }); // Electric Azure
    const bikeDarkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7 });
    const bikeTireMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.85, metalness: 0.05 });
    const bikeRimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const bikeSaddleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 });
    const bikeGripMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const bikeReflectorMat = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 0.9 });

    const createBicycleWheelMesh = () => {
      const wGroup = new THREE.Group();
      // Outer Rubber Tire
      const tireGeo = new THREE.TorusGeometry(0.88, 0.11, 12, 32);
      const tire = new THREE.Mesh(tireGeo, bikeTireMat);
      wGroup.add(tire);
      // Aluminum Rim
      const rimGeo = new THREE.TorusGeometry(0.78, 0.045, 8, 32);
      const rim = new THREE.Mesh(rimGeo, bikeRimMat);
      wGroup.add(rim);
      // Central Hub
      const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.24, 12);
      hubGeo.rotateZ(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeo, bikeRimMat);
      wGroup.add(hub);
      // Crossed Spokes (8 pairs)
      const spokeGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.55, 4);
      for (let i = 0; i < 8; i++) {
        const spoke = new THREE.Mesh(spokeGeo, bikeRimMat);
        spoke.rotation.z = (i * Math.PI) / 8;
        wGroup.add(spoke);
      }
      // Safety Wheel Reflector
      const refGeo = new THREE.BoxGeometry(0.08, 0.22, 0.04);
      const reflector = new THREE.Mesh(refGeo, bikeReflectorMat);
      reflector.position.set(0, 0.5, 0);
      wGroup.add(reflector);
      return wGroup;
    };

    // Front Wheel (z = 1.6, y = 0.9)
    const bikeFrontWheel = createBicycleWheelMesh();
    bikeFrontWheel.position.set(0, 0.9, 1.6);
    bikeFrontWheel.rotation.y = Math.PI / 2;
    bicycleGroup.add(bikeFrontWheel);

    // Rear Wheel (z = -1.6, y = 0.9)
    const bikeRearWheel = createBicycleWheelMesh();
    bikeRearWheel.position.set(0, 0.9, -1.6);
    bikeRearWheel.rotation.y = Math.PI / 2;
    bicycleGroup.add(bikeRearWheel);

    // Realistic Diamond Frame Tubes
    // Seat Tube (BB -> SC)
    bicycleGroup.add(createFrameTube([0, 0.9, -0.35], [0, 2.18, -0.48], 0.065, bikeFrameMat));
    // Top Tube (SC -> HT_TOP)
    bicycleGroup.add(createFrameTube([0, 2.18, -0.48], [0, 2.55, 1.22], 0.06, bikeFrameMat));
    // Down Tube (BB -> HT_BOT)
    bicycleGroup.add(createFrameTube([0, 0.9, -0.35], [0, 2.15, 1.35], 0.07, bikeFrameMat));
    // Head Tube (HT_BOT -> HT_TOP)
    bicycleGroup.add(createFrameTube([0, 2.15, 1.35], [0, 2.58, 1.20], 0.075, bikeFrameMat));
    // Chain Stays (BB -> RA)
    bicycleGroup.add(createFrameTube([-0.18, 0.9, -0.35], [-0.15, 0.9, -1.6], 0.045, bikeDarkMat));
    bicycleGroup.add(createFrameTube([0.18, 0.9, -0.35], [0.15, 0.9, -1.6], 0.045, bikeDarkMat));
    // Seat Stays (SC -> RA)
    bicycleGroup.add(createFrameTube([-0.12, 2.18, -0.48], [-0.15, 0.9, -1.6], 0.045, bikeDarkMat));
    bicycleGroup.add(createFrameTube([0.12, 2.18, -0.48], [0.15, 0.9, -1.6], 0.045, bikeDarkMat));
    // Front Fork (HT_BOT -> FA)
    bicycleGroup.add(createFrameTube([-0.15, 2.15, 1.35], [-0.15, 0.9, 1.6], 0.05, bikeDarkMat));
    bicycleGroup.add(createFrameTube([0.15, 2.15, 1.35], [0.15, 0.9, 1.6], 0.05, bikeDarkMat));

    // Seat Post & Sporty Ergonomic Saddle (at z = -0.52, y = 2.34)
    bicycleGroup.add(createFrameTube([0, 2.15, -0.48], [0, 2.32, -0.52], 0.05, bikeRimMat));
    const saddleGeo = new THREE.BoxGeometry(0.48, 0.12, 0.85);
    const bikeSaddle = new THREE.Mesh(saddleGeo, bikeSaddleMat);
    bikeSaddle.position.set(0, 2.34, -0.52);
    bikeSaddle.rotation.x = -0.05;
    bicycleGroup.add(bikeSaddle);

    // Stem & Handlebars Assembly (at z = 1.28, y = 2.75)
    bicycleGroup.add(createFrameTube([0, 2.58, 1.20], [0, 2.75, 1.28], 0.055, bikeRimMat));
    const handlebarGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.85, 12);
    handlebarGeo.rotateZ(Math.PI / 2);
    const handlebar = new THREE.Mesh(handlebarGeo, bikeRimMat);
    handlebar.position.set(0, 2.75, 1.28);
    bicycleGroup.add(handlebar);

    [-0.82, 0.82].forEach((gx) => {
      const gripGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.32, 12);
      gripGeo.rotateZ(Math.PI / 2);
      const grip = new THREE.Mesh(gripGeo, bikeGripMat);
      grip.position.set(gx, 2.75, 1.28);
      bicycleGroup.add(grip);
    });

    // Front Headlight on Handlebars
    const bikeLightGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 12);
    bikeLightGeo.rotateX(Math.PI / 2);
    const bikeLight = new THREE.Mesh(bikeLightGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe0f2fe, emissiveIntensity: 1.0 }));
    bikeLight.position.set(0, 2.72, 1.42);
    bicycleGroup.add(bikeLight);

    // Rotating Crankset & Pedals Group (at Bottom Bracket: [0, 0.9, -0.35])
    const bikeCranksetGroup = new THREE.Group();
    bikeCranksetGroup.position.set(0, 0.9, -0.35);

    const chainringGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 16);
    chainringGeo.rotateZ(Math.PI / 2);
    const chainring = new THREE.Mesh(chainringGeo, bikeRimMat);
    bikeCranksetGroup.add(chainring);

    // Left Crank & Pedal (-X)
    const leftCrank = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 0.05), bikeRimMat);
    leftCrank.position.set(-0.32, -0.18, 0);
    bikeCranksetGroup.add(leftCrank);
    const leftPedal = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.28), bikeGripMat);
    leftPedal.position.set(-0.45, -0.36, 0);
    bikeCranksetGroup.add(leftPedal);

    // Right Crank & Pedal (+X, 180° opposite)
    const rightCrank = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 0.05), bikeRimMat);
    rightCrank.position.set(0.32, 0.18, 0);
    bikeCranksetGroup.add(rightCrank);
    const rightPedal = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.28), bikeGripMat);
    rightPedal.position.set(0.45, 0.36, 0);
    bikeCranksetGroup.add(rightPedal);

    bicycleGroup.add(bikeCranksetGroup);

    bicycleGroup.visible = activeVehInitial === 'bicycle';
    playerGroup.add(bicycleGroup);

    // 2. SKATEBOARD (High-Fidelity Street Skateboard)
    const skateGroup = new THREE.Group();
    const gripTapeMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95, metalness: 0.05 });
    const skateGraphicMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3, metalness: 0.2 }); // Streetwear Orange
    const skateTruckMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
    const skateWheelMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35, metalness: 0.1 });

    // Deck Center Body (Width 1.25, Length 2.1, Thickness 0.08)
    const deckCenter = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 2.1), skateGraphicMat);
    deckCenter.position.set(0, 0.22, 0);
    skateGroup.add(deckCenter);

    const gripCenter = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 2.08), gripTapeMat);
    gripCenter.rotation.x = -Math.PI / 2;
    gripCenter.position.set(0, 0.262, 0);
    skateGroup.add(gripCenter);

    const gripStripe = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 2.08), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    gripStripe.rotation.x = -Math.PI / 2;
    gripStripe.position.set(0, 0.263, 0);
    skateGroup.add(gripStripe);

    // Nose Kicktail (Front, z = +1.32)
    const noseTail = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.08, 0.65), skateGraphicMat);
    noseTail.position.set(0, 0.28, 1.32);
    noseTail.rotation.x = -0.22;
    skateGroup.add(noseTail);

    const noseGrip = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.64), gripTapeMat);
    noseGrip.rotation.x = -Math.PI / 2 - 0.22;
    noseGrip.position.set(0, 0.323, 1.32);
    skateGroup.add(noseGrip);

    // Tail Kicktail (Back, z = -1.32)
    const backTail = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.08, 0.65), skateGraphicMat);
    backTail.position.set(0, 0.28, -1.32);
    backTail.rotation.x = 0.22;
    skateGroup.add(backTail);

    const backGrip = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.64), gripTapeMat);
    backGrip.rotation.x = -Math.PI / 2 + 0.22;
    backGrip.position.set(0, 0.323, -1.32);
    skateGroup.add(backGrip);

    // Trucks and 4 Polyurethane Wheels
    const skateWheelsList: THREE.Mesh[] = [];
    [-0.95, 0.95].forEach((tz) => {
      const truckBase = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.35), skateTruckMat);
      truckBase.position.set(0, 0.17, tz);
      skateGroup.add(truckBase);

      const truckAxle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.15, 8), skateTruckMat);
      truckAxle.rotation.z = Math.PI / 2;
      truckAxle.position.set(0, 0.11, tz);
      skateGroup.add(truckAxle);

      [-0.54, 0.54].forEach((wx) => {
        const sWheelGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.18, 16);
        sWheelGeo.rotateZ(Math.PI / 2);
        const sw = new THREE.Mesh(sWheelGeo, skateWheelMat);
        sw.position.set(wx, 0.11, tz);
        skateGroup.add(sw);
        skateWheelsList.push(sw);
      });
    });

    skateGroup.visible = activeVehInitial === 'skate';
    playerGroup.add(skateGroup);

    // 3. PATINETE ELÉTRICO (High-Tech Commuter Electric Scooter)
    const patineteGroup = new THREE.Group();
    const pChassisMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const pTealAccentMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.25, metalness: 0.6 });
    const pGripDeckMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const pLedCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const pBrakeRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 0.95 });
    const pHeadlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Deck Base Body (Width 1.15, Length 2.7, Deck Top at y = 0.29)
    const pDeckMesh = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.14, 2.7), pChassisMat);
    pDeckMesh.position.set(0, 0.22, 0.1);
    patineteGroup.add(pDeckMesh);

    const pFootbed = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.04, 2.5), pGripDeckMat);
    pFootbed.position.set(0, 0.295, 0.1);
    patineteGroup.add(pFootbed);

    // Glowing Cyan Chassis LED Underglow Strips
    [-0.56, 0.56].forEach((lx) => {
      const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 2.4), pLedCyanMat);
      ledStrip.position.set(lx, 0.18, 0.1);
      patineteGroup.add(ledStrip);
    });

    // Rear Fender with Red Brake Light
    const rearFender = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.24, 16, 1, true, 0, Math.PI * 0.65), pChassisMat);
    rearFender.rotation.z = Math.PI / 2;
    rearFender.rotation.y = -Math.PI / 2;
    rearFender.position.set(0, 0.38, -1.35);
    patineteGroup.add(rearFender);

    const brakeLight = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.06), pBrakeRedMat);
    brakeLight.position.set(0, 0.42, -1.58);
    patineteGroup.add(brakeLight);

    // Pneumatic Wheels
    const createScooterWheelMesh = () => {
      const w = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.11, 12, 24), bikeTireMat);
      w.add(tire);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 16), bikeRimMat);
      rim.rotation.z = Math.PI / 2;
      w.add(rim);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 12), bikeRimMat);
      disc.rotation.z = Math.PI / 2;
      disc.position.x = 0.09;
      w.add(disc);
      return w;
    };

    const pFrontWheel = createScooterWheelMesh();
    pFrontWheel.position.set(0, 0.35, 1.45);
    pFrontWheel.rotation.y = Math.PI / 2;
    patineteGroup.add(pFrontWheel);

    const pRearWheel = createScooterWheelMesh();
    pRearWheel.position.set(0, 0.35, -1.35);
    pRearWheel.rotation.y = Math.PI / 2;
    patineteGroup.add(pRearWheel);

    // Front Fork & Stem Tube (Rising to y = 2.45 at z = 1.15)
    [-0.16, 0.16].forEach((fx) => {
      patineteGroup.add(createFrameTube([fx, 0.35, 1.45], [fx, 0.85, 1.38], 0.045, pChassisMat));
    });
    patineteGroup.add(createFrameTube([0, 0.85, 1.38], [0, 2.45, 1.15], 0.065, pTealAccentMat));

    // T-Bar Handlebar (Width 1.9 at y = 2.45, z = 1.15)
    const pBarGeo = new THREE.CylinderGeometry(0.048, 0.048, 1.9, 12);
    pBarGeo.rotateZ(Math.PI / 2);
    const pBarMesh = new THREE.Mesh(pBarGeo, pChassisMat);
    pBarMesh.position.set(0, 2.45, 1.15);
    patineteGroup.add(pBarMesh);

    [-0.82, 0.82].forEach((gx) => {
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.32, 12), bikeGripMat);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(gx, 2.45, 1.15);
      patineteGroup.add(grip);
    });

    // Central Digital LCD Dashboard
    const dashCase = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.22), pChassisMat);
    dashCase.position.set(0, 2.48, 1.15);
    dashCase.rotation.x = -0.35;
    patineteGroup.add(dashCase);

    const dashScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.14), pLedCyanMat);
    dashScreen.rotation.x = -Math.PI / 2 - 0.35;
    dashScreen.position.set(0, 2.545, 1.15);
    patineteGroup.add(dashScreen);

    // Front High-Beam LED Headlight
    const pHeadlight = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 12), pHeadlightMat);
    pHeadlight.rotation.x = Math.PI / 2;
    pHeadlight.position.set(0, 2.32, 1.25);
    patineteGroup.add(pHeadlight);

    patineteGroup.visible = activeVehInitial === 'patinete';
    playerGroup.add(patineteGroup);

    // =========================================================================
    // 🚲 3 BICYCLES LEANING AGAINST TREES (NEAR GYM ACADEMY ~50 UNITS AWAY)
    // =========================================================================
    const createStandaloneBicycleMesh = (frameColorHex: number, accentColorHex: number = 0x0f172a) => {
      const bGroup = new THREE.Group();
      const frameMat = new THREE.MeshStandardMaterial({ color: frameColorHex, roughness: 0.2, metalness: 0.85 });
      const darkMat = new THREE.MeshStandardMaterial({ color: accentColorHex, roughness: 0.3, metalness: 0.7 });
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.85, metalness: 0.05 });
      const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
      const saddleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 });
      const gripMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
      const reflectorMat = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 0.9 });

      const createWheel = () => {
        const wGroup = new THREE.Group();
        const tireGeo = new THREE.TorusGeometry(0.88, 0.11, 12, 32);
        const tire = new THREE.Mesh(tireGeo, tireMat);
        wGroup.add(tire);
        const rimGeo = new THREE.TorusGeometry(0.78, 0.045, 8, 32);
        const rim = new THREE.Mesh(rimGeo, rimMat);
        wGroup.add(rim);
        const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.24, 12);
        hubGeo.rotateZ(Math.PI / 2);
        const hub = new THREE.Mesh(hubGeo, rimMat);
        wGroup.add(hub);
        const spokeGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.55, 4);
        for (let i = 0; i < 8; i++) {
          const spoke = new THREE.Mesh(spokeGeo, rimMat);
          spoke.rotation.z = (i * Math.PI) / 8;
          wGroup.add(spoke);
        }
        const refGeo = new THREE.BoxGeometry(0.08, 0.22, 0.04);
        const reflector = new THREE.Mesh(refGeo, reflectorMat);
        reflector.position.set(0, 0.5, 0);
        wGroup.add(reflector);
        return wGroup;
      };

      const frontWheel = createWheel();
      frontWheel.position.set(0, 0.9, 1.6);
      frontWheel.rotation.y = Math.PI / 2;
      bGroup.add(frontWheel);

      const rearWheel = createWheel();
      rearWheel.position.set(0, 0.9, -1.6);
      rearWheel.rotation.y = Math.PI / 2;
      bGroup.add(rearWheel);

      // Frame Tubes
      bGroup.add(createFrameTube([0, 0.9, -0.35], [0, 2.18, -0.48], 0.065, frameMat));
      bGroup.add(createFrameTube([0, 2.18, -0.48], [0, 2.55, 1.22], 0.06, frameMat));
      bGroup.add(createFrameTube([0, 0.9, -0.35], [0, 2.15, 1.35], 0.07, frameMat));
      bGroup.add(createFrameTube([0, 2.15, 1.35], [0, 2.58, 1.20], 0.075, frameMat));
      bGroup.add(createFrameTube([-0.18, 0.9, -0.35], [-0.15, 0.9, -1.6], 0.045, darkMat));
      bGroup.add(createFrameTube([0.18, 0.9, -0.35], [0.15, 0.9, -1.6], 0.045, darkMat));
      bGroup.add(createFrameTube([-0.12, 2.18, -0.48], [-0.15, 0.9, -1.6], 0.045, darkMat));
      bGroup.add(createFrameTube([0.12, 2.18, -0.48], [0.15, 0.9, -1.6], 0.045, darkMat));
      bGroup.add(createFrameTube([-0.15, 2.15, 1.35], [-0.15, 0.9, 1.6], 0.05, darkMat));
      bGroup.add(createFrameTube([0.15, 2.15, 1.35], [0.15, 0.9, 1.6], 0.05, darkMat));

      // Saddle
      bGroup.add(createFrameTube([0, 2.15, -0.48], [0, 2.32, -0.52], 0.05, rimMat));
      const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.85), saddleMat);
      saddle.position.set(0, 2.34, -0.52);
      saddle.rotation.x = -0.05;
      bGroup.add(saddle);

      // Handlebars
      bGroup.add(createFrameTube([0, 2.58, 1.20], [0, 2.75, 1.28], 0.055, rimMat));
      const handlebarGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.85, 12);
      handlebarGeo.rotateZ(Math.PI / 2);
      const handlebar = new THREE.Mesh(handlebarGeo, rimMat);
      handlebar.position.set(0, 2.75, 1.28);
      bGroup.add(handlebar);

      [-0.82, 0.82].forEach((gx) => {
        const gripGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.32, 12);
        gripGeo.rotateZ(Math.PI / 2);
        const grip = new THREE.Mesh(gripGeo, gripMat);
        grip.position.set(gx, 2.75, 1.28);
        bGroup.add(grip);
      });

      // Front Headlight
      const bikeLightGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 12);
      bikeLightGeo.rotateX(Math.PI / 2);
      const bikeLight = new THREE.Mesh(bikeLightGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe0f2fe, emissiveIntensity: 1.0 }));
      bikeLight.position.set(0, 2.72, 1.42);
      bGroup.add(bikeLight);

      // Crankset & Pedals
      const crankGroup = new THREE.Group();
      crankGroup.position.set(0, 0.9, -0.35);
      const chainringGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 16);
      chainringGeo.rotateZ(Math.PI / 2);
      crankGroup.add(new THREE.Mesh(chainringGeo, rimMat));

      const leftCrank = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 0.05), rimMat);
      leftCrank.position.set(-0.32, -0.18, 0);
      crankGroup.add(leftCrank);
      const leftPedal = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.28), gripMat);
      leftPedal.position.set(-0.45, -0.36, 0);
      crankGroup.add(leftPedal);

      const rightCrank = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 0.05), rimMat);
      rightCrank.position.set(0.32, 0.18, 0);
      crankGroup.add(rightCrank);
      const rightPedal = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.28), gripMat);
      rightPedal.position.set(0.45, 0.36, 0);
      crankGroup.add(rightPedal);

      bGroup.add(crankGroup);
      return bGroup;
    };

    // --- BICICLETÁRIO MODERNO (4 VAGAS / 2 BICICLETAS DISPONÍVEIS) ---
    // Localizado ao fundo próximo à cerca que separa a rua do campo de futebol (X = 66.0, Z = -4.2)
    interface BikeRackStation {
      group: THREE.Group;
      baseX: number;
      baseZ: number;
      relOffsetFromGym: number;
      ringMesh: THREE.Mesh;
      lastUsedTime: number;
    }

    let bikeRackStation: BikeRackStation | null = null;
    const parkBicyclesGroup = new THREE.Group();
    parkBicyclesGroup.name = 'parkBicyclesGroup';

    const createBikeRackStation = (): BikeRackStation => {
      const rackGroup = new THREE.Group();
      rackGroup.position.set(34.0, 0, -4.2);

      // 1. Base Pavimentada do Bicicletário (Concreto urbano com meio-fio chanfrado)
      const baseGeo = new THREE.BoxGeometry(8.6, 0.2, 3.4);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.85,
        metalness: 0.15,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.set(0, 0.1, 0);
      baseMesh.receiveShadow = true;
      rackGroup.add(baseMesh);

      // Meio-fio de acabamento em granito
      const curbGeo = new THREE.BoxGeometry(8.9, 0.22, 0.22);
      const curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
      const curbFront = new THREE.Mesh(curbGeo, curbMat);
      curbFront.position.set(0, 0.11, 1.7);
      rackGroup.add(curbFront);

      // 2. Demarcações e Faixas Pintadas no Piso (4 Vagas)
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const slotXOffsets = [-2.85, -0.95, 0.95, 2.85];

      // Linhas divisórias das 4 vagas
      [-3.8, -1.9, 0, 1.9, 3.8].forEach((lx) => {
        const divLine = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 2.8), lineMat);
        divLine.rotation.x = -Math.PI / 2;
        divLine.position.set(lx, 0.205, 0);
        rackGroup.add(divLine);
      });

      // Linha frontal amarela de segurança
      const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const frontWarningLine = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 0.1), yellowLineMat);
      frontWarningLine.rotation.x = -Math.PI / 2;
      frontWarningLine.position.set(0, 0.206, 1.4);
      rackGroup.add(frontWarningLine);

      // 3. Suportes Metálicos de Bicicleta (Inverted-U Bike Racks em Aço Inox para as 4 Vagas)
      const metalRackMat = new THREE.MeshStandardMaterial({
        color: 0xcfd8dc,
        metalness: 0.9,
        roughness: 0.18,
      });
      const tubeRadius = 0.045;
      const rackHeight = 1.35;
      const rackWidth = 0.95;

      const createInvertedUHoop = () => {
        const hoopGroup = new THREE.Group();
        // Coluna Esquerda
        const postL = new THREE.Mesh(new THREE.CylinderGeometry(tubeRadius, tubeRadius, rackHeight, 12), metalRackMat);
        postL.position.set(0, rackHeight / 2, -rackWidth / 2);
        hoopGroup.add(postL);

        // Coluna Direita
        const postR = new THREE.Mesh(new THREE.CylinderGeometry(tubeRadius, tubeRadius, rackHeight, 12), metalRackMat);
        postR.position.set(0, rackHeight / 2, rackWidth / 2);
        hoopGroup.add(postR);

        // Barra Superior
        const topBar = new THREE.Mesh(new THREE.CylinderGeometry(tubeRadius, tubeRadius, rackWidth, 12), metalRackMat);
        topBar.rotation.x = Math.PI / 2;
        topBar.position.set(0, rackHeight, 0);
        hoopGroup.add(topBar);

        // Barra Transversal de Bloqueio/Trava
        const midBar = new THREE.Mesh(new THREE.CylinderGeometry(tubeRadius * 0.8, tubeRadius * 0.8, rackWidth, 12), metalRackMat);
        midBar.rotation.x = Math.PI / 2;
        midBar.position.set(0, rackHeight * 0.55, 0);
        hoopGroup.add(midBar);

        // Flanges de fixação no chão com parafusos
        const flangeGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.04, 12);
        [-rackWidth / 2, rackWidth / 2].forEach((fz) => {
          const flange = new THREE.Mesh(flangeGeo, metalRackMat);
          flange.position.set(0, 0.02, fz);
          hoopGroup.add(flange);
        });

        return hoopGroup;
      };

      // Instancia os 4 suportes em cada uma das 4 vagas
      slotXOffsets.forEach((posX, index) => {
        const hoop = createInvertedUHoop();
        hoop.position.set(posX, 0.2, 0);
        rackGroup.add(hoop);

        // Status LED no piso (Verde para vagas com bike disponível, Âmbar para vagas livres)
        const isOccupied = index === 0 || index === 2; // Apenas Vaga 1 e Vaga 3 têm bicicleta disponível
        const ledMat = new THREE.MeshBasicMaterial({
          color: isOccupied ? 0x22c55e : 0x38bdf8,
        });
        const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), ledMat);
        ledMesh.position.set(posX, 0.25, 1.45);
        rackGroup.add(ledMesh);
      });

      // 4. DUAS BICICLETAS DISPONÍVEIS PARA RETIRADA (Vaga 1: Azul Elétrico | Vaga 3: Verde Esmeralda)
      // Vaga 1 (Slot 0, posX = -2.85)
      const bike1 = createStandaloneBicycleMesh(0x0284c7);
      bike1.scale.set(0.68, 0.68, 0.68);
      bike1.position.set(slotXOffsets[0], 0.25, 0);
      bike1.rotation.set(0, Math.PI / 2, 0); // Encaixada no rack perpendicularmente
      rackGroup.add(bike1);

      // Trava de segurança no suporte 1
      const lockMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 });
      const lock1 = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 16), lockMat);
      lock1.position.set(slotXOffsets[0], 0.85, 0);
      lock1.rotation.y = Math.PI / 2;
      rackGroup.add(lock1);

      // Vaga 3 (Slot 2, posX = 0.95)
      const bike2 = createStandaloneBicycleMesh(0x10b981);
      bike2.scale.set(0.68, 0.68, 0.68);
      bike2.position.set(slotXOffsets[2], 0.25, 0);
      bike2.rotation.set(0, Math.PI / 2, 0); // Encaixada no rack perpendicularmente
      rackGroup.add(bike2);

      // Trava de segurança no suporte 3
      const lock2 = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 16), lockMat);
      lock2.position.set(slotXOffsets[2], 0.85, 0);
      lock2.rotation.y = Math.PI / 2;
      rackGroup.add(lock2);

      // (As Vagas 2 e 4 ficam intencionalmente vazias, exibindo capacidade total de 4 com 2 disponíveis)

      // 5. Halo Luminoso de Ativação no Piso
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const ringMesh = new THREE.Mesh(new THREE.RingGeometry(3.6, 4.1, 32), ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(0, 0.22, 0.5);
      rackGroup.add(ringMesh);

      parkBicyclesGroup.add(rackGroup);

      return {
        group: rackGroup,
        baseX: 34.0,
        baseZ: -4.2,
        relOffsetFromGym: 34.0,
        ringMesh,
        lastUsedTime: -999,
      };
    };

    bikeRackStation = createBikeRackStation();
    scene.add(parkBicyclesGroup);

    // --- LAGO DE PESCA RECREATIVO E TERAPÊUTICO (PRÓXIMO À ACADEMIA AO FUNDO • Z = -26.0) ---
    const lakeGroup = new THREE.Group();
    // Positioned safely behind back fence at X = -90.0, Z = -26.0
    lakeGroup.position.set(-90.0, 0, -26.0);
    scene.add(lakeGroup);

    // 1. Lake Mudbed Basin (Raio de 13.0 unidades - margem em Z = -13.0, bem atrás da cerca Z = -3.5)
    const lakeBasinGeo = new THREE.CylinderGeometry(13.0, 14.0, 2.2, 32);
    const lakeBasinMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.1,
    });
    const lakeBasin = new THREE.Mesh(lakeBasinGeo, lakeBasinMat);
    lakeBasin.position.set(0, -1.1, 0);
    lakeGroup.add(lakeBasin);

    // 2. Sparkling Lake Water Surface (Raio de 12.5 unidades)
    const lakeWaterGeo = new THREE.CircleGeometry(12.5, 32);
    const lakeWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant azure blue water
      emissive: 0x0369a1,
      emissiveIntensity: 0.2,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const lakeWater = new THREE.Mesh(lakeWaterGeo, lakeWaterMat);
    lakeWater.rotation.x = -Math.PI / 2;
    lakeWater.position.set(0, 0.02, 0);
    lakeWater.receiveShadow = true;
    lakeGroup.add(lakeWater);

    // Underwater Caustic Ring
    const causticRingGeo = new THREE.RingGeometry(5.0, 11.5, 32);
    const causticRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const causticRing = new THREE.Mesh(causticRingGeo, causticRingMat);
    causticRing.rotation.x = -Math.PI / 2;
    causticRing.position.set(0, -0.15, 0);
    lakeGroup.add(causticRing);

    // Shore Rocks & Pebbles around Lake Edge
    const lakeRockGeo = new THREE.DodecahedronGeometry(0.65, 1);
    const lakeRockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
      if (a > Math.PI * 0.35 && a < Math.PI * 0.65) continue; // Keep dock entrance open
      const rx = Math.cos(a) * 12.8 + (Math.random() - 0.5) * 0.8;
      const rz = Math.sin(a) * 12.8 + (Math.random() - 0.5) * 0.8;
      const rock = new THREE.Mesh(lakeRockGeo, lakeRockMat);
      rock.scale.set(1 + Math.random() * 0.8, 0.6 + Math.random() * 0.6, 1 + Math.random() * 0.8);
      rock.position.set(rx, 0.3, rz);
      lakeGroup.add(rock);
    }

    // Reeds & Cattails (Junco / Taboa) on Shoreline
    const reedStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6);
    const reedStemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    const reedTopGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8);
    const reedTopMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });

    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      if (angle > Math.PI * 0.38 && angle < Math.PI * 0.62) continue;
      const dist = 11.5 + Math.random() * 1.2;
      const rx = Math.cos(angle) * dist;
      const rz = Math.sin(angle) * dist;
      const reedGroup = new THREE.Group();
      reedGroup.position.set(rx, 0, rz);

      const stem = new THREE.Mesh(reedStemGeo, reedStemMat);
      stem.position.y = 1.1;
      reedGroup.add(stem);

      const top = new THREE.Mesh(reedTopGeo, reedTopMat);
      top.position.y = 2.0;
      reedGroup.add(top);

      lakeGroup.add(reedGroup);
    }

    // Floating Water Lilies (Vitória-Régia / Lótus)
    const lilyPadGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.04, 12);
    const lilyPadMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
    const lilyFlowerGeo = new THREE.ConeGeometry(0.28, 0.38, 8);
    const lilyFlowerMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xdb2777, emissiveIntensity: 0.3 });

    const lilyPositions: [number, number][] = [
      [-5, -3], [6, -2], [-8, 4], [7, 5], [-4, 7], [5, -6], [-9, -5]
    ];

    lilyPositions.forEach(([lx, lz]) => {
      const padGroup = new THREE.Group();
      padGroup.position.set(lx, 0.04, lz);

      const pad = new THREE.Mesh(lilyPadGeo, lilyPadMat);
      padGroup.add(pad);

      const flower = new THREE.Mesh(lilyFlowerGeo, lilyFlowerMat);
      flower.position.set(0.15, 0.2, 0.08);
      padGroup.add(flower);

      lakeGroup.add(padGroup);
    });

    // 3. Wooden Fishing Dock / Pier (Trapiche de Madeira - Extende-se do Z=12 ao Z=0)
    const pierGroup = new THREE.Group();
    pierGroup.position.set(0, 0, 0);
    lakeGroup.add(pierGroup);

    const pierWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const pierPostGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.8, 8);

    for (let zP = 12; zP >= -2; zP -= 3) {
      [-1.8, 1.8].forEach((xP) => {
        const post = new THREE.Mesh(pierPostGeo, pierWoodMat);
        post.position.set(xP, -0.6, zP);
        pierGroup.add(post);
      });
    }

    const plankGeo = new THREE.BoxGeometry(4.2, 0.18, 0.6);
    for (let zP = 12; zP >= -2; zP -= 0.7) {
      const plank = new THREE.Mesh(plankGeo, pierWoodMat);
      plank.position.set(0, 0.25, zP);
      plank.receiveShadow = true;
      pierGroup.add(plank);
    }

    const railPostGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.1, 8);
    const railBarGeo = new THREE.CylinderGeometry(0.06, 0.06, 14.5, 8);

    [-1.9, 1.9].forEach((xP) => {
      for (let zP = 12; zP >= -2; zP -= 4) {
        const rPost = new THREE.Mesh(railPostGeo, pierWoodMat);
        rPost.position.set(xP, 0.8, zP);
        pierGroup.add(rPost);
      }
      const rBar = new THREE.Mesh(railBarGeo, pierWoodMat);
      rBar.rotation.x = Math.PI / 2;
      rBar.position.set(xP, 1.25, 5);
      pierGroup.add(rBar);
    });

    // Glowing Entrance Halo at Pier Entrance
    const lakeEntryRingGeo = new THREE.RingGeometry(2.0, 2.3, 16);
    const lakeEntryRingMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const lakeEntryRing = new THREE.Mesh(lakeEntryRingGeo, lakeEntryRingMat);
    lakeEntryRing.rotation.x = -Math.PI / 2;
    lakeEntryRing.position.set(0, 0.28, 20);
    pierGroup.add(lakeEntryRing);

    // Glowing Fishing Spot Halo at Pier End
    const fishingSpotRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const fishingSpotRing = new THREE.Mesh(lakeEntryRingGeo, fishingSpotRingMat);
    fishingSpotRing.rotation.x = -Math.PI / 2;
    fishingSpotRing.position.set(0, 0.28, -2);
    pierGroup.add(fishingSpotRing);

    // 4. Animated 3D Fish (Peixes 3D)
    interface LakeFish {
      group: THREE.Group;
      baseAngle: number;
      radius: number;
      speed: number;
      jumpTimer: number;
      jumpInterval: number;
      isJumping: boolean;
      jumpProgress: number;
      startPosY: number;
    }

    const lakeFishList: LakeFish[] = [];
    const fishBodyGeo = new THREE.ConeGeometry(0.32, 0.95, 8);
    fishBodyGeo.rotateX(Math.PI / 2);
    const fishTailGeo = new THREE.BoxGeometry(0.06, 0.45, 0.35);

    const fishColors = [0xf97316, 0xef4444, 0x38bdf8, 0xf59e0b, 0x10b981];

    for (let f = 0; f < 6; f++) {
      const fGroup = new THREE.Group();
      const fMat = new THREE.MeshStandardMaterial({
        color: fishColors[f % fishColors.length],
        roughness: 0.4,
        metalness: 0.3,
      });

      const body = new THREE.Mesh(fishBodyGeo, fMat);
      fGroup.add(body);

      const tail = new THREE.Mesh(fishTailGeo, fMat);
      tail.position.set(0, 0, -0.55);
      fGroup.add(tail);

      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      [-0.15, 0.15].forEach((ex) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
        eye.position.set(ex, 0.08, 0.25);
        fGroup.add(eye);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), pupilMat);
        pupil.position.set(ex * 1.2, 0.08, 0.28);
        fGroup.add(pupil);
      });

      fGroup.scale.set(0.85, 0.85, 0.85);

      const radius = 6 + f * 2.2;
      const baseAngle = (f * Math.PI * 2) / 6;
      const speed = 0.8 + Math.random() * 0.6;

      fGroup.position.set(Math.cos(baseAngle) * radius, -0.4, Math.sin(baseAngle) * radius);
      lakeGroup.add(fGroup);

      lakeFishList.push({
        group: fGroup,
        baseAngle,
        radius,
        speed,
        jumpTimer: Math.random() * 3,
        jumpInterval: 2.5 + Math.random() * 3,
        isJumping: false,
        jumpProgress: 0,
        startPosY: -0.4,
      });
    }

    // --- PASTO DOS CAVALOS TERAPÊUTICO (BACKGROUND FIELD AT X = +65.0, Z = -22.0) ---
    const horsesGroup = new THREE.Group();
    horsesGroup.position.set(65.0, 0, -22.0);
    scene.add(horsesGroup);

    // Pasture Grass Base
    const pastureBaseGeo = new THREE.PlaneGeometry(32, 18);
    const pastureBaseMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Lush pasture green
      roughness: 0.85,
    });
    const pastureBase = new THREE.Mesh(pastureBaseGeo, pastureBaseMat);
    pastureBase.rotation.x = -Math.PI / 2;
    pastureBase.position.set(0, 0.015, 0);
    pastureBase.receiveShadow = true;
    horsesGroup.add(pastureBase);

    // Pasture Wood Fence (Cerca de Madeira)
    const pFenceWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const pFencePostGeo = new THREE.CylinderGeometry(0.12, 0.14, 2.2, 8);
    const pFenceRailGeo = new THREE.BoxGeometry(32, 0.12, 0.12);

    for (let xF = -15; xF <= 15; xF += 5) {
      const fPost = new THREE.Mesh(pFencePostGeo, pFenceWoodMat);
      fPost.position.set(xF, 1.1, 8.5);
      horsesGroup.add(fPost);
    }
    const fRailTop = new THREE.Mesh(pFenceRailGeo, pFenceWoodMat);
    fRailTop.position.set(0, 1.8, 8.5);
    horsesGroup.add(fRailTop);
    const fRailMid = new THREE.Mesh(pFenceRailGeo, pFenceWoodMat);
    fRailMid.position.set(0, 1.1, 8.5);
    horsesGroup.add(fRailMid);

    // Hay Bales (Fardos de Palha)
    const hayMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.9 });
    const hayGeo = new THREE.BoxGeometry(2.2, 1.2, 1.4);
    const hay1 = new THREE.Mesh(hayGeo, hayMat);
    hay1.position.set(-8, 0.6, 4);
    hay1.rotation.y = 0.2;
    horsesGroup.add(hay1);
    const hay2 = new THREE.Mesh(hayGeo, hayMat);
    hay2.position.set(-7.5, 1.8, 4.2);
    hay2.rotation.y = -0.15;
    horsesGroup.add(hay2);

    // Helper to build a 3D Horse Model (Cavalo 3D)
    interface HorseMeshRef {
      group: THREE.Group;
      headGroup: THREE.Group;
      tailMesh: THREE.Mesh;
    }
    const horseRefsList: HorseMeshRef[] = [];

    const create3DHorseMesh = (bodyHex: number, maneHex: number, scaleVal: number = 1.0) => {
      const hGroup = new THREE.Group();

      const bodyMat = new THREE.MeshStandardMaterial({ color: bodyHex, roughness: 0.65 });
      const maneMat = new THREE.MeshStandardMaterial({ color: maneHex, roughness: 0.8 });
      const hoofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

      // Body / Barrel (Torso)
      const barrelGeo = new THREE.BoxGeometry(1.5, 1.5, 2.8);
      const barrel = new THREE.Mesh(barrelGeo, bodyMat);
      barrel.position.y = 2.1;
      hGroup.add(barrel);

      // Neck & Head Group
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 2.7, 1.1);

      const neckGeo = new THREE.BoxGeometry(0.7, 1.5, 0.9);
      const neck = new THREE.Mesh(neckGeo, bodyMat);
      neck.rotation.x = -0.4;
      neck.position.set(0, 0.5, 0.3);
      headGroup.add(neck);

      const headGeo = new THREE.BoxGeometry(0.65, 0.65, 1.2);
      const head = new THREE.Mesh(headGeo, bodyMat);
      head.position.set(0, 1.1, 0.8);
      headGroup.add(head);

      // Ears
      const earGeo = new THREE.ConeGeometry(0.12, 0.35, 4);
      const leftEar = new THREE.Mesh(earGeo, bodyMat);
      leftEar.position.set(-0.22, 1.5, 0.4);
      headGroup.add(leftEar);
      const rightEar = new THREE.Mesh(earGeo, bodyMat);
      rightEar.position.set(0.22, 1.5, 0.4);
      headGroup.add(rightEar);

      // Eyes
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
      eyeL.position.set(-0.34, 1.25, 0.8);
      headGroup.add(eyeL);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
      eyeR.position.set(0.34, 1.25, 0.8);
      headGroup.add(eyeR);

      // Mane (Crina)
      const maneGeo = new THREE.BoxGeometry(0.2, 1.4, 0.3);
      const mane = new THREE.Mesh(maneGeo, maneMat);
      mane.rotation.x = -0.4;
      mane.position.set(0, 0.6, -0.2);
      headGroup.add(mane);

      hGroup.add(headGroup);

      // 4 Legs
      const legGeo = new THREE.BoxGeometry(0.32, 1.4, 0.32);
      const hoofGeo = new THREE.BoxGeometry(0.34, 0.3, 0.36);

      const legPositions: [number, number, number][] = [
        [-0.55, 0.85, 1.0],  // Front Left
        [0.55, 0.85, 1.0],   // Front Right
        [-0.55, 0.85, -1.0], // Back Left
        [0.55, 0.85, -1.0],  // Back Right
      ];

      legPositions.forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, bodyMat);
        leg.position.set(lx, ly, lz);
        hGroup.add(leg);

        const hoof = new THREE.Mesh(hoofGeo, hoofMat);
        hoof.position.set(lx, 0.15, lz);
        hGroup.add(hoof);
      });

      // Tail (Rabo)
      const tailGeo = new THREE.CylinderGeometry(0.08, 0.18, 1.4, 6);
      const tailMesh = new THREE.Mesh(tailGeo, maneMat);
      tailMesh.position.set(0, 1.8, -1.5);
      tailMesh.rotation.x = 0.3;
      hGroup.add(tailMesh);

      hGroup.scale.set(scaleVal, scaleVal, scaleVal);

      return { group: hGroup, headGroup, tailMesh };
    };

    // Spawn 3 Horses in Pasture
    const horse1 = create3DHorseMesh(0x78350f, 0x1e293b, 1.05);
    horse1.group.position.set(0, 0, 4.0);
    horse1.group.rotation.y = 0;
    horsesGroup.add(horse1.group);
    horseRefsList.push(horse1);

    const horse2 = create3DHorseMesh(0xe2e8f0, 0x0f172a, 0.98);
    horse2.group.position.set(-6.5, 0, -2.0);
    horse2.group.rotation.y = Math.PI * 0.35;
    horsesGroup.add(horse2.group);
    horseRefsList.push(horse2);

    const horse3 = create3DHorseMesh(0xb45309, 0xfef08a, 1.12);
    horse3.group.position.set(7.0, 0, -1.0);
    horse3.group.rotation.y = -Math.PI * 0.25;
    horsesGroup.add(horse3.group);
    horseRefsList.push(horse3);

    // Glowing Petting Spot Halo on Ground near fence
    const horsePetRingGeo = new THREE.RingGeometry(2.0, 2.3, 16);
    const horsePetRingMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const horsePetRing = new THREE.Mesh(horsePetRingGeo, horsePetRingMat);
    horsePetRing.rotation.x = -Math.PI / 2;
    horsePetRing.position.set(0, 0.28, 8.5);
    horsesGroup.add(horsePetRing);

    // --- PRAÇA DOS POMBOS & BANCO DA PRAÇA (X = -45.0, Z = -22.0) ---
    const pigeonsParkGroup = new THREE.Group();
    pigeonsParkGroup.position.set(-45.0, 0, -22.0);
    scene.add(pigeonsParkGroup);

    // Park Cobblestone & Grass Base
    const pigeonsBaseGeo = new THREE.PlaneGeometry(16, 12);
    const pigeonsBaseMat = new THREE.MeshStandardMaterial({
      color: 0x166534, // Lush park grass green
      roughness: 0.85,
    });
    const pigeonsBase = new THREE.Mesh(pigeonsBaseGeo, pigeonsBaseMat);
    pigeonsBase.rotation.x = -Math.PI / 2;
    pigeonsBase.position.set(0, 0.015, 0);
    pigeonsBase.receiveShadow = true;
    pigeonsParkGroup.add(pigeonsBase);

    // 3D Classic Park Bench (Banco da Praça) em Escala Proporcional
    const parkBenchGroup = new THREE.Group();
    parkBenchGroup.position.set(0, 0, -2.0);

    const benchWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
    const benchIronMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });

    // Wooden Slats (Assento e Encosto)
    for (let s = -0.45; s <= 0.45; s += 0.18) {
      const seatSlat = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.09, 0.16), benchWoodMat);
      seatSlat.position.set(0, 0.82, s);
      parkBenchGroup.add(seatSlat);
    }
    for (let b = 0; b < 5; b++) {
      const backSlat = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.18, 0.09), benchWoodMat);
      backSlat.position.set(0, 1.20 + b * 0.28, -0.55 - b * 0.06);
      backSlat.rotation.x = -0.16;
      parkBenchGroup.add(backSlat);
    }

    // Cast Iron Frame Legs
    [-2.5, 2.5].forEach((xLeg) => {
      const legA = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.82, 8), benchIronMat);
      legA.position.set(xLeg, 0.41, 0.45);
      parkBenchGroup.add(legA);

      const legB = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.82, 8), benchIronMat);
      legB.position.set(xLeg, 0.41, -0.45);
      parkBenchGroup.add(legB);

      const backSupport = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.95, 8), benchIronMat);
      backSupport.rotation.x = 0.16;
      backSupport.position.set(xLeg, 1.65, -0.68);
      parkBenchGroup.add(backSupport);

      const armRest = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.10, 1.05), benchIronMat);
      armRest.position.set(xLeg, 1.32, 0);
      parkBenchGroup.add(armRest);
    });

    pigeonsParkGroup.add(parkBenchGroup);

    // 10 3D Pigeons (10 Pombos no Chão da Praça)
    interface PigeonRef {
      group: THREE.Group;
      headGroup: THREE.Group;
      tailMesh: THREE.Mesh;
      baseX: number;
      baseZ: number;
    }

    const pigeonsRefList: PigeonRef[] = [];
    const pigeonBodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.5, 8);
    pigeonBodyGeo.rotateX(Math.PI / 2);
    const pigeonHeadGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const pigeonBeakGeo = new THREE.ConeGeometry(0.04, 0.12, 4);
    pigeonBeakGeo.rotateX(Math.PI / 2);

    const pigeonSlateMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const pigeonNeckMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.4, metalness: 0.5 }); // Iridescent purple/teal
    const pigeonBeakMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 });
    const pigeonEyeMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

    for (let p = 0; p < 10; p++) {
      const pGroup = new THREE.Group();

      const body = new THREE.Mesh(pigeonBodyGeo, pigeonSlateMat);
      pGroup.add(body);

      const pHeadGroup = new THREE.Group();
      pHeadGroup.position.set(0, 0.22, 0.28);

      const head = new THREE.Mesh(pigeonHeadGeo, pigeonNeckMat);
      pHeadGroup.add(head);

      const beak = new THREE.Mesh(pigeonBeakGeo, pigeonBeakMat);
      beak.position.set(0, -0.02, 0.15);
      pHeadGroup.add(beak);

      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), pigeonEyeMat);
      eyeL.position.set(-0.11, 0.04, 0.08);
      pHeadGroup.add(eyeL);
      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), pigeonEyeMat);
      eyeR.position.set(0.11, 0.04, 0.08);
      pHeadGroup.add(eyeR);

      pGroup.add(pHeadGroup);

      // Tail
      const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.35), pigeonSlateMat);
      tailMesh.position.set(0, 0.1, -0.32);
      tailMesh.rotation.x = -0.2;
      pGroup.add(tailMesh);

      // Random position on the ground near the bench
      const pAngle = (p * Math.PI * 2) / 10;
      const pRadius = 2.0 + (p % 3) * 0.8;
      const baseX = Math.cos(pAngle) * pRadius;
      const baseZ = Math.sin(pAngle) * pRadius + 1.2;

      pGroup.position.set(baseX, 0.2, baseZ);
      pGroup.rotation.y = Math.random() * Math.PI * 2;
      pigeonsParkGroup.add(pGroup);

      pigeonsRefList.push({
        group: pGroup,
        headGroup: pHeadGroup,
        tailMesh,
        baseX,
        baseZ,
      });
    }

    // Scattered Breadcrumb Seeds (Migalhas de Pão) on Ground
    const crumbMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.9 });
    const crumbGeo = new THREE.DodecahedronGeometry(0.08, 0);
    for (let c = 0; c < 15; c++) {
      const crumb = new THREE.Mesh(crumbGeo, crumbMat);
      crumb.position.set((Math.random() - 0.5) * 5.0, 0.05, 1.2 + (Math.random() - 0.5) * 4.0);
      pigeonsParkGroup.add(crumb);
    }

    // Glowing Halo Ring around Bench
    const pigeonBenchRingGeo = new THREE.RingGeometry(2.2, 2.5, 16);
    const pigeonBenchRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const pigeonBenchRing = new THREE.Mesh(pigeonBenchRingGeo, pigeonBenchRingMat);
    pigeonBenchRing.rotation.x = -Math.PI / 2;
    pigeonBenchRing.position.set(0, 0.28, -0.5);
    pigeonsParkGroup.add(pigeonBenchRing);

    // --- 3D RODA DE CONVERSA COM AMIGOS (ACOLHIMENTO SOCIAL • X = +115.0, Z = -22.0) ---
    const friendsCircleGroup = new THREE.Group();
    friendsCircleGroup.position.set(115.0, 0, -22.0);
    scene.add(friendsCircleGroup);

    // Circular Patio Base (Pedra & Grama Acolhedora)
    const friendsPatioGeo = new THREE.CylinderGeometry(7.2, 7.6, 0.2, 28);
    const friendsPatioMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const friendsPatio = new THREE.Mesh(friendsPatioGeo, friendsPatioMat);
    friendsPatio.position.set(0, 0.1, 0);
    friendsPatio.receiveShadow = true;
    friendsCircleGroup.add(friendsPatio);

    // Outer Grass/Flower Accent Ring
    const friendsPatioBorderGeo = new THREE.RingGeometry(6.8, 7.6, 28);
    const friendsPatioBorderMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const friendsPatioBorder = new THREE.Mesh(friendsPatioBorderGeo, friendsPatioBorderMat);
    friendsPatioBorder.rotation.x = -Math.PI / 2;
    friendsPatioBorder.position.set(0, 0.21, 0);
    friendsCircleGroup.add(friendsPatioBorder);

    // Central Cozy Campfire / Warm Lantern Fire Pit
    const firePitGeo = new THREE.CylinderGeometry(1.3, 1.5, 0.45, 16);
    const firePitMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, metalness: 0.1 });
    const firePit = new THREE.Mesh(firePitGeo, firePitMat);
    firePit.position.set(0, 0.35, 0);
    friendsCircleGroup.add(firePit);

    // Fire Logs
    const fireLogMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    for (let l = 0; l < 4; l++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.2, 6), fireLogMat);
      log.rotation.z = Math.PI / 3;
      log.rotation.y = (l * Math.PI) / 2;
      log.position.set(0, 0.52, 0);
      friendsCircleGroup.add(log);
    }

    // Warm Ambient PointLight in Center
    const fireGlowLight = new THREE.PointLight(0xf97316, 4.2, 16);
    fireGlowLight.position.set(0, 1.2, 0);
    friendsCircleGroup.add(fireGlowLight);

    const fireGlowCoreGeo = new THREE.SphereGeometry(0.5, 14, 14);
    const fireGlowCoreMat = new THREE.MeshBasicMaterial({ color: 0xfcb316, transparent: true, opacity: 0.95 });
    const fireGlowCore = new THREE.Mesh(fireGlowCoreGeo, fireGlowCoreMat);
    fireGlowCore.position.set(0, 0.65, 0);
    friendsCircleGroup.add(fireGlowCore);

    // 4 Curved Wooden Benches Surrounding Campfire (Scaled to fit Roblox avatars)
    const friendsBenchMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.7 });
    const friendsBenchGeo = new THREE.BoxGeometry(4.8, 0.16, 1.25);

    interface CircleFriend {
      group: THREE.Group;
      headGroup: THREE.Group;
      armL: THREE.Group;
      armR: THREE.Group;
    }
    const circleFriendsList: CircleFriend[] = [];
    const friendShirtColors = [0x10b981, 0x8b5cf6, 0x06b6d4, 0xec4899];
    const friendSkinTones = [0xfde047, 0xfbbf24, 0xd97706, 0x854d0e];
    const friendHairColors = [0x1e293b, 0x78350f, 0xb45309, 0x0f172a];

    for (let f = 0; f < 4; f++) {
      const angle = (f * Math.PI * 2) / 4 + Math.PI / 4;
      const bx = Math.cos(angle) * 4.4;
      const bz = Math.sin(angle) * 4.4;

      // Wooden Bench
      const bench = new THREE.Mesh(friendsBenchGeo, friendsBenchMat);
      bench.position.set(bx, 0.82, bz);
      bench.rotation.y = -angle + Math.PI / 2;
      friendsCircleGroup.add(bench);

      // Bench Legs
      [-1.8, 1.8].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.82, 1.15), benchIronMat);
        leg.position.set(bx + Math.cos(angle + Math.PI / 2) * lx, 0.41, bz + Math.sin(angle + Math.PI / 2) * lx);
        friendsCircleGroup.add(leg);
      });

      // Friend Avatar Sitting (Proportional human/Roblox dimensions matching player avatar)
      const fGroup = new THREE.Group();
      fGroup.position.set(bx, 0, bz);
      fGroup.rotation.y = -angle - Math.PI / 2; // Facing center campfire

      // Torso / Shirt
      const torsoMat = new THREE.MeshStandardMaterial({ color: friendShirtColors[f], roughness: 0.6 });
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.33, 1.62, 0.83), torsoMat);
      torso.position.y = 1.63;
      fGroup.add(torso);

      // Head Group
      const fHeadGroup = new THREE.Group();
      fHeadGroup.position.set(0, 2.82, 0);
      const headMat = new THREE.MeshStandardMaterial({ color: friendSkinTones[f], roughness: 0.8 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 16), headMat);
      fHeadGroup.add(head);

      // Eyes on Face
      const fEyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      [-0.16, 0.16].forEach((ex) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), fEyeMat);
        eye.position.set(ex, 0.08, 0.43);
        fHeadGroup.add(eye);
      });

      // Hair
      const hairMat = new THREE.MeshStandardMaterial({ color: friendHairColors[f], roughness: 0.8 });
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.49, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
      hair.position.y = 0.06;
      fHeadGroup.add(hair);

      fGroup.add(fHeadGroup);

      // Arms
      const armL = new THREE.Group();
      armL.position.set(-0.88, 2.25, 0);
      const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.72, 0.40), torsoMat);
      armLMesh.position.y = -0.36;
      armL.add(armLMesh);
      const armLLower = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.68, 0.36), headMat);
      armLLower.position.set(0, -0.96, 0.15);
      armLLower.rotation.x = 0.4;
      armL.add(armLLower);
      fGroup.add(armL);

      const armR = new THREE.Group();
      armR.position.set(0.88, 2.25, 0);
      const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.72, 0.40), torsoMat);
      armRMesh.position.y = -0.36;
      armR.add(armRMesh);
      const armRLower = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.68, 0.36), headMat);
      armRLower.position.set(0, -0.96, 0.15);
      armRLower.rotation.x = 0.4;
      armR.add(armRLower);
      fGroup.add(armR);

      // Legs sitting
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 });
      const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.44, 0.95), pantsMat);
      thighL.position.set(-0.35, 0.95, 0.42);
      fGroup.add(thighL);
      const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.44, 0.95), pantsMat);
      thighR.position.set(0.35, 0.95, 0.42);
      fGroup.add(thighR);

      const calfL = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.85, 0.48), pantsMat);
      calfL.position.set(-0.35, 0.45, 0.86);
      fGroup.add(calfL);
      const calfR = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.85, 0.48), pantsMat);
      calfR.position.set(0.35, 0.45, 0.86);
      fGroup.add(calfR);

      // Shoes
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
      const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.32, 0.92), shoeMat);
      shoeL.position.set(-0.35, 0.15, 0.96);
      fGroup.add(shoeL);
      const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.32, 0.92), shoeMat);
      shoeR.position.set(0.35, 0.15, 0.96);
      fGroup.add(shoeR);

      friendsCircleGroup.add(fGroup);
      circleFriendsList.push({ group: fGroup, headGroup: fHeadGroup, armL, armR });
    }

    // Glowing Halo Ring around Friends Circle Spot
    const friendsCircleRingGeo = new THREE.RingGeometry(3.6, 4.2, 24);
    const friendsCircleRingMat = new THREE.MeshBasicMaterial({ color: 0xec4899, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const friendsCircleRing = new THREE.Mesh(friendsCircleRingGeo, friendsCircleRingMat);
    friendsCircleRing.rotation.x = -Math.PI / 2;
    friendsCircleRing.position.set(0, 0.25, 0);
    friendsCircleGroup.add(friendsCircleRing);



    // --- CASA COMPLETA DE DESCANSO E RECUPERAÇÃO NOTURNA (REFÚGIO TRANQUILO • X = -140.0, Z = -26.0) ---
    const cozyHouseGroup = new THREE.Group();
    cozyHouseGroup.position.set(-140.0, 0, -26.0);
    scene.add(cozyHouseGroup);
    const houseExteriorList: THREE.Object3D[] = [];

    // 1. Garden Grounds / Yard Landscaping (Gramado do Jardim e Calçadão de Pedras)
    const houseLawnGeo = new THREE.PlaneGeometry(30.0, 26.0);
    const houseLawnMat = new THREE.MeshStandardMaterial({
      color: 0x166534, // Lush garden lawn
      roughness: 0.85,
    });
    const houseLawn = new THREE.Mesh(houseLawnGeo, houseLawnMat);
    houseLawn.rotation.x = -Math.PI / 2;
    houseLawn.position.set(0, 0.012, 1.5);
    houseLawn.receiveShadow = true;
    cozyHouseGroup.add(houseLawn);

    // Stone pathway (Caminho de Pedras Rústicas que liga a calçada principal Z = 14 até a varanda Z = 4.2)
    const stoneStepMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    for (let sZ = 14.0; sZ >= 4.5; sZ -= 1.6) {
      const stoneStep = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.2), stoneStepMat);
      stoneStep.position.set(0.0 + Math.sin(sZ * 2.0) * 0.15, 0.04, sZ);
      stoneStep.receiveShadow = true;
      cozyHouseGroup.add(stoneStep);
    }

    // White Picket Garden Fence & Arch Gate (Cerca Branca de Jardim com Portão)
    const housePicketMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const housePicketDarkMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    
    // Front Garden Fence Left & Right of the path
    [-8.0, 8.0].forEach((sideX) => {
      const fPost = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.6, 0.35), housePicketMat);
      fPost.position.set(sideX, 0.8, 14.5);
      cozyHouseGroup.add(fPost);

      const fRail1 = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.12, 0.1), housePicketMat);
      fRail1.position.set(sideX > 0 ? 8.5 : -8.5, 1.1, 14.5);
      cozyHouseGroup.add(fRail1);

      const fRail2 = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.12, 0.1), housePicketMat);
      fRail2.position.set(sideX > 0 ? 8.5 : -8.5, 0.5, 14.5);
      cozyHouseGroup.add(fRail2);

      // Pickets
      for (let pX = 4.0; pX <= 13.0; pX += 1.1) {
        const picket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.2, 0.08), housePicketMat);
        picket.position.set(sideX > 0 ? pX : -pX, 0.7, 14.5 + 0.02);
        cozyHouseGroup.add(picket);
      }
    });

    // Flower Beds along Front Garden (Canteiros de Flores Coloridas e Arbustos)
    const gardenFlowerColors = [0xf43f5e, 0xa855f7, 0xfbbf24, 0x38bdf8, 0xec4899];
    for (let f = 0; f < 18; f++) {
      const fCol = gardenFlowerColors[f % gardenFlowerColors.length];
      const flowerMesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.32),
        new THREE.MeshStandardMaterial({ color: fCol, roughness: 0.6 })
      );
      const fX = (f % 2 === 0 ? 1 : -1) * (3.2 + (f * 0.55));
      const fZ = 5.5 + (f % 4) * 2.2;
      flowerMesh.position.set(fX, 0.45, fZ);
      cozyHouseGroup.add(flowerMesh);

      // Flower Stem / Bush Base
      const bushMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 })
      );
      bushMesh.position.set(fX, 0.25, fZ);
      bushMesh.scale.set(1.1, 0.7, 1.1);
      cozyHouseGroup.add(bushMesh);
    }

    // Mailbox on Post (Caixa de Correio com Placa de Boas-Vindas)
    const mailboxGroup = new THREE.Group();
    mailboxGroup.position.set(2.2, 0, 13.8);
    const mPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.6, 0.18), woodMat);
    mPost.position.set(0, 0.8, 0);
    mailboxGroup.add(mPost);
    const mBox = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 }));
    mBox.rotation.z = Math.PI / 2;
    mBox.position.set(0, 1.55, 0);
    mailboxGroup.add(mBox);
    const mFlag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.15), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    mFlag.position.set(0.32, 1.65, 0.1);
    mailboxGroup.add(mFlag);
    cozyHouseGroup.add(mailboxGroup);

    // Welcome Signboard (Placa de Madeira: Refúgio Tranquilo)
    const signGroup = new THREE.Group();
    signGroup.position.set(-2.4, 0, 13.8);
    const sPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.5, 0.18), woodMat);
    sPost.position.set(0, 0.75, 0);
    signGroup.add(sPost);
    const sBoard = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.15), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 }));
    sBoard.position.set(0, 1.45, 0);
    signGroup.add(sBoard);
    cozyHouseGroup.add(signGroup);

    // Garden Solar Pathway Lamps (Luminárias Solares de Caminho)
    for (let pathZ = 13.0; pathZ >= 5.0; pathZ -= 2.6) {
      [-1.4, 1.4].forEach((sideX) => {
        const solarLampGroup = new THREE.Group();
        solarLampGroup.position.set(sideX, 0, pathZ);
        const sPostMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.8, 8), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
        sPostMesh.position.set(0, 0.4, 0);
        solarLampGroup.add(sPostMesh);
        const sHeadMesh = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.25, 6), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
        sHeadMesh.position.set(0, 0.85, 0);
        solarLampGroup.add(sHeadMesh);
        const sBulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfde047, emissive: 0xfde047, emissiveIntensity: 0.8 }));
        sBulbMesh.position.set(0, 0.75, 0);
        solarLampGroup.add(sBulbMesh);
        cozyHouseGroup.add(solarLampGroup);
      });
    }

    // Cozy Garden Bench under Flowering Sakura Tree (Banco de Jardim sob Árvore Florida)
    const gardenTreeGroup = new THREE.Group();
    gardenTreeGroup.position.set(-10.5, 0, 9.0);
    const treeTrunkMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 5.0, 8), new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 }));
    treeTrunkMesh.position.set(0, 2.5, 0);
    gardenTreeGroup.add(treeTrunkMesh);
    const treeFoliageMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8), new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.7 }));
    treeFoliageMesh.position.set(0, 5.2, 0);
    gardenTreeGroup.add(treeFoliageMesh);
    cozyHouseGroup.add(gardenTreeGroup);

    // Garden Bench
    const gBenchGroup = new THREE.Group();
    gBenchGroup.position.set(-8.5, 0, 8.5);
    gBenchGroup.rotation.y = Math.PI / 6;
    const gBenchSeatMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.8), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 }));
    gBenchSeatMesh.position.set(0, 0.6, 0);
    gBenchGroup.add(gBenchSeatMesh);
    const gBenchBackMesh = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 0.08), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 }));
    gBenchBackMesh.position.set(0, 1.0, -0.38);
    gBenchGroup.add(gBenchBackMesh);
    [-0.9, 0.9].forEach((bx) => {
      const gLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.7), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      gLegMesh.position.set(bx, 0.3, 0);
      gBenchGroup.add(gLegMesh);
    });
    cozyHouseGroup.add(gBenchGroup);

    // 2. House Structure & Exterior Walls (Fundação e Paredes da Casa)
    const houseStoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
    const houseTimberMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 }); // Warm cream siding
    const houseOakTrimMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 }); // Oak trim
    const houseRoofTileMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.65 }); // Terracotta tile
    const houseBrickMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.85 }); // Red brick chimney

    // Stone Foundation Base
    const houseFoundation = new THREE.Mesh(new THREE.BoxGeometry(17.2, 0.7, 13.4), houseStoneMat);
    houseFoundation.position.set(0, 0.35, -2.0);
    houseFoundation.receiveShadow = true;
    cozyHouseGroup.add(houseFoundation);

    // Main House Walls (Split into Back, Left, Right and Front wall segments so they can be hidden or shown individually)
    // Back Wall (Always visible, serves as the background of the cozy interior)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(16.0, 6.2, 0.3), houseTimberMat);
    backWall.position.set(0, 3.8, -8.0);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    cozyHouseGroup.add(backWall);

    // Left Wall (Always visible, borders the left side)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6.2, 12.2), houseTimberMat);
    leftWall.position.set(-8.0, 3.8, -2.0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    cozyHouseGroup.add(leftWall);

    // Right Wall (Always visible, borders the right side)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6.2, 12.2), houseTimberMat);
    rightWall.position.set(8.0, 3.8, -2.0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    cozyHouseGroup.add(rightWall);

    // Front Wall - Left Part (Exterior-only, hidden when inside)
    const frontWallLeft = new THREE.Mesh(new THREE.BoxGeometry(6.8, 6.2, 0.3), houseTimberMat);
    frontWallLeft.position.set(-4.6, 3.8, 4.0);
    frontWallLeft.castShadow = true;
    frontWallLeft.receiveShadow = true;
    cozyHouseGroup.add(frontWallLeft);
    houseExteriorList.push(frontWallLeft);

    // Front Wall - Right Part (Exterior-only, hidden when inside)
    const frontWallRight = new THREE.Mesh(new THREE.BoxGeometry(6.8, 6.2, 0.3), houseTimberMat);
    frontWallRight.position.set(4.6, 3.8, 4.0);
    frontWallRight.castShadow = true;
    frontWallRight.receiveShadow = true;
    cozyHouseGroup.add(frontWallRight);
    houseExteriorList.push(frontWallRight);

    // Front Wall - Top Part above Door (Exterior-only, hidden when inside)
    const frontWallTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 0.3), houseTimberMat);
    frontWallTop.position.set(0, 5.8, 4.0);
    frontWallTop.castShadow = true;
    frontWallTop.receiveShadow = true;
    cozyHouseGroup.add(frontWallTop);
    houseExteriorList.push(frontWallTop);

    // Cozy Baseboards (Rodapés elegantes na parte interna da casa para realismo de quarto)
    const backBaseboard = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.3, 0.15), houseOakTrimMat);
    backBaseboard.position.set(0, 0.9, -7.8);
    cozyHouseGroup.add(backBaseboard);

    const leftBaseboard = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 11.0), houseOakTrimMat);
    leftBaseboard.position.set(-7.8, 0.9, -2.0);
    cozyHouseGroup.add(leftBaseboard);

    const rightBaseboard = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 11.0), houseOakTrimMat);
    rightBaseboard.position.set(7.8, 0.9, -2.0);
    cozyHouseGroup.add(rightBaseboard);

    // Wooden Corner Posts and Skirting (Pilares de Canto em Madeira Maciça)
    [-8.0, 8.0].forEach((cX) => {
      [-8.1, 4.1].forEach((cZ) => {
        const cornerPillar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6.4, 0.6), houseOakTrimMat);
        cornerPillar.position.set(cX, 3.8, cZ);
        cozyHouseGroup.add(cornerPillar);
        houseExteriorList.push(cornerPillar);
      });
    });

    // 3. Wooden Front Porch (Varanda Aconchegante com Deck e Degraus)
    const porchDeck = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.45, 4.4), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 }));
    porchDeck.position.set(0, 0.5, 4.3);
    porchDeck.receiveShadow = true;
    cozyHouseGroup.add(porchDeck);

    // Porch Steps (Degraus de entrada)
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.25, 0.8), new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 }));
    step1.position.set(0, 0.25, 6.7);
    cozyHouseGroup.add(step1);

    // Porch Columns & Railing (Colunas da Varanda e Guarda-Corpo)
    [-4.3, 4.3].forEach((pX) => {
      const pColumn = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5.32, 0.35), houseTimberMat);
      pColumn.position.set(pX, 3.26, 6.2);
      cozyHouseGroup.add(pColumn);
    });
    [-1.6, 1.6].forEach((pX) => {
      const pColumn = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5.32, 0.35), houseTimberMat);
      pColumn.position.set(pX, 3.26, 6.2);
      cozyHouseGroup.add(pColumn);
    });

    // Porch Awning Roof (Telhado da Varanda - Elevado adicionalmente em 3 pixels)
    const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.4, 5.0), houseRoofTileMat);
    porchRoof.position.set(0, 5.92, 4.4);
    porchRoof.rotation.x = 0.18;
    cozyHouseGroup.add(porchRoof);
    houseExteriorList.push(porchRoof);

    // Front Door in Deep Mahogany (Porta Principal de Entrada com Maçaneta Dourada e Tapete de Boas-VIndas)
    const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.0, 0.25), new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.5 }));
    doorMesh.position.set(0, 2.6, 4.0);
    cozyHouseGroup.add(doorMesh);
    houseExteriorList.push(doorMesh);

    // Brass Doorknob (Maçaneta de Latão Dourado)
    const doorknob = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.2 }));
    doorknob.position.set(0.85, 2.4, 4.15);
    cozyHouseGroup.add(doorknob);
    houseExteriorList.push(doorknob);

    // Welcome Doormat (Capacho "Bem-Vindo")
    const doormat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 1.0), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 }));
    doormat.position.set(0, 0.74, 5.2);
    cozyHouseGroup.add(doormat);

    // Porch Rocking Chair (Cadeira de Balanço na Varanda)
    const porchChairGroup = new THREE.Group();
    porchChairGroup.position.set(3.2, 0.7, 4.2);
    porchChairGroup.rotation.y = -Math.PI / 4;
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 1.0), woodMat);
    chairSeat.position.set(0, 0.5, 0);
    porchChairGroup.add(chairSeat);
    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.1, 0.1), woodMat);
    chairBack.position.set(0, 1.05, -0.45);
    porchChairGroup.add(chairBack);
    const chairLeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), woodMat);
    chairLeg1.position.set(-0.4, 0.25, -0.4);
    porchChairGroup.add(chairLeg1);
    const chairLeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), woodMat);
    chairLeg2.position.set(0.4, 0.25, -0.4);
    porchChairGroup.add(chairLeg2);
    const chairLeg3 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), woodMat);
    chairLeg3.position.set(-0.4, 0.25, 0.4);
    porchChairGroup.add(chairLeg3);
    const chairLeg4 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), woodMat);
    chairLeg4.position.set(0.4, 0.25, 0.4);
    porchChairGroup.add(chairLeg4);
    cozyHouseGroup.add(porchChairGroup);

    // Porch Hanging Lantern (Lanterna da Varanda com Brilho Noturno)
    const housePorchBulbMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 0.0,
      roughness: 0.2,
    });
    const porchLantern = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), housePorchBulbMat);
    porchLantern.position.set(-1.6, 4.0, 5.8);
    cozyHouseGroup.add(porchLantern);

    const porchPointLight = new THREE.PointLight(0xfef08a, 0, 16);
    porchPointLight.position.set(-1.6, 3.8, 5.8);
    cozyHouseGroup.add(porchPointLight);

    // 4. Large Cozy Picture Windows with Night-Glow (Janelas Panorâmicas com Iluminação Dourada)
    const houseWindowsMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.2,
      roughness: 0.2,
      transparent: true,
      opacity: 0.88,
    });

    // 4. Windows and Front Architectural Openings
    // Material de Floreiras e Venezianas Coloniais
    const shutterMat = new THREE.MeshStandardMaterial({ color: 0x5c2b0d, roughness: 0.6 });
    const flowerBoxMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    const flowerFoliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const flowerPetalMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
    const flowerPetalMatYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
    const flowerPetalMatPink = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.5 });

    // --- JANELA FRONTAL ESQUERDA (Left Front Window with Shutters and Flower Box) ---
    const windowLeft = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 0.12), houseWindowsMat);
    windowLeft.position.set(-4.8, 3.2, 4.16);
    cozyHouseGroup.add(windowLeft);
    houseExteriorList.push(windowLeft);

    // Moldura e Cruzetas Brancas da Janela Esquerda
    const wFrameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const wGridLH = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 0.18), wFrameMat);
    wGridLH.position.set(-4.8, 3.2, 4.18);
    cozyHouseGroup.add(wGridLH);
    const wGridLV1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.18), wFrameMat);
    wGridLV1.position.set(-5.8, 3.2, 4.18);
    cozyHouseGroup.add(wGridLV1);
    const wGridLV2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.18), wFrameMat);
    wGridLV2.position.set(-3.8, 3.2, 4.18);
    cozyHouseGroup.add(wGridLV2);

    // Peitoril da Janela Esquerda
    const sillL = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.18, 0.35), houseOakTrimMat);
    sillL.position.set(-4.8, 1.55, 4.25);
    cozyHouseGroup.add(sillL);

    // Floreira da Janela Esquerda com Flores Coloridas
    const flowerBoxL = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.32, 0.32), flowerBoxMat);
    flowerBoxL.position.set(-4.8, 1.35, 4.32);
    cozyHouseGroup.add(flowerBoxL);
    const foliageL = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.22, 0.28), flowerFoliageMat);
    foliageL.position.set(-4.8, 1.52, 4.32);
    cozyHouseGroup.add(foliageL);
    [-1.2, -0.6, 0, 0.6, 1.2].forEach((fOff, fi) => {
      const pMat = fi % 3 === 0 ? flowerPetalMatRed : fi % 3 === 1 ? flowerPetalMatYellow : flowerPetalMatPink;
      const flowerMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), pMat);
      flowerMesh.position.set(-4.8 + fOff, 1.66, 4.34);
      cozyHouseGroup.add(flowerMesh);
      houseExteriorList.push(flowerMesh);
    });

    // Venezianas Decorativas da Janela Esquerda
    const shutterL1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 3.2, 0.08), shutterMat);
    shutterL1.position.set(-7.15, 3.2, 4.16);
    cozyHouseGroup.add(shutterL1);
    const shutterL2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 3.2, 0.08), shutterMat);
    shutterL2.position.set(-2.45, 3.2, 4.16);
    cozyHouseGroup.add(shutterL2);
    houseExteriorList.push(wGridLH, wGridLV1, wGridLV2, sillL, flowerBoxL, foliageL, shutterL1, shutterL2);

    // --- JANELA FRONTAL DIREITA (Right Front Window with Shutters and Flower Box) ---
    const windowRight = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 0.12), houseWindowsMat);
    windowRight.position.set(4.8, 3.2, 4.16);
    cozyHouseGroup.add(windowRight);
    houseExteriorList.push(windowRight);

    // Moldura e Cruzetas Brancas da Janela Direita
    const wGridRH = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 0.18), wFrameMat);
    wGridRH.position.set(4.8, 3.2, 4.18);
    cozyHouseGroup.add(wGridRH);
    const wGridRV1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.18), wFrameMat);
    wGridRV1.position.set(3.8, 3.2, 4.18);
    cozyHouseGroup.add(wGridRV1);
    const wGridRV2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 0.18), wFrameMat);
    wGridRV2.position.set(5.8, 3.2, 4.18);
    cozyHouseGroup.add(wGridRV2);

    // Peitoril da Janela Direita
    const sillR = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.18, 0.35), houseOakTrimMat);
    sillR.position.set(4.8, 1.55, 4.25);
    cozyHouseGroup.add(sillR);

    // Floreira da Janela Direita com Flores Coloridas
    const flowerBoxR = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.32, 0.32), flowerBoxMat);
    flowerBoxR.position.set(4.8, 1.35, 4.32);
    cozyHouseGroup.add(flowerBoxR);
    const foliageR = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.22, 0.28), flowerFoliageMat);
    foliageR.position.set(4.8, 1.52, 4.32);
    cozyHouseGroup.add(foliageR);
    [-1.2, -0.6, 0, 0.6, 1.2].forEach((fOff, fi) => {
      const pMat = fi % 3 === 0 ? flowerPetalMatPink : fi % 3 === 1 ? flowerPetalMatRed : flowerPetalMatYellow;
      const flowerMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), pMat);
      flowerMesh.position.set(4.8 + fOff, 1.66, 4.34);
      cozyHouseGroup.add(flowerMesh);
      houseExteriorList.push(flowerMesh);
    });

    // Venezianas Decorativas da Janela Direita
    const shutterR1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 3.2, 0.08), shutterMat);
    shutterR1.position.set(2.45, 3.2, 4.16);
    cozyHouseGroup.add(shutterR1);
    const shutterR2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 3.2, 0.08), shutterMat);
    shutterR2.position.set(7.15, 3.2, 4.16);
    cozyHouseGroup.add(shutterR2);
    houseExteriorList.push(wGridRH, wGridRV1, wGridRV2, sillR, flowerBoxR, foliageR, shutterR1, shutterR2);

    // --- BANDEIRA ENVIDRAÇADA SUPERIOR DA PORTA DE ENTRADA (Transom Fanlight Window) ---
    const transomWindow = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.12), houseWindowsMat);
    transomWindow.position.set(0, 4.95, 4.16);
    cozyHouseGroup.add(transomWindow);
    const transomFrame = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.18), wFrameMat);
    transomFrame.position.set(0, 4.95, 4.18);
    cozyHouseGroup.add(transomFrame);
    const transomDiv1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.18), wFrameMat);
    transomDiv1.position.set(-0.6, 4.95, 4.18);
    cozyHouseGroup.add(transomDiv1);
    const transomDiv2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.18), wFrameMat);
    transomDiv2.position.set(0.6, 4.95, 4.18);
    cozyHouseGroup.add(transomDiv2);
    houseExteriorList.push(transomWindow, transomFrame, transomDiv1, transomDiv2);

    // 5. Gabled Roof & Attic Dormer (Telhado Colonial com Águas e Mansarda - Elevado adicionalmente em 3 pixels)
    // Left Roof Slope (Aba lateral esquerda estendida em 20 pixels e elevada)
    const roofSlopeL = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.45, 14.0), houseRoofTileMat);
    roofSlopeL.position.set(-5.2, 8.56, -2.0);
    roofSlopeL.rotation.z = 0.58;
    roofSlopeL.castShadow = true;
    cozyHouseGroup.add(roofSlopeL);
    houseExteriorList.push(roofSlopeL);

    // Right Roof Slope (Aba lateral direita estendida em 20 pixels e elevada)
    const roofSlopeR = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.45, 14.0), houseRoofTileMat);
    roofSlopeR.position.set(5.2, 8.56, -2.0);
    roofSlopeR.rotation.z = -0.58;
    roofSlopeR.castShadow = true;
    cozyHouseGroup.add(roofSlopeR);
    houseExteriorList.push(roofSlopeR);

    // Ridge Cap (Cumeeira do Telhado - Elevada em 3 pixels)
    const ridgeCap = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 14.2), new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.5 }));
    ridgeCap.position.set(0, 11.52, -2.0);
    cozyHouseGroup.add(ridgeCap);
    houseExteriorList.push(ridgeCap);

    // 5b. Oitão do Telhado / Triangular Gable Walls (Fechamento Sólido e Opaco do Frontão Frontal e Traseiro)
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-8.0, 0);
    gableShape.lineTo(8.0, 0);
    gableShape.lineTo(0, 4.77);
    gableShape.closePath();

    const gableExtrudeSettings = {
      depth: 0.35,
      bevelEnabled: false,
    };
    const gableGeo = new THREE.ExtrudeGeometry(gableShape, gableExtrudeSettings);
    gableGeo.computeVertexNormals();

    // Front Gable Wall (Oitão Frontal - fecha completamente o triângulo do telhado sobre a fachada da frente)
    const frontGable = new THREE.Mesh(gableGeo, houseTimberMat);
    frontGable.position.set(0, 6.85, 3.825);
    frontGable.castShadow = true;
    frontGable.receiveShadow = true;
    cozyHouseGroup.add(frontGable);
    houseExteriorList.push(frontGable);

    // Back Gable Wall (Oitão Traseiro - fecha completamente o triângulo do telhado sobre a parede de fundo)
    const backGable = new THREE.Mesh(gableGeo, houseTimberMat);
    backGable.position.set(0, 6.85, -8.175);
    backGable.castShadow = true;
    backGable.receiveShadow = true;
    cozyHouseGroup.add(backGable);

    // Moldura Divisória Horizontal do Oitão Frontal (Cornija Colonial)
    const frontGableCornice = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.22, 0.45), houseOakTrimMat);
    frontGableCornice.position.set(0, 6.9, 4.0);
    frontGableCornice.castShadow = true;
    cozyHouseGroup.add(frontGableCornice);
    houseExteriorList.push(frontGableCornice);

    // Attic Dormer Window (Mansarda de Sótão / Janela Decorativa do Oitão - Elevada em 3 pixels)
    const dormerGroup = new THREE.Group();
    dormerGroup.position.set(0, 9.22, 4.0);

    const dWalls = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.8), houseTimberMat);
    dWalls.position.set(0, 0, 0.2);
    dWalls.castShadow = true;
    dormerGroup.add(dWalls);

    const dWindow = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.15), houseWindowsMat);
    dWindow.position.set(0, 0.05, 0.62);
    dormerGroup.add(dWindow);

    // Window Mullions (Cruzeta Branca da Janela do Oitão)
    const dFrameH = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.18), wFrameMat);
    dFrameH.position.set(0, 0.05, 0.63);
    dormerGroup.add(dFrameH);

    const dFrameV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 0.18), wFrameMat);
    dFrameV.position.set(0, 0.05, 0.63);
    dormerGroup.add(dFrameV);

    const dRoofL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.2), houseRoofTileMat);
    dRoofL.position.set(-0.7, 1.15, 0.2);
    dRoofL.rotation.z = 0.55;
    dRoofL.castShadow = true;
    dormerGroup.add(dRoofL);

    const dRoofR = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 1.2), houseRoofTileMat);
    dRoofR.position.set(0.7, 1.15, 0.2);
    dRoofR.rotation.z = -0.55;
    dRoofR.castShadow = true;
    dormerGroup.add(dRoofR);

    cozyHouseGroup.add(dormerGroup);
    houseExteriorList.push(dormerGroup);

    // 6. Brick Chimney & Animated Smoke (Chaminé de Tijolos Vermelhos e Fumaça Aconchegante - Elevada em 3 pixels)
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6.8, 1.6), houseBrickMat);
    chimney.position.set(5.2, 9.92, -4.0);
    chimney.castShadow = true;
    cozyHouseGroup.add(chimney);
    houseExteriorList.push(chimney);

    const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 2.0), houseStoneMat);
    chimneyCap.position.set(5.2, 13.42, -4.0);
    cozyHouseGroup.add(chimneyCap);
    houseExteriorList.push(chimneyCap);

    const chimneyPot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0x7c2d12 }));
    chimneyPot.position.set(5.2, 13.92, -4.0);
    cozyHouseGroup.add(chimneyPot);
    houseExteriorList.push(chimneyPot);

    // Smoke Puff Particles (Fumaça Suave da Lareira)
    const smokeMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.35 });
    for (let sm = 0; sm < 4; sm++) {
      const smokePuff = new THREE.Mesh(new THREE.SphereGeometry(0.45 + sm * 0.15, 6, 6), smokeMat);
      smokePuff.position.set(5.2 + (sm % 2 === 0 ? 0.2 : -0.2), 14.32 + sm * 0.9, -4.0);
      cozyHouseGroup.add(smokePuff);
      houseChimneySmokeList.push({
        mesh: smokePuff,
        startY: 14.32 + sm * 0.9,
        speedY: 0.8 + sm * 0.2,
        offset: sm * 1.2,
      });
    }

    // 7. Complete Cozy Bedroom & Living Interior (Quarto Aconchegante com Cama, Lareira, Abajur e Tapete)
    // Wood Floorboards Inside
    const interiorFloor = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.1, 11.6), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 }));
    interiorFloor.position.set(0, 0.75, -2.0);
    cozyHouseGroup.add(interiorFloor);

    // Circular Woven Area Rug (Tapete Redondo Quentinho no Quarto)
    const houseRugGeo = new THREE.CircleGeometry(3.2, 24);
    const houseRugMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9, side: THREE.DoubleSide });
    const houseRug = new THREE.Mesh(houseRugGeo, houseRugMat);
    houseRug.rotation.x = -Math.PI / 2;
    houseRug.position.set(-3.2, 0.82, 0.5);
    cozyHouseGroup.add(houseRug);

    // --- COZY BED (CAMA CONFORTÁVEL COM COLCHÃO, TRAVESSEIRO E EDREDOM) ---
    const bedGroup = new THREE.Group();
    bedGroup.position.set(-3.2, 0.8, 0.5);

    // Bed Oak Frame (Estrutura de Carvalho)
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 5.0), houseOakTrimMat);
    bedFrame.position.set(0, 0.25, 0);
    bedGroup.add(bedFrame);

    // Bed Headboard (Cabeceira de Madeira Maciça)
    const bedHeadboard = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.2, 0.4), houseOakTrimMat);
    bedHeadboard.position.set(0, 1.2, -2.4);
    bedGroup.add(bedHeadboard);

    // Bed Footboard (Peseira)
    const bedFootboard = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.2, 0.4), houseOakTrimMat);
    bedFootboard.position.set(0, 0.7, 2.4);
    bedGroup.add(bedFootboard);

    // Soft Thick Mattress (Colchão Fofo Branco)
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.6, 4.6), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 }));
    mattress.position.set(0, 0.7, 0);
    bedGroup.add(mattress);

    // Soft Cloud Pillow (Travesseiro Macio)
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 1.1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }));
    pillow.position.set(0, 1.1, -1.6);
    bedGroup.add(pillow);

    // Cozy Patchwork Quilt Blanket (Edredom Aconchegante em Verde-Azulado)
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.35, 3.2), new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.7 }));
    blanket.position.set(0, 0.95, 0.7);
    bedGroup.add(blanket);

    cozyHouseGroup.add(bedGroup);

    // --- BEDSIDE NIGHTSTAND & WARM TABLE LAMP (MESA DE CABECEIRA E ABAJUR) ---
    const nightstandGroup = new THREE.Group();
    nightstandGroup.position.set(-5.6, 0.8, -1.0);
    const nStand = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), houseOakTrimMat);
    nStand.position.set(0, 0.6, 0);
    nightstandGroup.add(nStand);
    const nDrawer = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 0.1), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
    nDrawer.position.set(0, 0.75, 0.6);
    nightstandGroup.add(nDrawer);

    // Bedside Lamp (Abajur com Cúpula Aconchegante)
    const houseBedsideLampMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xfef3c7,
      emissiveIntensity: 0.2,
      roughness: 0.2,
    });
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.4, 12), new THREE.MeshStandardMaterial({ color: 0x64748b }));
    lampBase.position.set(0, 1.35, 0);
    nightstandGroup.add(lampBase);
    const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 0.5, 12), houseBedsideLampMat);
    lampShade.position.set(0, 1.7, 0);
    nightstandGroup.add(lampShade);

    // Bedside Book & Cup of Herbal Tea (Livro e Xícara de Chá de Camomila)
    const nBook = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.35), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
    nBook.position.set(0.25, 1.26, 0.2);
    nightstandGroup.add(nBook);
    const nCup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.18, 8), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
    nCup.position.set(-0.25, 1.3, 0.2);
    nightstandGroup.add(nCup);

    cozyHouseGroup.add(nightstandGroup);

    // --- COZY FIREPLACE & HEARTH (LAREIRA DE TIJOLOS COM BRASAS E LENHA) ---
    const fireplaceGroup = new THREE.Group();
    fireplaceGroup.position.set(4.8, 0.8, -3.5);
    const fMantle = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 1.2), houseBrickMat);
    fMantle.position.set(0, 1.6, 0);
    fireplaceGroup.add(fMantle);
    const fHearth = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.6, 0.8), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 }));
    fHearth.position.set(0, 0.9, 0.3);
    fireplaceGroup.add(fHearth);

    // Burning Logs & Embers (Lenha e Brasas Incandescentes)
    const houseFireplaceMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xf97316,
      emissiveIntensity: 1.2,
      roughness: 0.3,
    });
    const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8), houseOakTrimMat);
    log1.rotation.z = Math.PI / 4;
    log1.position.set(0, 0.4, 0.3);
    fireplaceGroup.add(log1);
    const emberBed = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.6), houseFireplaceMat);
    emberBed.position.set(0, 0.2, 0.3);
    fireplaceGroup.add(emberBed);

    // Fireplace Flickering PointLight
    const fireplaceLight = new THREE.PointLight(0xf97316, 1.2, 12);
    fireplaceLight.position.set(0, 1.0, 0.8);
    fireplaceGroup.add(fireplaceLight);

    cozyHouseGroup.add(fireplaceGroup);

    // --- GAMER & STUDY STATION (ESCRIVANINHA DE ESTUDOS COM PC GAMER E MONITOR CURVO) ---
    const deskGroup = new THREE.Group();
    deskGroup.position.set(-5.6, 0.8, -5.2);

    // Wooden Desk with Steel Legs
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 1.8), houseOakTrimMat);
    deskTop.position.set(0, 1.4, 0);
    deskGroup.add(deskTop);
    [-1.6, 1.6].forEach((dx) => {
      const dLeg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 1.6), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 }));
      dLeg.position.set(dx, 0.7, 0);
      deskGroup.add(dLeg);
    });

    // Curved Ultra-Wide PC Monitor with Glowing Screen
    const monitorStand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.25, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 }));
    monitorStand.position.set(0, 1.7, -0.5);
    deskGroup.add(monitorStand);
    const monitorScreenMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    });
    const monitorScreen = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.1), monitorScreenMat);
    monitorScreen.position.set(0, 2.3, -0.5);
    deskGroup.add(monitorScreen);

    // PC RGB Tower with Neon Strip
    const pcTower = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 }));
    pcTower.position.set(1.3, 2.1, -0.2);
    deskGroup.add(pcTower);
    const pcRgbStrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.0, 1.0), new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xa855f7, emissiveIntensity: 1.5 }));
    pcRgbStrip.position.set(1.0, 2.1, -0.2);
    deskGroup.add(pcRgbStrip);

    // Mechanical Keyboard & Mouse
    const keyboardMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.05, 0.4), new THREE.MeshStandardMaterial({ color: 0x1e293b, emissive: 0x38bdf8, emissiveIntensity: 0.3 }));
    keyboardMesh.position.set(-0.2, 1.48, 0.2);
    deskGroup.add(keyboardMesh);
    const mouseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.28), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    mouseMesh.position.set(0.65, 1.48, 0.2);
    deskGroup.add(mouseMesh);

    // Ergonomic Gaming Chair
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, 0.9);
    const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.8, 12), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    chairBase.position.set(0, 0.4, 0);
    chairGroup.add(chairBase);
    const chairSeatMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 1.1), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }));
    chairSeatMesh.position.set(0, 0.9, 0);
    chairGroup.add(chairSeatMesh);
    const chairBackMesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 0.15), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 }));
    chairBackMesh.position.set(0, 1.6, -0.45);
    chairGroup.add(chairBackMesh);
    deskGroup.add(chairGroup);

    cozyHouseGroup.add(deskGroup);

    // --- LOUNGE CORNER & PLUSH SOFA (CANTO DE ESTAR E RELAXAMENTO) ---
    const sofaGroup = new THREE.Group();
    sofaGroup.position.set(4.2, 0.8, 0.5);

    // Plush Sofa Base & Back
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 1.8), new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.7 }));
    sofaBase.position.set(0, 0.3, 0);
    sofaGroup.add(sofaBase);
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.7 }));
    sofaBack.position.set(0, 0.9, -0.7);
    sofaGroup.add(sofaBack);
    [-1.7, 1.7].forEach((sx) => {
      const armRest = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 1.8), new THREE.MeshStandardMaterial({ color: 0x115e59, roughness: 0.7 }));
      armRest.position.set(sx, 0.65, 0);
      sofaGroup.add(armRest);
    });

    // Sofa Cushions
    const cushion1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.8 }));
    cushion1.position.set(-1.0, 0.7, -0.3);
    sofaGroup.add(cushion1);
    const cushion2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.8 }));
    cushion2.position.set(1.0, 0.7, -0.3);
    sofaGroup.add(cushion2);

    // Coffee Table with Board Game
    const cTable = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.2), houseOakTrimMat);
    cTable.position.set(0, 0.45, 1.5);
    sofaGroup.add(cTable);
    const cTableLeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.1), houseOakTrimMat);
    cTableLeg1.position.set(-1.0, 0.22, 1.0);
    sofaGroup.add(cTableLeg1);
    const cTableLeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.1), houseOakTrimMat);
    cTableLeg2.position.set(1.0, 0.22, 1.0);
    sofaGroup.add(cTableLeg2);

    // Board Game on Coffee Table
    const boardGame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.04, 0.6), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    boardGame.position.set(-0.4, 0.52, 1.5);
    sofaGroup.add(boardGame);

    // Acoustic Guitar Standing near Sofa
    const houseGuitarGroup = new THREE.Group();
    houseGuitarGroup.position.set(2.4, 0.2, 0.2);
    houseGuitarGroup.rotation.z = -0.15;
    const hGBody = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.1, 12), new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.5 }));
    hGBody.position.set(0, 0.6, 0);
    houseGuitarGroup.add(hGBody);
    const hGNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), houseOakTrimMat);
    hGNeck.position.set(0, 1.6, 0);
    houseGuitarGroup.add(hGNeck);
    sofaGroup.add(houseGuitarGroup);

    cozyHouseGroup.add(sofaGroup);

    // --- DECORATED WALL SHELVES & FRAMED ART (PRATELEIRAS COM SUCULENTAS E QUADROS) ---
    // Floating Wall Shelves
    const shelf1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 0.6), houseOakTrimMat);
    shelf1.position.set(0, 4.2, -7.6);
    cozyHouseGroup.add(shelf1);

    // Succulent Plant on Shelf
    const potMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.25, 8), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
    potMesh.position.set(-0.9, 4.38, -7.6);
    cozyHouseGroup.add(potMesh);
    const succulentMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), new THREE.MeshStandardMaterial({ color: 0x16a34a }));
    succulentMesh.position.set(-0.9, 4.58, -7.6);
    cozyHouseGroup.add(succulentMesh);

    // Gold Resilience Trophy on Shelf
    const trophyBase = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.25), new THREE.MeshStandardMaterial({ color: 0x451a03 }));
    trophyBase.position.set(0.8, 4.32, -7.6);
    cozyHouseGroup.add(trophyBase);
    const trophyCup = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.2 }));
    trophyCup.position.set(0.8, 4.52, -7.6);
    cozyHouseGroup.add(trophyCup);

    // Framed Wall Art Posters
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const artPosterMat1 = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.2 });
    const artPosterMat2 = new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x16a34a, emissiveIntensity: 0.2 });

    const posterFrame1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.08), frameMat);
    posterFrame1.position.set(-3.6, 4.6, -7.8);
    cozyHouseGroup.add(posterFrame1);
    const posterCanvas1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 0.09), artPosterMat1);
    posterCanvas1.position.set(-3.6, 4.6, -7.8);
    cozyHouseGroup.add(posterCanvas1);

    const posterFrame2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.08), frameMat);
    posterFrame2.position.set(3.6, 4.6, -7.8);
    cozyHouseGroup.add(posterFrame2);
    const posterCanvas2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 0.09), artPosterMat2);
    posterCanvas2.position.set(3.6, 4.6, -7.8);
    cozyHouseGroup.add(posterCanvas2);

    // --- FAIRY STRING LIGHTS ALONG CEILING (CORDÃO DE LUZES PISCA-PISCA ACONCHEGANTE) ---
    const stringLightColors = [0xfde047, 0xf43f5e, 0x38bdf8, 0xa855f7, 0x4ade80];
    for (let sl = -7.0; sl <= 7.0; sl += 1.4) {
      const slColor = stringLightColors[Math.abs(Math.round(sl * 10)) % stringLightColors.length];
      const slBulbMat = new THREE.MeshStandardMaterial({
        color: slColor,
        emissive: slColor,
        emissiveIntensity: 1.2,
        roughness: 0.2,
      });
      const slBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), slBulbMat);
      const sagY = 5.8 - Math.sin(Math.PI * ((sl + 7.0) / 14.0)) * 0.4;
      slBulb.position.set(sl, sagY, -7.7);
      cozyHouseGroup.add(slBulb);
    }

    // --- CUTE SLEEPING PET CAT (GATINHO DORMILHO ACONCHEGANTE NO QUARTO) ---
    const petGroup = new THREE.Group();
    petGroup.position.set(-1.0, 0.8, -1.5);

    // Round Pet Bed
    const petBed = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.15, 16), new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.9 }));
    petBed.position.set(0, 0.08, 0);
    petGroup.add(petBed);

    // Sleeping Cat Body
    const catBody = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 }));
    catBody.scale.set(1.2, 0.7, 1.0);
    catBody.position.set(0, 0.28, 0);
    petGroup.add(catBody);

    // Cat Head resting on paws
    const catHead = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 }));
    catHead.position.set(0.35, 0.32, 0.1);
    petGroup.add(catHead);

    // Cat Ears
    [-0.08, 0.08].forEach((earZ) => {
      const catEar = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.15, 4), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
      catEar.position.set(0.42, 0.48, 0.1 + earZ);
      petGroup.add(catEar);
    });

    cozyHouseGroup.add(petGroup);

    // Interior Warm Ceiling PointLight (Iluminação Geral do Interior da Casa)
    const interiorPointLight = new THREE.PointLight(0xf59e0b, 0.2, 26);
    interiorPointLight.position.set(0, 5.0, 0);
    cozyHouseGroup.add(interiorPointLight);

    // Track House Lights for Dynamic Day/Night Automations
    houseNightLightsList.push({
      windowsMat: houseWindowsMat,
      porchBulbMat: housePorchBulbMat,
      bedsideLampMat: houseBedsideLampMat,
      interiorLight: interiorPointLight,
      porchLight: porchPointLight,
      fireplaceLight: fireplaceLight,
    });

    // Interactive Sleep / Rest Halo Ring (Círculo Brilhante de Descanso no Chão ao lado da Cama)
    const houseRestRingGeo = new THREE.RingGeometry(2.4, 2.8, 24);
    const houseRestRingMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const houseRestRing = new THREE.Mesh(houseRestRingGeo, houseRestRingMat);
    houseRestRing.rotation.x = -Math.PI / 2;
    houseRestRing.position.set(-3.2, 0.86, 0.5);
    cozyHouseGroup.add(houseRestRing);

    // 8. Animated 3D Floating "Zzz" & Rest Dream Sparkles (Partículas Flutuantes de Sono Tranquilo)
    const zMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.85 });
    for (let zI = 0; zI < 4; zI++) {
      const zGroup = new THREE.Group();
      // Construct a cute 3D 'Z' glyph with small boxes
      const barTop = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.08), zMat);
      barTop.position.set(0, 0.2, 0);
      zGroup.add(barTop);
      const diag = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.08), zMat);
      diag.position.set(0, 0, 0);
      diag.rotation.z = -Math.PI / 4;
      zGroup.add(diag);
      const barBot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.08), zMat);
      barBot.position.set(0, -0.2, 0);
      zGroup.add(barBot);

      const zScale = 0.6 + zI * 0.25;
      zGroup.scale.set(zScale, zScale, zScale);
      zGroup.position.set(-3.2 + (zI * 0.35), 2.2 + (zI * 0.65), 0.5);
      zGroup.visible = false;
      cozyHouseGroup.add(zGroup);

      houseZzzParticlesList.push({
        group: zGroup,
        startY: 2.2 + zI * 0.65,
        speedY: 0.75 + zI * 0.2,
        phase: zI * 1.5,
      });
    }

    // --- HOUSE NIGHT SAFETY BEACON (FEIXE ILUMINADO PARA ORIENTAÇÃO À NOITE) ---
    const houseBeaconBeamGeo = new THREE.CylinderGeometry(0.8, 1.6, 35.0, 16, 1, true);
    const houseBeaconBeamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const houseBeaconBeam = new THREE.Mesh(houseBeaconBeamGeo, houseBeaconBeamMat);
    houseBeaconBeam.position.set(0, 17.5, 0);
    cozyHouseGroup.add(houseBeaconBeam);

    const houseBeaconRingGeo = new THREE.TorusGeometry(2.5, 0.18, 8, 24);
    const houseBeaconRingMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.0 });
    const houseBeaconRing = new THREE.Mesh(houseBeaconRingGeo, houseBeaconRingMat);
    houseBeaconRing.rotation.x = Math.PI / 2;
    houseBeaconRing.position.set(0, 12.0, 0);
    cozyHouseGroup.add(houseBeaconRing);

    // --- NOCTURNAL MONSTER MESH GENERATORS (ARANHA & ESCORPIÃO) ---
    const createSpiderMesh = () => {
      const spiderGroup = new THREE.Group();
      const spiderMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.2 });
      const abdomenMat = new THREE.MeshStandardMaterial({ color: 0x450a0a, roughness: 0.6, metalness: 0.1 });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const fangMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });

      // Cephalothorax
      const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.48, 12, 12), spiderMat);
      headMesh.position.set(0, 0.45, 0);
      headMesh.castShadow = true;
      spiderGroup.add(headMesh);

      // Abdomen
      const abdomenGeo = new THREE.SphereGeometry(0.75, 14, 14);
      abdomenGeo.scale(1.0, 0.85, 1.3);
      const abdomenMesh = new THREE.Mesh(abdomenGeo, abdomenMat);
      abdomenMesh.position.set(0, 0.65, -1.0);
      abdomenMesh.castShadow = true;
      spiderGroup.add(abdomenMesh);

      // Fangs
      const fangsGroup = new THREE.Group();
      [-0.15, 0.15].forEach((fX) => {
        const fang = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), fangMat);
        fang.rotation.x = Math.PI * 0.7;
        fang.position.set(fX, 0.3, 0.5);
        fangsGroup.add(fang);
      });
      spiderGroup.add(fangsGroup);

      // Eyes
      [-0.2, -0.08, 0.08, 0.2].forEach((eX, idx) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
        eye.position.set(eX, 0.58 + (idx % 2) * 0.06, 0.45);
        spiderGroup.add(eye);
      });

      // 8 Articulated Legs
      const legGroups: THREE.Group[] = [];
      [-1, 1].forEach((side) => {
        for (let l = 0; l < 4; l++) {
          const legPivot = new THREE.Group();
          legPivot.position.set(side * 0.35, 0.42, 0.25 - l * 0.22);

          const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.8, 6), spiderMat);
          femur.rotation.z = side * -0.65;
          femur.position.set(side * 0.35, 0.25, 0);
          legPivot.add(femur);

          const tibia = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.9, 6), spiderMat);
          tibia.rotation.z = side * 0.55;
          tibia.position.set(side * 0.65, -0.25, 0);
          legPivot.add(tibia);

          spiderGroup.add(legPivot);
          legGroups.push(legPivot);
        }
      });

      return { spiderGroup, legGroups, fangsGroup };
    };

    const createScorpionMesh = () => {
      const scorpionGroup = new THREE.Group();
      const scorpionMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.5, metalness: 0.6 });
      const stingerMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });

      // Body
      const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.35, 1.2), scorpionMat);
      bodyMesh.position.set(0, 0.35, 0);
      bodyMesh.castShadow = true;
      scorpionGroup.add(bodyMesh);

      // Pincers / Claws
      const pincerL = new THREE.Group();
      pincerL.position.set(-0.55, 0.35, 0.6);
      const pArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6), scorpionMat);
      pArmL.rotation.z = 0.6;
      pArmL.rotation.x = 0.3;
      pArmL.position.set(-0.25, 0, 0.25);
      pincerL.add(pArmL);

      const clawMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.4 });
      const clawL = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 6), clawMat);
      clawL.rotation.x = Math.PI / 2;
      clawL.position.set(-0.45, 0, 0.55);
      pincerL.add(clawL);
      scorpionGroup.add(pincerL);

      const pincerR = new THREE.Group();
      pincerR.position.set(0.55, 0.35, 0.6);
      const pArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6), scorpionMat);
      pArmR.rotation.z = -0.6;
      pArmR.rotation.x = 0.3;
      pArmR.position.set(0.25, 0, 0.25);
      pincerR.add(pArmR);

      const clawR = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 6), clawMat);
      clawR.rotation.x = Math.PI / 2;
      clawR.position.set(0.45, 0, 0.55);
      pincerR.add(clawR);
      scorpionGroup.add(pincerR);

      // Segmented Arched Tail
      const tailGroup = new THREE.Group();
      tailGroup.position.set(0, 0.4, -0.6);

      let prevY = 0;
      let prevZ = 0;
      for (let t = 0; t < 5; t++) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.12 - t * 0.015, 0.14 - t * 0.015, 0.35, 8), scorpionMat);
        const angle = (t / 4) * Math.PI * 0.75;
        const curY = prevY + Math.sin(angle) * 0.3;
        const curZ = prevZ - Math.cos(angle) * 0.3;
        seg.position.set(0, curY, curZ);
        seg.rotation.x = angle;
        tailGroup.add(seg);
        prevY = curY;
        prevZ = curZ;
      }

      // Toxic Venom Stinger Tip
      const stingerMesh = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 8), stingerMat);
      stingerMesh.rotation.x = -Math.PI * 0.8;
      stingerMesh.position.set(0, prevY + 0.15, prevZ + 0.15);
      tailGroup.add(stingerMesh);
      scorpionGroup.add(tailGroup);

      // 8 Walking Legs
      const legGroups: THREE.Group[] = [];
      [-1, 1].forEach((side) => {
        for (let l = 0; l < 4; l++) {
          const legPivot = new THREE.Group();
          legPivot.position.set(side * 0.38, 0.3, 0.3 - l * 0.22);

          const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.7, 6), scorpionMat);
          legMesh.rotation.z = side * -0.7;
          legMesh.position.set(side * 0.3, -0.15, 0);
          legPivot.add(legMesh);

          scorpionGroup.add(legPivot);
          legGroups.push(legPivot);
        }
      });

      // Eyes
      [-0.12, 0.12].forEach((eX) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), eyeMat);
        eye.position.set(eX, 0.48, 0.55);
        scorpionGroup.add(eye);
      });

      return { scorpionGroup, legGroups, pincerL, pincerR, tailGroup, stingerMesh };
    };

    // --- NOCTURNAL MONSTERS POOL (2 ARANHAS + 2 ESCORPIÕES) ---
    for (let m = 0; m < 4; m++) {
      const isSpider = m % 2 === 0;
      let mGroup: THREE.Group;
      let legGroups: THREE.Group[];
      let pincerL: THREE.Group | undefined;
      let pincerR: THREE.Group | undefined;
      let tailGroup: THREE.Group | undefined;
      let stingerMesh: THREE.Mesh | undefined;
      let fangsGroup: THREE.Group | undefined;

      if (isSpider) {
        const spiderData = createSpiderMesh();
        mGroup = spiderData.spiderGroup;
        legGroups = spiderData.legGroups;
        fangsGroup = spiderData.fangsGroup;
      } else {
        const scorpData = createScorpionMesh();
        mGroup = scorpData.scorpionGroup;
        legGroups = scorpData.legGroups;
        pincerL = scorpData.pincerL;
        pincerR = scorpData.pincerR;
        tailGroup = scorpData.tailGroup;
        stingerMesh = scorpData.stingerMesh;
      }

      mGroup.visible = false;
      scene.add(mGroup);

      nocturnalMonstersList.push({
        id: m,
        type: isSpider ? 'SPIDER' : 'SCORPION',
        group: mGroup,
        legGroups,
        pincerL,
        pincerR,
        tailGroup,
        stingerMesh,
        fangsGroup,
        x: 0,
        z: 0,
        y: 0,
        speed: 5.5 + m * 0.25,
        walkPhase: Math.random() * Math.PI * 2,
        attackCooldown: 0,
        active: false,
      });
    }

    // --- PLANTING/AGRICULTURAL AREA IN THE BACKGROUND (Z = -95.0, X = -10.0) ---
    // Represents a lovely ploughed countryside soil patch near the mountains
    const plantingAreaGroup = new THREE.Group();
    plantingAreaGroup.position.set(-10.0, 0, -95.0);
    scene.add(plantingAreaGroup);

    // 1. Dark Rich Ploughed Soil Base (Terra Arada)
    const soilBaseMat = new THREE.MeshStandardMaterial({
      color: 0x452a15, // Dark rich soil brown
      roughness: 0.95,
      metalness: 0.05,
    });
    // A nice large rectangular agricultural field
    const soilBase = new THREE.Mesh(new THREE.BoxGeometry(48.0, 0.15, 28.0), soilBaseMat);
    soilBase.position.set(0, 0.075, 0);
    soilBase.receiveShadow = true;
    soilBase.castShadow = true;
    plantingAreaGroup.add(soilBase);

    // 2. Parallel Raised Furrows (Linhas de plantio)
    const furrowMat = new THREE.MeshStandardMaterial({
      color: 0x3b2310, // Even darker soil in the trenches/furrows
      roughness: 0.98,
    });
    const cropGreenMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e, // Fresh plant green
      roughness: 0.6,
    });

    const furrowZOffsets = [-10.0, -6.0, -2.0, 2.0, 6.0, 10.0];

    furrowZOffsets.forEach((zOffset) => {
      // Raised dirt row box
      const rowMesh = new THREE.Mesh(new THREE.BoxGeometry(45.0, 0.15, 1.4), furrowMat);
      rowMesh.position.set(0, 0.16, zOffset);
      rowMesh.castShadow = true;
      rowMesh.receiveShadow = true;
      plantingAreaGroup.add(rowMesh);

      // Plant sprouts in each row
      for (let xOffset = -21.0; xOffset <= 21.0; xOffset += 3.0) {
        // Little leafy plant representation (2 intersecting tiny cones/cylinders)
        const plantGroup = new THREE.Group();
        plantGroup.position.set(xOffset, 0.22, zOffset);

        const leaf1 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 4), cropGreenMat);
        leaf1.rotation.z = 0.2 + Math.random() * 0.1;
        leaf1.position.y = 0.225;
        plantGroup.add(leaf1);

        const leaf2 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 4), cropGreenMat);
        leaf2.rotation.z = -0.2 - Math.random() * 0.1;
        leaf2.position.set(0.1, 0.2, 0);
        plantGroup.add(leaf2);

        plantingAreaGroup.add(plantGroup);
      }
    });

    // 3. Cute 3D Tractor (Trator Vermelho do Campo)
    const tractorGroup = new THREE.Group();
    // Start at furrow zOffset = 2.0, moving along X
    tractorGroup.position.set(-18.0, 0.0, 2.0); // local to plantingAreaGroup
    plantingAreaGroup.add(tractorGroup);

    // Red Metal Material for Classic Tractor Body
    const tractorRedMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Crimson red
      roughness: 0.3,
      metalness: 0.6,
    });
    const tractorDarkGreyMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.6,
    });
    const tractorYellowMat = new THREE.MeshStandardMaterial({
      color: 0xeab308, // John Deere yellow accent
      roughness: 0.4,
      metalness: 0.3,
    });
    const tractorGlassMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.5,
      roughness: 0.1,
    });

    // Tractor Main Frame / Engine Compartment
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.5), tractorRedMat);
    chassis.position.set(0, 0.8, 0);
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    tractorGroup.add(chassis);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.2), tractorRedMat);
    hood.position.set(1.4, 0.85, 0);
    hood.castShadow = true;
    tractorGroup.add(hood);

    // Radiator front grille
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 1.0), tractorDarkGreyMat);
    grille.position.set(2.21, 0.85, 0);
    tractorGroup.add(grille);

    // Glowing headlights
    const lightGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const headlightL = new THREE.Mesh(lightGeo, lightMat);
    headlightL.position.set(2.21, 0.85, -0.45);
    const headlightR = new THREE.Mesh(lightGeo, lightMat);
    headlightR.position.set(2.21, 0.85, 0.45);
    tractorGroup.add(headlightL, headlightR);

    // Tractor Cab (Cabine envidraçada)
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.3), tractorGlassMat);
    cab.position.set(-0.4, 1.8, 0);
    tractorGroup.add(cab);

    const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.4), tractorRedMat);
    cabRoof.position.set(-0.4, 2.45, 0);
    cabRoof.castShadow = true;
    tractorGroup.add(cabRoof);

    // Cab corner posts
    [-0.45, 0.45].forEach((zS) => {
      [-0.65, 0.65].forEach((xS) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), tractorRedMat);
        pillar.position.set(-0.4 + xS, 1.8, zS);
        tractorGroup.add(pillar);
      });
    });

    // Exhaust chimney pipe (Chaminé de Escapamento)
    const exhaustGroup = new THREE.Group();
    exhaustGroup.position.set(1.4, 1.3, -0.4);
    const exhaustPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), tractorDarkGreyMat);
    exhaustPipe.position.y = 0.7;
    exhaustGroup.add(exhaustPipe);
    
    // Tiny angled pipe outlet at top
    const exhaustTip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.3, 8), tractorDarkGreyMat);
    exhaustTip.position.set(0.06, 1.45, 0);
    exhaustTip.rotation.z = -0.4;
    exhaustGroup.add(exhaustTip);
    tractorGroup.add(exhaustGroup);

    // Mudguards (Para-lamas traseiros)
    const guardGeo = new THREE.BoxGeometry(1.6, 0.3, 0.4);
    const guardL = new THREE.Mesh(guardGeo, tractorRedMat);
    guardL.position.set(-0.7, 1.2, -0.85);
    const guardR = new THREE.Mesh(guardGeo, tractorRedMat);
    guardR.position.set(-0.7, 1.2, 0.85);
    tractorGroup.add(guardL, guardR);

    // Tractor Wheels
    const rearWheelGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.5, 12);
    const rearRimGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.52, 8);
    const frontWheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 12);
    const frontRimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.37, 8);

    const tractorWheels: THREE.Group[] = [];

    // Rear wheels (Larger, yellow rims)
    [-1, 1].forEach((side) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(-0.7, 0.85, side * 0.95);
      wGroup.rotation.x = Math.PI / 2;

      const tire = new THREE.Mesh(rearWheelGeo, tractorDarkGreyMat);
      tire.castShadow = true;
      const rim = new THREE.Mesh(rearRimGeo, tractorYellowMat);
      
      // Add tire tread details (little blocks on tire)
      for (let tr = 0; tr < 8; tr++) {
        const tread = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.88, 0.1), tractorDarkGreyMat);
        tread.rotation.y = (tr / 8) * Math.PI * 2;
        wGroup.add(tread);
      }

      wGroup.add(tire, rim);
      tractorGroup.add(wGroup);
      tractorWheels.push(wGroup); // Track rotation group
    });

    // Front wheels (Smaller, yellow rims)
    [-1, 1].forEach((side) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(1.2, 0.5, side * 0.72);
      wGroup.rotation.x = Math.PI / 2;

      const tire = new THREE.Mesh(frontWheelGeo, tractorDarkGreyMat);
      tire.castShadow = true;
      const rim = new THREE.Mesh(frontRimGeo, tractorYellowMat);

      wGroup.add(tire, rim);
      tractorGroup.add(wGroup);
      tractorWheels.push(wGroup); // Track rotation group
    });

    // 4. Farmer NPC inside Cab
    const farmerNPCGroup = new THREE.Group();
    farmerNPCGroup.position.set(-0.4, 1.25, 0); // Inside the cab
    tractorGroup.add(farmerNPCGroup);

    // Farmer body
    const farmerFlannelMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Cool blue flannel shirt
      roughness: 0.8,
    });
    const farmerSkinMat = new THREE.MeshStandardMaterial({
      color: 0xffdbac, // Warm peach skin tone
      roughness: 0.6,
    });
    const strawHatMat = new THREE.MeshStandardMaterial({
      color: 0xeab308, // Yellow straw color
      roughness: 0.9,
    });

    const fTorso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.5), farmerFlannelMat);
    fTorso.position.y = 0.3;
    farmerNPCGroup.add(fTorso);

    const fHead = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), farmerSkinMat);
    fHead.position.y = 0.75;
    farmerNPCGroup.add(fHead);

    // Farmer straw hat (Chapéu de Palha)
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.02, 10), strawHatMat);
    hatBrim.position.y = 0.94;
    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.18, 8), strawHatMat);
    hatCrown.position.y = 1.04;
    farmerNPCGroup.add(hatBrim, hatCrown);

    // Tiny steering wheel
    const steeringWheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
    const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 6, 12), steeringWheelMat);
    steeringWheel.position.set(0.25, 0.45, 0);
    steeringWheel.rotation.y = -0.4;
    farmerNPCGroup.add(steeringWheel);

    // 5. Active smoke puff particle array for chimney
    const tractorSmokePool: { mesh: THREE.Mesh; age: number; maxAge: number; vx: number; vy: number; vz: number }[] = [];
    const smokePuffGeo = new THREE.SphereGeometry(0.22, 6, 6);
    const smokePuffMat = new THREE.MeshBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.45,
    });

    // --- TRACTOR MOVEMENT STATE ---
    let tractorX = -18.0;
    let tractorDirection = 1.0; // 1 = right (positive X), -1 = left (negative X)
    let tractorFurrowIdx = 2; // Index in furrowZOffsets
    let tractorTurnTimer = 0.0;
    let tractorState: 'DRIVING' | 'TURNING' = 'DRIVING';



    // --- CAMPO DE FUTEBOL DA PRAÇA (ALÉM DAS 24 UNIDADES DE PROFUNDIDADE • X = +180.0, Z = -42.0) ---
    const soccerFieldGroup = new THREE.Group();
    soccerFieldGroup.position.set(180.0, 0, -42.0);
    scene.add(soccerFieldGroup);

    // 0. Base Apron / Moldura do Gramado (Turf Perimeter Apron - 68x44)
    const pitchApronGeo = new THREE.PlaneGeometry(68.0, 44.0);
    const pitchApronMat = new THREE.MeshStandardMaterial({
      color: 0x14532d, // Deep perimeter turf green
      roughness: 0.85,
    });
    const pitchApronMesh = new THREE.Mesh(pitchApronGeo, pitchApronMat);
    pitchApronMesh.rotation.x = -Math.PI / 2;
    pitchApronMesh.position.set(0, 0.006, 0);
    pitchApronMesh.receiveShadow = true;
    soccerFieldGroup.add(pitchApronMesh);

    // 1. Gramado Principal (Main Grass Pitch - 64x40 unidades, proporcional ao avatar)
    const pitchWidth = 64.0;
    const pitchDepth = 40.0;
    const pitchGeo = new THREE.PlaneGeometry(pitchWidth, pitchDepth);
    const pitchMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Lush lawn green
      roughness: 0.8,
    });
    const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
    pitchMesh.rotation.x = -Math.PI / 2;
    pitchMesh.position.set(0, 0.012, 0);
    pitchMesh.receiveShadow = true;
    soccerFieldGroup.add(pitchMesh);

    // 2. Linhas de Campo (Field Markings - White Painted Lines)
    const pitchLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Outer Border Rectangle Lines
    const borderTop = new THREE.Mesh(new THREE.PlaneGeometry(pitchWidth, 0.25), pitchLineMat);
    borderTop.rotation.x = -Math.PI / 2;
    borderTop.position.set(0, 0.015, -pitchDepth / 2);
    soccerFieldGroup.add(borderTop);

    const borderBottom = new THREE.Mesh(new THREE.PlaneGeometry(pitchWidth, 0.25), pitchLineMat);
    borderBottom.rotation.x = -Math.PI / 2;
    borderBottom.position.set(0, 0.015, pitchDepth / 2);
    soccerFieldGroup.add(borderBottom);

    const borderLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.25, pitchDepth), pitchLineMat);
    borderLeft.rotation.x = -Math.PI / 2;
    borderLeft.position.set(-pitchWidth / 2, 0.015, 0);
    soccerFieldGroup.add(borderLeft);

    const borderRight = new THREE.Mesh(new THREE.PlaneGeometry(0.25, pitchDepth), pitchLineMat);
    borderRight.rotation.x = -Math.PI / 2;
    borderRight.position.set(pitchWidth / 2, 0.015, 0);
    soccerFieldGroup.add(borderRight);

    // Halfway Line
    const midline = new THREE.Mesh(new THREE.PlaneGeometry(0.25, pitchDepth), pitchLineMat);
    midline.rotation.x = -Math.PI / 2;
    midline.position.set(0, 0.015, 0);
    soccerFieldGroup.add(midline);

    // Center Circle & Spot
    const centerCircleGeo = new THREE.RingGeometry(6.5, 6.8, 32);
    const centerCircleMesh = new THREE.Mesh(centerCircleGeo, pitchLineMat);
    centerCircleMesh.rotation.x = -Math.PI / 2;
    centerCircleMesh.position.set(0, 0.016, 0);
    soccerFieldGroup.add(centerCircleMesh);

    const centerSpotMesh = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16), pitchLineMat);
    centerSpotMesh.rotation.x = -Math.PI / 2;
    centerSpotMesh.position.set(0, 0.017, 0);
    soccerFieldGroup.add(centerSpotMesh);

    // Penalty Boxes (Áreas de Pênalti)
    [-1, 1].forEach((dir) => {
      const boxWidth = 11.0;
      const boxDepth = 18.0;

      const boxFrontLine = new THREE.Mesh(new THREE.PlaneGeometry(0.25, boxDepth), pitchLineMat);
      boxFrontLine.rotation.x = -Math.PI / 2;
      boxFrontLine.position.set(dir * (pitchWidth / 2 - boxWidth), 0.015, 0);
      soccerFieldGroup.add(boxFrontLine);

      const boxTopLine = new THREE.Mesh(new THREE.PlaneGeometry(boxWidth, 0.25), pitchLineMat);
      boxTopLine.rotation.x = -Math.PI / 2;
      boxTopLine.position.set(dir * (pitchWidth / 2 - boxWidth / 2), 0.015, -boxDepth / 2);
      soccerFieldGroup.add(boxTopLine);

      const boxBottomLine = new THREE.Mesh(new THREE.PlaneGeometry(boxWidth, 0.25), pitchLineMat);
      boxBottomLine.rotation.x = -Math.PI / 2;
      boxBottomLine.position.set(dir * (pitchWidth / 2 - boxWidth / 2), 0.015, boxDepth / 2);
      soccerFieldGroup.add(boxBottomLine);
    });

    // 3. Goal Posts with White Net (Gols com Rede - Altura 4.8u, Proporcional ao Avatar)
    const createGoalPostMesh = (xPos: number, isRightGoal: boolean) => {
      const goalGroup = new THREE.Group();
      goalGroup.position.set(xPos, 0, 0);

      const postMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.8 });
      const netMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.45 });

      const postRadius = 0.14;
      const goalHeight = 4.8;
      const goalWidth = 10.0;
      const goalDepth = 3.2;

      // Posts
      const postL = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, goalHeight, 12), postMat);
      postL.position.set(0, goalHeight / 2, -goalWidth / 2);
      goalGroup.add(postL);

      const postR = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, goalHeight, 12), postMat);
      postR.position.set(0, goalHeight / 2, goalWidth / 2);
      goalGroup.add(postR);

      // Crossbar
      const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, goalWidth, 12), postMat);
      crossbar.rotation.x = Math.PI / 2;
      crossbar.position.set(0, goalHeight, 0);
      goalGroup.add(crossbar);

      // Net Box
      const netXDir = isRightGoal ? 1 : -1;
      const netBox = new THREE.Mesh(new THREE.BoxGeometry(goalDepth, goalHeight, goalWidth), netMat);
      netBox.position.set((netXDir * goalDepth) / 2, goalHeight / 2, 0);
      goalGroup.add(netBox);

      return goalGroup;
    };

    const leftGoal = createGoalPostMesh(-32.0, false);
    soccerFieldGroup.add(leftGoal);

    const rightGoal = createGoalPostMesh(32.0, true);
    soccerFieldGroup.add(rightGoal);

    // 4. Stadium Light Poles & Corner Flags (Refletores de 15m e Bandeirinhas)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    [[-32, -20], [32, -20], [-32, 20], [32, 20]].forEach(([xCorner, zCorner]) => {
      const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8), poleMat);
      flagPole.position.set(xCorner, 1.1, zCorner);
      soccerFieldGroup.add(flagPole);

      const flagMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide }));
      const flagVertices = new Float32Array([
        0, 2.1, 0,
        0.65, 1.8, 0,
        0, 1.5, 0
      ]);
      flagMesh.geometry.setAttribute('position', new THREE.BufferAttribute(flagVertices, 3));
      flagMesh.position.set(xCorner, 0, zCorner);
      soccerFieldGroup.add(flagMesh);
    });

    [[-34, -22], [34, -22], [-34, 22], [34, 22]].forEach(([xLight, zLight]) => {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 15.0, 8), poleMat);
      mast.position.set(xLight, 7.5, zLight);
      soccerFieldGroup.add(mast);

      const lampBulbMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfef08a,
        emissiveIntensity: 0.0,
        roughness: 0.2,
      });
      const lightGrid = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.6), lampBulbMat);
      lightGrid.position.set(xLight, 14.8, zLight);
      soccerFieldGroup.add(lightGrid);

      // Light glow cone pointing down towards the soccer field
      const soccerConeGeo = new THREE.CylinderGeometry(0.5, 9.0, 15.0, 16, 1, true);
      const soccerConeMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const cone = new THREE.Mesh(soccerConeGeo, soccerConeMat);
      cone.position.set(xLight, 7.5, zLight);
      cone.visible = false;
      soccerFieldGroup.add(cone);

      // PointLight to illuminate the soccer field at night
      const floodPointLight = new THREE.PointLight(0xfef08a, 0, 45);
      floodPointLight.position.set(xLight, 14.0, zLight);
      soccerFieldGroup.add(floodPointLight);

      soccerFloodlightsList.push({ bulbMat: lampBulbMat, coneMesh: cone, pointLight: floodPointLight });
    });

    // 4.5. ARQUIBANCADA DO CAMPO DE FUTEBOL (GRANDSTAND & BLEACHER NPCS)
    const arquibancadaGroup = new THREE.Group();
    arquibancadaGroup.position.set(0, 0, -22.5);
    soccerFieldGroup.add(arquibancadaGroup);

    const bleacherConcreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
    const bleacherSeatMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 });
    const bleacherRoofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const bleacherTrussMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.7 });

    const bleacherWidth = 52.0;
    for (let tier = 0; tier < 4; tier++) {
      const tierY = 0.35 + tier * 0.65;
      const tierZ = -tier * 1.25;

      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(bleacherWidth, 0.65, 1.25), bleacherConcreteMat);
      stepMesh.position.set(0, tierY - 0.325, tierZ);
      stepMesh.receiveShadow = true;
      stepMesh.castShadow = true;
      arquibancadaGroup.add(stepMesh);

      for (let sX = -24; sX <= 24; sX += 2.2) {
        if (Math.abs(sX) < 1.8 || Math.abs(sX - 18) < 1.8 || Math.abs(sX + 18) < 1.8) continue;

        const seatBench = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.75), bleacherSeatMat);
        seatBench.position.set(sX, tierY + 0.06, tierZ + 0.15);
        seatBench.castShadow = true;
        arquibancadaGroup.add(seatBench);

        const seatBack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.12), bleacherSeatMat);
        seatBack.position.set(sX, tierY + 0.35, tierZ - 0.22);
        arquibancadaGroup.add(seatBack);
      }
    }

    // Stairs
    [-18, 0, 18].forEach((aisleX) => {
      for (let step = 0; step < 8; step++) {
        const aisleStep = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 0.62), bleacherConcreteMat);
        aisleStep.position.set(aisleX, 0.1 + step * 0.32, -step * 0.62);
        arquibancadaGroup.add(aisleStep);
      }
    });

    // Roof & Pillars
    [-25, -12, 0, 12, 25].forEach((pX) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 6.2, 8), bleacherTrussMat);
      col.position.set(pX, 3.1, -3.8);
      arquibancadaGroup.add(col);
    });

    const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(54.0, 0.15, 6.5), bleacherRoofMat);
    roofMesh.rotation.x = 0.12;
    roofMesh.position.set(0, 5.8, -1.8);
    roofMesh.castShadow = true;
    arquibancadaGroup.add(roofMesh);

    // Initial Bleacher Spectators
    const bleacherNpcPresets = [
      { name: 'Carlos', shirtColor: 0xef4444, pantsColor: 0x1e293b, skinColor: 0xfbbf24, hairColor: 0x0f172a, shoeColor: 0xffffff, hairType: 'short', hasHeadphones: false },
      { name: 'Ana', shirtColor: 0x3b82f6, pantsColor: 0x334155, skinColor: 0xfde047, hairColor: 0x78350f, shoeColor: 0xec4899, hairType: 'ponytail', hasHeadphones: true },
      { name: 'Bruno', shirtColor: 0x10b981, pantsColor: 0x1f2937, skinColor: 0xd97706, hairColor: 0x0f172a, shoeColor: 0x000000, hairType: 'cap', hasHeadphones: false },
      { name: 'Fernanda', shirtColor: 0x8b5cf6, pantsColor: 0x1e1b4b, skinColor: 0xfde047, hairColor: 0xb45309, shoeColor: 0xf8fafc, hairType: 'bob', hasHeadphones: false },
      { name: 'Diego', shirtColor: 0xf59e0b, pantsColor: 0x374151, skinColor: 0x854d0e, hairColor: 0x0f172a, shoeColor: 0x3b82f6, hairType: 'curly', hasHeadphones: true },
      { name: 'Patricia', shirtColor: 0xec4899, pantsColor: 0x1e293b, skinColor: 0xfbbf24, hairColor: 0x451a03, shoeColor: 0xffffff, hairType: 'afro', hasHeadphones: false },
      { name: 'Renato', shirtColor: 0x06b6d4, pantsColor: 0x334155, skinColor: 0xd97706, hairColor: 0x0f172a, shoeColor: 0x10b981, hairType: 'beanie', hasHeadphones: false },
      { name: 'Juliana', shirtColor: 0x84cc16, pantsColor: 0x1e1b4b, skinColor: 0xfde047, hairColor: 0x78350f, shoeColor: 0xf472b6, hairType: 'ponytail', hasHeadphones: true },
    ];

    bleacherNpcPresets.forEach((preset, idx) => {
      const bNpcGroup = new THREE.Group();

      const skinMat = new THREE.MeshStandardMaterial({ color: preset.skinColor, roughness: 0.7 });
      const shirtMat = new THREE.MeshStandardMaterial({ color: preset.shirtColor, roughness: 0.6 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: preset.pantsColor, roughness: 0.6 });
      const hairMat = new THREE.MeshStandardMaterial({ color: preset.hairColor, roughness: 0.8 });
      const shoeMat = new THREE.MeshStandardMaterial({ color: preset.shoeColor, roughness: 0.4 });

      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.7), shirtMat);
      torso.position.set(0, 2.1, 0);
      torso.castShadow = true;
      bNpcGroup.add(torso);

      const bHeadGroup = new THREE.Group();
      bHeadGroup.position.set(0, 2.8, 0);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), skinMat);
      head.position.set(0, 0.42, 0);
      head.castShadow = true;
      bHeadGroup.add(head);

      const hair = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.9), hairMat);
      hair.position.set(0, 0.82, 0);
      bHeadGroup.add(hair);

      const faceTex = getCachedR15FaceTexture(10 + idx * 15);
      const faceMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.82), new THREE.MeshBasicMaterial({ map: faceTex, transparent: true }));
      faceMesh.position.set(0, 0.42, 0.435);
      bHeadGroup.add(faceMesh);

      bNpcGroup.add(bHeadGroup);

      const armL = new THREE.Group();
      armL.position.set(-0.72, 2.7, 0);
      const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.2, 0.35), shirtMat);
      armLMesh.position.set(0, -0.6, 0);
      armL.add(armLMesh);
      bNpcGroup.add(armL);

      const armR = new THREE.Group();
      armR.position.set(0.72, 2.7, 0);
      const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.2, 0.35), shirtMat);
      armRMesh.position.set(0, -0.6, 0);
      armR.add(armRMesh);
      bNpcGroup.add(armR);

      const legLGroup = new THREE.Group();
      legLGroup.position.set(-0.32, 1.4, 0);
      const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.7, 0.38), pantsMat);
      legLMesh.position.set(0, -0.35, 0);
      legLGroup.add(legLMesh);

      const calfLGroup = new THREE.Group();
      calfLGroup.position.set(0, -0.7, 0);
      const calfLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.7, 0.36), skinMat);
      calfLMesh.position.set(0, -0.35, 0);
      calfLGroup.add(calfLMesh);

      const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.55), shoeMat);
      shoeL.position.set(0, -0.68, 0.1);
      calfLGroup.add(shoeL);
      legLGroup.add(calfLGroup);
      bNpcGroup.add(legLGroup);

      const legRGroup = new THREE.Group();
      legRGroup.position.set(0.32, 1.4, 0);
      const legRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.7, 0.38), pantsMat);
      legRMesh.position.set(0, -0.35, 0);
      legRGroup.add(legRMesh);

      const calfRGroup = new THREE.Group();
      calfRGroup.position.set(0, -0.7, 0);
      const calfRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.7, 0.36), skinMat);
      calfRMesh.position.set(0, -0.35, 0);
      calfRGroup.add(calfRMesh);

      const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.55), shoeMat);
      shoeR.position.set(0, -0.68, 0.1);
      calfRGroup.add(shoeR);
      legRGroup.add(calfRGroup);
      bNpcGroup.add(legRGroup);

      const tierRow = idx % 4;
      const seatRelX = -20 + (idx * 5.8);
      const seatRelZ = -22.5 - tierRow * 1.25;
      const seatRelY = 0.35 + tierRow * 0.65;

      bNpcGroup.position.set(seatRelX, seatRelY + 0.35, seatRelZ);

      legLGroup.rotation.x = -Math.PI / 2 + 0.1;
      legRGroup.rotation.x = -Math.PI / 2 + 0.1;
      calfLGroup.rotation.x = Math.PI / 2;
      calfRGroup.rotation.x = Math.PI / 2;

      soccerFieldGroup.add(bNpcGroup);

      bleacherNpcsList.push({
        id: idx,
        npcName: preset.name,
        preset,
        npcGroup: bNpcGroup,
        headGroup: bHeadGroup,
        armL,
        armR,
        legLGroup,
        legRGroup,
        calfLGroup,
        calfRGroup,
        state: 'WATCHING',
        tierRow,
        seatRelX,
        seatRelZ,
        seatRelY,
        currentWorldX: 180 + seatRelX,
        currentWorldY: seatRelY,
        currentWorldZ: -42 + seatRelZ,
        targetWorldX: 180 + seatRelX,
        targetWorldZ: -42 + seatRelZ,
        walkSpeed: 3.2 + Math.random() * 0.8,
        walkPhase: Math.random() * Math.PI * 2,
        watchingTimer: 0,
        watchingDuration: 12 + Math.random() * 20,
        streetTimer: 0,
        streetDuration: 15 + Math.random() * 20,
        sitProgress: 1.0,
      });
    });

    // 5. 3D Soccer Ball (Bola de Futebol Proporcional - Reduzida em 20%)
    const ballGeo = new THREE.SphereGeometry(0.416, 20, 20);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const pitchBallMesh = new THREE.Mesh(ballGeo, ballMat);

    const pentMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    for (let p = 0; p < 10; p++) {
      const pent = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8, 0, Math.PI / 4, 0, Math.PI / 4), pentMat);
      pent.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      pitchBallMesh.add(pent);
    }
    pitchBallMesh.position.set(0, 0.416, 0);
    soccerFieldGroup.add(pitchBallMesh);

    const ballState = {
      x: 0,
      y: 0.416,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0
    };

    // 6. 3D Players with Anatomy & Scale Identical to Avatar (Proporções e Articulações em Escala Perfeita)
    interface SoccerPlayerRef {
      group: THREE.Group;
      torsoGroup: THREE.Group;
      headGroup: THREE.Group;
      leftArmGroup: THREE.Group;
      rightArmGroup: THREE.Group;
      leftLegGroup: THREE.Group;
      rightLegGroup: THREE.Group;
      leftLowerLegGroup: THREE.Group;
      rightLowerLegGroup: THREE.Group;
      team: 'RED' | 'BLUE';
      role: 'GK' | 'DEF' | 'ATT';
      baseX: number;
      baseZ: number;
      x: number;
      z: number;
      vx: number;
      vz: number;
      facingAngle: number;
      kickCooldown: number;
    }

    const soccerPlayersList: SoccerPlayerRef[] = [];

    const createSoccerPlayer = (team: 'RED' | 'BLUE', role: 'GK' | 'DEF' | 'ATT', baseX: number, baseZ: number, playerIndex: number = 0) => {
      const pGroup = new THREE.Group();

      const jerseyHex = role === 'GK' 
        ? (team === 'RED' ? 0xeab308 : 0x84cc16) 
        : (team === 'RED' ? 0xdc2626 : 0x2563eb);

      // Natural skin tones and hair color variety for team members
      const skinTones = [0xfbcfe8, 0xfde68a, 0xd4a373, 0xa16207, 0x854d0e];
      const hairTones = [0x1e293b, 0x3b1d11, 0x5c3818, 0x171717, 0x292524];
      const skinColor = skinTones[playerIndex % skinTones.length];
      const hairColor = hairTones[playerIndex % hairTones.length];

      const jerseyMat = new THREE.MeshStandardMaterial({ color: jerseyHex, roughness: 0.5 });
      const shortsMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
      const socksMat = new THREE.MeshStandardMaterial({ color: jerseyHex, roughness: 0.5 });
      const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });
      const cleatMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
      const cleatAccentMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });

      // Torso Group (Proporções exatas do avatar principal)
      const pTorsoGroup = new THREE.Group();
      
      // Jersey Torso
      const mainTorso = new THREE.Mesh(new THREE.BoxGeometry(1.46, 1.55, 0.85), jerseyMat);
      mainTorso.position.set(0, 2.85, 0);
      mainTorso.castShadow = true;
      pTorsoGroup.add(mainTorso);

      // Shorts
      const shorts = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.55, 0.88), shortsMat);
      shorts.position.set(0, 2.10, 0);
      pTorsoGroup.add(shorts);
      pGroup.add(pTorsoGroup);

      // Head Group (Proporcional ao Avatar com Rosto)
      const pHeadGroup = new THREE.Group();
      pHeadGroup.position.set(0, 3.65, 0);
      const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.94, 0.94), skinMat);
      headMesh.position.set(0, 0.47, 0);
      headMesh.castShadow = true;
      pHeadGroup.add(headMesh);

      // Face Plane
      const pFaceTex = getCachedR15FaceTexture(50 + (playerIndex % 3) * 20);
      const facePlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.92, 0.92),
        new THREE.MeshBasicMaterial({ map: pFaceTex, transparent: true })
      );
      facePlane.position.set(0, 0.47, 0.48);
      pHeadGroup.add(facePlane);

      // Hair Dome
      const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.35 });
      const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.54, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat);
      hairTop.position.set(0, 0.78, 0);
      pHeadGroup.add(hairTop);
      pGroup.add(pHeadGroup);

      // Arms (Braços Articulados com Mangas de Camisa)
      const upperArmGeo = new THREE.BoxGeometry(0.42, 0.82, 0.42);
      const lowerArmGeo = new THREE.BoxGeometry(0.38, 0.75, 0.38);
      const handGeo = new THREE.BoxGeometry(0.30, 0.22, 0.30);

      // Left Arm
      const leftArmGroup = new THREE.Group();
      leftArmGroup.position.set(-0.94, 3.30, 0);
      const leftUpperArm = new THREE.Mesh(upperArmGeo, jerseyMat);
      leftUpperArm.position.y = -0.41;
      leftArmGroup.add(leftUpperArm);
      const leftLowerArm = new THREE.Mesh(lowerArmGeo, skinMat);
      leftLowerArm.position.y = -1.10;
      leftArmGroup.add(leftLowerArm);
      const leftHand = new THREE.Mesh(handGeo, skinMat);
      leftHand.position.y = -1.50;
      leftArmGroup.add(leftHand);
      pGroup.add(leftArmGroup);

      // Right Arm
      const rightArmGroup = new THREE.Group();
      rightArmGroup.position.set(0.94, 3.30, 0);
      const rightUpperArm = new THREE.Mesh(upperArmGeo, jerseyMat);
      rightUpperArm.position.y = -0.41;
      rightArmGroup.add(rightUpperArm);
      const rightLowerArm = new THREE.Mesh(lowerArmGeo, skinMat);
      rightLowerArm.position.y = -1.10;
      rightArmGroup.add(rightLowerArm);
      const rightHand = new THREE.Mesh(handGeo, skinMat);
      rightHand.position.y = -1.50;
      rightArmGroup.add(rightHand);
      pGroup.add(rightArmGroup);

      // Legs (Pernas Articuladas com Chuteiras)
      const thighGeo = new THREE.BoxGeometry(0.54, 0.90, 0.54);
      const calfGeo = new THREE.BoxGeometry(0.50, 0.80, 0.50);
      const cleatGeo = new THREE.BoxGeometry(0.54, 0.25, 0.90);
      const soleGeo = new THREE.BoxGeometry(0.56, 0.08, 0.92);

      // Left Leg
      const leftLegGroup = new THREE.Group();
      leftLegGroup.position.set(-0.46, 1.90, 0);
      const leftThigh = new THREE.Mesh(thighGeo, skinMat);
      leftThigh.position.y = -0.45;
      leftLegGroup.add(leftThigh);

      const leftLowerLegGroup = new THREE.Group();
      leftLowerLegGroup.position.y = -0.90;
      const leftCalf = new THREE.Mesh(calfGeo, socksMat);
      leftCalf.position.y = -0.40;
      leftLowerLegGroup.add(leftCalf);

      const leftCleat = new THREE.Mesh(cleatGeo, cleatMat);
      leftCleat.position.set(0, -0.70, 0.12);
      leftLowerLegGroup.add(leftCleat);
      const leftSole = new THREE.Mesh(soleGeo, cleatAccentMat);
      leftSole.position.set(0, -0.80, 0.12);
      leftLowerLegGroup.add(leftSole);

      leftLegGroup.add(leftLowerLegGroup);
      pGroup.add(leftLegGroup);

      // Right Leg
      const rightLegGroup = new THREE.Group();
      rightLegGroup.position.set(0.46, 1.90, 0);
      const rightThigh = new THREE.Mesh(thighGeo, skinMat);
      rightThigh.position.y = -0.45;
      rightLegGroup.add(rightThigh);

      const rightLowerLegGroup = new THREE.Group();
      rightLowerLegGroup.position.y = -0.90;
      const rightCalf = new THREE.Mesh(calfGeo, socksMat);
      rightCalf.position.y = -0.40;
      rightLowerLegGroup.add(rightCalf);

      const rightCleat = new THREE.Mesh(cleatGeo, cleatMat);
      rightCleat.position.set(0, -0.70, 0.12);
      rightLowerLegGroup.add(rightCleat);
      const rightSole = new THREE.Mesh(soleGeo, cleatAccentMat);
      rightSole.position.set(0, -0.80, 0.12);
      rightLowerLegGroup.add(rightSole);

      rightLegGroup.add(rightLowerLegGroup);
      pGroup.add(rightLegGroup);

      pGroup.position.set(baseX, 0, baseZ);
      soccerFieldGroup.add(pGroup);

      soccerPlayersList.push({
        group: pGroup,
        torsoGroup: pTorsoGroup,
        headGroup: pHeadGroup,
        leftArmGroup,
        rightArmGroup,
        leftLegGroup,
        rightLegGroup,
        leftLowerLegGroup,
        rightLowerLegGroup,
        team,
        role,
        baseX,
        baseZ,
        x: baseX,
        z: baseZ,
        vx: 0,
        vz: 0,
        facingAngle: 0,
        kickCooldown: 0,
      });
    };

    // Spawn Team Red (Posições proporcionais ao campo 64x40)
    createSoccerPlayer('RED', 'GK', -28.0, 0, 0);
    createSoccerPlayer('RED', 'DEF', -16.0, -7.0, 1);
    createSoccerPlayer('RED', 'DEF', -16.0, 7.0, 2);
    createSoccerPlayer('RED', 'ATT', -5.0, -5.0, 3);
    createSoccerPlayer('RED', 'ATT', -5.0, 5.0, 4);

    // Spawn Team Blue
    createSoccerPlayer('BLUE', 'GK', 28.0, 0, 5);
    createSoccerPlayer('BLUE', 'DEF', 16.0, -7.0, 6);
    createSoccerPlayer('BLUE', 'DEF', 16.0, 7.0, 7);
    createSoccerPlayer('BLUE', 'ATT', 5.0, -5.0, 8);
    createSoccerPlayer('BLUE', 'ATT', 5.0, 5.0, 9);



    // Decrease the size of the soccer field by 10%
    soccerFieldGroup.scale.set(0.9, 0.9, 0.9);


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

    // Realistic Soccer Ball Prop for Juggling (Embaixadinhas - Tamanho Proporcional)
    const soccerJuggleGroup = new THREE.Group();
    const soccerBallMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 36, 36),
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

    const sPatchGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.012, 5);
    const sPatchMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.2, metalness: 0.1 });
    ICO_VERTICES.forEach(([vx, vy, vz]) => {
      const dir = new THREE.Vector3(vx, vy, vz).normalize();
      const p = new THREE.Mesh(sPatchGeo, sPatchMat);
      p.position.copy(dir.clone().multiplyScalar(0.682));
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

    coffeeCupProp.position.set(0, 3.5, 0.72);
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
    burgerProp.position.set(0, 3.45, 0.7);
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
    bookProp.position.set(0, 2.85, 0.85);
    bookProp.rotation.x = -0.45;
    bookProp.visible = false;
    playerGroup.add(bookProp);

    // --- 3D PET DOG PROP: LUKE O PINSCHER (LÉO) OU PIPOCA O BEAGLE (CAIO) ---
    const dogProp = new THREE.Group();
    const isBeagleSelection = (characterSelection === 'caio');

    const dpFurMat = new THREE.MeshStandardMaterial({
      color: isBeagleSelection ? 0xd97706 : 0xc05621, // Beagle warm amber vs Pinscher caramel
      roughness: 0.5,
    });
    const dpTummyMat = new THREE.MeshStandardMaterial({
      color: isBeagleSelection ? 0xf8fafc : 0xf6ad55, // White tummy/snout for Beagle
      roughness: 0.6,
    });
    const dpSaddleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Black saddle back for Beagle
      roughness: 0.5,
    });
    const dpEarMat = new THREE.MeshStandardMaterial({
      color: isBeagleSelection ? 0x92400e : 0xf6ad55,
      roughness: 0.6,
    });
    const dpEyeMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.1 });
    const dpCollarMat = new THREE.MeshStandardMaterial({
      color: isBeagleSelection ? 0x0284c7 : 0xef4444, // Electric blue for Beagle, Red for Pinscher
      metalness: 0.6,
      roughness: 0.2,
    });
    const dpTagMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 });

    // Body
    const dpBody = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.48, 0.9), dpFurMat);
    dpBody.position.set(0, 0.35, 0);
    dogProp.add(dpBody);

    if (isBeagleSelection) {
      const dpSaddle = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.24, 0.58), dpSaddleMat);
      dpSaddle.position.set(0, 0.48, -0.05);
      dogProp.add(dpSaddle);
    }

    const dpBelly = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.18, 0.8), dpTummyMat);
    dpBelly.position.set(0, 0.22, 0);
    dogProp.add(dpBelly);

    // Neck
    const dpNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.38, 8), dpFurMat);
    dpNeck.position.set(0, 0.62, 0.32);
    dpNeck.rotation.x = 0.25;
    dogProp.add(dpNeck);

    const dpHeadGroup = new THREE.Group();
    dpHeadGroup.position.set(0, 0.92, 0.42);

    // Head
    const dpHeadMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.48), dpFurMat);
    dpHeadGroup.add(dpHeadMesh);

    // Snout
    const dpSnout = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.28), dpTummyMat);
    dpSnout.position.set(0, -0.06, 0.26);
    dpHeadGroup.add(dpSnout);

    // Nose
    const dpNose = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.08), dpEyeMat);
    dpNose.position.set(0, -0.01, 0.38);
    dpHeadGroup.add(dpNose);

    // Ears
    let dpEarL: THREE.Mesh;
    let dpEarR: THREE.Mesh;

    if (isBeagleSelection) {
      const earGeo = new THREE.BoxGeometry(0.14, 0.42, 0.24);
      dpEarL = new THREE.Mesh(earGeo, dpEarMat);
      dpEarL.position.set(-0.28, 0.08, 0.08);
      dpEarL.rotation.z = 0.25;
      dpHeadGroup.add(dpEarL);

      dpEarR = new THREE.Mesh(earGeo, dpEarMat);
      dpEarR.position.set(0.28, 0.08, 0.08);
      dpEarR.rotation.z = -0.25;
      dpHeadGroup.add(dpEarR);
    } else {
      const dpEarGeo = new THREE.ConeGeometry(0.12, 0.42, 4);
      dpEarL = new THREE.Mesh(dpEarGeo, dpTummyMat);
      dpEarL.position.set(-0.24, 0.3, 0);
      dpEarL.rotation.set(-0.1, 0, -0.2);
      dpHeadGroup.add(dpEarL);

      dpEarR = new THREE.Mesh(dpEarGeo, dpTummyMat);
      dpEarR.position.set(0.24, 0.3, 0);
      dpEarR.rotation.set(-0.1, 0, 0.2);
      dpHeadGroup.add(dpEarR);
    }

    // Eyes
    const dpEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), dpEyeMat);
    dpEyeL.position.set(-0.14, 0.08, 0.22);
    dpHeadGroup.add(dpEyeL);

    const dpEyeR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), dpEyeMat);
    dpEyeR.position.set(0.14, 0.08, 0.22);
    dpHeadGroup.add(dpEyeR);

    dogProp.add(dpHeadGroup);

    // Collar
    const dpCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 0.06, 8), dpCollarMat);
    dpCollar.position.set(0, 0.68, 0.35);
    dpCollar.rotation.x = 0.25;
    dogProp.add(dpCollar);

    const dpTag = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12), dpTagMat);
    dpTag.position.set(0, 0.62, 0.46);
    dpTag.rotation.x = Math.PI / 2;
    dogProp.add(dpTag);

    // Tail
    const dpTail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.02, 0.45, 8), isBeagleSelection ? dpTummyMat : dpFurMat);
    dpTail.position.set(0, 0.6, -0.48);
    dpTail.rotation.x = -0.9;
    dogProp.add(dpTail);

    // Legs
    const legMat = isBeagleSelection ? dpTummyMat : dpFurMat;
    const dpLegGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.42, 8);
    const dpFL = new THREE.Mesh(dpLegGeo, legMat);
    dpFL.position.set(-0.2, 0.05, 0.26);
    dogProp.add(dpFL);

    const dpFR = new THREE.Mesh(dpLegGeo, legMat);
    dpFR.position.set(0.2, 0.05, 0.26);
    dogProp.add(dpFR);

    const dpBL = new THREE.Mesh(dpLegGeo, legMat);
    dpBL.position.set(-0.2, 0.05, -0.26);
    dogProp.add(dpBL);

    const dpBR = new THREE.Mesh(dpLegGeo, legMat);
    dpBR.position.set(0.2, 0.05, -0.26);
    dogProp.add(dpBR);

    dogProp.scale.set(1.1, 1.1, 1.1);
    dogProp.position.set(0, 0, 0);
    dogProp.rotation.y = -0.3;
    dogProp.visible = (characterSelection === 'leo' || characterSelection === 'caio');
    scene.add(dogProp);

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
    const auraGeo = new THREE.SphereGeometry(2.6, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0,
      wireframe: true,
    });
    const damageAura = new THREE.Mesh(auraGeo, auraMat);
    damageAura.position.y = 2.5;
    playerGroup.add(damageAura);

    // Glowing Green Zen Protection Shield Sphere
    const zenPillarGeo = new THREE.SphereGeometry(2.8, 24, 24);
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
    zenPillar.position.y = 2.2;
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
    umbrellaGroup.position.set(0, 2.65, 0);
    umbrellaGroup.visible = false; // Hidden by default!
    playerGroup.add(umbrellaGroup);

    // --- 3D TRANSLUCENT OUTDOOR PROTECTION SHIELD SPHERE (Escudo Ar Livre - Transparência 5%) ---
    const outdoorShieldSphereGeo = new THREE.SphereGeometry(3.4, 32, 32);
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
    outdoorShieldMesh.position.set(0, 2.5, 0);
    outdoorShieldMesh.visible = false;
    playerGroup.add(outdoorShieldMesh);

    // Dynamic Wireframe Shell to accentuate 3D protective sphere
    const outdoorShieldRingGeo = new THREE.SphereGeometry(3.44, 20, 20);
    const outdoorShieldRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      wireframe: true,
      depthWrite: false,
    });
    const outdoorShieldRingMesh = new THREE.Mesh(outdoorShieldRingGeo, outdoorShieldRingMat);
    outdoorShieldRingMesh.position.set(0, 2.5, 0);
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
    friendHead.position.y = 3.65;
    friendHugGroup.add(friendHead);

    // Friend Facial Features (Eyes & Smile)
    const friendEyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const friendEyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), friendEyeMat);
    friendEyeLeft.position.set(-0.24, 3.77, 0.68);
    const friendEyeRight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), friendEyeMat);
    friendEyeRight.position.set(0.24, 3.77, 0.68);
    friendHugGroup.add(friendEyeLeft);
    friendHugGroup.add(friendEyeRight);

    const friendSmileGeo = new THREE.TorusGeometry(0.2, 0.04, 8, 12, Math.PI);
    const friendSmileMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 });
    const friendSmile = new THREE.Mesh(friendSmileGeo, friendSmileMat);
    friendSmile.position.set(0, 3.53, 0.68);
    friendSmile.rotation.z = Math.PI;
    friendHugGroup.add(friendSmile);

    // Friend Hair
    const friendHairGeo = new THREE.SphereGeometry(0.78, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const friendHairMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 });
    const friendHair = new THREE.Mesh(friendHairGeo, friendHairMat);
    friendHair.position.set(0, 3.7, 0);
    friendHugGroup.add(friendHair);

    // Friend Torso
    const friendTorsoGeo = new THREE.BoxGeometry(1.2, 1.5, 0.7);
    const friendShirtMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.6 });
    const friendTorso = new THREE.Mesh(friendTorsoGeo, friendShirtMat);
    friendTorso.position.y = 2.45;
    friendHugGroup.add(friendTorso);

    // Friend Arms for Hugging
    const friendArmMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.6 });
    const friendArmGeo = new THREE.BoxGeometry(0.35, 1.2, 0.35);

    const friendLeftArmGroup = new THREE.Group();
    friendLeftArmGroup.position.set(-0.75, 2.95, 0);
    const friendLeftArm = new THREE.Mesh(friendArmGeo, friendArmMat);
    friendLeftArm.position.y = -0.6;
    friendLeftArmGroup.add(friendLeftArm);
    friendHugGroup.add(friendLeftArmGroup);

    const friendRightArmGroup = new THREE.Group();
    friendRightArmGroup.position.set(0.75, 2.95, 0);
    const friendRightArm = new THREE.Mesh(friendArmGeo, friendArmMat);
    friendRightArm.position.y = -0.6;
    friendRightArmGroup.add(friendRightArm);
    friendHugGroup.add(friendRightArmGroup);

    // Friend Legs
    const friendLegMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const friendLegGeo = new THREE.BoxGeometry(0.48, 1.7, 0.48);
    const friendLeftLeg = new THREE.Mesh(friendLegGeo, friendLegMat);
    friendLeftLeg.position.set(-0.32, 0.85, 0);
    const friendRightLeg = new THREE.Mesh(friendLegGeo, friendLegMat);
    friendRightLeg.position.set(0.32, 0.85, 0);
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



    playerGroup.position.set(initialCamX, 0.58, 0);
    scene.add(playerGroup);

    // --- High-Performance Cached 3D Mesh Template Factory ---
    const meshTemplateCache = new Map<string, THREE.Object3D>();

    // Shared Ground Beacon geometries and materials
    const sharedBeaconRingGeo = new THREE.RingGeometry(1.2, 1.6, 24);
    const sharedBeaconCyanMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const sharedBeaconAmberMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const sharedBeaconGreenMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });

    const create3DItemMesh = (type: FallingItem['type'] | string): THREE.Object3D => {
      const effectiveType = type;

      const cachedTemplate = meshTemplateCache.get(effectiveType);
      if (cachedTemplate) {
        return cachedTemplate.clone(true);
      }

      const group = new THREE.Group();

      if (effectiveType === 'GenericObstacle') {
        // --- UNIFIED GENERIC HAZARD BARRIER ---
        const baseGeo = new THREE.BoxGeometry(2.4, 0.4, 1.2);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.2;
        group.add(base);

        const bodyGeo = new THREE.BoxGeometry(2.2, 1.6, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.1 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.0;
        group.add(body);

        const stripeGeo = new THREE.BoxGeometry(2.24, 0.35, 0.84);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.2 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = 1.0;
        group.add(stripe);

        const lightGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const alarmLight = new THREE.Mesh(lightGeo, lightMat);
        alarmLight.position.y = 1.95;
        group.add(alarmLight);

        const signTex = getCachedNeonTextTexture('ALERTA', '#facc15', '#ef4444');
        const signMat = new THREE.MeshBasicMaterial({ map: signTex });
        const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.9), signMat);
        signMesh.position.set(0, 1.0, 0.43);
        group.add(signMesh);

        group.castShadow = true;
        meshTemplateCache.set('GenericObstacle', group);
        return group.clone(true);
      } else if (effectiveType === 'Feed') {
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

      } else if (type === 'Bola de Futebol') {
        // --- 10. CLASSIC BLACK & WHITE SOCCER BALL (TELSTAR STYLE - REDUZIDA 20%) ---
        const ballGeo = new THREE.SphereGeometry(0.672, 48, 48);
        const ballMat = new THREE.MeshStandardMaterial({
          map: soccerBallTexture,
          bumpMap: soccerBallTexture,
          bumpScale: 0.016,
          roughness: 0.15,
          metalness: 0.05,
        });
        const ball = new THREE.Mesh(ballGeo, ballMat);
        ball.castShadow = true;
        group.add(ball);

        // 12 Flush Black Pentagonal Leather Panels mapped to Icosahedron Vertices
        const patchGeo = new THREE.CylinderGeometry(0.2048, 0.2048, 0.0096, 5);
        const patchMat = new THREE.MeshStandardMaterial({
          color: 0x111827,
          roughness: 0.2,
          metalness: 0.1,
        });

        ICO_VERTICES.forEach(([vx, vy, vz]) => {
          const dir = new THREE.Vector3(vx, vy, vz).normalize();
          const patch = new THREE.Mesh(patchGeo, patchMat);
          patch.position.copy(dir.clone().multiplyScalar(0.6733));
          patch.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          group.add(patch);
        });

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

      } else if (type === 'Violão') {
        // Collectible Classical Acoustic Guitar Item
        const guitarMesh = createAcousticGuitarMesh();
        guitarMesh.scale.set(0.9, 0.9, 0.9);
        guitarMesh.rotation.z = -0.35;
        group.add(guitarMesh);

      } else if (type === 'Cachorro') {
        // --- HIGH-FIDELITY CUTE PUPPY DOG 3D MODEL ---
        const furMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7, metalness: 0.1 });
        const darkFurMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
        const snoutMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.8 }); // Lighter snout
        const blackMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });

        // Puppy Body (Main Torso)
        const dogBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.5, 0.45), furMat);
        dogBody.position.y = 0.15;
        group.add(dogBody);

        // Puppy Head
        const dogHead = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), furMat);
        dogHead.position.set(0.48, 0.45, 0);
        group.add(dogHead);

        // Snout (Focinho)
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.22), snoutMat);
        snout.position.set(0.78, 0.38, 0);
        group.add(snout);

        // Little Black Nose
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), blackMat);
        nose.position.set(0.88, 0.42, 0);
        group.add(nose);

        // Expressive Eyes
        const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const leftEye = new THREE.Mesh(eyeGeo, blackMat);
        leftEye.position.set(0.7, 0.52, 0.14);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, blackMat);
        rightEye.position.set(0.7, 0.52, -0.14);
        group.add(rightEye);

        // Floppy Ears (Larger and more expressive)
        const earGeo = new THREE.BoxGeometry(0.18, 0.38, 0.1);
        const leftEar = new THREE.Mesh(earGeo, darkFurMat);
        leftEar.position.set(0.55, 0.55, 0.28);
        leftEar.rotation.z = -0.3;
        leftEar.rotation.x = 0.2;
        group.add(leftEar);

        const rightEar = new THREE.Mesh(earGeo, darkFurMat);
        rightEar.position.set(0.55, 0.55, -0.28);
        rightEar.rotation.z = -0.3;
        rightEar.rotation.x = -0.2;
        group.add(rightEar);

        // Four Legs (Patas)
        const legGeo = new THREE.BoxGeometry(0.16, 0.35, 0.16);
        const legPositions = [
          [0.25, -0.1, 0.15],
          [0.25, -0.1, -0.15],
          [-0.25, -0.1, 0.15],
          [-0.25, -0.1, -0.15]
        ];
        legPositions.forEach(pos => {
          const leg = new THREE.Mesh(legGeo, furMat);
          leg.position.set(pos[0], pos[1], pos[2]);
          group.add(leg);
        });

        // Tail (Wagging position)
        const tailGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.35, 8);
        const tail = new THREE.Mesh(tailGeo, furMat);
        tail.position.set(-0.48, 0.4, 0);
        tail.rotation.z = 0.8;
        group.add(tail);

      } else if (type === 'WhatsApp') {
        // --- WHATSAPP 3D NOXIOUS ITEM (Procedural Texture, 3D Speech Bubble Tail & Aura, +3% Ansiedade) ---
        const waTex = getCachedWhatsAppTexture();

        // 3D Double-Faced Disc Badge with WhatsApp Face Texture
        const waDiscGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.22, 32);
        const waSideMat = new THREE.MeshStandardMaterial({ color: 0x128c7e, roughness: 0.35, metalness: 0.3 });
        const waFaceMat = new THREE.MeshStandardMaterial({ 
          map: waTex, 
          roughness: 0.2, 
          metalness: 0.1,
          emissive: new THREE.Color(0x25d366),
          emissiveMap: waTex,
          emissiveIntensity: 0.4,
        });

        const waMaterials = [waSideMat, waFaceMat, waFaceMat];
        const waDisc = new THREE.Mesh(waDiscGeo, waMaterials);
        waDisc.rotation.x = Math.PI / 2;
        group.add(waDisc);

        // 3D Speech Bubble Pointer Tail at bottom-left
        const tailGeo = new THREE.ConeGeometry(0.38, 0.65, 4);
        const tailMat = new THREE.MeshStandardMaterial({ color: 0x128c7e, roughness: 0.35, metalness: 0.3 });
        const tailMesh = new THREE.Mesh(tailGeo, tailMat);
        tailMesh.position.set(-0.72, -0.75, 0);
        tailMesh.rotation.z = Math.PI * 0.75;
        tailMesh.scale.set(1.0, 1.0, 0.4);
        group.add(tailMesh);

        // Glowing Ambient Outer Ring for high visibility
        const glowRingGeo = new THREE.RingGeometry(0.98, 1.15, 32);
        const glowRingMat = new THREE.MeshBasicMaterial({ 
          color: 0x25d366, 
          side: THREE.DoubleSide, 
          transparent: true, 
          opacity: 0.7 
        });
        const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat);
        glowRing.position.z = 0;
        group.add(glowRing);

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

      } else if (type === 'TikTok') {
        // --- TIKTOK ICON (Black badge with 3D chromatic aberration music note) ---
        const ttBaseGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.18, 24);
        const ttMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2, metalness: 0.3 });
        const ttBase = new THREE.Mesh(ttBaseGeo, ttMat);
        ttBase.rotation.x = Math.PI / 2;
        group.add(ttBase);

        // Chromatic aberration music note layers: cyan (left offset), magenta (right offset), white (front/center)
        const colors = [
          { hex: 0x00ffff, x: -0.05, y: 0, z: 0.08 }, // Cyan
          { hex: 0xff0050, x: 0.05, y: 0, z: 0.08 },  // Magenta / Red-pink
          { hex: 0xffffff, x: 0, y: 0, z: 0.1 }      // White (Main)
        ];

        colors.forEach((c) => {
          const noteGroup = new THREE.Group();
          noteGroup.position.set(c.x, c.y, c.z);

          const noteMat = new THREE.MeshBasicMaterial({ color: c.hex });

          // Vertical Stem
          const stem = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 0.02), noteMat);
          stem.position.set(0.04, 0.12, 0);
          noteGroup.add(stem);

          // Note Head (Bottom Circle)
          const head = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16), noteMat);
          head.rotation.x = Math.PI / 2;
          head.position.set(-0.1, -0.15, 0);
          noteGroup.add(head);

          // Top flag (curve or bar)
          const flag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.02), noteMat);
          flag.position.set(0.18, 0.4, 0);
          noteGroup.add(flag);

          group.add(noteGroup);
        });

      } else if (type === 'MoedaOuro') {
        // --- 18. HIGH-FIDELITY SHINY 3D GOLDEN COIN ---
        // Beveled Outer Coin Disc
        const coinGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.18, 32);
        const coinMat = new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          metalness: 0.95,
          roughness: 0.15,
          emissive: 0x3b2502,
        });
        const coin = new THREE.Mesh(coinGeo, coinMat);
        coin.rotation.x = Math.PI / 2;
        group.add(coin);

        // Metallic Inner Rim
        const rimGeo = new THREE.TorusGeometry(0.72, 0.05, 12, 32);
        const rimMat = new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          metalness: 0.98,
          roughness: 0.1,
        });
        const rimFront = new THREE.Mesh(rimGeo, rimMat);
        rimFront.position.z = 0.09;
        group.add(rimFront);

        const rimBack = new THREE.Mesh(rimGeo, rimMat);
        rimBack.position.z = -0.09;
        group.add(rimBack);

        // Center Embossed Star Emblem
        const starShape = new THREE.Shape();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? 0.38 : 0.18;
          const a = (i * Math.PI) / 5 - Math.PI / 2;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) starShape.moveTo(x, y);
          else starShape.lineTo(x, y);
        }
        starShape.closePath();

        const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.04, bevelEnabled: false });
        const starMat = new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          metalness: 0.9,
          roughness: 0.2,
        });

        const starFront = new THREE.Mesh(starGeo, starMat);
        starFront.position.z = 0.09;
        group.add(starFront);

        const starBack = new THREE.Mesh(starGeo, starMat);
        starBack.position.z = -0.13;
        group.add(starBack);

      } else if (type === 'Buraco') {
        // --- BURACO: GLITCH CHASM (ERROR 404) ---
        const voidGeo = new THREE.BoxGeometry(3.6, 0.2, 2.2);
        const voidMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
        const voidMesh = new THREE.Mesh(voidGeo, voidMat);
        voidMesh.position.y = 0.06;
        group.add(voidMesh);

        const innerGlowGeo = new THREE.PlaneGeometry(3.2, 1.8);
        const innerGlowMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
        const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
        innerGlow.rotation.x = -Math.PI / 2;
        innerGlow.position.y = 0.08;
        group.add(innerGlow);

        const rimGeo = new THREE.BoxGeometry(4.1, 0.16, 2.6);
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.2, emissive: 0x78350f, emissiveIntensity: 0.6 });
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.position.y = 0.04;
        group.add(rim);

        // Digital Holographic "ERROR 404"
        const signTex = getCachedNeonTextTexture('ERRO 404', '#ef4444', 'transparent');
        const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
        const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), signMat);
        signMesh.position.set(0, 1.5, 0);
        group.add(signMesh);
      } else if (type === 'PequenaPared') {
        // --- PEQUENAPARED: FIREWALL BLOCKER ---
        const wallGeo = new THREE.BoxGeometry(6.4, 3.2, 1.2);
        const wallMat = new THREE.MeshStandardMaterial({ map: brickWallTexture, roughness: 0.8, metalness: 0.0 });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.y = 1.6;
        group.add(wall);

        // Holographic Digital Firewall Forcefield
        const shieldGeo = new THREE.BoxGeometry(6.8, 3.6, 1.5);
        const shieldMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.2, wireframe: true });
        const shield = new THREE.Mesh(shieldGeo, shieldMat);
        shield.position.y = 1.6;
        group.add(shield);

        const signTex = getCachedNeonTextTexture('FIREWALL', '#60a5fa', '#0f172a');
        const signMat = new THREE.MeshBasicMaterial({ map: signTex });
        const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.75), signMat);
        signMesh.position.set(0, 1.6, 0.61);
        group.add(signMesh);
        
        const signMeshBack = signMesh.clone();
        signMeshBack.position.set(0, 1.6, -0.61);
        signMeshBack.rotation.y = Math.PI;
        group.add(signMeshBack);
      } else if (type === 'Cone') {
        // --- CONE: CONNECTION LOST BEACON ---
        const coneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
        const coneMesh = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.1, 16), coneMat);
        coneMesh.position.y = 0.65;
        group.add(coneMesh);

        // Glowing Orange Band
        const bandMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.35, 16), bandMat);
        band.position.y = 0.75;
        group.add(band);

        const baseCone = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 1.5), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
        baseCone.position.y = -0.36;
        group.add(baseCone);

        // Holographic Alert
        const signTex = getCachedNeonTextTexture('!', '#f97316', 'transparent');
        const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
        const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), signMat);
        signMesh.position.y = 2.4;
        group.add(signMesh);
      } else if (type === 'Cavalete') {
        // --- CAVALETE: ACCESS DENIED BARRICADE ---
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
        const bar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, 0.22), woodMat);
        bar.position.y = 1.45;
        group.add(bar);

        const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.8, 0.18), woodMat);
        leg1.position.set(-1.0, 0.5, 0);
        group.add(leg1);

        const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.8, 0.18), woodMat);
        leg2.position.set(1.0, 0.5, 0);
        group.add(leg2);

        // Holographic Access Denied Sign
        const signTex = getCachedNeonTextTexture('ACESSO NEGADO', '#facc15', '#0f172a');
        const signMat = new THREE.MeshBasicMaterial({ map: signTex });
        const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), signMat);
        signMesh.position.set(0, 0.9, 0.15);
        group.add(signMesh);

        const signMeshBack = signMesh.clone();
        signMeshBack.position.set(0, 0.9, -0.15);
        signMeshBack.rotation.y = Math.PI;
        group.add(signMeshBack);
      } else if (type === 'Cilindro') {
        // --- CILINDRO: MALWARE / SPAM DATA BARREL ---
        const barrelGeo = new THREE.CylinderGeometry(0.75, 0.75, 2.0, 20);
        const barrelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.1 });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.y = 1.0;
        group.add(barrel);

        // Glowing Toxic Green Bands
        const bandGeo = new THREE.CylinderGeometry(0.77, 0.77, 0.35, 20);
        const bandMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
        const band1 = new THREE.Mesh(bandGeo, bandMat);
        band1.position.y = 1.35;
        group.add(band1);

        const band2 = new THREE.Mesh(bandGeo, bandMat);
        band2.position.y = 0.65;
        group.add(band2);

        const baseGeo = new THREE.CylinderGeometry(0.85, 0.88, 0.2, 20);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = 0.1;
        group.add(baseMesh);

        // Holographic Malware Sign
        const signTex = createNeonTextTexture('MALWARE', '#4ade80', 'transparent');
        const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
        const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), signMat);
        signMesh.position.set(0, 2.5, 0);
        group.add(signMesh);
      } else if (type === 'Remedio') {
        // --- HIGH-FIDELITY 3D MEDICINE BOX ---
        const boxGeo = new THREE.BoxGeometry(1.4, 0.9, 0.9);
        const boxMat = new THREE.MeshStandardMaterial({
          color: 0xffffff, // Sterile white
          roughness: 0.15,
          metalness: 0.1,
        });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.y = 0.5;
        group.add(box);

        // Green Cross - Vertical Bar
        const vertGeo = new THREE.BoxGeometry(0.3, 0.7, 0.94);
        const crossMat = new THREE.MeshStandardMaterial({
          color: 0x10b981, // Emerald Green
          roughness: 0.2,
        });
        const vertBar = new THREE.Mesh(vertGeo, crossMat);
        vertBar.position.y = 0.5;
        group.add(vertBar);

        // Green Cross - Horizontal Bar
        const horizGeo = new THREE.BoxGeometry(0.7, 0.3, 0.94);
        const horizBar = new THREE.Mesh(horizGeo, crossMat);
        horizBar.position.y = 0.5;
        group.add(horizBar);

        // Add a pulsing shiny capsule floating above the box
        const capsuleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 12);
        const capsuleRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.1 });
        const capsuleWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
        
        const capGroup = new THREE.Group();
        capGroup.position.set(0, 1.3, 0);
        capGroup.rotation.z = Math.PI / 4;

        const capRed = new THREE.Mesh(capsuleGeo, capsuleRedMat);
        capRed.position.y = 0.2;
        capGroup.add(capRed);

        const capWhite = new THREE.Mesh(capsuleGeo, capsuleWhiteMat);
        capWhite.position.y = -0.2;
        capGroup.add(capWhite);

        group.add(capGroup);
      }

      // Attach Glowing Ground Ring Beacon to ground items
      const wellnessGroundTypes = [
        'Bola de Futebol', 'Encontro Presencial', 'Exercício Físico',
        'Atividade ao Ar Livre', 'Desconexão', 'Coffee', 'Book',
        'Hamburguer', 'Violão', 'Cachorro', 'MoedaOuro', 'Remedio'
      ];
      if (wellnessGroundTypes.includes(type)) {
        const ringMat = (type === 'Desconexão' || type === 'Violão')
          ? sharedBeaconCyanMat
          : ((type === 'Hamburguer' || type === 'MoedaOuro') ? sharedBeaconAmberMat : sharedBeaconGreenMat);
        const ring = new THREE.Mesh(sharedBeaconRingGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -1.15;
        ring.name = 'beaconRing';
        group.add(ring);
      }

      group.castShadow = true;
      meshTemplateCache.set(type, group);
      return group.clone(true);
    };

    // --- Animation & State Loop ---
    let animationFrameId: number;
    let spawnTimerFalling = 0;
    let spawnTimerGround = 0;
    let spawnTimerObstacle = 0;
    let spawnTimerCard = 0;
    let guitarAnimTimer = 0;
    let exerciseAnimTimer = 0;
    let soccerAnimTimer = 0;
    let soccerAudioKickIndex = -1;
    let soccerCameraZoom = 0; // Zoom factor for the soccer field camera
    let houseCameraZoom = 0; // Zoom factor for the house interior camera
    let coffeeDrinkAnimTimer = 0;
    let burgerEatAnimTimer = 0;
    let bookReadAnimTimer = 0;
    let hugAnimTimer = 0;
    let dogPetAnimTimer = 0;
    let damageFlashTimer = 0;
    let lastCoinSpawnX = 0;
    let lastWalkDir = 1;
    let lastAnxietyLevelTracked = anxietyLevel;

    // Gymnastics Academy State variables
    let gymAcademyActive = true;
    let gymAcademyX = 0.0;
    let isGymnasticsActive = false;
    let gymnasticsType = ''; // 'pullup' | 'parallel' | 'rings'
    let lastGymnasticsTick = 0;
    let hasTriggeredGymAlert = false;

    // --- LUCKY O PINSCHER CARAMELO (MOTOR DE INTELIGÊNCIA ARTIFICIAL AUTÔNOMO) ---
    const dogAIState = {
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vz: 0,
      orbitAngle: 0,
      targetItemId: null as string | null,
      state: 'ORBIT' as 'ORBIT' | 'FETCH_AHEAD' | 'FETCH_BEHIND' | 'PETTING' | 'CELEBRATE' | 'WAITING_OUTSIDE_PITCH',
      celebrateTimer: 0,
      lastBarkTime: 0,
      jumpY: 0,
      jumpVy: 0,
      initialized: false,
    };
    let wasAtSoccerFieldLastFrame = false;

    // --- 3D MESH OBJECT POOLING ENGINE (Zero GC Pressure & Smooth 60 FPS) ---
    const itemMeshPool = new Map<FallingItem['type'], THREE.Object3D[]>();

    const getPooled3DItemMesh = (type: FallingItem['type']): THREE.Object3D => {
      let obj: THREE.Object3D;
      let pool = itemMeshPool.get(type);
      if (!pool) {
        pool = [];
        itemMeshPool.set(type, pool);
      }
      if (pool.length > 0) {
        obj = pool.pop()!;
        obj.visible = true;
        obj.scale.set(0.8, 0.8, 0.8);
        obj.rotation.set(0, 0, 0);
      } else {
        obj = create3DItemMesh(type);
        obj.scale.set(0.8, 0.8, 0.8);
      }

      // --- ROTATE CAVALETE AND MURRO (PEQUENAPARED) ON THE Y AXIS TO CREATE A PERSPECTIVE DIAGONAL LOOK ---
      if (type === 'Cavalete' || type === 'PequenaPared') {
        obj.rotation.y = Math.PI / 5; // Beautiful ~36 degrees perspective diagonal rotation
      }
      return obj;
    };

    const recyclePooled3DItemMesh = (type: FallingItem['type'], obj: THREE.Object3D) => {
      scene.remove(obj);
      obj.visible = false;
      let pool = itemMeshPool.get(type);
      if (!pool) {
        pool = [];
        itemMeshPool.set(type, pool);
      }
      if (pool.length < 50) {
        pool.push(obj);
      } else {
        disposeObject3D(obj);
      }
    };

    // --- PRE-PLACED PERSISTENT MAP TRACK LAYOUT GENERATOR ---
    const populatePreplacedTrack = () => {
      // Recycle any existing ground items
      for (let i = itemsRef.current.length - 1; i >= 0; i--) {
        const item = itemsRef.current[i];
        if (item.isGroundItem) {
          const obj = active3DObjectsRef.current.get(item.id);
          if (obj) recyclePooled3DItemMesh(item.type, obj);
          active3DObjectsRef.current.delete(item.id);
          itemsRef.current.splice(i, 1);
        }
      }
      hitObstacleIdsRef.current.clear();

      // 1. Pre-place OBSTACLES (Removed permanently as per user directive)
      const obstacleTypes: FallingItem['type'][] = [];
      const obstaclePositions: number[] = [];

      let lastObstacleType = '';
      obstaclePositions.forEach((posX, idx) => {
        let candidate = obstacleTypes[(idx * 2 + Math.floor(Math.random() * 2)) % obstacleTypes.length];
        if (candidate === 'PequenaPared' && lastObstacleType === 'PequenaPared') {
          candidate = 'Cilindro';
        }
        lastObstacleType = candidate;

        const obstItem: FallingItem = {
          id: `preplaced_obst_${idx}_${posX}`,
          type: candidate,
          position: [posX, 0, 0],
          speed: 0,
          rotation: [0, 0, 0],
          color: '#f97316',
          isGroundItem: true,
          lifetime: Infinity,
          maxLifetime: Infinity,
          collected: false,
        };

        itemsRef.current.push(obstItem);
        const obstGroup = getPooled3DItemMesh(candidate);
        obstGroup.position.set(posX, 0, 0);
        obstGroup.visible = true;
        scene.add(obstGroup);
        active3DObjectsRef.current.set(obstItem.id, obstGroup);
      });

      // 2. Pre-place GOLD COINS along the street in open gaps (high density, every 12 units across lanes)
      for (let posX = -250; posX <= 250; posX += 12) {
        const nearObstacle = obstaclePositions.some((oX) => Math.abs(oX - posX) < 6.0);
        if (!nearObstacle) {
          [0, -2.2, 2.2].forEach((zOffset, idx) => {
            if (idx > 0 && Math.abs(posX) % 24 !== 0) return; // Add lateral coins selectively
            const coinId = `preplaced_coin_${posX}_${zOffset}`;
            const coinItem: FallingItem = {
              id: coinId,
              type: 'MoedaOuro',
              position: [posX, 0, zOffset],
              speed: 0,
              rotation: [0, 0, 0],
              color: '#facc15',
              isGroundItem: true,
              lifetime: Infinity,
              maxLifetime: Infinity,
              collected: false,
            };

            itemsRef.current.push(coinItem);
            const coinGroup = getPooled3DItemMesh('MoedaOuro');
            coinGroup.position.set(posX, 0, zOffset);
            coinGroup.visible = true;
            scene.add(coinGroup);
            active3DObjectsRef.current.set(coinItem.id, coinGroup);
          });
        }
      }

      // 3. Pre-place WELLNESS ITEMS in open safe spots
      const wellnessTypes: FallingItem['type'][] = [
        'Bola de Futebol', 'Encontro Presencial', 'Exercício Físico',
        'Atividade ao Ar Livre', 'Desconexão', 'Coffee', 'Book',
        'Hamburguer', 'Violão', 'Cachorro'
      ];

      const wellnessPositions = [
        -215, -175, -140, -105, -70, -35, 0, 35, 70, 105, 140, 175, 210
      ];

      wellnessPositions.forEach((posX, idx) => {
        const nearObstacle = obstaclePositions.some((oX) => Math.abs(oX - posX) < 6.0);
        if (!nearObstacle) {
          const chosenType = wellnessTypes[idx % wellnessTypes.length];
          const wellnessItem: FallingItem = {
            id: `preplaced_wellness_${idx}_${posX}`,
            type: chosenType,
            position: [posX, 1.2, 0],
            speed: 0,
            rotation: [0, 0, 0],
            color: '#10b981',
            isGroundItem: true,
            lifetime: Infinity,
            maxLifetime: Infinity,
            collected: false,
          };

          itemsRef.current.push(wellnessItem);
          const itemGroup = getPooled3DItemMesh(chosenType);
          itemGroup.position.set(posX, 1.2, 0);
          itemGroup.visible = true;
          scene.add(itemGroup);
          active3DObjectsRef.current.set(wellnessItem.id, itemGroup);
        }
      });
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

    // --- PRE-ALLOCATED FLYOVER CREATURES POOL (Zero GC Overhead) ---
    interface FlyoverCreature {
      group: THREE.Group;
      leftWing: THREE.Mesh;
      rightWing: THREE.Mesh;
      velocity: THREE.Vector3;
      isEagle: boolean;
      swoopPhase: number;
      active: boolean;
    }

    const flyoverPool: FlyoverCreature[] = [];
    let spawnTimerFlyover = 0;

    const eagleBodyGeo = new THREE.ConeGeometry(0.35, 1.4, 6);
    const birdBodyGeo = new THREE.ConeGeometry(0.18, 0.7, 5);
    const eagleWingGeo = new THREE.BoxGeometry(2.4, 0.08, 0.5);
    const birdWingGeo = new THREE.BoxGeometry(1.1, 0.05, 0.25);
    const eagleHeadGeo = new THREE.SphereGeometry(0.25, 8, 8);

    const eagleBodyMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const eagleWingMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
    const eagleHeadMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7 });
    const birdBodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const birdWingMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });

    const createPooledCreature = (isEagle: boolean): FlyoverCreature => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(isEagle ? eagleBodyGeo : birdBodyGeo, isEagle ? eagleBodyMat : birdBodyMat);
      body.rotation.x = Math.PI / 2;
      group.add(body);

      const leftWing = new THREE.Mesh(isEagle ? eagleWingGeo : birdWingGeo, isEagle ? eagleWingMat : birdWingMat);
      leftWing.position.set(-(isEagle ? 1.2 : 0.55), 0, 0);
      group.add(leftWing);

      const rightWing = new THREE.Mesh(isEagle ? eagleWingGeo : birdWingGeo, isEagle ? eagleWingMat : birdWingMat);
      rightWing.position.set(isEagle ? 1.2 : 0.55, 0, 0);
      group.add(rightWing);

      if (isEagle) {
        const head = new THREE.Mesh(eagleHeadGeo, eagleHeadMat);
        head.position.set(0, 0.1, 0.7);
        group.add(head);
      }

      group.visible = false;
      scene.add(group);

      return {
        group,
        leftWing,
        rightWing,
        velocity: new THREE.Vector3(),
        isEagle,
        swoopPhase: 0,
        active: false,
      };
    };

    // Pre-create pool of birds and eagles
    for (let i = 0; i < 3; i++) flyoverPool.push(createPooledCreature(false));
    for (let i = 0; i < 2; i++) flyoverPool.push(createPooledCreature(true));

    // Pre-allocated scene environment colors and fog to avoid per-frame allocations
    const zenBgColor = new THREE.Color(0x063970);
    const defeatBgColor = new THREE.Color(0x450a0a);
    
    // Dynamic transition colors for Weather & Atmosphere Presets
    const dayColor = new THREE.Color(0x38bdf8); // Bright blue sky
    const sunsetColor = new THREE.Color(0xea580c); // Deep orange sunset
    const nightColor = new THREE.Color(0x090d16); // Midnight starry night sky
    const rainBgColor = new THREE.Color(0x334155); // Overcast slate gray rain sky
    const fogBgColor = new THREE.Color(0x94a3b8); // Mountain mist sky
    
    const dayAmbient = new THREE.Color(0xffffff);
    const sunsetAmbient = new THREE.Color(0xffedd5);
    const nightAmbient = new THREE.Color(0x38bdf8); // Silver moonlit ambient
    const rainAmbient = new THREE.Color(0x94a3b8);
    const fogAmbient = new THREE.Color(0xe2e8f0);

    const dynamicBgColor = new THREE.Color(dayColor);
    
    const zenFog = new THREE.FogExp2(0x063970, 0.005);
    const defeatFog = new THREE.FogExp2(0x450a0a, 0.025);
    const defaultFog = new THREE.FogExp2(dynamicBgColor, 0.007);

    // --- WEATHER PARTICLE SYSTEMS ---
    // 1. Rain Particle System
    const rainCount = 700;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 90;
      rainPos[i * 3 + 1] = Math.random() * 35;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.25,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const rainParticles = new THREE.Points(rainGeo, rainMat);
    rainParticles.visible = false;
    scene.add(rainParticles);

    // 2. Star Particle System
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 220;
      starPos[i * 3 + 1] = 20 + Math.random() * 60;
      starPos[i * 3 + 2] = -50 + (Math.random() - 0.5) * 80;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.45,
      transparent: true,
      opacity: 0.85,
    });
    const starParticles = new THREE.Points(starGeo, starMat);
    starParticles.visible = false;
    scene.add(starParticles);

    // --- ADVANCED ATHLETIC JUMPING & PHYSICS ENGINE ---
    let playerJumpY = 0;
    let playerJumpVelocity = 0;
    let isGrounded = true;
    let jumpsCount = 0;
    let prevJumpRequested = false;
    let landingSquashTimer = 0;
    let playerZTarget = 0.0;
    let playerZCurr = 0.0;
    let lastFishingTick = 0;
    let lastHorsePetTick = 0;
    let lastPigeonFeedTick = 0;
    let lastHouseRestTick = 0;
    let lastFriendsCircleTick = 0;

    type AutoWalkTargetType = 'NONE' | 'HOUSE' | 'LAKE' | 'HORSES' | 'PIGEONS' | 'FRIENDS' | 'GYM' | 'SOCCER';
    let autoWalkTarget: AutoWalkTargetType = 'NONE';
    let autoWalkStartX = 0;
    let autoWalkStartY = 0.52;
    let autoWalkStartZ = 0;
    let autoWalkDestX = 0;
    let autoWalkDestY = 0.52;
    let autoWalkDestZ = 0;
    let autoWalkDuration = 3.5;
    let autoWalkTimer = 0;

    let houseRestSequenceState: 'IDLE' | 'WALKING_TO_BED' | 'SLEEPING_ON_BED' | 'FINISHED' = 'IDLE';
    let houseRestSequenceTimer = 0;
    let houseRestLastSecond = -1;

    // --- FPS GUARD & PERFORMANCE METRICS MONITOR ---
    let frameCount = 0;
    let fpsTimer = 0;
    let isHighDPI = window.devicePixelRatio > 1.0;

    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Early exit if the game is paused for standard reasons (Menu, Defeat, etc.)
      // We still want to render the scene, but we skip calculations
      if (gameState === 'MENU' || gameState === 'PAUSED' || gameState === 'PAUSED_SAS') {
        renderer.render(scene, camera);
        return;
      }

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

      // Update Flyover Creatures from pre-allocated pool (Birds & Eagles)
      spawnTimerFlyover += delta;
      if (spawnTimerFlyover >= 3.2) {
        spawnTimerFlyover = 0;
        const isEagle = Math.random() < 0.25;
        const candidate = flyoverPool.find((c) => !c.active && c.isEagle === isEagle) || flyoverPool.find((c) => !c.active);
        if (candidate) {
          candidate.active = true;
          candidate.group.visible = true;
          candidate.swoopPhase = Math.random() * Math.PI * 2;

          const startLeft = Math.random() < 0.5;
          const startX = startLeft ? playerGroup.position.x - 70 : playerGroup.position.x + 70;
          const startY = 15 + Math.random() * 8;
          const startZ = 2 + Math.random() * 6;
          candidate.group.position.set(startX, startY, startZ);

          const speedX = (startLeft ? 1 : -1) * (candidate.isEagle ? (12 + Math.random() * 6) : (16 + Math.random() * 8));
          candidate.velocity.set(speedX, 0, 0);
        }
      }

      for (let i = 0; i < flyoverPool.length; i++) {
        const fc = flyoverPool[i];
        if (!fc.active) continue;

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
          fc.active = false;
          fc.group.visible = false;
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
      }

      // Direct & 100% Precise Player Position along X (Zero Input-Lag)
      const targetX = playerPosRef.current;
      const prevPlayerX = playerGroup.position.x;
      const rawDeltaX = targetX - prevPlayerX;
      
      // Wrap Detection: If target jump is large (teleportation / street loop), update cleanly
      let deltaX = rawDeltaX;
      if (houseRestSequenceState === 'IDLE') {
        if (Math.abs(rawDeltaX) > 100) {
          playerGroup.position.x = targetX;
          deltaX = rawDeltaX > 0 ? -1 : 1;
        } else {
          playerGroup.position.x = targetX;
        }
      }

      const isMoving = houseRestSequenceState === 'IDLE' && Math.abs(rawDeltaX) > 0.001;
      if (houseRestSequenceState === 'IDLE') {
        if (rawDeltaX > 0.001) {
          lastWalkDir = 1;
          playerGroup.rotation.y = Math.PI / 2;
        } else if (rawDeltaX < -0.001) {
          lastWalkDir = -1;
          playerGroup.rotation.y = -Math.PI / 2;
        }
      }

      // --- CASA DE DESCANSO, LAGO DE PESCA, PRAÇA DOS POMBOS, ACADEMIA, PASTO DOS CAVALOS, RODA DE CONVERSA & CAMPO DE FUTEBOL - POSICIONAMENTO E PROXIMIDADE ---
      cozyHouseGroup.position.x = -140.0;
      cozyHouseGroup.position.z = -26.0;
      lakeGroup.position.x = -90.0;
      lakeGroup.position.z = -26.0;
      pigeonsParkGroup.position.x = -45.0;
      pigeonsParkGroup.position.z = -22.0;
      gymAcademyGroup.position.x = gymAcademyX; // X = 0.0
      gymAcademyGroup.position.z = -22.0;
      horsesGroup.position.x = 65.0; // Pasto dos Cavalos & Animais separado com folga (X = +65.0)
      horsesGroup.position.z = -22.0;
      friendsCircleGroup.position.x = 115.0;
      friendsCircleGroup.position.z = -22.0;
      soccerFieldGroup.position.x = 180.0;
      soccerFieldGroup.position.z = -42.0;

      const distToHouseX = Math.abs(playerGroup.position.x - cozyHouseGroup.position.x);
      const isNearHouseZone = distToHouseX < 18.0;

      const distToLakeX = Math.abs(playerGroup.position.x - lakeGroup.position.x);
      const isNearLakeZone = distToLakeX < 20.0;

      const distToPigeonsX = Math.abs(playerGroup.position.x - pigeonsParkGroup.position.x);
      const isNearPigeonsZone = distToPigeonsX < 16.0;

      const distToGymX = Math.abs(playerGroup.position.x - gymAcademyX);
      const isNearGymZone = distToGymX < 24.0;

      const distToHorsesX = Math.abs(playerGroup.position.x - horsesGroup.position.x);
      const isNearHorsesZone = distToHorsesX < 18.0;

      const distToFriendsCircleX = Math.abs(playerGroup.position.x - friendsCircleGroup.position.x);
      const isNearFriendsCircleZone = distToFriendsCircleX < 18.0;

      const distToSoccerX = Math.abs(playerGroup.position.x - soccerFieldGroup.position.x);
      const isNearSoccerZone = distToSoccerX < 36.0;

      // Nearest street bench with seated companion
      const nearestStreetBench = streetBenchesList.find(b => Math.abs(playerGroup.position.x - b.benchX) < 4.2);
      const isNearStreetBenchZone = !!nearestStreetBench;

      // Check if player is aligned along X with any special depth interactive zone
      const isInsideSpecialZoneX = isNearHouseZone || isNearLakeZone || isNearHorsesZone || isNearPigeonsZone || isNearFriendsCircleZone || isNearGymZone || isNearSoccerZone || isNearStreetBenchZone;

      // Key & Button state detection
      const upKey = !!keysDownRef?.current?.up || !!keysDownRef?.current?.jump || !!jumpActiveRef?.current;
      const downKey = !!keysDownRef?.current?.down || !!keysDownRef?.current?.crouch || !!crouchActiveRef?.current;
      const leftKey = !!keysDownRef?.current?.left;
      const rightKey = !!keysDownRef?.current?.right;
      const isUserControlling = leftKey || rightKey || upKey || downKey;

      // --- JUMP DISABLING ONLY IN SPECIAL Z-ZONES WHEN IN DEPTH ---
      // Desabilita o pulo apenas quando o avatar estiver ativamente navegando na profundidade das áreas especiais.
      // Na rua principal (Z >= -1.5), o pulo funciona perfeitamente para saltar sobre obstáculos.
      const rawJumpRequested = !!jumpActiveRef?.current || !!keysDownRef?.current?.jump;
      const jumpDisabledInDepth = isInsideSpecialZoneX && (playerGroup.position.z < -2.0 || upKey);
      const jumpRequested = jumpDisabledInDepth ? false : rawJumpRequested;
      const crouchRequested = !!crouchActiveRef?.current || !!keysDownRef?.current?.crouch;

      // Jump Takeoff Impulse (Super Salto com alta impulsão para saltar sobre obstáculos e alcançar itens altos)
      const justJumped = jumpRequested && !prevJumpRequested;
      prevJumpRequested = jumpRequested;

      if (justJumped && isGrounded && !crouchRequested) {
        playerJumpVelocity = 23.5; // Impulse reaching ~6.2 units apex height
        isGrounded = false;
        jumpsCount = 1;
      } else if (justJumped && !isGrounded && jumpsCount === 1 && playerSkills?.doubleJump) {
        playerJumpVelocity = 20.0; // Pulo duplo!
        jumpsCount = 2;
        // Adiciona um pequeno squash para dar o feel do pulo no ar
        landingSquashTimer = 0.08; 
      }

      // Physics integration (Curva Parabólica, Hang-time no ápice e Gravidade Dinâmica)
      if (!isGrounded) {
        // Gravidade variável: segurar salto suaviza a subida com hang-time estendido; soltar acelera a descida
        const gravity = (jumpRequested && playerJumpVelocity > 0) ? 40.0 : 52.0;
        playerJumpVelocity -= gravity * delta;
        playerJumpY += playerJumpVelocity * delta;

        if (playerJumpY <= 0) {
          playerJumpY = 0;
          playerJumpVelocity = 0;
          isGrounded = true;
          landingSquashTimer = 0.12; // Impacto elástico de aterrissagem
        }
      }

      // Squash & Stretch dinâmico para elasticidade e sensação física
      let targetScaleY = 1.0;
      let targetScaleXZ = 1.0;

      if (!isGrounded) {
        if (playerJumpVelocity > 6.0) {
          // Alongamento vertical na impulsão de decolagem
          targetScaleY = 1.24;
          targetScaleXZ = 0.88;
        } else if (playerJumpVelocity < -6.0) {
          // Alongamento na descida
          targetScaleY = 1.12;
          targetScaleXZ = 0.94;
        } else {
          // Encolhimento no ápice do salto (tuck)
          targetScaleY = 0.92;
          targetScaleXZ = 1.06;
        }
      } else if (landingSquashTimer > 0) {
        landingSquashTimer -= delta;
        targetScaleY = 0.78;
        targetScaleXZ = 1.16;
      } else if (crouchRequested) {
        targetScaleY = 0.68;
        targetScaleXZ = 1.20;
      }

      // Reduzir o tamanho do avatar em mais 10% (de 0.72 para 0.648) mantendo a proporção exata do corpo e acessórios
      const AVATAR_SIZE_SCALE = 0.648;
      targetScaleY *= AVATAR_SIZE_SCALE;
      targetScaleXZ *= AVATAR_SIZE_SCALE;

      const crouchYOffset = (crouchRequested && isGrounded) ? -0.45 : 0;
      const AVATAR_BASE_Y = 0.52;
      const finalBaseY = playerJumpY + crouchYOffset + AVATAR_BASE_Y;

      if (houseRestSequenceState === 'IDLE') {
        playerGroup.position.y = finalBaseY;
      }
      playerGroup.scale.y += (targetScaleY - playerGroup.scale.y) * 0.3;
      playerGroup.scale.x += (targetScaleXZ - playerGroup.scale.x) * 0.3;
      playerGroup.scale.z += (targetScaleXZ - playerGroup.scale.z) * 0.3;

      // Max allowable depth per specific zone
      const maxZoneDepth = isNearGymZone ? -24.0 : isNearSoccerZone ? -46.0 : isNearHouseZone ? -28.0 : isNearLakeZone ? -28.0 : isNearHorsesZone ? -26.0 : isNearPigeonsZone ? -24.0 : isNearFriendsCircleZone ? -24.0 : isNearStreetBenchZone ? -5.0 : 0.0;

      // Enable Z movement & Intention-Driven Organic Auto-Walk when avatar is aligned with any interactive zone
      if (isInsideSpecialZoneX && (gameState === 'PLAYING' || gameState === 'MODO_ZEN') && houseRestSequenceState === 'IDLE' && autoWalkTarget === 'NONE') {
        const startAutoWalk = (
          target: AutoWalkTargetType,
          destX: number,
          destY: number,
          destZ: number,
          eventName: string
        ) => {
          autoWalkTarget = target;
          autoWalkStartX = playerGroup.position.x;
          autoWalkStartY = playerGroup.position.y;
          autoWalkStartZ = playerGroup.position.z;
          autoWalkDestX = destX;
          autoWalkDestY = destY;
          autoWalkDestZ = destZ;
          autoWalkTimer = 0;

          const distRemainZ = Math.abs(destZ - autoWalkStartZ);
          const distRemainX = Math.abs(destX - autoWalkStartX);
          const totalDist = Math.sqrt(distRemainX * distRemainX + distRemainZ * distRemainZ);
          // Velocidade orgânica, balanceada e harmoniosa de caminhada (~4.8 un/s)
          autoWalkDuration = Math.max(2.4, Math.min(5.2, totalDist / 4.8));

          window.dispatchEvent(new CustomEvent(eventName));
        };

        // GATILHO DE DETECÇÃO DE INTENÇÃO VIA JOYSTICK:
        // Ao inclinar o joystick para cima (UP) próximo a qualquer área interativa,
        // o avatar consolida uma trajetória orgânica automática em direção ao destino.
        if (upKey && playerGroup.position.z > -10.0) {
          if (isNearHouseZone && Math.abs(playerPosRef.current - (-140.0)) < 12.0) {
            startAutoWalk('HOUSE', -140.0, 0.85, -22.5, 'house-enter-start');
          } else if (isNearLakeZone && Math.abs(playerPosRef.current - (-90.0)) < 14.0) {
            startAutoWalk('LAKE', -90.0, 0.72, -22.5, 'lake-enter-start');
          } else if (isNearPigeonsZone && Math.abs(playerPosRef.current - (-45.0)) < 12.0) {
            startAutoWalk('PIGEONS', -44.2, 0.52, -22.5, 'pigeons-enter-start');
          } else if (isNearGymZone && Math.abs(playerPosRef.current - 0.0) < 14.0) {
            startAutoWalk('GYM', 0.0, 0.52, -20.0, 'gym-enter-start');
          } else if (isNearHorsesZone && Math.abs(playerPosRef.current - 65.0) < 14.0) {
            startAutoWalk('HORSES', 65.0, 0.52, -18.0, 'horses-enter-start');
          } else if (isNearFriendsCircleZone && Math.abs(playerPosRef.current - 115.0) < 14.0) {
            startAutoWalk('FRIENDS', 115.0, 0.52, -21.0, 'friends-enter-start');
          } else if (isNearSoccerZone && Math.abs(playerPosRef.current - 180.0) < 24.0) {
            startAutoWalk('SOCCER', 180.0, 0.52, -38.0, 'soccer-enter-start');
          } else {
            playerZTarget = Math.max(maxZoneDepth, playerZTarget - delta * 18.0);
          }
        } else if (upKey) {
          playerZTarget = Math.max(maxZoneDepth, playerZTarget - delta * 18.0);
        } else if (downKey) {
          playerZTarget = Math.min(0.0, playerZTarget + delta * 22.0);
        } else {
          // When in special zone but neither UP nor DOWN is pressed, gently drift back towards main street level Z = 0
          playerZTarget += (0.0 - playerZTarget) * delta * 3.5;
        }
      } else if (houseRestSequenceState === 'IDLE' && autoWalkTarget === 'NONE') {
        // Outside special interactive zones: ALWAYS smoothly and decisively return to the street level Z = 0
        playerZTarget += (0.0 - playerZTarget) * delta * 14.0;
      }

      // Snap cleanly to zero if close to street level and not actively heading deep
      if (houseRestSequenceState === 'IDLE' && autoWalkTarget === 'NONE' && Math.abs(playerZTarget) < 0.12 && (!isInsideSpecialZoneX || !upKey)) {
        playerZTarget = 0.0;
        if (Math.abs(playerZCurr) < 0.15) {
          playerZCurr = 0.0;
        }
      }

      // --- COLLISION BOUNDARY CONSTRAINTS FOR LAKE ZONE ---
      // Prevents the player from walking on the lake water, while permitting walking on the wooden pier/deck
      // or around the sides (margins/shore) of the lake.
      if (isNearLakeZone && houseRestSequenceState === 'IDLE') {
        const lakeX = -90.0;
        const lakeZ = -26.0;
        const waterRadius = 12.5; // Physical radius of the lake water surface
        
        const pX = playerPosRef.current;
        const pZ = playerZTarget;
        
        // Calculate horizontal offset from pier center line (X = -90.0)
        const dxToPier = Math.abs(pX - lakeX);
        const isOnPierXZone = dxToPier <= 2.2; // The deck is 4.2 units wide, so +-2.1 is the physical deck
        
        // Lake water region starts roughly when Z is deeper than -13.5 (local Z = 12.5 relative to Z = -26.0)
        if (isOnPierXZone) {
          if (pZ < -13.5) {
            // Keep the player strictly aligned on the wooden deck so they don't fall off the sides
            playerPosRef.current = Math.max(lakeX - 1.6, Math.min(lakeX + 1.6, pX));
          }
        } else {
          // If the player is on the sides/shores of the lake (outside the pier X zone)
          const dx = pX - lakeX;
          const dz = pZ - lakeZ;
          const distToLakeCenter = Math.sqrt(dx * dx + dz * dz);
          
          if (distToLakeCenter < waterRadius) {
            // Player is attempting to enter the water. Push them back to the rocky shore boundary!
            // We project their position to the circle's boundary.
            const angle = Math.atan2(dz, dx);
            playerPosRef.current = lakeX + Math.cos(angle) * waterRadius;
            playerZTarget = lakeZ + Math.sin(angle) * waterRadius;
          }
        }
      }

      // Smoothly interpolate player Z position
      if (houseRestSequenceState === 'IDLE') {
        playerZCurr += (playerZTarget - playerZCurr) * delta * 12.0;
        playerGroup.position.z = playerZCurr;
      }

      // Animate 3D Lake Fish (Swimming & Jumping out of water)
      lakeFishList.forEach((fish) => {
        if (fish.isJumping) {
          fish.jumpProgress += delta * 2.2;
          if (fish.jumpProgress >= 1.0) {
            fish.isJumping = false;
            fish.jumpProgress = 0;
            fish.group.position.y = fish.startPosY;
            playFishingSplashSFX(settingsRef.current.enableSound !== false);
          } else {
            const arcY = Math.sin(fish.jumpProgress * Math.PI) * 2.2;
            fish.group.position.y = fish.startPosY + arcY;
            fish.group.rotation.x = -Math.sin(fish.jumpProgress * Math.PI) * 0.8;
          }
        } else {
          fish.baseAngle += delta * fish.speed;
          const fx = Math.cos(fish.baseAngle) * fish.radius;
          const fz = Math.sin(fish.baseAngle) * fish.radius;
          fish.group.position.set(fx, fish.startPosY + Math.sin(time * 3 + fish.radius) * 0.08, fz);
          fish.group.rotation.y = -fish.baseAngle + Math.PI / 2;

          fish.jumpTimer += delta;
          if (fish.jumpTimer >= fish.jumpInterval) {
            fish.jumpTimer = 0;
            fish.isJumping = true;
            fish.jumpProgress = 0;
            playFishingSplashSFX(settingsRef.current.enableSound !== false);
          }
        }
      });

      // Animate House Chimney Smoke gently rising and drifting
      houseChimneySmokeList.forEach((smoke) => {
        smoke.mesh.position.y += smoke.speedY * delta;
        smoke.mesh.position.x = 5.2 + Math.sin(time * 1.5 + smoke.offset) * 0.35;
        if (smoke.mesh.position.y > 17.5) {
          smoke.mesh.position.y = smoke.startY;
          smoke.mesh.position.x = 5.2;
        }
      });

      // --- CASA COMPLETA DE DESCANSO & RECUPERAÇÃO NOTURNA INTERACTION ---
      // Calculate day/night state for custom events
      const wPreset = settingsRef.current.weatherPreset || 'auto';
      const dNight = settingsRef.current.dayNightCycle || 'auto';
      let effPreset = wPreset;
      if (effPreset === 'auto') {
        if (dNight === 'day') effPreset = 'clear';
        else if (dNight === 'night') effPreset = 'night';
        else {
          const curAnx = anxietyRef.current;
          if (curAnx > 75) effPreset = 'rain';
          else if (curAnx > 50) effPreset = 'night';
          else if (curAnx > 25) effPreset = 'sunset';
          else effPreset = 'clear';
        }
      }
      const isNightTime = effPreset === 'night' || effPreset === 'rain' || effPreset === 'sunset';

      // 1. Movimentação Automática, Harmoniosa e Orgânica para Todas as Áreas Especiais (Casa, Lago, Cavalos, Pombos, Amigos, Academia, Futebol)
      if (autoWalkTarget !== 'NONE') {
        // Cancelamento interativo imediato se o usuário puxar o joystick para trás (downKey)
        if (downKey) {
          autoWalkTarget = 'NONE';
          autoWalkTimer = 0;
          playerPosRef.current = playerGroup.position.x;
          playerZTarget = playerGroup.position.z;
          playerZCurr = playerGroup.position.z;
          playerGroup.rotation.set(0, 0, 0);
          if (leftLegGroup && rightLegGroup) {
            leftLegGroup.rotation.set(0, 0, 0);
            rightLegGroup.rotation.set(0, 0, 0);
            leftLowerLegGroup.rotation.set(0, 0, 0);
            rightLowerLegGroup.rotation.set(0, 0, 0);
          }
          if (leftArmGroup && rightArmGroup) {
            leftArmGroup.rotation.set(0, 0, 0);
            rightArmGroup.rotation.set(0, 0, 0);
            leftLowerArmGroup.rotation.set(0, 0, 0);
            rightLowerArmGroup.rotation.set(0, 0, 0);
          }
          if (torsoGroup) {
            torsoGroup.position.set(0, 0, 0);
            torsoGroup.rotation.set(0, 0, 0);
          }
          if (headGroup) {
            headGroup.rotation.set(0, 0, 0);
          }
        } else {
          autoWalkTimer += delta;
          const p = Math.min(1.0, autoWalkTimer / autoWalkDuration);
          // Curva cúbica suave (smoothstep: aceleração gradual, passo constante e chegada suave)
          const ease = p * p * (3 - 2 * p);

          // Alinha o boneco suavemente ao centro do caminho/acesso nos primeiros 35% do percurso
          const xAlignProgress = Math.min(1.0, p / 0.35);
          const smoothXAlign = xAlignProgress * xAlignProgress * (3 - 2 * xAlignProgress);
          const targetX = autoWalkStartX + (autoWalkDestX - autoWalkStartX) * smoothXAlign;
          const targetZ = autoWalkStartZ + (autoWalkDestZ - autoWalkStartZ) * ease;

          // Elevação física harmoniosa baseada na topografia do destino
          let baseY = autoWalkStartY + (autoWalkDestY - autoWalkStartY) * ease;
          if (autoWalkTarget === 'HOUSE' && targetZ <= -19.3) {
            const stepUpProgress = Math.min(1.0, (-19.3 - targetZ) / 1.8);
            baseY = 0.52 + (0.85 - 0.52) * stepUpProgress;
          } else if (autoWalkTarget === 'LAKE' && targetZ <= -14.0) {
            const pierStepProgress = Math.min(1.0, (-14.0 - targetZ) / 3.0);
            baseY = 0.52 + (0.72 - 0.52) * pierStepProgress;
          }

          // Oscilação natural de caminhada (Human gait dynamics)
          const walkPhase = time * 10.5;
          const stepBob = Math.sin(walkPhase * 2.0) * 0.035;
          const finalY = baseY + Math.abs(stepBob);

          playerGroup.position.set(targetX, finalY, targetZ);
          playerPosRef.current = targetX;
          playerZTarget = targetZ;
          playerZCurr = targetZ;

          // Rotação corporal dinâmica acompanhando o vetor de deslocamento
          const nextP = Math.min(1.0, p + 0.02);
          const nextEase = nextP * nextP * (3 - 2 * nextP);
          const nextXAlign = Math.min(1.0, nextP / 0.35);
          const nextX = autoWalkStartX + (autoWalkDestX - autoWalkStartX) * (nextXAlign * nextXAlign * (3 - 2 * nextXAlign));
          const nextZ = autoWalkStartZ + (autoWalkDestZ - autoWalkStartZ) * nextEase;
          const dirX = nextX - targetX;
          const dirZ = nextZ - targetZ;

          let targetAngle = Math.PI; // Olhando para o fundo da praça
          if (Math.abs(dirX) > 0.001 || Math.abs(dirZ) > 0.001) {
            targetAngle = Math.atan2(dirX, -dirZ);
          }
          playerGroup.rotation.y = THREE.MathUtils.lerp(playerGroup.rotation.y, targetAngle, 0.22);
          playerGroup.rotation.x = 0;
          playerGroup.rotation.z = 0;

          // Animação rítmica e orgânica dos membros, joelhos, braços e torso
          if (leftLegGroup && rightLegGroup) {
            leftLegGroup.rotation.x = Math.sin(walkPhase) * 0.52;
            rightLegGroup.rotation.x = -Math.sin(walkPhase) * 0.52;
            if (leftLowerLegGroup && rightLowerLegGroup) {
              leftLowerLegGroup.rotation.x = Math.max(0, Math.sin(walkPhase + 0.4) * 0.45);
              rightLowerLegGroup.rotation.x = Math.max(0, -Math.sin(walkPhase + 0.4) * 0.45);
            }
          }
          if (leftArmGroup && rightArmGroup) {
            leftArmGroup.rotation.x = -Math.sin(walkPhase) * 0.42;
            rightArmGroup.rotation.x = Math.sin(walkPhase) * 0.42;
            if (leftLowerArmGroup && rightLowerArmGroup) {
              leftLowerArmGroup.rotation.x = -0.15;
              rightLowerArmGroup.rotation.x = -0.15;
            }
          }
          if (torsoGroup) {
            torsoGroup.position.y = Math.sin(walkPhase * 2.0) * 0.025;
            torsoGroup.rotation.z = Math.sin(walkPhase) * 0.02;
          }
          if (headGroup) {
            headGroup.rotation.x = -0.06;
          }

          if (p >= 1.0) {
            const finishedTarget = autoWalkTarget;
            autoWalkTarget = 'NONE';
            if (finishedTarget === 'HOUSE') {
              houseRestSequenceState = 'WALKING_TO_BED';
              houseRestSequenceTimer = 0;
              houseRestLastSecond = -1;
              window.dispatchEvent(new CustomEvent('house-rest-start', { detail: { isNight: isNightTime } }));
            } else if (finishedTarget === 'LAKE') {
              fishingRodGroup.visible = true;
              window.dispatchEvent(new CustomEvent('lake-pier-arrived'));
            } else if (finishedTarget === 'HORSES') {
              window.dispatchEvent(new CustomEvent('horses-arrived'));
            } else if (finishedTarget === 'PIGEONS') {
              window.dispatchEvent(new CustomEvent('pigeons-arrived'));
            } else if (finishedTarget === 'FRIENDS') {
              window.dispatchEvent(new CustomEvent('friends-arrived'));
            } else if (finishedTarget === 'GYM') {
              window.dispatchEvent(new CustomEvent('gym-arrived'));
            } else if (finishedTarget === 'SOCCER') {
              window.dispatchEvent(new CustomEvent('soccer-field-arrived'));
            }
          }
        }
      }

      // 2. Interação no Interior da Casa (Cama, Recuperação e Descanso)
      const isAtHouseRestSpot = isNearHouseZone && playerGroup.position.z <= -21.8 && autoWalkTarget === 'NONE';

      if (isAtHouseRestSpot) {
        // Initialize sequence se o avatar alcançou o ponto manualmente
        if (houseRestSequenceState === 'IDLE') {
          houseRestSequenceState = 'WALKING_TO_BED';
          houseRestSequenceTimer = 0;
          houseRestLastSecond = -1;
          window.dispatchEvent(new CustomEvent('house-rest-start', { detail: { isNight: isNightTime } }));
        }

        houseRestSequenceTimer += delta;

        const doorX = cozyHouseGroup.position.x; // -140.0
        const doorZ = -22.5;
        const doorY = 0.85;

        const bedX = cozyHouseGroup.position.x - 3.2; // -143.2
        const bedZ = -25.5;
        const bedY = 1.05;

        // Interactive cancellation logic: Cancel rest sequence when the user attempts to move the joystick or press keys
        const canCancel = (houseRestSequenceState === 'SLEEPING_ON_BED' && houseRestSequenceTimer > 1.2) || (houseRestSequenceState === 'FINISHED');
        if (canCancel && isUserControlling) {
          houseRestSequenceState = 'IDLE';
          houseRestSequenceTimer = 0;
          houseRestLastSecond = -1;

          // Teleport player back to the hallway/entrance door area (safely out of the sleeping trigger zone Z <= -21.8)
          playerGroup.position.x = doorX;
          playerGroup.position.y = 0.85; // Altura correta do piso interior
          playerGroup.position.z = -21.6; // Standing in the hallway

          playerPosRef.current = doorX;
          playerZTarget = -21.6;
          playerZCurr = -21.6;

          playerGroup.rotation.x = 0;
          playerGroup.rotation.y = 0;
          playerGroup.rotation.z = 0;

          if (leftLegGroup && rightLegGroup) {
            leftLegGroup.rotation.set(0, 0, 0);
            rightLegGroup.rotation.set(0, 0, 0);
            leftLowerLegGroup.rotation.set(0, 0, 0);
            rightLowerLegGroup.rotation.set(0, 0, 0);
          }
          if (leftArmGroup && rightArmGroup) {
            leftArmGroup.rotation.set(0, 0, 0);
            rightArmGroup.rotation.set(0, 0, 0);
            leftLowerArmGroup.rotation.set(0, 0, 0);
            rightLowerArmGroup.rotation.set(0, 0, 0);
          }
          if (torsoGroup) {
            torsoGroup.scale.set(1, 1, 1);
            torsoGroup.position.set(0, 0, 0);
            torsoGroup.rotation.set(0, 0, 0);
          }
          if (headGroup) {
            headGroup.rotation.set(0, 0, 0);
          }

          window.dispatchEvent(
            new CustomEvent('house-rest-completed', { detail: { isNight: isNightTime, cancelled: true } })
          );

          createExplosion(doorX, 0.58, -21.6);
          return;
        }

        if (houseRestSequenceState === 'WALKING_TO_BED') {
          const walkDuration = 2.0;
          const p = Math.min(1.0, houseRestSequenceTimer / walkDuration);

          // Smooth walking path from entrance door into bedroom
          playerGroup.position.x = doorX + (bedX - doorX) * p;
          playerGroup.position.z = doorZ + (bedZ - doorZ) * p;
          playerGroup.position.y = doorY + (bedY - doorY) * p;

          playerPosRef.current = playerGroup.position.x;
          playerZTarget = playerGroup.position.z;
          playerZCurr = playerGroup.position.z;

          // Animate walking legs/arms
          const walkPhase = time * 12.0;
          if (leftLegGroup && rightLegGroup) {
            leftLegGroup.rotation.x = Math.sin(walkPhase) * 0.45;
            rightLegGroup.rotation.x = -Math.sin(walkPhase) * 0.45;
          }
          if (leftArmGroup && rightArmGroup) {
            leftArmGroup.rotation.x = -Math.sin(walkPhase) * 0.35;
            rightArmGroup.rotation.x = Math.sin(walkPhase) * 0.35;
          }
          playerGroup.rotation.y = -Math.PI * 0.65; // Facing inside towards bed

          if (p >= 1.0) {
            houseRestSequenceState = 'SLEEPING_ON_BED';
            houseRestSequenceTimer = 0;
            houseRestLastSecond = 10;
          }
        } else if (houseRestSequenceState === 'SLEEPING_ON_BED') {
          // Position avatar lying comfortably on bed
          playerGroup.position.x = bedX;
          playerGroup.position.y = 1.88; // Rest flat on top of the soft mattress
          playerGroup.position.z = bedZ + 1.9; // Head aligned with pillow at bedZ - 1.6
          playerGroup.rotation.x = -Math.PI / 2; // Lie down horizontal face up
          playerGroup.rotation.y = 0;
          playerGroup.rotation.z = 0;

          playerPosRef.current = bedX;
          playerZTarget = bedZ + 1.9;
          playerZCurr = bedZ + 1.9;

          // Neutral posture for limbs while resting on bed
          if (leftLegGroup && rightLegGroup) {
            leftLegGroup.rotation.set(0, 0, 0.05); // slightly spread legs for natural posture
            rightLegGroup.rotation.set(0, 0, -0.05);
            leftLowerLegGroup.rotation.set(0, 0, 0);
            rightLowerLegGroup.rotation.set(0, 0, 0);
          }
          if (leftArmGroup && rightArmGroup) {
            leftArmGroup.rotation.set(0.1, 0, -0.08); // arms relaxed at sides
            rightArmGroup.rotation.set(0.1, 0, 0.08);
            leftLowerArmGroup.rotation.set(-0.1, 0, 0);
            rightLowerArmGroup.rotation.set(-0.1, 0, 0);
          }

          // Slow, peaceful sleeping breathing animation
          const sleepBreathing = Math.sin(time * 2.2) * 0.035;
          if (torsoGroup) {
            torsoGroup.scale.set(1.0 + sleepBreathing, 1.0, 1.0 + sleepBreathing);
            torsoGroup.position.y = sleepBreathing * 0.1; // chest rises and falls sutilmente
          }
          if (headGroup) {
            headGroup.rotation.set(0.05, 0.12, 0.05); // tilted comfortably on pillow
          }

          // Animate Floating "Zzz" and dream sparkles
          houseZzzParticlesList.forEach((zzz) => {
            zzz.group.visible = true;
            zzz.group.position.y += zzz.speedY * delta;
            zzz.group.position.x = -3.2 + Math.sin(time * 2.5 + zzz.phase) * 0.35;
            if (zzz.group.position.y > 5.2) {
              zzz.group.position.y = zzz.startY;
            }
          });

          // 10-Second Countdown logic
          const restElapsed = houseRestSequenceTimer; // 0.0 to 10.0
          const remainingSecs = Math.max(1, Math.ceil(10.0 - restElapsed));

          if (remainingSecs !== houseRestLastSecond) {
            houseRestLastSecond = remainingSecs;
            window.dispatchEvent(
              new CustomEvent('house-rest-tick', {
                detail: { remainingSeconds: remainingSecs, totalSeconds: 10, isNight: isNightTime },
              })
            );
            createExplosion(bedX, 1.8, bedZ);
          }

          if (restElapsed >= 10.0) {
            houseRestSequenceState = 'FINISHED';
            window.dispatchEvent(
              new CustomEvent('house-rest-completed', { detail: { isNight: isNightTime } })
            );
            createExplosion(bedX, 2.0, bedZ);
          }
        } else if (houseRestSequenceState === 'FINISHED') {
          // Stay resting comfortably on bed
          playerGroup.position.x = bedX;
          playerGroup.position.y = 2.0;
          playerGroup.position.z = bedZ + 1.9;
          playerGroup.rotation.x = -Math.PI / 2;
          playerGroup.rotation.y = 0;
          playerGroup.rotation.z = 0;

          playerPosRef.current = bedX;
          playerZTarget = bedZ + 1.9;
          playerZCurr = bedZ + 1.9;

          if (leftLegGroup && rightLegGroup) {
            leftLegGroup.rotation.set(0, 0, 0.05);
            rightLegGroup.rotation.set(0, 0, -0.05);
            leftLowerLegGroup.rotation.set(0, 0, 0);
            rightLowerLegGroup.rotation.set(0, 0, 0);
          }
          if (leftArmGroup && rightArmGroup) {
            leftArmGroup.rotation.set(0.1, 0, -0.08);
            rightArmGroup.rotation.set(0.1, 0, 0.08);
            leftLowerArmGroup.rotation.set(-0.1, 0, 0);
            rightLowerArmGroup.rotation.set(-0.1, 0, 0);
          }

          const sleepBreathing = Math.sin(time * 2.2) * 0.035;
          if (torsoGroup) {
            torsoGroup.scale.set(1.0 + sleepBreathing, 1.0, 1.0 + sleepBreathing);
            torsoGroup.position.y = sleepBreathing * 0.1;
          }
          if (headGroup) {
            headGroup.rotation.set(0.05, 0.12, 0.05);
          }

          houseZzzParticlesList.forEach((zzz) => {
            zzz.group.visible = true;
            zzz.group.position.y += zzz.speedY * delta * 0.5;
            if (zzz.group.position.y > 5.2) zzz.group.position.y = zzz.startY;
          });
        }
      } else {
        // Reset when avatar leaves the house (preserves autoWalkTarget while walking)
        if (houseRestSequenceState !== 'IDLE' && autoWalkTarget === 'NONE') {
          houseRestSequenceState = 'IDLE';
          houseRestSequenceTimer = 0;
          houseRestLastSecond = -1;
          playerGroup.rotation.x = 0;
          playerGroup.rotation.y = 0;
          playerGroup.rotation.z = 0;
          if (leftLegGroup && rightLegGroup) {
            leftLegGroup.rotation.set(0, 0, 0);
            rightLegGroup.rotation.set(0, 0, 0);
            leftLowerLegGroup.rotation.set(0, 0, 0);
            rightLowerLegGroup.rotation.set(0, 0, 0);
          }
          if (leftArmGroup && rightArmGroup) {
            leftArmGroup.rotation.set(0, 0, 0);
            rightArmGroup.rotation.set(0, 0, 0);
            leftLowerArmGroup.rotation.set(0, 0, 0);
            rightLowerArmGroup.rotation.set(0, 0, 0);
          }
          if (torsoGroup) {
            torsoGroup.scale.set(1, 1, 1);
            torsoGroup.position.set(0, 0, 0);
            torsoGroup.rotation.set(0, 0, 0);
          }
          if (headGroup) {
            headGroup.rotation.set(0, 0, 0);
          }
        }
        // Hide Zzz when not resting inside house
        houseZzzParticlesList.forEach((zzz) => {
          zzz.group.visible = false;
        });
      }

      // Fishing Pier Spot Interaction (Z < -12.0)
      const isAtFishingSpot = isNearLakeZone && playerGroup.position.z < -12.0;

      if (isAtFishingSpot) {
        fishingRodGroup.visible = true;

        if (time - lastFishingTick > 3.0) {
          lastFishingTick = time;

          playFishingSplashSFX(settingsRef.current.enableSound !== false);
          playFishingCatchSFX(settingsRef.current.enableSound !== false);

          createExplosion(lakeGroup.position.x, 0.2, -22.0);

          // Dispatch event to decrease anxiety by 30%
          window.dispatchEvent(new CustomEvent('lake-fish-caught'));
        }
      } else {
        if (!isGymnasticsActive) {
          fishingRodGroup.visible = false;
        }
      }

      // --- HORSES FIELD INTERACTION & PETTING MECHANIC ---
      const isAtHorsesSpot = isNearHorsesZone && playerGroup.position.z < -12.0;

      if (isAtHorsesSpot) {
        // Find closest horse to the player to interact with
        let closestHorse: any = null;
        let minDist = Infinity;
        const pX = playerGroup.position.x;
        const pZ = playerGroup.position.z;

        // The horses relative coordinates in horsesGroup (set at (60, 0, -22)):
        // horse1: (0, 0, 4)
        // horse2: (-6.5, 0, -2)
        // horse3: (7, 0, -1)
        const hPosList = [
          { x: horsesGroup.position.x + 0.0, z: horsesGroup.position.z + 4.0, rotY: 0.0, ref: horseRefsList[0] },
          { x: horsesGroup.position.x - 6.5, z: horsesGroup.position.z - 2.0, rotY: Math.PI * 0.35, ref: horseRefsList[1] },
          { x: horsesGroup.position.x + 7.0, z: horsesGroup.position.z - 1.0, rotY: -Math.PI * 0.25, ref: horseRefsList[2] },
        ];

        hPosList.forEach((h) => {
          const d = Math.hypot(pX - h.x, pZ - h.z);
          if (d < minDist) {
            minDist = d;
            closestHorse = h;
          }
        });

        // Smoothly glide/move the player towards the feeding spot (in front of the horse's head)
        if (closestHorse) {
          // Standing spot slightly in front of horse's local front (+Z/head direction)
          const targetX = closestHorse.x + Math.sin(closestHorse.rotY) * 2.8;
          const targetZ = closestHorse.z + Math.cos(closestHorse.rotY) * 2.8;

          // Slide player positions smoothly (playerPosRef is for X, playerZTarget is for Z target)
          playerPosRef.current += (targetX - playerPosRef.current) * delta * 4.0;
          playerZTarget += (targetZ - playerZTarget) * delta * 4.0;

          // Rotate player to face the horse
          const angleToHorse = Math.atan2(closestHorse.x - pX, closestHorse.z - pZ);
          playerGroup.rotation.y = angleToHorse;

          // Animate the specific horse lowering/bobbing head towards player's hand with grass
          if (closestHorse.ref) {
            closestHorse.ref.headGroup.rotation.x = 0.45 + Math.sin(time * 6.0) * 0.2; // eating animation
            closestHorse.ref.tailMesh.rotation.z = Math.sin(time * 3.0) * 0.15;
          }
        }

        // Animate other horses with simple gentle idle head bobbing & tail swishing
        hPosList.forEach((h) => {
          if (h !== closestHorse && h.ref) {
            h.ref.headGroup.rotation.x = Math.sin(time * 2.0) * 0.08;
            h.ref.tailMesh.rotation.z = Math.sin(time * 3.0) * 0.1;
          }
        });

        if (time - lastHorsePetTick > 3.0) {
          lastHorsePetTick = time;

          playHorsePettingSFX(settingsRef.current.enableSound !== false);

          if (closestHorse) {
            createExplosion(closestHorse.x, 1.8, closestHorse.z); // Explosion near horse head
          } else {
            createExplosion(horsesGroup.position.x, 0.2, -22.0);
          }

          // Dispatch event to decrease anxiety by 30%
          window.dispatchEvent(new CustomEvent('horse-petted'));
        }
      }

      // --- PRAÇA DOS POMBOS & BANCO DA PRAÇA INTERACTION ---
      const isAtPigeonsBenchSpot = isNearPigeonsZone && playerGroup.position.z < -8.0;

      if (isAtPigeonsBenchSpot) {
        // Animate 10 3D pigeons head bobbing, pecking on the ground, and flocking near bench
        pigeonsRefList.forEach((pRef, idx) => {
          pRef.headGroup.rotation.x = 0.25 + Math.sin(time * 9.0 + idx * 1.2) * 0.35; // Pecking down
          pRef.tailMesh.rotation.z = Math.cos(time * 7.0 + idx) * 0.18;
          pRef.group.rotation.y += Math.sin(time * 2.0 + idx) * 0.02;
        });

        // Sitting pose on the bench when approaching the bench (Z < -9.5)
        if (playerGroup.position.z < -9.5) {
          // Automatic alignment on the bench seat facing forward towards the park/pigeons
          playerGroup.position.x = pigeonsParkGroup.position.x + 0.8; // -44.2
          playerGroup.position.z = pigeonsParkGroup.position.z + parkBenchGroup.position.z; // -24.0
          playerGroup.position.y = 0.82; // Seated height on park bench
          playerGroup.rotation.y = 0; // Facing front towards pigeons (0 rad, NOT sideways)
          playerZTarget = pigeonsParkGroup.position.z + parkBenchGroup.position.z;
        }

        if (time - lastPigeonFeedTick > 3.0) {
          lastPigeonFeedTick = time;

          playPigeonFeedingSFX(settingsRef.current.enableSound !== false);

          createExplosion(pigeonsParkGroup.position.x, 0.2, -14.0);

          // Dispatch event to decrease anxiety by 20%
          window.dispatchEvent(new CustomEvent('pigeons-fed'));
        }
      } else {
        // Idle pigeons animation
        pigeonsRefList.forEach((pRef, idx) => {
          pRef.headGroup.rotation.x = Math.sin(time * 4.0 + idx) * 0.15;
          pRef.tailMesh.rotation.z = Math.cos(time * 3.0 + idx) * 0.1;
        });
      }

      // --- RODA DE CONVERSA COM AMIGOS INTERACTION ---
      // Animate 4 friends around campfire gently nodding, swaying and waving
      circleFriendsList.forEach((cRef, idx) => {
        cRef.headGroup.rotation.y = Math.sin(time * 2.5 + idx * 1.5) * 0.2;
        cRef.headGroup.rotation.x = Math.sin(time * 3.0 + idx) * 0.08;
        cRef.armL.rotation.z = -0.2 + Math.sin(time * 3.5 + idx) * 0.15;
        cRef.armR.rotation.z = 0.2 + Math.cos(time * 3.5 + idx) * 0.15;
      });

      // Fire pit warmth flickering
      if (fireGlowLight) {
        fireGlowLight.intensity = 3.8 + Math.sin(time * 8.0) * 0.5 + (Math.random() - 0.5) * 0.2;
      }

      const isAtFriendsCircleSpot = isNearFriendsCircleZone && playerGroup.position.z < -8.0;

      if (isAtFriendsCircleSpot) {
        // Seated height on circle bench when deep in circle
        if (playerGroup.position.z < -10.0) {
          playerGroup.position.y = 0.82;
        }

        // Friends wave arms enthusiastically when player approaches
        circleFriendsList.forEach((cRef, idx) => {
          cRef.armL.rotation.z = -0.8 + Math.sin(time * 6.0 + idx) * 0.4;
          cRef.armR.rotation.z = 0.8 + Math.cos(time * 6.0 + idx) * 0.4;
        });

        if (time - lastFriendsCircleTick > 2.5) {
          lastFriendsCircleTick = time;

          playCollectWellnessSFX(settingsRef.current.enableSound !== false);

          createExplosion(friendsCircleGroup.position.x, 1.2, -22.0);

          // Dispatch event to decrease anxiety by 25% and boost social connection
          window.dispatchEvent(new CustomEvent('friends-circle-used'));
        }
      }

      // --- AUTONOMOUS NPCS UPDATE & STREET BENCHES INTERACTION ---
      // Update AI state machine for all 10 autonomous NPCs (walking, pausing, sitting, greeting, standing)
      autonomousNpcsList.forEach((npc) => {
        if (npc.state === 'WALKING') {
          npc.x += npc.facingDir * npc.walkSpeed * delta;
          npc.walkPhase += npc.walkSpeed * delta * 3.6;

          npc.npcGroup.position.set(npc.x, Math.abs(Math.sin(npc.walkPhase * 2.0)) * 0.06, npc.z);
          npc.npcGroup.rotation.y = npc.facingDir > 0 ? Math.PI / 2 : -Math.PI / 2;

          npc.legLGroup.rotation.x = Math.sin(npc.walkPhase) * 0.45;
          npc.legRGroup.rotation.x = -Math.sin(npc.walkPhase) * 0.45;
          npc.calfLGroup.rotation.x = Math.max(0, -Math.sin(npc.walkPhase) * 0.35);
          npc.calfRGroup.rotation.x = Math.max(0, Math.sin(npc.walkPhase) * 0.35);
          npc.armL.rotation.x = -Math.sin(npc.walkPhase) * 0.45;
          npc.armR.rotation.x = Math.sin(npc.walkPhase) * 0.45;

          // Check if NPC decides to sit on a nearby bench
          if (npc.assignedBenchIdx === null) {
            for (let bIdx = 0; bIdx < streetBenchesList.length; bIdx++) {
              const b = streetBenchesList[bIdx];
              const dXToBench = Math.abs(npc.x - b.benchX);
              if (dXToBench < 2.2) {
                let freeSide: -1.45 | 1.45 | null = null;
                if (b.seatedNpcLeft === null) freeSide = -1.45;
                else if (b.seatedNpcRight === null) freeSide = 1.45;

                if (freeSide !== null && Math.random() < 0.35 * delta * 60) {
                  npc.assignedBenchIdx = bIdx;
                  npc.assignedSeatSide = freeSide;
                  if (freeSide === -1.45) b.seatedNpcLeft = npc;
                  else b.seatedNpcRight = npc;

                  npc.targetX = b.benchX + freeSide;
                  npc.targetZ = b.benchZ;
                  npc.state = 'WALKING_TO_BENCH';
                  break;
                }
              }
            }
          }

          // Boundary turnaround
          if ((npc.x > 240 && npc.facingDir === 1) || (npc.x < -240 && npc.facingDir === -1)) {
            npc.facingDir = (npc.facingDir * -1) as 1 | -1;
            npc.targetX = npc.x + npc.facingDir * 100;
          }

          // Random pause
          if (Math.random() < 0.0018) {
            npc.state = 'PAUSED';
            npc.pausedTimer = 0;
            npc.pausedDuration = 2.0 + Math.random() * 3.5;
          }
        } else if (npc.state === 'PAUSED') {
          npc.pausedTimer += delta;
          npc.legLGroup.rotation.x += (0 - npc.legLGroup.rotation.x) * delta * 6.0;
          npc.legRGroup.rotation.x += (0 - npc.legRGroup.rotation.x) * delta * 6.0;
          npc.calfLGroup.rotation.x += (0 - npc.calfLGroup.rotation.x) * delta * 6.0;
          npc.calfRGroup.rotation.x += (0 - npc.calfRGroup.rotation.x) * delta * 6.0;

          npc.headGroup.rotation.y = Math.sin(npc.pausedTimer * 2.5) * 0.35;
          if (npc.pausedTimer >= npc.pausedDuration) {
            npc.headGroup.rotation.y = 0;
            npc.state = 'WALKING';
          }
        } else if (npc.state === 'WALKING_TO_BENCH') {
          const dX = npc.targetX - npc.x;
          const dZ = npc.targetZ - npc.z;
          const dist = Math.hypot(dX, dZ);

          if (dist > 0.35) {
            const moveDirX = dX / dist;
            const moveDirZ = dZ / dist;
            npc.x += moveDirX * npc.walkSpeed * delta;
            npc.z += moveDirZ * npc.walkSpeed * delta;
            npc.walkPhase += npc.walkSpeed * delta * 3.6;

            npc.npcGroup.position.set(npc.x, Math.abs(Math.sin(npc.walkPhase * 2.0)) * 0.06, npc.z);
            npc.npcGroup.rotation.y = Math.atan2(moveDirX, moveDirZ);

            npc.legLGroup.rotation.x = Math.sin(npc.walkPhase) * 0.45;
            npc.legRGroup.rotation.x = -Math.sin(npc.walkPhase) * 0.45;
            npc.calfLGroup.rotation.x = Math.max(0, -Math.sin(npc.walkPhase) * 0.35);
            npc.calfRGroup.rotation.x = Math.max(0, Math.sin(npc.walkPhase) * 0.35);
          } else {
            npc.state = 'SITTING_DOWN';
            npc.sitProgress = 0;
          }
        } else if (npc.state === 'SITTING_DOWN') {
          npc.sitProgress += delta * 1.6;
          const p = Math.min(1.0, npc.sitProgress);
          const smoothP = p * p * (3 - 2 * p);

          npc.npcGroup.position.y = THREE.MathUtils.lerp(0.0, 0.82, smoothP);
          npc.npcGroup.position.z = THREE.MathUtils.lerp(npc.z, -4.5, smoothP);
          npc.npcGroup.position.x = THREE.MathUtils.lerp(npc.x, npc.targetX, smoothP);
          npc.npcGroup.rotation.y = THREE.MathUtils.lerp(npc.npcGroup.rotation.y, 0, smoothP);

          npc.legLGroup.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2 + 0.1, smoothP);
          npc.legRGroup.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2 + 0.1, smoothP);
          npc.calfLGroup.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2, smoothP);
          npc.calfRGroup.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2, smoothP);

          if (p >= 1.0) {
            npc.state = 'SEATED';
            npc.seatedTimer = 0;
            npc.seatedDuration = 12 + Math.random() * 20;
          }
        } else if (npc.state === 'SEATED') {
          npc.seatedTimer += delta;
          npc.npcGroup.position.y = 0.82 + Math.sin(time * 2.0 + npc.id) * 0.015;

          const dXPlayer = Math.abs(playerGroup.position.x - npc.npcGroup.position.x);
          if (dXPlayer < 5.2 && playerGroup.position.z < -1.0) {
            const lookDir = playerGroup.position.x > npc.npcGroup.position.x ? 0.45 : -0.45;
            npc.headGroup.rotation.y += (lookDir - npc.headGroup.rotation.y) * delta * 6.0;
            npc.armR.rotation.x = -0.6 + Math.sin(time * 6.0) * 0.35;
            npc.armR.rotation.z = 0.22;
          } else {
            npc.headGroup.rotation.y = Math.sin(time * 1.2 + npc.id) * 0.22;
            npc.armR.rotation.x += (0 - npc.armR.rotation.x) * delta * 4.0;
            npc.armR.rotation.z += (0 - npc.armR.rotation.z) * delta * 4.0;
          }

          if (npc.seatedTimer >= npc.seatedDuration) {
            npc.state = 'STANDING_UP';
          }
        } else if (npc.state === 'STANDING_UP') {
          npc.sitProgress -= delta * 1.6;
          const p = Math.max(0.0, npc.sitProgress);
          const smoothP = p * p * (3 - 2 * p);

          npc.npcGroup.position.y = THREE.MathUtils.lerp(0.0, 0.82, smoothP);
          npc.npcGroup.position.z = THREE.MathUtils.lerp(-2.5, -4.5, smoothP);

          npc.legLGroup.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2 + 0.1, smoothP);
          npc.legRGroup.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2 + 0.1, smoothP);
          npc.calfLGroup.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2, smoothP);
          npc.calfRGroup.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2, smoothP);

          if (p <= 0.0) {
            if (npc.assignedBenchIdx !== null) {
              const b = streetBenchesList[npc.assignedBenchIdx];
              if (b.seatedNpcLeft === npc) b.seatedNpcLeft = null;
              if (b.seatedNpcRight === npc) b.seatedNpcRight = null;
              npc.assignedBenchIdx = null;
            }
            npc.z = -2.5;
            npc.facingDir = Math.random() > 0.5 ? 1 : -1;
            npc.targetX = npc.npcGroup.position.x + npc.facingDir * (50 + Math.random() * 80);
            npc.state = 'WALKING';
          }
        }
      });

      // Update seat halos for empty spots on benches
      streetBenchesList.forEach((bench) => {
        const pulse = 0.75 + Math.sin(time * 4.5 + bench.benchX) * 0.25;

        // Left seat halo
        if (bench.haloLeftRing && bench.haloLeftGlow) {
          const isOccupied = bench.seatedNpcLeft !== null;
          (bench.haloLeftRing.material as THREE.MeshBasicMaterial).opacity = isOccupied ? 0 : pulse * 0.8;
          (bench.haloLeftGlow.material as THREE.MeshBasicMaterial).opacity = isOccupied ? 0 : pulse * 0.25;
          bench.haloLeftRing.rotation.z = time * 1.6;
        }

        // Right seat halo
        if (bench.haloRightRing && bench.haloRightGlow) {
          const isOccupied = bench.seatedNpcRight !== null;
          (bench.haloRightRing.material as THREE.MeshBasicMaterial).opacity = isOccupied ? 0 : pulse * 0.8;
          (bench.haloRightGlow.material as THREE.MeshBasicMaterial).opacity = isOccupied ? 0 : pulse * 0.25;
          bench.haloRightRing.rotation.z = time * 1.6;
        }
      });

      // Check player interaction for sitting down on a bench
      let isAtStreetBenchSpot = false;

      if (nearestStreetBench) {
        // Pick best available seat side (prefer empty seat)
        let targetSeatOffsetX = 1.45;
        let companionName = 'um amigo da praça';

        if (nearestStreetBench.seatedNpcLeft !== null && nearestStreetBench.seatedNpcRight === null) {
          targetSeatOffsetX = 1.45;
          companionName = nearestStreetBench.seatedNpcLeft.npcName;
        } else if (nearestStreetBench.seatedNpcRight !== null && nearestStreetBench.seatedNpcLeft === null) {
          targetSeatOffsetX = -1.45;
          companionName = nearestStreetBench.seatedNpcRight.npcName;
        } else if (nearestStreetBench.seatedNpcLeft !== null) {
          companionName = nearestStreetBench.seatedNpcLeft.npcName;
        }

        const dXToSeat = Math.abs(playerGroup.position.x - (nearestStreetBench.benchX + targetSeatOffsetX));
        const isApproachingSeatDepth = playerGroup.position.z < -1.8 && dXToSeat < 2.4;
        const isCrouchingNearBench = crouchRequested && Math.abs(playerGroup.position.x - nearestStreetBench.benchX) < 3.2;

        if (isApproachingSeatDepth || isCrouchingNearBench) {
          isAtStreetBenchSpot = true;
          playerGroup.position.y = 0.82;
          playerGroup.position.z = nearestStreetBench.benchZ; // -4.5
          playerGroup.position.x = nearestStreetBench.benchX + targetSeatOffsetX;
          playerGroup.rotation.y = 0;

          if (time - nearestStreetBench.lastSatTime > 2.5) {
            nearestStreetBench.lastSatTime = time;
            playCollectWellnessSFX(settingsRef.current.enableSound !== false);
            createExplosion(nearestStreetBench.benchX + targetSeatOffsetX, 1.2, nearestStreetBench.benchZ);
            window.dispatchEvent(new CustomEvent('street-bench-sat', { detail: { companionName } }));
          }
        }
      }

      // --- CAMPO DE FUTEBOL DA PRAÇA - SIMULAÇÃO DA PARTIDA & AVATAR AUTÔNOMO ---
      // 1. Integrar Física da Bola de Futebol (Campo Proporcional 64x40)
      ballState.x += ballState.vx;
      ballState.z += ballState.vz;
      ballState.vx *= 0.965;
      ballState.vz *= 0.965;

      // Limites das Laterais e Linhas de Fundo
      if (Math.abs(ballState.z) > 19.2) {
        ballState.z = Math.sign(ballState.z) * 19.2;
        ballState.vz *= -0.5;
      }
      if (Math.abs(ballState.x) > 31.2) {
        if (Math.abs(ballState.z) > 5.0) {
          ballState.x = Math.sign(ballState.x) * 31.2;
          ballState.vx *= -0.5;
        }
      }

      pitchBallMesh.position.set(ballState.x, ballState.y, ballState.z);
      pitchBallMesh.rotation.x += ballState.vz * 0.25;
      pitchBallMesh.rotation.z -= ballState.vx * 0.25;

      // Cálculo de Atenuação Espacial de Áudio (Silêncio total fora do campo de futebol)
      const distPlayerToSoccer = Math.hypot(
        playerGroup.position.x - soccerFieldGroup.position.x,
        playerGroup.position.z - (-42.0)
      );
      // Volume = 1.0 dentro ou bem perto do campo (<12 un), atenua rapidamente até 16 un, e fica ZERO (>16 un)
      const soccerSpatialVolume = distPlayerToSoccer < 12.0
        ? 1.0
        : Math.max(0, 1.0 - (distPlayerToSoccer - 12.0) / 4.0);

      // Detecção de GOL! (Traves em X = ±32.0, largura Z = ±5.0)
      if (ballState.x <= -31.8 && Math.abs(ballState.z) <= 5.0) {
        playSoccerGoalSFX(settingsRef.current.enableSound !== false, soccerSpatialVolume);
        createExplosion(soccerFieldGroup.position.x - 31.8 * 0.9, 2.0, -42.0);
        window.dispatchEvent(new CustomEvent('soccer-goal-scored', { detail: { team: 'Time Azul ⚽' } }));
        ballState.x = 0; ballState.z = 0; ballState.vx = 0; ballState.vz = 0;
      } else if (ballState.x >= 31.8 && Math.abs(ballState.z) <= 5.0) {
        playSoccerGoalSFX(settingsRef.current.enableSound !== false, soccerSpatialVolume);
        createExplosion(soccerFieldGroup.position.x + 31.8 * 0.9, 2.0, -42.0);
        window.dispatchEvent(new CustomEvent('soccer-goal-scored', { detail: { team: 'Time Vermelho ⚽' } }));
        ballState.x = 0; ballState.z = 0; ballState.vx = 0; ballState.vz = 0;
      }

      // 2. IA Tática Avançada e Cinemática do Corpo dos Jogadores (Comportamento de IA e Movimentos Realistas)
      soccerPlayersList.forEach((pRef, idx) => {
        pRef.kickCooldown = Math.max(0, pRef.kickCooldown - delta);

        const prevPX = pRef.x;
        const prevPZ = pRef.z;

        const distToBall = Math.hypot(ballState.x - pRef.x, ballState.z - pRef.z);

        if (pRef.role === 'GK') {
          // --- GOALKEEPER INTEL & DIVE REFLEXES ---
          const isBallInPenaltyArea = Math.abs(ballState.x - pRef.baseX) < 11.0;
          const GK_speed = isBallInPenaltyArea ? 0.28 : 0.085;
          const targetZ = Math.max(-4.8, Math.min(4.8, ballState.z));

          pRef.z += (targetZ - pRef.z) * GK_speed;
          pRef.x = pRef.baseX;

          // Athletic Goalkeeper Dive (Goleiro se estica lateralmente se a bola vai no canto do gol)
          const isBallShotOnGoal = isBallInPenaltyArea && Math.abs(ballState.vx) > 0.05;
          const distToBallZ = Math.abs(ballState.z - pRef.z);
          if (isBallShotOnGoal && distToBallZ > 0.6) {
            const diveAngle = (ballState.z > pRef.z ? 1 : -1) * 0.72; // Tilt body sideways to make a majestic dive
            pRef.group.rotation.z += (diveAngle - pRef.group.rotation.z) * 0.22;
          } else {
            pRef.group.rotation.z += (0 - pRef.group.rotation.z) * 0.15;
          }

          // Goalkeeper Clear Ball
          if (distToBall < 1.9 && pRef.kickCooldown <= 0) {
            pRef.kickCooldown = 0.8;
            playSoccerKickSFX(settingsRef.current.enableSound !== false, soccerSpatialVolume * 0.7);

            const clearTargetX = pRef.team === 'RED' ? 32.0 : -32.0;
            const clearTargetZ = (Math.random() - 0.5) * 16.0;
            const clearDirX = clearTargetX - ballState.x;
            const clearDirZ = clearTargetZ - ballState.z;
            const len = Math.hypot(clearDirX, clearDirZ) || 1;

            const clearPower = 1.05 + Math.random() * 0.35;
            ballState.vx = (clearDirX / len) * clearPower;
            ballState.vz = (clearDirZ / len) * clearPower;
            createExplosion(pRef.x, 0.8, pRef.z);
          }
        } else {
          // --- OUTFIELD PLAYER INTEL & TACTICAL AI ---
          // 1. Cooperative Roles (Decide who pursues the ball)
          let isClosestTeammateToBall = true;
          soccerPlayersList.forEach((other) => {
            if (other.team === pRef.team && other !== pRef && other.role !== 'GK') {
              const otherDist = Math.hypot(ballState.x - other.x, ballState.z - other.z);
              if (otherDist < distToBall) {
                isClosestTeammateToBall = false;
              }
            }
          });

          // 2. Movement State Machine
          const isBallChasable = distToBall < 26.0;
          if (isClosestTeammateToBall && isBallChasable) {
            // Pursuit with ball trajectory prediction
            const predictTime = Math.min(2.0, distToBall * 0.08);
            const predX = ballState.x + ballState.vx * predictTime * 14.0;
            const predZ = ballState.z + ballState.vz * predictTime * 14.0;

            const pursuitX = Math.max(-31.0, Math.min(31.0, predX));
            const pursuitZ = Math.max(-19.0, Math.min(19.0, predZ));

            const pursuitDirX = pursuitX - pRef.x;
            const pursuitDirZ = pursuitZ - pRef.z;
            const pursuitLen = Math.hypot(pursuitDirX, pursuitDirZ) || 1;

            pRef.x += (pursuitDirX / pursuitLen) * delta * 8.8;
            pRef.z += (pursuitDirZ / pursuitLen) * delta * 8.8;
          } else {
            // Supporting Play / Guard Base Position
            let targetX = pRef.baseX;
            let targetZ = pRef.baseZ;

            if (pRef.role === 'ATT') {
              // Attackers float forward and align with ball's attack line
              targetX = pRef.baseX + (ballState.x * 0.4) + (pRef.team === 'RED' ? 3.0 : -3.0);
              targetZ = pRef.baseZ + (ballState.z * 0.35);
            } else {
              // Defenders stay deep to safeguard goals and intercept
              targetX = pRef.baseX + (ballState.x * 0.22);
              targetZ = pRef.baseZ + (ballState.z * 0.22);
            }

            pRef.x += (targetX - pRef.x) * 0.06;
            pRef.z += (targetZ - pRef.z) * 0.06;
          }

          // 3. Tiki-Taka Kicking, Passing & Shooting Brain
          if (distToBall < 1.8 && pRef.kickCooldown <= 0) {
            pRef.kickCooldown = 0.85;

            // Shooting Range check: RED shoots if X > 11.0, BLUE shoots if X < -11.0
            const inShootingRange = pRef.team === 'RED' ? (ballState.x > 11.0) : (ballState.x < -11.0);

            if (inShootingRange) {
              // --- SHOT ON GOAL ---
              playSoccerKickSFX(settingsRef.current.enableSound !== false, soccerSpatialVolume * 0.7);

              const opponentGoalX = pRef.team === 'RED' ? 32.0 : -32.0;
              const opponentGoalZ = (Math.random() - 0.5) * 6.5; // aim at corners!

              const shotDirX = opponentGoalX - ballState.x;
              const shotDirZ = opponentGoalZ - ballState.z;
              const len = Math.hypot(shotDirX, shotDirZ) || 1;

              const shotPower = 0.88 + Math.random() * 0.4;
              ballState.vx = (shotDirX / len) * shotPower;
              ballState.vz = (shotDirZ / len) * shotPower;
              createExplosion(pRef.x, 0.8, pRef.z);
            } else {
              // --- COOPERATIVE TIKI-TAKA PASS ---
              let bestTeammate: SoccerPlayerRef | null = null;
              let bestTeammateScore = -9999.0;

              soccerPlayersList.forEach((other) => {
                if (other.team === pRef.team && other !== pRef && other.role !== 'GK') {
                  const isFurtherForward = pRef.team === 'RED' ? (other.x > pRef.x) : (other.x < pRef.x);
                  let score = (isFurtherForward ? 25.0 : 0.0) - Math.hypot(other.x - pRef.x, other.z - pRef.z) * 0.15;
                  if (score > bestTeammateScore) {
                    bestTeammateScore = score;
                    bestTeammate = other;
                  }
                }
              });

              if (bestTeammate) {
                // Kick pass towards teammate
                playSoccerKickSFX(settingsRef.current.enableSound !== false, soccerSpatialVolume * 0.6);

                const passDirX = (bestTeammate as SoccerPlayerRef).x - ballState.x;
                const passDirZ = (bestTeammate as SoccerPlayerRef).z - ballState.z;
                const len = Math.hypot(passDirX, passDirZ) || 1;

                const passPower = 0.58 + Math.random() * 0.22; // smooth cooperative pass
                ballState.vx = (passDirX / len) * passPower;
                ballState.vz = (passDirZ / len) * passPower;
                createExplosion(pRef.x, 0.8, pRef.z);
              } else {
                // Clearance/Forward dribble
                playSoccerKickSFX(settingsRef.current.enableSound !== false, soccerSpatialVolume * 0.6);
                const forwardX = pRef.team === 'RED' ? 1.0 : -1.0;
                ballState.vx = forwardX * 0.65;
                ballState.vz = (Math.random() - 0.5) * 0.28;
                createExplosion(pRef.x, 0.8, pRef.z);
              }
            }
          }
        }

        pRef.group.position.set(pRef.x, 0, pRef.z);

        // Movimento do Corpo e Articulações idêntico ao do Avatar Principal
        const stepVX = pRef.x - prevPX;
        const stepVZ = pRef.z - prevPZ;
        const moveSpeed = Math.hypot(stepVX, stepVZ);

        if (moveSpeed > 0.01) {
          const targetAngle = Math.atan2(stepVX, stepVZ);
          pRef.facingAngle += (targetAngle - pRef.facingAngle) * 0.2;
          pRef.group.rotation.y = pRef.facingAngle;

          // Animação de Corrida / Passo com Flexão dos Joelhos e Balanço dos Braços
          const runCycle = time * 14.0 + idx * 1.5;
          const runSwing = Math.sin(runCycle) * 0.85;

          pRef.leftLegGroup.rotation.x = runSwing;
          pRef.rightLegGroup.rotation.x = -runSwing;
          pRef.leftLowerLegGroup.rotation.x = runSwing > 0 ? -0.4 : 0;
          pRef.rightLowerLegGroup.rotation.x = runSwing < 0 ? -0.4 : 0;

          pRef.leftArmGroup.rotation.set(-runSwing * 0.6, 0, 0.12);
          pRef.rightArmGroup.rotation.set(runSwing * 0.6, 0, -0.12);

          // Oscilação do Torso e Cabeça no eixo Y durante a corrida
          const bobY = Math.abs(Math.sin(runCycle)) * 0.08;
          pRef.torsoGroup.position.y = bobY;
          pRef.headGroup.position.y = 3.65 + bobY;
        } else {
          // Postura Neutra em Repouso
          pRef.leftLegGroup.rotation.set(0, 0, 0);
          pRef.rightLegGroup.rotation.set(0, 0, 0);
          pRef.leftLowerLegGroup.rotation.set(0, 0, 0);
          pRef.rightLowerLegGroup.rotation.set(0, 0, 0);
          pRef.leftArmGroup.rotation.set(0, 0, 0.1);
          pRef.rightArmGroup.rotation.set(0, 0, -0.1);
          pRef.torsoGroup.position.y = 0;
          pRef.headGroup.position.y = 3.65;
        }
      });

      // 3. Entrada e Jogo Autônomo do Avatar no Campo de Futebol
      const isAtSoccerFieldSpot = isNearSoccerZone && playerGroup.position.z < -18.0;

      if (isAtSoccerFieldSpot) {
        const localBallWorldX = soccerFieldGroup.position.x + ballState.x * 0.9;
        const localBallWorldZ = -42.0 + ballState.z * 0.9;

        // AUTO-INÍCIO AUTOMÁTICO DA PARTIDA COM BOLA ROLANDO AO ENTRAR NO CAMPO DE FUTEBOL
        const isBallStopped = Math.hypot(ballState.vx, ballState.vz) < 0.15;
        if (!wasAtSoccerFieldLastFrame || isBallStopped) {
          const rollDir = (Math.random() > 0.5 ? 1 : -1);
          ballState.vx = rollDir * (0.85 + Math.random() * 0.45);
          ballState.vz = (Math.random() - 0.5) * 0.6;
          playSoccerKickSFX(settingsRef.current.enableSound !== false, soccerSpatialVolume * 0.9);
          createExplosion(soccerFieldGroup.position.x + ballState.x * 0.9, 0.8, -42.0 + ballState.z * 0.9);

          if (!wasAtSoccerFieldLastFrame) {
            window.dispatchEvent(new CustomEvent('soccer-match-auto-started'));
          }
        }

        // Gentle autonomous assist towards ball ONLY when the player is not actively steering
        if (!isUserControlling) {
          playerPosRef.current += (localBallWorldX - playerPosRef.current) * 0.05;
          playerZTarget += (localBallWorldZ - playerZTarget) * 0.05;
        }

        const avatarDistToBall = Math.hypot(localBallWorldX - playerGroup.position.x, localBallWorldZ - playerGroup.position.z);

        if (avatarDistToBall < 2.0 && soccerAnimTimer <= 0) {
          // Trigger 3 embaixadinhas followed by a powerful kick away
          soccerAnimTimer = 3.6;
          soccerAudioKickIndex = -1;
          playSoccerKickSFX(settingsRef.current.enableSound !== false, 0.5);
          const targetGoalX = playerGroup.position.x > soccerFieldGroup.position.x ? -32.0 : 32.0;
          ballState.vx = (targetGoalX - ballState.x) * 0.08;
          ballState.vz = (Math.random() - 0.5) * 0.45;
          createExplosion(playerGroup.position.x, 0.8, playerGroup.position.z);
        }

        if (time - lastPigeonFeedTick > 2.5) {
          lastPigeonFeedTick = time;
          window.dispatchEvent(new CustomEvent('soccer-match-joined'));
        }
      }
      wasAtSoccerFieldLastFrame = isAtSoccerFieldSpot;

      // --- VERIFICAÇÃO DE GINÁSTICA / ACADEMIA AO AR LIVRE ---
      if (gameState === 'PLAYING' || gameState === 'MODO_ZEN') {
        const pIntentX = playerPosRef.current;
        const pullupX = gymAcademyX - 12;
        const parallelX = gymAcademyX;
        const ringsX = gymAcademyX + 12;

        const distPullup = Math.abs(pIntentX - pullupX);
        const distParallel = Math.abs(pIntentX - parallelX);
        const distRings = Math.abs(pIntentX - ringsX);

        // O treino na academia só é ativado quando o avatar navega em profundidade até a área do equipamento (Z < -16.0)
        const isAtGymEquipmentDepth = isNearGymZone && playerGroup.position.z < -16.0;

        if (isAtGymEquipmentDepth && distPullup < 2.5 && playerJumpY < 1.0) {
          isGymnasticsActive = true;
          gymnasticsType = 'pullup';
          playerGroup.position.x = pullupX;
          
          if (time - lastGymnasticsTick > 0.5) {
            lastGymnasticsTick = time;
            onItemCollect('Exercício Físico');
            createExplosion(pullupX, playerGroup.position.y + 2.5, playerGroup.position.z);
          }
        } else if (isAtGymEquipmentDepth && distParallel < 2.5 && playerJumpY < 1.0) {
          isGymnasticsActive = true;
          gymnasticsType = 'parallel';
          playerGroup.position.x = parallelX;

          if (time - lastGymnasticsTick > 0.5) {
            lastGymnasticsTick = time;
            onItemCollect('Exercício Físico');
            createExplosion(parallelX, playerGroup.position.y + 2.5, playerGroup.position.z);
          }
        } else if (isAtGymEquipmentDepth && distRings < 2.5 && playerJumpY < 1.0) {
          isGymnasticsActive = true;
          gymnasticsType = 'rings';
          playerGroup.position.x = ringsX;

          if (time - lastGymnasticsTick > 0.5) {
            lastGymnasticsTick = time;
            onItemCollect('Exercício Físico');
            createExplosion(ringsX, playerGroup.position.y + 2.5, playerGroup.position.z);
          }
        } else {
          isGymnasticsActive = false;
          gymnasticsType = '';
        }
      } else {
        isGymnasticsActive = false;
        gymnasticsType = '';
      }

      // --- VERIFICAÇÃO DE ATIVIDADE ESPECIAL (PESCARIA, POMBOS, ANIMAIS, ACADEMIA, BANCO DE PRAÇA, RODA DE CONVERSA OU FUTEBOL) ---
      // Quando o avatar se desloca para uma dessas áreas, todas as animações/props/veículos ficam suspensos até sair
      const isSpecialActivityActive = isInsideSpecialZoneX && (playerGroup.position.z < -3.0 || isAtFishingSpot || isAtHorsesSpot || isAtPigeonsBenchSpot || isAtFriendsCircleSpot || isAtStreetBenchSpot || isAtSoccerFieldSpot || isGymnasticsActive);


      // Screen Shake (Tela Trêmula) based on Anxiety Level
      const shakeFactor = Math.max(0, (currentAnxiety - 25) / 75);
      const shakeX = shakeFactor > 0 ? (Math.random() - 0.5) * 0.85 * shakeFactor : 0;
      const shakeY = shakeFactor > 0 ? (Math.random() - 0.5) * 0.85 * shakeFactor : 0;

      // --- ZERO-LAG DIRECT CAMERA TRACKING & SETTINGS APPLICATION ---
      const targetCamX = playerGroup.position.x;

      // Toggle house exterior visibility based on whether the player is inside/near the resting spot
      const isPlayerInsideHouse = isNearHouseZone && playerGroup.position.z <= -21.5;
      houseExteriorList.forEach((part) => {
        part.visible = !isPlayerInsideHouse;
      });

      // Smooth camera zoom on the soccer field and house interior
      const isPlayerPlayingSoccer = isAtSoccerFieldSpot;
      soccerCameraZoom += ((isPlayerPlayingSoccer ? 1.0 : 0.0) - soccerCameraZoom) * 0.075;
      houseCameraZoom += ((isPlayerInsideHouse ? 1.0 : 0.0) - houseCameraZoom) * 0.075;

      // Mode 3D vs Mode 2D view with Z axis camera offset
      if (settingsRef.current.mode3D !== false) {
        let camY = THREE.MathUtils.lerp(14.4, 10.0, soccerCameraZoom);
        let camZ = THREE.MathUtils.lerp(22 + playerGroup.position.z, 14.5 + playerGroup.position.z, soccerCameraZoom);
        let lookY = THREE.MathUtils.lerp(9.4, 2.0, soccerCameraZoom);
        let lookZ = THREE.MathUtils.lerp(playerGroup.position.z * 0.8, -42.0, soccerCameraZoom);

        // Apply house zoom (camera enters the house and views from inside with walls surrounding)
        camY = THREE.MathUtils.lerp(camY, 3.2, houseCameraZoom);
        camZ = THREE.MathUtils.lerp(camZ, 3.8 + playerGroup.position.z, houseCameraZoom);
        lookY = THREE.MathUtils.lerp(lookY, 2.2, houseCameraZoom);
        lookZ = THREE.MathUtils.lerp(lookZ, playerGroup.position.z - 1.5, houseCameraZoom);

        camera.position.set(targetCamX + shakeX, camY + shakeY, camZ);
        camera.lookAt(targetCamX + shakeX, lookY, lookZ);
      } else {
        let camY = THREE.MathUtils.lerp(8.0, 5.5, soccerCameraZoom);
        let camZ = THREE.MathUtils.lerp(28 + playerGroup.position.z, 17.0 + playerGroup.position.z, soccerCameraZoom);
        let lookY = THREE.MathUtils.lerp(8.0, 1.8, soccerCameraZoom);
        let lookZ = THREE.MathUtils.lerp(playerGroup.position.z * 0.8, -42.0, soccerCameraZoom);

        // Apply house zoom (camera enters the house and views from inside with walls surrounding)
        camY = THREE.MathUtils.lerp(camY, 2.8, houseCameraZoom);
        camZ = THREE.MathUtils.lerp(camZ, 4.0 + playerGroup.position.z, houseCameraZoom);
        lookY = THREE.MathUtils.lerp(lookY, 1.8, houseCameraZoom);
        lookZ = THREE.MathUtils.lerp(lookZ, playerGroup.position.z - 1.0, houseCameraZoom);

        camera.position.set(targetCamX + shakeX, camY + shakeY, camZ);
        camera.lookAt(targetCamX + shakeX, lookY, lookZ);
      }

      // Camera FOV
      const targetFOV = settingsRef.current.cameraFOV || 65;
      if (Math.abs(camera.fov - targetFOV) > 0.5) {
        camera.fov = targetFOV;
        camera.updateProjectionMatrix();
      }

      // Realistic Internet Clouds Visibility and Motion Sync
      if (internetCloudsGroup) {
        internetCloudsGroup.visible = settingsRef.current.enableInternetClouds !== false;
        internetCloudsGroup.position.y = 19.5 + Math.sin(time * 0.8) * 0.4;
      }

      // Horizon Scenery Visibility Sync
      if (horizonSceneryGroup) {
        horizonSceneryGroup.visible = settingsRef.current.hideHorizonScenery !== true;
      }

      // Hide horizon trees that overlap with the active soccer field, and clear bike rack area
      if (soccerFieldGroup) {
        const soccerX = soccerFieldGroup.position.x;
        const bikeRackX = bikeRackStation ? bikeRackStation.group.position.x : 66.0;
        dynamicSceneryItems.forEach((item) => {
          const distToSoccer = Math.abs(item.initialX - soccerX);
          const distToRack = Math.abs(item.initialX - bikeRackX);
          // If the tree falls within the soccer field boundaries (horizon only) or bike rack
          if ((item.isHorizon && distToSoccer < 31.5) || distToRack < 4.8) {
            item.group.visible = false;
          } else {
            // Restore normal visibility based on settings
            if (item.isHorizon) {
              item.group.visible = settingsRef.current.hideHorizonScenery !== true;
            } else {
              item.group.visible = true; // Sidewalk trees are always visible and never cut by the deep soccer field
            }
          }
        });
      }

      // Dynamic Shadows
      renderer.shadowMap.enabled = settingsRef.current.enableShadows !== false;
      dirLight.castShadow = settingsRef.current.enableShadows !== false;

      // Render Depth (Fog)
      const renderDepthSetting = settingsRef.current.renderDepth || 'media';
      const fogFar = renderDepthSetting === 'curta' ? 45 : renderDepthSetting === 'longa' ? 220 : 90;
      if (scene.fog && 'far' in scene.fog) {
        scene.fog.far = fogFar;
      }

      // Resolution scale
      const resScale = settingsRef.current.resolutionScale || 1.0;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, resScale * window.devicePixelRatio));

      // Dynamic Lights Tracking with Avatar
      cyanLight.position.set(targetCamX - 22, 15, 5);
      magentaLight.position.set(targetCamX + 22, 15, 5);
      dirLight.position.set(targetCamX + 15, 30, 20);
      dirLight.target.position.set(targetCamX, 0, 0);
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
        feedGrassGroup.visible = false;
        soccerJuggleGroup.visible = false;
        coffeeCupProp.visible = false;
        burgerProp.visible = false;
        bookProp.visible = false;
        stoolGroup.visible = false;
        guitarGroup.visible = false;
        friendHugGroup.visible = false;
        soundwaveMat.opacity = 0;
        zenPillarMat.opacity = 0;
        bicycleGroup.visible = false;
        skateGroup.visible = false;
        patineteGroup.visible = false;
        
        // Reset all limbs, torso, and head rotations to neutral defaults to maintain absolute symmetry after animation ends
        leftArmGroup.rotation.set(0, 0, 0);
        rightArmGroup.rotation.set(0, 0, 0);
        leftLowerArmGroup.rotation.set(0, 0, 0);
        rightLowerArmGroup.rotation.set(0, 0, 0);
        leftLegGroup.rotation.set(0, 0, 0);
        rightLegGroup.rotation.set(0, 0, 0);
        leftLowerLegGroup.rotation.set(0, 0, 0);
        rightLowerLegGroup.rotation.set(0, 0, 0);
        headGroup.rotation.set(0, 0, 0);
        torsoGroup.rotation.set(0, 0, 0);
        playerGroup.rotation.z = 0;
      };

      // --- POSES & ANIMATION STATES ---
      if (houseRestSequenceState !== 'IDLE') {
        // Handled entirely by the house rest sequence to keep the lying down sleeping pose active!
        hideAllProps();
      } else if (isGymnasticsActive) {
        hideAllProps();
        
        // Ensure player is facing sideways (profile to the camera) and snapped to the gym equipment Z position (-22.0)
        const baseSide = playerGroup.rotation.y < 0 ? -Math.PI / 2 : Math.PI / 2;
        playerGroup.rotation.y = baseSide;
        playerGroup.position.z = -22.0;
        
        // Custom Calisthenics gymnastics poses with precise limb positioning and rhythms
        if (gymnasticsType === 'pullup') {
          // Snap player to the pull-up bar center (gymAcademyX - 12 since gym is scaled 1.5)
          playerGroup.position.x = gymAcademyX - 12;

          // Move avatar up and down on the pull-up bar smoothly
          const verticalOffset = 1.35 + Math.abs(Math.sin(time * 6.0)) * 0.75;
          playerGroup.position.y = finalBaseY + verticalOffset;

          // Arms raised overhead grabbing the bar
          leftArmGroup.rotation.set(-1.9, 0, 0.1);
          rightArmGroup.rotation.set(-1.9, 0, -0.1);
          leftLowerArmGroup.rotation.set(-0.35 - Math.sin(time * 6.0) * 0.4, 0, 0);
          rightLowerArmGroup.rotation.set(-0.35 - Math.sin(time * 6.0) * 0.4, 0, 0);

          // Legs bent back
          leftLegGroup.rotation.set(-0.65, 0.15, -0.1);
          rightLegGroup.rotation.set(-0.65, -0.15, 0.1);
          leftLowerLegGroup.rotation.set(-0.5, 0, 0);
          rightLowerLegGroup.rotation.set(-0.5, 0, 0);
        } else if (gymnasticsType === 'parallel') {
          // Snap player to the parallel bars center (gymAcademyX)
          playerGroup.position.x = gymAcademyX;

          // Parallel dips animation
          const verticalOffset = 1.0 + Math.abs(Math.sin(time * 5.0)) * 0.4;
          playerGroup.position.y = finalBaseY + verticalOffset;

          // Arms pushing down on the parallel rails
          leftArmGroup.rotation.set(0.4, 0, -0.25);
          rightArmGroup.rotation.set(0.4, 0, 0.25);
          leftLowerArmGroup.rotation.set(-1.38 + Math.sin(time * 5.0) * 0.4, 0.1, 0);
          rightLowerArmGroup.rotation.set(-1.38 + Math.sin(time * 5.0) * 0.4, -0.1, 0);

          // Legs tucked
          leftLegGroup.rotation.set(-0.4, 0, 0);
          rightLegGroup.rotation.set(-0.4, 0, 0);
          leftLowerLegGroup.rotation.set(-0.3, 0, 0);
          rightLowerLegGroup.rotation.set(-0.3, 0, 0);
        } else if (gymnasticsType === 'rings') {
          // Snap player to the rings center (gymAcademyX + 12 since gym is scaled 1.5)
          playerGroup.position.x = gymAcademyX + 12;

          // Hanging gymnastics rings exercise
          const verticalOffset = 1.25 + Math.abs(Math.sin(time * 4.5)) * 0.6;
          playerGroup.position.y = finalBaseY + verticalOffset;

          // Arms extended sideways holding onto the rings
          leftArmGroup.rotation.set(-1.2, 0, -0.45);
          rightArmGroup.rotation.set(-1.2, 0, 0.45);
          leftLowerArmGroup.rotation.set(-0.4 + Math.sin(time * 4.5) * 0.2, 0, 0);
          rightLowerArmGroup.rotation.set(-0.4 + Math.sin(time * 4.5) * 0.2, 0, 0);

          // Legs held straight / slightly forward
          leftLegGroup.rotation.set(0.3, 0.1, -0.05);
          rightLegGroup.rotation.set(0.3, -0.05, 0.05);
          leftLowerLegGroup.rotation.set(-0.1, 0, 0);
          rightLowerLegGroup.rotation.set(-0.1, 0, 0);
        }
      } else if (isSpecialActivityActive) {
        // Suspende totalmente animações e veículos durante Pescaria, Tratar Pombos, Tratar Animais e Campo de Futebol
        hideAllProps();

        if ((isAtPigeonsBenchSpot && playerGroup.position.z < -9.5) || isAtStreetBenchSpot) {
          playerGroup.position.y = 0.82; // Postura sentada no banco da praça
          playerGroup.rotation.y = 0; // Garantir alinhamento frontal automático (frente para a praça, NUNCA de lado)
          leftLegGroup.rotation.set(1.2, 0, 0);
          rightLegGroup.rotation.set(1.2, 0, 0);
          leftLowerLegGroup.rotation.set(-1.2, 0, 0);
          rightLowerLegGroup.rotation.set(-1.2, 0, 0);
          leftArmGroup.rotation.set(0.35, 0, 0.1);
          rightArmGroup.rotation.set(0.35, 0, -0.1);
        } else if (isAtFishingSpot) {
          fishingRodGroup.visible = true; // Vara de pesca visível no trapiche
          leftArmGroup.rotation.set(0.8, 0.2, -0.2);
          leftLowerArmGroup.rotation.set(-1.2, 0, 0);
          rightArmGroup.rotation.set(0.8, -0.2, 0.2);
          rightLowerArmGroup.rotation.set(-1.2, 0, 0);
        } else if (isAtHorsesSpot) {
          // Postura de alimentar os animais com pasto na mão dando na boca
          feedGrassGroup.visible = true; // Show grass/pasture in hand!
          // Extend right arm forward and up, towards the horse's mouth
          const feedCycle = Math.sin(time * 5.0) * 0.12;
          rightArmGroup.rotation.set(1.15 + feedCycle, -0.2, 0.1);
          rightLowerArmGroup.rotation.set(-0.5, 0, 0);
          leftArmGroup.rotation.set(0.2, 0, -0.15); // Left arm relaxed
          headGroup.rotation.set(0.1, -0.1, 0); // Head tilted slightly looking at the horse
        } else if (isMoving && gameState === 'PLAYING') {
          // Locomoção natural caminhando/correndo nas áreas de atividade
          const runSwing = Math.sin(time * 14) * 0.85;
          leftLegGroup.rotation.x = runSwing;
          rightLegGroup.rotation.x = -runSwing;
          leftLowerLegGroup.rotation.x = runSwing > 0 ? -0.4 : 0;
          rightLowerLegGroup.rotation.x = runSwing < 0 ? -0.4 : 0;
          const armSwing = Math.sin(time * 14) * 0.45;
          leftArmGroup.rotation.set(-armSwing, 0, 0.15);
          rightArmGroup.rotation.set(armSwing, 0, -0.15);
        } else {
          leftLegGroup.rotation.set(0, 0, 0);
          rightLegGroup.rotation.set(0, 0, 0);
          leftLowerLegGroup.rotation.set(0, 0, 0);
          rightLowerLegGroup.rotation.set(0, 0, 0);
          leftArmGroup.rotation.set(0, 0, 0.1);
          rightArmGroup.rotation.set(0, 0, -0.1);
        }
      } else if (guitarAnimTimer > 0) {
        // --- POSE: REALISTIC ACOUSTIC GUITAR PLAYING & STRUMMING WHILE WALKING (CONTINUAR CAMINHANDO COM VIOLÃO E TOCANDO) ---
        hideAllProps();
        guitarAnimTimer -= delta;
        guitarGroup.visible = true;

        // Classical guitar resting naturally across the torso and angled upwards towards left shoulder
        guitarGroup.position.set(0.18, 2.05, 0.68);
        guitarGroup.rotation.set(-0.25, 0.22, -0.62 + Math.sin(time * 4.0) * 0.03);

        // Musical tempos and fluid strumming / fingerpicking dynamics
        const strumSpeed = 16.0;
        const strumCycle = Math.sin(time * strumSpeed);
        const strumWrist = Math.cos(time * strumSpeed);
        const chordShift = Math.sin(time * 3.5);

        // RIGHT ARM: Arches over soundboard, sweeping up and down across the strings over the soundhole
        rightArmGroup.rotation.set(0.88, -0.2, 0.25);
        rightLowerArmGroup.rotation.set(-1.58, -0.45 + strumCycle * 0.24, 0.25 + strumWrist * 0.26);

        // LEFT ARM: Holds neck, fingers pressing frets and sliding across chord positions
        leftArmGroup.rotation.set(0.82 + chordShift * 0.05, 0.25, -0.42);
        leftLowerArmGroup.rotation.set(-1.38, 0.42, -0.15 + chordShift * 0.12);

        // HEAD: Expressive musical groove and rhythmic head nodding
        headGroup.rotation.set(
          0.12 + Math.sin(time * 8.0) * 0.1,
          Math.sin(time * 4.0) * 0.12,
          Math.cos(time * 4.0) * 0.05
        );

        // Torso subtle musical sway
        torsoGroup.rotation.z = Math.sin(time * 4.0) * 0.03;

        // LEGS: Continuous fluid walking / running while playing guitar!
        if (isMoving && gameState === 'PLAYING') {
          const runSwing = Math.sin(time * 14) * 0.85;
          leftLegGroup.rotation.x = runSwing;
          rightLegGroup.rotation.x = -runSwing;
          leftLowerLegGroup.rotation.x = runSwing > 0 ? -0.4 : 0;
          rightLowerLegGroup.rotation.x = runSwing < 0 ? -0.4 : 0;
          if (rawDeltaX > 0.001) playerGroup.rotation.y = Math.PI / 2;
          else if (rawDeltaX < -0.001) playerGroup.rotation.y = -Math.PI / 2;
        } else {
          leftLegGroup.rotation.set(0.1, 0.08, -0.1);
          rightLegGroup.rotation.set(0.1, -0.08, 0.1);
          leftLowerLegGroup.rotation.set(-0.15, 0, 0);
          rightLowerLegGroup.rotation.set(-0.15, 0, 0);
          if (Math.abs(playerGroup.rotation.y) < 0.1) playerGroup.rotation.y = Math.PI / 2;
        }

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
        playerGroup.position.y = finalBaseY + Math.abs(Math.sin(time * repSpeed)) * 0.12;

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
          if (rawDeltaX > 0.001) playerGroup.rotation.y = Math.PI / 2;
          else if (rawDeltaX < -0.001) playerGroup.rotation.y = -Math.PI / 2;
        } else {
          if (Math.abs(playerGroup.rotation.y) < 0.1) playerGroup.rotation.y = Math.PI / 2;
          // Solid athletic standing posture
          leftLegGroup.rotation.set(0.15, 0.1, -0.12);
          rightLegGroup.rotation.set(0.15, -0.1, 0.12);
          leftLowerLegGroup.rotation.set(-0.2, 0, 0);
          rightLowerLegGroup.rotation.set(-0.2, 0, 0);
        }
      } else if (soccerAnimTimer > 0) {
        // --- POSE: 3 EMBAIXADINHAS (JUGGLES) + POWERFUL KICK AWAY ---
        hideAllProps();
        soccerAnimTimer -= delta;
        soccerJuggleGroup.visible = true;

        const totalAnimTime = 3.6;
        const elapsedAnim = totalAnimTime - soccerAnimTimer;

        if (elapsedAnim < 2.7) {
          // --- PHASE 1: EXACTLY 3 EMBAIXADINHAS (0.0s to 2.7s - 0.9s per juggle) ---
          const juggleIndex = Math.min(2, Math.floor(elapsedAnim / 0.9));
          const juggleProgress = (elapsedAnim % 0.9) / 0.9;
          const ballBounceY = 0.42 + Math.sin(juggleProgress * Math.PI) * 1.45;
          soccerJuggleGroup.position.set(0.4, ballBounceY, 0.7);

          soccerBallMesh.rotation.x += delta * 15;
          soccerBallMesh.rotation.y += delta * 10;

          // Alternate kicking leg for rhythmic expressiveness
          if (juggleIndex % 2 === 0) {
            // Right leg juggle (1st and 3rd embaixadinha)
            rightLegGroup.rotation.x = -0.3 - Math.sin(juggleProgress * Math.PI) * 0.75;
            rightLowerLegGroup.rotation.x = 0.35 + Math.sin(juggleProgress * Math.PI) * 0.45;
            leftLegGroup.rotation.set(0.1, 0.05, -0.1);
            leftLowerLegGroup.rotation.set(-0.15, 0, 0);
          } else {
            // Left leg juggle (2nd embaixadinha)
            leftLegGroup.rotation.x = -0.3 - Math.sin(juggleProgress * Math.PI) * 0.75;
            leftLowerLegGroup.rotation.x = 0.35 + Math.sin(juggleProgress * Math.PI) * 0.45;
            rightLegGroup.rotation.set(0.1, -0.05, 0.1);
            rightLowerLegGroup.rotation.set(-0.15, 0, 0);
          }

          // Athletic arm balancing & head tracking
          leftArmGroup.rotation.set(0.25, 0, -0.65);
          leftLowerArmGroup.rotation.set(-0.35, 0, 0);
          rightArmGroup.rotation.set(0.25, 0, 0.65);
          rightLowerArmGroup.rotation.set(-0.35, 0, 0);
          headGroup.rotation.set(0.35, 0, 0);

          // Audio touch kick SFX on impact (near bottom of bounce) - GUARANTEED SINGLE TRIGGER PER JUGGLE
          if (soccerAudioKickIndex < juggleIndex && juggleProgress > 0.85) {
            soccerAudioKickIndex = juggleIndex;
            playSoccerKickSFX(settingsRef.current.enableSound !== false, 0.4);
            createExplosion(playerGroup.position.x + 0.4, 0.8, playerGroup.position.z + 0.7);
          }
        } else {
          // --- PHASE 2: POWERFUL KICK AWAY (2.7s to 3.6s) ---
          const tKick = (elapsedAnim - 2.7) / 0.9; // 0.0 to 1.0

          if (tKick < 0.25) {
            // Leg windup
            rightLegGroup.rotation.x = 0.65;
            rightLowerLegGroup.rotation.x = -0.45;
            torsoGroup.rotation.y = -0.25;
            soccerJuggleGroup.position.set(0.4, 0.40, 0.7);
          } else {
            // Forward Kick Snap & Launch
            const flightTime = tKick - 0.25;
            rightLegGroup.rotation.x = -1.35;
            rightLowerLegGroup.rotation.x = -0.15;
            torsoGroup.rotation.y = 0.35;

            // Ball shoots off into the distance
            soccerJuggleGroup.position.set(
              0.4 + flightTime * 18.0,
              0.40 + flightTime * 8.0 - flightTime * flightTime * 6.0,
              0.7 + flightTime * 35.0
            );

            // Kick impact moment trigger - GUARANTEED SINGLE TRIGGER
            if (soccerAudioKickIndex < 3 && tKick >= 0.25) {
              soccerAudioKickIndex = 3;
              playSoccerKickSFX(settingsRef.current.enableSound !== false, 0.7);
              createExplosion(playerGroup.position.x + 0.4, 1.0, playerGroup.position.z + 0.7);

              if (isAtSoccerFieldSpot) {
                const targetGoalX = playerGroup.position.x > soccerFieldGroup.position.x ? -32.0 : 32.0;
                ballState.vx = (targetGoalX - ballState.x) * 0.28;
                ballState.vz = (Math.random() - 0.5) * 1.2;
              }
            }
          }
        }

        if (isMoving && gameState === 'PLAYING') {
          if (rawDeltaX > 0.001) playerGroup.rotation.y = Math.PI / 2;
          else if (rawDeltaX < -0.001) playerGroup.rotation.y = -Math.PI / 2;
        } else if (Math.abs(playerGroup.rotation.y) < 0.1) {
          playerGroup.rotation.y = Math.PI / 2;
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
        playerGroup.position.y = finalBaseY + Math.sin(time * 3) * 0.04;

        // Legs posture
        if (isMoving && gameState === 'PLAYING') {
          const runSwing = Math.sin(time * 14) * 0.85;
          leftLegGroup.rotation.x = runSwing;
          rightLegGroup.rotation.x = -runSwing;
          leftLowerLegGroup.rotation.x = runSwing > 0 ? -0.4 : 0;
          rightLowerLegGroup.rotation.x = runSwing < 0 ? -0.4 : 0;
          if (rawDeltaX > 0.001) playerGroup.rotation.y = Math.PI / 2;
          else if (rawDeltaX < -0.001) playerGroup.rotation.y = -Math.PI / 2;
        } else {
          leftLegGroup.rotation.set(0, 0, 0);
          rightLegGroup.rotation.set(0, 0, 0);
          leftLowerLegGroup.rotation.set(0, 0, 0);
          rightLowerLegGroup.rotation.set(0, 0, 0);
        }
      } else if (burgerEatAnimTimer > 0) {
        // --- POSE: 3-SECOND HAMBURGER EATING & SATISFACTION (COMER HAMBÚRGUER CONTINUANDO A CAMINHADA) ---
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
        burgerProp.position.set(0, 3.45 + chewCycle * 0.03, 0.7);

        // Small happy bounce
        playerGroup.position.y = finalBaseY + Math.abs(Math.sin(time * 6)) * 0.08;

        if (isMoving && gameState === 'PLAYING') {
          const runSwing = Math.sin(time * 14) * 0.85;
          leftLegGroup.rotation.x = runSwing;
          rightLegGroup.rotation.x = -runSwing;
          leftLowerLegGroup.rotation.x = runSwing > 0 ? -0.4 : 0;
          rightLowerLegGroup.rotation.x = runSwing < 0 ? -0.4 : 0;
          if (rawDeltaX > 0.001) playerGroup.rotation.y = Math.PI / 2;
          else if (rawDeltaX < -0.001) playerGroup.rotation.y = -Math.PI / 2;
        } else {
          if (Math.abs(playerGroup.rotation.y) < 0.1) playerGroup.rotation.y = Math.PI / 2;
          leftLegGroup.rotation.set(0, 0, 0);
          rightLegGroup.rotation.set(0, 0, 0);
          leftLowerLegGroup.rotation.set(0, 0, 0);
          rightLowerLegGroup.rotation.set(0, 0, 0);
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
          if (rawDeltaX > 0.001) playerGroup.rotation.y = Math.PI / 2;
          else if (rawDeltaX < -0.001) playerGroup.rotation.y = -Math.PI / 2;
        } else {
          if (Math.abs(playerGroup.rotation.y) < 0.1) playerGroup.rotation.y = Math.PI / 2;
          leftLegGroup.rotation.set(0, 0, 0);
          rightLegGroup.rotation.set(0, 0, 0);
          leftLowerLegGroup.rotation.set(0, 0, 0);
          rightLowerLegGroup.rotation.set(0, 0, 0);
        }
      } else if (hugAnimTimer > 0) {
        // --- POSE: JOYFUL BODY SHAKE, CROSSED ARMS & HAPPY SWAYING ANIMATION (ENCONTRO PRESENCIAL) ---
        hideAllProps();
        hugAnimTimer -= delta;
        friendHugGroup.visible = true;

        const swayCycle = Math.sin(time * 7.0);
        const shake = Math.sin(time * 32.0) * 0.06; // High-frequency energetic body shake / chacoalhar
        const bounce = Math.abs(Math.sin(time * 10.0)) * 0.28; // Bouncy happy hop

        // 1. Player Body Shake, Sway & Hop (Keep position X synced with physics)
        playerGroup.position.y = finalBaseY + bounce;
        playerGroup.rotation.z = swayCycle * 0.24 + shake * 0.05;
        if (rawDeltaX > 0.001) {
          playerGroup.rotation.y = Math.PI / 2 + Math.sin(time * 4.5) * 0.15;
        } else if (rawDeltaX < -0.001) {
          playerGroup.rotation.y = -Math.PI / 2 + Math.sin(time * 4.5) * 0.15;
        } else {
          const baseSide = playerGroup.rotation.y < 0 ? -Math.PI / 2 : Math.PI / 2;
          playerGroup.rotation.y = baseSide + Math.sin(time * 4.5) * 0.15;
        }
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
        // --- POSE: FLUID PETTING THE DOG WHILE WALKING OR STANDING (CARINHO NO CACHORRINHO SEM TRAVAMENTO) ---
        hideAllProps();
        dogPetAnimTimer -= delta;
        dogProp.visible = true;

        const petCycle = Math.sin(time * 8.0); // Fluid hand movement petting dog head
        const tailWag = Math.sin(time * 24.0); // Happy wagging tail

        // Head looks down towards the dog comfortably
        headGroup.rotation.set(0.28, 0.12, 0);
        torsoGroup.rotation.set(0.08, 0, 0);

        // RIGHT ARM: Smoothly reaches out and pets dog head
        rightArmGroup.rotation.set(0.85 + petCycle * 0.14, -0.28, 0.16);
        rightLowerArmGroup.rotation.set(-1.12 - petCycle * 0.14, -0.15, 0);

        // LEGS & WALKING: Continuous fluid locomotion without locking avatar
        if (isMoving && gameState === 'PLAYING') {
          const runSwing = Math.sin(time * 14) * 0.85;
          leftLegGroup.rotation.x = runSwing;
          rightLegGroup.rotation.x = -runSwing;
          leftLowerLegGroup.rotation.x = runSwing > 0 ? -0.4 : 0;
          rightLowerLegGroup.rotation.x = runSwing < 0 ? -0.4 : 0;
          if (rawDeltaX > 0.001) playerGroup.rotation.y = Math.PI / 2;
          else if (rawDeltaX < -0.001) playerGroup.rotation.y = -Math.PI / 2;

          // Left arm swings naturally when walking
          const armSwing = Math.sin(time * 14) * 0.45;
          leftArmGroup.rotation.set(-armSwing, 0, 0.15);
          leftLowerArmGroup.rotation.set(armSwing > 0 ? -0.3 : 0, 0, 0);

          // Dog trots happily alongside the player!
          const dogStep = Math.sin(time * 18) * 0.35;
          dpFL.rotation.x = dogStep;
          dpFR.rotation.x = -dogStep;
          dpBL.rotation.x = -dogStep;
          dpBR.rotation.x = dogStep;
        } else {
          leftLegGroup.rotation.set(0, 0, 0);
          rightLegGroup.rotation.set(0, 0, 0);
          leftLowerLegGroup.rotation.set(0, 0, 0);
          rightLowerLegGroup.rotation.set(0, 0, 0);
          leftArmGroup.rotation.set(0.25, 0, 0.22);
          leftLowerArmGroup.rotation.set(-0.35, 0, 0);
          if (Math.abs(playerGroup.rotation.y) < 0.1) playerGroup.rotation.y = Math.PI / 2;

          dpFL.rotation.x = 0;
          dpFR.rotation.x = 0;
          dpBL.rotation.x = 0;
          dpBR.rotation.x = 0;
        }

        // Dog reactions:
        dpTail.rotation.y = tailWag * 0.6;
        dpHeadGroup.rotation.x = -0.18 + Math.abs(petCycle) * 0.14;
        dpHeadGroup.rotation.z = Math.sin(time * 4.0) * 0.08;
        dpEarL.rotation.z = -0.15 - Math.abs(petCycle) * 0.12;
        dpEarR.rotation.z = 0.15 + Math.abs(petCycle) * 0.12;
      } else if (isAtStreetBenchSpot) {
        // --- POSE: SEATED ON STREET BENCH CONVERSING WITH CITIZEN (-7% ANSIEDADE) ---
        hideAllProps();
        playerGroup.position.y = 0.74;
        playerGroup.rotation.y = 0; // Face front sidewalk

        // Seated legs 90 degrees forward over bench edge
        leftLegGroup.rotation.set(Math.PI / 2, 0.08, -0.05);
        leftLowerLegGroup.rotation.set(-Math.PI / 2, 0, 0);
        rightLegGroup.rotation.set(Math.PI / 2, -0.08, 0.05);
        rightLowerLegGroup.rotation.set(-Math.PI / 2, 0, 0);

        // Relaxed conversational arms resting on lap/thighs
        leftArmGroup.rotation.set(0.4 + Math.sin(time * 2.0) * 0.1, 0, -0.15);
        leftLowerArmGroup.rotation.set(-0.6, 0.2, 0);
        rightArmGroup.rotation.set(0.4 + Math.sin(time * 2.0 + 1.0) * 0.1, 0, 0.15);
        rightLowerArmGroup.rotation.set(-0.6, -0.2, 0);

        // Friendly head nod towards the companion
        headGroup.rotation.y = -0.3 + Math.sin(time * 2.5) * 0.15;
        headGroup.rotation.x = Math.sin(time * 3.0) * 0.08;
      } else if (isAtFriendsCircleSpot) {
        // --- POSE: SEATED AT CAMPFIRE CIRCLE WITH FRIENDS ---
        hideAllProps();
        playerGroup.position.y = 0.74;

        // Seated legs 90 degrees forward over bench edge
        leftLegGroup.rotation.set(Math.PI / 2, 0.08, -0.05);
        leftLowerLegGroup.rotation.set(-Math.PI / 2, 0, 0);
        rightLegGroup.rotation.set(Math.PI / 2, -0.08, 0.05);
        rightLowerLegGroup.rotation.set(-Math.PI / 2, 0, 0);

        // Relaxed warm posture enjoying campfire conversation
        leftArmGroup.rotation.set(0.6 + Math.sin(time * 2.5) * 0.1, 0.2, -0.2);
        leftLowerArmGroup.rotation.set(-0.7, 0.3, 0);
        rightArmGroup.rotation.set(0.6 + Math.sin(time * 2.5) * 0.1, -0.2, 0.2);
        rightLowerArmGroup.rotation.set(-0.7, -0.3, 0);

        headGroup.rotation.y = Math.sin(time * 2.0) * 0.25;
        headGroup.rotation.x = 0.1 + Math.sin(time * 3.0) * 0.06;
      } else if (gameState === 'MODO_ZEN' || gameState === 'VITORIA') {
        // --- POSE: MODO ZEN LOTUS POSE ---
        hideAllProps();

        playerGroup.position.y = finalBaseY + 0.5 + Math.sin(time * 2.5) * 0.15;
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
      } else {
        // --- BASE MOVEMENT, JUMPING, & VEHICLE POSES ---
        const activeVeh = isSpecialActivityActive ? 'none' : (playerSkillsRef.current?.activeVehicle || (playerSkillsRef.current?.bicycle ? 'bicycle' : 'none'));

        // Sync vehicle visibility
        bicycleGroup.visible = !isSpecialActivityActive && activeVeh === 'bicycle';
        skateGroup.visible = !isSpecialActivityActive && activeVeh === 'skate';
        patineteGroup.visible = !isSpecialActivityActive && activeVeh === 'patinete';

        // Orient avatar towards travel direction
        if (rawDeltaX > 0.001) {
          playerGroup.rotation.y = Math.PI / 2;
        } else if (rawDeltaX < -0.001) {
          playerGroup.rotation.y = -Math.PI / 2;
        }

        if (activeVeh === 'bicycle') {
          // ==========================================
          // 🚲 1. BICICLETA URBANA (PEDALING & CYCLING)
          // ==========================================
          playerGroup.position.y = finalBaseY;

          // Athletic aerodynamic cycling posture
          torsoGroup.rotation.set(0.24, 0, (rawDeltaX > 0.001 ? -0.05 : rawDeltaX < -0.001 ? 0.05 : 0));
          headGroup.rotation.set(-0.16, 0, 0);

          // Hands placed firmly on handlebars
          leftArmGroup.rotation.set(0.72, -0.16, -0.22);
          leftLowerArmGroup.rotation.set(-0.76, 0.24, 0);
          rightArmGroup.rotation.set(0.72, 0.16, 0.22);
          rightLowerArmGroup.rotation.set(-0.76, -0.24, 0);

          if (!isGrounded && playerJumpY > 0.08) {
            // --- AIRBORNE BUNNY HOP ---
            leftLegGroup.rotation.set(0.48, 0, 0);
            leftLowerLegGroup.rotation.set(-0.65, 0, 0);
            rightLegGroup.rotation.set(0.48, 0, 0);
            rightLowerLegGroup.rotation.set(-0.65, 0, 0);

            // Spin wheels in air
            bikeFrontWheel.rotation.x += delta * 20;
            bikeRearWheel.rotation.x += delta * 20;
          } else if (isMoving && gameState === 'PLAYING') {
            // --- CONTINUOUS REALISTIC 360° PEDALING SIMULATION ---
            const pedalRate = medicineSideEffectsActiveRef.current ? 6.0 : 12.5;
            const pedalAngle = time * pedalRate;

            // Crankset & pedals rotating in sync
            bikeCranksetGroup.rotation.x = pedalAngle;

            // Left leg pedal circular stroke (top bend -> bottom extension)
            leftLegGroup.rotation.set(0.55 + Math.sin(pedalAngle) * 0.48, 0.04, -0.06);
            leftLowerLegGroup.rotation.set(-0.85 + Math.cos(pedalAngle) * 0.48, 0, 0);

            // Right leg pedal circular stroke (180° opposite phase)
            rightLegGroup.rotation.set(0.55 + Math.sin(pedalAngle + Math.PI) * 0.48, -0.04, 0.06);
            rightLowerLegGroup.rotation.set(-0.85 + Math.cos(pedalAngle + Math.PI) * 0.48, 0, 0);

            // Spoked wheels spinning smoothly
            const wheelSpinSpeed = medicineSideEffectsActiveRef.current ? 10 : 22;
            bikeFrontWheel.rotation.x += delta * wheelSpinSpeed;
            bikeRearWheel.rotation.x += delta * wheelSpinSpeed;

            // Subtle pedal cadence swaying
            torsoGroup.rotation.z = Math.sin(pedalAngle) * 0.035 + (rawDeltaX > 0.001 ? -0.06 : rawDeltaX < -0.001 ? 0.06 : 0);
          } else {
            // --- IDLE CYCLING RESTING POSE ---
            // Left foot rests on elevated top pedal
            leftLegGroup.rotation.set(0.82, 0.04, -0.06);
            leftLowerLegGroup.rotation.set(-1.05, 0, 0);

            // Right leg extended down towards road
            rightLegGroup.rotation.set(0.18, -0.04, 0.06);
            rightLowerLegGroup.rotation.set(-0.25, 0, 0);

            bikeCranksetGroup.rotation.x = 0.55;
            torsoGroup.rotation.z = 0;
          }
        } else if (activeVeh === 'skate') {
          // ==========================================
          // 🛹 2. SKATEBOARD (SURF STANCE, CARVING & PUSH)
          // ==========================================
          playerGroup.position.y = finalBaseY + 0.12;

          // Authentic sideways skater posture (torso angled ~32°, head looking straight ahead)
          torsoGroup.rotation.set(0.12, 0.56, 0);
          headGroup.rotation.set(0, -0.60, 0);

          // Wide dynamic balancing arms
          leftArmGroup.rotation.set(0.32, 0.42, -0.68);
          leftLowerArmGroup.rotation.set(-0.35, 0, 0);
          rightArmGroup.rotation.set(-0.22, -0.32, 0.68);
          rightLowerArmGroup.rotation.set(-0.35, 0, 0);

          // Front foot across front truck
          leftLegGroup.rotation.set(0.14, 0.32, -0.16);
          leftLowerLegGroup.rotation.set(-0.28, 0, 0);

          if (!isGrounded && playerJumpY > 0.08) {
            // --- AIRBORNE OLLIE JUMP ---
            leftLegGroup.rotation.set(-0.4, 0.25, -0.15);
            leftLowerLegGroup.rotation.set(0.7, 0, 0);
            rightLegGroup.rotation.set(-0.4, -0.25, 0.15);
            rightLowerLegGroup.rotation.set(0.7, 0, 0);

            leftArmGroup.rotation.z = -0.95;
            rightArmGroup.rotation.z = 0.95;

            // Fast wheel spin
            skateWheelsList.forEach((w) => {
              w.rotation.x += delta * 30;
            });
          } else if (isMoving && gameState === 'PLAYING') {
            // --- MOVING: CARVING FLOW & PERIODIC FOOT PUSH (REMADA) ---
            const pushSpeed = medicineSideEffectsActiveRef.current ? 1.8 : 3.0;
            const pushPhase = (time * pushSpeed) % (Math.PI * 2);

            if (pushPhase < Math.PI * 0.65) {
              // Push stroke: Right leg pushes backward along pavement
              const strokeProg = pushPhase / (Math.PI * 0.65);
              const pushSwing = Math.sin(strokeProg * Math.PI);
              rightLegGroup.rotation.set(-0.35 + pushSwing * 0.75, -0.08, 0.08);
              rightLowerLegGroup.rotation.set(pushSwing > 0.5 ? 0.25 : -0.2, 0, 0);
              torsoGroup.rotation.x = 0.18 + pushSwing * 0.08;
            } else {
              // Cruising stroke: Both feet firmly planted on skateboard deck
              rightLegGroup.rotation.set(0.18, -0.46, 0.16);
              rightLowerLegGroup.rotation.set(-0.32, 0, 0);
              torsoGroup.rotation.x = 0.12;
            }

            // Carving sway along the path
            const carveSway = Math.sin(time * 5.0) * 0.06;
            playerGroup.rotation.z = carveSway + (rawDeltaX > 0.001 ? -0.08 : rawDeltaX < -0.001 ? 0.08 : 0);

            // Polyurethane wheels spinning
            const sWheelRate = medicineSideEffectsActiveRef.current ? 14 : 26;
            skateWheelsList.forEach((w) => {
              w.rotation.x += delta * sWheelRate;
            });
          } else {
            // --- IDLE SKATEBOARD RESTING STANCE ---
            rightLegGroup.rotation.set(0.18, -0.46, 0.16);
            rightLowerLegGroup.rotation.set(-0.25, 0, 0);
            playerGroup.rotation.z = 0;
          }
        } else if (activeVeh === 'patinete') {
          // ==========================================
          // 🛴 3. PATINETE ELÉTRICO (ELECTRIC COMMUTER GLIDE)
          // ==========================================
          playerGroup.position.y = finalBaseY + 0.28;

          // Upright posture
          torsoGroup.rotation.set(0.06, 0, 0);
          headGroup.rotation.set(0, 0, 0);

          // Hands securely on T-Bar handlebar grips
          leftArmGroup.rotation.set(0.78, -0.16, -0.22);
          leftLowerArmGroup.rotation.set(-0.82, 0.26, 0);
          rightArmGroup.rotation.set(0.78, 0.16, 0.22);
          rightLowerArmGroup.rotation.set(-0.82, -0.26, 0);

          // Feet planted on deck (Left forward, Right slightly back)
          leftLegGroup.rotation.set(0.04, 0, 0);
          leftLowerLegGroup.rotation.set(-0.08, 0, 0);
          rightLegGroup.rotation.set(0.14, -0.16, 0.06);
          rightLowerLegGroup.rotation.set(-0.16, 0, 0);

          if (!isGrounded && playerJumpY > 0.08) {
            // Airborne jump with scooter
            leftLowerLegGroup.rotation.set(-0.28, 0, 0);
            rightLowerLegGroup.rotation.set(-0.28, 0, 0);

            pFrontWheel.rotation.x += delta * 24;
            pRearWheel.rotation.x += delta * 24;
          } else if (isMoving && gameState === 'PLAYING') {
            // High-speed electric glide with micro road vibration
            playerGroup.position.y = finalBaseY + 0.28 + Math.sin(time * 24.0) * 0.012;

            // Wheels spinning smoothly
            const pWheelRate = medicineSideEffectsActiveRef.current ? 12 : 22;
            pFrontWheel.rotation.x += delta * pWheelRate;
            pRearWheel.rotation.x += delta * pWheelRate;

            // Banking lean on turns
            playerGroup.rotation.z = (rawDeltaX > 0.001 ? -0.06 : rawDeltaX < -0.001 ? 0.06 : 0);
          } else {
            // Calm idle stance on scooter
            playerGroup.rotation.z = 0;
          }
        } else if (!isGrounded && playerJumpY > 0.08) {
          // ==========================================
          // 🏃 STANDARD ON-FOOT AIRBORNE JUMP
          // ==========================================
          playerGroup.position.y = finalBaseY;

          if (playerJumpVelocity > 0) {
            // Subida do salto
            leftLegGroup.rotation.set(-0.75, 0.1, -0.15);
            rightLegGroup.rotation.set(-0.55, -0.1, 0.15);
            leftLowerLegGroup.rotation.set(1.1, 0, 0);
            rightLowerLegGroup.rotation.set(0.95, 0, 0);

            leftArmGroup.rotation.set(-0.6, 0.2, -0.8);
            rightArmGroup.rotation.set(-0.6, -0.2, 0.8);
            leftLowerArmGroup.rotation.set(-0.6, 0, 0);
            rightLowerArmGroup.rotation.set(-0.6, 0, 0);
            headGroup.rotation.set(-0.25, 0, 0);
          } else {
            // Descida e preparação de aterrissagem
            leftLegGroup.rotation.set(-0.25, 0.1, -0.1);
            rightLegGroup.rotation.set(-0.25, -0.1, 0.1);
            leftLowerLegGroup.rotation.set(0.5, 0, 0);
            rightLowerLegGroup.rotation.set(0.5, 0, 0);

            leftArmGroup.rotation.set(0.2, 0, -0.5);
            rightArmGroup.rotation.set(0.2, 0, 0.5);
            leftLowerArmGroup.rotation.set(-0.3, 0, 0);
            rightLowerArmGroup.rotation.set(-0.3, 0, 0);
            headGroup.rotation.set(0.1, 0, 0);
          }
        } else if (isMoving && gameState === 'PLAYING') {
          // ==========================================
          // 🏃 STANDARD ON-FOOT MOVEMENT
          // ==========================================
          if (medicineSideEffectsActiveRef.current) {
            // SIDE EFFECTS SHUFFLE WALK
            playerGroup.position.y = finalBaseY + Math.abs(Math.sin(time * 6)) * 0.08;
            
            const walkSwing = Math.sin(time * 6) * 0.35;
            leftLegGroup.rotation.x = walkSwing;
            rightLegGroup.rotation.x = -walkSwing;
            leftLowerLegGroup.rotation.x = walkSwing > 0 ? -0.15 : 0;
            rightLowerLegGroup.rotation.x = walkSwing < 0 ? -0.15 : 0;

            leftArmGroup.rotation.set(-walkSwing * 0.3, 0, 0.08);
            rightArmGroup.rotation.set(walkSwing * 0.3, 0, -0.08);
            leftLowerArmGroup.rotation.set(-0.1, 0, 0);
            rightLowerArmGroup.rotation.set(-0.1, 0, 0);

            headGroup.rotation.x = 0.38 + Math.sin(time * 2.5) * 0.22;
            torsoGroup.rotation.x = 0.18;
          } else {
            // FLUID RUNNING ANIMATION WITH NATURAL HUMANIZED MOTIONS
            playerGroup.position.y = finalBaseY + Math.abs(Math.sin(time * 14)) * 0.25;

            const runSwing = Math.sin(time * 14) * 0.85;

            leftLegGroup.rotation.x = runSwing;
            rightLegGroup.rotation.x = -runSwing;
            leftLowerLegGroup.rotation.x = runSwing > 0 ? -0.4 : 0;
            rightLowerLegGroup.rotation.x = runSwing < 0 ? -0.4 : 0;

            leftArmGroup.rotation.x = -runSwing * 0.9;
            leftArmGroup.rotation.z = 0.1; // natural outward elbow splay
            rightArmGroup.rotation.x = runSwing * 0.9;
            rightArmGroup.rotation.z = -0.1;

            // Humanized torso lean and shoulder rotation
            torsoGroup.rotation.x = 0.15; // aerodynamic lean
            torsoGroup.rotation.y = Math.sin(time * 14) * 0.08; // shoulder counter-rotation
            torsoGroup.rotation.z = Math.sin(time * 14) * 0.04; // natural body sway

            // Dynamic head bobbing
            headGroup.rotation.x = 0.04 + Math.sin(time * 28) * 0.035;
            headGroup.rotation.y = Math.sin(time * 14) * 0.02;
          }
        } else {
          // ==========================================
          // 🧍 STANDARD ON-FOOT IDLE (HUMANIZED & BREATHING)
          // ==========================================
          // Micro breathing bob in height
          const breatheCycle = Math.sin(time * 2.0);
          playerGroup.position.y = finalBaseY + breatheCycle * 0.015;

          leftLegGroup.rotation.set(0, 0, 0.04); // subtle natural splay
          rightLegGroup.rotation.set(0, 0, -0.04);
          leftLowerLegGroup.rotation.set(0, 0, 0);
          rightLowerLegGroup.rotation.set(0, 0, 0);

          if (medicineSideEffectsActiveRef.current) {
            torsoGroup.rotation.z = Math.sin(time * 1.5) * 0.04;
            torsoGroup.rotation.x = 0.16 + Math.cos(time * 1.2) * 0.05;
            
            leftArmGroup.rotation.set(0.12, 0, 0.06);
            rightArmGroup.rotation.set(0.12, 0, -0.06);
            leftLowerArmGroup.rotation.set(-0.08, 0, 0);
            rightLowerArmGroup.rotation.set(-0.08, 0, 0);

            headGroup.rotation.x = 0.42 + Math.sin(time * 2.0) * 0.18;
          } else {
            // Gentle breathing chest expansion and natural weight shift sways
            torsoGroup.scale.set(1.0 + breatheCycle * 0.008, 1.0, 1.0 + breatheCycle * 0.008);
            torsoGroup.rotation.set(breatheCycle * 0.01, Math.sin(time * 0.5) * 0.015, breatheCycle * 0.005);

            // Left and right arm swaying slightly asynchronous for a organic, non-robotic feel
            leftArmGroup.rotation.set(0.12 + Math.sin(time * 2.0) * 0.05, 0, 0.1);
            rightArmGroup.rotation.set(0.12 - Math.sin(time * 2.0 + 0.4) * 0.05, 0, -0.1);
            leftLowerArmGroup.rotation.set(-0.15, 0, 0);
            rightLowerArmGroup.rotation.set(-0.15, 0, 0);

            // Natural micro gaze movements
            headGroup.rotation.set(
              0.02 + Math.sin(time * 1.8) * 0.015,
              Math.sin(time * 0.45) * 0.06, // scanning horizon
              Math.sin(time * 0.9) * 0.01
            );
          }
        }
      }

      // Protective Umbrella visibility sync
      if (umbrellaGroup) {
        umbrellaGroup.visible = !!umbrellaActiveRef.current;
      }

      // --- DOG COMPANION IA AUTÔNOMA (LÉO: PINSCHER LUKE) ---
      if (characterSelection === 'leo') {
        const isGameOver = gameState === 'DERROTA' || gameState === 'VITORIA';
        dogProp.visible = !isGameOver;

        if (dogProp.visible) {
          // Inicialização da posição do cãozinho no mundo 3D na primeira execução
          if (!dogAIState.initialized) {
            dogAIState.x = playerGroup.position.x + 1.2;
            dogAIState.z = playerGroup.position.z + 0.4;
            dogAIState.y = 0;
            dogAIState.initialized = true;
          }

          const pX = playerGroup.position.x;
          const pZ = playerGroup.position.z;

          // VERIFICAÇÃO SE LÉO ESTÁ DENTRO DO CAMPO DE FUTEBOL
          const isPlayerInSoccerField = isNearSoccerZone && pZ < -18.0;

          // 1. MODO CARINHO (Interação direta iniciada pelo jogador / tecla K)
          if (dogPetAnimTimer > 0) {
            dogAIState.state = 'PETTING';
            const petOffsetSide = (playerGroup.rotation.y >= 0 ? 0.75 : -0.75);
            const targetX = pX + petOffsetSide;
            const targetZ = pZ + 0.35;

            const dx = targetX - dogAIState.x;
            const dz = targetZ - dogAIState.z;
            dogAIState.x += dx * Math.min(1.0, delta * 6.0);
            dogAIState.z += dz * Math.min(1.0, delta * 6.0);

            // Olha diretamente para Léo
            dogProp.rotation.y = (playerGroup.rotation.y >= 0 ? -Math.PI / 2 + 0.25 : Math.PI / 2 - 0.25);

            // Reação feliz de carinho: rabo abanando e cabeça inclinada para a mão
            const petCycle = Math.sin(time * 8.0);
            dpTail.rotation.y = Math.sin(time * 16.0) * 0.65;
            dpHeadGroup.rotation.x = -0.22 + Math.abs(petCycle) * 0.12;
            dpHeadGroup.rotation.z = Math.sin(time * 4.0) * 0.08;
            dpEarL.rotation.z = -0.15 - Math.abs(petCycle) * 0.12;
            dpEarR.rotation.z = 0.15 + Math.abs(petCycle) * 0.12;
            dogAIState.y = 0;

          } else if (isPlayerInSoccerField) {
            // --- LUCKY ESPERA NA LATERAL FORA DO CAMPO ENQUANTO LÉO JOGA FUTEBOL ---
            dogAIState.state = 'WAITING_OUTSIDE_PITCH';
            const sidelineTargetX = Math.max(152.0, Math.min(208.0, pX));
            const sidelineTargetZ = -16.5;

            const dx = sidelineTargetX - dogAIState.x;
            const dz = sidelineTargetZ - dogAIState.z;
            const distToSideline = Math.hypot(dx, dz);

            if (distToSideline > 0.6) {
              const moveSpeed = Math.min(10.0, Math.max(5.0, distToSideline * 3.0));
              const dirX = dx / distToSideline;
              const dirZ = dz / distToSideline;
              dogAIState.x += dirX * moveSpeed * delta;
              dogAIState.z += dirZ * moveSpeed * delta;

              dogProp.rotation.y = THREE.MathUtils.lerp(dogProp.rotation.y, Math.atan2(dirX, dirZ), 0.25);

              const runStep = Math.sin(time * 12.0) * 0.45;
              dpFL.rotation.x = runStep;
              dpFR.rotation.x = -runStep;
              dpBL.rotation.x = -runStep;
              dpBR.rotation.x = runStep;
              dpTail.rotation.y = Math.sin(time * 12.0) * 0.6;
              dogAIState.y = Math.abs(Math.sin(time * 12.0)) * 0.08;
            } else {
              // Posturado na lateral observando a partida com rabo abanando e orelhas em pé
              dogAIState.x = sidelineTargetX;
              dogAIState.z = sidelineTargetZ;
              dogAIState.y = 0;

              const lookAngle = Math.atan2(pX - dogAIState.x, pZ - dogAIState.z);
              dogProp.rotation.y = THREE.MathUtils.lerp(dogProp.rotation.y, lookAngle, 0.2);

              dpFL.rotation.x = 0;
              dpFR.rotation.x = 0;
              dpBL.rotation.x = -0.55;
              dpBR.rotation.x = -0.55;
              dpTail.rotation.y = Math.sin(time * 14.0) * 0.65;
              dpHeadGroup.rotation.x = -0.15 + Math.sin(time * 3.0) * 0.08;
              dpEarL.rotation.z = -0.12;
              dpEarR.rotation.z = 0.12;

              if (time - dogAIState.lastBarkTime > 5.0 && Math.random() < 0.25) {
                dogAIState.lastBarkTime = time;
                playDogBarkSFX(settingsRef.current.enableSound !== false);
              }
            }

          } else if (gameState === 'PLAYING' || gameState === 'MODO_ZEN') {
            // 2. RADAR DE IA PARA DETECÇÃO E RESGATE DE ITENS (À Frente e Atrás)
            let bestTargetItem: FallingItem | null = null;
            let bestTargetType: 'BEHIND' | 'AHEAD' = 'AHEAD';
            let highestPriority = -999;

            for (let i = 0; i < itemsRef.current.length; i++) {
              const item = itemsRef.current[i];
              if (item.collected) continue;

              // Spatial Partitioning Filter: Skip items beyond radar range (28 units)
              const relX = item.position[0] - pX;
              if (Math.abs(relX) > 28) continue;

              // Ignora obstáculos e armadilhas físicas
              const isObstacle = item.type === 'Buraco' || item.type === 'PequenaPared' || item.type === 'Cone' || item.type === 'Cavalete' || item.type === 'Cilindro';
              if (isObstacle) continue;

              // O cachorrinho Luke NUNCA coleta itens nocivos (notificações, redes sociais, feeds, etc.)
              const isHarmfulItem = item.type === 'CardNotificacao' || item.type === 'CardNotifPendente' || item.type === 'CardFeed' ||
                                    item.type === 'Feed' || item.type === 'Like' || item.type === 'Wifi' || item.type === 'Smartphone' || item.type === 'Geometric' ||
                                    item.type === 'WhatsApp' || item.type === 'YouTube' || item.type === 'Facebook' || item.type === 'TikTok';
              if (isHarmfulItem) continue;

              // Se o jogador estiver descansando dentro de ambientes ou na casa, Luke fica ao lado e não sai para buscar itens
              if (playerGroup.position.z < -3.5 || houseRestSequenceState !== 'IDLE') continue;

              // Itens de chão ou itens caindo acessíveis
              const distX = Math.abs(relX);

              const isAheadOfPlayer = (lastWalkDir >= 0 ? relX > 0.6 : relX < -0.6);
              const isBehindPlayer = (lastWalkDir >= 0 ? relX < -0.6 : relX > 0.6);

              if (isBehindPlayer && distX <= 24.0) {
                // PRIORIDADE MÁXIMA: Resgatar itens que o jogador deixou para trás!
                const priority = 100 - distX;
                if (priority > highestPriority) {
                  highestPriority = priority;
                  bestTargetItem = item;
                  bestTargetType = 'BEHIND';
                }
              } else if (isAheadOfPlayer && distX <= 32.0) {
                // PRIORIDADE ALTA: Coletar itens à frente para abrir caminho!
                const priority = 50 - distX;
                if (priority > highestPriority && bestTargetType !== 'BEHIND') {
                  highestPriority = priority;
                  bestTargetItem = item;
                  bestTargetType = 'AHEAD';
                }
              }
            }

            if (bestTargetItem) {
              // --- ESTADO: BUSCA AUTÔNOMA DE ITEM (FETCH) ---
              dogAIState.state = bestTargetType === 'BEHIND' ? 'FETCH_BEHIND' : 'FETCH_AHEAD';
              dogAIState.targetItemId = bestTargetItem.id;
              const targetX = bestTargetItem.position[0];
              const targetZ = bestTargetItem.position[2] || 0;

              const dx = targetX - dogAIState.x;
              const dz = targetZ - dogAIState.z;
              const distToItem = Math.hypot(dx, dz);

              // Velocidade de corrida equilibrada do Pinscher (reduzida em 50%)
              const sprintSpeed = Math.min(12.0, Math.max(8.0, distToItem * 3.25));
              const moveDirX = dx / (distToItem || 1);
              const moveDirZ = dz / (distToItem || 1);

              dogAIState.x += moveDirX * sprintSpeed * delta;
              dogAIState.z += moveDirZ * sprintSpeed * delta;

              // Vira na direção da corrida
              const targetAngle = Math.atan2(moveDirX, moveDirZ);
              dogProp.rotation.y = THREE.MathUtils.lerp(dogProp.rotation.y, targetAngle, 0.25);

              // Animação de trote cadenciado (reduzido em 50%)
              const runStep = Math.sin(time * 14.0) * 0.55;
              dpFL.rotation.x = runStep;
              dpFR.rotation.x = -runStep;
              dpBL.rotation.x = -runStep;
              dpBR.rotation.x = runStep;
              dpTail.rotation.y = Math.sin(time * 14.0) * 0.7;
              dpHeadGroup.rotation.x = 0.12;
              dogAIState.y = Math.abs(Math.sin(time * 14.0)) * 0.10;

              // GATILHO DE COLETA PELO CACHORRINHO LUCKY
              if (distToItem < 1.45) {
                bestTargetItem.collected = true;
                const meshGroup = active3DObjectsRef.current.get(bestTargetItem.id);
                if (meshGroup) meshGroup.visible = false;

                createExplosion(bestTargetItem.position[0], bestTargetItem.position[1] || 1.2, bestTargetItem.position[2] || 0);
                if (bestTargetItem.type === 'Remedio') {
                  lastRemedioSpawnTimeRef.current = Date.now();
                }
                onItemCollect(bestTargetItem.type);

                if (bestTargetItem.type === 'Exercício Físico') exerciseAnimTimer = 3.0;
                else if (bestTargetItem.type === 'Bola de Futebol') soccerAnimTimer = 3.0;
                else if (bestTargetItem.type === 'Coffee') coffeeDrinkAnimTimer = 3.0;
                else if (bestTargetItem.type === 'Hamburguer') burgerEatAnimTimer = 3.0;
                else if (bestTargetItem.type === 'Book') bookReadAnimTimer = 3.0;
                else if (bestTargetItem.type === 'Violão') guitarAnimTimer = 3.5;
                else if (bestTargetItem.type === 'Encontro Presencial') hugAnimTimer = 3.0;
                else if (bestTargetItem.type === 'Cachorro') dogPetAnimTimer = 3.0;

                // Latido alegre de celebração ao coletar o item!
                if (time - dogAIState.lastBarkTime > 0.5) {
                  playDogBarkSFX(settingsRef.current.enableSound !== false);
                  dogAIState.lastBarkTime = time;
                }

                // Salto de comemoração
                dogAIState.jumpVy = 5.5;
                dogAIState.celebrateTimer = 0.4;
              }
            } else {
              // 3. ESTADO: ÓRBITA DINÂMICA (Correndo em círculos contínuos ao redor de Léo com velocidade reduzida em 50%)
              dogAIState.state = 'ORBIT';
              dogAIState.orbitAngle += delta * 2.4;

              // Centraliza o círculo ligeiramente à frente quando Léo se desloca
              const forwardLead = isMoving ? lastWalkDir * 1.8 : 0;
              const orbitRadiusX = 2.6;
              const orbitRadiusZ = 1.6;

              const desiredX = pX + forwardLead + Math.cos(dogAIState.orbitAngle) * orbitRadiusX;
              const desiredZ = pZ + Math.sin(dogAIState.orbitAngle) * orbitRadiusZ;

              const dx = desiredX - dogAIState.x;
              const dz = desiredZ - dogAIState.z;
              const distToOrbit = Math.hypot(dx, dz);

              const moveSpeed = Math.min(11.0, Math.max(6.0, distToOrbit * 2.5));
              dogAIState.x += (dx / (distToOrbit || 1)) * Math.min(distToOrbit, moveSpeed * delta);
              dogAIState.z += (dz / (distToOrbit || 1)) * Math.min(distToOrbit, moveSpeed * delta);

              // Direção do movimento tangente do círculo
              const tangentX = -Math.sin(dogAIState.orbitAngle) * orbitRadiusX + (isMoving ? lastWalkDir * 0.8 : 0);
              const tangentZ = Math.cos(dogAIState.orbitAngle) * orbitRadiusZ;
              const targetAngle = Math.atan2(tangentX, tangentZ);
              dogProp.rotation.y = THREE.MathUtils.lerp(dogProp.rotation.y, targetAngle, 0.2);

              // Trote contínuo do Pinscher com ritmo calmo
              const runStep = Math.sin(time * 10.0) * 0.45;
              dpFL.rotation.x = runStep;
              dpFR.rotation.x = -runStep;
              dpBL.rotation.x = -runStep;
              dpBR.rotation.x = runStep;
              dpTail.rotation.y = Math.sin(time * 11.0) * 0.55;
              dpHeadGroup.rotation.x = Math.sin(time * 4.0) * 0.08;
              dogAIState.y = Math.abs(Math.sin(time * 10.0)) * 0.08;
            }

            // Física de Gravidade e Salto do Cãozinho
            if (dogAIState.jumpVy !== 0 || dogAIState.jumpY > 0) {
              dogAIState.jumpY += dogAIState.jumpVy * delta;
              dogAIState.jumpVy -= 26.0 * delta;
              if (dogAIState.jumpY <= 0) {
                dogAIState.jumpY = 0;
                dogAIState.jumpVy = 0;
              }
            }

          } else {
            // Em outros estados ou pausas, acompanha serenamente ao lado
            dogAIState.state = 'ORBIT';
            dogAIState.x = THREE.MathUtils.lerp(dogAIState.x, pX + 1.2, delta * 2.0);
            dogAIState.z = THREE.MathUtils.lerp(dogAIState.z, pZ + 0.4, delta * 2.0);
            dpFL.rotation.x = 0; dpFR.rotation.x = 0; dpBL.rotation.x = 0; dpBR.rotation.x = 0;
            dpTail.rotation.y = Math.sin(time * 8.0) * 0.35;
            dpHeadGroup.rotation.x = Math.sin(time * 3.0) * 0.08;
            dogAIState.y = 0;
          }

          // Aplicação final de coordenadas 3D para o dogProp no mundo
          dogProp.position.set(dogAIState.x, dogAIState.y + dogAIState.jumpY, dogAIState.z);
        }
      } else {
        // Guto e Caio NÃO possuem o cãozinho acompanhante
        dogProp.visible = false;
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

      // Respawn blinking / flashing sync
      if (respawnFlashRef.current) {
        playerGroup.visible = Math.floor(time * 16) % 2 === 0;
      } else {
        playerGroup.visible = true;
      }

      // Lighting & State Effects (Cached references - Zero GC)
      if (gameState === 'MODO_ZEN') {
        if (scene.background !== zenBgColor) scene.background = zenBgColor;
        if (scene.fog !== zenFog) scene.fog = zenFog;
        ambientLight.color.setHex(0xe0f2fe);
        ambientLight.intensity = 1.2;
      } else if (gameState === 'DERROTA') {
        if (scene.background !== defeatBgColor) scene.background = defeatBgColor;
        if (scene.fog !== defeatFog) scene.fog = defeatFog;
        ambientLight.color.setHex(0xef4444);
        ambientLight.intensity = 0.8;
      } else {
        // --- 2X CONTINUOUS DAY / NIGHT CYCLE ENGINE ---
        dayNightCycleTimer += delta;
        const CYCLE_DURATION = 240.0; // 2X length continuous cycle (4 min total)
        const cycleProgress = (dayNightCycleTimer % CYCLE_DURATION) / CYCLE_DURATION;

        const weatherPreset = settingsRef.current.weatherPreset || 'auto';
        const dayNight = settingsRef.current.dayNightMode || 'auto';

        let effectivePreset = weatherPreset;
        if (effectivePreset === 'auto') {
          if (dayNight === 'day') effectivePreset = 'clear';
          else if (dayNight === 'night') effectivePreset = 'night';
          else {
            if (cycleProgress < 0.42) effectivePreset = 'clear';
            else if (cycleProgress < 0.54) effectivePreset = 'sunset';
            else if (cycleProgress < 0.88) effectivePreset = 'night';
            else effectivePreset = 'sunset';
          }
        }

        let ambientIntensity = 0.75;

        if (effectivePreset === 'clear') {
          dynamicBgColor.copy(dayColor);
          ambientLight.color.copy(dayAmbient);
          ambientIntensity = 0.95;
          defaultFog.density = 0.009;
          rainParticles.visible = false;
          starParticles.visible = false;
        } else if (effectivePreset === 'sunset') {
          dynamicBgColor.copy(sunsetColor);
          ambientLight.color.copy(sunsetAmbient);
          ambientIntensity = 0.85;
          defaultFog.density = 0.014;
          rainParticles.visible = false;
          starParticles.visible = true;
          starMat.opacity = 0.45 + Math.sin(time * 2.0) * 0.2;
        } else if (effectivePreset === 'night') {
          dynamicBgColor.copy(nightColor);
          ambientLight.color.copy(nightAmbient);
          ambientIntensity = 0.70;
          defaultFog.density = 0.018;
          rainParticles.visible = false;
          starParticles.visible = true;
          starMat.opacity = 0.75 + Math.sin(time * 3.5) * 0.25;
        } else if (effectivePreset === 'rain') {
          dynamicBgColor.copy(rainBgColor);
          ambientLight.color.copy(rainAmbient);
          ambientIntensity = 0.65;
          defaultFog.density = 0.022;
          rainParticles.visible = true;
          starParticles.visible = false;

          // Animate falling raindrops relative to player position
          const pPositions = rainGeo.attributes.position.array as Float32Array;
          const px = playerGroup.position.x;
          for (let i = 0; i < rainCount; i++) {
            pPositions[i * 3 + 1] -= delta * 38; // fall speed
            if (pPositions[i * 3 + 1] < 0) {
              pPositions[i * 3 + 1] = 30 + Math.random() * 8;
              pPositions[i * 3] = px + (Math.random() - 0.5) * 80;
            }
          }
          rainGeo.attributes.position.needsUpdate = true;
        } else if (effectivePreset === 'fog') {
          dynamicBgColor.copy(fogBgColor);
          ambientLight.color.copy(fogAmbient);
          ambientIntensity = 0.80;
          defaultFog.density = 0.038; // Dense mountain mist
          rainParticles.visible = false;
          starParticles.visible = false;
        }

        if (scene.background !== dynamicBgColor) scene.background = dynamicBgColor;
        if (scene.fog !== defaultFog) scene.fog = defaultFog;
        defaultFog.color.copy(dynamicBgColor);
        ambientLight.intensity = ambientIntensity;

        // Night state check & toast events
        const isNightTime = effectivePreset === 'night' || effectivePreset === 'rain' || effectivePreset === 'sunset';
        if (isNightTime && !wasNightLastFrameRef.current) {
          wasNightLastFrameRef.current = true;
          window.dispatchEvent(new CustomEvent('night-fell'));
        } else if (!isNightTime && wasNightLastFrameRef.current) {
          wasNightLastFrameRef.current = false;
          window.dispatchEvent(new CustomEvent('day-broke'));
        }

        // House Beacon Animation
        houseBeaconBeamMat.opacity = isNightTime ? 0.35 + Math.sin(time * 3.0) * 0.15 : 0.0;
        houseBeaconRingMat.opacity = isNightTime ? 0.8 + Math.sin(time * 4.0) * 0.2 : 0.0;
        houseBeaconRing.rotation.z = time * 2.0;

        streetLampsList.forEach((lamp) => {
          lamp.coneMesh.visible = isNightTime;
          lamp.bulbMat.emissiveIntensity = isNightTime ? 1.4 : 0.0;
        });
        soccerFloodlightsList.forEach((lamp) => {
          lamp.coneMesh.visible = isNightTime;
          lamp.bulbMat.emissiveIntensity = isNightTime ? 2.2 : 0.0;
          lamp.pointLight.intensity = isNightTime ? 3.5 : 0.0;
        });
        houseNightLightsList.forEach((hLight) => {
          hLight.windowsMat.emissiveIntensity = isNightTime ? 1.8 : 0.2;
          hLight.porchBulbMat.emissiveIntensity = isNightTime ? 1.6 : 0.0;
          hLight.bedsideLampMat.emissiveIntensity = isNightTime ? 1.4 : 0.2;
          hLight.interiorLight.intensity = isNightTime ? 2.6 : 0.2;
          hLight.porchLight.intensity = isNightTime ? 2.2 : 0.0;
          hLight.fireplaceLight.intensity = 1.0 + Math.sin(time * 8.0) * 0.4;
        });

        // --- BLEACHER SPECTATOR NPCS AI UPDATE ---
        bleacherNpcsList.forEach((bNpc) => {
          if (bNpc.state === 'WATCHING') {
            bNpc.watchingTimer += delta;

            // Track soccer ball position with head
            const bX = 180 + ballState.x;
            const bZ = -42 + ballState.z;
            const targetAngle = Math.atan2(bX - bNpc.currentWorldX, bZ - bNpc.currentWorldZ) - Math.PI;
            bNpc.headGroup.rotation.y += (targetAngle - bNpc.headGroup.rotation.y) * delta * 4.0;

            // Cheering / waving when ball is moving fast
            if (Math.abs(ballState.vx) > 1.8) {
              bNpc.armR.rotation.x = -1.2 + Math.sin(time * 8.0 + bNpc.id) * 0.4;
              bNpc.armL.rotation.x = -1.2 + Math.cos(time * 8.0 + bNpc.id) * 0.4;
            } else {
              bNpc.armR.rotation.x += (0 - bNpc.armR.rotation.x) * delta * 3.0;
              bNpc.armL.rotation.x += (0 - bNpc.armL.rotation.x) * delta * 3.0;
            }

            if (bNpc.watchingTimer >= bNpc.watchingDuration) {
              bNpc.state = 'STANDING_UP';
              bNpc.sitProgress = 1.0;
            }
          } else if (bNpc.state === 'STANDING_UP') {
            bNpc.sitProgress -= delta * 1.5;
            const p = Math.max(0, bNpc.sitProgress);

            bNpc.legLGroup.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2 + 0.1, p);
            bNpc.legRGroup.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2 + 0.1, p);
            bNpc.calfLGroup.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2, p);
            bNpc.calfRGroup.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2, p);

            if (p <= 0) {
              bNpc.state = 'WALKING_DOWN_STEPS';
            }
          } else if (bNpc.state === 'WALKING_DOWN_STEPS') {
            bNpc.walkPhase += delta * 6.0;
            bNpc.currentWorldZ = THREE.MathUtils.lerp(bNpc.currentWorldZ, -42 - 21.0, delta * 1.8);
            bNpc.currentWorldY = THREE.MathUtils.lerp(bNpc.currentWorldY, 0.0, delta * 2.0);

            bNpc.npcGroup.position.set(bNpc.seatRelX, bNpc.currentWorldY + 0.35, bNpc.currentWorldZ + 42.0);
            bNpc.npcGroup.rotation.y = Math.PI;

            bNpc.legLGroup.rotation.x = Math.sin(bNpc.walkPhase) * 0.4;
            bNpc.legRGroup.rotation.x = -Math.sin(bNpc.walkPhase) * 0.4;

            if (Math.abs(bNpc.currentWorldZ - (-63.0)) < 0.6) {
              bNpc.state = 'WALKING_TO_STREET';
              bNpc.targetWorldX = bNpc.currentWorldX;
              bNpc.targetWorldZ = -2.5;
            }
          } else if (bNpc.state === 'WALKING_TO_STREET') {
            const dZ = bNpc.targetWorldZ - bNpc.currentWorldZ;
            if (Math.abs(dZ) > 0.4) {
              bNpc.currentWorldZ += Math.sign(dZ) * bNpc.walkSpeed * delta;
              bNpc.walkPhase += delta * 6.0;

              bNpc.npcGroup.position.set(bNpc.seatRelX, 0, bNpc.currentWorldZ + 42.0);
              bNpc.npcGroup.rotation.y = 0; // Facing south toward street

              bNpc.legLGroup.rotation.x = Math.sin(bNpc.walkPhase) * 0.4;
              bNpc.legRGroup.rotation.x = -Math.sin(bNpc.walkPhase) * 0.4;
            } else {
              bNpc.state = 'STREET_ACTIVITY';
              bNpc.streetTimer = 0;
            }
          } else if (bNpc.state === 'STREET_ACTIVITY') {
            bNpc.streetTimer += delta;
            bNpc.walkPhase += delta * 4.0;

            bNpc.legLGroup.rotation.x = Math.sin(bNpc.walkPhase) * 0.3;
            bNpc.legRGroup.rotation.x = -Math.sin(bNpc.walkPhase) * 0.3;

            if (bNpc.streetTimer >= bNpc.streetDuration) {
              bNpc.state = 'WALKING_TO_BLEACHERS';
            }
          } else if (bNpc.state === 'WALKING_TO_BLEACHERS') {
            const dZ = (-63.0) - bNpc.currentWorldZ;
            if (Math.abs(dZ) > 0.4) {
              bNpc.currentWorldZ += Math.sign(dZ) * bNpc.walkSpeed * delta;
              bNpc.walkPhase += delta * 6.0;

              bNpc.npcGroup.position.set(bNpc.seatRelX, 0, bNpc.currentWorldZ + 42.0);
              bNpc.npcGroup.rotation.y = Math.PI; // Facing north toward bleachers

              bNpc.legLGroup.rotation.x = Math.sin(bNpc.walkPhase) * 0.4;
              bNpc.legRGroup.rotation.x = -Math.sin(bNpc.walkPhase) * 0.4;
            } else {
              bNpc.state = 'CLIMBING_STEPS';
            }
          } else if (bNpc.state === 'CLIMBING_STEPS') {
            const targetZ = -42 + bNpc.seatRelZ;
            const targetY = bNpc.seatRelY;

            bNpc.currentWorldZ = THREE.MathUtils.lerp(bNpc.currentWorldZ, targetZ, delta * 1.8);
            bNpc.currentWorldY = THREE.MathUtils.lerp(bNpc.currentWorldY, targetY, delta * 2.0);

            bNpc.npcGroup.position.set(bNpc.seatRelX, bNpc.currentWorldY + 0.35, bNpc.currentWorldZ + 42.0);

            if (Math.abs(bNpc.currentWorldZ - targetZ) < 0.2) {
              bNpc.state = 'WATCHING';
              bNpc.watchingTimer = 0;
              bNpc.watchingDuration = 15 + Math.random() * 20;

              bNpc.legLGroup.rotation.x = -Math.PI / 2 + 0.1;
              bNpc.legRGroup.rotation.x = -Math.PI / 2 + 0.1;
              bNpc.calfLGroup.rotation.x = Math.PI / 2;
              bNpc.calfRGroup.rotation.x = Math.PI / 2;
            }
          }
        });

        // --- NOCTURNAL MONSTERS (ARANHAS & ESCORPIÕES) AI UPDATE ---
        const pX = playerGroup.position.x;
        const pZ = playerGroup.position.z;
        const isInsideHouse = (playerGroup.position.x <= -125.0 && playerGroup.position.x >= -155.0 && playerGroup.position.z < -10.0) || houseRestSequenceState !== 'IDLE';

        nocturnalMonstersList.forEach((monster) => {
          if (isNightTime && !isInsideHouse && (gameState === 'PLAYING' || gameState === 'MODO_ZEN')) {
            // Activate monster outside house
            if (!monster.active) {
              monster.active = true;
              monster.group.visible = true;
              monster.x = pX + (monster.id % 2 === 0 ? 24 : -24);
              monster.z = pZ + (monster.id < 2 ? 10 : -10);
            }

            // Move towards player matching avatar speed
            const dX = pX - monster.x;
            const dZ = pZ - monster.z;
            const dist = Math.hypot(dX, dZ);

            if (dist > 0.4) {
              const moveDirX = dX / dist;
              const moveDirZ = dZ / dist;
              monster.x += moveDirX * monster.speed * delta;
              monster.z += moveDirZ * monster.speed * delta;

              monster.group.rotation.y = Math.atan2(moveDirX, moveDirZ);
            }

            monster.walkPhase += delta * 16.0;

            // Leg animation
            monster.legGroups.forEach((leg, idx) => {
              leg.rotation.x = Math.sin(monster.walkPhase + idx * 0.8) * 0.35;
            });

            // Scorpion pincers/tail animation
            if (monster.pincerL) monster.pincerL.rotation.y = Math.sin(time * 6.0) * 0.2;
            if (monster.pincerR) monster.pincerR.rotation.y = -Math.sin(time * 6.0) * 0.2;
            if (monster.tailGroup) monster.tailGroup.rotation.x = Math.sin(time * 4.0) * 0.15;

            monster.group.position.set(monster.x, 0, monster.z);

            // Attack check
            monster.attackCooldown -= delta;
            if (dist < 1.8 && monster.attackCooldown <= 0 && playerGroup.position.y < 0.8) {
              monster.attackCooldown = 2.5;
              anxietyRef.current = Math.min(100, anxietyRef.current + 12);
              window.dispatchEvent(new CustomEvent('night-monster-attack', { detail: { monsterType: monster.type } }));
            }
          } else {
            // Deactivate & hide inside house or during day
            if (monster.active) {
              monster.active = false;
              monster.group.visible = false;
            }
          }
        });

        // Sync Audio Ambient
        const soundEnabled = settingsRef.current.weatherAmbientSound !== false;
        updateWeatherAmbient(weatherPreset, soundEnabled && (gameState === 'PLAYING' || gameState === 'MODO_ZEN'), anxietyRef.current);
      }

      // --- SPAWNING SYSTEM (DRIVEN BY GAME CONTROL PANEL SETTINGS) ---
      if (gameState === 'PLAYING' || gameState === 'MODO_ZEN') {
        const gymTimeElapsed = Math.max(0, gameTimerRef.current);
        const currentAnxiety = anxietyRef.current;

        // Settings-based difficulty & density multipliers
        const diffSetting = settingsRef.current.gameDifficulty || 'normal';
        const diffFactor = diffSetting === 'facil' ? 0.6 : diffSetting === 'dificil' ? 1.5 : diffSetting === 'extremo' ? 2.2 : 1.0;

        const densitySetting = settingsRef.current.itemSpawnDensity || 'normal';
        const densityFactor = densitySetting === 'baixa' ? 1.8 : densitySetting === 'alta' ? 0.6 : densitySetting === 'caos' ? 0.35 : 1.0;

        // Time Progression: difficulty ramps up smoothly as gameTimer counts up
        const timeElapsed = Math.max(0, gameTimerRef.current);
        const difficultyScale = Math.min(3.2, 1 + (timeElapsed / 35)) * diffFactor; // 1.0x at start -> scaled by difficulty

        // 1. Spawning Falling Items From Above (Proportion harmful vs beneficial determined by settings)
        spawnTimerFalling += delta;
        const currentSpeed = notificationSpeedRef.current;
        const currentInterval = Math.max(0.012, ((0.059 / currentSpeed) / difficultyScale) * densityFactor);

        if (spawnTimerFalling >= currentInterval) {
          spawnTimerFalling = 0;

          const harmfulTypes: FallingItem['type'][] = [
            'Feed', 'Like', 'Wifi', 'Smartphone', 'Geometric', 
            'CardNotificacao', 'CardNotifPendente', 'CardFeed',
            'WhatsApp', 'YouTube', 'Facebook', 'TikTok'
          ];

          const chosenItemType = harmfulTypes[Math.floor(Math.random() * harmfulTypes.length)];
          
          // Spawn items dynamically within active player navigation range on the expanded street [-270, 270]
          const pX = playerGroup.position.x;
          const randomX = Math.max(-270, Math.min(270, pX + (Math.random() - 0.5) * 60));

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
            // Falling speed scales with notification speed, game timer, and gameDifficulty setting
            const fallSpeed = (12 + Math.random() * 9) * currentSpeed * difficultyScale;

            // Spawn height aligned directly with the 3D Internet Cloud base so items fall out of the clouds
            const currentCloudY = internetCloudsGroup ? internetCloudsGroup.position.y : 19.5;
            const spawnY = currentCloudY - 0.5 + Math.sin(randomX * 0.08) * 1.2;

            const newItem: FallingItem = {
              id: Math.random().toString(36).substring(2, 9),
              type: chosenItemType,
              position: [randomX, spawnY, 0],
              speed: fallSpeed,
              rotation: [Math.random(), Math.random(), Math.random()],
              color: '#ff4444',
              isGroundItem: false,
            };

            itemsRef.current.push(newItem);

            const mesh = getPooled3DItemMesh(chosenItemType);
            mesh.scale.set(0.8, 0.8, 0.8);
            mesh.position.set(randomX, spawnY, 0);
            scene.add(mesh);
            active3DObjectsRef.current.set(newItem.id, mesh);
          } else {
            // Retry very shortly to keep item flow consistent but non-overlapping
            spawnTimerFalling = currentInterval * 0.4;
          }
        }

        // Ensure ground track is pre-populated with permanent pre-defined obstacles and items
        if (itemsRef.current.filter((it) => it.isGroundItem).length === 0 && (gameState === 'PLAYING' || gameState === 'MODO_ZEN')) {
          populatePreplacedTrack();
        }

        // --- DYNAMIC REMEDIO SPAWNING ENGINE (Low Frequency, 2-Min Cooldown) ---
        // Criteria: Anxiety level is 100%, player has at least 10 coins, no active medicine effect, modal is not open, and at least 2 minutes since last offer
        const now = Date.now();
        const isAnxiety100 = anxietyRef.current >= 100;
        const hasEnoughCoins = goldCoinsCountRef.current >= 10;
        const cooldownElapsed = (now - lastRemedioSpawnTimeRef.current) >= 120000;
        const notCurrentlyUnderEffect = !medicineSideEffectsActiveRef.current;
        const notInModal = !showMedicinePurchaseModalRef.current;

        const shouldRemedioExist = isAnxiety100 && hasEnoughCoins && cooldownElapsed && notCurrentlyUnderEffect && notInModal;
        const remedioExists = itemsRef.current.some((it) => it.type === 'Remedio' && !it.collected);

        if (shouldRemedioExist && !remedioExists) {
          lastRemedioSpawnTimeRef.current = now;
          const pX = playerGroup.position.x;
          // Spawn 24 units ahead in current movement direction (lastWalkDir)
          let remedioX = pX + lastWalkDir * 24.0;
          if (remedioX > 270) remedioX -= 540;
          else if (remedioX < -270) remedioX += 540;

          const dynamicRemedio: FallingItem = {
            id: `dynamic_remedio_${Math.random().toString(36).substring(2, 9)}`,
            type: 'Remedio',
            position: [remedioX, 1.2, 0],
            speed: 0,
            rotation: [0, 0, 0],
            color: '#10b981',
            isGroundItem: true,
            lifetime: Infinity,
            maxLifetime: Infinity,
            collected: false,
          };

          itemsRef.current.push(dynamicRemedio);
          const itemGroup = getPooled3DItemMesh('Remedio');
          itemGroup.position.set(remedioX, 1.2, 0);
          itemGroup.visible = true;
          scene.add(itemGroup);
          active3DObjectsRef.current.set(dynamicRemedio.id, itemGroup);
        } else if (!shouldRemedioExist && remedioExists) {
          // Recycle any uncollected dynamic Remedio boxes if criteria are no longer met
          for (let i = itemsRef.current.length - 1; i >= 0; i--) {
            const item = itemsRef.current[i];
            if (item.type === 'Remedio' && !item.collected) {
              const obj = active3DObjectsRef.current.get(item.id);
              if (obj) {
                recyclePooled3DItemMesh('Remedio', obj);
              }
              active3DObjectsRef.current.delete(item.id);
              itemsRef.current.splice(i, 1);
            }
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
        hitObstacleIdsRef.current.clear();
      }

      // Update Item Positions, Lifetime and Collision Detection
      // Optimization: We skip the heavy item loop if the game is paused for a SAS question
      if (gameState === 'PLAYING' || gameState === 'MODO_ZEN') {
        const pX = playerGroup.position.x;
        const pY = 1.8 + playerJumpY;

        for (let i = itemsRef.current.length - 1; i >= 0; i--) {
          const item = itemsRef.current[i];
          const meshGroup = active3DObjectsRef.current.get(item.id);

          if (!meshGroup) continue;

          // Spatial Partitioning Optimization: Skip physics & distance checks for far items (> 35 units away)
          const itemX = item.isGroundItem ? item.position[0] : item.x;
          if (Math.abs(itemX - pX) > 35) {
            if (meshGroup.visible) meshGroup.visible = false;
            continue;
          }

          if (item.isGroundItem) {
            // --- GROUND ITEM / OBSTACLE (PERSISTENT MAP TRACK ITEMS) ---
            const isObstacle = item.type === 'Buraco' || item.type === 'PequenaPared' || item.type === 'Cone' || item.type === 'Cavalete' || item.type === 'Cilindro';

            const distX = Math.abs(item.position[0] - pX);
            const distZ = Math.abs((item.position[2] || 0) - playerGroup.position.z);

            if (isObstacle) {
              meshGroup.position.y = 0;
              meshGroup.visible = true;

              // Re-arm obstacle when player has moved away (> 25 units)
              if (distX > 25.0) {
                hitObstacleIdsRef.current.delete(item.id);
              }

              const crouchActive = !!crouchActiveRef?.current;
              let hitObstacle = false;
              // Obstáculos só atingem o jogador se ele estiver na mesma profundidade Z da pista (fora de casas/ambientes fechados)
              if (distZ < 2.5) {
                if (item.type === 'Buraco') {
                  if (distX < 2.0 && playerJumpY < 0.85) {
                    hitObstacle = true;
                  }
                } else if (item.type === 'Cone') {
                  if (distX < 1.6 && playerJumpY < 0.7) {
                    hitObstacle = true;
                  }
                } else if (item.type === 'Cavalete') {
                  if (distX < 2.0 && playerJumpY < 1.4) {
                    hitObstacle = true;
                  }
                } else if (item.type === 'Cilindro') {
                  if (distX < 1.8 && playerJumpY < 1.1) {
                    hitObstacle = true;
                  }
                } else if (item.type === 'PequenaPared') {
                  // Physical wall barrier
                  const hitThreshold = 3.9;
                  if (distX < hitThreshold && !crouchActive && playerJumpY < 2.9) {
                    if (pX < item.position[0]) {
                      playerPosRef.current = item.position[0] - hitThreshold;
                    } else {
                      playerPosRef.current = item.position[0] + hitThreshold;
                    }
                    
                    if (!hitObstacleIdsRef.current.has(item.id)) {
                      hitObstacleIdsRef.current.add(item.id);
                      onItemCollect(item.type);
                    }
                    continue;
                  }
                }
              }

              if (hitObstacle && !hitObstacleIdsRef.current.has(item.id)) {
                hitObstacleIdsRef.current.add(item.id);
                onItemCollect(item.type);
              }
            } else {
              // Beneficial items and MoedaOuro
              if (item.type === 'MoedaOuro') {
                meshGroup.rotation.y += delta * 4.0;
                meshGroup.position.y = 1.35 + Math.sin(time * 6) * 0.22;
              } else {
                meshGroup.position.y = 1.2 + Math.sin(time * 5) * 0.25;
                meshGroup.rotation.y += delta * 1.5;
              }

              // Re-enable item when player moves far away (> 110 units)
              if (item.collected && distX > 110.0) {
                item.collected = false;
                meshGroup.visible = true;
              }

              if (item.collected) {
                meshGroup.visible = false;
              } else {
                meshGroup.visible = true;
                const magnetRadius = (item.type === 'MoedaOuro' && playerSkills?.magnet) ? 8.0 : 2.2;
                if (distX < magnetRadius && distZ < 3.0 && playerJumpY < 3.5) {
                  item.collected = true;
                  meshGroup.visible = false;
                  if (item.type === 'CardNotificacao' || item.type === 'MoedaOuro') {
                    createExplosion(item.position[0], item.position[1], item.position[2]);
                  }
                  if (item.type === 'Remedio') {
                    lastRemedioSpawnTimeRef.current = Date.now();
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
                }
              }
            }
          } else {
            // --- FALLING HARMFUL ITEM ---
            item.position[1] -= item.speed * delta;
            meshGroup.position.y = item.position[1];
            meshGroup.rotation.x += delta * 2;
            meshGroup.rotation.y += delta * 2;

            const dx = item.position[0] - pX;
            const dy = item.position[1] - pY;
            const dz = (item.position[2] || 0) - playerGroup.position.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            const isIndoorsOrSheltered = playerGroup.position.z < -3.5;

            if (distSq < 3.8 && !isIndoorsOrSheltered) {
              if (item.type === 'CardNotificacao' || item.type === 'CardNotifPendente' || item.type === 'CardFeed') {
                createExplosion(item.position[0], item.position[1], item.position[2]);
              }
              if (umbrellaActiveRef.current || outdoorShieldActiveRef.current) {
                // Completely protected by Umbrella or Outdoor Translucent Shield Sphere!
                const isHarmful = item.type === 'CardNotificacao' || item.type === 'CardNotifPendente' || item.type === 'CardFeed' ||
                                  item.type === 'Feed' || item.type === 'Like' || item.type === 'Wifi' || item.type === 'Smartphone' || item.type === 'Geometric' ||
                                  item.type === 'WhatsApp' || item.type === 'YouTube' || item.type === 'Facebook' || item.type === 'TikTok';
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

      // --- Real-time Animation & Proximity Trigger for Bike Rack (Bicicletário) ---
      if (bikeRackStation) {
        // Track gym coordinate dynamically if active
        if (gymAcademyActive) {
          bikeRackStation.group.position.x = gymAcademyX + bikeRackStation.relOffsetFromGym;
        } else {
          bikeRackStation.group.position.x = bikeRackStation.baseX;
        }
        bikeRackStation.group.position.z = bikeRackStation.baseZ;

        const rackX = bikeRackStation.group.position.x;
        const rackZ = bikeRackStation.group.position.z;
        const distToBikeRack = Math.hypot(playerGroup.position.x - rackX, playerGroup.position.z - rackZ);

        // Halo and Billboard Visual Rotations
        if (bikeRackStation.ringMesh) {
          bikeRackStation.ringMesh.rotation.z = time * 1.8;
          (bikeRackStation.ringMesh.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(time * 5.0) * 0.35;
        }


        // Proximity Trigger: Player stands near the bike rack (Bicicletário com 2 bikes disponíveis)
        if (distToBikeRack < 4.2 && playerJumpY < 1.4 && (gameState === 'PLAYING' || gameState === 'MODO_ZEN')) {
          if (time - bikeRackStation.lastUsedTime > 4.5) {
            bikeRackStation.lastUsedTime = time;
            createExplosion(rackX, 1.8, rackZ);
            window.dispatchEvent(new CustomEvent('park-bicycle-used', {
              detail: {
                stationId: 1,
                x: rackX,
              },
            }));
          }
        }
      }

      // --- ANIMATE TRACTOR & AGRICULTURAL PLANTING SIMULATION ---
      if (gameState === 'PLAYING' || gameState === 'MODO_ZEN') {
        if (tractorState === 'DRIVING') {
          const speed = 2.0 * delta;
          tractorX += tractorDirection * speed;

          // Position & Direction
          tractorGroup.position.x = tractorX;
          tractorGroup.position.z = furrowZOffsets[tractorFurrowIdx];
          tractorGroup.rotation.y = tractorDirection > 0 ? 0 : Math.PI;

          // Wheel Rotation
          const rotationSpeed = (speed / 0.85); // rear tire radius is 0.85
          tractorWheels.forEach((wheelGroup) => {
            // Wheels in wGroup are rotated around Z because of the geometry cylinder alignment
            wheelGroup.rotation.y += tractorDirection * rotationSpeed;
          });

          // Slight farmer bouncing and swaying as tractor moves
          fHead.position.y = 0.75 + Math.sin(time * 14.0) * 0.015;
          fHead.rotation.z = Math.sin(time * 7.0) * 0.04;
          fTorso.position.y = 0.3 + Math.cos(time * 14.0) * 0.008;

          // Check bounds of ploughed area
          if ((tractorDirection > 0 && tractorX >= 18.0) || (tractorDirection < 0 && tractorX <= -18.0)) {
            tractorState = 'TURNING';
            tractorTurnTimer = 0.0;
          }
        } else if (tractorState === 'TURNING') {
          // Pauses and rotates 180 degrees
          tractorTurnTimer += delta;
          const turnDuration = 1.4;
          const progress = Math.min(1.0, tractorTurnTimer / turnDuration);

          // Interpolate rotation angle
          const startAng = tractorDirection > 0 ? 0 : Math.PI;
          const targetAng = tractorDirection > 0 ? Math.PI : 0;
          tractorGroup.rotation.y = THREE.MathUtils.lerp(startAng, targetAng, progress);

          // Slightly sway farmer while turning
          fHead.rotation.z = Math.sin(progress * Math.PI) * 0.15;

          // Complete turning sequence and switch row furrow
          if (progress >= 1.0) {
            tractorState = 'DRIVING';
            tractorDirection *= -1;
            tractorX = tractorDirection > 0 ? -18.0 : 18.0;
            
            // Advance to the next furrow index in a looping fashion
            tractorFurrowIdx = (tractorFurrowIdx + 1) % furrowZOffsets.length;
          }
        }

        // Chimney Exhaust Smoke Generation
        if (Math.random() < 0.22) {
          // Find chimney tip world position
          const chimneyWorldPos = new THREE.Vector3();
          exhaustTip.getWorldPosition(chimneyWorldPos);

          // Find or create smoke particle mesh
          let smokePart = tractorSmokePool.find(p => p.mesh.scale.x === 0);
          if (!smokePart) {
            const mesh = new THREE.Mesh(smokePuffGeo, smokePuffMat.clone());
            scene.add(mesh);
            smokePart = {
              mesh,
              age: 0,
              maxAge: 1.2 + Math.random() * 0.6,
              vx: (Math.random() - 0.5) * 0.3,
              vy: 0.8 + Math.random() * 0.5,
              vz: (Math.random() - 0.5) * 0.3
            };
            tractorSmokePool.push(smokePart);
          }
          
          smokePart.mesh.position.copy(chimneyWorldPos);
          smokePart.mesh.scale.set(1, 1, 1);
          (smokePart.mesh.material as THREE.MeshBasicMaterial).opacity = 0.45;
          smokePart.age = 0;
          smokePart.vx = (Math.random() - 0.5) * 0.25 + (tractorState === 'DRIVING' ? -tractorDirection * 0.4 : 0);
          smokePart.vy = 0.9 + Math.random() * 0.6;
          smokePart.vz = (Math.random() - 0.5) * 0.25;
        }

        // Update Smoke Particles
        tractorSmokePool.forEach((p) => {
          if (p.mesh.scale.x > 0) {
            p.age += delta;
            p.mesh.position.x += p.vx * delta;
            p.mesh.position.y += p.vy * delta;
            p.mesh.position.z += p.vz * delta;

            // Fade out and scale up
            const pct = p.age / p.maxAge;
            if (pct >= 1.0) {
              p.mesh.scale.set(0, 0, 0);
            } else {
              const sc = 1.0 + pct * 1.6;
              p.mesh.scale.set(sc, sc, sc);
              (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1.0 - pct);
            }
          }
        });
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

    const handlePetLukeEvent = () => {
      dogPetAnimTimer = 3.0; // 3 seconds of petting Luke
    };
    window.addEventListener('pet-lucky', handlePetLukeEvent);
    window.addEventListener('pet-luke', handlePetLukeEvent);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('pet-lucky', handlePetLukeEvent);
      window.removeEventListener('pet-luke', handlePetLukeEvent);
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

      // Clear flyover creatures pool on unmount
      flyoverPool.forEach((fc) => {
        scene.remove(fc.group);
      });
      flyoverPool.length = 0;
    };
  }, [gameState, selectedCharacter]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-slate-950 rounded-2xl border border-slate-800/60 shadow-2xl"
    />
  );
};

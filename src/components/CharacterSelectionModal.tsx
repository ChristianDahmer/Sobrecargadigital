import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterId, CHARACTER_PROFILES, CharacterInfo } from '../types';
import { Sparkles, Check, X, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { playButtonClickSFX } from '../utils/audio';
import { useLanguage } from '../i18n/LanguageContext';
import * as THREE from 'three';

interface CharacterSelectionModalProps {
  isOpen: boolean;
  selectedCharacter: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  onConfirm: () => void;
  onClose?: () => void;
  soundEnabled?: boolean;
}

// Helper to create a simplified sweatshirt chest logo for Guto
function createMiniGutoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0f2b5c';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PESQUISADORES', 128, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Helper to create a simplified white t-shirt chest logo for Léo
function createMiniLeoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PESQUISADORES', 128, 45);
  ctx.fillStyle = '#eab308';
  ctx.fillRect(30, 80, 196, 6);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(30, 90, 196, 6);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Helper to create a plaster cast texture for Léo's arm
function createMiniArmCastTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  for (let i = 0; i < 256; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 20, 128);
    ctx.stroke();
  }
  ctx.font = 'bold 14px cursive, sans-serif';
  ctx.fillStyle = '#16a34a';
  ctx.fillText('PESQUISA', 15, 40);
  ctx.fillStyle = '#2563eb';
  ctx.fillText('CUIDADO', 90, 85);
  ctx.fillStyle = '#ef4444';
  ctx.font = '16px sans-serif';
  ctx.fillText('❤️', 200, 35);
  ctx.fillText('❤️', 50, 105);
  ctx.fillStyle = '#eab308';
  ctx.fillText('★', 160, 105);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Helper to generate crisp, high-definition character face textures
function createCharacterFaceTexture(characterId: CharacterId): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 512);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (characterId === 'caio') {
    // --- CAIO: SHARP, CHARISMATIC & HIGH-DEFINITION FACE ---
    // 1. Sclera (Clear White Background of Eyes)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(155, 230, 44, 34, -0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(357, 230, 44, 34, 0.06, 0, Math.PI * 2);
    ctx.fill();

    // 2. Eye Outlines & Lash Line (Crisp, dark outline)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(155, 230, 44, 34, -0.06, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(357, 230, 44, 34, 0.06, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Iris (Warm Amber / Hazel Brown with Gradient)
    const irisGradientL = ctx.createRadialGradient(155, 230, 4, 155, 230, 24);
    irisGradientL.addColorStop(0, '#78350f');
    irisGradientL.addColorStop(0.7, '#451a03');
    irisGradientL.addColorStop(1, '#0f172a');
    ctx.fillStyle = irisGradientL;
    ctx.beginPath();
    ctx.arc(155, 230, 24, 0, Math.PI * 2);
    ctx.fill();

    const irisGradientR = ctx.createRadialGradient(357, 230, 4, 357, 230, 24);
    irisGradientR.addColorStop(0, '#78350f');
    irisGradientR.addColorStop(0.7, '#451a03');
    irisGradientR.addColorStop(1, '#0f172a');
    ctx.fillStyle = irisGradientR;
    ctx.beginPath();
    ctx.arc(357, 230, 24, 0, Math.PI * 2);
    ctx.fill();

    // 4. Pupils (Deep Black)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(155, 230, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(357, 230, 13, 0, Math.PI * 2);
    ctx.fill();

    // 5. Specular Highlights (Crisp light reflections)
    ctx.fillStyle = '#ffffff';
    // Primary catchlight
    ctx.beginPath();
    ctx.arc(146, 220, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(348, 220, 7.5, 0, Math.PI * 2);
    ctx.fill();
    // Secondary micro-sparkle
    ctx.beginPath();
    ctx.arc(164, 238, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(366, 238, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 6. Eyebrows (Sharply defined, stylish curly arch)
    ctx.strokeStyle = '#271c19';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(105, 175);
    ctx.quadraticCurveTo(155, 155, 205, 178);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(307, 178);
    ctx.quadraticCurveTo(357, 155, 407, 175);
    ctx.stroke();

    // 7. Refined Nose (Subtle nose bridge and curved tip)
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(242, 275);
    ctx.quadraticCurveTo(256, 288, 270, 275);
    ctx.stroke();

    // 8. Charismatic Friendly Smile
    ctx.strokeStyle = '#9f1239';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(205, 345);
    ctx.quadraticCurveTo(256, 385, 307, 345);
    ctx.stroke();

    // Subtle smile corner accents
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(202, 340);
    ctx.lineTo(208, 348);
    ctx.moveTo(310, 340);
    ctx.lineTo(304, 348);
    ctx.stroke();
  } else {
    // --- GUTO & LÉO: CLEAN HIGH-DEF EYES AND SMILE ---
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(160, 230, 42, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(352, 230, 42, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(160, 230, 42, 32, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(352, 230, 42, 32, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(160, 230, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(352, 230, 17, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(152, 222, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(344, 222, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(112, 175);
    ctx.quadraticCurveTo(160, 160, 208, 175);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(304, 175);
    ctx.quadraticCurveTo(352, 160, 400, 175);
    ctx.stroke();

    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(244, 275);
    ctx.quadraticCurveTo(256, 286, 268, 275);
    ctx.stroke();

    ctx.strokeStyle = '#9f1239';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(210, 345);
    ctx.quadraticCurveTo(256, 380, 302, 345);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Builds a single 3D character group for the previewer
function createPreviewCharacterGroup(id: CharacterId): THREE.Group {
  const charGroup = new THREE.Group();
  charGroup.position.y = -0.65;

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbd5b3, roughness: 0.38, metalness: 0.04 });
  const charcoalSneakerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.25 });
  const whiteSoleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });

  let shirtMat: THREE.Material;
  let pantsMat: THREE.Material;
  let hairMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });

  if (id === 'guto') {
    shirtMat = new THREE.MeshStandardMaterial({ color: 0x0f2b5c, roughness: 0.5, metalness: 0.08 });
    pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6, metalness: 0.05 });
    hairMat = new THREE.MeshStandardMaterial({ color: 0x5c3818, roughness: 0.5 }); // chestnut brown
  } else if (id === 'leo') {
    shirtMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.02 });
    pantsMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.65 }); // gray shorts
    hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.5 }); // dark charcoal
  } else {
    shirtMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5, metalness: 0.05 }); // green shirt
    pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.05 }); // dark pants
  }

  // Torso Base
  const torsoGeo = new THREE.BoxGeometry(0.9, 1.1, 0.55);
  const torso = new THREE.Mesh(torsoGeo, shirtMat);
  torso.position.y = 1.35;
  torso.castShadow = true;
  charGroup.add(torso);

  // Front Chest Brandings
  const logoPlaneGeo = new THREE.PlaneGeometry(0.75, 0.38);
  if (id === 'guto') {
    const gutoTex = createMiniGutoTexture();
    const logoMat = new THREE.MeshBasicMaterial({ map: gutoTex, transparent: true, polygonOffset: true, polygonOffsetFactor: -1 });
    const logo = new THREE.Mesh(logoPlaneGeo, logoMat);
    logo.position.set(0, 1.45, 0.28);
    charGroup.add(logo);
  } else if (id === 'leo') {
    const leoTex = createMiniLeoTexture();
    const logoMat = new THREE.MeshBasicMaterial({ map: leoTex, transparent: true, polygonOffset: true, polygonOffsetFactor: -1 });
    const logo = new THREE.Mesh(logoPlaneGeo, logoMat);
    logo.position.set(0, 1.45, 0.28);
    charGroup.add(logo);
  }

  // Caio's Open Blue Jacket Flaps
  if (id === 'caio') {
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.45, metalness: 0.1 });
    const leftFlapGeo = new THREE.BoxGeometry(0.24, 1.12, 0.18);
    const leftFlap = new THREE.Mesh(leftFlapGeo, jacketMat);
    leftFlap.position.set(-0.35, 1.35, 0.24);
    charGroup.add(leftFlap);

    const rightFlapGeo = new THREE.BoxGeometry(0.24, 1.12, 0.18);
    const rightFlap = new THREE.Mesh(rightFlapGeo, jacketMat);
    rightFlap.position.set(0.35, 1.35, 0.24);
    charGroup.add(rightFlap);

    const backJacketGeo = new THREE.BoxGeometry(0.92, 1.12, 0.1);
    const backJacket = new THREE.Mesh(backJacketGeo, jacketMat);
    backJacket.position.set(0, 1.35, -0.24);
    charGroup.add(backJacket);
  }

  // Head
  const headGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.set(0, 2.25, 0);
  head.castShadow = true;
  charGroup.add(head);

  // High-Resolution Crisp Face Plane
  const faceTex = createCharacterFaceTexture(id);
  const facePlaneGeo = new THREE.PlaneGeometry(0.58, 0.58);
  const faceMat = new THREE.MeshBasicMaterial({
    map: faceTex,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const facePlane = new THREE.Mesh(facePlaneGeo, faceMat);
  facePlane.position.set(0, 2.25, 0.31);
  charGroup.add(facePlane);

  // Hair Style
  if (id === 'caio') {
    // --- CAIO's VOLUMINOUS & DEFINED CURLY HAIR ---
    const curlyHairGroup = new THREE.Group();
    curlyHairGroup.position.set(0, 2.25, 0);

    const darkCurlMat = new THREE.MeshStandardMaterial({ color: 0x1c1410, roughness: 0.88 });
    const caramelHighlightMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6, metalness: 0.2 });
    const goldenHighlightMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5, metalness: 0.25 });

    // Procedural multi-layer structured curly clusters
    const curlClusters: { x: number; y: number; z: number; r: number; colorType: 'dark' | 'caramel' | 'golden' }[] = [];

    // 1. Crown / Top Dome curls
    const crownRings = 4;
    for (let cr = 0; cr < crownRings; cr++) {
      const radius = 0.28 + cr * 0.04;
      const count = 7 + cr * 3;
      for (let c = 0; c < count; c++) {
        const angle = (c / count) * Math.PI * 2;
        const x = Math.cos(angle) * (radius * 0.9);
        const z = Math.sin(angle) * (radius * 0.95);
        const y = 0.28 + Math.sin(c * 1.7) * 0.04 + (cr === 0 ? 0.08 : 0.02);
        const rand = (c + cr) % 5;
        const colorType = rand === 0 ? 'golden' : rand === 1 ? 'caramel' : 'dark';
        curlClusters.push({ x, y, z: z - 0.03, r: 0.095, colorType });
      }
    }

    // 2. Forehead Fringe / Curly Bangs (framing the face naturally)
    const bangs = [-0.18, -0.09, 0, 0.09, 0.18];
    bangs.forEach((bx, idx) => {
      const by = 0.24 - Math.abs(bx) * 0.15;
      const bz = 0.32 - Math.abs(bx) * 0.05;
      curlClusters.push({ x: bx, y: by, z: bz, r: 0.085, colorType: idx % 2 === 0 ? 'caramel' : 'golden' });
    });

    // 3. Side Curls & Temples
    [-0.32, 0.32].forEach((sx, sIdx) => {
      for (let sy = 0; sy < 4; sy++) {
        const y = 0.18 - sy * 0.08;
        const z = 0.08 + (sy % 2) * 0.08;
        curlClusters.push({ x: sx, y, z, r: 0.088, colorType: sIdx === 0 && sy === 1 ? 'caramel' : 'dark' });
      }
    });

    // 4. Back Volume
    for (let by = -0.05; by <= 0.22; by += 0.09) {
      for (let bx = -0.22; bx <= 0.22; bx += 0.11) {
        curlClusters.push({ x: bx, y: by, z: -0.32, r: 0.095, colorType: 'dark' });
      }
    }

    // Instantiate geometries
    curlClusters.forEach((c) => {
      const mat = c.colorType === 'golden' ? goldenHighlightMat : c.colorType === 'caramel' ? caramelHighlightMat : darkCurlMat;
      const curlMesh = new THREE.Mesh(new THREE.SphereGeometry(c.r, 8, 8), mat);
      curlMesh.position.set(c.x, c.y, c.z);
      curlMesh.scale.set(1.05, 0.95, 1.05);
      curlyHairGroup.add(curlMesh);
    });

    charGroup.add(curlyHairGroup);
  } else {
    // Dome Hair Top for Guto & Léo
    const hairDomeGeo = new THREE.SphereGeometry(0.35, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const hairDome = new THREE.Mesh(hairDomeGeo, hairMat);
    hairDome.position.set(0, 2.45, -0.02);
    charGroup.add(hairDome);

    // Simple hair strands
    const strandGeo = new THREE.ConeGeometry(0.08, 0.35, 4);
    strandGeo.rotateX(Math.PI);
    for (let i = -2; i <= 2; i++) {
      const strand = new THREE.Mesh(strandGeo, hairMat);
      strand.position.set(i * 0.09, 2.44, 0.3);
      strand.rotation.z = i * 0.1;
      charGroup.add(strand);
    }
  }

  // Arms
  const upperArmGeo = new THREE.BoxGeometry(0.3, 0.55, 0.3);
  const lowerArmGeo = new THREE.BoxGeometry(0.28, 0.5, 0.28);

  const armSleeveMat = shirtMat;
  const armSkinMat = (id === 'guto') ? shirtMat : skinMat;

  // Left Arm
  const leftUpperArm = new THREE.Mesh(upperArmGeo, armSleeveMat);
  leftUpperArm.position.set(-0.62, 1.5, 0);
  leftUpperArm.castShadow = true;
  charGroup.add(leftUpperArm);

  const leftLowerArm = new THREE.Mesh(lowerArmGeo, armSkinMat);
  leftLowerArm.position.set(-0.62, 1.05, 0);
  leftLowerArm.castShadow = true;
  charGroup.add(leftLowerArm);

  // Right Arm
  const rightUpperArm = new THREE.Mesh(upperArmGeo, armSleeveMat);
  rightUpperArm.position.set(0.62, 1.5, 0);
  rightUpperArm.castShadow = true;
  charGroup.add(rightUpperArm);

  // Dynamic right arm accessory (plaster cast for Léo)
  if (id === 'leo') {
    const castTex = createMiniArmCastTexture();
    const castMat = new THREE.MeshStandardMaterial({ map: castTex, roughness: 0.75 });
    const rightLowerCast = new THREE.Mesh(lowerArmGeo, castMat);
    rightLowerCast.position.set(0.62, 1.05, 0);
    rightLowerCast.castShadow = true;
    charGroup.add(rightLowerCast);
  } else {
    const rightLowerArm = new THREE.Mesh(lowerArmGeo, armSkinMat);
    rightLowerArm.position.set(0.62, 1.05, 0);
    rightLowerArm.castShadow = true;
    charGroup.add(rightLowerArm);
  }

  // Caio's Coffee Mug in hand
  if (id === 'caio') {
    const mugGroup = new THREE.Group();
    const mugBodyGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.22, 10);
    const mugMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 });
    const mugBody = new THREE.Mesh(mugBodyGeo, mugMat);
    mugGroup.add(mugBody);

    const handleGeo = new THREE.TorusGeometry(0.06, 0.02, 4, 8);
    const handle = new THREE.Mesh(handleGeo, mugMat);
    handle.position.set(0.1, 0, 0);
    mugGroup.add(handle);

    const coffeeGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.01, 8);
    const coffeeMat = new THREE.MeshBasicMaterial({ color: 0x3b2314 });
    const coffee = new THREE.Mesh(coffeeGeo, coffeeMat);
    coffee.position.y = 0.1;
    mugGroup.add(coffee);

    mugGroup.position.set(0.62, 0.72, 0.08);
    charGroup.add(mugGroup);
  }

  // Legs
  const upperLegGeo = new THREE.BoxGeometry(0.36, 0.6, 0.36);
  const lowerLegGeo = new THREE.BoxGeometry(0.34, 0.58, 0.34);

  const legSkinMat = (id === 'leo') ? skinMat : pantsMat;

  // Left Leg
  const leftUpperLeg = new THREE.Mesh(upperLegGeo, pantsMat);
  leftUpperLeg.position.set(-0.25, 0.5, 0);
  leftUpperLeg.castShadow = true;
  charGroup.add(leftUpperLeg);

  const leftLowerLeg = new THREE.Mesh(lowerLegGeo, legSkinMat);
  leftLowerLeg.position.set(-0.25, -0.05, 0);
  leftLowerLeg.castShadow = true;
  charGroup.add(leftLowerLeg);

  // Right Leg
  const rightUpperLeg = new THREE.Mesh(upperLegGeo, pantsMat);
  rightUpperLeg.position.set(0.25, 0.5, 0);
  rightUpperLeg.castShadow = true;
  charGroup.add(rightUpperLeg);

  const rightLowerLeg = new THREE.Mesh(lowerLegGeo, legSkinMat);
  rightLowerLeg.position.set(0.25, -0.05, 0);
  rightLowerLeg.castShadow = true;
  charGroup.add(rightLowerLeg);

  // Sneakers
  const shoeGeo = new THREE.BoxGeometry(0.36, 0.18, 0.5);
  const soleGeo = new THREE.BoxGeometry(0.38, 0.06, 0.52);

  const sneakerL = new THREE.Mesh(shoeGeo, charcoalSneakerMat);
  sneakerL.position.set(-0.25, -0.42, 0.06);
  charGroup.add(sneakerL);
  const soleL = new THREE.Mesh(soleGeo, whiteSoleMat);
  soleL.position.set(-0.25, -0.52, 0.06);
  charGroup.add(soleL);

  const sneakerR = new THREE.Mesh(shoeGeo, charcoalSneakerMat);
  sneakerR.position.set(0.25, -0.42, 0.06);
  charGroup.add(sneakerR);
  const soleR = new THREE.Mesh(soleGeo, whiteSoleMat);
  soleR.position.set(0.25, -0.52, 0.06);
  charGroup.add(soleR);

  // --- 3D PET DOG PROP (LÉO: PINSCHER LUKE) ---
  if (id === 'leo') {
    const dogGroup = new THREE.Group();

    // Materials
    const dpFurMat = new THREE.MeshStandardMaterial({ color: 0xc05621, roughness: 0.5 }); // Pinscher Caramel
    const dpTummyMat = new THREE.MeshStandardMaterial({ color: 0xf6ad55, roughness: 0.6 });
    const dpEyeMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.1 });
    const dpCollarMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.2 });
    const dpTagMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 });

    // Body
    const dpBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.8), dpFurMat);
    dpBody.position.set(0, 0.35, 0);
    dogGroup.add(dpBody);

    const dpBelly = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.7), dpTummyMat);
    dpBelly.position.set(0, 0.22, 0);
    dogGroup.add(dpBelly);

    // Neck
    const dpNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.32, 8), dpFurMat);
    dpNeck.position.set(0, 0.58, 0.28);
    dpNeck.rotation.x = 0.25;
    dogGroup.add(dpNeck);

    // Head
    const dpHeadGroup = new THREE.Group();
    dpHeadGroup.position.set(0, 0.82, 0.38);

    const dpHeadMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.42), dpFurMat);
    dpHeadGroup.add(dpHeadMesh);

    const dpSnout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.25), dpTummyMat);
    dpSnout.position.set(0, -0.05, 0.23);
    dpHeadGroup.add(dpSnout);

    const dpNose = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.07), dpEyeMat);
    dpNose.position.set(0, -0.01, 0.34);
    dpHeadGroup.add(dpNose);

    // Ears
    const dpEarGeo = new THREE.ConeGeometry(0.1, 0.38, 4);
    const dpEarL = new THREE.Mesh(dpEarGeo, dpTummyMat);
    dpEarL.position.set(-0.2, 0.28, 0);
    dpEarL.rotation.set(-0.1, 0, -0.2);
    dpHeadGroup.add(dpEarL);

    const dpEarR = new THREE.Mesh(dpEarGeo, dpTummyMat);
    dpEarR.position.set(0.2, 0.28, 0);
    dpEarR.rotation.set(-0.1, 0, 0.2);
    dpHeadGroup.add(dpEarR);

    // Eyes
    const dpEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), dpEyeMat);
    dpEyeL.position.set(-0.12, 0.07, 0.2);
    dpHeadGroup.add(dpEyeL);

    const dpEyeR = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), dpEyeMat);
    dpEyeR.position.set(0.12, 0.07, 0.2);
    dpHeadGroup.add(dpEyeR);

    dogGroup.add(dpHeadGroup);

    // Collar & Tag
    const dpCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.05, 8), dpCollarMat);
    dpCollar.position.set(0, 0.62, 0.3);
    dpCollar.rotation.x = 0.25;
    dogGroup.add(dpCollar);

    const dpTag = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), dpTagMat);
    dpTag.position.set(0, 0.56, 0.4);
    dpTag.rotation.x = Math.PI / 2;
    dogGroup.add(dpTag);

    // Tail
    const dpTail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.02, 0.4, 8), dpFurMat);
    dpTail.position.set(0, 0.55, -0.42);
    dpTail.rotation.x = -0.8;
    dogGroup.add(dpTail);

    // Legs
    const dpLegGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.38, 8);
    const dpFL = new THREE.Mesh(dpLegGeo, dpFurMat);
    dpFL.position.set(-0.18, 0.02, 0.22);
    dogGroup.add(dpFL);

    const dpFR = new THREE.Mesh(dpLegGeo, dpFurMat);
    dpFR.position.set(0.18, 0.02, 0.22);
    dogGroup.add(dpFR);

    const dpBL = new THREE.Mesh(dpLegGeo, dpFurMat);
    dpBL.position.set(-0.18, 0.02, -0.22);
    dogGroup.add(dpBL);

    const dpBR = new THREE.Mesh(dpLegGeo, dpFurMat);
    dpBR.position.set(0.18, 0.02, -0.22);
    dogGroup.add(dpBR);

    dogGroup.scale.set(0.85, 0.85, 0.85);
    dogGroup.position.set(0.85, -0.25, 0.2); // Positioned beside Léo
    dogGroup.rotation.y = -0.35;
    charGroup.add(dogGroup);
  }

  return charGroup;
}

// High-Performance 3D Viewer with persistent WebGLRenderer and 0ms character swapping
const Character3DViewer: React.FC<{ characterId: CharacterId }> = ({ characterId }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const charModelsRef = useRef<{ [key in CharacterId]?: THREE.Group }>({});
  const backLightRef = useRef<THREE.DirectionalLight | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    container.innerHTML = '';

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 210;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d); // Deep slate background

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 1.75, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.15);
    dirLight.position.set(3, 5, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const initialRimColor = characterId === 'guto' ? 0x3b82f6 : (characterId === 'leo' ? 0xf43f5e : 0x10b981);
    const backLight = new THREE.DirectionalLight(initialRimColor, 0.85);
    backLight.position.set(-3, 3, -3);
    scene.add(backLight);
    backLightRef.current = backLight;

    // Subtle ground shadow plane
    const groundGeo = new THREE.CircleGeometry(1.6, 32);
    const groundMat = new THREE.MeshBasicMaterial({ color: 0x050811, transparent: true, opacity: 0.7 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -1.22;
    scene.add(groundMesh);

    // 3. Pre-instantiate all 3 character models in a master rotating pivot group
    const masterPivot = new THREE.Group();
    scene.add(masterPivot);

    const gutoGroup = createPreviewCharacterGroup('guto');
    const leoGroup = createPreviewCharacterGroup('leo');
    const caioGroup = createPreviewCharacterGroup('caio');

    masterPivot.add(gutoGroup);
    masterPivot.add(leoGroup);
    masterPivot.add(caioGroup);

    charModelsRef.current = {
      guto: gutoGroup,
      leo: leoGroup,
      caio: caioGroup,
    };

    // Initial visibility
    gutoGroup.visible = characterId === 'guto';
    leoGroup.visible = characterId === 'leo';
    caioGroup.visible = characterId === 'caio';

    // 4. Animation loop
    let animationFrameId: number;
    const animate = () => {
      masterPivot.rotation.y += 0.012; // relaxing continuous rotation
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // 5. Handle resizing cleanly
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 210;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      scene.clear();
      renderer.dispose();
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []); // Run only once on mount!

  // Instantaneous 0ms update when characterId prop changes
  useEffect(() => {
    const models = charModelsRef.current;
    if (models.guto) models.guto.visible = characterId === 'guto';
    if (models.leo) models.leo.visible = characterId === 'leo';
    if (models.caio) models.caio.visible = characterId === 'caio';

    if (backLightRef.current) {
      const rimColor = characterId === 'guto' ? 0x3b82f6 : (characterId === 'leo' ? 0xf43f5e : 0x10b981);
      backLightRef.current.color.setHex(rimColor);
    }
  }, [characterId]);

  return (
    <div
      ref={mountRef}
      className="w-full h-48 sm:h-56 bg-slate-950/60 rounded-xl overflow-hidden border border-slate-800 relative shadow-inner"
    />
  );
};

export const CharacterSelectionModal: React.FC<CharacterSelectionModalProps> = ({
  isOpen,
  selectedCharacter,
  onSelectCharacter,
  onConfirm,
  onClose,
  soundEnabled = true,
}) => {
  const [previewCharacter, setPreviewCharacter] = React.useState<CharacterId>(selectedCharacter);

  React.useEffect(() => {
    if (isOpen) {
      setPreviewCharacter(selectedCharacter);
    }
  }, [isOpen, selectedCharacter]);

  // Keyboard navigation for smooth arrow keys cycling
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirmClick();
      } else if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, previewCharacter]);

  if (!isOpen) return null;

  const { t } = useLanguage();
  const characterIds: CharacterId[] = ['guto', 'leo', 'caio'];
  const currentIndex = characterIds.indexOf(previewCharacter);
  const currentChar: CharacterInfo = CHARACTER_PROFILES[previewCharacter] || CHARACTER_PROFILES['guto'];

  const handlePrev = () => {
    if (soundEnabled) playButtonClickSFX(true);
    const prevIndex = (currentIndex - 1 + characterIds.length) % characterIds.length;
    setPreviewCharacter(characterIds[prevIndex]);
  };

  const handleNext = () => {
    if (soundEnabled) playButtonClickSFX(true);
    const nextIndex = (currentIndex + 1) % characterIds.length;
    setPreviewCharacter(characterIds[nextIndex]);
  };

  const handleConfirmClick = () => {
    if (soundEnabled) playButtonClickSFX(true);
    onSelectCharacter(previewCharacter);
    onConfirm();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-[440px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase">
                {t('char.select', 'Selecione o Personagem')}
              </h3>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Carousel Selector Body */}
          <div className="relative p-4 flex flex-col items-center overflow-y-auto">
            {/* Carousel Side Controls */}
            <button
              onClick={handlePrev}
              className="absolute left-2.5 top-[28%] -translate-y-1/2 w-9 h-9 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 hover:border-slate-500 shadow-md transition-all active:scale-90 z-20"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5.5 h-5.5 stroke-[2.5]" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-2.5 top-[28%] -translate-y-1/2 w-9 h-9 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 hover:border-slate-500 shadow-md transition-all active:scale-90 z-20"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5.5 h-5.5 stroke-[2.5]" />
            </button>

            {/* Live 3D Rotating Character Viewer - Persistent 60FPS WebGL canvas with 0ms switching */}
            <div className="w-full mb-3 px-1 relative">
              <Character3DViewer characterId={currentChar.id} />
              <div className="absolute top-2.5 right-3 bg-slate-900/90 border border-slate-700/80 px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest text-cyan-400 uppercase pointer-events-none">
                3D Live: {currentChar.name}
              </div>
              {currentChar.id === 'leo' && (
                <div className="absolute bottom-2.5 left-3 bg-amber-950/90 border border-amber-500/70 px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-300 flex items-center gap-1.5 shadow-xl animate-bounce pointer-events-none">
                  <span>🐕</span>
                  <span>Luke (Pinscher Caramelo)</span>
                </div>
              )}
            </div>

            {/* Character Details */}
            <motion.div
              key={currentChar.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              className="text-center w-full px-1"
            >
              <span className="inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700/60 mb-1">
                {t(`char.${currentChar.id}Badge`, currentChar.badge)}
              </span>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                <span>{currentChar.name}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: currentChar.avatarColor }}
                />
              </h2>
              <p className="text-amber-400 text-xs font-semibold mt-0.5">
                {t(`char.${currentChar.id}Title`, currentChar.clothingTitle)}
              </p>

              {/* Description */}
              <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-left">
                {t(`char.${currentChar.id}Bio`, currentChar.bio)}
              </p>

              {/* Special Skills / Perks */}
              <div className="mt-2.5 w-full text-left bg-slate-800/40 border border-slate-800 rounded-xl p-3">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {t('charSelect.specialSkills', 'Habilidades Especiais:')}
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {currentChar.perks.map((perk, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-emerald-300 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{t(`char.${currentChar.id}Perk${i + 1}`, perk)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={handleConfirmClick}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              {t('charSelect.confirm', 'Iniciar com')} {currentChar.name}
            </button>
            <div className="text-[9px] text-slate-500 text-center">
              {t('charSelect.arrowsHint', 'Use as setas para alternar entre os personagens')}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const fs = require('fs');
let code = fs.readFileSync('src/components/ThreeCanvas.tsx', 'utf8');

const buracoReplacement = `      } else if (type === 'Buraco') {
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
        const signTex = createNeonTextTexture('ERRO 404', '#ef4444', 'transparent');
        const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
        const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), signMat);
        signMesh.position.set(0, 1.5, 0);
        group.add(signMesh);`;

const paredReplacement = `      } else if (type === 'PequenaPared') {
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

        const signTex = createNeonTextTexture('FIREWALL', '#60a5fa', '#0f172a');
        const signMat = new THREE.MeshBasicMaterial({ map: signTex });
        const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.75), signMat);
        signMesh.position.set(0, 1.6, 0.61);
        group.add(signMesh);
        
        const signMeshBack = signMesh.clone();
        signMeshBack.position.set(0, 1.6, -0.61);
        signMeshBack.rotation.y = Math.PI;
        group.add(signMeshBack);`;

const coneReplacement = `      } else if (type === 'Cone') {
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
        const signTex = createNeonTextTexture('!', '#f97316', 'transparent');
        const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
        const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), signMat);
        signMesh.position.y = 2.4;
        group.add(signMesh);`;

const cavaleteReplacement = `      } else if (type === 'Cavalete') {
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
        const signTex = createNeonTextTexture('ACESSO NEGADO', '#facc15', '#0f172a');
        const signMat = new THREE.MeshBasicMaterial({ map: signTex });
        const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), signMat);
        signMesh.position.set(0, 0.9, 0.15);
        group.add(signMesh);

        const signMeshBack = signMesh.clone();
        signMeshBack.position.set(0, 0.9, -0.15);
        signMeshBack.rotation.y = Math.PI;
        group.add(signMeshBack);`;

const cilindroReplacement = `      } else if (type === 'Cilindro') {
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
        group.add(signMesh);`;

// Let's do simple regex replacements for the blocks
code = code.replace(/      } else if \(type === 'Buraco'\) \{[\s\S]*?(?=      } else if \(type === 'PequenaPared'\) \{)/, buracoReplacement + '\n');
code = code.replace(/      } else if \(type === 'PequenaPared'\) \{[\s\S]*?(?=      } else if \(type === 'Cone'\) \{)/, paredReplacement + '\n');
code = code.replace(/      } else if \(type === 'Cone'\) \{[\s\S]*?(?=      } else if \(type === 'Cavalete'\) \{)/, coneReplacement + '\n');
code = code.replace(/      } else if \(type === 'Cavalete'\) \{[\s\S]*?(?=      } else if \(type === 'Cilindro'\) \{)/, cavaleteReplacement + '\n');
code = code.replace(/      } else if \(type === 'Cilindro'\) \{[\s\S]*?(?=      } else if \(type === 'Remedio'\) \{)/, cilindroReplacement + '\n');

fs.writeFileSync('src/components/ThreeCanvas.tsx', code);
console.log('Replaced obstacle meshes successfully.');

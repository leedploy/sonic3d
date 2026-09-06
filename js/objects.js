// Interactive Game Objects: Golden Rings, Spring Pads, Dash Pads, Spikes, and Giant Goal Ring

class ObjectManager {
    constructor(scene, world = null) {
        this.scene = scene;
        this.world = world;
        this.rings = [];
        this.springs = [];
        this.dashPads = [];
        this.spikes = [];
        this.starPosts = [];
        this.scatteredRings = [];
        this.goalRing = null;
        this.sparkles = [];

        this.initMaterials();
        this.initRingFXPools();
        this.loadStageObjects('green_hill');
    }

    initMaterials() {
        this.goldMat = new THREE.MeshStandardMaterial({
            color: 0xffd000,
            metalness: 0.85,
            roughness: 0.2,
            emissive: 0x443000
        });

        this.springRedMat = new THREE.MeshLambertMaterial({ color: 0xee2222 });
        this.springYellowMat = new THREE.MeshLambertMaterial({ color: 0xffd800 });
        this.spikeMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.9, roughness: 0.3 });

        // Star Post Checkpoint Materials
        this.postPoleMat = new THREE.MeshStandardMaterial({
            color: 0xd0d0d8,
            metalness: 0.85,
            roughness: 0.25
        });
        this.postOrbBlueMat = new THREE.MeshStandardMaterial({
            color: 0x1188ff,
            emissive: 0x0044bb,
            metalness: 0.4,
            roughness: 0.2
        });
        this.postOrbRedMat = new THREE.MeshStandardMaterial({
            color: 0xff2222,
            emissive: 0xdd1100,
            metalness: 0.5,
            roughness: 0.2
        });
        this.postStarGoldMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0x664400,
            metalness: 0.8,
            roughness: 0.2
        });
    }

    initRingFXPools() {
        this.shockwavePool = [];
        this.sparklePool = [];
        this.lastShockwaveTime = 0;

        // 1. Sleek Compact Shockwave Pool (15 instances)
        // Reduced radius from 0.7 -> 0.38, tube from 0.05 -> 0.02
        const shockGeo = new THREE.TorusGeometry(0.38, 0.02, 8, 24);
        for (let i = 0; i < 15; i++) {
            const shockMat = new THREE.MeshBasicMaterial({
                color: 0xffea33,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const mesh = new THREE.Mesh(shockGeo, shockMat);
            mesh.visible = false;
            this.scene.add(mesh);
            this.shockwavePool.push({
                mesh: mesh,
                material: shockMat,
                active: false,
                life: 0,
                maxLife: 0.14,      // Quick crisp 140ms pop (no lingering glare)
                startScale: 0.45,
                targetScale: 1.15   // Compact (1.15m max, down from 3.2m!)
            });
        }

        // 2. Delicate Flank Sparkle Particle Pool (60 instances)
        // Halved particle size from 0.13 -> 0.065
        const sparkleGeo = new THREE.OctahedronGeometry(0.065, 0);
        for (let i = 0; i < 60; i++) {
            const isAltColor = (i % 3 === 0);
            const sparkleMat = new THREE.MeshBasicMaterial({
                color: isAltColor ? 0x64ffda : 0xffe838,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const mesh = new THREE.Mesh(sparkleGeo, sparkleMat);
            mesh.visible = false;
            this.scene.add(mesh);
            this.sparklePool.push({
                mesh: mesh,
                material: sparkleMat,
                active: false,
                life: 0,
                maxLife: 0.22,      // Fast 220ms dissipation
                vx: 0,
                vy: 0,
                vz: 0,
                rotX: 0,
                rotY: 0,
                rotZ: 0,
                baseScale: 1.0
            });
        }
    }

    spawnRingCollectFX(x, y, z) {
        const now = performance.now();

        // 1. Sleek Compact Shockwave (Throttled to max 1 per 90ms to prevent blinding glare when rushing through rows)
        if (now - this.lastShockwaveTime > 90) {
            this.lastShockwaveTime = now;
            const sw = this.shockwavePool.find(item => !item.active);
            if (sw) {
                sw.active = true;
                sw.life = sw.maxLife;
                sw.mesh.position.set(x, y, z);
                // Orient slightly tilted horizontally so it doesn't form a bullseye blocking forward vision
                sw.mesh.rotation.set(
                    Math.PI * 0.42,
                    0,
                    (Math.random() - 0.5) * 0.5
                );
                sw.mesh.scale.set(sw.startScale, sw.startScale, sw.startScale);
                sw.material.opacity = 0.45; // Soft opacity (down from 1.0)
                sw.mesh.visible = true;
            }
        }

        // 2. Lateral Flank Sparkles (Sliding/bursting OUTWARD to left and right flanks!)
        // 6 delicate particles that fan out laterally like speedboat wake, leaving center view 100% clear
        const count = 6;
        for (let i = 0; i < count; i++) {
            const sp = this.sparklePool.find(item => !item.active);
            if (!sp) break;

            sp.active = true;
            const duration = 0.16 + Math.random() * 0.08;
            sp.life = duration;
            sp.maxLife = duration;

            // Alternate side: left (-1) or right (+1)
            const side = (i % 2 === 0) ? -1 : 1;
            // Spawn slightly offset to flanks
            sp.mesh.position.set(x + side * 0.35, y, z);

            // Flank burst velocities:
            // High lateral velocity (vx) pushing away from center
            sp.vx = side * (4.2 + Math.random() * 4.0);
            // Gentle vertical float
            sp.vy = (Math.random() - 0.15) * 2.2;
            // Backward slipstream drift
            sp.vz = 2.0 + Math.random() * 4.0;

            sp.rotX = (Math.random() - 0.5) * 20.0;
            sp.rotY = (Math.random() - 0.5) * 20.0;
            sp.rotZ = (Math.random() - 0.5) * 20.0;

            const scale = 0.7 + Math.random() * 0.5;
            sp.baseScale = scale;
            sp.mesh.scale.set(scale, scale, scale);
            sp.material.opacity = 0.65;
            sp.mesh.visible = true;
        }
    }

    updateRingFX(dt) {
        // 1. Update Shockwaves (Fast fade & compact expansion)
        for (let i = 0; i < this.shockwavePool.length; i++) {
            const sw = this.shockwavePool[i];
            if (!sw.active) continue;

            sw.life -= dt;
            if (sw.life <= 0) {
                sw.active = false;
                sw.mesh.visible = false;
            } else {
                const progress = 1.0 - (sw.life / sw.maxLife);
                const curScale = THREE.MathUtils.lerp(sw.startScale, sw.targetScale, Math.pow(progress, 0.6));
                sw.mesh.scale.set(curScale, curScale, curScale);
                // Soft fade out
                sw.material.opacity = Math.max(0, 0.45 * (1.0 - Math.pow(progress, 1.8)));
            }
        }

        // 2. Update Sparkles (Lateral drift & smooth dissolution)
        for (let i = 0; i < this.sparklePool.length; i++) {
            const sp = this.sparklePool[i];
            if (!sp || !sp.active) continue;

            sp.life -= dt;
            if (sp.life <= 0) {
                sp.active = false;
                sp.mesh.visible = false;
            } else {
                const progress = 1.0 - (sp.life / sp.maxLife);
                sp.mesh.position.x += sp.vx * dt;
                sp.mesh.position.y += sp.vy * dt;
                sp.mesh.position.z += sp.vz * dt;

                // Air drag
                sp.vx *= 0.92;
                sp.vy = (sp.vy * 0.92) + (0.8 * dt);
                sp.vz *= 0.92;

                sp.mesh.rotation.x += sp.rotX * dt;
                sp.mesh.rotation.y += sp.rotY * dt;
                sp.mesh.rotation.z += sp.rotZ * dt;

                const curScale = sp.baseScale * Math.max(0, 1.0 - (progress * progress));
                sp.mesh.scale.set(curScale, curScale, curScale);
                sp.material.opacity = Math.max(0, 0.65 * (1.0 - progress));
            }
        }
    }

    resetRingFX() {
        if (this.shockwavePool) {
            this.shockwavePool.forEach(sw => {
                sw.active = false;
                sw.mesh.visible = false;
            });
        }
        if (this.sparklePool) {
            this.sparklePool.forEach(sp => {
                sp.active = false;
                sp.mesh.visible = false;
            });
        }
    }

    clearObjects() {
        const removeGroup = (arr) => {
            if (!arr) return;
            arr.forEach(item => {
                const obj = item.mesh || item;
                if (obj && obj.parent) {
                    obj.parent.remove(obj);
                } else if (obj) {
                    this.scene.remove(obj);
                }
            });
        };

        removeGroup(this.rings);
        removeGroup(this.springs);
        removeGroup(this.dashPads);
        removeGroup(this.spikes);
        removeGroup(this.starPosts);
        removeGroup(this.scatteredRings);

        if (this.goalRing && this.goalRing.group) {
            this.scene.remove(this.goalRing.group);
        }

        this.rings = [];
        this.springs = [];
        this.dashPads = [];
        this.spikes = [];
        this.starPosts = [];
        this.scatteredRings = [];
        this.goalRing = null;
    }

    loadStageObjects(stageId = 'green_hill') {
        this.clearObjects();
        this.currentStageId = stageId;

        if (stageId === 'chemical_plant') {
            this.spawnChemicalPlantObjects();
        } else if (stageId === 'hydrocity') {
            this.spawnHydrocityObjects();
        } else {
            this.spawnGreenHillObjects();
        }
    }

    spawnObjectsAlongTrack() {
        this.loadStageObjects('green_hill');
    }

    getSafeGroundY(x, z, fallbackY = 0.1) {
        const world = this.world || (window.game && window.game.world);
        if (world && world.getGroundHeight) {
            const gy = world.getGroundHeight(x, z);
            if (gy > -40) return gy + 0.1;
        }
        return fallbackY;
    }

    getSafeRingY(x, z, fallbackY = 1.8) {
        const world = this.world || (window.game && window.game.world);
        if (world && world.getGroundHeight) {
            const gy = world.getGroundHeight(x, z);
            if (gy > -40) return gy + 1.35;
        }
        return fallbackY;
    }

    spawnLoopRings(centerZ, radius = 16, groundY = 4, count = 8) {
        this.createLoopRings(0, groundY, centerZ, radius, -2.5, 2.5, count);
    }

    spawnChemicalPlantObjects() {
        // ========================================================
        // STAGE 2: CHEMICAL PLANT ZONE OBJECT PLACEMENT (4,800m)
        // ========================================================

        // --- 1. GOLDEN RINGS ---
        const chemRings = [
            // Starting Highway (z: 10 to -120)
            { startZ: -10, count: 6, spacing: 5, x: 0 },
            { startZ: -50, count: 8, spacing: 4.5, x: -4 },
            { startZ: -50, count: 8, spacing: 4.5, x: 4 },

            // Inside Glass Booster Tube #1 (z: -140 to -380, Warp Conduit)
            { startZ: -150, count: 12, spacing: 5.5, x: 0 },
            { startZ: -230, count: 10, spacing: 5.5, x: -2.5 },
            { startZ: -230, count: 10, spacing: 5.5, x: 2.5 },
            { startZ: -300, count: 12, spacing: 5.0, x: 0 },

            // Climbing Ramp over Mega Mack (z: -380 to -540)
            { startZ: -390, count: 16, spacing: 6.0, x: 0 },

            // High Skyway Catwalk (z: -540 to -680)
            { startZ: -550, count: 8, spacing: 5.5, x: -4 },
            { startZ: -550, count: 8, spacing: 5.5, x: 4 },
            { startZ: -610, count: 10, spacing: 5.0, x: 0 },

            // Steep Thrill Drop (z: -680 to -780)
            { startZ: -690, count: 12, spacing: 6.0, x: 0 },

            // Approach to Loop 1 & Loop 2 (z: -800 to -1150)
            { startZ: -800, count: 6, spacing: 4.5, x: 0 },
            { startZ: -920, count: 8, spacing: 5.0, x: 0 },
            { startZ: -1020, count: 6, spacing: 4.5, x: 0 },
            { startZ: -1120, count: 8, spacing: 5.0, x: 0 },

            // Low Bridge over Mega Mack (z: -1240 to -1540)
            { startZ: -1250, count: 14, spacing: 6.0, x: -3 },
            { startZ: -1250, count: 14, spacing: 6.0, x: 3 },
            { startZ: -1360, count: 18, spacing: 5.5, x: 0 },

            // Spiral Tower Climb (z: -1550 to -1750)
            { startZ: -1560, count: 16, spacing: 6.5, x: 0 },

            // Inside Glass Booster Tube #2 (z: -1760 to -2140)
            { startZ: -1770, count: 14, spacing: 5.0, x: 0 },
            { startZ: -1860, count: 12, spacing: 5.5, x: -2.5 },
            { startZ: -1860, count: 12, spacing: 5.5, x: 2.5 },
            { startZ: -1950, count: 16, spacing: 5.0, x: 0 },
            { startZ: -2050, count: 12, spacing: 5.0, x: 0 },

            // Split Catwalks (z: -2160 to -2440)
            { startZ: -2180, count: 12, spacing: 6.0, x: -12 },
            { startZ: -2180, count: 12, spacing: 6.0, x: 12 },
            { startZ: -2320, count: 10, spacing: 5.5, x: 0 },

            // Mega Mack Spillway & Coaster Drop (z: -2460 to -2840)
            { startZ: -2480, count: 16, spacing: 6.0, x: 0 },
            { startZ: -2620, count: 14, spacing: 5.5, x: -4 },
            { startZ: -2620, count: 14, spacing: 5.5, x: 4 },

            // Chemical Superhighway Sprint (z: -2860 to -4000)
            // 3-lane trails of speed rings
            { startZ: -2880, count: 20, spacing: 5.0, x: 0 },
            { startZ: -3000, count: 20, spacing: 5.0, x: -8 },
            { startZ: -3000, count: 20, spacing: 5.0, x: 8 },
            { startZ: -3150, count: 24, spacing: 5.0, x: 0 },
            { startZ: -3300, count: 22, spacing: 5.0, x: -6 },
            { startZ: -3300, count: 22, spacing: 5.0, x: 6 },
            { startZ: -3450, count: 25, spacing: 5.0, x: 0 },
            { startZ: -3620, count: 20, spacing: 5.0, x: -7 },
            { startZ: -3620, count: 20, spacing: 5.0, x: 7 },
            { startZ: -3750, count: 24, spacing: 5.0, x: 0 },
            { startZ: -3900, count: 18, spacing: 5.0, x: 0 },

            // Final Loop 3 & Finish Colosseum (z: -4020 to -4780)
            { startZ: -4050, count: 12, spacing: 5.0, x: 0 },
            { startZ: -4240, count: 16, spacing: 5.5, x: 0 },
            { startZ: -4360, count: 18, spacing: 5.0, x: -6 },
            { startZ: -4360, count: 18, spacing: 5.0, x: 6 },
            { startZ: -4500, count: 22, spacing: 5.0, x: 0 },
            { startZ: -4650, count: 16, spacing: 5.0, x: 0 }
        ];

        chemRings.forEach(row => {
            for (let i = 0; i < row.count; i++) {
                const z = row.startZ - i * row.spacing;
                const ringY = this.getSafeRingY(row.x, z, row.y || 1.8);
                this.createRing(row.x, ringY, z);
            }
        });

        // Loop Arcs for Loop 1 (z: -880), Loop 2 (z: -1080), and Loop 3 (z: -4160)
        this.spawnLoopRings(-880, 16, 4);
        this.spawnLoopRings(-1080, 18, 4);
        this.spawnLoopRings(-4160, 18, 4);

        // --- 2. DASH BOOSTER PADS ---
        const chemDashPads = [
            // Entrance and inside Glass Booster Tube #1
            [0, 0.1, -125, 0, -1, 58],
            [0, 0.1, -210, 0, -1, 60],
            [0, 0.1, -300, 0, -1, 62],

            // Launch onto climbing ramp
            [0, 0.1, -370, 0, -1, 62],

            // Launch into Loop 1 and Loop 2
            [0, 4.1, -820, 0, -1, 65],
            [0, 4.1, -1020, 0, -1, 65],

            // Entrance and inside Glass Booster Tube #2
            [0, 28.1, -1730, 0, -1, 62],
            [0, 28.1, -1880, 0, -1, 65],
            [0, 28.1, -2020, 0, -1, 68],

            // High-speed Chemical Superhighway Boosters
            [-6, 8.1, -2880, 0, -1, 68], [6, 8.1, -2880, 0, -1, 68],
            [0, 8.1, -3100, 0, -1, 70],
            [-8, 8.1, -3320, 0, -1, 70], [8, 8.1, -3320, 0, -1, 70],
            [0, 8.1, -3550, 0, -1, 72],
            [-6, 8.1, -3780, 0, -1, 72], [6, 8.1, -3780, 0, -1, 72],

            // Approach into Loop 3
            [0, 8.1, -4080, 0, -1, 68],

            // Final sprint into Finish Colosseum
            [-5, 8.1, -4400, 0, -1, 72], [5, 8.1, -4400, 0, -1, 72],
            [0, 8.1, -4600, 0, -1, 75]
        ];

        chemDashPads.forEach(pos => {
            const padY = this.getSafeGroundY(pos[0], pos[2], pos[1]);
            const dirX = pos[3] !== undefined ? pos[3] : 0;
            const dirZ = pos[4] !== undefined ? pos[4] : -1;
            const force = pos[5] !== undefined ? pos[5] : 58;
            this.createDashPad(pos[0], padY, pos[2], dirX, dirZ, force);
        });

        // --- 3. INDUSTRIAL PISTON SPRINGS ---
        const chemSprings = [
            [-8, 0.1, -360, 24],  // High jump onto high catwalk
            [8, 0.1, -360, 24],
            [-6, 24.1, -660, 22],
            [6, 24.1, -660, 22],
            [-7, 5.1, -1240, 20],
            [7, 5.1, -1240, 20],
            [0, 5.1, -1530, 26],  // Boost up spiral climb
            [-10, 28.1, -2140, 20],
            [10, 28.1, -2140, 20],
            [0, 8.1, -2680, 22],
            [-8, 8.1, -3450, 24],
            [8, 8.1, -3450, 24],
            [0, 8.1, -4320, 22]
        ];

        chemSprings.forEach(sp => {
            const sprY = this.getSafeGroundY(sp[0], sp[2], sp[1]);
            this.createSpring(sp[0], sprY, sp[2], sp[3]);
        });

        // --- 4. CHECKPOINT STARPOSTS (4 Checkpoints in Chemical Plant) ---
        this.createStarPost(-10, 24, -600);   // Checkpoint 1: Skyway Catwalk
        this.createStarPost(9, 5, -1450);     // Checkpoint 2: Suspension Bridge
        this.createStarPost(-9, 28, -2380);   // Checkpoint 3: Split Catwalk Exit
        this.createStarPost(10, 8, -3600);    // Checkpoint 4: Superhighway Midpoint

        // --- 5. HAZARD SPIKES ---
        const chemSpikes = [
            [-5, 0.1, -100], [5, 0.1, -100],
            [0, 24.1, -580],
            [-5, 4.1, -760], [5, 4.1, -760],
            [0, 4.1, -940],
            [-4, 5.1, -1320], [4, 5.1, -1320],
            [0, 28.1, -1820],
            [-6, 28.1, -2260], [6, 28.1, -2260],
            [0, 8.1, -2580],
            [-6, 8.1, -3200], [6, 8.1, -3200],
            [0, 8.1, -3680],
            [-6, 8.1, -4280], [6, 8.1, -4280]
        ];

        chemSpikes.forEach(pos => {
            const spikeY = this.getSafeGroundY(pos[0], pos[2], pos[1]);
            this.createSpikes(pos[0], spikeY, pos[2]);
        });

        // --- 6. GIANT GOAL RING (At center of Chemical Plant Colosseum, groundY = 8) ---
        this.createGoalRing(0, 8, -4800, 8.5);
    }

    spawnHydrocityObjects() {
        // ========================================================
        // STAGE 3: HYDROCITY ZONE OBJECT PLACEMENT (5,000m)
        // ========================================================

        // --- 1. GOLDEN RINGS (Over 480+ rings following aqueducts, drops, and water loops) ---
        const hydroRings = [
            // Starting Aqueduct (z: 20 to -200)
            { startZ: -10, count: 6, spacing: 5.0, x: 0 },
            { startZ: -40, count: 8, spacing: 4.5, x: -4 },
            { startZ: -40, count: 8, spacing: 4.5, x: 4 },
            { startZ: -90, count: 12, spacing: 5.0, x: 0 },

            // Climbing Slope to Palace Aqueduct (z: -220 to -400)
            { startZ: -230, count: 16, spacing: 6.0, x: 0 },
            { startZ: -260, count: 10, spacing: 5.5, x: -3.5 },
            { startZ: -260, count: 10, spacing: 5.5, x: 3.5 },

            // Upper Palace Aqueduct High Road (z: -400 to -600)
            { startZ: -410, count: 12, spacing: 5.5, x: 0 },
            { startZ: -480, count: 10, spacing: 5.0, x: -3 },
            { startZ: -480, count: 10, spacing: 5.0, x: 3 },

            // Drop into Hydro-Tube #1 (z: -600 to -760)
            { startZ: -610, count: 12, spacing: 5.5, x: 0 },

            // Inside Glass Hydro-Tube #1 (Water Flume) (z: -760 to -1200)
            { startZ: -770, count: 16, spacing: 5.0, x: 0 },
            { startZ: -860, count: 14, spacing: 5.5, x: -2.5 },
            { startZ: -860, count: 14, spacing: 5.5, x: 2.5 },
            { startZ: -950, count: 18, spacing: 5.0, x: 0 },
            { startZ: -1060, count: 14, spacing: 5.0, x: 0 },

            // Atlantis Colosseum & Loop #1 Approach (z: -1200 to -1420)
            { startZ: -1220, count: 10, spacing: 5.0, x: -3 },
            { startZ: -1220, count: 10, spacing: 5.0, x: 3 },
            { startZ: -1300, count: 12, spacing: 5.5, x: 0 },

            // Post Loop #1 Sprint (z: -1480 to -1780)
            { startZ: -1500, count: 14, spacing: 5.5, x: 0 },
            { startZ: -1600, count: 12, spacing: 5.0, x: -4 },
            { startZ: -1600, count: 12, spacing: 5.0, x: 4 },
            { startZ: -1700, count: 10, spacing: 5.5, x: 0 },

            // Water-Surface Sprintfast (Skimming across water) (z: -1800 to -2200)
            { startZ: -1810, count: 18, spacing: 5.5, x: 0 },
            { startZ: -1920, count: 14, spacing: 5.0, x: -3.5 },
            { startZ: -1920, count: 14, spacing: 5.0, x: 3.5 },
            { startZ: -2020, count: 16, spacing: 5.0, x: 0 },
            { startZ: -2120, count: 12, spacing: 5.5, x: 0 },

            // Rising Ramp to High Aqueduct (z: -2200 to -2400)
            { startZ: -2220, count: 14, spacing: 6.0, x: 0 },
            { startZ: -2320, count: 10, spacing: 5.5, x: 0 },

            // High Sunken Aqueduct & Drop to Tube #2 (z: -2400 to -2760)
            { startZ: -2410, count: 12, spacing: 5.0, x: -3 },
            { startZ: -2410, count: 12, spacing: 5.0, x: 3 },
            { startZ: -2500, count: 14, spacing: 5.5, x: 0 },
            { startZ: -2620, count: 12, spacing: 5.5, x: 0 },

            // Deep Abyss Hydro-Tube #2 (z: -2760 to -3300)
            { startZ: -2780, count: 16, spacing: 5.0, x: 0 },
            { startZ: -2880, count: 14, spacing: 5.5, x: -2.5 },
            { startZ: -2880, count: 14, spacing: 5.5, x: 2.5 },
            { startZ: -2980, count: 18, spacing: 5.0, x: 0 },
            { startZ: -3100, count: 16, spacing: 5.0, x: 0 },
            { startZ: -3200, count: 12, spacing: 5.5, x: 0 },

            // Climbing Rapids to Loop #2 (z: -3300 to -3620)
            { startZ: -3320, count: 14, spacing: 6.0, x: 0 },
            { startZ: -3420, count: 12, spacing: 5.5, x: -3.5 },
            { startZ: -3420, count: 12, spacing: 5.5, x: 3.5 },
            { startZ: -3520, count: 14, spacing: 5.0, x: 0 },

            // High Shelf Descent to Canal (z: -3680 to -4100)
            { startZ: -3700, count: 12, spacing: 5.5, x: 0 },
            { startZ: -3820, count: 16, spacing: 6.0, x: 0 },
            { startZ: -3940, count: 14, spacing: 5.5, x: -3 },
            { startZ: -3940, count: 14, spacing: 5.5, x: 3 },

            // Trident Grand Canal Sprint (z: -4100 to -4600)
            { startZ: -4120, count: 16, spacing: 5.5, x: 0 },
            { startZ: -4220, count: 14, spacing: 5.0, x: -4 },
            { startZ: -4220, count: 14, spacing: 5.0, x: 4 },
            { startZ: -4320, count: 18, spacing: 5.0, x: 0 },
            { startZ: -4450, count: 16, spacing: 5.5, x: 0 },

            // Final sprint into Poseidon Colosseum (z: -4600 to -4970)
            { startZ: -4620, count: 14, spacing: 5.0, x: -3 },
            { startZ: -4620, count: 14, spacing: 5.0, x: 3 },
            { startZ: -4720, count: 16, spacing: 5.0, x: 0 },
            { startZ: -4820, count: 14, spacing: 5.0, x: 0 },
            { startZ: -4900, count: 10, spacing: 5.0, x: 0 }
        ];

        hydroRings.forEach(row => {
            for (let i = 0; i < row.count; i++) {
                const rz = row.startZ - i * row.spacing;
                const rx = row.x;
                const ry = this.getSafeRingY(rx, rz);
                this.createRing(rx, ry, rz);
            }
        });

        // 360° Water Loop 1 & Loop 2 Ring Arcs
        this.spawnLoopRings(-1450, 16, 4, 10);
        this.spawnLoopRings(-3650, 18, 18, 10);

        // --- 2. HYDRO BOOSTERS (Cyan Water Jet Accelerators) ---
        const hydroBoosters = [
            [0, 0.1, -180, 0, -1, 55],       // Launch up Palace Aqueduct slope
            [0, 12.1, -580, 0, -1, 58],      // Launch into Hydro-Tube #1
            [0, 4.1, -850, 0, -1, 55],       // Inside Hydro-Tube #1 mid
            [0, 4.1, -1050, 0, -1, 55],      // Inside Hydro-Tube #1 exit
            [0, 4.1, -1400, 0, -1, 60],      // Boost into Water Loop #1!
            [0, 3.6, -1850, 0, -1, 58],      // Water-skimming hydro sprint!
            [0, 3.6, -2100, 0, -1, 55],      // Launch up rising ramp out of water
            [0, 16.1, -2560, 0, -1, 58],     // Launch into Deep Abyss Hydro-Tube #2
            [0, 6.1, -2850, 0, -1, 55],      // Inside Hydro-Tube #2
            [0, 6.1, -3150, 0, -1, 55],      // Inside Hydro-Tube #2
            [0, 6.1, -3280, 0, -1, 58],      // Launch up Climbing Rapids
            [0, 18.1, -3600, 0, -1, 60],     // Boost into Water Loop #2!
            [0, 18.1, -3780, 0, -1, 55],     // Launch down thrilling canal descent
            [0, 8.1, -4150, 0, -1, 58],      // Trident Grand Canal Sprint #1
            [0, 8.1, -4400, 0, -1, 58],      // Trident Grand Canal Sprint #2
            [0, 8.1, -4750, 0, -1, 55]       // Final Sprint into Poseidon Colosseum!
        ];

        hydroBoosters.forEach(dp => {
            const padY = this.getSafeGroundY(dp[0], dp[2], dp[1]);
            this.createDashPad(dp[0], padY, dp[2], dp[3], dp[4], dp[5]);
        });

        // --- 3. WATER BUBBLE GEYSERS (Vertical Water Spout Springs) ---
        const hydroSprings = [
            [-5, 0.1, -200, 22],
            [5, 0.1, -200, 22],
            [0, 12.1, -450, 24],
            [-6, 4.1, -1180, 26],
            [6, 4.1, -1180, 26],
            [0, 3.6, -1950, 20],
            [-8, 16.1, -2480, 22],
            [8, 16.1, -2480, 22],
            [0, 6.1, -2740, 24],
            [-7, 18.1, -3520, 22],
            [7, 18.1, -3520, 22],
            [0, 8.1, -4300, 22]
        ];

        hydroSprings.forEach(sp => {
            const sprY = this.getSafeGroundY(sp[0], sp[2], sp[1]);
            this.createSpring(sp[0], sprY, sp[2], sp[3]);
        });

        // --- 4. CHECKPOINT STARPOSTS (4 Checkpoints in Hydrocity) ---
        this.createStarPost(-9, 4, -1100);    // Checkpoint 1: Hydro-Tube #1 Exit
        this.createStarPost(9, 3.5, -2150);   // Checkpoint 2: Water-Surface Sprint
        this.createStarPost(-9, 6, -3250);    // Checkpoint 3: Hydro-Tube #2 Exit
        this.createStarPost(9, 8, -4250);     // Checkpoint 4: Trident Grand Canal

        // --- 5. HAZARD NAVAL SPIKES ---
        const hydroSpikes = [
            [-5, 0.1, -120], [5, 0.1, -120],
            [0, 12.1, -540],
            [-4, 4.1, -800], [4, 4.1, -800],
            [-4, 4.1, -1000], [4, 4.1, -1000],
            [0, 4.1, -1350],
            [-6, 3.6, -1880], [6, 3.6, -1880],
            [-6, 3.6, -2060], [6, 3.6, -2060],
            [0, 16.1, -2520],
            [-5, 6.1, -2950], [5, 6.1, -2950],
            [0, 18.1, -3740],
            [-6, 8.1, -4250], [6, 8.1, -4250],
            [-6, 8.1, -4550], [6, 8.1, -4550]
        ];

        hydroSpikes.forEach(pos => {
            const spikeY = this.getSafeGroundY(pos[0], pos[2], pos[1]);
            this.createSpikes(pos[0], spikeY, pos[2]);
        });

        // --- 6. GIANT GOAL RING (At center of Poseidon Grand Colosseum, groundY = 8) ---
        this.createGoalRing(0, 8, -5000, 8.5);
    }

    spawnGreenHillObjects() {
        // --- 1. GOLDEN RINGS (Over 450+ rings following terrain slopes and elevations) ---
        const ringRows = [
            // Starting straight (z: 0 to -120)
            { startZ: -10, count: 5, spacing: 5, x: 0 },
            { startZ: -45, count: 7, spacing: 4.5, x: -4 },
            { startZ: -45, count: 7, spacing: 4.5, x: 4 },

            // Slope 1 climbing (z: -120 to -240, rising from 0 to 22)
            { startZ: -125, count: 18, spacing: 6.0, x: 0 },

            // Plateau 1 (z: -240 to -360)
            { startZ: -250, count: 6, spacing: 6, x: -5 },
            { startZ: -250, count: 6, spacing: 6, x: 5 },
            { startZ: -300, count: 8, spacing: 5, x: 0 },

            // Downhill Slope 1 (z: -360 to -460, dipping from 22 down to 4) - perfectly follows slope descent!
            { startZ: -365, count: 16, spacing: 6.0, x: 0 },
            { startZ: -375, count: 8, spacing: 8.0, x: -4 },
            { startZ: -375, count: 8, spacing: 8.0, x: 4 },

            // Valley & Bridge (z: -460 to -690)
            { startZ: -470, count: 6, spacing: 6, x: 0 },
            { startZ: -580, count: 12, spacing: 7, x: 0 },

            // Mid-Course Highway (z: -690 to -1080)
            { startZ: -710, count: 8, spacing: 5, x: -3 },
            { startZ: -710, count: 8, spacing: 5, x: 3 },
            { startZ: -780, count: 12, spacing: 7, x: 0 },
            { startZ: -890, count: 14, spacing: 8, x: -5 },
            { startZ: -890, count: 14, spacing: 8, x: 5 },
            { startZ: -1010, count: 10, spacing: 7, x: 0 },

            // Mountain Ramp Climb (z: -1080 to -1220, rising from 8 to 26)
            { startZ: -1090, count: 17, spacing: 7.0, x: 0 },

            // High Ridge Plateau (z: -1220 to -1360)
            { startZ: -1240, count: 8, spacing: 6, x: -4 },
            { startZ: -1240, count: 8, spacing: 6, x: 4 },
            { startZ: -1300, count: 8, spacing: 6, x: 0 },

            // Sky Islands & Bridges (z: -1360 to -1680)
            { startZ: -1380, count: 8, spacing: 7, x: 0 },
            { startZ: -1520, count: 7, spacing: 7, x: -10 },
            { startZ: -1520, count: 7, spacing: 7, x: 10 },

            // Rollercoaster Dip & Rise (z: -1680 to -2000)
            // Downhill drop: z: -1680 to -1840 (dropping from 28 to 4)
            { startZ: -1690, count: 18, spacing: 8.0, x: 0 },
            { startZ: -1850, count: 8, spacing: 7.5, x: 0 },
            // Uphill rise: z: -1920 to -2000 (rising from 4 to 12)
            { startZ: -1925, count: 10, spacing: 7.0, x: 0 },

            // Loop 2 Entrance & Approach (z: -2000 to -2060)
            { startZ: -2005, count: 8, spacing: 6.5, x: 0 },
            { startZ: -2070, count: 6, spacing: 6, x: 0 },

            // Winding Emerald Canyon (z: -2240 to -2540)
            // Canyon slope: z: -2180 to -2240 (rising from 6 to 10)
            { startZ: -2185, count: 8, spacing: 6.5, x: 0 },
            { startZ: -2260, count: 10, spacing: 7, x: -4 },
            { startZ: -2260, count: 10, spacing: 7, x: 4 },
            { startZ: -2380, count: 12, spacing: 7, x: 0 },
            { startZ: -2470, count: 10, spacing: 6, x: 0 },

            // Supersonic Finish Speedway (z: -2540 to -2840)
            // Speedway slope: z: -2540 to -2620 (rising from 10 to 12)
            { startZ: -2545, count: 10, spacing: 7.0, x: 0 },
            { startZ: -2560, count: 10, spacing: 7, x: -5 },
            { startZ: -2560, count: 10, spacing: 7, x: 5 },
            { startZ: -2660, count: 14, spacing: 6, x: 0 },
            { startZ: -2770, count: 12, spacing: 6, x: -3 },
            { startZ: -2770, count: 12, spacing: 6, x: 3 },

            // Zone 15: Sky Highway & Cloud Aqueduct (z: -2900 to -3400)
            { startZ: -2910, count: 18, spacing: 7.0, x: 0 },
            { startZ: -3080, count: 12, spacing: 6.5, x: -4 },
            { startZ: -3080, count: 12, spacing: 6.5, x: 4 },
            { startZ: -3200, count: 10, spacing: 6.0, x: -11 }, // Left cloud split
            { startZ: -3200, count: 10, spacing: 6.0, x: 11 },  // Right cloud split
            { startZ: -3320, count: 10, spacing: 6.5, x: 0 },

            // Zone 16: Approach to Loop #3 & Coastal Waterfall (z: -3400 to -3700)
            { startZ: -3410, count: 12, spacing: 7.0, x: 0 },
            { startZ: -3580, count: 14, spacing: 7.0, x: 0 },

            // Zone 17: Coastal Sunset Bay & Water Bridge (z: -3700 to -4250)
            { startZ: -3720, count: 12, spacing: 7.0, x: 0 },
            { startZ: -3840, count: 14, spacing: 6.5, x: 0 },
            { startZ: -3980, count: 12, spacing: 7.0, x: -5 },
            { startZ: -4160, count: 12, spacing: 7.0, x: 5 },

            // Zone 18: Rollercoaster Triple S-Curves (z: -4250 to -4850)
            { startZ: -4260, count: 16, spacing: 7.0, x: 0 },
            { startZ: -4400, count: 14, spacing: 7.0, x: 0 },
            { startZ: -4530, count: 14, spacing: 7.0, x: 0 },
            { startZ: -4670, count: 12, spacing: 7.0, x: 0 },

            // Zone 19: Grand Supersonic Speedway & Mega Boost Strip (z: -4850 to -5450)
            { startZ: -4870, count: 18, spacing: 7.5, x: -5 },
            { startZ: -4870, count: 18, spacing: 7.5, x: 5 },
            { startZ: -5050, count: 24, spacing: 7.0, x: 0 },
            { startZ: -5260, count: 18, spacing: 7.5, x: -4 },
            { startZ: -5260, count: 18, spacing: 7.5, x: 4 },

            // Zone 20: Victory Colosseum & Giant Goal Approach (z: -5450 to -5600)
            { startZ: -5460, count: 12, spacing: 6.0, x: 0 },
            { startZ: -5540, count: 8, spacing: 5.5, x: -3 },
            { startZ: -5540, count: 8, spacing: 5.5, x: 3 },

            // Secret Upper Paths (Sky platforms)
            { startZ: -140, count: 6, spacing: 6, x: -18 },
            { startZ: -290, count: 5, spacing: 6, x: 18 },
            { startZ: -1400, count: 8, spacing: 7, x: -16 },
            { startZ: -2340, count: 8, spacing: 7, x: 16 }
        ];

        ringRows.forEach(row => {
            for (let i = 0; i < row.count; i++) {
                const z = row.startZ - (i * row.spacing);
                let y = 1.35;
                
                // Dynamic ground elevation query: guarantees rings on slopes or hills
                // are ALWAYS positioned cleanly at eye level (+1.35m) above the ground
                const world = this.world || (window.game && window.game.world);
                if (world && world.getGroundHeight) {
                    const groundY = world.getGroundHeight(row.x, z);
                    if (groundY > -40) {
                        y = groundY + 1.35;
                    }
                }
                this.createRing(row.x, y, z);
            }
        });

        // High Jump Ring Arcs (Arching across springs & loops)
        this.createRingArc(0, 24, -95, 8, 12);
        this.createLoopRings(0, 4, -510, 16, -2.5, 2.5, 10);  // Inside Loop #1 360° Ring Arc
        this.createRingArc(0, 36, -1630, 9, 16);  // Over Sky Island Gap
        this.createLoopRings(0, 6, -2120, 18, -2.5, 2.5, 12); // Inside Loop #2 360° Ring Arc!
        this.createLoopRings(0, 10, -3530, 20, -2.5, 2.5, 14); // Inside Giant Loop #3 360° Ring Arc!
        this.createRingArc(0, 16, -5570, 8, 14); // Final Ring Arc leading into Giant Goal Ring!

        // --- 2. STAR POST CHECKPOINTS (5 Milestone Checkpoints along 5,600m Course) ---
        this.createStarPost(-3.8, 4, -470, 0);   // Checkpoint 1: Loop 1 Valley Floor (z: -470)
        this.createStarPost(-3.8, 26, -1200, 1); // Checkpoint 2: Corkscrew Ridge
        this.createStarPost(-3.8, 10, -2260, 2); // Checkpoint 3: Emerald Canyon Entry
        this.createStarPost(-4.0, 10, -3560, 3); // Checkpoint 4: Coastal Lagoon (After Loop 3)
        this.createStarPost(-4.0, 10, -4720, 4); // Checkpoint 5: Grand Speedway Entry

        // --- 3. SPRING PADS ---
        this.createSpring(0, 0, -85, 32);              // Launch over start gap
        this.createSpring(-10, 0, -115, 30);           // Launch to left secret route
        this.createSpring(0, 22, -345, 34);            // Launch off plateau
        this.createSpring(10, 22, -260, 32);           // Launch to right high route
        this.createSpring(-8, 5, -670, 30);            // Bridge boost spring
        this.createSpring(12, 26, -1340, 34);          // Launch to upper sky island
        this.createSpring(-10, 28, -1630, 32);         // Left sky gap bounce
        this.createSpring(10, 28, -1630, 32);          // Right sky gap bounce
        this.createSpring(0, 4, -1910, 32);            // Launch over roller hill
        this.createSpring(-6, 10, -2360, 30);          // Canyon secret route bounce
        this.createSpring(0, 28, -3360, 34);           // Launch down into Loop #3 approach
        this.createSpring(-11, 28, -3280, 32);         // Left cloud bounce
        this.createSpring(11, 28, -3280, 32);          // Right cloud bounce
        this.createSpring(0, 8, -4510, 34);            // Rollercoaster triple-s wave bounce

        // --- 4. DASH BOOST PADS (Balanced 42 - 55 speed) ---
        this.createDashPad(0, 0, -30, 0, -1, 42);       // Straight boost
        this.createDashPad(0, 22, -280, 0, -1, 45);     // Plateau speedrun
        this.createDashPad(0, 4, -460, 0, -1, 48);      // Charge into loop 1!
        this.createDashPad(0, 5, -570, 0, -1, 44);      // Bridge dash
        this.createDashPad(0, 8, -700, 0, -1, 46);      // Sprint into highway
        this.createDashPad(0, 8, -850, 0, -1, 48);      // Accelerator 1
        this.createDashPad(0, 8, -980, 0, -1, 48);      // Accelerator 2
        this.createDashPad(0, 8, -1070, 0, -1, 48);     // Mountain ramp launch
        this.createDashPad(0, 4, -1870, 0, -1, 46);     // Coaster dip surge
        this.createDashPad(0, 12, -2020, 0, -1, 50);    // Charge into loop 2!
        this.createDashPad(0, 10, -2270, 0, -1, 46);    // Canyon dash
        this.createDashPad(0, 12, -2560, 0, -1, 48);    // Speedway accelerator 1
        this.createDashPad(0, 12, -2700, 0, -1, 50);    // Speedway accelerator 2
        this.createDashPad(0, 12, -2880, 0, -1, 48);    // Launch into Sky Highway
        this.createDashPad(0, 28, -3120, 0, -1, 50);    // Sky Highway sprint
        this.createDashPad(0, 10, -3480, 0, -1, 52);    // Mega launch into Giant Loop 3!
        this.createDashPad(0, 10, -3660, 0, -1, 46);    // Coastal sprint
        this.createDashPad(0, 14, -4220, 0, -1, 48);    // Rollercoaster surge
        this.createDashPad(0, 10, -4880, 0, -1, 50);    // Grand speedway booster 1
        this.createDashPad(0, 10, -5080, 0, -1, 52);    // Grand speedway booster 2
        this.createDashPad(0, 10, -5280, 0, -1, 54);    // Grand speedway booster 3
        this.createDashPad(0, 12, -5480, 0, -1, 55);    // Final sprint into Victory Colosseum Arena!

        // --- 5. SPIKE HAZARDS ---
        this.createSpikes(-5, 0, -65);
        this.createSpikes(5, 0, -65);
        this.createSpikes(0, 22, -315);
        this.createSpikes(-4, 5, -610);
        this.createSpikes(4, 5, -645);
        this.createSpikes(0, 8, -740);
        this.createSpikes(-6, 8, -910);
        this.createSpikes(6, 8, -910);
        this.createSpikes(-5, 26, -1270);
        this.createSpikes(5, 26, -1270);
        this.createSpikes(0, 26, -1450);
        this.createSpikes(-4, 28, -1570);
        this.createSpikes(4, 28, -1570);
        this.createSpikes(0, 10, -2320);
        this.createSpikes(-6, 12, -2640);
        this.createSpikes(6, 12, -2640);
        this.createSpikes(0, 12, -2760);
        this.createSpikes(-5, 28, -3160);
        this.createSpikes(5, 28, -3160);
        this.createSpikes(0, 10, -3800);
        this.createSpikes(-5, 14, -4060);
        this.createSpikes(5, 14, -4200);
        this.createSpikes(0, 30, -4360);
        this.createSpikes(-6, 10, -4980);
        this.createSpikes(6, 10, -4980);
        this.createSpikes(0, 10, -5180);

        // --- 6. GIANT GOAL RING (At end of 5,600m Victory Colosseum Arena, groundY = 10) ---
        this.createGoalRing(0, 10, -5600, 8.5);
    }

    createRing(x, y, z) {
        // Automatic Ground Elevation Safeguard:
        // Ensure ring is NEVER buried underground on sloped hills, dips, or platforms
        const world = this.world || (window.game && window.game.world);
        if (world && world.getGroundHeight) {
            const groundY = world.getGroundHeight(x, z);
            if (groundY > -40) {
                // If y is lower than ground surface + 1.0m (i.e. submerged or embedded),
                // automatically lift it to float at perfect 1.35m height above the road
                if (y < groundY + 1.0) {
                    y = groundY + 1.35;
                }
            }
        }

        const group = new THREE.Group();
        const geo = new THREE.TorusGeometry(0.55, 0.12, 10, 24);
        const mesh = new THREE.Mesh(geo, this.goldMat);
        mesh.castShadow = true;
        group.add(mesh);

        group.position.set(x, y, z);
        this.scene.add(group);

        this.rings.push({
            group: group,
            mesh: mesh,
            baseY: y,
            collected: false,
            radius: 1.0
        });
    }

    createRingArc(centerX, baseY, centerZ, arcHeight, length) {
        const count = 7;
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            const z = centerZ - (t - 0.5) * length;
            const y = baseY + Math.sin(t * Math.PI) * arcHeight;
            this.createRing(centerX, y, z);
        }
    }

    createLoopRings(centerX, groundY, centerZ, radius, entryX = -2.5, exitX = 2.5, count = 10) {
        for (let i = 0; i < count; i++) {
            const theta = ((i + 0.5) / count) * Math.PI * 2;
            const z = centerZ - radius * Math.sin(theta);
            const y = groundY + radius * (1 - Math.cos(theta)) + 1.2;
            const x = centerX + entryX + (exitX - entryX) * ((i + 0.5) / count);
            this.createRing(x, y, z);
        }
    }

    createSpring(x, y, z, power = 35) {
        const world = this.world || (window.game && window.game.world);
        if (world && world.getGroundHeight) {
            const groundY = world.getGroundHeight(x, z);
            if (groundY > -40) y = groundY;
        }

        const group = new THREE.Group();
        
        // Base plate (Yellow metallic)
        const baseGeo = new THREE.CylinderGeometry(1.5, 1.7, 0.25, 16);
        const baseMesh = new THREE.Mesh(baseGeo, this.springYellowMat);
        baseMesh.position.y = 0.125;
        group.add(baseMesh);

        // Spring Coil (Metal spiral or cylinder)
        const coilGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 12);
        const coilMesh = new THREE.Mesh(coilGeo, this.spikeMat);
        coilMesh.position.y = 0.35;
        group.add(coilMesh);

        // Top Pad (Red rubber cushion with yellow star)
        const topGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.25, 16);
        const topMesh = new THREE.Mesh(topGeo, this.springRedMat);
        topMesh.position.y = 0.65;
        group.add(topMesh);

        // Yellow Star Decal
        const starGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.28, 5);
        const starMesh = new THREE.Mesh(starGeo, this.springYellowMat);
        starMesh.position.y = 0.66;
        group.add(starMesh);

        group.position.set(x, y, z);
        this.scene.add(group);

        this.springs.push({
            group: group,
            topMesh: topMesh,
            power: power,
            x: x, y: y, z: z,
            radius: 1.7,
            bounceTimer: 0
        });
    }

    createDashPad(x, y, z, dirX = 0, dirZ = -1, force = 55) {
        if (dirX === undefined || isNaN(dirX)) dirX = 0;
        if (dirZ === undefined || isNaN(dirZ)) dirZ = -1;
        if (force === undefined || isNaN(force)) force = 55;

        const world = this.world || (window.game && window.game.world);
        if (world && world.getGroundHeight) {
            const groundY = world.getGroundHeight(x, z);
            if (groundY > -40) y = groundY;
        }

        const group = new THREE.Group();

        // Main Ramp Base
        const padGeo = new THREE.BoxGeometry(3.6, 0.2, 5.0);
        const padMat = new THREE.MeshLambertMaterial({ color: 0xff4500 }); // Neon Orange
        const padMesh = new THREE.Mesh(padGeo, padMat);
        padMesh.position.y = 0.1;
        group.add(padMesh);

        // Chevron Arrows (Glowing Yellow Chevrons pointing forward)
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        for (let i = -1; i <= 1; i++) {
            const arrowGeo = new THREE.ConeGeometry(0.7, 1.4, 3);
            arrowGeo.rotateX(Math.PI / 2);
            const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
            arrowMesh.position.set(0, 0.22, i * 1.3);
            group.add(arrowMesh);
        }

        group.position.set(x, y, z);
        this.scene.add(group);

        this.dashPads.push({
            group: group,
            dirX: dirX,
            dirZ: dirZ,
            force: force,
            x: x, y: y, z: z,
            width: 3.6, length: 5.0,
            cooldown: 0
        });
    }

    createSpikes(x, y, z) {
        const world = this.world || (window.game && window.game.world);
        if (world && world.getGroundHeight) {
            const groundY = world.getGroundHeight(x, z);
            if (groundY > -40) y = groundY;
        }

        const group = new THREE.Group();

        // Base Plate
        const baseGeo = new THREE.BoxGeometry(3.0, 0.2, 3.0);
        const baseMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = 0.1;
        group.add(baseMesh);

        // 3x3 Grid of sharp spikes
        const coneGeo = new THREE.ConeGeometry(0.26, 1.2, 6);
        for (let ix = -1; ix <= 1; ix++) {
            for (let iz = -1; iz <= 1; iz++) {
                const spk = new THREE.Mesh(coneGeo, this.spikeMat);
                spk.position.set(ix * 0.9, 0.7, iz * 0.9);
                spk.castShadow = true;
                group.add(spk);
            }
        }

        group.position.set(x, y, z);
        this.scene.add(group);

        this.spikes.push({
            group: group,
            x: x, y: y, z: z,
            radius: 1.8
        });
    }

    createStarPost(x, y, z, id) {
        const world = this.world || (window.game && window.game.world);
        if (world && world.getGroundHeight) {
            const groundY = world.getGroundHeight(x, z);
            if (groundY > -40) y = groundY;
        }

        const group = new THREE.Group();

        // 1. Pedestal Base (Sturdy arcade pedestal)
        const baseGeo = new THREE.CylinderGeometry(1.1, 1.45, 0.55, 16);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x3d3d44, metalness: 0.85, roughness: 0.25 });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = 0.275;
        baseMesh.castShadow = true;
        group.add(baseMesh);

        // 2. Metallic Post/Pole (Stately silver pillar with collar rings)
        const poleGeo = new THREE.CylinderGeometry(0.28, 0.35, 4.2, 16);
        const poleMesh = new THREE.Mesh(poleGeo, this.postPoleMat);
        poleMesh.position.y = 2.35;
        poleMesh.castShadow = true;
        group.add(poleMesh);

        // Decorative collar ring
        const collarGeo = new THREE.TorusGeometry(0.38, 0.08, 8, 16);
        const collarMesh = new THREE.Mesh(collarGeo, this.postStarGoldMat);
        collarMesh.rotation.x = Math.PI / 2;
        collarMesh.position.y = 4.35;
        group.add(collarMesh);

        // 3. Rotating Star Post Head Group (pivoting at pole top y = 4.4)
        const headGroup = new THREE.Group();
        headGroup.position.y = 4.4;

        // Central Orb (Blue glowing lamp before touch, Red/Gold blazing beacon after touch!)
        const orbGeo = new THREE.SphereGeometry(0.72, 20, 20);
        const orbMesh = new THREE.Mesh(orbGeo, this.postOrbBlueMat);
        orbMesh.castShadow = true;
        headGroup.add(orbMesh);

        // Horizontal Crossbar Wings
        const barGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2, 10);
        const barMesh = new THREE.Mesh(barGeo, this.postPoleMat);
        barMesh.rotation.z = Math.PI / 2;
        headGroup.add(barMesh);

        // Crossbar End Sphere Accents (Golden Star Spheres)
        const endGeo = new THREE.SphereGeometry(0.28, 12, 12);
        [-1.1, 1.1].forEach(offsetX => {
            const endMesh = new THREE.Mesh(endGeo, this.postStarGoldMat);
            endMesh.position.x = offsetX;
            headGroup.add(endMesh);
        });

        // Crown Star Spikes (5-point golden finial on top of the orb)
        const starGeo = new THREE.ConeGeometry(0.32, 0.85, 5);
        const starMesh = new THREE.Mesh(starGeo, this.postStarGoldMat);
        starMesh.position.y = 0.82;
        headGroup.add(starMesh);

        group.add(headGroup);
        group.position.set(x, y, z);
        this.scene.add(group);

        this.starPosts.push({
            id: id,
            group: group,
            headGroup: headGroup,
            orbMesh: orbMesh,
            x: x, y: y, z: z,
            radius: 2.2,
            activated: false,
            spinSpeed: 0,
            glowTimer: 0
        });
    }

    createPortalTexture() {
        if (typeof document === 'undefined') return null;
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            const cx = 256, cy = 256;

            // Cosmic Radial Glow Gradient
            const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 256);
            grad.addColorStop(0.0, '#ffffff');      // Pure white energy singularity core
            grad.addColorStop(0.12, '#e0f2fe');     // Celestial sky shimmer
            grad.addColorStop(0.30, '#38bdf8');     // Radiant electric cyan
            grad.addColorStop(0.55, '#0284c7');     // Deep azure warp realm
            grad.addColorStop(0.78, '#1e1b4b');     // Midnight hyperspace void
            grad.addColorStop(0.92, '#06b6d4');     // Turquoise outer containment ring
            grad.addColorStop(1.0, 'rgba(2, 132, 199, 0.0)'); // Smooth edge dissipation

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, 256, 0, Math.PI * 2);
            ctx.fill();

            // 6 Curved spiral vortex galaxy arms (Sonic Special Stage Warp Ring)
            ctx.save();
            ctx.translate(cx, cy);
            for (let arm = 0; arm < 6; arm++) {
                ctx.rotate((Math.PI * 2) / 6);
                ctx.beginPath();
                for (let r = 12; r < 240; r += 4) {
                    const angle = r * 0.042;
                    const x = Math.cos(angle) * r;
                    const y = Math.sin(angle) * r;
                    if (r === 12) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
                ctx.lineWidth = 14;
                ctx.stroke();

                ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
                ctx.lineWidth = 8;
                ctx.stroke();
            }
            ctx.restore();

            // 90 Scattered Starlight sparkles
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 90; i++) {
                const rad = Math.random() * 230;
                const ang = Math.random() * Math.PI * 2;
                const px = cx + Math.cos(ang) * rad;
                const py = cy + Math.sin(ang) * rad;
                const sz = 1.2 + Math.random() * 3.0;
                ctx.beginPath();
                ctx.arc(px, py, sz, 0, Math.PI * 2);
                ctx.fill();
            }

            return new THREE.CanvasTexture(canvas);
        } catch (e) {
            return null;
        }
    }

    createGoalRing(x, groundY, z, radius = 8.5) {
        // Automatic Ground Elevation Safeguard
        const world = this.world || (window.game && window.game.world);
        if (world && typeof world.getGroundHeight === 'function') {
            const sampled = world.getGroundHeight(x, z);
            if (sampled > -40) groundY = sampled;
        }

        const group = new THREE.Group();
        const centerY = groundY + radius * 0.9; // 7.65m above ground

        // 1. Colossal Golden Torus Outer Ring
        const ringGeo = new THREE.TorusGeometry(radius, 0.85, 24, 48);
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.92,
            roughness: 0.16,
            emissive: 0x553800
        });
        const ringMesh = new THREE.Mesh(ringGeo, goldMat);
        ringMesh.castShadow = true;
        group.add(ringMesh);

        // 2. Swirling Cosmic Warp Portal Glass Disc (16m diameter!)
        const portalTex = this.createPortalTexture();
        const portalGeo = new THREE.CircleGeometry(radius - 0.5, 48);
        const portalMat = new THREE.MeshBasicMaterial({
            map: portalTex || null,
            color: portalTex ? 0xffffff : 0x00d2ff,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        const portalMesh = new THREE.Mesh(portalGeo, portalMat);
        group.add(portalMesh);

        // 3. Inner Pulsing Core Disc (Additive Glowing Energy Center)
        const coreGeo = new THREE.CircleGeometry(radius * 0.68, 36);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x67e8f9,
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const innerCoreMesh = new THREE.Mesh(coreGeo, coreMat);
        group.add(innerCoreMesh);

        // 4. Vertical Victory Light Column / Heavenly Sky Beam (100m tall)
        const beaconGeo = new THREE.CylinderGeometry(radius * 0.45, radius * 0.85, 100, 16, 1, true);
        const beaconMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        beaconMesh.position.set(0, 50, 0);
        group.add(beaconMesh);

        // 5. Grand Architectural Foundation Dais (Ground Stepped Plinth)
        const daisGeo = new THREE.CylinderGeometry(radius * 1.5, radius * 1.65, 1.4, 36);
        const daisMat = new THREE.MeshStandardMaterial({
            color: (this.currentStageId === 'chemical_plant') ? 0x242838 : 0x8b6540,
            metalness: 0.7,
            roughness: 0.3
        });
        const daisMesh = new THREE.Mesh(daisGeo, daisMat);
        daisMesh.position.set(0, -radius * 0.9 + 0.7, 0);
        group.add(daisMesh);

        // Dais Glowing Border Rim
        const daisRimGeo = new THREE.TorusGeometry(radius * 1.52, 0.18, 12, 36);
        const daisRimMat = new THREE.MeshBasicMaterial({
            color: (this.currentStageId === 'chemical_plant') ? 0x00f0ff : 0xffd700
        });
        const daisRim = new THREE.Mesh(daisRimGeo, daisRimMat);
        daisRim.rotation.x = Math.PI / 2;
        daisRim.position.set(0, -radius * 0.9 + 1.4, 0);
        group.add(daisRim);

        // 6. Grand Flanking Pylon Columns (Left & Right)
        const pillarColGeo = new THREE.CylinderGeometry(0.85, 1.15, radius * 1.85, 16);
        const pillarMat = new THREE.MeshStandardMaterial({
            color: (this.currentStageId === 'chemical_plant') ? 0x1f293d : 0xab8860,
            metalness: 0.6,
            roughness: 0.3
        });
        const orbGeo = new THREE.SphereGeometry(1.2, 16, 16);
        const orbMat = new THREE.MeshBasicMaterial({
            color: (this.currentStageId === 'chemical_plant') ? 0x00f0ff : 0xffd700
        });

        [-radius - 1.6, radius + 1.6].forEach(colX => {
            const pillar = new THREE.Mesh(pillarColGeo, pillarMat);
            pillar.position.set(colX, 0, 0);
            group.add(pillar);

            const orb = new THREE.Mesh(orbGeo, orbMat);
            orb.position.set(colX, radius * 0.95, 0);
            group.add(orb);
        });

        // 7. 16 Orbiting Chaos Energy Sparkles
        const sparkleGeo = new THREE.DodecahedronGeometry(0.42, 0);
        const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.goalSparkles = [];
        for (let i = 0; i < 16; i++) {
            const s = new THREE.Mesh(sparkleGeo, sparkleMat);
            group.add(s);
            this.goalSparkles.push(s);
        }

        group.position.set(x, centerY, z);
        this.scene.add(group);

        this.goalRing = {
            group: group,
            ringMesh: ringMesh,
            portalMesh: portalMesh,
            innerCoreMesh: innerCoreMesh,
            beaconMesh: beaconMesh,
            x: x,
            groundY: groundY,
            centerY: centerY,
            z: z,
            radius: radius,
            reached: false
        };
    }

    spawnScatteredRings(x, y, z, count = 12) {
        const actualCount = Math.min(count, 20);
        const ringGeo = new THREE.TorusGeometry(0.42, 0.09, 8, 16);

        for (let i = 0; i < actualCount; i++) {
            const angle = (i / actualCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
            const horizSpeed = 6.5 + Math.random() * 8.5;
            const mesh = new THREE.Mesh(ringGeo, this.goldMat);
            mesh.position.set(x, y + 0.8, z);
            this.scene.add(mesh);

            this.scatteredRings.push({
                mesh: mesh,
                vx: Math.cos(angle) * horizSpeed,
                vy: 11.5 + Math.random() * 7.0, // Upward fountain arc
                vz: Math.sin(angle) * horizSpeed,
                life: 6.0, // Despawn after 6.0 seconds
                canCollectAfter: 0.35 // 0.35s before Sonic can recollect
            });
        }
    }

    update(dt, sonic, onGoalReached) {
        const time = performance.now() * 0.003;

        // Update 3D Ring Collection Visual Effects (Shockwaves & Sparkle Burst Pool)
        this.updateRingFX(dt);

        // 1. Update & Collect Standard Rings with Authentic Sonic Magnetism
        this.rings.forEach(ring => {
            if (!ring.collected) {
                // Center of Sonic (around chest/waist y + 0.85)
                const sonicCenter = sonic.position.clone();
                sonicCenter.y += 0.85;
                const dist = sonicCenter.distanceTo(ring.group.position);

                // Ring Magnetism:
                // Normal radius: 4.5m | Boost radius: 11.25m (ONLY when actively boosting with energy > 2.0 and NOT depleted)
                const baseMagnetRadius = 4.5;
                const isMagnetBoost = (sonic.isBoosting && sonic.boostEnergy > 2.0 && !sonic.boostDepleted);
                const magnetRadius = isMagnetBoost ? (baseMagnetRadius * 2.5) : baseMagnetRadius;
                if (dist < magnetRadius && !sonic.isLooping && !sonic.isDead) {
                    // Accelerate spin as ring rushes into Sonic
                    const boostSpinMult = isMagnetBoost ? 2.0 : 1.0;
                    ring.mesh.rotation.y += dt * (4.5 + (magnetRadius - dist) * 7.5) * boostSpinMult;
                    const pullSpeed = isMagnetBoost ? 28.0 : 16.0;
                    const pullAcc = isMagnetBoost ? 14.0 : 9.0;
                    const pullFactor = Math.min(1.0, dt * (pullSpeed + (magnetRadius - dist) * pullAcc));
                    ring.group.position.lerp(sonicCenter, pullFactor);
                } else {
                    // Standard spin & hover bobbing when undisturbed
                    ring.mesh.rotation.y += dt * 3.8;
                    ring.group.position.y = ring.baseY + Math.sin(time + ring.group.position.z) * 0.18;
                }

                // Collection collision
                if (dist < ring.radius + 1.2 && !sonic.isDead) {
                    this.spawnRingCollectFX(ring.group.position.x, ring.group.position.y, ring.group.position.z);
                    ring.collected = true;
                    ring.group.visible = false;
                    sonic.addRing(1);
                }
            }
        });

        // 2. Update Scattered Rings
        for (let i = this.scatteredRings.length - 1; i >= 0; i--) {
            const sRing = this.scatteredRings[i];
            sRing.life -= dt;
            sRing.canCollectAfter -= dt;

            // Physics
            sRing.vy -= 42 * dt; // Gravity
            sRing.mesh.position.x += sRing.vx * dt;
            sRing.mesh.position.y += sRing.vy * dt;
            sRing.mesh.position.z += sRing.vz * dt;
            sRing.mesh.rotation.y += dt * 6.5;

            // Accurate terrain ground bouncing
            const groundY = (this.world && this.world.getGroundHeight)
                ? this.world.getGroundHeight(sRing.mesh.position.x, sRing.mesh.position.z)
                : 0;
            const floorY = groundY + 0.35;

            if (sRing.mesh.position.y <= floorY) {
                sRing.mesh.position.y = floorY;
                if (Math.abs(sRing.vy) > 1.8) {
                    sRing.vy = -sRing.vy * 0.58; // Elastic bounce
                } else {
                    sRing.vy = 0;
                }
                sRing.vx *= 0.82;
                sRing.vz *= 0.82;
            }

            // Flashing when close to despawning (last 2.0 seconds)
            if (sRing.life < 2.0) {
                sRing.mesh.visible = Math.floor(sRing.life * 14) % 2 === 0;
            }

            // Recollect check with magnetism (Enhanced 2.5x ONLY when actively boosting with energy > 2.0 and NOT depleted)
            if (sRing.canCollectAfter <= 0 && !sonic.isDead) {
                const sonicCenter = sonic.position.clone();
                sonicCenter.y += 0.85;
                const dist = sonicCenter.distanceTo(sRing.mesh.position);
                const isScatterBoost = (sonic.isBoosting && sonic.boostEnergy > 2.0 && !sonic.boostDepleted);
                const sMagnetRadius = isScatterBoost ? (4.0 * 2.5) : 4.0;
                if (dist < sMagnetRadius) {
                    const sPull = isScatterBoost ? 28.0 : 15.0;
                    sRing.mesh.position.lerp(sonicCenter, Math.min(1.0, dt * sPull));
                }
                if (dist < 1.8) {
                    this.spawnRingCollectFX(sRing.mesh.position.x, sRing.mesh.position.y, sRing.mesh.position.z);
                    sonic.addRing(1);
                    this.scene.remove(sRing.mesh);
                    this.scatteredRings.splice(i, 1);
                    continue;
                }
            }

            if (sRing.life <= 0) {
                this.scene.remove(sRing.mesh);
                this.scatteredRings.splice(i, 1);
            }
        }

        // 3. Update Springs
        this.springs.forEach(sp => {
            if (sp.bounceTimer > 0) {
                sp.bounceTimer -= dt;
                sp.topMesh.position.y = 0.65 + Math.sin(sp.bounceTimer * 30) * 0.35;
                if (sp.bounceTimer <= 0) sp.topMesh.position.y = 0.65;
            }

            // Check if Sonic lands on spring
            const horizDist = Math.hypot(sonic.position.x - sp.x, sonic.position.z - sp.z);
            const vertDist = Math.abs(sonic.position.y - sp.y);
            if (horizDist < sp.radius && vertDist < 1.4 && sonic.velocity.y <= 2) {
                sonic.bounceSpring(sp.power);
                sp.bounceTimer = 0.25;
            }
        });

        // 4. Update Dash Pads
        this.dashPads.forEach(dp => {
            if (dp.cooldown > 0) dp.cooldown -= dt;
            const dx = Math.abs(sonic.position.x - dp.x);
            const dz = Math.abs(sonic.position.z - dp.z);
            const dy = Math.abs(sonic.position.y - dp.y);

            if (dx < dp.width / 2 && dz < dp.length / 2 && dy < 1.8 && dp.cooldown <= 0) {
                sonic.applyDash(dp.dirX, dp.dirZ, dp.force);
                dp.cooldown = 0.5; // Trigger cleanly once per pad pass
            }
        });

        // 5. Update Spikes
        this.spikes.forEach(spk => {
            const dist = sonic.position.distanceTo(spk.group.position);
            if (dist < spk.radius + 0.6) {
                const lost = sonic.takeDamage();
                if (lost > 0) {
                    this.spawnScatteredRings(sonic.position.x, sonic.position.y, sonic.position.z, lost);
                }
            }
        });

        // 6. Update Star Post Checkpoints
        this.starPosts.forEach(post => {
            // Spin animation
            if (post.activated) {
                post.headGroup.rotation.y += post.spinSpeed * dt;
                if (post.spinSpeed > 4.0) {
                    post.spinSpeed = Math.max(4.0, post.spinSpeed - dt * 14.0);
                }
                post.glowTimer += dt;
                const pulse = (Math.sin(post.glowTimer * 14) + 1) * 0.5;
                if (post.orbMesh.material && post.orbMesh.material.emissiveIntensity !== undefined) {
                    post.orbMesh.material.emissiveIntensity = 0.6 + pulse * 0.5;
                }
            } else {
                // Gentle idle rotation
                post.headGroup.rotation.y += dt * 1.5;
            }

            // Proximity detection with Sonic across the track lane
            if (!post.activated && !sonic.isDead) {
                const dz = Math.abs(sonic.position.z - post.z);
                const dx = Math.abs(sonic.position.x - post.x);
                const dy = Math.abs(sonic.position.y - post.y);
                if (dz < 3.2 && dx < 15.0 && dy < 4.5) {
                    post.activated = true;
                    post.spinSpeed = 34.0; // Fast 360 spin upon contact!
                    post.orbMesh.material = this.postOrbRedMat;
                    if (window.soundManager && window.soundManager.playStarPost) {
                        window.soundManager.playStarPost();
                    }
                    if (window.game && window.game.setActiveCheckpoint) {
                        // Safe respawn in the center of the track (x: 0) facing forward
                        window.game.setActiveCheckpoint(0, post.y, post.z, post.id);
                    }
                }
            }
        });

        // 7. Update Giant Goal Ring
        if (this.goalRing && !this.goalRing.reached) {
            // Swirl main cosmic portal vortex
            if (this.goalRing.portalMesh) {
                this.goalRing.portalMesh.rotation.z += dt * 1.8;
            }

            // Counter-swirl inner pulse core with rhythmic breathing
            if (this.goalRing.innerCoreMesh) {
                this.goalRing.innerCoreMesh.rotation.z -= dt * 2.5;
                const pulse = 1.0 + Math.sin(time * 3.5) * 0.06;
                this.goalRing.innerCoreMesh.scale.set(pulse, pulse, 1.0);
            }

            // Slowly rotate celestial light beacon & pulse intensity
            if (this.goalRing.beaconMesh) {
                this.goalRing.beaconMesh.rotation.y += dt * 0.4;
                if (this.goalRing.beaconMesh.material) {
                    this.goalRing.beaconMesh.material.opacity = 0.16 + Math.sin(time * 2.2) * 0.05;
                }
            }

            // 16 Orbiting Chaos Energy Sparkles
            if (this.goalSparkles) {
                this.goalSparkles.forEach((s, idx) => {
                    const a = time * 2.2 + (idx / this.goalSparkles.length) * Math.PI * 2;
                    const r = this.goalRing.radius + 1.1 + Math.sin(time * 3.0 + idx) * 0.35;
                    s.position.set(
                        Math.cos(a) * r,
                        Math.sin(a) * r,
                        Math.sin(a * 2.5) * 1.4
                    );
                    const sc = 0.75 + Math.sin(time * 4.0 + idx) * 0.25;
                    s.scale.set(sc, sc, sc);
                });
            }

            // Gateway Trigger Zone Detection:
            // Allows Sonic to cleanly trigger whether running flat on the road, rolling, or jumping!
            const dx = sonic.position.x - this.goalRing.x;
            const dz = sonic.position.z - this.goalRing.z;
            const dy = sonic.position.y - this.goalRing.groundY;

            // 1. Horizontal span (inside the 17m gateway opening + safety margin)
            const inHorizontal = Math.abs(dx) <= (this.goalRing.radius + 1.8);

            // 2. Vertical span (from track floor up to above the top of the ring)
            const inVertical = (dy >= -1.5 && dy <= (this.goalRing.radius * 2.0 + 4.0));

            // 3. Depth span (crossing or close to the gate's Z plane)
            const inDepth = Math.abs(dz) <= 4.5;

            // 4. Fallback 3D sphere from center
            const dist3D = sonic.position.distanceTo(this.goalRing.group.position);
            const inSphere = dist3D <= (this.goalRing.radius + 3.5);

            if ((inHorizontal && inVertical && inDepth) || inSphere) {
                this.goalRing.reached = true;

                // Dramatic warp entry expansion FX
                if (this.goalRing.portalMesh) {
                    this.goalRing.portalMesh.scale.multiplyScalar(1.35);
                }
                if (this.goalRing.innerCoreMesh && this.goalRing.innerCoreMesh.material) {
                    this.goalRing.innerCoreMesh.material.opacity = 1.0;
                }

                if (window.soundManager && window.soundManager.playVictory) {
                    window.soundManager.playVictory();
                }
                if (onGoalReached) onGoalReached();
            }
        }
    }
}

window.ObjectManager = ObjectManager;

// Sonic 2D Retro Sprite Sheet Controller & Procedural Pixel-Art Engine
// Slices and animates 16-bit arcade Sonic frames (Idle, Run, Super Peel-Out, Spin Ball) in 3D space.

class SonicSpriteAnimator {
    constructor() {
        this.cols = 6;
        this.rows = 6;
        this.currentCol = 0;
        this.currentRow = 0;
        
        this.animTimer = 0;
        this.currentFrame = 0;
        this.currentAnim = 'idle';
        this.facing = 1; // 1 = right/forward, -1 = left

        // Animation definitions: row, startCol, frameCount, frameDuration
        this.animations = {
            idle: { row: 0, startCol: 0, count: 1, duration: 0.3 },
            run: { row: 0, startCol: 0, count: 6, duration: 0.08 },
            run2: { row: 1, startCol: 0, count: 6, duration: 0.07 },
            peelout: { row: 2, startCol: 1, count: 5, duration: 0.04 },
            peelout_max: { row: 3, startCol: 0, count: 6, duration: 0.035 },
            spin: { row: 5, startCol: 0, count: 5, duration: 0.035 }
        };

        this.initTexture();
        this.createMesh();
    }

    initTexture() {
        const loader = new THREE.TextureLoader();
        
        // Load the transparent 1024x1024 sprite sheet
        this.texture = loader.load(
            'assets/sonic_spritesheet_trans.png',
            () => {
                this.texture.needsUpdate = true;
            },
            undefined,
            () => {
                // Fallback to procedural high-res canvas if image not found
                this.generateFallbackCanvasTexture();
            }
        );

        // Retro pixel crisp filtering
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.minFilter = THREE.NearestFilter;
        this.texture.wrapS = THREE.RepeatWrapping;
        this.texture.wrapT = THREE.RepeatWrapping;

        // Cell sizes in UV space (1/6 = 0.16667)
        this.texture.repeat.set(1 / this.cols, 1 / this.rows);
        this.setFrame(0, 0);
    }

    generateFallbackCanvasTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Draw crisp fallback retro Sonic sprites
        const cellW = canvas.width / this.cols;
        const cellH = canvas.height / this.rows;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = c * cellW + cellW / 2;
                const y = r * cellH + cellH / 2;

                ctx.save();
                ctx.translate(x, y);

                if (r >= 4) {
                    // Spin Dash Ball
                    ctx.fillStyle = '#0055ff';
                    ctx.beginPath();
                    ctx.arc(0, 0, cellW * 0.38, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#88ccff';
                    ctx.lineWidth = 4;
                    ctx.stroke();
                } else if (r >= 2) {
                    // Super Peel-Out with Red Blur Wheel
                    ctx.fillStyle = '#1146d9';
                    ctx.beginPath();
                    ctx.arc(0, -6, cellW * 0.28, 0, Math.PI * 2);
                    ctx.fill();
                    // Red blur circle
                    ctx.strokeStyle = '#e6222b';
                    ctx.lineWidth = 8;
                    ctx.beginPath();
                    ctx.ellipse(0, 14, cellW * 0.32, cellW * 0.18, c * 0.5, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    // Running Sonic
                    ctx.fillStyle = '#1146d9';
                    ctx.beginPath();
                    ctx.arc(0, -8, cellW * 0.26, 0, Math.PI * 2);
                    ctx.fill();
                    // Red sneakers
                    ctx.fillStyle = '#e6222b';
                    ctx.fillRect(-14 + (c % 2) * 10, 12, 16, 8);
                }
                ctx.restore();
            }
        }

        this.texture = new THREE.CanvasTexture(canvas);
        this.texture.magFilter = THREE.NearestFilter;
        this.texture.repeat.set(1 / this.cols, 1 / this.rows);
        if (this.material) this.material.map = this.texture;
    }

    createMesh() {
        // Billboard mesh: size 2.4 x 2.4 units in world
        const geo = new THREE.PlaneGeometry(2.4, 2.4);
        this.material = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            alphaTest: 0.15,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geo, this.material);
        this.mesh.position.y = 1.2;
        this.mesh.castShadow = true;
    }

    setFrame(col, row) {
        this.currentCol = col;
        this.currentRow = row;

        // In Three.js UV coordinates, Y = 0 is bottom, Y = 1 is top
        // Row 0 in our sprite sheet is at the top, so UV Y = 1 - (row + 1) / rows
        const u = (col / this.cols);
        const v = 1.0 - ((row + 1) / this.rows);

        this.texture.offset.set(u, v);
    }

    update(dt, state, speed, isGrounded, isBoosting) {
        // Determine animation sequence based on speed and state
        let targetAnim = 'idle';

        if (state === 'spin' || !isGrounded) {
            targetAnim = 'spin';
        } else if (speed > 42 || isBoosting) {
            targetAnim = speed > 65 ? 'peelout_max' : 'peelout';
        } else if (speed > 2.0) {
            targetAnim = speed > 22 ? 'run2' : 'run';
        } else {
            targetAnim = 'idle';
        }

        if (this.currentAnim !== targetAnim) {
            this.currentAnim = targetAnim;
            this.currentFrame = 0;
            this.animTimer = 0;
        }

        const anim = this.animations[this.currentAnim];
        
        // Speed up animation cycle dynamically with speed
        let speedMultiplier = 1.0;
        if (this.currentAnim === 'run' || this.currentAnim === 'run2') {
            speedMultiplier = Math.max(0.6, speed / 20.0);
        } else if (this.currentAnim.startsWith('peelout')) {
            speedMultiplier = Math.max(1.0, speed / 35.0);
        } else if (this.currentAnim === 'spin') {
            speedMultiplier = Math.max(1.2, speed / 25.0);
        }

        this.animTimer += dt * speedMultiplier;
        if (this.animTimer >= anim.duration) {
            this.animTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % anim.count;
        }

        const col = anim.startCol + this.currentFrame;
        const row = anim.row;
        this.setFrame(col, row);
    }

    setFacing(dir) {
        if (dir !== this.facing && dir !== 0) {
            this.facing = dir;
            // Flip sprite plane horizontally if needed
            this.mesh.scale.x = Math.abs(this.mesh.scale.x) * (dir > 0 ? 1 : -1);
        }
    }
}

window.SonicSpriteAnimator = SonicSpriteAnimator;

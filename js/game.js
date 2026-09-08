// Main Game Engine, Camera Controller, HUD, Input, and Game State Loop

class SonicGame {
    constructor() {
        this.container = document.getElementById('game-container');
        this.speedLinesCanvas = document.getElementById('speed-lines-canvas');
        this.ctxLines = this.speedLinesCanvas ? this.speedLinesCanvas.getContext('2d') : null;

        // HUD Elements
        this.scoreEl = document.getElementById('hud-score');
        this.timeEl = document.getElementById('hud-time');
        this.ringsEl = document.getElementById('hud-rings');
        this.boostBarEl = document.getElementById('boost-fill');
        this.speedEl = document.getElementById('hud-speed');
        this.progressBarEl = document.getElementById('stage-progress-fill');
        this.progressTextEl = document.getElementById('stage-progress-text');
        this.stageClearScreen = document.getElementById('stage-clear-modal');
        this.finalScoreEl = document.getElementById('clear-final-score');
        this.finalTimeEl = document.getElementById('clear-final-time');
        this.finalRingsEl = document.getElementById('clear-final-rings');
        this.clearTimeBonusEl = document.getElementById('clear-time-bonus');
        this.clearRingBonusEl = document.getElementById('clear-ring-bonus');
        this.clearBtnGroup = document.getElementById('clear-btn-group');
        this.tallySkipHint = document.getElementById('tally-skip-hint');
        this.isTallying = false;
        this.tallyRaf = null;
        this.tallyTimeout = null;
        this.lastTimeBonus = 0;
        this.lastRingBonus = 0;
        this.respawnToastEl = document.getElementById('respawn-toast');
        this.respawnToastTimer = null;

        // Lives & Game Over System (Option 1)
        this.lives = 3;
        this.livesEl = document.getElementById('hud-lives');
        this.lastHundredRings = 0;
        this.gameOverModal = document.getElementById('game-over-modal');
        this.isDying = false;

        // In-Game Help & Video Background Elements
        this.helpModal = document.getElementById('help-modal');
        this.startBgVideo = document.getElementById('start-bg-video');
        this.isHelpOpen = false;
        this.isLeaderboardOpen = false;

        // Multi-Stage System (Stage 1: Green Hill, Stage 2: Chemical Plant, Stage 3: Hydrocity)
        this.currentStageId = 'green_hill';
        this.stageConfigs = {
            green_hill: { name: 'GREEN HILL ZONE', act: 'ACT 1', totalDist: 5600, nextStage: 'chemical_plant' },
            chemical_plant: { name: 'CHEMICAL PLANT ZONE', act: 'ACT 2', totalDist: 4800, nextStage: 'hydrocity' },
            hydrocity: { name: 'HYDROCITY ZONE', act: 'ACT 3', totalDist: 5000, nextStage: 'green_hill' }
        };

        // Audio Settings Modal Elements
        this.settingsModal = document.getElementById('settings-modal');
        this.bgmSlider = document.getElementById('bgm-slider');
        this.sfxSlider = document.getElementById('sfx-slider');
        this.bgmBadge = document.getElementById('bgm-volume-badge');
        this.sfxBadge = document.getElementById('sfx-volume-badge');
        this.settingsMuteToggle = document.getElementById('settings-mute-toggle');
        this.isSettingsOpen = false;

        // 3... 2... 1... GO! Countdown Elements
        this.countdownOverlay = document.getElementById('countdown-overlay');
        this.countdownNum = document.getElementById('countdown-number');
        this.countdownTimer = 0;
        this.countdownStep = -1;
        this.isRocketStartCharged = false;

        // Leaderboard Manager & Elements
        this.leaderboard = new LeaderboardManager();
        this.leaderboardModal = document.getElementById('leaderboard-modal');
        this.clearNameSection = document.getElementById('clear-name-section');
        this.playerNameInput = document.getElementById('player-name-input');
        this.saveScoreBtn = document.getElementById('save-score-btn');
        this.clearLeaderboardContainer = document.getElementById('clear-leaderboard-container');
        this.clearLeaderboardTableWrap = document.getElementById('clear-leaderboard-table-wrap');
        this.standaloneLeaderboardTableWrap = document.getElementById('standalone-leaderboard-table-wrap');
        this.lastCalculatedScore = 0;

        // Game State
        this.state = 'START'; // START, PLAYING, CLEARED, GAMEOVER
        this.gameTime = 0;
        this.lastFrameTime = performance.now();

        // Input state
        this.input = {
            up: false,
            down: false,
            left: false,
            right: false,
            jump: false,
            boost: false,
            spin: false
        };

        // Camera setup & 360° Free Look Orbit Controls
        this.cameraOffset = new THREE.Vector3(0, 3.8, 8.5);
        this.cameraTarget = new THREE.Vector3();
        this.currentCamPos = new THREE.Vector3(0, 5, 10);
        this.baseFov = 65;
        this.targetFov = 65;
        this.cameraYaw = Math.PI;

        // Interactive 360° Free Look Orbit & Zoom
        this.orbitYawOffset = 0;        // Horizontal orbit angle in radians
        this.orbitPitchOffset = 0;      // Vertical angle in radians (-0.35 to 1.15)
        this.targetOrbitDistance = 5.8; // Closer chase camera so Sonic remains clear and prominent
        this.currentOrbitDistance = 5.8;
        this.isPointerOrbiting = false;
        this.pointerLastX = 0;
        this.pointerLastY = 0;
        this.timeSinceLastOrbit = 999;

        this.initThree();
        this.initEntities();
        this.bindEvents();
        this.bindTouchControls();

        window.addEventListener('resize', () => this.onResize());
        this.onResize();

        // Start Title Intro BGM (Neon Highway Run.mp3)
        if (window.soundManager && window.soundManager.playTitleBGM) {
            window.soundManager.playTitleBGM();
        }

        // Start Loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    initThree() {
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(
            this.baseFov,
            window.innerWidth / window.innerHeight,
            0.1,
            3500
        );

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.container.appendChild(this.renderer.domElement);
    }

    initEntities() {
        this.world = new World(this.scene);
        this.sonic = new SonicPlayer(this.scene);
        this.objects = new ObjectManager(this.scene, this.world);

        // Respawn position
        this.checkpointPos = new THREE.Vector3(0, 1.5, 5);
        this.activeCheckpoint = null;
        this.sonic.position.copy(this.checkpointPos);
        this.sonic.rotationY = Math.PI;
        this.cameraYaw = Math.PI;
    }

    bindEvents() {
        // Keyboard inputs
        window.addEventListener('keydown', (e) => {
            if (this.state === 'CLEARED' && this.isTallying) {
                if (e.code === 'Space' || e.code === 'Enter') {
                    e.preventDefault();
                    this.skipTally();
                    return;
                }
            }

            if (this.state === 'START') {
                this.startGame();
            }

            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.input.up = true;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.input.down = true;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.input.left = true;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.input.right = true;
                    break;
                case 'Space':
                    this.input.jump = true;
                    e.preventDefault();
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                case 'KeyE':
                    this.input.boost = true;
                    break;
                case 'KeyC':
                    this.input.spin = true;
                    break;
                case 'KeyR':
                    this.resetCameraView();
                    break;
                case 'KeyM':
                    window.soundManager.toggleMute();
                    break;
                case 'Escape':
                    if (this.state === 'PLAYING') {
                        if (this.isSettingsOpen) this.hideSettingsModal();
                        else if (this.isHelpOpen) this.hideHelpModal();
                        else if (this.isLeaderboardOpen) this.hideStandaloneLeaderboard();
                        else this.showHelpModal();
                    } else if (this.state === 'START') {
                        if (this.isSettingsOpen) this.hideSettingsModal();
                        else this.hideStandaloneLeaderboard();
                    }
                    break;
            }
        });

        // Disable browser right-click context menu
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        // 360° Mouse / Pointer Orbit Drag (Left click or Right click)
        window.addEventListener('mousedown', (e) => {
            if (e.target.closest('#hud-overlay') || e.target.closest('#touch-controls') || e.target.closest('.modal-overlay') || e.target.closest('#stage-progress-container') || e.target.closest('#top-right-btns')) return;
            // Allow left button (0) or right button (2)
            if (e.button === 0 || e.button === 2) {
                this.isPointerOrbiting = true;
                this.pointerLastX = e.clientX;
                this.pointerLastY = e.clientY;
                this.timeSinceLastOrbit = 0;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isPointerOrbiting) return;
            const deltaX = e.clientX - this.pointerLastX;
            const deltaY = e.clientY - this.pointerLastY;
            this.pointerLastX = e.clientX;
            this.pointerLastY = e.clientY;

            // Sensitivity: smooth responsive 360 rotation
            this.orbitYawOffset -= deltaX * 0.0075;
            this.orbitPitchOffset += deltaY * 0.0055;
            
            // Clamp pitch between -0.35 (looking up from ground) and +1.15 (looking down from above)
            this.orbitPitchOffset = Math.max(-0.35, Math.min(1.15, this.orbitPitchOffset));
            this.timeSinceLastOrbit = 0;
        });

        window.addEventListener('mouseup', () => {
            this.isPointerOrbiting = false;
        });
        window.addEventListener('blur', () => {
            this.isPointerOrbiting = false;
        });

        // Mouse Wheel Zoom
        window.addEventListener('wheel', (e) => {
            if (e.target.closest('.modal-overlay')) return;
            this.targetOrbitDistance += e.deltaY * 0.008;
            this.targetOrbitDistance = Math.max(2.2, Math.min(18.0, this.targetOrbitDistance));
            this.timeSinceLastOrbit = 0;
        }, { passive: true });

        // Double click or middle click resets camera view
        window.addEventListener('dblclick', (e) => {
            if (e.target.closest('#hud-overlay') || e.target.closest('#touch-controls') || e.target.closest('.modal-overlay') || e.target.closest('#top-right-btns')) return;
            this.resetCameraView();
        });
        window.addEventListener('auxclick', (e) => {
            if (e.button === 1) {
                this.resetCameraView();
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW':
                case 'ArrowUp':
                    this.input.up = false;
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.input.down = false;
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.input.left = false;
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.input.right = false;
                    break;
                case 'Space':
                    this.input.jump = false;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                case 'KeyE':
                    this.input.boost = false;
                    break;
                case 'KeyC':
                    this.input.spin = false;
                    break;
            }
        });

        // Start screen button
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }

        // Restart button
        const replayBtn = document.getElementById('replay-btn');
        if (replayBtn) {
            replayBtn.addEventListener('click', () => this.restartGame());
        }

        // Mute button
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const isMuted = window.soundManager.toggleMute();
                muteBtn.textContent = isMuted ? '🔇' : '🔊';
                if (this.settingsMuteToggle) {
                    this.settingsMuteToggle.checked = isMuted;
                }
            });
        }

        // Helper to bind robust click & pointer events
        const bindButton = (el, callback) => {
            if (!el) return;
            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                callback();
            });
            el.addEventListener('pointerdown', (e) => e.stopPropagation());
            el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
        };

        // Leaderboard Buttons
        const startLeaderboardBtn = document.getElementById('start-leaderboard-btn');
        bindButton(startLeaderboardBtn, () => this.showStandaloneLeaderboard());

        const hudLeaderboardBtn = document.getElementById('hud-leaderboard-btn');
        bindButton(hudLeaderboardBtn, () => this.showStandaloneLeaderboard());

        const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');
        bindButton(closeLeaderboardBtn, () => this.hideStandaloneLeaderboard());

        const lbCloseXBtn = document.getElementById('lb-close-x-btn');
        bindButton(lbCloseXBtn, () => this.hideStandaloneLeaderboard());

        const resetLeaderboardBtn = document.getElementById('reset-leaderboard-btn');
        if (resetLeaderboardBtn) {
            resetLeaderboardBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Reset leaderboard to default champions? (คืนค่าสถิติเริ่มต้น?)')) {
                    this.leaderboard.reset();
                    this.leaderboard.renderTable(this.standaloneLeaderboardTableWrap);
                }
            });
        }

        // Save score button in Stage Clear
        if (this.saveScoreBtn) {
            this.saveScoreBtn.addEventListener('click', () => this.submitPlayerScore());
        }

        if (this.playerNameInput) {
            this.playerNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.submitPlayerScore();
                }
            });
        }

        // Next Stage button in Stage Clear
        const nextStageBtn = document.getElementById('next-stage-btn');
        if (nextStageBtn) {
            bindButton(nextStageBtn, () => this.startNextStage());
        }

        // Zone Selector Pills on Start Screen
        const pillGreenHill = document.getElementById('zone-pill-greenhill');
        const pillChemical = document.getElementById('zone-pill-chemical');
        const pillHydrocity = document.getElementById('zone-pill-hydrocity');
        if (pillGreenHill) {
            bindButton(pillGreenHill, () => this.selectZone('green_hill'));
        }
        if (pillChemical) {
            bindButton(pillChemical, () => this.selectZone('chemical_plant'));
        }
        if (pillHydrocity) {
            bindButton(pillHydrocity, () => this.selectZone('hydrocity'));
        }

        // Stage Clear Click to Skip Tally
        if (this.stageClearScreen) {
            this.stageClearScreen.addEventListener('click', (e) => {
                if (this.isTallying && !e.target.closest('#clear-name-section') && !e.target.closest('#next-stage-btn')) {
                    this.skipTally();
                }
            });
        }
        if (this.tallySkipHint) {
            this.tallySkipHint.addEventListener('click', (e) => {
                e.stopPropagation();
                this.skipTally();
            });
        }

        // Game Over modal buttons
        const gameoverSaveBtn = document.getElementById('gameover-save-btn');
        if (gameoverSaveBtn) {
            gameoverSaveBtn.addEventListener('click', () => this.submitGameOverScore());
        }

        const gameoverNameInput = document.getElementById('gameover-name-input');
        if (gameoverNameInput) {
            gameoverNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.submitGameOverScore();
                }
            });
        }

        const gameoverRestartBtn = document.getElementById('gameover-restart-btn');
        if (gameoverRestartBtn) {
            gameoverRestartBtn.addEventListener('click', () => this.restartGame());
        }

        // In-Game Help Button & Modal Buttons
        const hudHelpBtn = document.getElementById('hud-help-btn');
        bindButton(hudHelpBtn, () => this.showHelpModal());

        const resumeBtn = document.getElementById('resume-game-btn');
        bindButton(resumeBtn, () => this.hideHelpModal());

        const helpCloseXBtn = document.getElementById('help-close-x-btn');
        bindButton(helpCloseXBtn, () => this.hideHelpModal());

        const quitTitleBtn = document.getElementById('quit-to-title-btn');
        bindButton(quitTitleBtn, () => this.quitToTitleScreen());

        // Settings Buttons & Modal Controls
        const startSettingsBtn = document.getElementById('start-settings-btn');
        bindButton(startSettingsBtn, () => this.showSettingsModal());

        const hudSettingsBtn = document.getElementById('hud-settings-btn');
        bindButton(hudSettingsBtn, () => this.showSettingsModal());

        const helpSettingsBtn = document.getElementById('help-settings-btn');
        bindButton(helpSettingsBtn, () => {
            this.hideHelpModal();
            this.showSettingsModal();
        });

        const settingsCloseXBtn = document.getElementById('settings-close-x-btn');
        bindButton(settingsCloseXBtn, () => this.hideSettingsModal());

        const settingsSaveBtn = document.getElementById('settings-save-btn');
        bindButton(settingsSaveBtn, () => this.hideSettingsModal());

        // Audio Settings Sliders
        if (this.bgmSlider) {
            this.bgmSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                if (this.bgmBadge) this.bgmBadge.textContent = `${val}%`;
                if (window.soundManager) {
                    window.soundManager.setBgmVolume(val / 100);
                }
            });
        }

        if (this.sfxSlider) {
            let sfxPreviewTimer = null;
            this.sfxSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                if (this.sfxBadge) this.sfxBadge.textContent = `${val}%`;
                if (window.soundManager) {
                    window.soundManager.setSfxVolume(val / 100);
                    // Debounced preview sound so player hears volume level
                    if (sfxPreviewTimer) clearTimeout(sfxPreviewTimer);
                    sfxPreviewTimer = setTimeout(() => {
                        window.soundManager.playRing();
                    }, 120);
                }
            });
        }

        if (this.settingsMuteToggle) {
            this.settingsMuteToggle.addEventListener('change', (e) => {
                if (window.soundManager) {
                    const isMuted = window.soundManager.setMuted(e.target.checked);
                    const topMuteBtn = document.getElementById('mute-btn');
                    if (topMuteBtn) topMuteBtn.textContent = isMuted ? '🔇' : '🔊';
                }
            });
        }
    }

    bindTouchControls() {
        const btnUp = document.getElementById('touch-up');
        const btnDown = document.getElementById('touch-down');
        const btnLeft = document.getElementById('touch-left');
        const btnRight = document.getElementById('touch-right');
        const btnJump = document.getElementById('touch-jump');
        const btnBoost = document.getElementById('touch-boost');

        const bindTouch = (el, key, isSpin = false) => {
            if (!el) return;
            const start = (e) => {
                e.preventDefault();
                if (this.state === 'START') this.startGame();
                this.input[key] = true;
                if (isSpin) this.input.spin = true;
            };
            const end = (e) => {
                e.preventDefault();
                this.input[key] = false;
                if (isSpin) this.input.spin = false;
            };
            el.addEventListener('touchstart', start, { passive: false });
            el.addEventListener('touchend', end, { passive: false });
            el.addEventListener('mousedown', start);
            el.addEventListener('mouseup', end);
            el.addEventListener('mouseleave', end);
        };

        bindTouch(btnUp, 'up');
        bindTouch(btnDown, 'down', false);
        bindTouch(btnLeft, 'left');
        bindTouch(btnRight, 'right');
        bindTouch(btnJump, 'jump');
        bindTouch(btnBoost, 'boost');

        // Touch drag to orbit camera on mobile/tablet canvas
        const container = this.container;
        if (container) {
            let touchStartX = 0;
            let touchStartY = 0;
            let isTouchOrbiting = false;

            container.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1 && !e.target.closest('.touch-btn') && !e.target.closest('.modal-overlay')) {
                    isTouchOrbiting = true;
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    this.timeSinceLastOrbit = 0;
                }
            }, { passive: true });

            container.addEventListener('touchmove', (e) => {
                if (!isTouchOrbiting || e.touches.length !== 1) return;
                const deltaX = e.touches[0].clientX - touchStartX;
                const deltaY = e.touches[0].clientY - touchStartY;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;

                this.orbitYawOffset -= deltaX * 0.008;
                this.orbitPitchOffset += deltaY * 0.006;
                this.orbitPitchOffset = Math.max(-0.35, Math.min(1.15, this.orbitPitchOffset));
                this.timeSinceLastOrbit = 0;
            }, { passive: true });

            container.addEventListener('touchend', () => {
                isTouchOrbiting = false;
            }, { passive: true });
        }
    }

    startGame() {
        if (this.state === 'START') {
            const startScreen = document.getElementById('start-screen');
            if (startScreen) startScreen.classList.add('hidden');
            if (this.startBgVideo) {
                try { this.startBgVideo.pause(); } catch (e) {}
            }
            this.startCountdown();
        }
    }

    selectZone(zoneId) {
        this.currentStageId = zoneId;
        const pillGreenHill = document.getElementById('zone-pill-greenhill');
        const pillChemical = document.getElementById('zone-pill-chemical');
        const pillHydrocity = document.getElementById('zone-pill-hydrocity');
        const badgeText = document.getElementById('start-badge-text');

        if (pillGreenHill) pillGreenHill.classList.remove('active');
        if (pillChemical) pillChemical.classList.remove('active');
        if (pillHydrocity) pillHydrocity.classList.remove('active');

        if (zoneId === 'hydrocity') {
            if (pillHydrocity) pillHydrocity.classList.add('active');
            if (badgeText) badgeText.textContent = 'HYDROCITY ZONE • ACT 3';
        } else if (zoneId === 'chemical_plant') {
            if (pillChemical) pillChemical.classList.add('active');
            if (badgeText) badgeText.textContent = 'CHEMICAL PLANT ZONE • ACT 2';
        } else {
            if (pillGreenHill) pillGreenHill.classList.add('active');
            if (badgeText) badgeText.textContent = 'GREEN HILL ZONE • ACT 1';
        }

        this.setStage(zoneId);
    }

    setStage(stageId) {
        this.currentStageId = stageId;
        if (this.world) this.world.loadStage(stageId);
        if (this.objects) this.objects.loadStageObjects(stageId);
    }

    startNextStage() {
        if (this.stageClearScreen) this.stageClearScreen.classList.add('hidden');
        this.clearAllTallyTimers();
        this.isTallying = false;

        const stageCfg = this.stageConfigs[this.currentStageId];
        const nextId = (stageCfg && stageCfg.nextStage) ? stageCfg.nextStage : 'green_hill';
        this.selectZone(nextId);

        // Reset Sonic position to start line
        this.sonic.position.set(0, 1.5, 5);
        this.sonic.rotationY = Math.PI;
        this.sonic.forwardSpeed = 0;
        this.sonic.currentSpeed = 0;
        this.sonic.velocity.set(0, 0, 0);
        this.sonic.strafeVelLateral = 0;
        this.sonic.strafeVelX = 0;
        this.sonic.isLooping = false;
        this.sonic.currentLoop = null;
        this.sonic.loopPitch = 0;
        this.sonic.isDancing = false;
        this.sonic.idleTimer = 0;
        this.sonic.isChargingSpinDash = false;
        this.sonic.isSpinning = false;
        this.sonic.isGrounded = true;

        this.gameTime = 0;
        this.activeCheckpoint = null;
        this.isDying = false;

        // Start countdown with the new zone's music & banner!
        this.startCountdown();
    }

    startCountdown() {
        this.state = 'COUNTDOWN';
        this.countdownTimer = 3.2; // 3.2s total countdown
        this.countdownStep = 3;
        this.isRocketStartCharged = false;

        // Reset Sonic to start line in ready position
        this.sonic.position.set(0, 1.5, 5);
        this.sonic.rotationY = Math.PI;
        this.sonic.forwardSpeed = 0;
        this.sonic.currentSpeed = 0;
        this.sonic.velocity.set(0, 0, 0);
        this.sonic.strafeVelLateral = 0;
        this.sonic.strafeVelX = 0;
        this.sonic.isDancing = false;
        this.sonic.idleTimer = 0;
        this.sonic.isChargingSpinDash = false;
        this.sonic.isSpinning = false;
        this.sonic.isGrounded = true;

        const titleEl = document.getElementById('countdown-title');
        if (titleEl) {
            if (this.currentStageId === 'hydrocity') {
                titleEl.innerHTML = 'HYDROCITY ZONE &bull; ACT 3';
            } else if (this.currentStageId === 'chemical_plant') {
                titleEl.innerHTML = 'CHEMICAL PLANT ZONE &bull; ACT 2';
            } else {
                titleEl.innerHTML = 'GREEN HILL ZONE &bull; ACT 1';
            }
        }

        if (window.soundManager && window.soundManager.playStageBGM) {
            window.soundManager.playStageBGM(this.currentStageId);
        }

        if (this.countdownOverlay) {
            this.countdownOverlay.classList.remove('hidden');
            const countTitle = document.getElementById('countdown-stage-title');
            if (countTitle) {
                const stageCfg = this.stageConfigs[this.currentStageId] || this.stageConfigs.green_hill;
                countTitle.textContent = `${stageCfg.name} • ${stageCfg.act}`;
            }
        }
        if (this.countdownNum) {
            this.countdownNum.textContent = '3';
            this.countdownNum.className = 'countdown-num count-3';
            this.countdownNum.style.animation = 'none';
            void this.countdownNum.offsetWidth;
            this.countdownNum.style.animation = '';
        }

        if (window.soundManager && window.soundManager.playCountdownBeep) {
            window.soundManager.playCountdownBeep('low');
        }
    }

    updateCountdown(dt) {
        this.countdownTimer -= dt;

        // Check if player is holding Down/S and pressing Jump (Space) or Boost to charge Spin Dash / Rocket Start
        const isCharging = (this.input.down && (this.input.jump || this.input.spin)) || this.input.boost;
        if (isCharging) {
            this.isRocketStartCharged = true;
            this.sonic.isChargingSpinDash = true;
            this.sonic.isSpinning = true;
            this.sonic.spinDashCharge = Math.min(5, (this.sonic.spinDashCharge || 0) + dt * 3.0);
            if (this.sonic.modelGroup) this.sonic.modelGroup.rotation.x -= 25.0 * dt;
        }

        // Determine current countdown step
        let currentStep = 3;
        if (this.countdownTimer <= 0.8) {
            currentStep = 0; // GO!
        } else if (this.countdownTimer <= 1.6) {
            currentStep = 1; // 1
        } else if (this.countdownTimer <= 2.4) {
            currentStep = 2; // 2
        } else {
            currentStep = 3; // 3
        }

        // Trigger phase changes, UI updates, and beeps
        if (currentStep !== this.countdownStep) {
            this.countdownStep = currentStep;
            if (this.countdownNum) {
                this.countdownNum.style.animation = 'none';
                void this.countdownNum.offsetWidth;
                this.countdownNum.style.animation = '';

                if (currentStep === 3) {
                    this.countdownNum.textContent = '3';
                    this.countdownNum.className = 'countdown-num count-3';
                    if (window.soundManager) window.soundManager.playCountdownBeep('low');
                } else if (currentStep === 2) {
                    this.countdownNum.textContent = '2';
                    this.countdownNum.className = 'countdown-num count-2';
                    if (window.soundManager) window.soundManager.playCountdownBeep('low');
                } else if (currentStep === 1) {
                    this.countdownNum.textContent = '1';
                    this.countdownNum.className = 'countdown-num count-1';
                    if (window.soundManager) window.soundManager.playCountdownBeep('mid');
                } else if (currentStep === 0) {
                    this.countdownNum.textContent = 'GO!';
                    this.countdownNum.className = 'countdown-num count-go';
                    if (window.soundManager) window.soundManager.playCountdownBeep('go');

                    // If rocket start was charged, launch immediately!
                    if (this.isRocketStartCharged) {
                        this.sonic.triggerRocketStart(62);
                        this.showRespawnToast('🚀 ROCKET START! SUPER SPEED BLAST! (+500 PTS)');
                        this.isRocketStartCharged = false;
                    }
                }
            }
        }

        // When countdown finishes (below 0) -> Transition seamlessly to PLAYING
        if (this.countdownTimer <= 0) {
            if (this.countdownOverlay) {
                this.countdownOverlay.classList.add('hidden');
            }
            this.state = 'PLAYING';
            this.gameTime = 0;
            this.lastFrameTime = performance.now();
        }
    }

    updateCountdownCamera(dt) {
        const sonicPos = this.sonic.position;
        // Total duration is 3.2s. p goes from 0.0 to 1.0 (reaches 1.0 smoothly as GO appears)
        const p = Math.min(1.0, Math.max(0, (3.2 - this.countdownTimer) / 2.7));
        // Smooth easeInOutCubic
        const t = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

        // Start Camera (Dynamic hero 3/4 low angle front-left):
        const startCamX = sonicPos.x - 2.8;
        const startCamY = sonicPos.y + 0.85;
        const startCamZ = sonicPos.z - 3.2;

        // End Camera (Normal 3rd person chase view):
        const endCamX = sonicPos.x;
        const endCamY = sonicPos.y + 3.8;
        const endCamZ = sonicPos.z + 6.8;

        this.camera.position.x = startCamX + (endCamX - startCamX) * t;
        this.camera.position.y = startCamY + (endCamY - startCamY) * t;
        this.camera.position.z = startCamZ + (endCamZ - startCamZ) * t;

        // LookAt target interpolation
        const startLookX = sonicPos.x;
        const startLookY = sonicPos.y + 1.2;
        const startLookZ = sonicPos.z;

        const endLookX = sonicPos.x;
        const endLookY = sonicPos.y + 1.1;
        const endLookZ = sonicPos.z - 8.0;

        this.cameraTarget.x = startLookX + (endLookX - startLookX) * t;
        this.cameraTarget.y = startLookY + (endLookY - startLookY) * t;
        this.cameraTarget.z = startLookZ + (endLookZ - startLookZ) * t;

        this.camera.lookAt(this.cameraTarget);
        this.camera.fov = this.baseFov;
        this.camera.updateProjectionMatrix();
    }

    showHelpModal() {
        if (!this.helpModal) return;
        this.isHelpOpen = true;
        this.helpModal.classList.remove('hidden');
    }

    hideHelpModal() {
        if (!this.helpModal) return;
        this.isHelpOpen = false;
        this.helpModal.classList.add('hidden');
        this.lastFrameTime = performance.now();
    }

    showSettingsModal() {
        if (!this.settingsModal) return;
        this.isSettingsOpen = true;

        if (window.soundManager) {
            const bgmPct = Math.round(window.soundManager.bgmVolume * 100);
            const sfxPct = Math.round(window.soundManager.sfxVolume * 100);
            if (this.bgmSlider) this.bgmSlider.value = bgmPct;
            if (this.sfxSlider) this.sfxSlider.value = sfxPct;
            if (this.bgmBadge) this.bgmBadge.textContent = `${bgmPct}%`;
            if (this.sfxBadge) this.sfxBadge.textContent = `${sfxPct}%`;
            if (this.settingsMuteToggle) this.settingsMuteToggle.checked = !!window.soundManager.isMuted;
        }

        this.settingsModal.classList.remove('hidden');
    }

    hideSettingsModal() {
        if (!this.settingsModal) return;
        this.isSettingsOpen = false;
        this.settingsModal.classList.add('hidden');
        this.lastFrameTime = performance.now();
    }

    quitToTitleScreen() {
        this.hideHelpModal();
        this.hideSettingsModal();
        this.hideStandaloneLeaderboard();
        if (this.countdownOverlay) this.countdownOverlay.classList.add('hidden');
        if (this.stageClearScreen) this.stageClearScreen.classList.add('hidden');
        if (this.gameOverModal) this.gameOverModal.classList.add('hidden');

        this.state = 'START';
        window.soundManager.playTitleBGM();

        // Reset Sonic position and velocities
        this.sonic.position.set(0, 1.5, 5);
        this.sonic.rotationY = Math.PI;
        this.sonic.forwardSpeed = 0;
        this.sonic.velocity.set(0, 0, 0);
        this.sonic.strafeVelLateral = 0;
        this.sonic.strafeVelX = 0;
        this.sonic.isLooping = false;
        this.sonic.currentLoop = null;
        this.sonic.loopPitch = 0;
        this.cameraYaw = Math.PI;
        this.sonic.rings = 0;
        this.sonic.score = 0;
        this.sonic.boostEnergy = 100;
        this.sonic.isGrounded = true;
        this.sonic.isJumping = false;
        this.sonic.isSpinning = false;
        this.sonic.isHurt = false;
        this.sonic.isDead = false;
        this.sonic.deathTimer = 0;
        this.sonic.invulnerableTimer = 0;
        this.sonic.group.visible = true;

        // Reset rings
        this.objects.rings.forEach(r => {
            r.collected = false;
            r.group.visible = true;
        });

        // Reset Star Posts
        this.activeCheckpoint = null;
        if (this.objects.starPosts) {
            this.objects.starPosts.forEach(p => {
                p.activated = false;
                p.orbMesh.material = this.objects.postOrbBlueMat;
                p.spinSpeed = 0;
            });
        }

        if (this.objects.goalRing) {
            this.objects.goalRing.reached = false;
        }

        if (this.objects && this.objects.resetRingFX) {
            this.objects.resetRingFX();
        }

        this.lives = 3;
        this.isDying = false;
        this.lastHundredRings = 0;
        this.updateHUD();

        const startScreen = document.getElementById('start-screen');
        if (startScreen) startScreen.classList.remove('hidden');

        if (this.startBgVideo) {
            try {
                this.startBgVideo.currentTime = 0;
                this.startBgVideo.play().catch(() => {});
            } catch (e) {}
        }
    }

    restartGame() {
        this.clearAllTallyTimers();
        this.isTallying = false;
        if (this.stageClearScreen) this.stageClearScreen.classList.add('hidden');
        if (this.gameOverModal) this.gameOverModal.classList.add('hidden');
        this.hideStandaloneLeaderboard();

        // Reset Lives & Counters
        this.lives = 3;
        this.isDying = false;
        this.lastHundredRings = 0;

        this.gameTime = 0;
        this.sonic.position.set(0, 1.5, 5);
        this.sonic.rotationY = Math.PI;
        this.sonic.forwardSpeed = 0;
        this.sonic.velocity.set(0, 0, 0);
        this.sonic.strafeVelLateral = 0;
        this.sonic.strafeVelX = 0;
        this.sonic.isLooping = false;
        this.sonic.currentLoop = null;
        this.sonic.loopPitch = 0;
        this.cameraYaw = Math.PI;
        this.sonic.rings = 0;
        this.sonic.score = 0;
        this.sonic.boostEnergy = 100;
        this.sonic.isGrounded = true;
        this.sonic.isJumping = false;
        this.sonic.isSpinning = false;
        this.sonic.isHurt = false;
        this.sonic.isDead = false;
        this.sonic.deathTimer = 0;
        this.sonic.invulnerableTimer = 0;
        this.sonic.group.visible = true;

        // Reset rings
        this.objects.rings.forEach(r => {
            r.collected = false;
            r.group.visible = true;
        });

        // Reset Star Posts
        this.activeCheckpoint = null;
        if (this.objects.starPosts) {
            this.objects.starPosts.forEach(p => {
                p.activated = false;
                p.orbMesh.material = this.objects.postOrbBlueMat;
                p.spinSpeed = 0;
            });
        }

        if (this.objects.goalRing) {
            this.objects.goalRing.reached = false;
        }

        if (this.objects && this.objects.resetRingFX) {
            this.objects.resetRingFX();
        }

        this.updateHUD();
        this.startCountdown();
    }

    setActiveCheckpoint(x, y, z, id) {
        this.activeCheckpoint = { x, y, z, id };
        this.showRespawnToast(`⭐ CHECKPOINT #${id + 1} REACHED!`);
    }

    onGoalReached() {
        if (this.state === 'CLEARED') return;
        this.state = 'CLEARED';

        // Halt Sonic smoothly at victory finish line
        if (this.sonic) {
            this.sonic.forwardSpeed = 0;
            this.sonic.isRolling = false;
            this.sonic.isDashing = false;
        }

        window.soundManager.stopBGM();
        if (window.soundManager && window.soundManager.playGoal) {
            window.soundManager.playGoal();
        }

        // Calculate bonuses for 5,600m course (base 500s)
        const timeBonus = Math.max(0, Math.floor((500 - this.gameTime) * 60));
        const ringBonus = this.sonic.rings * 150;
        const totalScore = this.sonic.score + timeBonus + ringBonus;
        this.lastCalculatedScore = totalScore;
        this.lastTimeBonus = timeBonus;
        this.lastRingBonus = ringBonus;

        const clearSubEl = document.getElementById('clear-stage-subtitle');
        const nextBtn = document.getElementById('next-stage-btn');
        if (this.currentStageId === 'hydrocity') {
            if (clearSubEl) clearSubEl.textContent = 'SONIC HAS PASSED HYDROCITY ZONE!';
            if (nextBtn) nextBtn.textContent = 'PLAY GREEN HILL ZONE ➔';
        } else if (this.currentStageId === 'chemical_plant') {
            if (clearSubEl) clearSubEl.textContent = 'SONIC HAS PASSED CHEMICAL PLANT ZONE!';
            if (nextBtn) nextBtn.textContent = 'NEXT STAGE: HYDROCITY ➔';
        } else {
            if (clearSubEl) clearSubEl.textContent = 'SONIC HAS PASSED GREEN HILL ZONE!';
            if (nextBtn) nextBtn.textContent = 'NEXT STAGE: CHEMICAL PLANT ➔';
        }

        // Populate initial tally state
        if (this.finalTimeEl) this.finalTimeEl.textContent = this.formatTime(this.gameTime);
        if (this.finalRingsEl) this.finalRingsEl.textContent = `${this.sonic.rings} RINGS`;
        if (this.clearTimeBonusEl) {
            this.clearTimeBonusEl.textContent = '+0';
            this.clearTimeBonusEl.classList.remove('tally-finished');
        }
        if (this.clearRingBonusEl) {
            this.clearRingBonusEl.textContent = '+0';
            this.clearRingBonusEl.classList.remove('tally-finished');
        }
        if (this.finalScoreEl) {
            this.finalScoreEl.textContent = this.sonic.score.toLocaleString();
            this.finalScoreEl.classList.remove('tally-punch');
        }

        // Hide post-tally actions until counting finishes
        if (this.clearNameSection) this.clearNameSection.classList.add('hidden');
        if (this.clearLeaderboardContainer) this.clearLeaderboardContainer.classList.add('hidden');
        if (this.clearBtnGroup) this.clearBtnGroup.classList.add('hidden');
        if (this.tallySkipHint) this.tallySkipHint.classList.remove('hidden');

        if (this.stageClearScreen) {
            this.stageClearScreen.classList.remove('hidden');
        }

        // Begin rolling counter sequence
        this.startStageClearTally(timeBonus, ringBonus, totalScore);
    }

    startStageClearTally(targetTimeBonus, targetRingBonus, targetTotalScore) {
        this.isTallying = true;
        this.clearAllTallyTimers();

        const baseScore = this.sonic.score;
        let lastSoundTick = 0;

        const rollNumber = (from, to, durationMs, onTick, onComplete) => {
            if (from >= to || durationMs <= 0) {
                onTick(to);
                onComplete();
                return;
            }
            const startTime = performance.now();
            const step = () => {
                if (!this.isTallying) return;
                const now = performance.now();
                const progress = Math.min(1, (now - startTime) / durationMs);
                // Ease out quad for satisfying slowing down
                const eased = 1 - (1 - progress) * (1 - progress);
                const val = Math.round(from + (to - from) * eased);
                onTick(val);

                // Throttle audio ticks to every 55ms for crisp rhythmic feedback
                if (now - lastSoundTick > 55) {
                    lastSoundTick = now;
                    if (window.soundManager && window.soundManager.playTallyTick) {
                        window.soundManager.playTallyTick();
                    }
                }

                if (progress < 1) {
                    this.tallyRaf = requestAnimationFrame(step);
                } else {
                    onTick(to);
                    onComplete();
                }
            };
            this.tallyRaf = requestAnimationFrame(step);
        };

        // Step 1: Count Time Bonus (starts after 300ms)
        this.tallyTimeout = setTimeout(() => {
            if (!this.isTallying) return;
            rollNumber(0, targetTimeBonus, 1100,
                (val) => {
                    if (this.clearTimeBonusEl) this.clearTimeBonusEl.textContent = `+${val.toLocaleString()}`;
                },
                () => {
                    if (!this.isTallying) return;
                    if (this.clearTimeBonusEl) this.clearTimeBonusEl.classList.add('tally-finished');
                    if (window.soundManager && window.soundManager.playTallyDone) {
                        window.soundManager.playTallyDone();
                    }

                    // Step 2: Count Ring Bonus
                    this.tallyTimeout = setTimeout(() => {
                        if (!this.isTallying) return;
                        rollNumber(0, targetRingBonus, 950,
                            (val) => {
                                if (this.clearRingBonusEl) this.clearRingBonusEl.textContent = `+${val.toLocaleString()}`;
                            },
                            () => {
                                if (!this.isTallying) return;
                                if (this.clearRingBonusEl) this.clearRingBonusEl.classList.add('tally-finished');
                                if (window.soundManager && window.soundManager.playTallyDone) {
                                    window.soundManager.playTallyDone();
                                }

                                // Step 3: Roll into Total Final Score with arcade punch
                                this.tallyTimeout = setTimeout(() => {
                                    if (!this.isTallying) return;
                                    rollNumber(baseScore, targetTotalScore, 1000,
                                        (val) => {
                                            if (this.finalScoreEl) {
                                                this.finalScoreEl.textContent = val.toLocaleString();
                                                this.finalScoreEl.classList.add('tally-punch');
                                            }
                                        },
                                        () => {
                                            if (!this.isTallying) return;
                                            this.finishStageClearTally(targetTimeBonus, targetRingBonus, targetTotalScore);
                                        }
                                    );
                                }, 250);
                            }
                        );
                    }, 250);
                }
            );
        }, 300);
    }

    finishStageClearTally(targetTimeBonus, targetRingBonus, targetTotalScore) {
        this.isTallying = false;
        this.clearAllTallyTimers();

        if (this.clearTimeBonusEl) {
            this.clearTimeBonusEl.textContent = `+${targetTimeBonus.toLocaleString()}`;
            this.clearTimeBonusEl.classList.add('tally-finished');
        }
        if (this.clearRingBonusEl) {
            this.clearRingBonusEl.textContent = `+${targetRingBonus.toLocaleString()}`;
            this.clearRingBonusEl.classList.add('tally-finished');
        }
        if (this.finalScoreEl) {
            this.finalScoreEl.textContent = targetTotalScore.toLocaleString();
            this.finalScoreEl.classList.remove('tally-punch');
            void this.finalScoreEl.offsetWidth; // Force reflow for impact animation
            this.finalScoreEl.classList.add('tally-punch');
        }

        if (window.soundManager && window.soundManager.playScoreTotal) {
            window.soundManager.playScoreTotal();
        }

        // Hide skip prompt, reveal name entry & buttons
        if (this.tallySkipHint) this.tallySkipHint.classList.add('hidden');
        if (this.clearNameSection) this.clearNameSection.classList.remove('hidden');
        if (this.clearBtnGroup) this.clearBtnGroup.classList.remove('hidden');

        if (this.playerNameInput) {
            this.playerNameInput.value = 'SONIC';
            setTimeout(() => {
                try {
                    this.playerNameInput.focus();
                    this.playerNameInput.select();
                } catch (e) {}
            }, 200);
        }
    }

    skipTally() {
        if (!this.isTallying) return;
        this.finishStageClearTally(this.lastTimeBonus, this.lastRingBonus, this.lastCalculatedScore);
    }

    clearAllTallyTimers() {
        if (this.tallyRaf) {
            cancelAnimationFrame(this.tallyRaf);
            this.tallyRaf = null;
        }
        if (this.tallyTimeout) {
            clearTimeout(this.tallyTimeout);
            this.tallyTimeout = null;
        }
    }

    showStandaloneLeaderboard() {
        if (!this.leaderboardModal) return;
        this.isLeaderboardOpen = true;
        this.leaderboardModal.classList.remove('hidden');
        this.leaderboard.renderTable(this.standaloneLeaderboardTableWrap);
        if (this.leaderboard.currentMode === 'global') {
            this.leaderboard.fetchGlobalScores().then(() => {
                if (this.isLeaderboardOpen) {
                    this.leaderboard.renderTable(this.standaloneLeaderboardTableWrap);
                }
            });
        }
    }

    hideStandaloneLeaderboard() {
        if (!this.leaderboardModal) return;
        this.isLeaderboardOpen = false;
        this.leaderboardModal.classList.add('hidden');
        this.lastFrameTime = performance.now();
    }

    submitPlayerScore() {
        if (!this.playerNameInput) return;
        const name = this.playerNameInput.value.trim() || 'SONIC';
        const rankIdx = this.leaderboard.addScore(name, this.lastCalculatedScore, this.gameTime, this.sonic.rings);

        if (this.clearNameSection) this.clearNameSection.classList.add('hidden');
        if (this.clearLeaderboardContainer) this.clearLeaderboardContainer.classList.remove('hidden');
        if (this.clearLeaderboardTableWrap) {
            this.leaderboard.renderTable(this.clearLeaderboardTableWrap, rankIdx);
        }

        if (window.soundManager && window.soundManager.playGoal) {
            window.soundManager.playGoal();
        }
    }

    submitGameOverScore() {
        const gameoverNameInput = document.getElementById('gameover-name-input');
        const gameoverNameSection = document.getElementById('gameover-name-section');
        const gameoverLeaderboardContainer = document.getElementById('gameover-leaderboard-container');
        const gameoverLeaderboardTableWrap = document.getElementById('gameover-leaderboard-table-wrap');

        const name = (gameoverNameInput ? gameoverNameInput.value.trim() : '') || 'SONIC';
        const rankIdx = this.leaderboard.addScore(name, this.lastCalculatedScore, this.gameTime, this.sonic.rings);

        if (gameoverNameSection) gameoverNameSection.classList.add('hidden');
        if (gameoverLeaderboardContainer) gameoverLeaderboardContainer.classList.remove('hidden');
        if (gameoverLeaderboardTableWrap) {
            this.leaderboard.renderTable(gameoverLeaderboardTableWrap, rankIdx);
        }

        if (window.soundManager && window.soundManager.playGoal) {
            window.soundManager.playGoal();
        }
    }

    resetCameraView() {
        this.orbitYawOffset = 0;
        this.orbitPitchOffset = 0;
        this.targetOrbitDistance = 5.8;
        this.timeSinceLastOrbit = 999;
    }

    updateCamera(dt) {
        this.timeSinceLastOrbit += dt;

        // Cinematic Dynamic Camera for 3D Loop-The-Loop
        if (this.sonic.isLooping && this.sonic.currentLoop) {
            const loop = this.sonic.currentLoop;
            const sonicPos = this.sonic.position;
            const R = loop.radius;
            
            // Stay inside loop track radius (rCam = R - 5.2) trailing behind Sonic's loop angle
            // Guarantees camera stays inside the track ribbon, giving a thrilling view of Sonic running upside down
            const camAngle = this.sonic.loopAngle - 0.44;
            const rCam = R - 5.2;
            const targetCamY = loop.groundY + R - rCam * Math.cos(camAngle);
            const targetCamZ = loop.centerZ - rCam * Math.sin(camAngle);
            const targetCamX = sonicPos.x + 1.6;

            const camFollowRate = 22.0 * dt;
            this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1.0, camFollowRate);
            this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(1.0, camFollowRate);
            this.camera.position.z += (targetCamZ - this.camera.position.z) * Math.min(1.0, camFollowRate);

            // Dynamic centripetal banking tilt
            const rollAngle = Math.sin(this.sonic.loopAngle) * 0.15;
            this.camera.rotation.z = rollAngle;

            this.cameraTarget.set(sonicPos.x, sonicPos.y + 0.6, sonicPos.z);
            this.camera.lookAt(this.cameraTarget);

            this.camera.fov += (76 - this.camera.fov) * (8.0 * dt);
            this.camera.updateProjectionMatrix();
            return;
        } else {
            // Smoothly restore roll angle to 0
            if (Math.abs(this.camera.rotation.z) > 0.001) {
                this.camera.rotation.z += (0 - this.camera.rotation.z) * Math.min(1.0, 10.0 * dt);
            }
        }

        // Dynamic 3rd person chase camera & 360° Free Look
        const sonicPos = this.sonic.position;
        const speed = this.sonic.currentSpeed;

        // Pitch & distance adjust with speed - tuned closer so Sonic stays prominent
        const speedRatio = Math.min(1.0, speed / this.sonic.boostMaxSpeed);
        
        // Smooth zoom interpolation
        this.currentOrbitDistance += (this.targetOrbitDistance - this.currentOrbitDistance) * Math.min(1.0, 10.0 * dt);
        const dist = this.currentOrbitDistance + speedRatio * 1.0;
        const baseHeight = 2.5 + speedRatio * 0.3;

        // Smooth continuous camera yaw tracking (shortest angular distance)
        if (this.cameraYaw === undefined || isNaN(this.cameraYaw)) {
            this.cameraYaw = (this.sonic.rotationY !== undefined && !isNaN(this.sonic.rotationY)) ? this.sonic.rotationY : Math.PI;
        }
        if (isNaN(this.orbitYawOffset)) this.orbitYawOffset = 0;
        if (isNaN(this.orbitPitchOffset)) this.orbitPitchOffset = 0;

        let yawDiff = this.sonic.rotationY - this.cameraYaw;
        while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
        while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
        this.cameraYaw += yawDiff * Math.min(1.0, 6.5 * dt);

        // Smart auto-recenter:
        // When running at speed (speed > 5) and player has not dragged mouse for 1.2s:
        // Smoothly realign orbit offsets back behind Sonic
        if (speed > 5.0 && !this.isPointerOrbiting && this.timeSinceLastOrbit > 1.2) {
            this.orbitYawOffset += (0 - this.orbitYawOffset) * Math.min(1.0, 3.5 * dt);
            this.orbitPitchOffset += (0 - this.orbitPitchOffset) * Math.min(1.0, 3.5 * dt);
            this.targetOrbitDistance += (5.8 - this.targetOrbitDistance) * Math.min(1.0, 3.0 * dt);
        }

        // Total spherical orbit coordinates
        const totalYaw = this.cameraYaw + this.orbitYawOffset;
        const totalPitch = this.orbitPitchOffset;

        const hDist = dist * Math.cos(totalPitch);
        const vDist = dist * Math.sin(totalPitch) + baseHeight;

        const targetCamX = sonicPos.x + Math.sin(totalYaw) * -hDist;
        const targetCamY = sonicPos.y + vDist;
        const targetCamZ = sonicPos.z + Math.cos(totalYaw) * -hDist;

        // Snappy camera follow with NaN guard
        const camFollowRate = (12.0 + speedRatio * 4.0) * dt;
        if (!isNaN(targetCamX) && !isNaN(targetCamY) && !isNaN(targetCamZ)) {
            this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1.0, camFollowRate);
            this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(1.0, camFollowRate);
            this.camera.position.z += (targetCamZ - this.camera.position.z) * Math.min(1.0, camFollowRate);
        }

        // High speed camera vibration / shake
        if (speed > 35 && Math.abs(this.orbitYawOffset) < 0.5) {
            const shake = (speed - 35) * 0.003;
            this.camera.position.x += (Math.random() - 0.5) * shake;
            this.camera.position.y += (Math.random() - 0.5) * shake;
        }

        // Smooth LookAt Target:
        // When orbiting/inspecting: look directly at Sonic's center (y+1.1)
        // When running forward: look slightly ahead along course
        const lookAheadWeight = (speed > 3 && Math.abs(this.orbitYawOffset) < 0.3) ? 1.0 : 0.0;
        const aheadDist = lookAheadWeight * 6.5;

        this.cameraTarget.set(
            sonicPos.x + Math.sin(totalYaw) * aheadDist,
            sonicPos.y + 1.1 + totalPitch * 0.3,
            sonicPos.z + Math.cos(totalYaw) * aheadDist
        );
        this.camera.lookAt(this.cameraTarget);

        // Dynamic FOV Warp (gentle 8 degrees max instead of 32 to prevent shrinking character, plus extra punch during dash)
        const dashKick = (this.sonic && this.sonic.isDashing) ? 7.0 : 0.0;
        this.targetFov = this.baseFov + speedRatio * 8.0 + dashKick;
        this.camera.fov += (this.targetFov - this.camera.fov) * (8.0 * dt);
        this.camera.updateProjectionMatrix();
    }

    drawSpeedLines() {
        if (!this.ctxLines) return;
        const w = this.speedLinesCanvas.width;
        const h = this.speedLinesCanvas.height;
        this.ctxLines.clearRect(0, 0, w, h);

        const speed = this.sonic.currentSpeed;
        const isSuperFast = this.sonic.isBoosting || this.sonic.isDashing;
        if (speed < 24 && !isSuperFast && !this.sonic.isChargingSpinDash) return;

        const count = isSuperFast ? 36 : (this.sonic.isChargingSpinDash ? 20 : 18);
        const cx = w / 2;
        const cy = h / 2;

        this.ctxLines.strokeStyle = isSuperFast ? 'rgba(0, 225, 255, 0.75)' : 'rgba(255, 255, 255, 0.38)';
        this.ctxLines.lineWidth = isSuperFast ? 3.0 : 1.8;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const innerR = Math.min(w, h) * (0.24 + Math.random() * 0.22);
            const outerR = innerR + 80 + Math.random() * 180;

            const x1 = cx + Math.cos(angle) * innerR;
            const y1 = cy + Math.sin(angle) * innerR;
            const x2 = cx + Math.cos(angle) * outerR;
            const y2 = cy + Math.sin(angle) * outerR;

            this.ctxLines.beginPath();
            this.ctxLines.moveTo(x1, y1);
            this.ctxLines.lineTo(x2, y2);
            this.ctxLines.stroke();
        }
    }

    updateModeUI(mode) {
        const modeLabel = document.getElementById('mode-label');
        if (modeLabel) {
            if (mode === 'fbx') {
                modeLabel.textContent = '3D ANIMATED RUN';
            } else if (mode === 'gltf') {
                modeLabel.textContent = '3D SONIC DASH';
            } else if (mode === 'sprite') {
                modeLabel.textContent = 'RETRO 2D SPRITE';
            } else {
                modeLabel.textContent = '3D ARTICULATED';
            }
        }
    }

    formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        const ms = Math.floor((sec * 100) % 100);
        return `${m}:${s < 10 ? '0' : ''}${s}:${ms < 10 ? '0' : ''}${ms}`;
    }

    triggerHudRingBounce() {
        if (this.ringsEl) {
            this.ringsEl.classList.remove('hud-ring-bounce');
            void this.ringsEl.offsetWidth;
            this.ringsEl.classList.add('hud-ring-bounce');
        }
        if (this.scoreEl) {
            this.scoreEl.classList.remove('hud-score-bump');
            void this.scoreEl.offsetWidth;
            this.scoreEl.classList.add('hud-score-bump');
        }
    }

    updateHUD() {
        if (this.scoreEl) this.scoreEl.textContent = this.sonic.score.toString().padStart(6, '0');
        if (this.timeEl) this.timeEl.textContent = this.formatTime(this.gameTime);
        if (this.ringsEl) {
            this.ringsEl.textContent = this.sonic.rings;
            if (this.sonic.rings === 0) {
                this.ringsEl.classList.add('pulse-zero');
            } else {
                this.ringsEl.classList.remove('pulse-zero');
            }
        }

        // Lives HUD update
        if (this.livesEl) {
            this.livesEl.textContent = `🦔 x ${this.lives}`;
            if (this.lives <= 1) {
                this.livesEl.classList.add('pulse-low');
            } else {
                this.livesEl.classList.remove('pulse-low');
            }
        }

        // 1-UP: Every 100 rings awards an extra life
        const hundredRings = Math.floor(this.sonic.rings / 100);
        if (hundredRings > this.lastHundredRings) {
            const extraLives = hundredRings - this.lastHundredRings;
            this.lives += extraLives;
            this.lastHundredRings = hundredRings;
            if (window.soundManager && window.soundManager.playOneUp) {
                window.soundManager.playOneUp();
            }
            this.showRespawnToast(`🌟 1-UP! EXTRA LIFE! (ชีวิต +${extraLives} -> ${this.lives})`);
        } else if (hundredRings < this.lastHundredRings) {
            this.lastHundredRings = hundredRings;
        }
        if (this.boostBarEl) {
            const pct = (this.sonic.boostEnergy / this.sonic.maxBoostEnergy) * 100;
            this.boostBarEl.style.width = `${pct}%`;
        }
        if (this.speedEl) {
            // Speedometer in KM/H (speed * 3.6 for realistic platformer scaling)
            const kmh = Math.floor(this.sonic.currentSpeed * 3.6);
            this.speedEl.textContent = `${kmh} KM/H`;
            if (kmh > 200) {
                this.speedEl.style.color = '#ffde00';
            } else {
                this.speedEl.style.color = '#ffffff';
            }
        }
        if (this.progressBarEl) {
            // Stage progress calculation across extended courses
            const totalCourseDist = (this.currentStageId === 'hydrocity') ? 5000 : ((this.currentStageId === 'chemical_plant') ? 4800 : 5600);
            const progress = Math.min(100, Math.max(0, (-this.sonic.position.z / totalCourseDist) * 100));
            this.progressBarEl.style.width = `${progress.toFixed(1)}%`;
            if (this.progressTextEl) {
                this.progressTextEl.textContent = `${Math.floor(progress)}%`;
            }
        }
    }

    showRespawnToast(text = '💥 RESPAWN! KEEP RUNNING!') {
        if (!this.respawnToastEl) return;
        this.respawnToastEl.textContent = text;
        if (text.includes('CHECKPOINT') && !text.includes('RESPAWN')) {
            this.respawnToastEl.style.background = 'rgba(0, 110, 235, 0.95)';
            this.respawnToastEl.style.borderColor = '#ffd700';
        } else {
            this.respawnToastEl.style.background = 'rgba(220, 25, 35, 0.95)';
            this.respawnToastEl.style.borderColor = '#ffd700';
        }
        this.respawnToastEl.classList.remove('hidden');
        if (this.respawnToastTimer) clearTimeout(this.respawnToastTimer);
        this.respawnToastTimer = setTimeout(() => {
            if (this.respawnToastEl) this.respawnToastEl.classList.add('hidden');
        }, 2200);
    }

    respawnSonic(customToastMsg = null) {
        let safeX = 0;
        let safeZ = 5;
        let safeY = 1.5;
        let toastMsg = customToastMsg || '💥 RESPAWN! KEEP RUNNING!';

        if (this.activeCheckpoint) {
            safeX = this.activeCheckpoint.x;
            safeZ = this.activeCheckpoint.z;
            const groundY = this.world.getGroundHeight(safeX, safeZ);
            safeY = (groundY > -40 ? groundY : this.activeCheckpoint.y) + 1.2;
            if (!customToastMsg) {
                toastMsg = `⭐ CHECKPOINT #${this.activeCheckpoint.id + 1} RESPAWN!`;
            }
        } else {
            const curZ = this.sonic.position.z;
            if (curZ <= -4700) safeZ = -4680;
            else if (curZ <= -3500) safeZ = -3480;
            else if (curZ <= -2200) safeZ = -2180;
            else if (curZ <= -1300) safeZ = -1280;
            else if (curZ <= -600) safeZ = -570;
            else if (curZ <= -200) safeZ = -180;
            else safeZ = 5;

            const groundY = this.world.getGroundHeight(0, safeZ);
            safeY = (groundY > -40 ? groundY : 0) + 1.2;
        }

        this.sonic.position.set(safeX, safeY, safeZ);
        this.sonic.velocity.set(0, 0, 0);
        this.sonic.forwardSpeed = 0;
        this.sonic.strafeVelLateral = 0;
        this.sonic.strafeVelX = 0;
        this.sonic.rotationY = Math.PI; // Face forward down course
        this.sonic.isGrounded = true;
        this.sonic.isJumping = false;
        this.sonic.isSpinning = false;
        this.sonic.isHurt = false;
        this.sonic.isDead = false;
        this.sonic.deathTimer = 0;
        this.sonic.rings = 0;
        this.sonic.invulnerableTimer = 3.0; // 3 seconds safe i-frames upon respawn
        this.sonic.group.visible = true;

        this.cameraYaw = Math.PI;
        this.orbitYawOffset = 0;
        this.orbitPitchOffset = 0;
        this.targetOrbitDistance = 5.8;
        this.currentOrbitDistance = 5.8;
        this.camera.fov = this.baseFov;
        this.targetFov = this.baseFov;
        this.camera.updateProjectionMatrix();

        this.camera.position.set(safeX, safeY + 2.8, safeZ + 6.5);
        this.cameraTarget.set(safeX, safeY + 1.0, safeZ - 10);
        this.camera.lookAt(this.cameraTarget);

        this.showRespawnToast(toastMsg);
    }

    triggerPlayerDeath(reason = 'spike') {
        if (this.state !== 'PLAYING') return;
        if (this.isDying) return;
        this.isDying = true;

        this.lives = Math.max(0, this.lives - 1);
        this.updateHUD();

        if (reason === 'pit') {
            if (window.soundManager && window.soundManager.playDeath) {
                window.soundManager.playDeath();
            }
            if (this.lives > 0) {
                const toastMsg = `💥 RESPAWN! (LIVES LEFT: ${this.lives})`;
                this.respawnSonic(toastMsg);
                this.isDying = false;
            } else {
                this.onGameOver();
            }
        }
    }

    finishPlayerDeath() {
        if (this.state !== 'PLAYING') return;
        if (this.lives > 0) {
            const toastMsg = `💥 RESPAWN! (LIVES LEFT: ${this.lives})`;
            this.respawnSonic(toastMsg);
            this.isDying = false;
        } else {
            this.onGameOver();
        }
    }

    handlePlayerDeath() {
        this.triggerPlayerDeath('spike');
    }

    onGameOver() {
        if (this.state === 'GAMEOVER') return;
        this.state = 'GAMEOVER';
        window.soundManager.stopBGM();
        if (window.soundManager.playGameOver) {
            window.soundManager.playGameOver();
        }

        const finalScore = this.sonic.score;
        this.lastCalculatedScore = finalScore;

        const gameoverFinalTime = document.getElementById('gameover-final-time');
        const gameoverFinalScore = document.getElementById('gameover-final-score');
        const gameoverNameSection = document.getElementById('gameover-name-section');
        const gameoverLeaderboardContainer = document.getElementById('gameover-leaderboard-container');
        const gameoverNameInput = document.getElementById('gameover-name-input');

        if (gameoverFinalScore) gameoverFinalScore.textContent = finalScore.toLocaleString();
        if (gameoverFinalTime) gameoverFinalTime.textContent = this.formatTime(this.gameTime);

        if (gameoverNameSection) gameoverNameSection.classList.remove('hidden');
        if (gameoverLeaderboardContainer) gameoverLeaderboardContainer.classList.add('hidden');
        if (gameoverNameInput) {
            gameoverNameInput.value = 'SONIC';
            setTimeout(() => {
                try {
                    gameoverNameInput.focus();
                    gameoverNameInput.select();
                } catch (e) {}
            }, 300);
        }

        if (this.gameOverModal) {
            this.gameOverModal.classList.remove('hidden');
        }
    }

    checkPitFall() {
        if (this.state !== 'PLAYING') return;
        if (this.isDying || this.sonic.isDead) return;

        // Fall off the world check: trigger when falling below -14 or below -8 over chasms
        const groundY = (this.world && this.world.getGroundHeight) ? this.world.getGroundHeight(this.sonic.position.x, this.sonic.position.z) : 0;
        if (this.sonic.position.y < -14 || (groundY < -40 && this.sonic.position.y < -8)) {
            this.triggerPlayerDeath('pit');
        }
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);

        if (this.speedLinesCanvas) {
            this.speedLinesCanvas.width = width;
            this.speedLinesCanvas.height = height;
        }
    }

    gameLoop(now) {
        requestAnimationFrame((t) => this.gameLoop(t));

        const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
        this.lastFrameTime = now;

        if (this.state === 'COUNTDOWN') {
            this.updateCountdown(dt);
            this.world.update(dt, this.sonic.position.z);
            this.sonic.update(dt, this.input, this.world);
            this.updateCountdownCamera(dt);
            this.drawSpeedLines();
            this.updateHUD();
        } else if (this.state === 'PLAYING') {
            if (!this.isHelpOpen && !this.isLeaderboardOpen && !this.isSettingsOpen) {
                this.gameTime += dt;

                // Entities update
                this.sonic.update(dt, this.input, this.world);
                this.world.update(dt, this.sonic.position.z);
                this.objects.update(dt, this.sonic, () => this.onGoalReached());

                // Immediate fatal damage death trigger
                if (this.sonic.isDead && !this.isDying) {
                    this.triggerPlayerDeath('spike');
                }

                // Handle fatal death animation completion -> respawn or Game Over
                if (this.sonic.isDead && this.sonic.deathTimer <= 0) {
                    this.finishPlayerDeath();
                }

                this.checkPitFall();
                this.updateCamera(dt);
                this.drawSpeedLines();
                this.updateHUD();
            } else {
                // Keep camera view steady when help menu or leaderboard is open
                this.updateCamera(dt);
            }
        } else if (this.state === 'START' || this.state === 'CLEARED' || this.state === 'GAMEOVER') {
            // Idle camera slow orbit or world drift
            this.world.update(dt);
            this.sonic.update(dt, { up: false, down: false, left: false, right: false, jump: false, boost: false, spin: false }, this.world);
            this.updateCamera(dt);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Global modal helpers
window.openHelpModal = () => {
    if (window.game && typeof window.game.showHelpModal === 'function') {
        window.game.showHelpModal();
    } else {
        const m = document.getElementById('help-modal');
        if (m) m.classList.remove('hidden');
    }
};

window.closeHelpModal = () => {
    if (window.game && typeof window.game.hideHelpModal === 'function') {
        window.game.hideHelpModal();
    } else {
        const m = document.getElementById('help-modal');
        if (m) m.classList.add('hidden');
    }
};

window.openLeaderboardModal = () => {
    if (window.game && typeof window.game.showStandaloneLeaderboard === 'function') {
        window.game.showStandaloneLeaderboard();
    } else {
        const m = document.getElementById('leaderboard-modal');
        if (m) {
            m.classList.remove('hidden');
            if (window.game && window.game.leaderboard) {
                window.game.leaderboard.renderTable(document.getElementById('standalone-leaderboard-table-wrap'));
            }
        }
    }
};

window.closeLeaderboardModal = () => {
    if (window.game && typeof window.game.hideStandaloneLeaderboard === 'function') {
        window.game.hideStandaloneLeaderboard();
    } else {
        const m = document.getElementById('leaderboard-modal');
        if (m) m.classList.add('hidden');
    }
};

window.openSettingsModal = () => {
    if (window.game && typeof window.game.showSettingsModal === 'function') {
        window.game.showSettingsModal();
    } else {
        const m = document.getElementById('settings-modal');
        if (m) m.classList.remove('hidden');
    }
};

window.closeSettingsModal = () => {
    if (window.game && typeof window.game.hideSettingsModal === 'function') {
        window.game.hideSettingsModal();
    } else {
        const m = document.getElementById('settings-modal');
        if (m) m.classList.add('hidden');
    }
};

// Bootstrap on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new SonicGame();
    window.gameInstance = window.game;
});

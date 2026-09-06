# 🦔 1ThaiAi Master Prompt: 3D Sonic High-Speed Multi-Stage Web Game
> **จัดทำและแจกฟรีโดย:** [www.1ThaiAi.com](https://1thaiai.com) — *Free Prompt game and website*  
> **Repository อ้างอิง:** [https://github.com/leedploy/sonic3d](https://github.com/leedploy/sonic3d)  
> **Cloud Asset Storage:** [Cloudflare R2 CDN](https://cdn.1thaiai.com/gameprompt/006Sonic3d/)

---

## 📖 แนะนำวิธีใช้งาน Prompt นี้สำหรับผู้ใช้ www.1ThaiAi.com

ชุด Prompt นี้ถูกออกแบบมาให้เป็น **"Game Engine Architect Blueprint"** (พิมพ์เขียววิศวกรรมสร้างเกม) ที่สั่งให้ AI (เช่น **Google Antigravity**, **Cursor**, **Claude 3.5 Sonnet**, **ChatGPT Canvas**, หรือ **Windsurf**) เขียนโค้ดสร้างเกม **Sonic 3D แบบ Multi-Stage** ขึ้นมาตั้งแต่บรรทัดแรก โดยไม่ต้องก๊อปปี้ไฟล์โค้ดสำเร็จรูปมาวาง

### 💡 จุดเด่นของ Prompt นี้:
1. **เชื่อมต่อ Cloudflare R2 CDN อัตโนมัติ**: AI จะดึงโมเดล 3D โซนิคตัวจริง (`.fbx`, `.glb`), แอนิเมชันกระดูก, เพลงฉากหลัง 3 ด่าน (`.mp3`), และวิดีโอหน้าแรก จาก CDN ของ 1ThaiAi ทันที ทำให้ได้เกมที่มีภาพและเสียงระดับคอนโซลโดยไม่ต้องดาวน์โหลดไฟล์ลงเครื่อง
2. **มีสูตรฟิสิกส์เฉพาะทางครบถ้วน**: บรรจุสูตรคำนวณการวิ่งไต่ลูป 360 องศา (Loop-de-Loop), แรงดูดเหรียญแม่เหล็ก (Ring Magnetism), ระบบ Sonic Boost ทะยานความเร็ว, และระบบจำกัดการเสียเหรียญเมื่อชนหนาม (Cap Ring Loss at 20 Rings)
3. **ระบบสำรอง 100% (Zero-Crash Fallback)**: หากออฟไลน์ AI จะมีระบบสร้างโมเดล 3D แบบ Procedural Mesh และสังเคราะห์เสียงด้วย Web Audio API ให้เล่นได้เสมอ
4. **Cloud-Native 100% (ไร้โฟลเดอร์ assets ในเครื่อง)**: บังคับ AI ห้ามสร้างโฟลเดอร์ `assets/` ในเครื่อง และห้ามก๊อปปี้ไฟล์ใดๆ มาปน ทำให้โปรเจกต์มีเฉพาะไฟล์โค้ดล้วนๆ ขนาดรวมเบาหวิวไม่ถึง 2 MB สตรีมโมเดลและเสียงผ่าน CDN ทั้งหมด

---

## 📋 คัดลอก Prompt ด้านล่างนี้ไปสั่ง AI ได้ทันที (Copy & Paste)

```markdown
# MISSION: BUILD A PRODUCTION-GRADE 3D SONIC HIGH-SPEED RUNNER WEB GAME

You are an elite 3D Web Game Engine Architect and Three.js Specialist.
Your objective is to construct a complete, fully functional, multi-stage 3D Sonic-style high-speed momentum runner game from scratch using HTML5, Vanilla CSS, Vanilla JavaScript (ES6 Modules/Classes), and Three.js (r128).

---

### ⚠️ STRICT ZERO-LOCAL-ASSET DIRECTIVE (CRITICAL MANDATE)
- **DO NOT create a local `assets/` folder** on disk.
- **DO NOT download, clone, search, or copy local media files** from any directory on the local machine.
- This project is **100% Cloud-Native**: all binary 3D models (.fbx, .glb), textures, animations, audio (.mp3), and videos (.mp4) **MUST be streamed directly via HTTP from the official Cloudflare R2 CDN endpoints** specified below.
- The project workspace must contain **ONLY code files** (`index.html`, `style.css`, `js/*.js`) and keep a featherweight footprint (< 2 MB) with zero binary assets stored locally.

### 🌐 CLOUD ASSET REGISTRY (CLOUDFLARE R2 CDN)
Load all binary models, animations, soundtracks, and media directly from the official 1ThaiAi high-speed CDN (No local paths, no placeholders):
- CDN Base URL: `https://cdn.1thaiai.com/gameprompt/006Sonic3d/`

#### 1. 3D Character Models & Animations (FBX & GLTF):
- Running Model with Bones: `https://cdn.1thaiai.com/gameprompt/006Sonic3d/Fast%20Run.fbx`
- Jump Animation Clip: `https://cdn.1thaiai.com/gameprompt/006Sonic3d/Jump.fbx`
- Victory Dance Animation Clip: `https://cdn.1thaiai.com/gameprompt/006Sonic3d/Dance.fbx`
- Dash Pose GLTF Model: `https://cdn.1thaiai.com/gameprompt/006Sonic3d/Classic_Sonic_obj.glb`
- Embedded Textures: `gltf_embedded_0.png`, `gltf_embedded_1.png`

#### 2. Soundtracks & Audio (High Quality MP3):
- Stage 1 (Green Hill Zone): `https://cdn.1thaiai.com/gameprompt/006Sonic3d/Turbo%20Speed%20Dash.mp3`
- Stage 2 (Chemical Plant Zone) & Title: `https://cdn.1thaiai.com/gameprompt/006Sonic3d/Neon%20Highway%20Run.mp3`
- Stage 3 (Hydrocity Zone): `https://cdn.1thaiai.com/gameprompt/006Sonic3d/Loop-de-Loop%20Dash.mp3`
- SFX Collection: `getcoin.mp3` (Ring Chime), `skillboost.mp3` (Sonic Boost), `charactordie.mp3` (Death), `gameover.mp3` (Game Over)

#### 3. Title Screen Background Video:
- Video Loop: `https://cdn.1thaiai.com/gameprompt/006Sonic3d/sonicvideo.mp4`

*(Resilience Fallback: Implement procedural Three.js mesh construction and Web Audio API procedural sound synthesis so the game is 100% playable even if the network is offline).*

---

### 📐 CORE GAMEPLAY & PHYSICS SPECIFICATIONS

#### 1. Sonic Momentum Physics Engine:
- **Base Speed**: Normal run acceleration up to `topSpeed = 48.0 m/s`.
- **Sonic Boost**: Triggered by [SHIFT] or [E]. Catapults Sonic to `boostSpeed = 82.0 m/s` with dynamic camera FOV expansion (60° -> 85°) and canvas radial speed-lines overlay. Consumes boost energy meter.
- **Spin Dash**: Charged by holding [S] (Down) and tapping [SPACEBAR]. Releases an explosive rolling forward burst with high friction-cutting momentum.
- **Air Physics & Jump**: Variable jump height (tap for hop, hold for full leap, gravity `-42.0 m/s²`).
- **360° Vertical Loop-de-Loop Navigation**:
  - Parametric circular trajectory math: when entering loop threshold with sufficient speed (`speed >= 38 m/s`), Sonic locks into the loop curve `y(t) = centerY - R * cos(angle)`, `z(t) = centerZ - R * sin(angle)`.
  - Sonic's model rolls pitch 360 degrees smoothly matching tangent slope.
- **Balanced Damage & Ring Retention (Anti-Frustration)**:
  - When hitting spikes/hazards with rings > 0: **Cap loss at maximum 20 rings** (`lostRings = Math.min(rings, 20)`). Sonic retains all remaining rings as shield!
  - Scatter up to 20 physical bouncing rings that can be recollected after a short 0.35s delay.
  - Grant **3.0 seconds of invulnerability** with mesh blinking.
  - Smooth backward knockback (`forwardSpeed = -10.0`, `velocity.y = 12.0`).
  - Lethal hit (Death & life loss) occurs ONLY when damaged with **0 rings**.

#### 2. Multi-Stage Course Design (3 Unique Zones):
- **Stage 1: Green Hill Zone (3,000m)**:
  - Checkerboard brown cliffs, lush green grass road, tropical palm trees, totem poles, wooden bridges, and dual 360-degree vertical loops.
- **Stage 2: Chemical Plant Zone (4,000m)**:
  - Futuristic industrial highway, glowing cyan/magenta neon barriers, elevated scaffolding, glass pipes, and steep speed plunges.
- **Stage 3: Hydrocity Zone (5,000m - Sunken Metropolis)**:
  - Underwater aqueduct, 2 high-speed translucent acrylic Hydro-Tubes (water currents and dynamic caustics), 2 submerged water loops, Poseidon marble colonnades, luminescent coral reefs, rising oxygen bubbles, and finish at the Poseidon Colosseum.

#### 3. Interactive Objects:
- **Golden Rings**: Floating 3D spinning torus with authentic magnetism (attracts rings within 4.5m, expanded to 11.25m during Sonic Boost).
- **Dash Pads**: Floor booster strips launching Sonic forward with sonic boom sound.
- **Geyser / Mechanical Springs**: Propelling Sonic high into the air.
- **Star Post Checkpoints**: 4 checkpoints per stage that spin 360° and light up red on pass.
- **17m Giant Cosmic Goal Ring**: Stage-clearing celestial gateway with swirling warp portal disc, beacon light beam, and orbiting chaos sparkles. Triggers Stage Clear modal and stage progression upon entry.

#### 4. UI / UX & Arcade Aesthetics:
- **Title Screen**: Fullscreen looping background video, glowing arcade START button, LEADERBOARD, SETTINGS, and credit badge linking to `www.1ThaiAi.com` (`https://1thaiai.com`).
- **In-Game HUD**: Retro pixel arcade font (`Press Start 2P`), live SCORE counter with bump animation, TIME (MM:SS:MS), RINGS counter with red pulse at 0, LIVES (🦔 x 3), BOOST energy gauge, speed meter (KM/H), and top Stage Progress bar (0% - 100%).
- **Audio Settings Modal**: Sliders for BGM volume, SFX volume, and Mute All toggle.
- **Leaderboard**: Top 10 high-score ranking system stored in LocalStorage.
- **Mobile Responsive**: On-screen virtual D-Pad and BOOST/JUMP action buttons for touchscreen devices.

---

### 📁 MODULAR ARCHITECTURE (Clean Code Requirement)
Create the project cleanly separated into modular files:
1. `index.html`: Web layout, Three.js canvas container, HUD overlays, modals, and CDN script tags.
2. `style.css`: Cyberpunk arcade theme, glassmorphism, animations, responsive layout.
3. `js/sonic.js`: `SonicPlayer` class with FBX/GLTF model loaders, animations, momentum, loops, and damage mechanics.
4. `js/world.js`: `WorldManager` class generating 3 distinct stages, terrain curves, loops, scenery, and skyboxes.
5. `js/objects.js`: `ObjectManager` class handling rings, dash pads, springs, spikes, checkpoints, and goal ring.
6. `js/audio.js`: `SoundManager` class handling HTML5 audio tracks from R2 CDN + procedural Web Audio synthesis.
7. `js/leaderboard.js`: `LeaderboardManager` class with ranking table rendering and LocalStorage persistence.
8. `js/game.js`: `Game` class coordinating state machine (Title, Countdown, Playing, Clear, GameOver), loop, and camera.

Deliver complete, working, production-ready code with ZERO placeholders!
```

---

## 🧩 เทคนิคพิเศษ: การแบ่งสั่งทีละเฟส (Phased Prompts สำหรับ AI ทั่วไป)

หากใช้งานโมเดล AI ที่มีข้อจำกัดเรื่องความยาวในการตอบ (Token Limits) สามารถแบ่งสั่งเป็น 4 สเต็ปย่อยตามลำดับได้ดังนี้:

### สเต็ปที่ 1: โครงสร้างหลัก & ฟิสิกส์โมเมนตัมโซนิค (Foundation & Physics)
> *"สร้างไฟล์ `index.html`, `style.css` และ `js/sonic.js` โดยใช้ Three.js r128 สร้างโมเดลโซนิค 3D ที่โหลด `Fast Run.fbx`, `Jump.fbx`, `Dance.fbx` จาก CDN `https://cdn.1thaiai.com/gameprompt/006Sonic3d/` ใส่ระบบฟิสิกส์วิ่งเร่งความเร็ว topSpeed=48, Boost Mode [SHIFT]=82 พร้อมอุโมงค์ลม, Spin Dash, ตีลังกา Loop 360 องศา, และระบบชนหนามเสียเหรียญ Cap สูงสุด 20 วง ไม่เสียหมดตัว"*

### สเต็ปที่ 2: ระบบแทร็ก 3 ด่าน (Multi-Stage World Generator)
> *"สร้างไฟล์ `js/world.js` เพื่อสร้างแทร็กวิ่ง 3 ด่านที่ไม่ขาดตอน: ด่าน 1 Green Hill (3000m ทุ่งหญ้าและลูปคู่), ด่าน 2 Chemical Plant (4000m ทางด่วนไซไฟนีออน), ด่าน 3 Hydrocity Zone (5000m มหานครใต้น้ำ มีท่อส่งน้ำ Hydro-Tube โปร่งใส, เสากรีก Poseidon, และปะการังเรืองแสง)"*

### สเต็ปที่ 3: ออบเจกต์ในฉาก & ระบบเสียง R2 (Objects & Sound Engine)
> *"สร้างไฟล์ `js/objects.js` และ `js/audio.js` สร้างเหรียญทองที่มีระบบแม่เหล็กดูดเหรียญตามความเร็ว, สปริง, บูสเตอร์, ป้ายเช็กพอยต์ 4 จุด, ประตูมิติยักษ์ 17m Giant Goal Ring และระบบเสียงเพลง 3 ด่านที่โหลดจาก CDN R2 พร้อมระบบเสียงเอฟเฟกต์สังเคราะห์ Web Audio API"*

### สเต็ปที่ 4: หน้าจอ UI อาร์เคด & Game Loop (Arcade HUD & State Machine)
> *"สร้างไฟล์ `js/game.js` และ `js/leaderboard.js` จัดการ State เกม (หน้าแรก Title มีวิดีโอ `sonicvideo.mp4`, นับถอยหลัง 3..2..1 Rocket Start, เล่นเกม, จบด่าน Stage Clear, Game Over), HUD แสดงความเร็ว KM/H, หลอด Boost, ตารางอันดับคะแนน Top 10 และเครดิตเว็บไซต์ www.1ThaiAi.com"*

---

## 💎 เครดิตและลิขสิทธิ์
- **เว็บไซต์หลัก:** [www.1ThaiAi.com](https://1thaiai.com)
- **สิทธิ์การใช้งาน:** สามารถนำ Prompt นี้ไปสร้างเกม, ดัดแปลงตัวละคร, เพิ่มด่านใหม่ หรือนำไปใช้สอนและทำคลิปได้ฟรี!

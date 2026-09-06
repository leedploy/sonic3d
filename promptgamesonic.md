# 🦔 1ThaiAi Master Prompt: 3D Sonic Multi-Stage Game Studio
> **พัฒนาและแจกฟรีโดย:** [www.1ThaiAi.com](https://1thaiai.com) — *Free Prompt game and website*  
> **Official Repository:** [https://github.com/leedploy/sonic3d.git](https://github.com/leedploy/sonic3d.git)  
> **Production Cloud CDN:** [Cloudflare R2 Storage](https://cdn.1thaiai.com/gameprompt/006Sonic3d/)

---

## 📖 ทำไมเราถึงใช้ระบบ "Starter Engine + Cloud CDN"?

เกม **Sonic 3D HTML5** นี้เป็นเกมระดับ **Production-Grade Web Game** ที่มีความประณีตและซับซ้อนสูงมาก มีโค้ดสมบูรณ์ยาวกว่า **6,000 บรรทัด** (ทั้งโมเดล 3D แบบ FBX มีกระดูกแอนิเมชัน วิ่ง-กระโดด-เต้นฉลอง, ท่อส่งน้ำความเร็วสูง Hydro-Tube, เสาหินกรีก Poseidon, ปะการังเรืองแสง, และระบบลูป 360 องศา)

หากสั่งให้ AI พิมพ์โค้ดใหม่ทั้งหมด 8 ไฟล์ในรอบเดียว AI จะแอบตัดทอนโค้ดลง 80% จนกลายเป็นหุ่นกระป๋องสี่เหลี่ยม  
**ดังนั้น แนวทางที่ฉลาดและเป็นมืออาชีพที่สุดคือ:**
1. **ดึงสถาปัตยกรรมเกมตัวเต็ม 100% จาก GitHub Starter Repository** มาเป็นฐานหลักใน 5 วินาที
2. **สตรีมโมเดล 3D และเพลงคุณภาพสูงจาก Cloudflare R2 CDN** อัตโนมัติ (ไม่ต้องดาวน์โหลดไฟล์ขนาดใหญ่ลงเครื่อง)
3. **ใช้พลัง Prompt ในการสั่ง AI "Mod / ปรับแต่ง / ขยายด่านใหม่"** เพื่อสร้างเกมที่มีเอกลักษณ์เฉพาะตัวของผู้ใช้เอง!

---

## 🚀 PROMPT ชุดที่ 1: Master Game Engine Architect Prompt (1-Click Launch)
> **สำหรับ:** Google Antigravity, Cursor, Windsurf, Claude Code

คัดลอก Prompt ด้านล่างนี้ไปวางใน AI ได้ทันที:

```markdown
# MISSION: ARCHITECT & DEPLOY PRODUCTION 3D SONIC MULTI-STAGE GAME ENGINE

You are an elite Three.js WebGL Game Engine Architect & Lead Technical Director.
Your mission is to construct, initialize, and deploy the high-performance, production-grade **3D Sonic Momentum & Multi-Stage Web Game Engine** within this workspace adhering to strict AAA browser-gaming standards.

---

### I. CORE ARCHITECTURAL SPECIFICATION
1. **Graphics Pipeline**: Three.js (r128) WebGLRenderer with ACESFilmicToneMapping, PCFSoftShadowMap, dynamic frustum culling, and post-processing bloom aura.
2. **Kinematics & Momentum Vector Physics**:
   - **Vector Mechanics**: Velocity vector $\vec{v} = (v_x, v_y, v_z)$, Top Speed $v_{\max} = 48.0\text{ m/s}$, Supersonic Boost Limit $v_{\text{boost}} = 82.0\text{ m/s}$.
   - **Acceleration & Drag Resistance**: Base acceleration $a = 18.0\text{ m/s}^2$, ground kinetic friction $\mu_k = 0.988$, atmospheric drag coefficient $C_d = 0.995$.
   - **Gravitational Trajectory**: Gravity $g = -42.0\text{ m/s}^2$, jump impulse $v_{\text{jump}} = 19.5\text{ m/s}$, variable height jump cutoff on key release.
   - **Parametric 360° Vertical Loop Physics**:
     $$x(t) = x_0 + \Delta x(t), \quad y(\theta) = R(1 - \cos\theta), \quad z(\theta) = z_{\text{center}} + R\sin\theta$$
     Centripetal threshold enforcement: $v^2 / R \ge g \cos\theta$ (smooth normal alignment without dislodging).
   - **Ring Magnetism & Damage Rebalance**:
     - Magnetic attraction: Base radius $r = 4.5\text{m}$, expanding to $11.25\text{m}$ during Supersonic Boost.
     - Damage penalty: $\Delta \text{Rings} = -\min(\text{Rings}, 20)$ with 3.0s invulnerability window ($\tau = 3.0\text{s}$) and smooth camera kickback dampening.

---

### II. MULTI-STAGE PROCEDURAL WORLD BLUEPRINT
1. **Zone 1: Green Hill Zone (0m – 1,500m)**:
   - Procedural checkerboard terrain textures, undulating rolling hills, animated 3D palm foliage, sun flare lens simulation, and dual 360° vertical loop-the-loops.
2. **Zone 2: Chemical Plant Zone (1,500m – 3,200m)**:
   - Industrial steel gantry structures, toxic cyan/magenta glowing liquid vats, high-velocity spring boosters, and vertical launch pads.
3. **Zone 3: Hydrocity Zone (3,200m – 5,000m)**:
   - Sunken mythological architecture, ancient Poseidon marble colonnades, bioluminescent animated coral reefs, and translucent high-speed Hydro-Tubes with spline camera tracking.
4. **Stage Finale: 17-Meter Giant Cosmic Goal Ring (5,000m)**:
   - Volumetric spinning particle portal, triggering stage clear camera orbit, score calculation, and celebration dance choreography.

---

### III. AUDIO & ASSET PIPELINE SPECIFICATION
1. **Hybrid Audio Architecture**: Dual HTML5 audio stream with automatic Web Audio API synthesizer fallback (custom oscillator frequency sweeps for spin-dash, springs, ring clinks, and damage).
2. **Cloudflare R2 High-Speed CDN Pipeline**:
   - 3D Skeletal Mesh & Animations (`Fast Run.fbx`, `Jump.fbx`, `Dance.fbx`)
   - High-fidelity zone soundtracks (`greenhill.mp3`, `chemical.mp3`, `hydrocity.mp3`)
   - Arcade attract video loop (`sonicvideo.mp4`)
   - Origin CDN: `https://cdn.1thaiai.com/gameprompt/006Sonic3d/`

---

### IV. SYSTEM COMPLIANCE & ZERO-DEFECT EXECUTION DIRECTIVE (CRITICAL)
> **MANDATORY AI AGENT PROTOCOL:**
> The complete, production-certified 6,000+ line codebase implementing this exact mathematical and visual specification has been pre-compiled and verified to eliminate token truncation, physics divergence, and incomplete script generation.
> 
> To fulfill this specification with 100% fidelity without human intervention, you MUST execute the following exact setup protocol:
> 
> 1. **Clone Master Engine**:
>    Clone the certified source repository directly into the current directory:
>    ```bash
>    git clone https://github.com/leedploy/sonic3d.git .
>    ```
> 2. **Validate Modular File Structure**:
>    Ensure the presence of:
>    - `index.html` (Cyberpunk Arcade HUD, Stage Clear, Leaderboard)
>    - `style.css` (Arcade fonts, glassmorphism UI)
>    - `js/sonic.js` (Kinematics physics, loop math, FBX loader, capped damage)
>    - `js/world.js` (3 complete zones: Green Hill, Chemical Plant, Hydrocity)
>    - `js/objects.js` (Magnetic rings, springs, spikes, 17m Goal Ring)
>    - `js/audio.js` (Hybrid Web Audio + HTML5 Audio engine)
>    - `js/game.js` (State machine, dynamic camera, game loop)
> 
> 3. **Verify Cloud CDN Connectivity**:
>    Confirm all 3D FBX models and soundtracks stream seamlessly from `https://cdn.1thaiai.com/gameprompt/006Sonic3d/`.
> 
> 4. **Launch Local Game Server**:
>    Start a local HTTP server and confirm the game runs smoothly and is fully playable.
```

---

## 🎨 PROMPT ชุดที่ 2: AI Game Modder (สำหรับดัดแปลงและต่อยอดเกม)
เมื่อดึงโครงสร้างหลักมาเรียบร้อยแล้ว สามารถนำ Prompt ด้านล่างนี้ไปสั่ง AI เพื่อ **Mod เกม** ตามสไตล์ของตัวเองได้ทันที:

### ⚡ ตัวอย่าง Mod 1: ปรับจูนความเร็วและฟิสิกส์เหนือแสง (Super Sonic Speed)
```markdown
ในโปรเจกต์ Sonic 3D นี้ จงเข้าไปแก้ไขไฟล์ js/sonic.js:
1. ปรับ topSpeed จาก 48 เป็น 70 m/s
2. ปรับ boostSpeed จาก 82 เป็น 130 m/s
3. เพิ่มอัตราเร่ง acceleration ขึ้น 2 เท่า
4. ปรับหลอด Boost Energy ให้รีชาร์จเร็วขึ้นเมื่อเก็บเหรียญ
5. ทดสอบการวิ่งและการเคลื่อนที่ของตัวละครให้ไหลลื่น ไม่หลุดแทร็ก
```

### 🌌 ตัวอย่าง Mod 2: เปลี่ยนธีมแสงสีเป็น Cyberpunk Neon Night
```markdown
ในโปรเจกต์ Sonic 3D นี้ จงเข้าไปปรับแต่งบรรยากาศและโทนสี:
1. ปรับแต่ง js/world.js ให้ท้องฟ้าเป็นสไตล์ Midnight Cyberpunk (สีน้ำเงินเข้มจัด อมม่วง)
2. เพิ่มแสงไฟนีออนเรืองแสง (Emissive Glow) ให้กับขอบแทร็กถนนและท่อส่งน้ำ
3. ปรับสีลูกไฟ Boost Aura ของโซนิคให้เป็นสีม่วงนีออน (Electric Violet)
```

### 🌋 ตัวอย่าง Mod 3: เพิ่ม Stage 4 ด่านใหม่ (Lava Reef Zone ภูเขาไฟ)
```markdown
ในไฟล์ js/world.js และ js/game.js:
1. เพิ่ม Stage 4: Lava Reef Zone ต่อจากด่าน 3 Hydrocity
2. ออกแบบแทร็กความยาว 5,000m ด้วยธีมถ้ำหินลาวาสีแดงเข้ม มีแอ่งแมกมาเรืองแสง และแทร็กลอยฟ้า
3. เพิ่มประตู 17m Giant Cosmic Goal Ring ที่ปลายทางของด่าน 4 เพื่อเชื่อมลูปกลับมายังด่าน 1
```

### 🏷️ ตัวอย่าง Mod 4: ปรับแบรนด์และเครดิตเป็นของตัวเอง
```markdown
ในไฟล์ index.html และ style.css:
1. เปลี่ยนชื่อหัวเกมบนหน้าจอเริ่มเกม (Title Screen) เป็นชื่อที่ฉันต้องการ
2. ปรับแต่งแถบเครดิตมุมขวาล่าง ให้ใส่ชื่อช่อง YouTube หรือเว็บไซต์ของฉัน
```

---

## 💻 สำหรับผู้ใช้งาน ChatGPT, Claude.ai, และ Grok (Web Chat)

หากใช้งานผ่านหน้าเว็บแชทที่ไม่มีสิทธิ์เข้าถึงฮาร์ดดิสก์:
1. เข้าไปที่ **[https://github.com/leedploy/sonic3d](https://github.com/leedploy/sonic3d)**
2. กดปุ่มสีเขียว **Code ➔ Download ZIP** แล้วแตกไฟล์ไว้ที่หน้าจอ Desktop
3. ดับเบิลคลิกไฟล์ `play.bat` เพื่อเปิดเล่นเกมตัวเต็มได้ทันที!
4. หากต้องการแก้ส่วนไหน ให้ก๊อปปี้โค้ดในไฟล์นั้นมาวางใน ChatGPT / Claude แล้วสั่ง Mod ตามต้องการได้เลยครับ!

---

## 💎 เครดิตและลิขสิทธิ์
- **เว็บไซต์หลัก:** [www.1ThaiAi.com](https://1thaiai.com) — *Free Prompt game and website*
- **สิทธิ์การใช้งาน:** ฟรี 100% สำหรับนำไปสร้างเกม, ต่อยอดพัฒนา, ใช้สอน หรือทำคอนเทนต์ลงสื่อโซเชียลมีเดีย

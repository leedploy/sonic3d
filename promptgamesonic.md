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

## 🚀 PROMPT ชุดที่ 1: ดึงระบบหลัก & รันเกมทันที (1-Click Launch)
> **สำหรับ:** Google Antigravity, Cursor, Windsurf, Claude Code

คัดลอก Prompt ด้านล่างนี้ไปวางใน AI ได้ทันที:

```markdown
# MISSION: DEPLOY & RUN 3D SONIC MULTI-STAGE GAME ENGINE

You are an expert Three.js Game Engine Architect.
Your task is to set up and run the official production-grade 3D Sonic Multi-Stage Web Game in this workspace:

1. CLONE OFFICIAL REPOSITORY:
   Clone the complete, full-fidelity source code directly from:
   `https://github.com/leedploy/sonic3d.git` into the current workspace directory.
   Ensure all modular source files are present:
   - `index.html` (Cyberpunk Arcade HUD, Stage Clear, Leaderboard)
   - `style.css` (Arcade fonts, glassmorphism UI)
   - `js/sonic.js` (FBX model loader, momentum physics, 360° loop math, cap ring loss)
   - `js/world.js` (3 complete zones: Green Hill, Chemical Plant, Hydrocity Zone)
   - `js/objects.js` (Magnetic rings, boosters, springs, spikes, checkpoints, 17m Goal Ring)
   - `js/audio.js` (Dual HTML5 Audio + Web Audio synthesizer fallback)
   - `js/game.js` (State machine, game loop, dynamic camera controller)

2. VERIFY CLOUDFLARE R2 CDN PIPELINE:
   Confirm that all binary models (Fast Run.fbx, Jump.fbx, Dance.fbx), soundtracks (3 Zones MP3s), 
   and title video (sonicvideo.mp4) stream directly from:
   `https://cdn.1thaiai.com/gameprompt/006Sonic3d/`
   (Zero local binary assets required).

3. LAUNCH GAME SERVER:
   Start a local HTTP server and verify the game opens cleanly and is 100% playable.
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

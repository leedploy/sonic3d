# 🦔 Sonic 3D HTML5 — Multi-Stage High-Speed Browser Runner

[![1ThaiAi.com](https://img.shields.io/badge/Official%20Website-1ThaiAi.com-00f0ff?style=for-the-badge&logo=google-chrome&logoColor=white)](https://1thaiai.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-ffd700?style=for-the-badge)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-r128-004ee6?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Cloudflare R2](https://img.shields.io/badge/Assets-Cloudflare%20R2%20CDN-f38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/products/r2/)

> **พัฒนาและสร้างสรรค์โดย [www.1ThaiAi.com](https://1thaiai.com)** — *Free Prompt game and website*  
> เกม 3D Sonic ความเร็วสูงบนเว็บเบราว์เซอร์ พร้อมระบบฟิสิกส์โมเมนตัม วิ่งไต่ลูป 360 องศา ด่านมหานครใต้น้ำ และโมเดล 3D แบบมีแอนิเมชันกระดูกเต็มรูปแบบ

---

## 🌟 ฟีเจอร์เด่นของเกม (Game Features)

### 1. 🏁 การผจญภัย 3 ด่านเต็มรูปแบบ (3 Iconic Stages)
- **Act 1: Green Hill Zone (ความยาว 3,000m)**: ทุ่งหญ้าสีเขียว ชายหาดเขตร้อน สะพานแขวน และลูป 360 องศาคู่
- **Act 2: Chemical Plant Zone (ความยาว 4,000m)**: มหานครไซไฟ แทร็กนีออน ท่อส่งสารเคมี และรางลอยฟ้า
- **Act 3: Hydrocity Zone (ความยาว 5,000m)**: มหานครใต้น้ำ ท่อส่งน้ำความเร็วสูง (Hydro-Tubes), ลูปน้ำ 360°, เสาหิน Poseidon และลานประลอง Poseidon Colosseum

### 2. ⚡ ระบบฟิสิกส์โมเมนตัมแบบโซนิคแท้ (Authentic Momentum Physics)
- **Sonic Boost**: กดพุ่งเร่งความเร็วทะยานสูงสุด 82 KM/H พร้อมเอฟเฟกต์อุโมงค์ลม Motion Warp
- **Spin Dash**: หมุนตัวชาร์จพลังพุ่งกระสุนฉีกแทร็ก
- **360° Loop-de-Loop**: วิ่งไต่ลูปแนวตั้ง 360 องศาด้วยแรงเหวี่ยงหนีศูนย์กลาง
- **Cap Ring Loss**: วิ่งชนหนามเสียเหรียญสูงสุดเพียง 20 วง ไม่เสียหมดตัว พร้อมเวลาอมตะ 3.0 วินาที

### 3. 🎨 กราฟิกและระบบแอนิเมชัน 3 มิติ (3D Character & Shading)
- โมเดล 3D Sonic แบบ FBX พร้อมแอนิเมชันกระดูก: **Fast Run**, **Jump**, และ **Victory Dance**
- รองรับ Dynamic Shadows, Real-time Caustics และอนุภาคแสง Chaos Sparkles
- ประตูมิติยักษ์ **17m Giant Cosmic Goal Ring** ปิดฉากแต่ละด่านอย่างอลังการ

### 4. 🎵 ระบบเสียงระดับพรีเมียม (Soundtrack & SFX)
- เพลงฉากหลังคุณภาพสูง 3 เพลงประจำ 3 ด่าน:
  - *Turbo Speed Dash.mp3* (Green Hill)
  - *Neon Highway Run.mp3* (Chemical Plant)
  - *Loop-de-Loop Dash.mp3* (Hydrocity)
- ระบบเสียงสังเคราะห์เอฟเฟกต์คู่ขนาน **Web Audio API**

---

## 🕹️ การควบคุม (Controls)

| ปุ่ม | คำสั่ง |
| :--- | :--- |
| **W, A, S, D / ลูกศร** | วิ่ง และบังคับทิศทางซ้าย-ขวา |
| **SPACEBAR** | กระโดด (แตะสั้น=เตี้ย / กดค้าง=กระโดดสูง) |
| **SHIFT / E** | **Sonic Boost** เร่งความเร็วพุ่งทะยาน |
| **Hold S + Tap SPACEBAR** | **Spin Dash** ชาร์จปั่นล้อพุ่งกระสุน |
| **Mouse Drag / Scroll** | หมุนมุมกล้องอิสระ 360° / ซูมเข้า-ออก |
| **R** | รีเซ็ตมุมกล้องกลับมาข้างหลังโซนิค |
| **M** | เปิด / ปิดเสียง (Toggle Mute) |

*รองรับการเล่นบนหน้าจอสัมผัส (Touchscreen Mobile / Tablet) ด้วย D-Pad และปุ่ม Action บนจออัตโนมัติ*

---

## 🌐 Cloudflare R2 CDN Asset Pipeline

โปรเจกต์นี้ใช้สถาปัตยกรรม **Ultra-Lightweight Repository**:
- โค้ด HTML, CSS, JavaScript มีขนาดรวมเพียง **~1.5 MB**
- ไฟล์โมเดล 3D (`.fbx`, `.glb`), เพลงประกอบ (`.mp3`), และวิดีโอ (`.mp4`) ทั้งหมด ถูกโฮสต์บน **Cloudflare R2 Global Edge Storage**:
  - **Base URL**: `https://cdn.1thaiai.com/gameprompt/006Sonic3d/`
  - มีการเปิด **CORS (`Access-Control-Allow-Origin: *`)** เรียบร้อยแล้ว ทำให้สามารถ Clone หรือ Deploy ไปรันบน Vercel, GitHub Pages หรือ Localhost ได้ทันทีโดยไม่ต้องดาวน์โหลดไฟล์ขนาดใหญ่ลงเครื่อง!

---

## 🚀 วิธีเปิดเล่นเกมในเครื่อง (Local Setup)

### วิธีที่ 1: ดับเบิลคลิก `play.bat` (เร็วที่สุดสำหรับ Windows)
เพียงดับเบิลคลิกไฟล์ `play.bat` ตัวเกมจะรัน Local HTTP Server และเปิดเบราว์เซอร์ให้ทันที!

### วิธีที่ 2: ใช้ Python หรือ Node.js
```bash
# Clone repository
git clone https://github.com/leedploy/sonic3d.git
cd sonic3d

# รัน Local Server ด้วย Python
python -m http.server 8000

# หรือรันด้วย Node.js
npx serve .
```
จากนั้นเปิดเบราว์เซอร์ไปที่ `http://localhost:8000`

---

## 🏆 เกี่ยวกับเรา

โปรเจกต์นี้สร้างขึ้นเพื่อสนับสนุนการเรียนรู้ด้านการใช้ Generative AI และ Prompt Engineering ในการสร้างเกมและเว็บไซต์  
เข้าชมเว็บไซต์หลักและคลัง Prompt อื่นๆ ได้ที่:
👉 **[www.1ThaiAi.com](https://1thaiai.com)** — *Free Prompt game and website*

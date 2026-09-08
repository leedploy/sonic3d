# 🚀 คู่มือการนำเกม Sonic 3D ขึ้น Cloudflare Pages + เปิดระบบคะแนนระดับโลก (Global Leaderboard)

เกม Sonic 3D โปรเจกต์นี้ได้รับการออกแบบให้รันบน **Cloudflare Pages** ได้อย่างสมบูรณ์แบบ โดยมีจุดเด่นคือ:
- ✅ **ฟรี Unlimited Bandwidth** (คนเข้ามาเล่นโหลดไฟล์เสียง/3D กี่แสนคนก็ไม่เสียเงิน)
- ✅ **ระบบ Global Leaderboard** ผ่าน Cloudflare Pages Functions (`/api/leaderboard`)
- ✅ **ระบบ Graceful Fallback** หากยังไม่ได้ผูก Database หรือเล่นออฟไลน์ เกมจะสลับไปใช้ `localStorage` ในเครื่องทันที ไม่มีเกมค้างหรือหน้าจอพังแน่นอน

---

## ขั้นตอนที่ 1: นำโปรเจกต์ขึ้น Cloudflare Pages (เลือกวิธีที่สะดวกที่สุด)

### วิธีที่ A: ผ่าน GitHub (แนะนำที่สุด - อัปเดตโค้ดอัตโนมัติ)
1. Push โฟลเดอร์โปรเจกต์นี้ขึ้น GitHub Repository ของคุณ
2. เข้าสู่แดชบอร์ด [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. ไปที่เมนูซ้ายมือ: **Compute (Workers & Pages)** ➔ **Create application** ➔ เลือกแท็บ **Pages**
4. คลิกปุ่ม **Connect to Git** แล้วเลือก Repository เกม Sonic 3D
5. ตั้งค่า Build Configuration:
   - **Framework preset**: `None`
   - **Build command**: ปล่อยว่าง (ไม่ต้องใส่)
   - **Build output directory**: `/` (หรือ `./`)
6. คลิก **Save and Deploy** ➔ รอประมาณ 30 วินาที จะได้ URL เว็บเกมพร้อมเล่นทันที!

---

### วิธีที่ B: ลากโฟลเดอร์ขึ้นเลย (Direct Upload - ไม่ต้องใช้ Git)
1. เข้า [Cloudflare Dashboard](https://dash.cloudflare.com/) ➔ **Compute (Workers & Pages)** ➔ **Create application** ➔ **Pages**
2. เลือกแท็บ **Upload assets**
3. ตั้งชื่อโปรเจกต์ (เช่น `sonic3d-game`)
4. ลากโฟลเดอร์โปรเจกต์นี้ทั้งโฟลเดอร์วางลงในช่องอัปโหลด แล้วกด **Deploy site**

---

### วิธีที่ C: ใช้ Wrangler CLI (พิมพ์คำสั่งใน Terminal)
```bash
npx wrangler pages deploy ./ --project-name=sonic3d-game
```

---

## ขั้นตอนที่ 2: เปิดใช้งานฐานข้อมูล Global Leaderboard (Cloudflare KV)

เพื่อให้คะแนนของผู้เล่นทั่วโลกถูกบันทึกไว้ตลอดกาลบน Edge Cloud ให้ผูก **Cloudflare KV** (ฟรี 100,000 อ่าน/วัน, 1,000 เขียน/วัน):

1. ในหน้า Cloudflare Dashboard ไปที่เมนู **Workers & Pages** ➔ **KV**
2. คลิกปุ่ม **Create namespace**
   - ตั้งชื่อ Namespace Name: `sonic3d_leaderboard`
   - คลิก **Add**
3. กลับไปที่โปรเจกต์ Pages ของคุณ (คลิกชื่อโปรเจกต์เกมในเมนู Workers & Pages)
4. ไปที่แท็บ **Settings** ➔ เมนูด้านซ้ายเลือก **Functions**
5. เลื่อนลงมาที่หัวข้อ **KV namespace bindings** แล้วกด **Add binding**:
   - **Variable name**: พิมพ์คำว่า `LEADERBOARD_KV` *(ต้องเป็นตัวพิมพ์ใหญ่ตามนี้เป๊ะๆ)*
   - **KV namespace**: เลือก namespace `sonic3d_leaderboard` ที่เราเพิ่งสร้าง
6. กด **Save**
7. สั่ง **Redeploy** โปรเจกต์อีกครั้งหนึ่ง (ไปที่แท็บ Deployments ➔ กดปุ่ม `...` ท้ายรายการล่าสุด ➔ เลือก **Retry deployment**)

🎉 **เรียบร้อย!** เมื่อผู้เล่นเข้ามาเล่นเกมและบันทึกคะแนน:
- ตารางคะแนนจะขึ้นสถานะ `🟢 GLOBAL ONLINE`
- ใครเล่นจบจากที่ไหนในโลก อันดับคะแนน Top 10 จะถูกซิงค์แข่งกันแบบเรียลไทม์ทันทีครับ!

---

## 💡 สรุปสถานะการทำงาน (Hybrid Mode)
- **เมื่อต่อ Cloudflare Pages + KV สำเร็จ**: ตารางคะแนนจะดึงสถิติจาก Cloudflare KV มาแสดง พร้อมปุ่มกดสลับดูสถิติในเครื่องตัวเองได้
- **เมื่อเปิดเล่นแบบ Local / Offline**: ระบบจะตรวจพบอัตโนมัติ และสลับไปเป็น `💾 LOCAL STORAGE` ให้ทันที ผู้เล่นยังคงเล่นเกมได้ลื่นไหล บันทึกคะแนนลงเครื่องได้ตามปกติ 100%

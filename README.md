# OB Livestreaming — ระบบลงทะเบียนกิจกรรมชมรม

เว็บแอปพลิเคชันระบบลงทะเบียนกิจกรรมสำหรับ **ชมรม OB Livestreaming** พัฒนาด้วย React + Vite + Tailwind CSS เชื่อมต่อ LINE LIFF SDK และ Google Apps Script (Google Sheets + Gmail)

---

## โครงสร้างโปรเจกต์

```text
├── backend/
│   └── Code.gs              # Google Apps Script API + Email (.ics) + Trigger แจ้งเตือน
├── src/
│   ├── components/          # UI Components (Layout, EventCard, ProfileForm, Toast, Modal, Skeletons)
│   ├── hooks/               # Custom Hooks (useClubApp, useToast)
│   ├── pages/               # Pages (HomePage, EventsPage, MyEventsPage, ProfilePage, OnboardingPage)
│   ├── services/            # API & LIFF Services (api.js, liffService.js)
│   └── utils/               # Date formatting & Form validation
├── .env.example             # ตัวอย่างตัวแปรสภาพแวดล้อม
└── vite.config.js           # ตั้งค่า base: './' และ Tailwind CSS
```

---

## 1. การตั้งค่า LINE LIFF (LINE Developers Console)

1. เข้าไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง **Provider** (หรือใช้ที่มีอยู่) แล้วสร้าง Channel ประเภท **LINE Login**
3. จดค่า **Channel ID** (นำไปใส่ใน Google Apps Script Properties)
4. ไปที่แท็บ **LIFF** → กด **Add**:
   - **Size**: `Full`
   - **Endpoint URL**: URL ของ GitHub Pages เช่น `https://<username>.github.io/<repo-name>/`
   - **Scopes**: ติ๊กเลือก `profile` และ `openid` (สำคัญมากสำหรับ `idToken`)
5. คัดลอก **LIFF ID** มาใส่ใน `.env` (`VITE_LIFF_ID`)

---

## 2. การตั้งค่า Backend (Google Sheets + Google Apps Script)

### ขั้นตอนที่ 1: สร้าง Google Sheet และวางโค้ด
1. สร้าง Google Sheet ใหม่
2. เปิดเมนู **ส่วนขยาย (Extensions)** → **Apps Script**
3. คัดลอกโค้ดทั้งหมดจากไฟล์ [`backend/Code.gs`](backend/Code.gs) ไปวางแทนที่ไฟล์ `Code.gs` แล้วกด Save

### ขั้นตอนที่ 2: ตั้งค่า `LINE_CHANNEL_ID` ใน Script Properties
1. ในหน้า Apps Script ไปที่ **Project Settings (รูปเฟืองซ้ายมือ)**
2. เลื่อนลงไปที่หัวข้อ **Script Properties** → กด **Add script property**:
   - **Property**: `LINE_CHANNEL_ID`
   - **Value**: ใส่ **Channel ID** ของ LINE Login Channel ที่ได้จากข้อ 1
3. กด **Save script properties**

### ขั้นตอนที่ 3: สร้างชีททั้ง 3 ชีทอัตโนมัติ
1. กลับมาที่หน้า Editor ของ Apps Script
2. เลือกฟังก์ชัน `setupSheets` จากแถบด้านบน แล้วกด **Run**
3. กดอนุญาตสิทธิ์ (Authorize) ให้สคริปต์เข้าถึง Google Sheets และ Gmail
4. ตรวจสอบใน Google Sheet จะพบ 3 ชีทพร้อมหัวตาราง:
   - `Users`
   - `Events` (แอดมินกรอกงานที่นี่ โดยกำหนด `date` เป็น `YYYY-MM-DD`, `startTime`/`endTime` เป็น `HH:mm`, `autoRemind` เป็น `TRUE`/`FALSE`, `status` เป็น `OPEN`/`CLOSED`)
   - `Registrations`

### ขั้นตอนที่ 4: Deploy เป็น Web App
1. กด **Deploy** → **New deployment**
2. เลือกประเภทเป็น **Web app**
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
3. กด **Deploy** และคัดลอก **Web app URL** (`.../exec`) ไปใส่ใน `VITE_GAS_API_URL`

### ขั้นตอนที่ 5: ตั้งค่า Trigger แจ้งเตือนอัตโนมัติ (ล่วงหน้า 1 วัน)
1. ในหน้า Apps Script ไปที่เมนู **Triggers (รูปนาฬิกาซ้ายมือ)**
2. กด **+ Add Trigger**:
   - **Choose which function to run**: `sendScheduledReminders`
   - **Select event source**: `Time-driven`
   - **Select type of time based trigger**: `Day timer`
   - **Select time of day**: เช่น `8am to 9am` (หรือเวลาที่ต้องการให้ส่งอีเมลแจ้งเตือน)
3. กด **Save**

---

## 3. การรันบนเครื่อง (Local Development)

```bash
cp .env.example .env
# แก้ไขค่า VITE_LIFF_ID และ VITE_GAS_API_URL ในไฟล์ .env

npm install
npm run dev
```

---

## 4. การ Deploy ขึ้น GitHub Pages

โปรเจกต์ตั้งค่า `base: './'` ใน `vite.config.js` และใช้ `HashRouter` เพื่อรองรับ GitHub Pages โดยไม่เกิดปัญหา 404 เมื่อรีเฟรชหน้าเว็บ

1. ตั้งค่า `.env` (หรือตั้ง GitHub Repository Secrets สำหรับ `VITE_LIFF_ID` และ `VITE_GAS_API_URL` หากใช้ GitHub Actions)
2. Build ไฟล์สำหรับ Production:
   ```bash
   npm run build
   ```
3. อัปโหลดโฟลเดอร์ `dist/` ขึ้น branch `gh-pages` หรือเปิดใช้งาน GitHub Pages จาก GitHub Actions

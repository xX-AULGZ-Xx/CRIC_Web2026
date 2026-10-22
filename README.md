# CRIC Web Application (Next.js Upgrade) - วิทยาลัยการอาชีพเชียงราย

ระบบเว็บไซต์และระบบบริหารจัดการข้อมูลเนื้อหา (CMS) สำหรับ **วิทยาลัยการอาชีพเชียงราย** ซึ่งได้รับการยกระดับสถาปัตยกรรม (Upgrade) จากระบบ PHP เดิม (`cric_new26`) มาเป็น **Modern Full-stack Next.js (App Router)** พร้อม TypeScript, Tailwind CSS, Lucide Icons, Prisma ORM และรองรับการทำงานใน Docker Container

---

## 🚀 จุดเด่นของการ Upgrade (Key Enhancements)

1. **Modern Tech Stack**: พัฒนาด้วย Next.js 16 (React 19) + TypeScript ให้ความเร็ว ความปลอดภัย และประสิทธิภาพ SEO สูงสุด
2. **Direct Database Integration**: เชื่อมต่อฐานข้อมูล MariaDB เดิม (`cric_cms`) ได้ทันที 100% ผ่าน Prisma ORM โดยไม่ต้องแปลงหรือสูญเสียข้อมูลเดิม
3. **Seamless Authentication**: ระบบล็อกอินของ Admin รองรับการถอดรหัสผ่าน Hash แบบ `bcrypt` เดิมจาก PHP ทำให้ผู้ดูแลระบบทุกคนสามารถล็อกอินด้วยรหัสผ่านเดิมได้ทันที
4. **Complete Module Parity**: พอร์ตฟังก์ชันการทำงานครบถ้วน ทั้ง 9 โมดูลหน้าบ้าน และ 13 โมดูลระบบหลังบ้าน
5. **Docker & Container Ready**: มาพร้อม `Dockerfile` (Multi-stage build) และ `docker-compose.yml` รองรับการ Deploy บน Windows Host หรือ Cloud ได้ทันที
6. **Local Storage Compatibility**: รองรับโฟลเดอร์ไฟล์อัปโหลดเดิม 560+ ไฟล์ (~513MB) ใน `public/uploads` พร้อมระบบอัปโหลดไฟล์ใหม่

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```
web_cric_upgrade/
├── src/
│   ├── app/
│   │   ├── (public)/                 # เส้นทางหน้าบ้านสาธารณะ (Public Frontend)
│   │   │   ├── layout.tsx            # Header, TopBar, Footer Layout
│   │   │   ├── page.tsx              # หน้าแรก (Hero Sliders, News, Quick Access, Executives)
│   │   │   ├── news/                 # ระบบข่าวสาร (สารบัญ, หมวดหมู่, ค้นหา, Pagination)
│   │   │   │   └── [slug]/           # หน้ารายละเอียดข่าว (Views counter, Gallery, Tags)
│   │   │   ├── pages/[slug]/         # หน้าเนื้อหาคงที่ (About, Vision, SAR, ฯลฯ)
│   │   │   ├── personnel/            # ทำเนียบบุคลากร (แยกตามฝ่าย/แผนก, หน้าที่พิเศษ)
│   │   │   ├── curriculum/           # สาขาวิชาที่เปิดสอน (ปวช./ปวส.)
│   │   │   │   └── [id]/             # รายละเอียดหลักสูตรและดาวน์โหลดไฟล์
│   │   │   ├── ita/                  # ศูนย์ประเมินคุณธรรมและความโปร่งใส (OIT แยกรายปี)
│   │   │   ├── complaint/            # ศูนย์ร้องเรียนทุจริต + ตรวจสอบสถานะ Ticket
│   │   │   ├── downloads/            # ศูนย์ดาวน์โหลดเอกสารแยกหมวดหมู่
│   │   │   └── gallery/              # คลังรูปภาพกิจกรรม
│   │   │       └── [id]/             # อัลบั้มภาพพร้อม Fullscreen Lightbox Modal
│   │   ├── admin/                    # ระบบหลังบ้านผู้ดูแลระบบ (Admin Backoffice)
│   │   │   ├── layout.tsx            # Admin Sidebar Layout & Session Guard
│   │   │   ├── page.tsx              # Admin Dashboard (สรุปสถิติ, กิจกรรมล่าสุด)
│   │   │   ├── login/                # หน้าเข้าสู่ระบบจัดการ
│   │   │   ├── news/                 # จัดการข่าวสาร (เปลี่ยนสถานะ, ลบ)
│   │   │   ├── complaints/           # จัดการเรื่องร้องเรียน & อัปเดตสถานะ/บันทึกเจ้าหน้าที่
│   │   │   ├── settings/             # ตั้งค่าข้อมูลเว็บไซต์, โลโก้, ธีมสี, ข้อมูลติดต่อ
│   │   │   ├── personnel/            # บริหารรายชื่อบุคลากร
│   │   │   ├── curriculums/          # บริหารข้อมูลหลักสูตร
│   │   │   ├── ita/                  # จัดการหัวข้อการประเมิน ITA
│   │   │   ├── downloads/            # จัดการไฟล์ศูนย์ดาวน์โหลด
│   │   │   ├── galleries/            # จัดการอัลบั้มภาพกิจกรรม
│   │   │   ├── sliders/              # จัดการแบนเนอร์สไลด์หน้าแรก
│   │   │   ├── pages/                # จัดการหน้าคงที่
│   │   │   ├── users/                # จัดการรายชื่อผู้ใช้และสิทธิ์การเข้าถึง
│   │   │   └── audit-logs/           # ประวัติกิจกรรมผู้ใช้งานระบบ (Audit Trail)
│   │   └── api/                      # REST API Endpoints & Server Handlers
│   ├── components/
│   │   ├── layout/                   # Header, TopBar, Footer
│   │   ├── home/                     # HeroSlider, NewsSection, Executives, QuickAccess
│   │   ├── gallery/                  # GalleryViewer (Lightbox modal)
│   │   └── admin/                    # AdminSidebar
│   └── lib/
│       ├── prisma.ts                 # Prisma Client Singleton Instance
│       ├── settings.ts               # โหลดการตั้งค่าเว็บ, ธีมสี, และโครงสร้างเมนู
│       ├── auth.ts                   # ระบบ Session Token (JWT), Password Bcrypt verify
│       └── auth-types.ts             # นิยามสิทธิ์และโครงสร้างข้อมูลผู้ใช้งาน
├── prisma/
│   └── schema.prisma                 # โครงสร้างตารางฐานข้อมูล MariaDB (27 ตาราง)
├── public/
│   ├── uploads/                      # โฟลเดอร์ไฟล์อัปโหลด (คัดลอกจาก cric_new26)
│   └── assets/                       # ไฟล์ภาพและไอคอนพื้นฐาน
├── Dockerfile                        # Multi-stage production container build
├── docker-compose.yml                # Docker Compose สำหรับรันบน Production
└── .env                              # การกำหนดค่าตัวแปรสภาพแวดล้อม
```

---

## ⚙️ การตั้งค่าตัวแปรสภาพแวดล้อม (.env)

ไฟล์ `.env` มีการกำหนดค่าหลักดังนี้:

```env
DATABASE_URL="mysql://root:%40cvcmedia2022@localhost:3306/cric_cms"
NEXTAUTH_SECRET="cric-secret-key-super-secure-change-in-prod"
NEXTAUTH_URL="http://localhost:3000"
```

> **หมายเหตุ:** สำหรับรหัสผ่านที่มีสัญลักษณ์พิเศษ เช่น `@` ใน URL connection ให้แทนที่ด้วย URL Encode (เช่น `@` แปลงเป็น `%40`)

---

## 🛠️ วิธีการรันบนเครื่องเซิร์ฟเวอร์ (Development / Standalone Mode)

### 1. ติดตั้ง Dependencies
```powershell
pnpm install
```

### 2. สร้าง Prisma Client
```powershell
pnpm prisma generate
```

### 3. รัน Development Server
```powershell
pnpm dev
```
เข้าใช้งานผ่านเว็บเบราว์เซอร์ที่: `http://localhost:3000`

### 4. Build และ รันแบบ Production
```powershell
pnpm build
pnpm start
```

---

## 🐳 วิธีการรันด้วย Docker Compose

แอปพลิเคชันได้รับการตั้งค่าให้รันบน Docker และเชื่อมต่อไปยัง MariaDB Service บน Windows Host ผ่าน `host.docker.internal`:

### คำสั่งสั่งรัน:
```powershell
docker compose up -d --build
```

### คำสั่งตรวจสอบสถานะ:
```powershell
docker compose ps
docker compose logs -f
```

---

## 🔐 บัญชีเข้าสู่ระบบผู้ดูแลระบบ (Default Admin Access)

ระบบใช้งานฐานข้อมูลเดิม `users` table:
* **Username**: `admin`
* **Password**: รหัสผ่านเดิมของผู้ดูแลระบบ (ใช้ได้ทันทีโดยไม่ต้องรีเซ็ต)
* **หน้าเข้าสู่ระบบ**: `/admin/login`

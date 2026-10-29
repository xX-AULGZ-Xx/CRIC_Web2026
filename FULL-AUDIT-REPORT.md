# FULL AUDIT REPORT: https://www.cric.ac.th
**เป้าหมายการประเมิน**: เว็บไซต์วิทยาลัยการอาชีพเชียงราย (Chiangrai Industrial and Community Education College)  
**วันที่ตรวจสอบ**: 29 ตุลาคม 2026  
**เครื่องมือ & มาตรฐาน**: Deterministic LLM-First SEO Skill (มาตรฐาน Google Search Central 2026, Core Web Vitals, Schema.org, E-E-A-T)

---

## 1. Executive Summary & Overall Score

| หมวดหมู่ (Category) | น้ำหนัก (Weight) | คะแนน (Score) | สถานะ (Status) |
|---|---|---|---|
| **1. Technical SEO** | 25% | **76 / 100** | ⚠️ Warning (ต้องการการปรับแต่ง) |
| **2. Content Quality & E-E-A-T** | 20% | **82 / 100** | ✅ Good (เนื้อหาครบถ้วน น่าเชื่อถือ) |
| **3. On-Page SEO** | 15% | **52 / 100** | ⚠️ Needs Improvement (ขาด Meta เฉพาะหน้า) |
| **4. Schema & Structured Data** | 15% | **20 / 100** | 🔴 Critical (ยังไม่มี JSON-LD Schema) |
| **5. Performance (Core Web Vitals)** | 10% | **88 / 100** | ✅ Good (ความเร็วการตอบสนองดี) |
| **6. Image Optimization** | 10% | **92 / 100** | ✅ Excellent (WebP, Alt text ดีมาก) |
| **7. AI Search Readiness (GEO/AEO)** | 5% | **45 / 100** | ⚠️ Needs Improvement (ยังไม่มี llms.txt) |
| **คะแนนรวมสุทธิ (Overall Score)** | **100%** | **66.5 / 100** | ⚠️ **Needs Improvement (ปานกลาง - ต้องปรับปรุง)** |

---

## 2. Evidence-Based Audit Findings (การตรวจพบพร้อมหลักฐานจริง)

### 🔴 Critical Issues (ต้องแก้ไขทันที - ส่งผลโดยตรงต่อการจัดอันดับและการแสดงผล)

#### 1. ขาด Structured Data (JSON-LD Schema) ทุกหน้าในเว็บไซต์
- **Evidence**: ตรวจสอบแท็ก `<script type="application/ld+json">` ในหน้าแรก, `/news`, `/news/[id]`, `/curriculum`, `/ita` พบจำนวน = **0 ชุด**
- **Impact**: Google ไม่สามารถสร้าง Rich Results (เช่น การ์ดข่าวเด่น, ข้อมูลคอร์สเรียน, โลโก้สถานศึกษาใน Knowledge Panel, Breadcrumbs) และทำให้คะแนนการเข้าใจโครงสร้างเว็บลดลงอย่างมาก
- **Fix**: เพิ่ม JSON-LD Schema:
  - หน้าแรก: `EducationalOrganization` หรือ `CollegeOrUniversity`
  - หน้ารายละเอียดข่าว (`/news/[id]`): `NewsArticle`
  - หน้าหลักสูตร (`/curriculum`): `Course`
  - หน้าภายในทั้งหมด: `BreadcrumbList`

#### 2. หน้าข่าวรายบทความ (`/news/[id]`) ยังใช้ Title & Meta Description ของเว็บส่วนกลาง
- **Evidence**: สุ่มตรวจสอบหน้าข่าว `https://www.cric.ac.th/news/121` (ข่าวรับสมัครนักศึกษา 2570):
  - `<title>`: `"วิทยาลัยการอาชีพเชียงราย"` (ไม่ระบุหัวข้อข่าว)
  - `<meta name="description">`: `"Chiangrai Industrial And Community Education College"`
- **Impact**: เมื่อ Google นำบทความข่าวไปแสดงในผลการค้นหา ทุกข่าวจะมีชื่อ Title ซ้ำกันทั้งหมด (Duplicate Titles) และไม่มีข้อความสรุปเนื้อหาข่าว ทำให้ CTR ตกต่ำ และ Google ลดทอนอันดับข่าว
- **Fix**: นำฟังก์ชัน `generateMetadata` ใน Next.js App Router มาใส่ใน `src/app/(public)/news/[id]/page.tsx` เพื่อดึง `article.title` และเนื้อหาย่อมาทำเป็น Dynamic `<title>` และ `<meta description>`

#### 3. ขาด Open Graph (OG Tags) และ Twitter Cards ทั้งระบบ
- **Evidence**: ตรวจไม่พบแท็ก `og:title`, `og:description`, `og:image`, `og:url` และ `twitter:card` ในการตอบกลับ HTML
- **Impact**: เมื่อครู อาจารย์ หรือประชาชนนำลิงก์ข่าวสาร/หลักสูตรไปแชร์ใน **LINE, Facebook, X (Twitter)** ระบบจะไม่สามารถดึงรูปภาพปกและหัวข้อข่าวขึ้นมาเป็นการ์ดพรีวิวได้ กลายเป็นลิงก์เปล่าสีเทา
- **Fix**: เพิ่ม Open Graph tags พื้นฐานลงใน `layout.tsx` และ Dynamic Open Graph ในหน้ารายละเอียดข่าว/หลักสูตร

---

### ⚠️ Warning Issues (ควรปรับปรุงเพื่อดันอันดับให้ติดหน้าแรก)

#### 4. ขาด Canonical URLs (`<link rel="canonical">`)
- **Evidence**: ไม่พบแท็ก `<link rel="canonical" href="...">` ใน Head ของหน้าใดๆ
- **Impact**: เสี่ยงต่อปัญหา Duplicate Content ระหว่าง URL ที่มีและไม่มีพารามิเตอร์ หรือระหว่างเส้นทางย่อย เช่น `/curriculum` กับ `/curriculum?id=...`
- **Fix**: กำหนด `metadataBase` ใน `layout.tsx` และใส่ `alternates: { canonical: ... }`

#### 5. มีแท็ก `<h1>` ซ้ำซ้อน 2 ตัวในหน้าเนื้อหา (Multiple H1s)
- **Evidence**: ในหน้า `/news`, `/curriculum`, `/news/121` พบ `<h1>` จำนวน 2 ตัว:
  1. โลโก้และชื่อวิทยาลัยใน Navbar (`Header.tsx`): `<h1>วิทยาลัยการอาชีพเชียงราย</h1>`
  2. หัวเรื่องหลักของหน้านั้นๆ เช่น `<h1>คลังข่าวประชาสัมพันธ์และกิจกรรม</h1>`
- **Impact**: ผิดหลักเกณฑ์ Semantic Heading Hierarchy ของ Google (หน้าเว็บควรมี 1 หน้า 1 H1 เพื่อระบุสาระสำคัญหลักของหน้านั้นอย่างชัดเจน)
- **Fix**: เปลี่ยนแท็กชื่อวิทยาลัยใน `Header.tsx` จาก `<h1>` เป็น `<div>` หรือ `<span>` และสงวน `<h1>` ไว้ให้เฉพาะหัวเรื่องหลักของเนื้อหาแต่ละหน้า

#### 6. ขาด Security & Best Practice Headers ในระดับเซิร์ฟเวอร์
- **Evidence**: Response Headers จาก Cloudflare ขาด:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **Impact**: เป็นปัจจัยสนับสนุนด้านความปลอดภัยและความน่าเชื่อถือทางเทคนิค (Technical Health Score)
- **Fix**: เพิ่ม Security Headers ลงใน `headers()` ของ `next.config.ts`

#### 7. ความพร้อมสำหรับ AI Search Engines (GEO / AEO)
- **Evidence**: เรียกดู `https://www.cric.ac.th/llms.txt` ได้ผลลัพธ์เป็น **404 Not Found**
- **Impact**: AI Engine ยุคใหม่ (Perplexity, ChatGPT Search, Gemini Live) กำลังใช้มาตรฐาน `llms.txt` เพื่อสรุปสาระสำคัญของสถาบันการศึกษา
- **Fix**: สร้างไฟล์ `public/llms.txt` สรุปข้อมูลหลักสูตร สาขาวิชา การรับสมัคร และข้อมูลติดต่อสำหรับ AI Crawlers

---

### ✅ Passing Standards (จุดแข็งที่ดีเยี่ยมของเว็บไซต์)

1. **Sitemap & Robots.txt สมบูรณ์แบบ**:
   - `/sitemap.xml` และ `/sitemap.php` ตอบกลับ HTTP 200 มี URL ทั้งหมด 212 หน้า
   - รูปแบบวันที่ `lastmod` เป็นไปตามมาตรฐาน W3C (`YYYY-MM-DD`)
2. **ระบบรูปภาพทันสมัย (Next.js Image)**:
   - แปลงไฟล์เป็น `.webp` และ `.avif` อัตโนมัติ มี Responsive Sizes
   - มี Alt attribute กำกับรูปภาพครบถ้วน 95%+
   - รองรับ Native Lazy Loading ทุกรูป
3. **ความเร็วการตอบสนอง (TTFB & Latency)**:
   - ตอบสนองรวดเร็วมาก เฉลี่ย 150ms - 200ms ผ่าน Cloudflare CDN
   - บีบอัดหน้าแบบ Brotli/Gzip และมี Next.js Standalone Optimization
4. **Mobile Responsive**:
   - หน้าเว็บมี Viewport Tag รองรับการปรับขนาดตามจอมือถือ
   - โครงสร้างตารางและเมนูรองรับหน้าจอมือถือ (100% Mobile-first ready)

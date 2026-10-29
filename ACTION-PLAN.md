# ACTION PLAN: แผนปฏิบัติการปรับปรุง SEO เว็บไซต์วิทยาลัยการอาชีพเชียงราย
**สถานะปัจจุบัน**: 66.5 / 100 (Needs Improvement)  
**เป้าหมายหลังการปรับปรุง**: **90+ / 100 (Excellent Grade)**

---

## สรุปภาพรวมลำดับความสำคัญ (Priority Matrix)

```
[Phase 1: Quick Wins / วิกฤตทันที] -> แก้ไข Title ข่าว, OpenGraph, JSON-LD Schema
[Phase 2: Technical Hardening]      -> Canonical Tags, Security Headers, Heading H1 Clean-up
[Phase 3: AI & Future-Proofing]     -> llms.txt, Knowledge Graph Enrichment
```

---

## Phase 1: การแก้ไขจุดวิกฤต (Priority: Critical - ภายใน 1-3 วัน)

### 1.1 ใส่ Dynamic Metadata & OpenGraph ในหน้ารายละเอียดข่าว
- **ไฟล์เป้าหมาย**: `src/app/(public)/news/[id]/page.tsx`
- **แนวทางแก้ไข**: Export ฟังก์ชัน `generateMetadata` เพื่อสร้าง Title, Description, และ OpenGraph Image อัตโนมัติ:
```typescript
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleData(id); // ดึงข้อมูลบทความ
  if (!article) return { title: 'ข่าวประชาสัมพันธ์' };

  const snippet = article.content?.replace(/<[^>]+>/g, '').slice(0, 150) || '';
  const imgUrl = article.cover_image ? normalizeImageUrl(article.cover_image) : 'https://www.cric.ac.th/logo.png';

  return {
    title: `${article.title} - วิทยาลัยการอาชีพเชียงราย`,
    description: snippet,
    alternates: { canonical: `https://www.cric.ac.th/news/${article.id}` },
    openGraph: {
      title: article.title,
      description: snippet,
      url: `https://www.cric.ac.th/news/${article.id}`,
      images: [{ url: imgUrl, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: article.created_at?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: snippet,
      images: [imgUrl],
    },
  };
}
```

### 1.2 เพิ่ม JSON-LD Schema สำหรับสถาบันการศึกษา & บทความข่าว
- **ไฟล์เป้าหมาย**: 
  - `src/app/(public)/layout.tsx` (CollegeOrUniversity Schema)
  - `src/app/(public)/news/[id]/page.tsx` (NewsArticle Schema)
  - `src/app/(public)/curriculum/page.tsx` (Course Schema)
- **ตัวอย่างโครงสร้าง JSON-LD สถาบันการศึกษา (Organization/College)**:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollegeOrUniversity",
  "name": "วิทยาลัยการอาชีพเชียงราย",
  "alternateName": "Chiangrai Industrial and Community Education College",
  "url": "https://www.cric.ac.th",
  "logo": "https://www.cric.ac.th/uploads/file_6a27706c88d814.68152088.webp",
  "telephone": "053-774589",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "เลขที่ 113 หมู่ 6 ต.ท่าสาย อ.เมือง",
    "addressLocality": "เชียงราย",
    "postalCode": "57000",
    "addressCountry": "TH"
  }
}
</script>
```

---

## Phase 2: การปรับแต่งโครงสร้างเชิงเทคนิค (Priority: High - ภายใน 1-2 สัปดาห์)

### 2.1 เพิ่ม Security Headers ใน `next.config.ts`
- **ไฟล์เป้าหมาย**: `next.config.ts`
- **แนวทางแก้ไข**: เพิ่ม Header มาตรฐานในส่วน `headers()`:
```typescript
{
  source: '/:path*',
  headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  ],
}
```

### 2.2 ปรับแก้ H1 ใน Header เพื่อไม่ให้ซ้ำซ้อนกับเนื้อหาหน้า
- **ไฟล์เป้าหมาย**: `src/components/public/Header.tsx`
- **แนวทางแก้ไข**: ในบรรทัดที่แสดงชื่อวิทยาลัยข้างโลโก้ เปลี่ยนจาก `<h1 className="...">` เป็น `<span className="font-extrabold ...">` เพื่อให้แท็ก `<h1>` ในหน้าหลักสูตร, ข่าว, และ ITA เป็น `<h1>` ตัวเดียวที่แท้จริงของหน้านั้น

### 2.3 กำหนด `metadataBase` และ Default Canonical ใน `layout.tsx`
- **ไฟล์เป้าหมาย**: `src/app/layout.tsx` หรือ `src/app/(public)/layout.tsx`
- **แนวทางแก้ไข**:
```typescript
export const metadata: Metadata = {
  metadataBase: new URL('https://www.cric.ac.th'),
  alternates: {
    canonical: './',
  },
  // ...
};
```

---

## Phase 3: การเตรียมพร้อมสำหรับ AI Search Engine (GEO/AEO)

### 3.1 สร้างไฟล์ `public/llms.txt`
- **ไฟล์เป้าหมาย**: `public/llms.txt`
- **เนื้อหา**: สรุปข้อมูลหลักสูตรที่เปิดสอน (ปวช./ปวส.), คุณสมบัติผู้สมัคร, วันเวลารับสมัคร, ช่องทางติดต่อ เพื่อให้ AI Agents (ChatGPT, Perplexity, Gemini) สามารถตอบคำถามผู้ปกครองและนักเรียนได้อย่างแม่นยำ

---

## ตารางการติดตามผล (Success Metrics)

| ตัวชี้วัด (KPI) | ก่อนปรับปรุง | หลังปรับปรุง (เป้าหมาย) |
|---|---|---|
| **Google Search Console Indexing** | แจ้งเตือน Duplicate/Missing Titles | ดัชนีหน้าข่าว & หลักสูตร 100% สมบูรณ์ |
| **Rich Results (Rich Snippets)** | 0% | ผ่านการตรวจสอบการ์ดข่าวและข้อมูลสถาบัน |
| **Social Share Preview (LINE/FB)** | ลิงก์ว่าง ไม่มีรูปปก | มีรูปปกและหัวข้อข่าวสวยงาม 100% |
| **SEO Total Score** | 66.5 | 90+ (Excellent) |

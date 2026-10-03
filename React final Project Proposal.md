# Final Project Proposal — Disney Character Clue Guesser (เกมทายตัวละคร Disney ด้วยคำใบ้ AI)

**กลุ่ม:** Sigma  
**สมาชิก:**
1. เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
2. สิรวิชญ์ ยวงคำ (682110199)
3. ปัณณวิชญ์ สิทธิตัน (682110181)

---

## 1. แอปนี้ทำอะไร ใครใช้

เว็บแอปพลิเคชันเกมทายตัวละคร Disney เชิงอินเทอร์แอคทีฟสำหรับแฟนคลับแอนิเมชัน Disney ทุกวัยและผู้ที่ชื่นชอบเกมฝึกสมอง ผู้เล่นต้องทายชื่อตัวละครจากคำใบ้ลำดับขั้นที่สร้างขึ้นแบบไดนามิกโดย Google Gemini AI (เช่น คำใบ้บริบทเรื่องย่อ, คำคมประจำตัว, ความสัมพันธ์ของตัวละคร, ตัวอักษรขึ้นต้น) โดยยิ่งเปิดคำใบ้น้อยและตอบได้เร็วยิ่งได้คะแนนสูง พร้อมระบบตารางอันดับคะแนน (Leaderboard) และระบบเหรียญตราความสำเร็จ (Achievements) ที่บันทึกประวัติการเล่นของผู้ใช้

---

## 2. หน้าที่จะมี (อย่างน้อย 4 route + Dynamic Route)

| Route | หน้า | หน้านี้ทำอะไร | บทเรียนที่ประยุกต์ใช้ |
| :--- | :--- | :--- | :--- |
| `/` | หน้าแรก (Home) | เมนูต้อนรับ, ปุ่มเริ่มเล่นทันที, แสดงตัวละครแนะนำประจำวัน (Daily Featured Character), สรุปโหมดการเล่น (Classic, Timed, Endless) | Server Layout, Server Component ร่วมกับ `<ModeSelector />` (Day 6) |
| `/play` | กระดานเล่นเกม (Game Arena) | หน้าเล่นเกมทายตัวละคร แสดงคำใบ้ทีละระดับ (Progressive Clues) จาก AI, จับเวลาถอยหลัง, ช่องกรอกคำตอบพร้อมระบบ Auto-suggest และหน้าสรุปผลจบเกม | Client State Machine, Context (`GameContext`), Custom Hooks (`useTimer`, `useSound`) (Day 2, 3, 5) |
| `/characters/[id]` | ข้อมูลตัวละคร (Character Codex) | หน้ารายละเอียดประวัติ ภาพยนตร์ที่ปรากฏ และสถิติความยาก/อัตราการทายถูกของตัวละครนั้น ๆ จาก Disney API | Dynamic Routes `[id]`, `await params`, Server Fetching, การดักจับ id ปลอมด้วย `notFound()` (Day 6, 7) |
| `/scoreboard` | กระดานผู้นำ (Leaderboard) | แสดงอันดับผู้ทำคะแนนสูงสุด พร้อมตัวกรองตามโหมด (Easy/Hard/Daily) และช่วงเวลา โดยค่าตัวกรองเก็บใน URL query string | `useSearchParams`, Server Data Fetching ร่วมกับ ISR `revalidate: 30` (Day 4, 7) |
| `/achievement` | ตราความสำเร็จ (Achievements) | แสดงตราเกียรติยศที่ผู้เล่นปลดล็อกสำเร็จ (เช่น "ตอบถูกในคำใบ้แรก 5 ครั้ง", "เล่นติดต่อกัน 3 วัน") ดึงสถานะจากเครื่องผู้เล่น | `localStorage` sync, Error boundary ป้องกันข้อมูลเสียหาย (Day 5) |
| `not-found.jsx` | หน้า 404 | แสดงหน้าแจ้งเตือนเมื่อไม่พบหน้าที่ต้องการหรือค้นหารหัสตัวละครไม่พบในระบบ พร้อมปุ่มพากลับสู่หน้าหลัก | Next.js 15 `not-found.jsx` (Day 6, 7) |

---

## 3. Server หรือ Client — และทำไม

ตามหลักสถาปัตยกรรมของ Next.js 15 (App Router) ทุก Component จะเป็น **Server Component โดยค่าเริ่มต้น** เพื่อลดขนาด JavaScript Bundle ที่ส่งไปยัง Client, เพิ่มความเร็ว First Contentful Paint (FCP) และปกป้อง API Key ลับ โดยจะแยกเฉพาะส่วนที่จำเป็นต้องมี Interactivity หรือใช้ Web API เป็น **Client Component (Client Islands)**

| ส่วนของแอป | Server / Client | เหตุผลตาม Decision Framework |
| :--- | :---: | :--- |
| **โครงสร้าง Layout และ Nav** (`layout.jsx`, `<Nav />`) | **Server** (Nav มี Client Island) | โครงหน้าและ Footer แสดงผลคงที่ ส่วน `<Nav />` มีเกาะ Client ย่อยสำหรับไฮไลต์เมนูด้วย `usePathname()` และแสดงสถิติคะแนนสด |
| **หน้าแรก** (`app/page.jsx`) | **Server** | ดึงข้อมูลตัวละครไฮไลต์ประจำวันฝั่ง Server รวดเร็ว ไม่มี spinner ตอนเปิดหน้าเว็บ |
| **ตัวเลือกโหมดการเล่น** (`<ModeSelector />`) | **Client** | มีการจัดการ Event `onClick`, State การเลือกโหมด และเตรียมสถานะก่อน Navigate ไปที่ `/play` |
| **หน้ากระดานเกม** (`<GameBoard />` ใน `/play`) | **Client** | ต้องใช้ State จัดการเวลานับถอยหลัง, การกดขอคำใบ้เพิ่ม, ควบคุม Form การตอบ และมีเสียง Effect |
| **หน้ารายละเอียดตัวละคร** (`app/characters/[id]/page.jsx`) | **Server** | ดึงข้อมูลจาก Disney API ฝั่ง Server โดยตรง ค้นหาข้อมูลรวดเร็ว และเรียกใช้ `notFound()` ทันทีเมื่อไม่พบรหัส |
| **ช่องค้นหา/ตัวกรองอันดับ** (`<LeaderboardFilter />`) | **Client** | ต้องมี Event `onChange` และอ่าน/เขียนค่าลงบน URL query string ผ่าน `useSearchParams` |
| **ตารางอันดับคะแนน** (`<LeaderboardTable />` ใน `/scoreboard`) | **Server** | ดึงข้อมูลตารางอันดับจาก Data Store ฝั่ง Server และใช้ ISR Cache เพื่อลดภาระการโหลดฐานข้อมูล |
| **ฟอร์มส่งคะแนนเมื่อจบเกม** (`<ScoreSubmissionForm />`) | **Client** | ใช้ `react-hook-form` ร่วมกับ `zodResolver` สำหรับตรวจสอบความถูกต้องของชื่อและอีเมลผู้เล่น |
| **ระบบเชื่อมต่อ Gemini AI Generator** (`/api/ai/clues`) | **Server Only (Route Handler)** | **กฎความปลอดภัย:** ต้องเก็บ `GEMINI_API_KEY` ไว้ใน `.env.local` ฝั่ง Server เท่านั้น ห้ามส่งหลุดไปยัง Client เด็ดขาด |
| **ระบบบันทึกคะแนน** (`/api/scoreboard` หรือ Server Action) | **Server Only** | ตรวจสอบคะแนน ป้องกันการโกงเวลา และบันทึกลงไฟล์หรือฐานข้อมูลหลังบ้าน |

---

## 4. ข้อมูลมาจากไหน + จุดที่ต้องเขียนข้อมูลกลับ (Data Flow & Mutation)

### 4.1 แหล่งข้อมูล (Data Sources)
1. **ข้อมูลตัวละคร Disney:**
   - เรียกผ่าน [Disney API](https://disneyapi.dev/) (`https://api.disneyapi.dev/character`) เพื่อดึงรายชื่อ ภาพ และข้อมูลภาพยนตร์
   - **การแคช (Caching Strategy):** ใช้ Next.js Data Cache กำหนด `{ next: { revalidate: 86400 } }` (ISR แคช 24 ชั่วโมง) เพราะข้อมูลตัวละครหลักไม่มีการเปลี่ยนแปลงบ่อย
   - **แผนสำรอง (Fallback):** มีไฟล์สำรอง `lib/data/disney-fallback.json` ในโปรเจกต์ หาก API ภายนอกล่มหรือติด Rate Limit ระบบจะสลับไปอ่านไฟล์นี้อัตโนมัติ
2. **ระบบสร้างคำใบ้ด้วย AI (Generative AI Hints):**
   - ใช้ **Google Gemini API** (`@google/genai` หรือ REST endpoint) สั่ง Prompt แบบ Structured Output เพื่อให้ได้ JSON คำใบ้ 3 ระดับ (ยาก -> ปานกลาง -> ง่าย)
   - ดำเนินการผ่าน Route Handler `POST /api/ai/clues` ฝั่ง Server เพื่อรักษาความลับของ API Key
   - มีชุดคำใบ้สำเร็จรูปสำรอง (`lib/data/clues-fallback.json`) เตรียมไว้สำหรับกรณี AI ขัดข้อง

### 4.2 การกลายพันธุ์ข้อมูล (Data Mutation & API Endpoints)
1. **Route Handler บันทึกคะแนน (`app/api/scoreboard/route.js`):**
   - **`GET(request)`**: คืนรายการคะแนนสูงสุด รองรับการกรองตามโหมดผ่าน `?mode=...` (Case-insensitive)
   - **`POST(request)`**: รับข้อมูล `{ playerName, score, timeSpent, mode, characterId }`
     - มีการ Validate Body ด้วย **Zod Schema** หากฟอร์แมตผิด หรือค่าไม่ครบ ส่งกลับ `400 Bad Request`
     - มีระบบตรวจสอบความสมเหตุสมผล (Anti-Cheat check: เวลาที่ใช้ vs คะแนนที่ได้)
     - บันทึกข้อมูลลงใน Store (`lib/data/scoreboard.json` หรือ InMemory Store) และส่งกลับ `201 Created`
     - กรณีเกิดข้อผิดพลาด จะส่งกลับ JSON `{ error: "..." }` ที่ชัดเจนเสมอ **ไม่มีหลุดเป็น Error 500**
2. **การ Revalidate แคช:**
   - เมื่อมีการส่งคะแนนใหม่ผ่าน Server Action หรือ Route Handler จะเรียกใช้ `revalidatePath('/scoreboard')` เพื่อให้หน้าตารางอันดับอัปเดตข้อมูลล่าสุดแก่ผู้ใช้คนอื่นทันที

### 4.3 การจัดการสถานะ (State Management Decision Framework)
- **Local Component State (`useState`):** ใช้กับสิ่งที่เกิดเฉพาะจุด เช่น การนับเวลาถอยหลัง (Timer), สถานะเปิด/ปิด Modal และ Animation การเฉลยคำตอบ
- **URL State (`useSearchParams`):** ใช้กับการกรองบนหน้า `/scoreboard?mode=classic&sort=desc` เพื่อให้ผู้ใช้สามารถคัดลอกลิงก์ผลการจัดอันดับไปแชร์ หรือกด Refresh/Back แล้วผลลัพธ์ยังคงเดิม
- **React Context (`GameContext` + `useGame()`):** ควบคุม State รอบการเล่นเกม (คะแนนสะสม, จำนวนข้อที่ทายถูก, คำใบ้ที่ถูกเปิดไปแล้ว) ระหว่างเปลี่ยนด่าน โดยเขียน Custom Hook ที่มี Guard Clause throw error หากถูกเรียกนอก `GameProvider`
- **Form Validation (`react-hook-form` + `zod`):** จัดการฟอร์มบันทึกคะแนนและตั้งค่าโพรไฟล์ผู้เล่น
- **Client Storage (`localStorage`):** บันทึกประวัติการเล่นออฟไลน์, ตราความสำเร็จ (Achievements) ที่ปลดล็อกแล้ว และตั้งค่าระบบเสียง/ธีม พร้อมเขียนโค้ดรองรับกรณีข้อมูลใน Storage เสียหายโดยไม่ทำให้หน้าเว็บพัง (No White Screen of Death)

---

## 5. แบ่งงานกันยังไง

| สมาชิก | ความรับผิดชอบหลักและบทเรียนที่นำมาใช้ |
| :--- | :--- |
| **เมธาสิทธิ์ พิบูลย์ศิลป์**<br>(682110189) | • **AI Engine & Clues:** พัฒนา Route Handler `POST /api/ai/clues`, ออกแบบ Prompt Engineering สำหรับสร้างคำใบ้ตัวละคร Disney เป็น JSON แบบแบ่งระดับความยาก และทำระบบ Fallback Clues<br>• **Home & Layout:** พัฒนาหน้าแรก `/`, Server Layout, Component เมนูนำทาง `<Nav />` พร้อมไฮไลต์เส้นทางด้วย `usePathname()`<br>• **UI System:** ออกแบบ Design System และ Component พื้นฐานด้วย Tailwind CSS v4 |
| **สิรวิชญ์ ยวงคำ**<br>(682110199) | • **Scoreboard & Ranking:** พัฒนาหน้า `/scoreboard` (Server Component ร่วมกับ ISR revalidate 30 วินาที) และตัวกรองคำค้น/โหมดด้วย `useSearchParams`<br>• **API & Mutation:** พัฒนา Route Handler `app/api/scoreboard/route.js` (GET/POST) พร้อมจัดการ HTTP Status Code (200, 201, 400) ป้องกันการเกิด 500<br>• **Form & Validation:** ออกแบบ Form บันทึกคะแนนด้วย `react-hook-form` ร่วมกับ `zod` (`zodResolver`)<br>• **Achievement:** พัฒนาหน้า `/achievement` และระบบบันทึกความสำเร็จลง `localStorage` อย่างปลอดภัย |
| **ปัณณวิชญ์ สิทธิตัน**<br>(682110181) | • **Game Arena (`/play`):** พัฒนาระบบกระดานเกม Logic การทายตัวละคร, การนับคะแนนตามเวลาและจำนวนคำใบ้, ระบบ Countdown Timer และ Custom Hook (`useGame`, `useTimer`)<br>• **Global Game State:** สร้าง `GameContext` พร้อม Custom Hook `useGame()` สำหรับแชร์สถานะการเล่นเกมอย่างเป็นระเบียบ<br>• **Character Codex (`/characters/[id]`):** พัฒนา Dynamic Route เชื่อมต่อ Disney API ดึงข้อมูลตัวละครแบบ Server Component พร้อมดักจับกรณีรหัสตัวละครไม่มีอยู่จริงด้วย `notFound()` และสร้างหน้า `not-found.jsx` |

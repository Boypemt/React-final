# Disney Character Clue Guesser

เว็บแอปเกมทายชื่อตัวละคร Disney จากคำใบ้ที่สร้างด้วย Google Gemini AI พร้อมระบบเปรียบเทียบคุณลักษณะสไตล์ PokéGuesser/Wordle

**กลุ่ม:** Sigma · **วิชา:** React (Final Project)
**สถาปัตยกรรม:** Next.js 15.5 (App Router) · React 19 · Tailwind CSS v4 · Google Gemini (`@google/genai`)

เกมมี 2 โหมด:

| โหมด | URL | กติกา |
| :--- | :--- | :--- |
| **PokéGuesser Deduction** | `/play?mode=deduction` | ทายตัวละครปริศนา 1 ตัว ไม่จำกัดเวลาและจำนวนครั้ง แต่ละครั้งที่ทายจะได้ตารางเปรียบเทียบคุณลักษณะ 5 มิติกลับมา ยิ่งทายน้อยครั้งยิ่งได้คะแนนสูง |
| **Trivia Time-Attack** | `/play?mode=trivia` | 5 ด่าน จับเวลา 30 วินาทีต่อด่าน แต่ละด่านมีคำใบ้จาก AI 3 ระดับ (ยาก → ปานกลาง → ง่าย) เปิดคำใบ้น้อยและตอบเร็วยิ่งได้คะแนนมาก |

---

## 1. สมาชิกและขอบเขตงาน

| สมาชิก | ขอบเขตงาน | ไฟล์หลักที่ดูแล |
| :--- | :--- | :--- |
| **เมธาสิทธิ์ พิบูลย์ศิลป์**<br>(682110189) | AI Clue Engine, Prompt Engineering, UI Design System, หน้าแรก, Layout & Nav | `app/api/ai/clues/`, `lib/ai/`, `app/page.jsx`, `app/layout.jsx`, `app/globals.css`, `components/ui/`, `components/home/`, `components/Nav.jsx`, `components/Footer.jsx`, `lib/featured.js`, `lib/gameModes.js`, `scripts/` |
| **ปัณณวิชญ์ สิทธิตัน**<br>(682110181) | Game Arena 2 โหมด, Global Game State, Character Codex, ชุดข้อมูลตัวละคร | `app/play/`, `app/characters/`, `components/game/`, `components/character/`, `context/GameContext.jsx`, `hooks/`, `lib/gameLogic.js`, `lib/disney.js`, `lib/data/` |
| **สิรวิชญ์ ยวงคำ**<br>(682110199) | กระดานผู้นำ, ฟอร์มส่งคะแนน, ระบบเหรียญรางวัล | `app/scoreboard/`, `app/achievement/`, `components/ScoreSubmissionForm.jsx`, `components/ScoreboardTable.jsx`, `lib/achievements.js`, `lib/gameSessions.js` |

---

## 2. วิธีติดตั้งและรัน

### 2.1 ติดตั้ง

```bash
npm install
```

### 2.2 ตั้งค่า Environment

คัดลอกไฟล์ตัวอย่างแล้วใส่คีย์ของตัวเอง:

```bash
cp .env.local.example .env.local
```

แก้ `.env.local`:

```
GEMINI_API_KEY=<คีย์จาก https://aistudio.google.com/apikey>
GEMINI_MODEL=gemini-3.1-flash-lite
```

| ตัวแปร | จำเป็นไหม | คำอธิบาย |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | ไม่บังคับ | คีย์ Google Gemini · **ถ้าปล่อยว่างเกมยังเล่นได้** ระบบจะใช้คำใบ้สำรองในเครื่องอัตโนมัติ |
| `GEMINI_MODEL` | ไม่บังคับ | โมเดลที่ใช้ (ค่าเริ่มต้น `gemini-3.1-flash-lite`) · หมายเหตุ: `gemini-2.5-flash` ที่เขียนไว้ใน Proposal ตอนนี้ Google ปิดรับคีย์ใหม่แล้ว (ตอบ 404) |

> ⚠️ ตัวแปรทั้งสองตัว **ไม่มี** `NEXT_PUBLIC_` นำหน้าโดยเจตนา เพราะตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_` จะถูกฝังลงใน JavaScript ที่ส่งไปเบราว์เซอร์ ทำให้ใครก็เปิดดูคีย์ได้
> `.env.local` ถูก `.gitignore` ไว้แล้ว

### 2.3 รัน Development Server

```bash
npm run dev     # เปิด http://localhost:3000
```

### 2.4 อุ่นแคชคำใบ้ก่อนนำเสนอ (แนะนำ)

Gemini ใช้เวลาเจนคำใบ้ 1 ชุด (10 ข้อ) ราว 4–10 วินาที ซึ่งมักเกินงบ 8 วินาทีที่ผู้เล่นควรรอ **ผู้เล่นคนแรกของแต่ละตัวละครจะได้คำใบ้สำรองไปก่อน** แล้วคนถัดไปจึงได้คำใบ้ AI จากแคช

เปิด `npm run dev` ไว้ แล้วรันในอีกหน้าต่าง:

```bash
npm run warm    # รอบที่ 1 — จะเห็น "fallback" เยอะ แต่งานเจนลงแคชให้เรียบร้อย
npm run warm    # รอบที่ 2 — ควรขึ้น "cache" เกือบทั้งหมด
```

> **ต้องรัน 2 รอบ** รอบแรกใช้เวลาประมาณ 5 นาที (50 ตัวละคร × ~12 วินาที) รอบสองเร็วกว่ามากเพราะโดนแคช
> ⚠️ **ห้ามเรียกตอน Server เริ่มทำงาน** เพราะจะยิง Gemini 50 ครั้งทุกครั้งที่ deploy
> แคชเป็นแบบ in-memory อายุ 1 ชั่วโมง ถ้ารีสตาร์ตเซิร์ฟเวอร์ต้องอุ่นใหม่

### 2.5 คำสั่งอื่น

```bash
npm run build   # production build
npm run start   # รัน production build
npm run lint    # oxlint
```

---

## 3. เส้นทาง (Routes)

| Route | ไฟล์ | หน้านี้ทำอะไร | Rendering |
| :--- | :--- | :--- | :--- |
| `/` | `app/page.jsx` | หน้าแรก: Hero, ตัวเลือกโหมด, ตัวละครแนะนำประจำวัน, วิธีเล่น | Static + ISR 300 วินาที |
| `/play` | `app/play/page.jsx` | กระดานเล่นเกม อ่านโหมดจาก `?mode=deduction` หรือ `?mode=trivia` | Dynamic |
| `/characters/[id]` | `app/characters/[id]/page.jsx` | Character Codex ดึงข้อมูลสดจาก Disney API | Dynamic + ISR 86,400 วินาที ที่ชั้น `fetch` |
| `/scoreboard` | `app/scoreboard/page.jsx` | กระดานผู้นำ กรองด้วย `?mode=` และ `?period=` | Dynamic |
| `/achievement` | `app/achievement/page.jsx` | เหรียญรางวัล อ่านประวัติการเล่นจาก `localStorage` | Static shell + ข้อมูลเติมฝั่ง Client |
| `/api/ai/clues` | `app/api/ai/clues/route.js` | Route Handler สร้างคำใบ้ด้วย Gemini (POST) | Dynamic |
| 404 | `app/not-found.jsx`, `app/characters/[id]/not-found.jsx` | หน้าไม่พบข้อมูล | Static |

---

## 4. Server หรือ Client — ทุกไฟล์ใน `app/` และ `components/`

หลักที่ยึด: **Server Component เป็นค่าเริ่มต้น** แยกเป็น Client เฉพาะส่วนที่จำเป็น (Client Islands) เพื่อลด JavaScript ที่ส่งไปเบราว์เซอร์ เพิ่มความเร็ว First Contentful Paint และปกป้อง API Key

### 4.1 `app/`

| ไฟล์ | Server / Client | เหตุผล |
| :--- | :---: | :--- |
| `app/layout.jsx` | **Server** | `export const metadata` ใช้ได้เฉพาะ Server Component · โครงหน้าเป็นเนื้อหาคงที่ · `next/font` ประมวลผลตอน build แล้ว self-host ฟอนต์เอง |
| `app/page.jsx` | **Server** | เนื้อหาเกือบทั้งหน้าเป็นข้อความคงที่ · เลือกตัวละครประจำวันจากวันที่ฝั่ง Server เพื่อกัน Hydration Mismatch |
| `app/play/page.jsx` | **Server** | เป็น Shell ที่ `await searchParams` อ่านโหมดแล้วส่งเป็นค่าเริ่มต้นให้ `<GameProvider>` · ตัวเกมที่ต้องโต้ตอบอยู่ใน `<GameBoard />` ซึ่งเป็น Client |
| `app/characters/[id]/page.jsx` | **Server** | `await params` แล้วดึงข้อมูลจาก Disney API ฝั่ง Server · เรียก `notFound()` ได้ทันทีเมื่อไม่พบ id |
| `app/characters/[id]/not-found.jsx` | **Server** | หน้าแจ้งเตือนเนื้อหาคงที่ |
| `app/not-found.jsx` | **Server** | หน้า 404 รวมของระบบ เนื้อหาคงที่ |
| `app/scoreboard/page.jsx` | **Server** | อ่านคะแนนจากคลังฝั่ง Server ตรง ๆ ไม่ต้องยิง fetch ไปหา API ของตัวเอง · ตารางอันดับมาพร้อม HTML ตั้งแต่ไบต์แรก |
| `app/scoreboard/actions.js` | **Server Action** (`'use server'`) | mutation บันทึกคะแนน · ต้องรันฝั่ง Server เพื่อ validate ซ้ำและเรียก `revalidatePath()` |
| `app/api/ai/clues/route.js` | **Server Only** | **กฎความปลอดภัย:** `GEMINI_API_KEY` ต้องไม่หลุดออกจาก Server · แคชคำใบ้แชร์กันทุกผู้เล่น · `@google/genai` เป็นไลบรารีก้อนใหญ่ ไม่ต้องส่งไปเบราว์เซอร์ |
| `app/achievement/page.jsx` | **Client** | อ่านประวัติการเล่นจาก `localStorage` ซึ่งเป็น Web API ที่มีแต่ในเบราว์เซอร์ · มี `useState` สำหรับตัวกรองเหรียญ |

### 4.2 `components/`

| ไฟล์ | Server / Client | เหตุผล |
| :--- | :---: | :--- |
| `components/Nav.jsx` | **Client** | `usePathname()` ไฮไลต์เมนูตามหน้าที่เปิดอยู่ · `useState` เปิด/ปิดเมนูมือถือ · อ่านคะแนนล่าสุดจาก `localStorage` |
| `components/Footer.jsx` | **Server** | ข้อความคงที่ล้วน ไม่มี state หรือ event |
| `components/ScoreSubmissionForm.jsx` | **Client** | ฟอร์มที่ผู้ใช้พิมพ์ · `useForm` + `zodResolver` ตรวจข้อมูลและขึ้น error ใต้ช่องกรอกทันที |
| `components/ScoreboardTable.jsx` | **Server** | แสดงผลข้อมูลที่หน้า `/scoreboard` อ่านมาให้แล้ว ไม่มี interactivity |
| `components/character/CharacterDetailCard.jsx` | **Server** | แสดงรายละเอียดตัวละครที่ Server Component ส่งมาเป็น props |
| `components/game/GameBoard.jsx` | **Client** | กระดานเกมหลัก ใช้ `useGame()` จาก Context และจัดการ event ทั้งหมดของเกม |
| `components/game/MysteryCard.jsx` | **Client** | การ์ดเงาดำที่พลิก 3D ตามสถานะเกม และมี `useState` ดักกรณีรูปโหลดไม่ขึ้น |
| `components/game/ClueBox.jsx` | **Client** | มีปุ่มกดขอคำใบ้เพิ่ม (`onClick`) |
| `components/game/CharacterSuggestInput.jsx` | **Client** | ช่องค้นหาแบบ Autocomplete มี `useState`, `useEffect` และรับปุ่มลูกศร/Enter |
| `components/game/GuessHistoryTable.jsx` | **Client** | ตารางเปรียบเทียบที่อัปเดตตาม state การทายในเกม |
| `components/game/TimerBar.jsx` | **Client** | แถบเวลานับถอยหลังที่เปลี่ยนค่าทุกวินาที |
| `components/game/RoundSummaryModal.jsx` | **Client** | ป๊อปอัปสรุปด่าน มีปุ่มปิด/ไปด่านถัดไป |
| `components/game/GameOverScreen.jsx` | **Client** | หน้าสรุปจบเกม มีปุ่มคัดลอก Emoji Grid ลง Clipboard และ Slot ของฟอร์มส่งคะแนน |
| `components/home/ModeSelector.jsx` | **Client** | `useState` จำโหมดที่เลือก · รับปุ่มลูกศรตามมาตรฐาน radiogroup · `useRouter().push()` ตอนกดเริ่มเล่น |
| `components/home/FeaturedCharacter.jsx` | **Server** | เลือกตัวละครจากวันที่ฝั่ง Server · การเฉลยเงาดำทำด้วย CSS ล้วน (`group-hover` / `group-focus-within`) ไม่ต้องใช้ JavaScript เลย |
| `components/ui/Button.jsx` | **Server** | เป็นปุ่ม/ลิงก์ที่จัดสไตล์ให้ ไม่มี state ของตัวเอง · ถ้านำไปใช้ใน Client Component Next.js จะรวมเข้า Client Bundle ให้เอง ส่ง `onClick` ได้ปกติ |
| `components/ui/Card.jsx` | **Server** | กล่องการ์ดแสดงผล ไม่มี interactivity |
| `components/ui/Badge.jsx` | **Server** | เป็น `<span>` ที่จัดสีให้ ไม่มี interactivity |
| `components/ui/PageHeader.jsx` | **Server** | หัวข้อหน้าเป็นเนื้อหาคงที่ ช่วยให้ FCP เร็ว |

---

## 5. การดึงข้อมูลและกลยุทธ์แคช (Data Fetching & Caching)

### 5.1 `/characters/[id]` — ISR 24 ชั่วโมง

`lib/disney.js` ดึงข้อมูลสดจาก Disney API:

```js
const res = await fetch(`https://api.disneyapi.dev/character/${numId}`, {
  next: { revalidate: 86400 }   // 24 ชั่วโมง
});
```

**เหตุผล:** ข้อมูลตัวละคร Disney (ชื่อ, ภาพยนตร์, เครื่องเล่นในสวนสนุก) แทบไม่เปลี่ยนแปลงเลย การแคช 24 ชั่วโมงจึงลดจำนวนคำขอที่ยิงออกไปอย่างมาก หน้าโหลดเร็วขึ้น และไม่เสี่ยงชน Rate Limit ของ API ภายนอก

**การดักหลุมพราง:** Disney API ตอบ `HTTP 200` พร้อม `data: []` เมื่อไม่พบ id (ไม่ได้ตอบ 404) จึงเช็ก `!json?.data || Array.isArray(json.data) || !json.data._id` ก่อนเรียก `notFound()` · และถ้าเครือข่ายล่ม จะสลับไปอ่านจาก `lib/data/curated-disney.json` ในเครื่องแทน

### 5.2 `/` — ISR 300 วินาที

```js
export const revalidate = 300;
```

**เหตุผล:** หน้าแรกมี "ตัวละครแนะนำประจำวัน" ที่เลือกจากวันที่ตามเวลาไทย (`Asia/Bangkok`) ถ้าไม่ตั้ง `revalidate` Next.js จะ prerender หน้านี้ครั้งเดียวตอน build ทำให้ตัวละครค้างเป็นตัวของวันที่ build ตลอดไป

ตั้ง 300 วินาที (5 นาที) เพื่อให้ยังได้ความเร็วของหน้า static แต่ตัวละครสลับภายใน 5 นาทีหลังเที่ยงคืนไทย (ข้อแลกเปลี่ยนที่ยอมรับได้ ดีกว่าใช้ `force-dynamic` ซึ่งทิ้งการแคชทั้งหน้าไปเพื่อการเปลี่ยนวันละครั้ง)

### 5.3 `/scoreboard` — Dynamic

หน้านี้เป็น Dynamic **โดยอัตโนมัติ** เพราะใช้ `await searchParams` (ตัวกรองโหมดและช่วงเวลาอยู่บน URL) Next.js จึงไม่สามารถ prerender ไว้ล่วงหน้าได้

**เหตุผลที่ต้องเป็น Dynamic:** คะแนนเปลี่ยนทุกครั้งที่มีคนเล่นจบ ถ้าแคชไว้ผู้เล่นจะเห็นอันดับเก่า · นอกจากนี้ Server Action ยังเรียก `revalidatePath('/scoreboard')` หลังบันทึกคะแนนสำเร็จอีกชั้น เพื่อล้างแคชที่อาจเกิดขึ้น

การเก็บตัวกรองไว้บน URL (ไม่ใช่ `useState`) ทำให้ผู้ใช้คัดลอกลิงก์ผลการจัดอันดับไปแชร์ได้ และกด Refresh/Back แล้วผลลัพธ์ยังเหมือนเดิม

### 5.4 `/play` — Dynamic

เป็น Dynamic เพราะใช้ `await searchParams` อ่าน `?mode=` มากำหนดโหมดเริ่มต้นของเกม

**เหตุผล:** โหมดต้องอ่านได้ตั้งแต่ฝั่ง Server แล้วส่งเป็น `initialMode` ให้ `<GameProvider>` เพื่อไม่ให้เกิด Hydration Mismatch (ถ้าอ่าน query string ฝั่ง Client อย่างเดียว รอบแรกจะเรนเดอร์โหมดผิดก่อนแล้วค่อยสลับ) · ตัวเกมสุ่มตัวละครใหม่ทุกครั้งที่เริ่มอยู่แล้ว การแคชหน้านี้จึงไม่มีประโยชน์

### 5.5 สรุปแหล่งข้อมูล

| ข้อมูล | แหล่ง | กลยุทธ์ |
| :--- | :--- | :--- |
| ตัวละครในเกม | `lib/data/curated-disney.json` (50 ตัว จาก Disney API) | bundle มากับแอป อ่านได้ทันที 0ms |
| รายละเอียดตัวละครหน้า Codex | Disney API สด | ISR 86,400 วินาที + fallback ไปไฟล์ในเครื่อง |
| คำใบ้ AI | Google Gemini ผ่าน `POST /api/ai/clues` | แคชในหน่วยความจำฝั่ง Server 1 ชั่วโมง + คำใบ้สำรอง 3 ชั้น |
| คะแนนกระดานผู้นำ | `lib/data/scoreboard.json` ฝั่ง Server | อ่านสดทุกคำขอ + สำรองในหน่วยความจำถ้าเขียนไฟล์ไม่ได้ |
| ประวัติการเล่น / เหรียญรางวัล | `localStorage` ของผู้เล่น | เป็นข้อมูลส่วนตัวรายเครื่อง ไม่ต้องขึ้น Server |

---

## 6. การเขียนข้อมูลกลับ (Mutations)

ระบบมีจุดที่เขียนข้อมูล 2 แบบ เลือกใช้ต่างกันตามลักษณะงาน

### 6.1 Server Action — `submitScore()` (บันทึกคะแนน)

**ไฟล์:** `app/scoreboard/actions.js` (`'use server'`)

```
ScoreSubmissionForm (Client)
        │  เรียกเหมือนฟังก์ชันปกติ ไม่ต้องเขียน fetch
        ▼
submitScore(data)                          [Server]
        │  1. scoreSchema.safeParse(data)   ← validate ซ้ำฝั่ง Server
        │  2. addEntry(entry)               ← เขียน lib/data/scoreboard.json
        │  3. revalidatePath('/scoreboard') ← ล้างแคชหน้าอันดับ
        ▼
{ ok: true, entry, persisted } หรือ { ok: false, errors }
```

**ทำไมเลือก Server Action:** งานนี้เป็น mutation ที่ผูกกับฟอร์มหน้าเดียว ไม่ได้ต้องการ public API จึงเรียกได้เหมือนฟังก์ชันปกติ ไม่ต้องกำหนด URL หรือ `JSON.stringify` เอง และเรียก `revalidatePath()` ได้ตรง ๆ หลังบันทึกเสร็จ ทำให้ผู้เล่นคนอื่นเห็นคะแนนใหม่ทันที

**คลังข้อมูล:** `lib/scoreboardStore.js` (`import 'server-only'`) อ่าน/เขียน `lib/data/scoreboard.json` ด้วย `node:fs` และ **มีแผนสำรองเมื่อเขียนไฟล์ไม่ได้** — โฮสติ้งหลายที่ (เช่น Vercel) มีไฟล์ระบบแบบอ่านได้เท่านั้น `fs.writeFile` จะโยน `EROFS`/`EPERM` ออกมา ระบบจะตรวจจับแล้วสลับไปเก็บในหน่วยความจำต่อ (เก็บบน `globalThis` เพื่อให้แชร์ข้าม route และข้าม hot-reload เหมือน `lib/taskStore.js` ของ Lab Day 8) เกมยังบันทึกคะแนนได้ปกติ และหน้า `/scoreboard` จะขึ้นแถบเตือนให้ผู้ใช้รู้ว่าข้อมูลจะหายเมื่อรีสตาร์ต

### 6.2 Route Handler — `POST /api/ai/clues` (สร้างคำใบ้)

**ไฟล์:** `app/api/ai/clues/route.js`

**ทำไมเลือก Route Handler ไม่ใช่ Server Action:** นี่คือ endpoint ที่ `lib/clues.js` เรียกด้วย `fetch` จากฝั่ง Client และอาจถูกเรียกจากที่อื่นในอนาคต (เช่นสคริปต์ `npm run warm`) จึงเหมาะกับการเป็น HTTP endpoint ที่มีสัญญาชัดเจน ต่างจาก `submitScore` ที่ผูกกับฟอร์มหน้าเดียว

**Request:**

```json
{ "characterId": 6160, "characterName": "Simba" }
```

**Response `200`:**

```json
{
  "characterId": 6160,
  "characterName": "Simba",
  "clues": ["คำใบ้ยาก…", "คำใบ้ปานกลาง…", "คำใบ้ง่าย…"],
  "source": "ai"
}
```

| ฟิลด์ | ค่า |
| :--- | :--- |
| `clues` | **เสมอ 3 ข้อ** เรียงจากยาก → ปานกลาง → ง่าย |
| `source` | `"ai"` เจนใหม่ทันในงบเวลา · `"cache"` หยิบจากชุดที่แคชไว้ · `"fallback"` ใช้คำใบ้สำรอง |

**Response `400`** เมื่อ body ผิดรูป: `{ "error": "characterId ต้องเป็นจำนวนเต็มบวก" }`

**ไม่มี `500` เด็ดขาด** — error ทุกชนิดถูกแปลงเป็น `200` + `source: "fallback"` และบันทึกต้นเหตุไว้ที่ Server log เท่านั้น เพื่อให้เกมเล่นต่อได้แม้ AI ล่ม

ระบบย่อยที่อยู่ใน Route Handler นี้: ขอคำใบ้ทีเดียว 10 ข้อแล้วสุ่มมา 3 (ประหยัดโควตา) · กรองคำใบ้ที่สปอยชื่อตัวละคร · กั้นให้เฉพาะตัวละครใน `curated-disney.json` ยิงถึง Gemini ได้ (กันการถลุงโควตาและ Prompt Injection) · แคช 1 ชั่วโมงพร้อมรวมคำขอที่ซ้ำกัน · และใช้ `after()` จาก `next/server` ให้งานเจนที่เกินงบ 8 วินาทีวิ่งต่อเบื้องหลังจนลงแคช

---

## 7. การจัดการสถานะ (State Management)

| ประเภท | ใช้ที่ไหน | เหตุผล |
| :--- | :--- | :--- |
| **React Context** (`GameContext`) | สถานะรอบการเล่นเกมทั้ง 2 โหมด | ข้อมูลเกม (ตัวละครลับ, คำใบ้, คะแนน, ประวัติการทาย, เวลา) ต้องใช้ร่วมกันหลาย component ที่ซ้อนกันลึก ถ้าส่งเป็น props จะเกิด prop drilling |
| **`useState`** | ตัวกรองเหรียญรางวัล, เปิด/ปิดเมนู, โหมดที่เลือกในหน้าแรก | สถานะเฉพาะจุดที่ไม่มีใครอื่นต้องใช้ |
| **URL / `searchParams`** | `?mode=` ของ `/play` · `?mode=`+`?period=` ของ `/scoreboard` | คัดลอกลิงก์ไปแชร์ได้ และกด Refresh/Back แล้วค่าคงเดิม |
| **`localStorage`** | ประวัติการเล่น (`lib/gameSessions.js`), เหรียญรางวัล, คะแนนล่าสุดใน Nav | ข้อมูลส่วนตัวรายเครื่อง ไม่จำเป็นต้องขึ้น Server |
| **ไฟล์ฝั่ง Server** | คะแนนกระดานผู้นำ | ต้องแชร์กันทุกคน ไม่ใช่เก็บในเครื่องใครเครื่องมัน |

### `GameContext` + `useGame()`

**ไฟล์:** `context/GameContext.jsx` และ `hooks/useGame.js`

```jsx
// app/play/page.jsx (Server) — อ่านโหมดจาก URL แล้วส่งเป็นค่าเริ่มต้น
<GameProvider initialMode={initialMode}>
  <GameBoard />
</GameProvider>
```

```jsx
// component ลูกเรียกใช้ได้ทุกชั้นโดยไม่ต้องส่ง props ลงไป
const { currentCharacter, currentClues, submitGuess, gameState } = useGame();
```

**Guard Clause:** `useGame()` จะ `throw new Error('useGame must be used within a GameProvider')` ถ้าถูกเรียกนอก Provider ทำให้เจอบั๊กตอนพัฒนาทันที ไม่ใช่ปล่อยให้ค่าเป็น `undefined` แล้วไปพังที่อื่นแบบหาต้นตอยาก

Custom Hooks อื่น: `hooks/useTimer.js` (นับถอยหลัง 30 วินาที มี cleanup `clearInterval` กัน memory leak) และ `hooks/useSound.js` (เสียงเอฟเฟกต์ผ่าน Web Audio API)

---

## 8. การตรวจความถูกต้องของฟอร์ม (Form Validation)

ใช้ **react-hook-form** + **zod** ผ่าน **@hookform/resolvers** โดยมีจุดสำคัญคือ **แชร์ schema ไฟล์เดียวกันทั้งฝั่ง Client และ Server**

### 8.1 Schema กลาง

**ไฟล์:** `lib/scoreSchema.js` (ไม่มี `'use client'` และไม่มี `'server-only'` จึง import ได้จากทั้งสองฝั่ง)

| ฟิลด์ | กฎ |
| :--- | :--- |
| `name` | string · `.trim()` แล้วต้องยาว 2–24 ตัวอักษร (trim ก่อน min จึงกันค่าที่เป็นช่องว่างล้วนได้) |
| `gameMode` | `'deduction'` หรือ `'trivia'` เท่านั้น |
| `score` | จำนวนเต็ม 0–1,000,000 |
| `timeSpentSeconds` | จำนวนเต็ม 0–86,400 (24 ชั่วโมง) |
| `guessesCount`, `correctCount`, `firstClueWins` | จำนวนเต็มไม่ติดลบ · ไม่บังคับกรอก |

ข้อความ error เป็นภาษาไทยทั้งหมด เช่น `"ชื่อผู้เล่นต้องมีอย่างน้อย 2 ตัวอักษร"`, `"คะแนนต้องเป็นจำนวนเต็ม"`

### 8.2 ตรวจ 2 ชั้น

```
ชั้นที่ 1 — ฝั่ง Client (เพื่อ UX)
components/ScoreSubmissionForm.jsx
  useForm({ resolver: zodResolver(scoreSchema) })
  → ขึ้นข้อความ error ใต้ช่องกรอกทันที ไม่ต้องรอ round-trip ไป Server

ชั้นที่ 2 — ฝั่ง Server (เพื่อความปลอดภัย)
app/scoreboard/actions.js
  scoreSchema.safeParse(data)
  → ถ้าไม่ผ่าน ตอบ { ok: false, errors } ไม่เขียนข้อมูลลงคลัง
```

**ทำไมต้องตรวจซ้ำฝั่ง Server:** การตรวจฝั่ง Client เป็นเรื่องประสบการณ์ผู้ใช้เท่านั้น **ไม่ใช่ความปลอดภัย** เพราะผู้ใช้ปิด JavaScript, แก้ค่าใน DevTools หรือยิง Server Action ตรง ๆ ได้ (Server Action ทุกตัวเป็น endpoint ที่เข้าถึงได้จากภายนอกโดยปริยาย) การแชร์ schema ไฟล์เดียวทำให้กฎทั้งสองฝั่งตรงกันเสมอ แก้ที่เดียวมีผลทั้งคู่ — ถ้าเขียนกฎแยกกันสองที่ สักวันมันจะหลุดไม่ตรงกัน

**ทดสอบแล้ว** ว่าการยิง Server Action ตรง ๆ โดยข้ามฟอร์ม ด้วยข้อมูลอย่าง `{ gameMode: "godmode", score: 999999999, timeSpentSeconds: -5 }` ถูกปฏิเสธครบทุกฟิลด์และไม่มีข้อมูลถูกเขียนลงไฟล์

---

## 9. โครงสร้างโปรเจกต์

```
app/
├── layout.jsx                  # Root Layout (Server) + ฟอนต์ไทย + metadata
├── page.jsx                    # หน้าแรก (Server, ISR 300s)
├── globals.css                 # Design System (@theme) + utility 3D flip
├── not-found.jsx               # 404 รวม
├── play/page.jsx               # Shell กระดานเกม (Server, อ่าน ?mode=)
├── characters/[id]/
│   ├── page.jsx                # Codex ดึง Disney API (Server, ISR 86400s)
│   └── not-found.jsx           # 404 เมื่อไม่พบตัวละคร
├── scoreboard/
│   ├── page.jsx                # กระดานผู้นำ (Server, Dynamic)
│   └── actions.js              # Server Action: submitScore()
├── achievement/page.jsx        # เหรียญรางวัล (Client, localStorage)
└── api/ai/clues/route.js       # Route Handler: Gemini AI clues
components/
├── Nav.jsx                     # แถบเมนู (Client Island)
├── Footer.jsx                  # ส่วนท้าย (Server)
├── ScoreSubmissionForm.jsx     # ฟอร์มส่งคะแนน (Client, RHF + zod)
├── ScoreboardTable.jsx         # ตารางอันดับ (Server)
├── ui/                         # Design System: Button, Card, Badge, PageHeader
├── home/                       # ModeSelector (Client), FeaturedCharacter (Server)
├── game/                       # กระดานเกมทั้งหมด (Client)
└── character/                  # CharacterDetailCard (Server)
context/GameContext.jsx         # Global game state + GameProvider
hooks/                          # useGame, useTimer, useSound
lib/
├── scoreSchema.js              # zod schema กลาง (ใช้ทั้ง Client และ Server)
├── scoreboardStore.js          # คลังคะแนนฝั่ง Server (server-only)
├── clues.js                    # Service Adapter ยิง /api/ai/clues
├── ai/                         # prompt.js, gemini.js, fallbackClues.js
├── disney.js                   # ดึง Disney API + ISR + fallback
├── gameLogic.js                # compareAttributes, คำนวณคะแนน, Emoji Grid
├── featured.js                 # เลือกตัวละครประจำวันตามเวลาไทย
├── gameModes.js                # คำอธิบายโหมด (แหล่งความจริงเดียว)
├── achievements.js             # กฎการปลดล็อกเหรียญ
├── gameSessions.js             # อ่าน/เขียนประวัติการเล่นใน localStorage
├── contracts/types.js          # สัญญาข้อมูลกลางระหว่างสมาชิก
└── data/
    ├── curated-disney.json     # ตัวละคร 50 ตัวจาก Disney API
    ├── mock-clues.json         # คำใบ้สำรองภาษาไทย
    └── scoreboard.json         # คะแนนกระดานผู้นำ (เขียนโดย Server Action)
scripts/
├── warm-clues.mjs              # อุ่นแคชคำใบ้ก่อนเดโม (npm run warm)
├── fetch-curated.mjs           # ดึงตัวละครจาก Disney API
└── reconcile-curated.mjs       # ซ่อมข้อมูลตัวละครให้ตรงกับ API
```

---

## 10. เอกสารเพิ่มเติม

| ไฟล์ | เนื้อหา |
| :--- | :--- |
| `React final Project Proposal.md` | ข้อเสนอโครงงานฉบับที่ส่ง |
| `PANNAWIT-DEVELOPMENT-PLAN.md` | แผนพัฒนาและคู่มือส่งต่องานของปัณณวิชญ์ |
| `PANNAWIT-SUMMARY-REPORT.md` | รายงานสรุปงานของปัณณวิชญ์ |
| `BIO-SUMMARY-REPORT.md` | รายงานสรุปงานของเมธาสิทธิ์ (AI Engine, Design System, หน้าแรก) |

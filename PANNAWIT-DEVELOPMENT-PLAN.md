# แผนการพัฒนาฉบับสมบูรณ์ (Masterpiece Development Plan) — ปัณณวิชญ์ สิทธิตัน (682110181)

**กลุ่ม:** Sigma  
**โปรเจกต์:** Disney Character Clue Guesser (Final Project)  
**ตำแหน่งหน้าที่:** Game Arena Architect, State & Logic Engineer, Character Codex Developer  
**สถาปัตยกรรม:** Next.js 15 (App Router) · React 19 · Tailwind CSS v4  
**API อ้างอิง:** [Disney API](https://api.disneyapi.dev/character) (`https://api.disneyapi.dev/character`)  
**การแบ่งแยกหน้าที่:** ยึดตาม `React final Project Proposal.md` อย่างเคร่งครัด **ไม่ก้าวก่ายงานของเพื่อนร่วมทีม** โดยจุดที่เชื่อมต่อกันจะทำเป็น **คู่มือชี้ทาง (Integration Guides)** ให้เพื่อนเข้ามาเสียบงานต่อได้ทันที

---

## สารบัญ
1. [การแบ่งแยกขอบเขตงานชัดเจน (Boundary & Responsibility Matrix)](#1-การแบ่งแยกขอบเขตงานชัดเจน)
2. [คู่มือชี้ทางสำหรับส่งต่องานเพื่อนร่วมทีม (Integration Guides)](#2-คู่มือชี้ทางสำหรับส่งต่องานเพื่อนร่วมทีม)
   - [ไกด์ 1: ส่งต่อให้ เมธาสิทธิ์ (Layout, Nav, Home & Gemini AI Clues)](#ไกด์-1-ส่งต่อให้-เมธาสิทธิ์-682110189)
   - [ไกด์ 2: ส่งต่อให้ สิรวิชญ์ (Score Submission Form, Scoreboard & Achievements)](#ไกด์-2-ส่งต่อให้-สิรวิชญ์-682110199)
3. [สถาปัตยกรรมระบบ 2 โหมดการเล่น (Dual-Mode Game Engine Architecture)](#3-สถาปัตยกรรมระบบ-2-โหมดการเล่น-dual-mode-game-engine-architecture)
   - [3.1 โหมด PokéGuesser Deduction (อนุมานคุณลักษณะสไตล์ Squirdle/Wordle)](#31-โหมด-pokéguesser-deduction-โหมดหลักสไตล์-squirdlewordle)
   - [3.2 โหมด Trivia Time-Attack (ตอบคำถามจับเวลา 5 ด่าน AI Clues)](#32-โหมด-trivia-time-attack-ตอบคำถามจับเวลา-5-ด่าน-ai-clues)
   - [3.3 ระบบการสลับโหมด (URL Query Param & Mode Switcher UI)](#33-ระบบการสลับโหมด-url-query-param--mode-switcher-ui)
4. [โครงสร้างโฟลเดอร์และไฟล์ที่เป็นกรรมสิทธิ์ของปัณณวิชญ์ 100%](#4-โครงสร้างโฟลเดอร์และไฟล์ที่เป็นกรรมสิทธิ์ของปัณณวิชญ์-100)
5. [แผนการดำเนินงานรายขั้นตอน (Step-by-Step Implementation)](#5-แผนการดำเนินงานรายขั้นตอน)
   - [เฟส 0: Setup โครงสร้าง Next.js 15 (เฉพาะ Shell กลาง)](#เฟส-0-setup-โครงสร้าง-nextjs-15-เฉพาะ-shell-กลาง)
   - [เฟส 1: เตรียมชุดข้อมูล Curated ตัวละคร และ Service Adapter](#เฟส-1-เตรียมชุดข้อมูล-curated-ตัวละคร-และ-service-adapter)
   - [เฟส 2: ระบบ State Machine, Dual-Mode Engine & Hooks](#เฟส-2-ระบบ-state-machine-dual-mode-engine--hooks)
   - [เฟส 3: กระดานเกมอินเทอร์แอคทีฟ `/play` (Deduction Arena + Trivia Arena)](#เฟส-3-กระดานเกมอินเทอร์แอคทีฟ-play)
   - [เฟส 4: หน้ารายละเอียดตัวละคร `/characters/[id]` (Codex ดึง Live API + notFound)](#เฟส-4-หน้ารายละเอียดตัวละคร-charactersid)
   - [เฟส 5: การทดสอบความถูกต้องและส่งมอบงาน](#เฟส-5-การทดสอบความถูกต้องและส่งมอบงาน)
6. [ข้อควรระวังทางเทคนิคและจุดหลุมพรางของ Disney API (Pitfalls & Rubrics)](#6-ข้อควรระวังทางเทคนิคและจุดหลุมพรางของ-disney-api)
7. [ตารางตรวจสอบความคืบหน้า (Progress Checklist)](#7-ตารางตรวจสอบความคืบหน้า)

---

## 1. การแบ่งแยกขอบเขตงานชัดเจน (Boundary & Responsibility Matrix)

เพื่อป้องกันการทับซ้อนและให้คะแนนการประเมินแยกรายบุคคลได้อย่างชัดเจน:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        ขอบเขตความรับผิดชอบของกลุ่ม Sigma (Proposal)                   │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│  เมธาสิทธิ์ (682110189)   │   ปัณณวิชญ์ (682110181)      │     สิรวิชญ์ (682110199)       │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ • หน้าแรก (/)            │ • กระดานเกม (/play)         │ • หน้ากระดานผู้นำ (/scoreboard) │
│ • Layout หลัก + <Nav />  │ • Mystery Silhouette Card   │ • Form ส่งคะแนน (Zod Schema)  │
│ • UI Design (Tailwind)   │ • Deduction Comparison Table│ • Route Handler /api/scoreboard│
│ • Route Handler AI Clues │ • Global GameContext        │ • หน้าเหรียญตรา (/achievement)│
│   (POST /api/ai/clues)   │ • useTimer / useSound Hooks │ • ระบบ localStorage สำหรับผลงาน│
│ • Prompt Engineering     │ • หน้ารายละเอียดตัวละคร      │                               │
│                          │   (/characters/[id] + 404)  │                               │
│                          │ • จัดเตรียม Curated Data 50  │                               │
│                          │ • ฟังก์ชันคำนวณคะแนนในเกม    │                               │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

### 🚫 กฎเหล็กของปัณณวิชญ์ (สิ่งที่ปัณณวิชญ์ "ห้ามเขียนเอง"):
1. **ห้ามเขียน Zod Schema หรือ Form ส่งคะแนน:** ปัณณวิชญ์จะทำเฉพาะ Slot และส่งต่อ Props ให้สิรวิชญ์เอา `<ScoreSubmissionForm />` มาวางใน `GameOverScreen.jsx`
2. **ห้ามเขียน Route Handler `/api/scoreboard`:** เป็นหน้าที่ของสิรวิชญ์ 100%
3. **ห้ามเขียนหน้า `/scoreboard` หรือ `/achievement`:** ปัณณวิชญ์จะทำเพียงปุ่มลิงก์นำทาง `<Link href="/scoreboard">` ไปยังหน้าของสิรวิชญ์
4. **ห้ามเชื่อมต่อ Google Gemini API Key โดยตรง:** ปัณณวิชญ์จะเรียกผ่าน Service Adapter `lib/clues.js` เพื่อรอเชื่อมกับ Route Handler ของเมธาสิทธิ์
5. **ห้ามตกแต่ง UI หน้าแรก (`/`) หรือทำเมนู `<Nav />` ถาวร:** ปัณณวิชญ์จะทำเฉพาะโครงเปล่าสำหรับกดเทส แล้วให้เมธาสิทธิ์เป็นผู้ออกแบบหลัก

---

## 2. คู่มือชี้ทางสำหรับส่งต่องานเพื่อนร่วมทีม (Integration Guides)

### ไกด์ 1: ส่งต่อให้ เมธาสิทธิ์ (682110189)

#### 🔹 1.1 จุดเชื่อมต่อ Layout และ Navigation (`app/layout.jsx` & `components/Nav.jsx`)
- **สถานะที่ปัณณวิชญ์เตรียมไว้:** ปัณณวิชญ์จะสร้างโครง Shell ขั้นต่ำเพื่อให้รันโปรเจกต์ได้:
  ```jsx
  // app/layout.jsx (Skeleton ชั่วคราว)
  export default function RootLayout({ children }) {
    return (
      <html lang="th">
        <body>
          {/* [TODO เมธาสิทธิ์]: วาง <Nav /> สไตล์ Tailwind ที่นี่ */}
          <main>{children}</main>
        </body>
      </html>
    );
  }
  ```
- **สิ่งที่เมธาสิทธิ์ต้องทำต่อ:**
  - สร้าง `components/Nav.jsx` เป็น Client Island ที่ใช้ `usePathname()` เพื่อทำ Active Link ไปยัง:
    - `/` (Home)
    - `/play` (Game Arena ของปัณณวิชญ์)
    - `/scoreboard` (Leaderboard ของสิรวิชญ์)
    - `/achievement` (Achievements ของสิรวิชญ์)

#### 🔹 1.2 จุดเชื่อมต่อ AI Clue Generation (`POST /api/ai/clues`)
- **สถานะที่ปัณณวิชญ์เตรียมไว้:** ปัณณวิชญ์สร้างฟังก์ชัน Adapter ไว้ที่ `lib/clues.js`:
  ```javascript
  // lib/clues.js
  export async function getCharacterClues(characterId, characterName) {
    // ปัจจุบันดึงจาก mock-clues.json ในเครื่องเพื่อให้เล่นได้ทันที
    // เมื่อเมธาสิทธิ์ทำ Route Handler เสร็จ ให้เปลี่ยนมาเปิดบรรทัดนี้:
    /*
    const res = await fetch('/api/ai/clues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId, characterName })
    });
    return await res.json();
    */
  }
  ```
- **สเปกที่เมธาสิทธิ์ต้องตอบกลับมา (AI Prompt Requirements):**
  - **Endpoint:** `app/api/ai/clues/route.js`
  - **Body ที่ได้รับ:** `{ characterId: number, characterName: string }`
  - **JSON ที่ต้องส่งกลับ (ห้ามหลุด format):**
    ```json
    {
      "characterId": 4703,
      "characterName": "Mickey Mouse",
      "clues": [
        "คำใบ้ยาก: เป็นกัปตันขับเรือกลไฟในแอนิเมชันขาวดำปี 1928",
        "คำใบ้ปานกลาง: ใส่ถุงมือขาว กางเกงแดง มีเพื่อนสนิทเป็นเป็ดและหมา",
        "คำใบ้ง่าย: หนูที่เป็นสัญลักษณ์และตัวนำโชคของ Walt Disney"
      ]
    }
    ```

---

### ไกด์ 2: ส่งต่อให้ สิรวิชญ์ (682110199)

#### 🔹 2.1 จุดเชื่อมต่อการบันทึกคะแนนในหน้าจบเกม (`GameOverScreen.jsx`)
- **สถานะที่ปัณณวิชญ์เตรียมไว้:** ใน `components/game/GameOverScreen.jsx` ปัณณวิชญ์จะจัดเตรียมกล่อง Slot และส่ง Props ข้อมูลเกมครบถ้วน:
  ```jsx
  // components/game/GameOverScreen.jsx
  export default function GameOverScreen({ gameSession }) {
    return (
      <div className="game-over-card">
        <h2>🎉 จบเกม 5 ด่าน!</h2>
        <p>คะแนนรวม: {gameSession.score} คะแนน</p>
        <p>เวลาที่ใช้: {gameSession.timeSpentSeconds} วินาที</p>
        
        {/* ======================================================== */}
        {/* [TODO สิรวิชญ์]: นำ <ScoreSubmissionForm /> มาวางตรงนี้ */}
        {/* Props ที่ปัณณวิชญ์ส่งมอบให้สิรวิชญ์นำไปเข้า Zod Form:        */}
        {/* ======================================================== */}
        <div id="sirawich-score-form-slot">
          {/* ตัวอย่างการนำมาเสียบ:
          <ScoreSubmissionForm 
            score={gameSession.score}
            roundsPlayed={gameSession.roundsPlayed}
            correctAnswers={gameSession.correctAnswers}
            timeSpentSeconds={gameSession.timeSpentSeconds}
            guessesCount={gameSession.guessesCount}
          />
          */}
        </div>
      </div>
    );
  }
  ```
- **สิ่งที่สิรวิชญ์ต้องทำต่อ:**
  - สร้าง `components/ScoreSubmissionForm.jsx` โดยใช้ `react-hook-form` + `zod` (`zodResolver`)
  - ให้ฟอร์มยิง `POST /api/scoreboard` บันทึกลง `scoreboard.json`
  - เรียก `revalidatePath('/scoreboard')` เพื่อให้อันดับอัปเดตสด

#### 🔹 2.2 จุดเชื่อมต่อระบบความสำเร็จ (Achievement Triggers)
- **สถานะที่ปัณณวิชญ์เตรียมไว้:** เมื่อผู้เล่นจบเกม ปัณณวิชญ์จะบันทึกผลการเล่นรอบล่าสุดลง `localStorage`:
  ```javascript
  // ปัณณวิชญ์จะบันทึกคีย์นี้ให้ในเครื่องผู้เล่น:
  localStorage.setItem('disney_last_session', JSON.stringify({
    score: totalScore,
    correctCount: 5,
    firstClueWins: 2, // ตอบถูกตั้งแต่คำใบ้แรก
    playedAt: new Date().toISOString()
  }));
  ```
- **สิ่งที่สิรวิชญ์ต้องทำต่อ:**
  - ในหน้า `app/achievement/page.jsx` ให้สิรวิชญ์อ่านค่าจาก `disney_last_session` เพื่อนำไปคำนวณปลดล็อกเหรียญรางวัล (เช่น "ตอบถูกคำใบ้แรกครบ 5 ครั้ง") โดยปัณณวิชญ์จะไม่ไปยุ่งกับหน้านี้

---

## 3. สถาปัตยกรรมระบบ 2 โหมดการเล่น (Dual-Mode Game Engine Architecture)

เพื่อยกระดับความสนุกและตอบโจทย์แฟนเกมสไตล์ **PokéGuesser / Wordle / Squirdle** ระบบเกม Disney Clue Guesser จะรองรับ **2 โหมดการเล่น** อย่างสมบูรณ์แบบ ผ่าน URL Query Parameter (`/play?mode=deduction` และ `/play?mode=trivia`):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        Disney Clue Guesser: Dual-Mode Architecture                     │
├──────────────────────────────────────────┬─────────────────────────────────────────────┤
│   โหมดที่ 1: PokéGuesser Deduction       │        โหมดที่ 2: Trivia Time-Attack        │
│   (?mode=deduction) — [โหมดไฮไลต์]        │        (?mode=trivia) — [โหมดมาตรฐานเดิม]   │
├──────────────────────────────────────────┼─────────────────────────────────────────────┤
│ • เป้าหมาย: ค้นหาตัวละครปริศนา 1 ตัว     │ • เป้าหมาย: ทายตัวละครสะสมคะแนน 5 ด่าน       │
│ • เวลา: ไม่จำกัดเวลา (Untimed)           │ • เวลา: จับเวลานับถอยหลัง 30 วินาที/ด่าน     │
│ • จำนวนครั้งทาย: ไม่จำกัด (Unlimited)    │ • จำนวนครั้งทาย: ทายได้จนกว่าจะหมดเวลา 30 วิ  │
│ • แกนหลัก: ตารางวิเคราะห์ Attribute Grid │ • แกนหลัก: คำใบ้ AI 3 ระดับ (ยาก->กลาง->ง่าย)│
│ • การให้คะแนน: ยิ่งทายน้อยครั้ง ยิ่งได้  │ • การให้คะแนน: คำนวณจากเวลาที่เหลือ + คำใบ้   │
│   คะแนนสูง (หัก 75 แต้ม/การเดาผิด)       │ • การจบเกม: จบครบ 5 ด่าน                    │
│ • ฟีเจอร์พิเศษ: Wordle-style Emoji Grid  │ • ฟีเจอร์พิเศษ: การ์ดเงาดำค่อยๆ สว่างขึ้น    │
│   (🟩🟥⬆️) คัดลอกผลลัพธ์ไปแชร์ได้        │   ตามระดับคำใบ้                              │
└──────────────────────────────────────────┴─────────────────────────────────────────────┘
```

### 3.1 โหมด PokéGuesser Deduction (โหมดหลักสไตล์ Squirdle/Wordle)
1. **กติกาการเล่น:**
   - ระบบจะสุ่มตัวละครเป้าหมายลับมา 1 ตัว โดยแสดงภาพเป็นการ์ดเงามืด (Silhouette)
   - ผู้เล่นค้นหาและพิมพ์ชื่อตัวละครที่คาดเดาผ่าน `CharacterSuggestInput`
   - เมื่อกดส่งชื่อ ระบบจะนำคุณลักษณะของตัวละครที่เดาไปเปรียบเทียบกับตัวละครเป้าหมายลับทันที แล้วเรนเดอร์แถวใหม่ลงใน **ตาราง Deduction Grid**
   - **5 มิติการเปรียบเทียบคุณลักษณะจริงจาก Disney API:**
     1. 🎬 **ภาพยนตร์ร่วม (Shared Films):** 🟩 มีหนังเรื่องเดียวกันอย่างน้อย 1 เรื่อง / 🟥 ไม่มีหนังร่วมกันเลย
     2. 🎞️ **จำนวนหนังที่ปรากฏ (Film Count):** 🟩 จำนวนหนังเท่ากันพอดี / ⬆️ ตัวละครลับมีผลงานหนังมากกว่า / ⬇️ ตัวละครลับมีผลงานหนังน้อยกว่า
     3. 📺 **ซีรีส์ทางทีวี (TV Show Presence):** 🟩 สถานะทีวีตรงกัน (มี/ไม่มีทั้งคู่) / 🟥 ไม่ตรงกัน
     4. 🏰 **เครื่องเล่นในสวนสนุก (Park Attractions):** 🟩 มีเครื่องเล่นในสวนสนุกตรงกัน / 🟥 ไม่ตรงกัน
     5. 🔤 **ตัวอักษรแรก A-Z (First Letter):** 🟩 อักษรตัวแรกตรงกัน / ⬆️ อักษรตัวแรกของตัวละครลับอยู่ตามหลังในพจนานุกรม (A-Z) / ⬇️ อยู่ก่อนหน้า
2. **สูตรการคำนวณคะแนน Deduction Mode:**
   $$\text{Score} = \max(100, 1000 - ((\text{Guesses} - 1) \times 75))$$
   - ทายถูกในครั้งแรก = **1,000 คะแนนเต็ม**
   - ทายผิดครั้งละ -75 คะแนน
   - คะแนนต่ำสุด (Floor Score) = **100 คะแนน** (หากทายถูกสำเร็จ)
3. **ฟังก์ชันสร้างตาราง Emoji สำหรับแชร์ (Wordle-style Emoji Grid):**
   - เมื่อชนะเกม ระบบจะแปลงประวัติการเดาทั้งหมดเป็นชุด Emoji 5 คอลัมน์ เช่น:
     ```
     Disney Guesser (Deduction Mode) 🎯 4 Guesses
     🟥⬆️🟩🟥⬇️
     🟥⬇️🟩🟥⬆️
     🟩🟩🟩🟩🟩
     ```
   - มีปุ่ม "คัดลอกผลลัพธ์" ให้ผู้เล่นนำไปแชร์ใน Discord หรือ Social Media

---

### 3.2 โหมด Trivia Time-Attack (ตอบคำถามจับเวลา 5 ด่าน AI Clues)
- ใช้กลไกเดิมที่รองรับคำใบ้ AI 3 ระดับของเมธาสิทธิ์ (`POST /api/ai/clues`)
- แข่งขัน 5 ด่านสะสมคะแนน แข่งกับตัวนับเวลาถอยหลัง 30 วินาที
- เหมาะสำหรับผู้เล่นที่ต้องการความตื่นเต้นและท้าทายความเร็ว

---

### 3.3 ระบบการสลับโหมด (URL Query Param & Mode Switcher UI)
- ผู้เล่นสามารถเปลี่ยนโหมดผ่านแท็บสวิตช์ `[ 🧠 โหมดวิเคราะห์คุณลักษณะ (Deduction) | ⏱️ โหมดจับเวลา 5 ด่าน (Trivia) ]` บนหน้า `/play` ได้ทันที
- สถาปัตยกรรม Next.js 15 Server Component อ่าน `searchParams` ผ่าน `await searchParams` และส่งค่าเริ่มต้นไปยัง Client Component อย่างหมดจด ไม่มีปัญหา Hydration Mismatch

---

## 4. โครงสร้างโฟลเดอร์และไฟล์ที่เป็นกรรมสิทธิ์ของปัณณวิชญ์ 100%

ปัณณวิชญ์จะโฟกัสการเขียนโค้ดเฉพาะในไฟล์ที่ติดแท็ก `[★ ปัณณวิชญ์]` ด้านล่างนี้เท่านั้น:

```
D:\Project\React-final/
├── app/
│   ├── layout.jsx                      # [Skeleton เท่านั้น] เมธาสิทธิ์เป็นเจ้าของหลัก
│   ├── page.jsx                        # [Skeleton เท่านั้น] เมธาสิทธิ์เป็นเจ้าของหลัก
│   ├── not-found.jsx                   # [★ ปัณณวิชญ์] 404 รวมของระบบ
│   ├── play/
│   │   └── page.jsx                    # [★ ปัณณวิชญ์] Server Shell ครอบ GameBoard
│   ├── characters/
│   │   └── [id]/
│   │       ├── page.jsx                # [★ ปัณณวิชญ์] ดึง Live Disney API + notFound()
│   │       └── not-found.jsx           # [★ ปัณณวิชญ์] 404 เมื่อไม่พบ ID ตัวละคร
│   ├── scoreboard/                     # 🚫 สิรวิชญ์ดูแล
│   └── achievement/                    # 🚫 สิรวิชญ์ดูแล
├── components/
│   ├── game/
│   │   ├── GameBoard.jsx               # [★ ปัณณวิชญ์] กระดานเกมหลัก ("use client")
│   │   ├── MysteryCard.jsx             # [★ ปัณณวิชญ์] การ์ดเงาดำปริศนา + 3D Flip
│   │   ├── ClueBox.jsx                 # [★ ปัณณวิชญ์] แสดงคำใบ้ 3 ระดับ
│   │   ├── GuessHistoryTable.jsx       # [★ ปัณณวิชญ์] ตารางเปรียบเทียบ Attribute (PokéGuesser style)
│   │   ├── TimerBar.jsx                # [★ ปัณณวิชญ์] แถบเวลานับถอยหลัง 30 วิ
│   │   ├── CharacterSuggestInput.jsx   # [★ ปัณณวิชญ์] Autocomplete Input + Avatar
│   │   ├── RoundSummaryModal.jsx       # [★ ปัณณวิชญ์] สรุปด่าน + ลิงก์ไป /characters/[id]
│   │   └── GameOverScreen.jsx          # [★ ปัณณวิชญ์] หน้าสรุปจบเกม + Slot สำหรับสิรวิชญ์
│   └── character/
│       └── CharacterDetailCard.jsx     # [★ ปัณณวิชญ์] แสดงข้อมูลตัวละครจาก Disney API
├── context/
│   └── GameContext.jsx                 # [★ ปัณณวิชญ์] State การเล่นเกม + Guard Clause
├── hooks/
│   ├── useGame.js                      # [★ ปัณณวิชญ์] Hook สำหรับ GameContext
│   ├── useTimer.js                     # [★ ปัณณวิชญ์] Hook ตัวจับเวลา + cleanup
│   └── useSound.js                     # [★ ปัณณวิชญ์] ระบบเสียงสังเคราะห์ในเกม
└── lib/
    ├── data/
    │   ├── curated-disney.json         # [★ ปัณณวิชญ์] ฐานข้อมูล 50 ตัวละครยอดนิยมจาก API
    │   └── mock-clues.json             # [★ ปัณณวิชญ์] คำใบ้สำรอง 3 ระดับ
    ├── clues.js                        # [★ ปัณณวิชญ์] Service Adapter รอต่อกับเมธาสิทธิ์
    ├── disney.js                       # [★ ปัณณวิชญ์] Client เชื่อมต่อ Live Disney API
    └── gameLogic.js                    # [★ ปัณณวิชญ์] ฟังก์ชันคำนวณคะแนน & Deduction Engine
```

---

## 5. แผนการดำเนินงานรายขั้นตอน (Step-by-Step Implementation)

### เฟส 0: Setup โครงสร้าง Next.js 15 (เฉพาะ Shell กลาง)
1. ติดตั้ง Next.js 15, React 19, Tailwind CSS v4
2. กำหนด `jsconfig.json` ให้รองรับ `@/*`
3. วางโครงร่างหน้าว่าง `app/layout.jsx` และ `app/page.jsx` พร้อมคอมเมนต์ไกด์ชี้ทางให้เมธาสิทธิ์

### เฟส 1: เตรียมชุดข้อมูล Curated ตัวละคร และ Service Adapter
1. **จัดทำ `lib/data/curated-disney.json`:**
   - คัดเลือกตัวละครระดับไอคอน 25–50 ตัวจาก Disney API ที่มีรูปสวยงามและข้อมูลครบ (Mickey, Baloo, Simba, Aladdin, Ariel ฯลฯ)
2. **สร้าง `lib/clues.js`:**
   - ทำ Service Adapter รองรับการสลับไปยิง `POST /api/ai/clues` ของเมธาสิทธิ์

### เฟส 2: ระบบ State Machine, Dual-Mode Engine & Hooks
1. **พัฒนา `lib/gameLogic.js`:**
   - ฟังก์ชัน `compareAttributes(guessed, target)` เปรียบเทียบข้อมูลจริงจาก Disney API:
     - 🎬 ภาพยนตร์ร่วม (films)
     - 🎞️ จำนวนหนัง (length)
     - 📺 ออกจอแก้ว (tvShows)
     - 🏰 เครื่องเล่นในสวนสนุก (parkAttractions)
     - 🔤 อักษรตัวแรก (First letter A-Z)
   - ฟังก์ชัน `calculateRoundScore(...)` สำหรับโหมด Trivia (อิงเวลาและคำใบ้)
   - ฟังก์ชัน `calculateDeductionScore(guessCount)` สำหรับโหมด Deduction (ลดหลั่นตามจำนวนครั้งที่เดา)
   - ฟังก์ชัน `generateShareableGrid(guessHistory)` สร้างตาราง Emoji สไตล์ Wordle (🟩🟥⬆️⬇️)
2. **สร้าง `hooks/useTimer.js`:** นับเวลาถอยหลัง 30 วินาทีสำหรับ Trivia พร้อม cleanup ป้องกัน memory leak
3. **พัฒนา `context/GameContext.jsx`:** ควบคุมสถานะเกมทั้ง 2 โหมด (`deduction` และ `trivia`) สลับโหมดได้ลื่นไหล พร้อม Guard Clause

### เฟส 3: กระดานเกมอินเทอร์แอคทีฟ `/play` (Deduction Arena + Trivia Arena)
1. **เพิ่ม Mode Switcher Tabs:** สลับระหว่าง `โหมดอนุมานคุณลักษณะ (Deduction)` และ `โหมดตอบคำถามจับเวลา (Trivia)`
2. **ปรับแต่ง `MysteryCard.jsx`:** การ์ดเงาดำ Who's That Disney Character + 3D Flip Reveal เมื่อทายถูก
3. **ปรับแต่ง `GuessHistoryTable.jsx`:** ตารางเปรียบเทียบสีเขียว/แดง/ลูกศร แบบ PokéGuesser ที่เป็นหัวใจหลักของโหมด Deduction
4. **สร้าง `CharacterSuggestInput.jsx`:** Autocomplete พร้อมภาพ Avatar เล็กๆ เคียงข้างชื่อตัวละคร
5. **ปรับแต่ง `GameOverScreen.jsx`:**
   - ในโหมด Deduction: แสดงจำนวนครั้งที่ใช้ทาย, คะแนน, ตาราง Emoji Grid สไตล์ Wordle พร้อมปุ่ม "คัดลอกผลลัพธ์ (Copy)"
   - ในโหมด Trivia: แสดงผลงานสรุป 5 ด่าน
   - Slot Props ให้สิรวิชญ์นำ `<ScoreSubmissionForm />` มาวาง
6. **สร้าง `RoundSummaryModal.jsx`:** ป๊อปอัปสรุปผลด่านพร้อมลิงก์ไปยัง Codex

### เฟส 4: หน้ารายละเอียดตัวละคร `/characters/[id]`
1. **สร้าง `lib/disney.js`:**
   - ฟังก์ชัน `fetchCharacter(id)` ดึง Live API
   - **ดักจับ Edge Case:** ตรวจสอบ `if (!data?.data || Array.isArray(data.data) || !data.data._id) return null;`
2. **สร้าง `app/characters/[id]/page.jsx` (Server Component):**
   - ใช้ `const { id } = await params;` และเรียก `notFound()` เมื่อ return null
3. **สร้าง `app/characters/[id]/not-found.jsx`:** แสดงหน้า 404 ธีมดิสนีย์
4. **สร้าง `components/character/CharacterDetailCard.jsx`:** แสดงรายละเอียดตัวละครและผลงานทั้งหมด

### เฟส 5: การทดสอบความถูกต้องและส่งมอบงาน
1. ทดสอบเล่นโหมด Deduction: ทายหลายครั้ง ตารางเปรียบเทียบแสดงสีและลูกศรถูกต้อง เมื่อทายถูกแสดงการ์ดเปิดเผยและคะแนนถูกต้อง
2. ทดสอบเล่นโหมด Trivia: เล่นครบ 5 ด่าน จับเวลา 30 วินาที คำใบ้ AI ทำงานสมบูรณ์
3. ทดสอบสลับโหมดไปมาผ่าน UI และ Query String (`?mode=deduction` / `?mode=trivia`)
4. ทดสอบเข้า `/characters/450` (Baloo) และทดสอบ 404 เมื่อ ID ผิด (`/characters/999999`)
5. รัน `npm run build` ผ่าน 100% ปราศจาก Error และส่งมอบงาน

---

## 6. ข้อควรระวังทางเทคนิคและจุดหลุมพรางของ Disney API

| หลุมพรางที่ต้องระวัง (Pitfall) | แนวทางแก้ไขที่ถูกต้องตามหลักสูตร |
| :--- | :--- |
| **API ส่ง HTTP 200 แต่เป็น `data: []`** | ห้ามเช็กแค่ `res.ok` เพราะ Disney API ไม่ตอบ 404 เมื่อไม่พบ ID ต้องเช็ก `!Array.isArray(data.data)` ก่อนเรียก `notFound()` |
| **ลืม `await params` ใน Next.js 15** | ใน Next.js 15 `params` และ `searchParams` เป็น Promise ต้องใช้ `await params` และ `await searchParams` เสมอ |
| **Memory Leak จาก `setInterval`** | ใน `useTimer` ต้องมี `return () => clearInterval(intervalId);` ใน cleanup ของ `useEffect` เสมอ |
| **ความสับสนระหว่าง 2 โหมดเกม** | แยก State และการทำงานใน `GameContext` ชัดเจน: โหมด Deduction ไม่มีเวลานับถอยหลังกดดัน ให้คิดวิเคราะห์เต็มที่ ส่วน Trivia มีเวลากดดัน 30 วิ |
| **ก้าวก่ายงาน Zod Form ของสิรวิชญ์** | ปัณณวิชญ์จะไม่เขียน Zod Schema เอง แต่จะทำ Slot ใน `GameOverScreen` ให้สิรวิชญ์นำฟอร์มมาเสียบ |
| **ก้าวก่ายงาน UI / Layout ของเมธาสิทธิ์** | ปัณณวิชญ์จะทำเฉพาะโครงเปล่าใน `layout.jsx` แล้วเปิดทางให้เมธาสิทธิ์ตกแต่ง Navbar และหน้าแรก |

---

## 7. ตารางตรวจสอบความคืบหน้า (Progress Checklist)

- [x] **Phase 0:** ติดตั้ง Next.js 15 และวางโครง Shell เปล่า (พร้อมคอมเมนต์ไกด์ให้เมธาสิทธิ์)
- [x] **Phase 1:** จัดทำ `curated-disney.json` (ตัวละครระดับไอคอนพร้อมรูปชัดและข้อมูลครบ)
- [x] **Phase 1:** จัดทำ `lib/clues.js` Service Adapter (พร้อมไกด์สำหรับต่อ AI เมธาสิทธิ์)
- [x] **Phase 2:** พัฒนา `lib/gameLogic.js` (`compareAttributes`, `calculateDeductionScore`, `generateShareableGrid`)
- [x] **Phase 2:** พัฒนา `hooks/useTimer.js` พร้อม Cleanup function ป้องกัน Memory Leak
- [x] **Phase 2:** พัฒนา `context/GameContext.jsx` รองรับ Dual-Mode (`deduction` และ `trivia`)
- [x] **Phase 3:** สร้าง `MysteryCard.jsx` (การ์ดเงาดำ Who's That Disney Character + 3D Flip)
- [x] **Phase 3:** สร้าง `GuessHistoryTable.jsx` (PokéGuesser Deduction Grid สไตล์ Squirdle)
- [x] **Phase 3:** สร้าง `CharacterSuggestInput.jsx` พร้อม Avatar รูปภาพใน Dropdown
- [x] **Phase 3:** สร้าง `GameOverScreen.jsx` (รองรับสถิติ Deduction, Emoji Grid และ Slot สิรวิชญ์)
- [x] **Phase 4:** พัฒนา `lib/disney.js` ดึง Live Disney API (ดักจับ `data: []` และ ISR `revalidate: 86400`)
- [x] **Phase 4:** พัฒนาหน้า `app/characters/[id]/page.jsx` (`await params`) และหน้า `not-found.jsx`
- [x] **Phase 5:** ส่งต่อคู่มือชี้ทางให้เมธาสิทธิ์และสิรวิชญ์ และทดสอบ `npm run build` ผ่าน 100%

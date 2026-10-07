/**
 * Footer — ส่วนท้ายของทุกหน้า
 * ผู้ดูแล: เมธาสิทธิ์ พิบูลย์ศิลป์ (682110189)
 *
 * [Server หรือ Client?]
 *   Server Component (ไม่มี 'use client') เพราะเป็นข้อความคงที่ล้วน ๆ
 *   ไม่มี state ไม่มี event ไม่ใช้ Web API ใด ๆ
 *   แยกออกมาจาก layout.jsx เพื่อให้ layout อ่านง่ายและแก้ส่วนท้ายได้ที่เดียว
 *   โดยไม่ส่ง JavaScript เพิ่มให้ผู้เล่นแม้แต่ไบต์เดียว
 */
export default function Footer() {
  return (
    <footer className="border-t border-surface-700/70 bg-surface-950/60 py-6 px-4 text-center text-xs text-muted-500">
      <p>© 2026 Disney Clue Guesser — Final Project กลุ่ม Sigma</p>
      <p className="mt-1 text-muted-600">ขับเคลื่อนด้วย Disney API &amp; Google Gemini AI</p>
    </footer>
  );
}

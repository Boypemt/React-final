import Link from 'next/link';

export default function CharacterDetailCard({ character }) {
  if (!character) return null;

  const fallbackImage = 'https://static.wikia.nocookie.net/disney/images/2/2e/Disney_Mickey_Mouse.png';
  const displayImage = character.imageUrl || fallbackImage;

  const films = Array.isArray(character.films) ? character.films : [];
  const tvShows = Array.isArray(character.tvShows) ? character.tvShows : [];
  const videoGames = Array.isArray(character.videoGames) ? character.videoGames : [];
  const parkAttractions = Array.isArray(character.parkAttractions) ? character.parkAttractions : [];
  const shortFilms = Array.isArray(character.shortFilms) ? character.shortFilms : [];

  return (
    <div className="max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-8">
      {/* ส่วนหัว และปุ่มย้อนกลับ */}
      <div className="flex items-center justify-between">
        <Link
          href="/play"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-400 hover:text-blue-300 transition hover:-translate-x-1"
        >
          <span>←</span> กลับไปเล่นเกม
        </Link>
        <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
          Character Codex ID #{character._id}
        </span>
      </div>

      {/* กล่องหลัก: ข้อมูลและรูปภาพ */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-700/80 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
        {/* รูปภาพตัวละครขนาดใหญ่ */}
        <div className="w-56 h-64 sm:w-64 sm:h-72 rounded-2xl bg-slate-950 p-4 border border-slate-700/60 shadow-xl flex items-center justify-center shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayImage}
            alt={character.name}
            className="max-w-full max-h-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)]"
          />
        </div>

        {/* ข้อมูลเนื้อหา */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-2">
              Disney Character
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {character.name}
            </h1>
          </div>

          {/* สรุปจำนวนสื่อที่ปรากฏ (Badges) */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700">
              🎬 ภาพยนตร์: <b className="text-white">{films.length}</b> เรื่อง
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700">
              📺 ซีรีส์ทีวี: <b className="text-white">{tvShows.length}</b> เรื่อง
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700">
              🎮 วิดีโอเกม: <b className="text-white">{videoGames.length}</b> เกม
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700">
              🏰 สวนสนุก: <b className="text-white">{parkAttractions.length}</b> แห่ง
            </span>
          </div>

          {/* ลิงก์ไปยังข้อมูลภายนอก */}
          {character.url && (
            <p className="text-xs text-slate-500 pt-2 truncate">
              แหล่งอ้างอิง API:{' '}
              <a
                href={character.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline"
              >
                {character.url}
              </a>
            </p>
          )}
        </div>
      </div>

      {/* รายละเอียดสื่อที่ปรากฏในหมวดหมู่ต่างๆ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ภาพยนตร์ (Films) */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
            <span>🎬</span> ปรากฏในภาพยนตร์ ({films.length} เรื่อง)
          </h3>
          {films.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {films.map((film, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-xs text-slate-200 border border-slate-700/60"
                >
                  {film}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">ไม่มีข้อมูลภาพยนตร์หลัก</p>
          )}
        </div>

        {/* ซีรีส์ทางโทรทัศน์ (TV Shows) */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <span>📺</span> ปรากฏในซีรีส์ทางโทรทัศน์ ({tvShows.length} เรื่อง)
          </h3>
          {tvShows.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tvShows.map((show, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-xs text-slate-200 border border-slate-700/60"
                >
                  {show}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">ไม่มีข้อมูลซีรีส์ทางโทรทัศน์</p>
          )}
        </div>

        {/* วิดีโอเกม (Video Games) */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <span>🎮</span> ปรากฏในวิดีโอเกม ({videoGames.length} เกม)
          </h3>
          {videoGames.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {videoGames.map((game, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-xs text-slate-200 border border-slate-700/60"
                >
                  {game}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">ไม่มีข้อมูลวิดีโอเกม</p>
          )}
        </div>

        {/* เครื่องเล่นในสวนสนุก (Park Attractions) */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <span>🏰</span> เครื่องเล่นในสวนสนุก Disney ({parkAttractions.length} แห่ง)
          </h3>
          {parkAttractions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {parkAttractions.map((attraction, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-xs text-slate-200 border border-slate-700/60"
                >
                  {attraction}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">ไม่มีข้อมูลเครื่องเล่นในสวนสนุก</p>
          )}
        </div>

      </div>
    </div>
  );
}

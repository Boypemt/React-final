function total(sessions, select) {
  return sessions.reduce((sum, session) => sum + select(session), 0);
}

function longestPlayStreak(sessions) {
  const dates = [...new Set(
    sessions
      .map((session) => new Date(session.completedAt).toISOString().slice(0, 10))
      .sort()
  )];
  let longest = 0;
  let streak = 0;
  let previousDay = null;

  for (const date of dates) {
    const currentDay = Date.parse(`${date}T00:00:00Z`);
    streak = previousDay !== null && currentDay - previousDay === 86400000 ? streak + 1 : 1;
    previousDay = currentDay;
    longest = Math.max(longest, streak);
  }

  return longest;
}

const ACHIEVEMENTS = [
  {
    id: 'first-game',
    title: 'ก้าวแรก',
    description: 'เล่นเกมจบเป็นครั้งแรก',
    difficulty: 'easy',
    icon: '🎮',
    goal: 1,
    progress: (sessions) => sessions.length,
  },
  {
    id: 'three-games',
    title: 'เริ่มติดใจ',
    description: 'เล่นเกมจบ 3 ครั้ง',
    difficulty: 'easy',
    icon: '✨',
    goal: 3,
    progress: (sessions) => sessions.length,
  },
  {
    id: 'five-games',
    title: 'ขาประจำ',
    description: 'เล่นเกมจบ 5 ครั้ง',
    difficulty: 'easy',
    icon: '🎟️',
    goal: 5,
    progress: (sessions) => sessions.length,
  },
  {
    id: 'ten-games',
    title: 'แฟนพันธุ์แท้',
    description: 'เล่นเกมจบ 10 ครั้ง',
    difficulty: 'easy',
    icon: '🌟',
    goal: 10,
    progress: (sessions) => sessions.length,
  },
  {
    id: 'deduction-debut',
    title: 'นักสืบมือใหม่',
    description: 'เล่นโหมด Deduction จบหนึ่งครั้ง',
    difficulty: 'easy',
    icon: '🔎',
    goal: 1,
    progress: (sessions) => sessions.filter((session) => session.gameMode === 'deduction').length,
  },
  {
    id: 'trivia-debut',
    title: 'เกร็ดรู้ดิสนีย์',
    description: 'เล่นโหมด Trivia จบหนึ่งครั้ง',
    difficulty: 'easy',
    icon: '💡',
    goal: 1,
    progress: (sessions) => sessions.filter((session) => session.gameMode === 'trivia').length,
  },
  {
    id: 'both-modes',
    title: 'เล่นได้ทุกแนว',
    description: 'เล่นครบทั้ง Deduction และ Trivia',
    difficulty: 'easy',
    icon: '🧭',
    goal: 2,
    progress: (sessions) => new Set(sessions.map((session) => session.gameMode)).size,
  },
  {
    id: 'score-100',
    title: 'แต้มแรก',
    description: 'ทำคะแนนได้อย่างน้อย 100 แต้มในหนึ่งเกม',
    difficulty: 'easy',
    icon: '💯',
    goal: 100,
    progress: (sessions) => Math.max(0, ...sessions.map((session) => session.score)),
  },
  {
    id: 'score-500',
    title: 'คะแนนกำลังมา',
    description: 'ทำคะแนนได้อย่างน้อย 500 แต้มในหนึ่งเกม',
    difficulty: 'easy',
    icon: '⭐',
    goal: 500,
    progress: (sessions) => Math.max(0, ...sessions.map((session) => session.score)),
  },
  {
    id: 'first-correct',
    title: 'ทายถูกแล้ว!',
    description: 'ตอบถูกอย่างน้อยหนึ่งครั้ง',
    difficulty: 'easy',
    icon: '✅',
    goal: 1,
    progress: (sessions) => sessions.filter((session) =>
      session.isCorrect || session.correctCount > 0
    ).length,
  },
  {
    id: 'trivia-correct',
    title: 'ตอบถูกข้อแรก',
    description: 'ตอบถูกอย่างน้อยหนึ่งด่านในโหมด Trivia',
    difficulty: 'easy',
    icon: '🧠',
    goal: 1,
    progress: (sessions) => total(
      sessions.filter((session) => session.gameMode === 'trivia'),
      (session) => session.correctCount || 0
    ),
  },
  {
    id: 'quick-win',
    title: 'ไวปานสายฟ้า',
    description: 'ทายถูกและจบเกมภายใน 60 วินาที',
    difficulty: 'easy',
    icon: '⚡',
    goal: 1,
    progress: (sessions) => sessions.filter((session) =>
      session.isCorrect && session.timeSpentSeconds <= 60
    ).length,
  },
  {
    id: 'first-clue-answer',
    title: 'คำใบ้เดียวก็พอ',
    description: 'ตอบถูกจากคำใบ้แรกอย่างน้อยหนึ่งด่านในโหมด Trivia',
    difficulty: 'easy',
    icon: '🪄',
    goal: 1,
    progress: (sessions) => total(
      sessions.filter((session) => session.gameMode === 'trivia'),
      (session) => session.firstClueWins || 0
    ),
  },
  {
    id: 'twenty-five-games',
    title: 'นักสะสมประสบการณ์',
    description: 'เล่นเกมจบ 25 ครั้ง',
    difficulty: 'hard',
    icon: '🏅',
    goal: 25,
    progress: (sessions) => sessions.length,
  },
  {
    id: 'fifty-games',
    title: 'ตำนานแห่งอาณาจักร',
    description: 'เล่นเกมจบ 50 ครั้ง',
    difficulty: 'hard',
    icon: '👑',
    goal: 50,
    progress: (sessions) => sessions.length,
  },
  {
    id: 'lifetime-5000',
    title: 'คลังแต้มใหญ่',
    description: 'สะสมคะแนนรวม 5,000 แต้ม',
    difficulty: 'hard',
    icon: '💰',
    goal: 5000,
    progress: (sessions) => total(sessions, (session) => session.score),
  },
  {
    id: 'lifetime-10000',
    title: 'มหาเศรษฐีแต้ม',
    description: 'สะสมคะแนนรวม 10,000 แต้ม',
    difficulty: 'hard',
    icon: '💎',
    goal: 10000,
    progress: (sessions) => total(sessions, (session) => session.score),
  },
  {
    id: 'perfect-trivia',
    title: 'ตอบถูกยกชุด',
    description: 'ตอบถูกครบ 5 ด่านในเกม Trivia หนึ่งรอบ',
    difficulty: 'hard',
    icon: '🏆',
    goal: 1,
    progress: (sessions) => sessions.filter((session) =>
      session.gameMode === 'trivia' && session.correctCount === 5
    ).length,
  },
  {
    id: 'five-first-clues',
    title: 'อ่านใจตัวละคร',
    description: 'ตอบถูกจากคำใบ้แรกครบ 5 ด่าน',
    difficulty: 'hard',
    icon: '🪄',
    goal: 5,
    progress: (sessions) => total(
      sessions.filter((session) => session.gameMode === 'trivia'),
      (session) => session.firstClueWins || 0
    ),
  },
  {
    id: 'one-guess',
    title: 'ตาเหยี่ยว',
    description: 'ทายตัวละครในโหมด Deduction ถูกตั้งแต่ครั้งแรก',
    difficulty: 'hard',
    icon: '🦅',
    goal: 1,
    progress: (sessions) => sessions.filter((session) =>
      session.gameMode === 'deduction' && session.isCorrect && session.guessesCount === 1
    ).length,
  },
  {
    id: 'three-day-streak',
    title: 'กลับมาอีกแน่',
    description: 'เล่นติดต่อกันอย่างน้อย 3 วัน',
    difficulty: 'hard',
    icon: '📅',
    goal: 3,
    progress: longestPlayStreak,
  },
  {
    id: 'seven-day-streak',
    title: 'ไม่พลาดสักวัน',
    description: 'เล่นติดต่อกันอย่างน้อย 7 วัน',
    difficulty: 'hard',
    icon: '🔥',
    goal: 7,
    progress: longestPlayStreak,
  },
  {
    id: 'twenty-five-correct',
    title: 'คลังความรู้',
    description: 'ตอบถูกสะสมครบ 25 ด่านในโหมด Trivia',
    difficulty: 'hard',
    icon: '📚',
    goal: 25,
    progress: (sessions) => total(
      sessions.filter((session) => session.gameMode === 'trivia'),
      (session) => session.correctCount || 0
    ),
  },
  {
    id: 'three-perfect-trivia',
    title: 'ผู้รอบรู้',
    description: 'ทำคะแนนเต็มใน Trivia 3 ครั้ง',
    difficulty: 'hard',
    icon: '🎓',
    goal: 3,
    progress: (sessions) => sessions.filter((session) =>
      session.gameMode === 'trivia' && session.correctCount === 5
    ).length,
  },
  {
    id: 'five-deduction-wins',
    title: 'นักสืบผู้ช่ำชอง',
    description: 'ชนะโหมด Deduction ครบ 5 ครั้ง',
    difficulty: 'hard',
    icon: '🕵️',
    goal: 5,
    progress: (sessions) => sessions.filter((session) =>
      session.gameMode === 'deduction' && session.isCorrect
    ).length,
  },
  {
    id: 'fast-perfect-trivia',
    title: 'อัจฉริยะจับเวลา',
    description: 'ตอบถูกครบ 5 ด่านในโหมด Trivia ภายใน 120 วินาที',
    difficulty: 'hard',
    icon: '⏱️',
    goal: 1,
    progress: (sessions) => sessions.filter((session) =>
      session.gameMode === 'trivia' &&
      session.correctCount === 5 &&
      session.timeSpentSeconds <= 120
    ).length,
  },
  {
    id: 'trivia-score-5000',
    title: 'Trivia คะแนนทะลุห้า',
    description: 'ทำคะแนนรวมอย่างน้อย 5,000 แต้มในเกม Trivia หนึ่งครั้ง',
    difficulty: 'hard',
    icon: '🚀',
    goal: 5000,
    progress: (sessions) => Math.max(
      0,
      ...sessions
        .filter((session) => session.gameMode === 'trivia')
        .map((session) => session.score)
    ),
  },
  {
    id: 'ten-trivia-games',
    title: 'ปรมาจารย์ Trivia',
    description: 'เล่นเกม Trivia จบ 10 ครั้ง',
    difficulty: 'hard',
    icon: '🌠',
    goal: 10,
    progress: (sessions) => sessions.filter((session) => session.gameMode === 'trivia').length,
  },
];

export function getAchievements(sessions) {
  return ACHIEVEMENTS.map((achievement) => {
    const progress = Math.max(0, achievement.progress(sessions));
    return {
      ...achievement,
      progress: Math.min(progress, achievement.goal),
      unlocked: progress >= achievement.goal,
    };
  });
}

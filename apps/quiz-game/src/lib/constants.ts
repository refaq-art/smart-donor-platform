export const CATEGORY_SEED = [
  { key: 'geography', nameAr: 'جغرافيا', icon: '🌍', colorHex: '#22c55e' },
  { key: 'history', nameAr: 'تاريخ', icon: '📜', colorHex: '#b45309' },
  { key: 'science', nameAr: 'علوم', icon: '🔬', colorHex: '#0ea5e9' },
  { key: 'technology', nameAr: 'تقنية', icon: '💻', colorHex: '#6366f1' },
  { key: 'sports', nameAr: 'رياضة', icon: '⚽', colorHex: '#f59e0b' },
  { key: 'movies_series', nameAr: 'أفلام ومسلسلات', icon: '🎬', colorHex: '#e11d48' },
  { key: 'games', nameAr: 'ألعاب', icon: '🎮', colorHex: '#8b5cf6' },
  { key: 'cars', nameAr: 'سيارات', icon: '🚗', colorHex: '#ef4444' },
  { key: 'countries_capitals', nameAr: 'دول وعواصم', icon: '🗺️', colorHex: '#14b8a6' },
  { key: 'animals', nameAr: 'حيوانات', icon: '🦁', colorHex: '#ca8a04' },
  { key: 'celebrities', nameAr: 'شخصيات مشهورة', icon: '🌟', colorHex: '#d946ef' },
  { key: 'general_knowledge', nameAr: 'معلومات عامة', icon: '🧠', colorHex: '#7c5cff' },
  { key: 'puzzles', nameAr: 'ألغاز', icon: '🧩', colorHex: '#f43f5e' },
  { key: 'family', nameAr: 'أسئلة عائلية', icon: '👨‍👩‍👧‍👦', colorHex: '#fb923c' },
] as const;

export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'سهل',
  MEDIUM: 'متوسط',
  HARD: 'صعب',
  EXPERT: 'خبير',
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: '#22c55e',
  MEDIUM: '#38bdf8',
  HARD: '#f59e0b',
  EXPERT: '#f43f5e',
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: 'اختيار من متعدد',
  TRUE_FALSE: 'صح أو خطأ',
  WORD_GUESS: 'تخمين الكلمة',
  CHARACTER_GUESS: 'تخمين الشخصية',
  ORDERING: 'ترتيب العناصر',
  IMAGE_CHOICE: 'تحدي الصور',
};

export const GAME_MODE_LABELS: Record<string, { nameAr: string; descriptionAr: string; icon: string }> = {
  QUICK_PLAY: { nameAr: 'لعبة سريعة', descriptionAr: 'جولة خاطفة من الأسئلة المتنوعة', icon: '⚡' },
  CLASSIC: { nameAr: 'كلاسيكي', descriptionAr: 'اختر تصنيفك وصعوبتك واستمتع', icon: '🎯' },
  TIME_ATTACK: { nameAr: 'سباق الوقت', descriptionAr: 'أجب على أكبر عدد ممكن قبل نفاد الوقت', icon: '⏱️' },
  ELIMINATION: { nameAr: 'الإقصاء', descriptionAr: 'كل جولة يخرج الأضعف حتى يبقى الأقوى', icon: '🔥' },
  TEAM_BATTLE: { nameAr: 'تحدي الفرق', descriptionAr: 'فريقان يتنافسان على المجد', icon: '🛡️' },
  CHALLENGE: { nameAr: 'التحدي', descriptionAr: 'صعوبة تتكيف مع مستواك ونقاط أعلى', icon: '💪' },
  PARTY: { nameAr: 'أجواء العائلة', descriptionAr: 'وضع مرح للعائلة والأصدقاء', icon: '🎉' },
  ONLINE_ROOM: { nameAr: 'غرفة أونلاين', descriptionAr: 'أنشئ غرفة والعب مع من تريد', icon: '🌐' },
  LOCAL_MULTIPLAYER: { nameAr: 'محلي', descriptionAr: 'العبوا بالتناوب على نفس الجهاز', icon: '📱' },
};

export const AVATAR_EMOJIS = [
  '🦁', '🐯', '🐻', '🦊', '🐼', '🐨', '🐸', '🐵', '🦄', '🐲',
  '🦉', '🦅', '🐺', '🦈', '🐙', '🦋', '🐢', '🦖', '🐳', '🦩',
];

export const AVATAR_COLORS = [
  '#7c5cff', '#f43f5e', '#22c55e', '#38bdf8', '#ffb020', '#e879f9', '#14b8a6', '#f97316',
];

export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // بدون أحرف/أرقام متشابهة

export const SCORING = {
  MIN_SPEED_MULTIPLIER: 0.5,
  MAX_SPEED_MULTIPLIER: 1,
  STREAK_BONUS_PER_ANSWER: 40,
  STREAK_BONUS_CAP: 400,
  FIRST_CORRECT_BONUS: 200,
  WRONG_ANSWER_PENALTY: 200,
};

export const BASE_POINTS_BY_DIFFICULTY: Record<string, number> = {
  EASY: 500,
  MEDIUM: 1000,
  HARD: 1500,
  EXPERT: 2000,
};

export const TIME_LIMIT_BY_DIFFICULTY: Record<string, number> = {
  EASY: 25,
  MEDIUM: 20,
  HARD: 18,
  EXPERT: 15,
};

export const ACHIEVEMENT_DEFINITIONS = [
  {
    key: 'first_win',
    nameAr: 'أول فوز',
    descriptionAr: 'فز بأول لعبة لك',
    icon: '🥇',
    criteria: { type: 'games_won', value: 1 },
  },
  {
    key: 'streak_10',
    nameAr: 'سلسلة النار',
    descriptionAr: '10 إجابات صحيحة متتالية',
    icon: '🔥',
    criteria: { type: 'best_streak', value: 10 },
  },
  {
    key: 'flawless_win',
    nameAr: 'الفوز بلا خطأ',
    descriptionAr: 'أنهِ لعبة كاملة دون أي إجابة خاطئة',
    icon: '💎',
    criteria: { type: 'flawless_game', value: 1 },
  },
  {
    key: 'fastest_answer',
    nameAr: 'سرعة البرق',
    descriptionAr: 'أجب صحيحًا خلال أقل من ثانية',
    icon: '⚡',
    criteria: { type: 'answer_time_ms', value: 1000 },
  },
  {
    key: 'ten_wins',
    nameAr: 'المحترف',
    descriptionAr: 'الفوز بعشر مباريات',
    icon: '👑',
    criteria: { type: 'games_won', value: 10 },
  },
  {
    key: 'geography_master',
    nameAr: 'خبير الجغرافيا',
    descriptionAr: '50 إجابة صحيحة في تصنيف الجغرافيا',
    icon: '🌍',
    criteria: { type: 'category_correct', category: 'geography', value: 50 },
  },
  {
    key: 'history_master',
    nameAr: 'خبير التاريخ',
    descriptionAr: '50 إجابة صحيحة في تصنيف التاريخ',
    icon: '📜',
    criteria: { type: 'category_correct', category: 'history', value: 50 },
  },
  {
    key: 'puzzle_king',
    nameAr: 'ملك الألغاز',
    descriptionAr: '50 إجابة صحيحة في تصنيف الألغاز',
    icon: '🧩',
    criteria: { type: 'category_correct', category: 'puzzles', value: 50 },
  },
  {
    key: 'hundred_games',
    nameAr: 'المخضرم',
    descriptionAr: 'العب 100 مباراة',
    icon: '🎖️',
    criteria: { type: 'games_played', value: 100 },
  },
  {
    key: 'sharp_shooter',
    nameAr: 'القنّاص',
    descriptionAr: 'نسبة إجابات صحيحة 90%+ خلال 20 مباراة على الأقل',
    icon: '🎯',
    criteria: { type: 'accuracy', value: 90, minGames: 20 },
  },
] as const;

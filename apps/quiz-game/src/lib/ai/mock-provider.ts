import { BASE_POINTS_BY_DIFFICULTY, TIME_LIMIT_BY_DIFFICULTY } from '@/lib/constants';
import type { AIGenerateOutcome, AIGenerateParams, AIProvider, AIQuestionDraft } from './types';

interface BankItem {
  textAr: string;
  correct: string;
  wrong: string[];
  explanationAr: string;
}

const MC_BANK: Record<string, BankItem[]> = {
  geography: [
    { textAr: 'ما هو أطول نهر في العالم؟', correct: 'نهر النيل', wrong: ['نهر الأمازون', 'نهر اليانغتسي', 'نهر الميسيسيبي'], explanationAr: 'يبلغ طول نهر النيل نحو 6650 كم، وهو الأطول عالميًا حسب الرأي الشائع.' },
    { textAr: 'ما هي أكبر صحراء حارة في العالم؟', correct: 'الصحراء الكبرى', wrong: ['صحراء كالاهاري', 'صحراء غوبي', 'صحراء أتاكاما'], explanationAr: 'تغطي الصحراء الكبرى مساحة تفوق 9 ملايين كم² في شمال إفريقيا.' },
  ],
  history: [
    { textAr: 'في أي عام سقطت الدولة العباسية على يد المغول؟', correct: '1258م', wrong: ['1099م', '1453م', '1492م'], explanationAr: 'سقطت بغداد عاصمة الخلافة العباسية عام 1258م على يد هولاكو خان.' },
    { textAr: 'من هو القائد المسلم الذي فتح الأندلس؟', correct: 'طارق بن زياد', wrong: ['خالد بن الوليد', 'عمرو بن العاص', 'موسى بن نصير'], explanationAr: 'قاد طارق بن زياد الجيش الذي عبر المضيق الذي سُمي باسمه (جبل طارق) عام 711م.' },
  ],
  science: [
    { textAr: 'ما هو الغاز الذي يُنتجه النبات أثناء عملية البناء الضوئي؟', correct: 'الأكسجين', wrong: ['ثاني أكسيد الكربون', 'النيتروجين', 'الهيدروجين'], explanationAr: 'تمتص النباتات ثاني أكسيد الكربون وتُطلق الأكسجين أثناء البناء الضوئي.' },
    { textAr: 'ما هو أقرب كوكب إلى الشمس؟', correct: 'عطارد', wrong: ['الزهرة', 'الأرض', 'المريخ'], explanationAr: 'يبعد كوكب عطارد عن الشمس نحو 58 مليون كم فقط.' },
  ],
  technology: [
    { textAr: 'من هو مؤسس شركة مايكروسوفت؟', correct: 'بيل غيتس', wrong: ['ستيف جوبز', 'إيلون ماسك', 'مارك زوكربيرغ'], explanationAr: 'أسس بيل غيتس وبول ألن شركة مايكروسوفت عام 1975.' },
    { textAr: 'ماذا تعني اختصار "HTML"؟', correct: 'HyperText Markup Language', wrong: ['High Tech Modern Language', 'Home Tool Markup Language', 'HyperTransfer Machine Language'], explanationAr: 'HTML هي لغة توصيف تُستخدم لبناء صفحات الويب.' },
  ],
  sports: [
    { textAr: 'كم عدد لاعبي فريق كرة القدم على أرض الملعب؟', correct: '11', wrong: ['9', '10', '12'], explanationAr: 'يتكون كل فريق من 11 لاعبًا بما فيهم حارس المرمى.' },
    { textAr: 'في أي رياضة تُستخدم كلمة "Checkmate"؟', correct: 'الشطرنج', wrong: ['التنس', 'الجودو', 'المبارزة'], explanationAr: '"كش ملك" هي حركة إنهاء اللعبة في الشطرنج.' },
  ],
  movies_series: [
    { textAr: 'ما اسم السلسلة السينمائية التي تدور حول ساحر صغير في مدرسة هوغورتس؟', correct: 'هاري بوتر', wrong: ['ذا لورد أوف ذا رينغز', 'ناروتو', 'ذا هوبيت'], explanationAr: 'سلسلة هاري بوتر مأخوذة عن روايات الكاتبة ج. ك. رولينغ.' },
    { textAr: 'أي شركة إنتاج تمتلك عالم "المنتقمون" (Avengers)؟', correct: 'مارفل', wrong: ['دي سي', 'يونيفرسال', 'وارنر برذرز'], explanationAr: 'مارفل ستوديوز تنتج سلسلة أفلام عالم مارفل السينمائي.' },
  ],
  games: [
    { textAr: 'ما هي أول لعبة فيديو تجارية ناجحة في التاريخ؟', correct: 'Pong', wrong: ['Pac-Man', 'Tetris', 'Space Invaders'], explanationAr: 'أطلقتها شركة أتاري عام 1972 وكانت لعبة تنس طاولة رقمية بسيطة.' },
    { textAr: 'ما اسم الشخصية الشهيرة في ألعاب نينتندو التي يرتدي زيًا أحمر ويحارب الفطر؟', correct: 'ماريو', wrong: ['سونيك', 'لينك', 'كيربي'], explanationAr: 'ماريو من أشهر شخصيات ألعاب الفيديو على الإطلاق.' },
  ],
  cars: [
    { textAr: 'أي شركة تمتلك شعار "النجمة ذات الثلاث رؤوس"؟', correct: 'مرسيدس بنز', wrong: ['بي إم دبليو', 'أودي', 'فولكس فاغن'], explanationAr: 'يرمز الشعار لهيمنة مرسيدس على البر والبحر والجو.' },
    { textAr: 'ما هي الدولة الأصلية لشركة تويوتا؟', correct: 'اليابان', wrong: ['كوريا الجنوبية', 'ألمانيا', 'الصين'], explanationAr: 'تأسست تويوتا في اليابان عام 1937.' },
  ],
  countries_capitals: [
    { textAr: 'ما هي عاصمة اليابان؟', correct: 'طوكيو', wrong: ['أوساكا', 'كيوتو', 'يوكوهاما'], explanationAr: 'طوكيو هي العاصمة وأكبر مدن اليابان.' },
    { textAr: 'ما هي عاصمة كندا؟', correct: 'أوتاوا', wrong: ['تورونتو', 'مونتريال', 'فانكوفر'], explanationAr: 'رغم أن تورونتو أكبر مدنها، فإن أوتاوا هي العاصمة الرسمية.' },
  ],
  animals: [
    { textAr: 'ما هو أسرع حيوان بري في العالم؟', correct: 'الفهد', wrong: ['الأسد', 'الحصان', 'النمر'], explanationAr: 'يستطيع الفهد الجري بسرعة تصل إلى 110 كم/سا.' },
    { textAr: 'ما هو أكبر حيوان ثديي في العالم؟', correct: 'الحوت الأزرق', wrong: ['الفيل الإفريقي', 'الزرافة', 'وحيد القرن'], explanationAr: 'يمكن أن يصل طول الحوت الأزرق إلى 30 مترًا.' },
  ],
  celebrities: [
    { textAr: 'من هو صاحب لقب "ملك البوب"؟', correct: 'مايكل جاكسون', wrong: ['إلفيس بريسلي', 'برنس', 'جاستن بيبر'], explanationAr: 'لقب مايكل جاكسون بملك البوب لتأثيره الهائل في الموسيقى.' },
    { textAr: 'من هو العالِم صاحب نظرية النسبية؟', correct: 'ألبرت أينشتاين', wrong: ['إسحاق نيوتن', 'نيكولا تسلا', 'ستيفن هوكينغ'], explanationAr: 'نشر أينشتاين نظرية النسبية الخاصة عام 1905.' },
  ],
  general_knowledge: [
    { textAr: 'كم عدد أيام السنة الكبيسة؟', correct: '366 يومًا', wrong: ['365 يومًا', '364 يومًا', '367 يومًا'], explanationAr: 'تحدث السنة الكبيسة كل 4 سنوات تقريبًا بإضافة يوم لشهر فبراير.' },
    { textAr: 'ما هي اللغة الأكثر تحدثًا في العالم كلغة أم؟', correct: 'الماندرين الصينية', wrong: ['الإنجليزية', 'الإسبانية', 'العربية'], explanationAr: 'يتحدث الماندرين أكثر من مليار شخص كلغة أم.' },
  ],
  puzzles: [
    { textAr: 'إذا كان اليوم الأربعاء، فما اليوم بعد 100 يوم؟', correct: 'الجمعة', wrong: ['الخميس', 'السبت', 'الأحد'], explanationAr: '100 ÷ 7 = 14 أسبوعًا و2 يوم، فيصبح اليوم بعد الأربعاء بيومين هو الجمعة.' },
    { textAr: 'ما هو الرقم الذي إذا ضربته في نفسه يساوي 81؟', correct: '9', wrong: ['7', '8', '11'], explanationAr: '9 × 9 = 81.' },
  ],
  family: [
    { textAr: 'كم عدد أيام الأسبوع؟', correct: '7', wrong: ['5', '6', '8'], explanationAr: 'الأسبوع يتكون من سبعة أيام.' },
    { textAr: 'ما هو أول وجبة نتناولها عادة في اليوم؟', correct: 'الفطور', wrong: ['الغداء', 'العشاء', 'السحور'], explanationAr: 'الفطور هو أول وجبة رئيسية في اليوم.' },
  ],
};

const TRUE_FALSE_BANK: Record<string, BankItem[]> = {
  geography: [{ textAr: 'قارة أفريقيا هي أكبر قارات العالم من حيث المساحة.', correct: 'خطأ', wrong: ['صح'], explanationAr: 'آسيا هي الأكبر مساحة، وأفريقيا في المرتبة الثانية.' }],
  history: [{ textAr: 'بُنيت أهرامات الجيزة في عهد الدولة الحديثة المصرية.', correct: 'خطأ', wrong: ['صح'], explanationAr: 'بُنيت في عصر الدولة القديمة، قبل الدولة الحديثة بآلاف السنين.' }],
  science: [{ textAr: 'الماء يغلي عند 100 درجة مئوية عند مستوى سطح البحر.', correct: 'صح', wrong: ['خطأ'], explanationAr: 'هذه هي درجة الغليان القياسية عند الضغط الجوي الطبيعي.' }],
  technology: [{ textAr: 'تأسست شركة آبل عام 1976.', correct: 'صح', wrong: ['خطأ'], explanationAr: 'أسسها ستيف جوبز وستيف وزنياك وروني واين عام 1976.' }],
  sports: [{ textAr: 'تقام بطولة كأس العالم لكرة القدم كل عامين.', correct: 'خطأ', wrong: ['صح'], explanationAr: 'تقام كل 4 سنوات.' }],
  movies_series: [{ textAr: 'فيلم "تيتانيك" حصل على جائزة الأوسكار لأفضل فيلم.', correct: 'صح', wrong: ['خطأ'], explanationAr: 'فاز بالفعل عام 1998.' }],
  games: [{ textAr: 'لعبة الشطرنج تُلعب على رقعة من 100 مربع.', correct: 'خطأ', wrong: ['صح'], explanationAr: 'رقعة الشطرنج تتكون من 64 مربعًا.' }],
  cars: [{ textAr: 'أول سيارة في التاريخ اخترعها كارل بنز.', correct: 'صح', wrong: ['خطأ'], explanationAr: 'اخترع كارل بنز أول سيارة عملية عام 1885.' }],
  countries_capitals: [{ textAr: 'عاصمة أستراليا هي سيدني.', correct: 'خطأ', wrong: ['صح'], explanationAr: 'العاصمة الفعلية هي كانبيرا وليست سيدني.' }],
  animals: [{ textAr: 'النعامة قادرة على الطيران.', correct: 'خطأ', wrong: ['صح'], explanationAr: 'النعامة طائر لا يستطيع الطيران لكنه سريع الجري جدًا.' }],
  celebrities: [{ textAr: 'الملكة إليزابيث الثانية حكمت المملكة المتحدة لأكثر من 70 عامًا.', correct: 'صح', wrong: ['خطأ'], explanationAr: 'حكمت من 1952 حتى 2022.' }],
  general_knowledge: [{ textAr: 'يوجد سبع قارات في العالم.', correct: 'صح', wrong: ['خطأ'], explanationAr: 'آسيا، أفريقيا، أوروبا، أمريكا الشمالية، أمريكا الجنوبية، أستراليا، وأنتاركتيكا.' }],
  puzzles: [{ textAr: 'مجموع زوايا المثلث يساوي 180 درجة.', correct: 'صح', wrong: ['خطأ'], explanationAr: 'قاعدة رياضية أساسية في الهندسة الإقليدية.' }],
  family: [{ textAr: 'شهر فبراير هو أقصر أشهر السنة.', correct: 'صح', wrong: ['خطأ'], explanationAr: 'يحتوي على 28 أو 29 يومًا فقط.' }],
};

const CHARACTER_BANK: BankItem[] = [
  { textAr: 'عالم ألماني طوّر نظرية النسبية وحصل على جائزة نوبل في الفيزياء. من هو؟', correct: 'ألبرت أينشتاين', wrong: [], explanationAr: '' },
  { textAr: 'لاعب كرة قدم برتغالي يُلقّب بـ"CR7" وسجل مئات الأهداف الدولية. من هو؟', correct: 'كريستيانو رونالدو', wrong: [], explanationAr: '' },
  { textAr: 'قائد مسلم فتح القدس وواجه الحملة الصليبية الثالثة. من هو؟', correct: 'صلاح الدين الأيوبي', wrong: [], explanationAr: '' },
];

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function bankItemToDraft(item: BankItem, difficulty: AIGenerateParams['difficulty'], type: AIQuestionDraft['type']): AIQuestionDraft {
  const answers =
    type === 'WORD_GUESS' || type === 'CHARACTER_GUESS'
      ? [{ textAr: item.correct, isCorrect: true, orderIndex: null }]
      : shuffle([
          { textAr: item.correct, isCorrect: true, orderIndex: null },
          ...item.wrong.map((w) => ({ textAr: w, isCorrect: false, orderIndex: null })),
        ]);

  return {
    textAr: item.textAr,
    type,
    difficulty,
    explanationAr: item.explanationAr,
    timeLimitSeconds: TIME_LIMIT_BY_DIFFICULTY[difficulty],
    basePoints: BASE_POINTS_BY_DIFFICULTY[difficulty],
    answers,
  };
}

function generateOrderingDraft(difficulty: AIGenerateParams['difficulty']): AIQuestionDraft {
  const start = Math.floor(Math.random() * 50) + 1;
  const numbers = shuffle([start, start + 3, start + 7, start + 12]);
  return {
    textAr: 'رتّب الأرقام التالية من الأصغر إلى الأكبر',
    type: 'ORDERING',
    difficulty,
    explanationAr: 'الترتيب التصاعدي الصحيح للأرقام.',
    timeLimitSeconds: TIME_LIMIT_BY_DIFFICULTY[difficulty],
    basePoints: BASE_POINTS_BY_DIFFICULTY[difficulty],
    answers: [...numbers]
      .sort((a, b) => a - b)
      .map((n, i) => ({ textAr: String(n), isCorrect: true, orderIndex: i })),
  };
}

function generateWordMathDraft(difficulty: AIGenerateParams['difficulty']): AIQuestionDraft {
  const a = Math.floor(Math.random() * 40) + 10;
  const b = Math.floor(Math.random() * 40) + 10;
  return {
    textAr: `اكتب ناتج جمع ${a} و ${b} (بالأرقام)`,
    type: 'WORD_GUESS',
    difficulty,
    explanationAr: `${a} + ${b} = ${a + b}`,
    timeLimitSeconds: TIME_LIMIT_BY_DIFFICULTY[difficulty],
    basePoints: BASE_POINTS_BY_DIFFICULTY[difficulty],
    answers: [{ textAr: String(a + b), isCorrect: true, orderIndex: null }],
  };
}

export class MockAIProvider implements AIProvider {
  async generate(params: AIGenerateParams): Promise<AIGenerateOutcome> {
    if (params.type === 'IMAGE_CHOICE') {
      return {
        drafts: [],
        note: 'المزوّد التجريبي (Mock) لا يستطيع توليد أسئلة تعتمد على الصور. أضفها يدويًا أو فعّل مزود ذكاء اصطناعي حقيقي يدعم الصور عبر متغيرات البيئة AI_PROVIDER_*.',
      };
    }

    const drafts: AIQuestionDraft[] = [];

    for (let i = 0; i < params.count; i++) {
      if (params.type === 'MULTIPLE_CHOICE') {
        const bank = MC_BANK[params.categoryKey] ?? MC_BANK.general_knowledge;
        drafts.push(bankItemToDraft(bank[i % bank.length], params.difficulty, 'MULTIPLE_CHOICE'));
      } else if (params.type === 'TRUE_FALSE') {
        const bank = TRUE_FALSE_BANK[params.categoryKey] ?? TRUE_FALSE_BANK.general_knowledge;
        drafts.push(bankItemToDraft(bank[i % bank.length], params.difficulty, 'TRUE_FALSE'));
      } else if (params.type === 'CHARACTER_GUESS') {
        drafts.push(bankItemToDraft(CHARACTER_BANK[i % CHARACTER_BANK.length], params.difficulty, 'CHARACTER_GUESS'));
      } else if (params.type === 'ORDERING') {
        drafts.push(generateOrderingDraft(params.difficulty));
      } else if (params.type === 'WORD_GUESS') {
        drafts.push(generateWordMathDraft(params.difficulty));
      }
    }

    return {
      drafts,
      note: 'تم التوليد عبر المزوّد التجريبي (Mock) — راجع الأسئلة قبل النشر. لتوليد أسئلة أدق وأكثر تنوعًا، فعّل مزود ذكاء اصطناعي حقيقي متوافق مع OpenAI عبر متغيرات البيئة AI_PROVIDER_*.',
    };
  }
}

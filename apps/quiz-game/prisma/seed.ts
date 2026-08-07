import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CATEGORY_SEED, ACHIEVEMENT_DEFINITIONS, BASE_POINTS_BY_DIFFICULTY, TIME_LIMIT_BY_DIFFICULTY } from '../src/lib/constants';

const prisma = new PrismaClient();

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'WORD_GUESS' | 'CHARACTER_GUESS' | 'ORDERING' | 'IMAGE_CHOICE';

interface SeedAnswer {
  textAr: string;
  isCorrect: boolean;
  orderIndex?: number;
  imageUrl?: string;
}

interface SeedQuestion {
  categoryKey: string;
  type: QuestionType;
  difficulty: Difficulty;
  textAr: string;
  imageUrl?: string;
  explanationAr?: string;
  answers: SeedAnswer[];
}

function mc(categoryKey: string, difficulty: Difficulty, textAr: string, correct: string, wrong: string[], explanationAr = ''): SeedQuestion {
  return {
    categoryKey,
    type: 'MULTIPLE_CHOICE',
    difficulty,
    textAr,
    explanationAr,
    answers: [{ textAr: correct, isCorrect: true }, ...wrong.map((w) => ({ textAr: w, isCorrect: false }))],
  };
}

function tf(categoryKey: string, difficulty: Difficulty, textAr: string, isTrue: boolean, explanationAr = ''): SeedQuestion {
  return {
    categoryKey,
    type: 'TRUE_FALSE',
    difficulty,
    textAr,
    explanationAr,
    answers: [
      { textAr: 'صح', isCorrect: isTrue },
      { textAr: 'خطأ', isCorrect: !isTrue },
    ],
  };
}

function wg(categoryKey: string, difficulty: Difficulty, textAr: string, accepted: string[], explanationAr = ''): SeedQuestion {
  return {
    categoryKey,
    type: 'WORD_GUESS',
    difficulty,
    textAr,
    explanationAr,
    answers: accepted.map((a) => ({ textAr: a, isCorrect: true })),
  };
}

function cg(categoryKey: string, difficulty: Difficulty, textAr: string, accepted: string[], explanationAr = ''): SeedQuestion {
  return {
    categoryKey,
    type: 'CHARACTER_GUESS',
    difficulty,
    textAr,
    explanationAr,
    answers: accepted.map((a) => ({ textAr: a, isCorrect: true })),
  };
}

function ordering(categoryKey: string, difficulty: Difficulty, textAr: string, itemsInOrder: string[], explanationAr = ''): SeedQuestion {
  return {
    categoryKey,
    type: 'ORDERING',
    difficulty,
    textAr,
    explanationAr,
    answers: itemsInOrder.map((textAr, orderIndex) => ({ textAr, isCorrect: true, orderIndex })),
  };
}

function imageChoice(
  categoryKey: string,
  difficulty: Difficulty,
  textAr: string,
  options: { textAr: string; imageUrl: string; isCorrect: boolean }[],
  explanationAr = ''
): SeedQuestion {
  return { categoryKey, type: 'IMAGE_CHOICE', difficulty, textAr, explanationAr, answers: options };
}

const QUESTIONS: SeedQuestion[] = [
  // ================= جغرافيا =================
  mc('geography', 'EASY', 'كم عدد قارات العالم؟', '7', ['5', '6', '8']),
  mc('geography', 'EASY', 'ما هو أكبر محيط في العالم؟', 'المحيط الهادئ', ['المحيط الأطلسي', 'المحيط الهندي', 'المحيط المتجمد الشمالي']),
  mc('geography', 'MEDIUM', 'ما هي أكبر دولة في العالم من حيث المساحة؟', 'روسيا', ['كندا', 'الصين', 'الولايات المتحدة']),
  mc('geography', 'MEDIUM', 'ما هو أطول نهر في العالم؟', 'نهر النيل', ['نهر الأمازون', 'نهر اليانغتسي', 'نهر الدانوب'], 'يبلغ طول النيل نحو 6650 كم.'),
  mc('geography', 'HARD', 'ما هي أعلى قمة جبلية في العالم؟', 'إفرست', ['كيليمنجارو', 'K2', 'إلبروس']),
  mc('geography', 'EXPERT', 'ما هي أعمق نقطة معروفة في محيطات الأرض؟', 'خندق ماريانا', ['خندق بورتوريكو', 'خندق تونجا', 'خندق اليابان']),
  tf('geography', 'EASY', 'الصحراء الكبرى تقع في قارة أفريقيا.', true),
  tf('geography', 'MEDIUM', 'البحر الميت هو أعلى نقطة على سطح الأرض.', false, 'البحر الميت هو أخفض نقطة على اليابسة، وليس أعلاها.'),
  wg('geography', 'MEDIUM', 'ما اسم أكبر جزيرة في العالم؟', ['جرينلاند'], 'جرينلاند أكبر جزيرة في العالم وتتبع للدنمارك.'),
  ordering(
    'geography',
    'HARD',
    'رتّب هذه القارات تنازليًا حسب المساحة (من الأكبر إلى الأصغر)',
    ['آسيا', 'أفريقيا', 'أمريكا الشمالية', 'أوروبا'],
    'آسيا هي الأكبر، تليها أفريقيا، ثم أمريكا الشمالية، ثم أوروبا.'
  ),
  mc('geography', 'EASY', 'في أي قارة تقع مصر؟', 'أفريقيا', ['آسيا', 'أوروبا', 'أستراليا']),

  // ================= تاريخ =================
  mc('history', 'MEDIUM', 'من هو القائد المسلم الذي فتح الأندلس عام 711م؟', 'طارق بن زياد', ['خالد بن الوليد', 'عمرو بن العاص', 'موسى بن نصير']),
  mc('history', 'HARD', 'في أي عام سقطت بغداد على يد المغول؟', '1258م', ['1099م', '1453م', '1492م'], 'سقطت الخلافة العباسية عام 1258م على يد هولاكو خان.'),
  mc('history', 'EASY', 'من هو أول الخلفاء الراشدين؟', 'أبو بكر الصديق', ['عمر بن الخطاب', 'عثمان بن عفان', 'علي بن أبي طالب']),
  mc('history', 'MEDIUM', 'في أي عام انتهت الحرب العالمية الثانية؟', '1945', ['1918', '1939', '1950']),
  mc('history', 'EXPERT', 'من هو مؤسس الدولة الأموية؟', 'معاوية بن أبي سفيان', ['عبد الملك بن مروان', 'الوليد بن عبد الملك', 'يزيد بن معاوية']),
  tf('history', 'EASY', 'بُنيت أهرامات الجيزة في العصر الفرعوني القديم.', true),
  tf('history', 'MEDIUM', 'الحرب العالمية الأولى اندلعت عام 1914.', true),
  cg('history', 'HARD', 'قائد مسلم استرد بيت المقدس من الصليبيين عام 1187م. من هو؟', ['صلاح الدين الأيوبي', 'صلاح الدين'], 'انتصر في معركة حطين قبل تحرير القدس.'),
  wg('history', 'MEDIUM', 'ما اسم السفينة البريطانية الشهيرة التي غرقت عام 1912؟', ['تيتانيك'], 'اصطدمت بجبل جليدي في المحيط الأطلسي.'),
  ordering(
    'history',
    'HARD',
    'رتّب هذه الأحداث زمنيًا من الأقدم إلى الأحدث',
    ['بناء أهرامات الجيزة', 'فتح الأندلس', 'سقوط القسطنطينية', 'الحرب العالمية الثانية'],
    'الأهرامات: نحو 2560 ق.م، فتح الأندلس: 711م، سقوط القسطنطينية: 1453م، الحرب العالمية الثانية: 1939-1945.'
  ),
  mc('history', 'EASY', 'من هو مكتشف قارة أمريكا (حسب الرواية الأوروبية الشائعة)؟', 'كريستوفر كولومبوس', ['فاسكو دا غاما', 'ماجلان', 'كابوت']),

  // ================= علوم =================
  mc('science', 'EASY', 'ما هو الغاز الذي يحتاجه الإنسان للتنفس؟', 'الأكسجين', ['ثاني أكسيد الكربون', 'النيتروجين', 'الهيليوم']),
  mc('science', 'EASY', 'ما هو أقرب كوكب إلى الشمس؟', 'عطارد', ['الزهرة', 'الأرض', 'المريخ']),
  mc('science', 'MEDIUM', 'ما هي درجة غليان الماء عند مستوى سطح البحر (مئوية)؟', '100', ['90', '80', '120']),
  mc('science', 'MEDIUM', 'ما هو العضو المسؤول عن ضخ الدم في جسم الإنسان؟', 'القلب', ['الرئة', 'الكبد', 'الكلى']),
  mc('science', 'HARD', 'من هو العالم صاحب نظرية النسبية؟', 'ألبرت أينشتاين', ['إسحاق نيوتن', 'نيكولا تسلا', 'ماكس بلانك']),
  mc('science', 'EXPERT', 'ما هو الرمز الكيميائي لعنصر الذهب؟', 'Au', ['Ag', 'Fe', 'Gd']),
  tf('science', 'EASY', 'الشمس هي نجم.', true),
  tf('science', 'MEDIUM', 'الإنسان لديه 206 عظمة في جسمه البالغ.', true),
  wg('science', 'HARD', 'ما اسم العملية التي تحوّل بها النباتات ضوء الشمس إلى طاقة؟', ['البناء الضوئي', 'التمثيل الضوئي'], 'تمتص النباتات ثاني أكسيد الكربون وتُطلق الأكسجين.'),
  cg('science', 'MEDIUM', 'عالم فيزياء بريطاني اشتهر بكرسيه المتحرك وأبحاثه عن الثقوب السوداء. من هو؟', ['ستيفن هوكينغ'], ''),
  ordering('science', 'MEDIUM', 'رتّب كواكب المجموعة الشمسية التالية حسب قربها من الشمس', ['عطارد', 'الزهرة', 'الأرض', 'المريخ'], 'الترتيب الفعلي من الشمس: عطارد، الزهرة، الأرض، المريخ.'),

  // ================= تقنية =================
  mc('technology', 'EASY', 'من هو مؤسس شركة مايكروسوفت؟', 'بيل غيتس', ['ستيف جوبز', 'إيلون ماسك', 'مارك زوكربيرغ']),
  mc('technology', 'EASY', 'ماذا تعني اختصار "WWW"؟', 'World Wide Web', ['World Wide Wire', 'Web Wide World', 'Wide World Web']),
  mc('technology', 'MEDIUM', 'أي شركة تُصنّع هواتف آيفون؟', 'آبل', ['سامسونج', 'جوجل', 'هواوي']),
  mc('technology', 'MEDIUM', 'ما اسم أول شبكة تواصل اجتماعي انتشرت عالميًا بشكل واسع؟', 'فيسبوك', ['تويتر', 'إنستغرام', 'ماي سبيس']),
  mc('technology', 'HARD', 'من مؤسسا شركة جوجل؟', 'لاري بيج وسيرجي برين', ['بيل غيتس وبول ألن', 'ستيف جوبز وستيف وزنياك', 'جيف بيزوس ومارك زوكربيرغ']),
  mc('technology', 'EXPERT', 'ما هي لغة البرمجة التي طوّرها جيمس غوسلينغ عام 1995؟', 'جافا', ['بايثون', 'روبي', 'سي شارب']),
  tf('technology', 'EASY', 'الذكاء الاصطناعي هو فرع من علوم الحاسوب.', true),
  tf('technology', 'MEDIUM', 'تأسست شركة آبل عام 1976.', true),
  wg('technology', 'EASY', 'ما الاسم المختصر لجهاز "الحاسوب الشخصي"؟', ['بي سي', 'PC', 'حاسوب'], ''),
  cg('technology', 'HARD', 'رائد أعمال أسس شركات تسلا وسبيس إكس. من هو؟', ['إيلون ماسك'], ''),

  // ================= رياضة =================
  mc('sports', 'EASY', 'كم عدد لاعبي فريق كرة القدم داخل الملعب؟', '11', ['9', '10', '12']),
  mc('sports', 'EASY', 'كل كم سنة تقام دورة الألعاب الأولمبية الصيفية؟', '4 سنوات', ['سنتان', '3 سنوات', '5 سنوات']),
  mc('sports', 'MEDIUM', 'في أي رياضة تُستخدم كلمة "Checkmate"؟', 'الشطرنج', ['التنس', 'الجودو', 'المبارزة']),
  mc('sports', 'MEDIUM', 'ما هي الدولة التي فازت بكأس العالم لكرة القدم أكثر من غيرها؟', 'البرازيل', ['ألمانيا', 'إيطاليا', 'الأرجنتين']),
  mc('sports', 'HARD', 'في أي مدينة أقيمت أول دورة ألعاب أولمبية حديثة عام 1896؟', 'أثينا', ['باريس', 'لندن', 'روما']),
  mc('sports', 'EXPERT', 'كم عدد اللاعبين في فريق كرة السلة داخل الملعب لكل فريق؟', '5', ['6', '7', '4']),
  tf('sports', 'EASY', 'كرة القدم تُلعب بشوطين مدة كل منهما 45 دقيقة.', true),
  tf('sports', 'MEDIUM', 'رياضة الغولف تُلعب بفريقين من 5 لاعبين.', false, 'الغولف غالبًا رياضة فردية أو بين لاعبين اثنين.'),
  cg('sports', 'EASY', 'لاعب كرة قدم برتغالي يُلقّب بـ"CR7". من هو؟', ['كريستيانو رونالدو', 'رونالدو'], ''),
  cg('sports', 'MEDIUM', 'لاعب كرة قدم أرجنتيني حائز على الكرة الذهبية عدة مرات ولعب لنادي برشلونة. من هو؟', ['ليونيل ميسي', 'ميسي'], ''),
  ordering('sports', 'HARD', 'رتّب هذه الميداليات الأولمبية من الأعلى إلى الأدنى قيمةً', ['ذهبية', 'فضية', 'برونزية'], 'الترتيب التقليدي للميداليات الأولمبية.'),

  // ================= أفلام ومسلسلات =================
  mc('movies_series', 'EASY', 'ما اسم السلسلة السينمائية عن ساحر صغير في مدرسة هوغورتس؟', 'هاري بوتر', ['نارنيا', 'ذا هوبيت', 'برسي جاكسون']),
  mc('movies_series', 'MEDIUM', 'أي استوديو ينتج أفلام "المنتقمون" (Avengers)؟', 'مارفل', ['دي سي', 'يونيفرسال', 'وارنر برذرز']),
  mc('movies_series', 'MEDIUM', 'من هو مخرج فيلم "تيتانيك" الشهير؟', 'جيمس كاميرون', ['ستيفن سبيلبرغ', 'كريستوفر نولان', 'مارتن سكورسيزي']),
  mc('movies_series', 'HARD', 'ما اسم أول فيلم رسوم متحركة طويل أنتجته ديزني؟', 'سنووايت والأقزام السبعة', ['سندريلا', 'بينوكيو', 'الأسد الملك']),
  mc('movies_series', 'EXPERT', 'ما هو الفيلم الحائز على أول جائزة أوسكار لأفضل فيلم في التاريخ؟', 'Wings', ['The Jazz Singer', 'Metropolis', 'Sunrise']),
  tf('movies_series', 'EASY', 'فيلم "أسد الملك" (The Lion King) من إنتاج ديزني.', true),
  tf('movies_series', 'MEDIUM', 'سلسلة "ذا لورد أوف ذا رينغز" مبنية على روايات ج.ك. رولينغ.', false, 'هي مبنية على روايات جي. آر. آر. تولكين وليس رولينغ.'),
  cg('movies_series', 'MEDIUM', 'ممثل أمريكي اشتهر بدور "آيرون مان" في أفلام مارفل. من هو؟', ['روبرت داوني جونيور', 'روبرت داوني'], ''),
  wg('movies_series', 'HARD', 'ما اسم المدينة الخيالية التي يحمي فيها باتمان سكانها؟', ['غوثام', 'مدينة غوثام'], ''),

  // ================= ألعاب =================
  mc('games', 'EASY', 'ما اسم الشخصية الشهيرة ذات القبعة الحمراء في ألعاب نينتندو؟', 'ماريو', ['سونيك', 'لينك', 'كيربي']),
  mc('games', 'MEDIUM', 'ما هي أول لعبة فيديو تجارية ناجحة في التاريخ؟', 'Pong', ['Pac-Man', 'Tetris', 'Space Invaders']),
  mc('games', 'MEDIUM', 'ما اسم اللعبة التي يبني فيها اللاعبون عوالم من المكعبات؟', 'ماينكرافت', ['فورتنايت', 'روبلوكس', 'تيراريا']),
  mc('games', 'HARD', 'أي شركة طوّرت لعبة "بوكيمون"؟', 'Game Freak', ['نينتندو', 'سيغا', 'كابكوم'], 'نينتندو تنشرها وGame Freak هي المطوّر الأساسي.'),
  mc('games', 'EXPERT', 'في أي عام صدرت أول لعبة "سوبر ماريو"؟', '1985', ['1980', '1990', '1995']),
  tf('games', 'EASY', 'لعبة الشطرنج تُلعب على رقعة من 64 مربعًا.', true),
  tf('games', 'MEDIUM', 'لعبة "فيفا" هي لعبة محاكاة لكرة السلة.', false, 'فيفا هي سلسلة ألعاب محاكاة كرة القدم.'),
  cg('games', 'MEDIUM', 'قنفذ أزرق سريع هو بطل سلسلة ألعاب من إنتاج سيغا. من هو؟', ['سونيك'], ''),
  ordering('games', 'HARD', 'رتّب أجيال أجهزة بلايستيشن التالية من الأقدم إلى الأحدث', ['PlayStation 1', 'PlayStation 2', 'PlayStation 3', 'PlayStation 4'], ''),

  // ================= سيارات =================
  mc('cars', 'EASY', 'ما هي الدولة الأصلية لشركة تويوتا؟', 'اليابان', ['كوريا الجنوبية', 'ألمانيا', 'الصين']),
  mc('cars', 'MEDIUM', 'أي شركة سيارات تمتلك شعار "النجمة ذات الثلاث رؤوس"؟', 'مرسيدس بنز', ['بي إم دبليو', 'أودي', 'فولكس فاغن']),
  mc('cars', 'MEDIUM', 'من هو مخترع أول سيارة عملية تعمل بمحرك احتراق داخلي؟', 'كارل بنز', ['هنري فورد', 'رودولف ديزل', 'غوتليب دايملر']),
  mc('cars', 'HARD', 'ما هو الحرف الذي يرمز لأسرع فئة سباقات السيارات (فورمولا)؟', 'فورمولا 1', ['فورمولا 2', 'فورمولا إي', 'إندي كار']),
  mc('cars', 'EXPERT', 'في أي عام تأسست شركة فولكس فاغن الألمانية؟', '1937', ['1920', '1950', '1965']),
  tf('cars', 'EASY', 'السيارات الكهربائية لا تحتاج إلى وقود بنزين.', true),
  tf('cars', 'MEDIUM', 'شركة فيراري إيطالية الأصل.', true),
  cg('cars', 'MEDIUM', 'رائد أعمال أسس شركة فورد للسيارات وطوّر خط الإنتاج المتحرك. من هو؟', ['هنري فورد'], ''),

  // ================= دول وعواصم =================
  mc('countries_capitals', 'EASY', 'ما هي عاصمة السعودية؟', 'الرياض', ['جدة', 'مكة المكرمة', 'الدمام']),
  mc('countries_capitals', 'EASY', 'ما هي عاصمة مصر؟', 'القاهرة', ['الإسكندرية', 'الجيزة', 'الأقصر']),
  mc('countries_capitals', 'EASY', 'ما هي عاصمة فرنسا؟', 'باريس', ['ليون', 'مرسيليا', 'نيس']),
  mc('countries_capitals', 'MEDIUM', 'ما هي عاصمة اليابان؟', 'طوكيو', ['أوساكا', 'كيوتو', 'يوكوهاما']),
  mc('countries_capitals', 'MEDIUM', 'ما هي عاصمة كندا؟', 'أوتاوا', ['تورونتو', 'مونتريال', 'فانكوفر']),
  mc('countries_capitals', 'HARD', 'ما هي عاصمة أستراليا؟', 'كانبيرا', ['سيدني', 'ملبورن', 'بيرث']),
  mc('countries_capitals', 'EXPERT', 'ما هي عاصمة كازاخستان؟', 'أستانا', ['ألماتي', 'بيشكيك', 'طشقند']),
  tf('countries_capitals', 'EASY', 'عاصمة إيطاليا هي روما.', true),
  tf('countries_capitals', 'MEDIUM', 'عاصمة البرازيل هي ريو دي جانيرو.', false, 'العاصمة الفعلية هي برازيليا.'),
  wg('countries_capitals', 'MEDIUM', 'ما هي عاصمة ألمانيا؟', ['برلين'], ''),
  ordering('countries_capitals', 'HARD', 'رتّب هذه الدول حسب عدد سكانها تنازليًا (تقريبًا)', ['الصين', 'الهند', 'الولايات المتحدة', 'إندونيسيا'], 'الترتيب التقريبي حسب عدد السكان.'),

  // ================= حيوانات =================
  mc('animals', 'EASY', 'ما هو أسرع حيوان بري في العالم؟', 'الفهد', ['الأسد', 'الحصان', 'النمر']),
  mc('animals', 'EASY', 'ما هو أكبر حيوان ثديي في العالم؟', 'الحوت الأزرق', ['الفيل الإفريقي', 'الزرافة', 'وحيد القرن']),
  mc('animals', 'MEDIUM', 'كم عدد قلوب الأخطبوط؟', '3', ['1', '2', '4']),
  mc('animals', 'MEDIUM', 'ما هو الحيوان الذي يُعرف بـ"سفينة الصحراء"؟', 'الجمل', ['الحصان', 'الحمار', 'الثعلب']),
  mc('animals', 'HARD', 'ما هو أطول حيوان في العالم؟', 'الزرافة', ['الفيل', 'الحوت الأزرق', 'النعامة']),
  mc('animals', 'EXPERT', 'ما هو الاسم العلمي الشائع لصغير الكنغر؟', 'جوي (Joey)', ['كِد', 'كَب', 'بَب']),
  tf('animals', 'EASY', 'النعامة طائر لا يستطيع الطيران.', true),
  tf('animals', 'MEDIUM', 'الحوت من الأسماك.', false, 'الحوت من الثدييات وليس من الأسماك.'),
  wg('animals', 'EASY', 'ما اسم الحيوان الذي يُلقّب بـ"ملك الغابة"؟', ['الأسد'], ''),
  cg('animals', 'MEDIUM', 'حيوان أليف شائع يُصنَّف من الفصيلة السنورية ويُصدر صوت "مواء". ما هو؟', ['القطة', 'قطة'], ''),

  // ================= شخصيات مشهورة =================
  mc('celebrities', 'EASY', 'من هو صاحب لقب "ملك البوب"؟', 'مايكل جاكسون', ['إلفيس بريسلي', 'برنس', 'جاستن بيبر']),
  mc('celebrities', 'MEDIUM', 'من هي أول امرأة تفوز بجائزة نوبل؟', 'ماري كوري', ['هيلين كيلر', 'روزا باركس', 'إيرين كوري']),
  mc('celebrities', 'MEDIUM', 'من هو مؤسس شركة أمازون؟', 'جيف بيزوس', ['إيلون ماسك', 'بيل غيتس', 'وارن بافيت']),
  mc('celebrities', 'HARD', 'من هو الرسام الإيطالي الذي رسم لوحة "الموناليزا"؟', 'ليوناردو دافنشي', ['مايكل أنجلو', 'رافاييل', 'بيكاسو']),
  mc('celebrities', 'EXPERT', 'من هو مؤلف رواية "مئة عام من العزلة"؟', 'غابرييل غارسيا ماركيز', ['خورخي لويس بورخيس', 'ماريو فارغاس يوسا', 'باولو كويلو']),
  tf('celebrities', 'EASY', 'الملكة إليزابيث الثانية حكمت المملكة المتحدة لأكثر من 70 عامًا.', true),
  cg('celebrities', 'EASY', 'عالم ألماني طوّر نظرية النسبية وحصل على جائزة نوبل. من هو؟', ['ألبرت أينشتاين', 'أينشتاين'], ''),
  cg('celebrities', 'MEDIUM', 'قائد مسلم واجه الحملة الصليبية الثالثة واسترد القدس. من هو؟', ['صلاح الدين الأيوبي', 'صلاح الدين'], ''),
  wg('celebrities', 'HARD', 'من هو الرئيس الأمريكي الذي أصدر إعلان تحرير العبيد عام 1863؟', ['أبراهام لينكولن', 'لينكولن'], ''),

  // ================= معلومات عامة =================
  mc('general_knowledge', 'EASY', 'كم عدد أيام الأسبوع؟', '7', ['5', '6', '8']),
  mc('general_knowledge', 'EASY', 'كم عدد أشهر السنة؟', '12', ['10', '11', '13']),
  mc('general_knowledge', 'MEDIUM', 'كم عدد أيام السنة الكبيسة؟', '366', ['365', '364', '367']),
  mc('general_knowledge', 'MEDIUM', 'ما هي اللغة الأكثر تحدثًا في العالم كلغة أم؟', 'الصينية الماندرين', ['الإنجليزية', 'الإسبانية', 'العربية']),
  mc('general_knowledge', 'HARD', 'ما هو أكبر عضو في جسم الإنسان؟', 'الجلد', ['الكبد', 'الرئة', 'الأمعاء الدقيقة']),
  mc('general_knowledge', 'EXPERT', 'ما هي أصغر دولة في العالم من حيث المساحة؟', 'الفاتيكان', ['موناكو', 'ناورو', 'سان مارينو']),
  tf('general_knowledge', 'EASY', 'يوجد سبع قارات في العالم.', true),
  tf('general_knowledge', 'MEDIUM', 'العسل لا يفسد أبدًا إذا خُزّن بشكل صحيح.', true, 'تم العثور على عسل في مقابر فرعونية عمره آلاف السنين وما زال صالحًا.'),
  wg('general_knowledge', 'EASY', 'كم عدد الألوان في قوس قزح؟', ['7', 'سبعة'], ''),
  ordering('general_knowledge', 'MEDIUM', 'رتّب وحدات القياس التالية من الأصغر إلى الأكبر', ['ملم', 'سم', 'م', 'كم'], 'الترتيب من الأصغر للأكبر: ملم، سم، متر، كيلومتر.'),

  // ================= ألغاز =================
  mc('puzzles', 'MEDIUM', 'إذا كان اليوم الأربعاء، فما اليوم بعد 100 يوم؟', 'الجمعة', ['الخميس', 'السبت', 'الأحد'], '100 ÷ 7 = 14 أسبوعًا ويومان، فيصبح اليوم الجمعة.'),
  mc('puzzles', 'EASY', 'ما هو الرقم الذي إذا ضربته في نفسه يساوي 81؟', '9', ['7', '8', '11']),
  mc('puzzles', 'MEDIUM', 'أي شيء يزداد كلما أخذت منه؟', 'الحفرة', ['الماء', 'الوقت', 'المال']),
  mc('puzzles', 'HARD', 'ما هو الشيء الذي له أسنان ولا يعض؟', 'المشط', ['الفرشاة', 'المنشار', 'السلسلة']),
  mc('puzzles', 'EXPERT', 'ثلاثة أشخاص يحتاجون 3 دقائق لأكل 3 تفاحات. كم دقيقة يحتاجها 6 أشخاص لأكل 6 تفاحات؟', '3 دقائق', ['6 دقائق', '9 دقائق', '2 دقيقة'], 'كل شخص يأكل تفاحة واحدة في 3 دقائق بغض النظر عن العدد.'),
  tf('puzzles', 'MEDIUM', 'مجموع زوايا المثلث يساوي 180 درجة.', true),
  wg('puzzles', 'EASY', 'اكتب ناتج جمع 15 و 27', ['42'], '15 + 27 = 42'),
  wg('puzzles', 'MEDIUM', 'اكتب ناتج 12 × 8', ['96'], '12 × 8 = 96'),
  ordering('puzzles', 'MEDIUM', 'رتّب هذه الأرقام تصاعديًا', ['3', '11', '27', '48'], ''),
  imageChoice(
    'puzzles',
    'EASY',
    'ما هو الشكل الدائري من بين الأشكال التالية؟',
    [
      { textAr: 'الشكل الأول', imageUrl: '/images/quiz/shape-circle.svg', isCorrect: true },
      { textAr: 'الشكل الثاني', imageUrl: '/images/quiz/shape-square.svg', isCorrect: false },
      { textAr: 'الشكل الثالث', imageUrl: '/images/quiz/shape-triangle.svg', isCorrect: false },
      { textAr: 'الشكل الرابع', imageUrl: '/images/quiz/shape-star.svg', isCorrect: false },
    ]
  ),

  // ================= أسئلة عائلية =================
  mc('family', 'EASY', 'ما هو أول وجبة نتناولها عادة في اليوم؟', 'الفطور', ['الغداء', 'العشاء', 'السحور']),
  mc('family', 'EASY', 'كم عدد أصابع اليد الواحدة؟', '5', ['4', '6', '10']),
  mc('family', 'EASY', 'ما هو لون السماء في يوم صافٍ؟', 'أزرق', ['أخضر', 'أحمر', 'أصفر']),
  mc('family', 'MEDIUM', 'ما هو الحيوان الذي ينتج العسل؟', 'النحل', ['الفراشة', 'النملة', 'الدبور']),
  mc('family', 'MEDIUM', 'كم عدد ألوان علم قوس قزح الأساسية؟', '7', ['5', '6', '8']),
  tf('family', 'EASY', 'القطة حيوان أليف شائع في المنازل.', true),
  tf('family', 'EASY', 'الشتاء هو أحر فصول السنة.', false, 'الصيف هو أحر فصول السنة عادة، والشتاء أبردها.'),
  wg('family', 'EASY', 'ما هو عكس كلمة "كبير"؟', ['صغير'], ''),
  imageChoice(
    'family',
    'EASY',
    'ما هو الشكل الملوّن باللون الأحمر؟',
    [
      { textAr: 'الأول', imageUrl: '/images/quiz/color-red.svg', isCorrect: true },
      { textAr: 'الثاني', imageUrl: '/images/quiz/color-blue.svg', isCorrect: false },
      { textAr: 'الثالث', imageUrl: '/images/quiz/color-green.svg', isCorrect: false },
      { textAr: 'الرابع', imageUrl: '/images/quiz/color-yellow.svg', isCorrect: false },
    ]
  ),
  ordering('family', 'MEDIUM', 'رتّب وجبات اليوم بالترتيب الذي نتناولها فيه عادة', ['الفطور', 'الغداء', 'العشاء'], ''),
];

async function main() {
  console.log('🌱 بدء زراعة البيانات...');

  // -------- التصنيفات --------
  const categoryByKey = new Map<string, string>();
  for (const c of CATEGORY_SEED) {
    const category = await prisma.category.upsert({
      where: { key: c.key },
      update: { nameAr: c.nameAr, icon: c.icon, colorHex: c.colorHex },
      create: { key: c.key, nameAr: c.nameAr, icon: c.icon, colorHex: c.colorHex },
    });
    categoryByKey.set(c.key, category.id);
  }
  console.log(`✅ ${categoryByKey.size} تصنيفًا`);

  // -------- الإنجازات --------
  for (const a of ACHIEVEMENT_DEFINITIONS) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      update: { nameAr: a.nameAr, descriptionAr: a.descriptionAr, icon: a.icon, criteria: a.criteria },
      create: { key: a.key, nameAr: a.nameAr, descriptionAr: a.descriptionAr, icon: a.icon, criteria: a.criteria },
    });
  }
  console.log(`✅ ${ACHIEVEMENT_DEFINITIONS.length} إنجازًا`);

  // -------- حساب المسؤول --------
  const adminEmail = 'admin@quiz.local';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@12345', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        player: {
          create: { isGuest: false, displayName: 'مدير المنصة', avatarEmoji: '🛡️', avatarColor: '#ffb020' },
        },
      },
    });
    console.log(`✅ حساب مسؤول: ${adminEmail} / Admin@12345`);
  }

  // -------- الأسئلة --------
  let inserted = 0;
  for (const q of QUESTIONS) {
    const categoryId = categoryByKey.get(q.categoryKey);
    if (!categoryId) {
      console.warn(`⚠️ تصنيف غير معروف: ${q.categoryKey}`);
      continue;
    }
    await prisma.question.create({
      data: {
        categoryId,
        type: q.type,
        difficulty: q.difficulty,
        textAr: q.textAr,
        imageUrl: q.imageUrl ?? null,
        explanationAr: q.explanationAr ?? null,
        timeLimitSeconds: TIME_LIMIT_BY_DIFFICULTY[q.difficulty],
        basePoints: BASE_POINTS_BY_DIFFICULTY[q.difficulty],
        status: 'ACTIVE',
        source: 'MANUAL',
        answers: {
          create: q.answers.map((a) => ({
            textAr: a.textAr,
            imageUrl: a.imageUrl ?? null,
            isCorrect: a.isCorrect,
            orderIndex: a.orderIndex ?? null,
          })),
        },
      },
    });
    inserted++;
  }
  console.log(`✅ ${inserted} سؤالًا`);

  console.log('🎉 اكتملت زراعة البيانات بنجاح!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

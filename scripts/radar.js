const fs = require('fs');

const QUERIES = [
  'منح الجمعيات الخيرية السعودية فتح التقديم',
  'مؤسسة مانحة تستقبل طلبات دعم الجمعيات',
  'مسؤولية اجتماعية شركات دعم الجمعيات السعودية',
  'فرص دعم غير ربحي السعودية',
  'دعم مشاريع الجمعيات الخيرية'
];

const PROJECTS = [
  { name: 'كفالة تعليم الأيتام', sector: 'تعليمي' },
  { name: 'السلال الغذائية للأسر', sector: 'غذائي' },
  { name: 'نادي رفاق القيمي', sector: 'تنموي' },
  { name: 'التمكين الرقمي', sector: 'تقني' }
];

function classify(text) {
  const t = text || '';
  if (/تعليم|مدرس|طلاب|تمكين|تدريب/.test(t)) return 'تعليمي';
  if (/غذاء|سلال|إطعام|أسر/.test(t)) return 'غذائي';
  if (/تقني|رقمي|أجهزة|منصة/.test(t)) return 'تقني';
  if (/صحي|علاج|طبي/.test(t)) return 'صحي';
  return 'تنموي';
}

function matchProject(sector) {
  return (PROJECTS.find(p => p.sector === sector) || PROJECTS[2]).name;
}

function score(title, sector) {
  let s = 55;
  if (/فتح|تقديم|منح|دعم|مسؤولية|شراكة/.test(title)) s += 20;
  if (PROJECTS.some(p => p.sector === sector)) s += 15;
  return Math.min(95, s);
}

async function getGoogleNews(query) {
  const url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(query) + '&hl=ar&gl=SA&ceid=SA:ar';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>[\s\S]*?<\/item>/g)];
  return items.slice(0, 6).map(m => ({ title: m[1], url: m[2], date: m[3] }));
}

async function main() {
  const found = [];
  for (const q of QUERIES) {
    try {
      const rows = await getGoogleNews(q);
      for (const r of rows) {
        const sector = classify(r.title);
        found.push({
          id: Buffer.from(r.title).toString('base64').slice(0, 18),
          name: 'جهة مرصودة من الأخبار',
          title: r.title.replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
          sector,
          city: 'السعودية',
          status: 'تحت المراجعة',
          deadline: '',
          amount: 'غير محدد',
          url: r.url,
          summary: 'فرصة مرصودة تلقائيًا من مصادر الأخبار وتحتاج مراجعة بشرية قبل الاعتماد.',
          matchedProject: matchProject(sector),
          score: score(r.title, sector),
          sourceQuery: q,
          publishedAt: r.date
        });
      }
    } catch (e) {
      console.error('Radar query failed:', q, e.message);
    }
  }

  const unique = [];
  const seen = new Set();
  for (const item of found) {
    const key = item.title.trim();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  const data = {
    updatedAt: new Date().toISOString(),
    source: 'github-actions-google-news-rss',
    note: 'هذه فرص مرصودة تلقائيًا وتحتاج مراجعة بشرية قبل الاعتماد.',
    items: unique.slice(0, 30)
  };

  fs.writeFileSync('opportunities.json', JSON.stringify(data, null, 2), 'utf8');
  console.log('Wrote opportunities:', data.items.length);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

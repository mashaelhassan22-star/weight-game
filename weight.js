// ============================================================
// مسابقة تصنيف المنتجات حسب الوزن — بين فريقين
// شاشة المعلمة (المضيف) + جوال لكل فريق، متصلة مباشرة عبر PeerJS
// ============================================================
'use strict';

const PREFIX = 'bandari-weight-';
const POINTS = 10, FAST_BONUS = 5;
const app = document.getElementById('app');
const params = new URLSearchParams(location.search);

// ---------- أدوات ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fmtW = g => g >= 1000 ? `${ar(g / 1000)} كجم` : `${ar(g)} جم`;
const sayW = g => g >= 1000 ? `${g / 1000} كيلو` : `${g} غرام`;

// ---------- المنتجات (الوزن التقريبي بالجرام) ----------
const LIGHT = [['🪶', 'ريشة', 1], ['🥚', 'بيضة', 60], ['🍓', 'حبة فراولة', 20], ['🍋', 'ليمونة', 80], ['✏️', 'قلم', 10], ['🔑', 'مفتاح', 15], ['🥄', 'ملعقة', 40], ['🍬', 'حبة حلوى', 5], ['🍌', 'موزة', 120], ['🍎', 'تفاحة', 180], ['🍪', 'بسكويتة', 15], ['🪥', 'فرشاة أسنان', 20], ['👓', 'نظارة', 30], ['🎾', 'كرة تنس', 58], ['🧦', 'جورب', 40], ['🥕', 'جزرة', 70]];
const MEDIUM = [['🍍', 'أناناس', 1500], ['👟', 'حذاء', 600], ['📕', 'كتاب', 500], ['⚽', 'كرة قدم', 430], ['🍞', 'خبز', 400], ['🥥', 'جوز هند', 700], ['💻', 'حاسب محمول', 2000]];
const HEAVY = [['🍉', 'بطيخة', 6000], ['🎃', 'قرعة', 5000], ['🧳', 'حقيبة سفر', 15000], ['📺', 'تلفاز', 10000], ['🚲', 'دراجة', 12000], ['🪑', 'كرسي', 7000], ['🛋️', 'كنبة', 40000], ['🛞', 'إطار سيارة', 9000], ['🪴', 'نبتة في أصيص', 4000], ['🛢️', 'برميل', 20000], ['🎒', 'حقيبة مدرسية ممتلئة', 4000]];
const GOODS = [['🍚', 'أرز'], ['🌾', 'طحين'], ['🍬', 'سكر'], ['☕', 'قهوة'], ['🍵', 'شاي'], ['🍯', 'عسل'], ['🧀', 'جبن'], ['🫒', 'زيتون'], ['🍝', 'مكرونة'], ['🥜', 'فول سوداني'], ['🧂', 'ملح'], ['🥔', 'بطاطس'], ['🧅', 'بصل'], ['🍊', 'برتقال']];
const SCALE_PAIRS = [[['🎁', 'الهدية'], ['📦', 'الصندوق']], [['🍎', 'التفاحة'], ['🍊', 'البرتقالة']], [['🟥', 'المكعب الأحمر'], ['🟦', 'المكعب الأزرق']], [['🥭', 'المانجو'], ['🍐', 'الكمثرى']], [['🧴', 'العلبة'], ['🫙', 'البرطمان']], [['⚽', 'كرة القدم'], ['🏀', 'كرة السلة']]];
const LIGHT_OPT = { e: '🎈', n: 'خفيف' }, HEAVY_OPT = { e: '🪨', n: 'ثقيل' };
const item = ([e, n, g]) => ({ e, n, g });

// ---------- مولّد الأسئلة ----------
function qCompare(heavier, adv) {
  let a, b;
  if (!adv) { a = item(pick(LIGHT)); b = item(pick(HEAVY)); }
  else {
    const all = [...LIGHT, ...MEDIUM, ...HEAVY];
    do { a = item(pick(all)); b = item(pick(all)); } while (Math.max(a.g, b.g) / Math.min(a.g, b.g) < 4);
  }
  const o = shuffle([a, b]);
  const hi = o[0].g > o[1].g ? 0 : 1, lo = 1 - hi;
  const word = heavier ? 'أثقل' : 'أخف';
  return {
    type: 'choice', kind: 'compare', prompt: `أيهما ${word}؟`,
    speak: `أيهما ${word}: ${o[0].n} أم ${o[1].n}؟`,
    options: o.map(x => ({ e: x.e, n: x.n })), answer: heavier ? hi : lo,
    explain: heavier ? `${o[hi].n} أثقل من ${o[lo].n}` : `${o[lo].n} أخف من ${o[hi].n}`,
    keys: o.map(x => x.e),
  };
}
function qClassify() {
  const heavy = Math.random() < 0.5;
  const it = item(pick(heavy ? HEAVY : LIGHT));
  return {
    type: 'choice', kind: 'classify', prompt: 'خفيف أم ثقيل؟', speak: `${it.n}: خفيف أم ثقيل؟`,
    display: { kind: 'item', e: it.e, n: it.n }, options: [LIGHT_OPT, HEAVY_OPT], answer: heavy ? 1 : 0,
    explain: `${it.n}: ${heavy ? 'ثقيل 🪨' : 'خفيف 🎈'}`, keys: [it.e],
  };
}
function qScale(heavier) {
  const [p, q] = shuffle(pick(SCALE_PAIRS));
  const opts = [{ e: p[0], n: p[1] }, { e: q[0], n: q[1] }]; // [0] على الكفة اليمنى، [1] على اليسرى
  const down = Math.random() < 0.5 ? 'right' : 'left';
  const hi = down === 'right' ? 0 : 1;
  const word = heavier ? 'أثقل' : 'أخف';
  return {
    type: 'choice', kind: 'scale', prompt: `انظري إلى الميزان: أيهما ${word}؟`,
    speak: `انظري إلى الميزان. أيهما ${word}: ${opts[0].n} أم ${opts[1].n}؟`,
    display: { kind: 'scale', right: opts[0], left: opts[1], down }, options: opts, answer: heavier ? hi : 1 - hi,
    explain: heavier ? 'الكفة الأثقل تنزل إلى الأسفل ⬇️' : 'الكفة الأخف ترتفع إلى الأعلى ⬆️', keys: ['s' + p[0]],
  };
}
function qLabel(heavier, adv) {
  const [e, n] = pick(GOODS);
  let pair;
  if (!adv) {
    const pool = Math.random() < 0.75 ? [1000, 2000, 3000, 5000, 10000] : [100, 250, 500];
    const s = shuffle(pool); pair = [s[0], s[1]];
  } else {
    pair = pick([[500, 1000], [250, 1000], [750, 1000], [500, 2000], [250, 5000], [100, 2000], [750, 3000], [250, 500]]);
  }
  const w = shuffle(pair);
  const hi = w[0] > w[1] ? 0 : 1, lo = 1 - hi;
  const word = heavier ? 'أثقل' : 'أخف';
  const mixed = (w[0] >= 1000) !== (w[1] >= 1000);
  return {
    type: 'choice', kind: 'label', prompt: `اقرئي الوزن: أي كيس ${word}؟`,
    speak: `اقرئي الوزن المكتوب. أي كيس ${n} ${word}: ${sayW(w[0])} أم ${sayW(w[1])}؟`,
    options: w.map(g => ({ e, n, w: fmtW(g) })), answer: heavier ? hi : lo,
    explain: (heavier ? `${fmtW(w[hi])} أثقل من ${fmtW(w[lo])}` : `${fmtW(w[lo])} أخف من ${fmtW(w[hi])}`) + (mixed ? ' (الكيلوجرام = ١٠٠٠ جرام)' : ''),
    keys: ['g' + e],
  };
}
function qSort() {
  const its = shuffle([item(pick(LIGHT)), item(pick(MEDIUM)), item(pick(HEAVY))]);
  const answer = [0, 1, 2].sort((i, j) => its[i].g - its[j].g);
  return {
    type: 'order', kind: 'sort', prompt: 'رتّبي من الأخف إلى الأثقل',
    speak: `رتّبي من الأخف إلى الأثقل: ${its.map(x => x.n).join('، ')}`,
    options: its.map(x => ({ e: x.e, n: x.n })), answer,
    explain: 'الترتيب: ' + answer.map(i => its[i].n).join(' ثم '), keys: its.map(x => x.e),
  };
}
const GEN = {
  cH: adv => qCompare(true, adv), cL: adv => qCompare(false, adv), cls: () => qClassify(),
  scH: () => qScale(true), scL: () => qScale(false), lbH: adv => qLabel(true, adv), lbL: adv => qLabel(false, adv), sort: () => qSort(),
};
function buildQuiz(n, adv) {
  const base = adv ? ['cH', 'lbH', 'scL', 'sort', 'cL', 'cls', 'lbL', 'scH', 'sort', 'lbH']
                   : ['cH', 'cls', 'scH', 'lbH', 'cL', 'cls', 'scH', 'cH', 'lbH', 'cls'];
  let types = [];
  while (types.length < n) types.push(...shuffle(base));
  types = types.slice(0, n);
  for (let i = 1; i < types.length; i++) if (types[i] === types[i - 1]) {
    const j = types.findIndex((t, k) => k > i && t !== types[i]);
    if (j > 0) [types[i], types[j]] = [types[j], types[i]];
  }
  const used = new Set();
  return types.map(t => {
    let q, tries = 0;
    do { q = GEN[t](adv); tries++; } while (tries < 15 && q.keys.some(k => used.has(k)));
    q.keys.forEach(k => used.add(k)); delete q.keys;
    return q;
  });
}

// ---------- الصوت ----------
let AC;
function ac() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(f, start, dur, type = 'sine', vol = 0.2) {
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + start;
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
}
const SFX = {
  tap: () => tone(660, 0, 0.12, 'triangle', 0.15),
  start: () => { tone(440, 0, 0.12); tone(880, 0.12, 0.25); },
  ok: () => { tone(523, 0, 0.15); tone(659, 0.12, 0.15); tone(784, 0.24, 0.35); },
  bad: () => { tone(330, 0, 0.2, 'triangle', 0.14); tone(247, 0.18, 0.35, 'triangle', 0.14); },
  drum: () => { for (let i = 0; i < 22; i++) tone(110 + (i % 2) * 20, i * 0.13, 0.1, 'triangle', 0.12 + i * 0.006); },
  win: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.15, 0.32, 'square', 0.07)),
};
function say(text) {
  if (!('speechSynthesis' in window) || !text) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-SA'; u.rate = 0.85;
    const v = speechSynthesis.getVoices().find(v => (v.lang || '').toLowerCase().startsWith('ar'));
    if (v) u.voice = v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch { /* لا يوجد صوت عربي */ }
}
if ('speechSynthesis' in window) speechSynthesis.getVoices();

// ---------- الاحتفال ----------
function confetti(colors) {
  const cv = document.getElementById('confetti'), cx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight; cv.style.display = 'block';
  const P = Array.from({ length: 180 }, () => ({
    x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.6, r: 5 + Math.random() * 7,
    vx: -2 + Math.random() * 4, vy: 2 + Math.random() * 4, a: Math.random() * 6, va: -0.2 + Math.random() * 0.4,
    c: pick([...colors, '#facc15', '#22c55e', '#f97316']),
  }));
  const t0 = performance.now();
  (function frame(t) {
    cx.clearRect(0, 0, cv.width, cv.height);
    P.forEach(p => { p.x += p.vx; p.y += p.vy; p.a += p.va; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.c; cx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); cx.restore(); if (p.y > cv.height + 20 && t - t0 < 4500) { p.y = -20; p.x = Math.random() * cv.width; } });
    if (t - t0 < 7000) requestAnimationFrame(frame); else { cx.clearRect(0, 0, cv.width, cv.height); cv.style.display = 'none'; }
  })(t0);
}

// ---------- مكونات العرض المشتركة ----------
function scaleHTML(d) {
  const pan = (o, side) => `<div class="pan p${side}"><i class="str"></i><span class="it">${o.e}</span><i class="bowl"></i></div>`;
  return `<div class="scale ${d.down === 'right' ? 'dr' : 'dl'}" aria-label="ميزان ذو كفتين">
    <div class="beam">${pan(d.right, 'r')}${pan(d.left, 'l')}</div><div class="post"></div><div class="base"></div></div>`;
}
function displayHTML(d) {
  if (!d) return '';
  if (d.kind === 'item') return `<div class="disp-item"><div class="em">${d.e}</div><div class="nm">${esc(d.n)}</div></div>`;
  if (d.kind === 'scale') return scaleHTML(d);
  return '';
}
function optHTML(o, i, { tag = 'button', cls = '', extra = '' } = {}) {
  const attrs = tag === 'button' ? `type="button" data-opt="${i}"` : '';
  return `<${tag} class="opt ${cls}" ${attrs}><span class="em">${o.e}</span><span class="nm">${esc(o.n)}</span>${o.w ? `<span class="wt">${o.w}</span>` : ''}${extra}</${tag}>`;
}
const rankBadge = (r, cls = '') => `<span class="rank ${cls}">${ar(r + 1)}</span>`;

// ============================================================
// المضيف: شاشة المعلمة
// ============================================================
const DEFAULT_TEAMS = [
  { name: 'فريق النجوم', emoji: '⭐', color: '#2563eb' },
  { name: 'فريق الورود', emoji: '🌸', color: '#db2777' },
];
const H = {
  mode: 'net', phase: 'setup', teams: DEFAULT_TEAMS.map(t => ({ ...t, score: 0 })),
  settings: { count: 10, time: 30, level: 'easy', voice: true },
  quiz: [], idx: -1, answers: [null, null], results: null, deadline: null, winner: null, endReady: false,
  room: null, peer: null, peerStatus: 'off', conns: [], local: null, animKey: '',
};

function hostLoad() {
  try {
    const pref = JSON.parse(localStorage.getItem('wt-prefs') || 'null');
    if (pref) { Object.assign(H.settings, pref.settings || {}); (pref.names || []).forEach((n, i) => { if (n) H.teams[i].name = n; }); }
    const s = JSON.parse(sessionStorage.getItem('wt-host') || 'null');
    if (s && s.phase && s.phase !== 'setup') {
      Object.assign(H, s);
      H.teams = s.teams.map((t, i) => ({ ...DEFAULT_TEAMS[i], ...t }));
      if (H.phase === 'end') H.endReady = true;
    }
  } catch { /* بيانات قديمة */ }
}
function hostSave() {
  const { mode, phase, teams, settings, quiz, idx, answers, results, deadline, winner, endReady, room } = H;
  try {
    sessionStorage.setItem('wt-host', JSON.stringify({ mode, phase, teams: teams.map(({ name, emoji, color, score }) => ({ name, emoji, color, score })), settings, quiz, idx, answers, results, deadline, winner, endReady, room }));
    localStorage.setItem('wt-prefs', JSON.stringify({ settings, names: teams.map(t => t.name) }));
  } catch { /* التخزين ممتلئ */ }
}

function snapshot(t) {
  const q = H.quiz[H.idx], tm = H.teams[t];
  const s = {
    phase: H.phase, team: t, name: tm.name, emoji: tm.emoji, color: tm.color,
    names: H.teams.map(x => x.name), emojis: H.teams.map(x => x.emoji), scores: H.teams.map(x => x.score),
    idx: H.idx, total: H.quiz.length,
  };
  if ((H.phase === 'q' || H.phase === 'reveal') && q) {
    const { answer, explain, ...pub } = q;
    s.q = pub; s.answered = !!H.answers[t]; s.myValue = H.answers[t]?.value ?? null;
    s.left = H.deadline && H.phase === 'q' ? Math.max(0, H.deadline - Date.now()) : null;
    if (H.phase === 'reveal') { s.correct = answer; s.explain = explain; s.result = H.results[t]; }
  }
  if (H.phase === 'end') { s.endReady = H.endReady; s.winner = H.winner; }
  return s;
}
function broadcast() {
  H.conns.forEach(c => { if (c.open && c.team != null) { try { c.send({ t: 'state', s: snapshot(c.team) }); } catch { /* اتصال مغلق */ } } });
}
function update() { hostSave(); renderHost(); broadcast(); }
const devCount = t => H.conns.filter(c => c.open && c.team === t).length;

// ---------- مسار اللعبة ----------
function startQuiz() {
  ac(); SFX.start();
  H.quiz = buildQuiz(H.settings.count, H.settings.level === 'adv');
  H.teams.forEach(t => { t.score = 0; });
  H.idx = -1; H.winner = null; H.endReady = false;
  if (H.mode === 'local') H.local = [mkClient(0, true), mkClient(1, true)];
  nextQ();
}
function nextQ() {
  H.idx++;
  if (H.idx >= H.quiz.length) return finish();
  H.phase = 'q'; H.answers = [null, null]; H.results = null;
  H.deadline = H.settings.time ? Date.now() + H.settings.time * 1000 : null;
  update();
  if (H.settings.voice) setTimeout(() => say(H.quiz[H.idx].speak), 350);
}
function validAnswer(q, v) {
  if (q.type === 'choice') return Number.isInteger(v) && v >= 0 && v < q.options.length;
  return Array.isArray(v) && v.length === q.options.length && new Set(v).size === v.length && v.every(x => Number.isInteger(x) && x >= 0 && x < q.options.length);
}
function hostAnswer(t, idx, value) {
  const q = H.quiz[H.idx];
  if (H.phase !== 'q' || idx !== H.idx || H.answers[t] || !q || !validAnswer(q, value)) return;
  H.answers[t] = { value, at: Date.now() };
  if (H.mode === 'net') SFX.tap();
  update();
  if (H.answers[0] && H.answers[1]) setTimeout(() => { if (H.phase === 'q' && idx === H.idx) reveal(); }, 900);
}
function isCorrect(q, v) { return q.type === 'choice' ? v === q.answer : Array.isArray(v) && v.join() === q.answer.join(); }
function reveal() {
  if (H.phase !== 'q') return;
  const q = H.quiz[H.idx];
  H.phase = 'reveal';
  const ok = H.answers.map(a => !!a && isCorrect(q, a.value));
  const okTimes = H.answers.map((a, i) => ok[i] ? a.at : Infinity);
  const fastest = ok.some(Boolean) ? (okTimes[0] <= okTimes[1] ? 0 : 1) : -1;
  H.results = ok.map((o, i) => ({ ok: o, fast: o && i === fastest, pts: o ? POINTS + (i === fastest ? FAST_BONUS : 0) : 0 }));
  H.results.forEach((r, i) => { H.teams[i].score += r.pts; });
  if (H.settings.voice) speechSynthesis?.cancel();
  ok.some(Boolean) ? SFX.ok() : SFX.bad();
  update();
}
function finish() {
  if (H.phase === 'q') reveal();
  H.phase = 'end'; H.deadline = null; H.endReady = false;
  const [a, b] = H.teams.map(t => t.score);
  H.winner = a === b ? -1 : a > b ? 0 : 1;
  SFX.drum(); update();
  setTimeout(() => {
    H.endReady = true; update(); SFX.win();
    confetti(H.winner >= 0 ? [H.teams[H.winner].color] : H.teams.map(t => t.color));
    if (H.settings.voice) say(H.winner >= 0 ? `مبروك! الفائز ${H.teams[H.winner].name}` : 'تعادل! كلا الفريقين فائز');
  }, 3000);
}
function toSetup() { H.phase = 'setup'; H.deadline = null; update(); }

// ---------- الاتصال (المضيف) ----------
const newCode = () => String(1000 + rnd(9000));
function openRoom(code, attempt = 0, fresh = true) {
  if (!window.Peer) { H.peerStatus = 'nolib'; renderHost(); return; }
  if (H.peer && !H.peer.destroyed) H.peer.destroy();
  H.peerStatus = 'opening'; H.room = code; renderHost();
  const peer = new Peer(PREFIX + code, { debug: 0 });
  H.peer = peer;
  peer.on('open', () => { if (H.peer !== peer) return; H.peerStatus = 'ok'; hostSave(); renderHost(); });
  peer.on('connection', conn => {
    conn.on('data', d => hostMsg(conn, d));
    const drop = () => { H.conns = H.conns.filter(c => c !== conn); renderHost(); };
    conn.on('close', drop); conn.on('error', drop);
  });
  peer.on('disconnected', () => {
    if (H.peer !== peer || peer.destroyed) return;
    H.peerStatus = 'reconnecting'; renderHost();
    setTimeout(() => { if (!peer.destroyed && peer.disconnected) peer.reconnect(); }, 1500);
  });
  peer.on('error', e => {
    if (H.peer !== peer) return;
    if (e.type === 'peer-unavailable') return;
    if (e.type === 'unavailable-id') {
      peer.destroy();
      // بعد تحديث الصفحة يبقى الرمز القديم محجوزاً لثوانٍ، فنحاول به مرة أخرى قبل اختيار رمز جديد
      if (!fresh && attempt < 5) setTimeout(() => openRoom(code, attempt + 1, false), 3000);
      else openRoom(newCode());
      return;
    }
    H.peerStatus = 'error'; renderHost();
    setTimeout(() => { if (H.peer !== peer) return; if (peer.destroyed) openRoom(code, 0, false); else if (peer.disconnected) peer.reconnect(); }, 4000);
  });
}
function hostMsg(conn, d) {
  if (!d || typeof d !== 'object') return;
  if (d.t === 'hello') {
    conn.team = d.team === 1 ? 1 : 0;
    if (!H.conns.includes(conn)) H.conns.push(conn);
    conn.send({ t: 'state', s: snapshot(conn.team) });
    renderHost();
  } else if (d.t === 'ans' && conn.team != null) hostAnswer(conn.team, d.idx, d.value);
  else if (d.t === 'ping') { try { conn.send({ t: 'pong' }); } catch { /* */ } }
}

// ---------- واجهات المضيف ----------
function seg(key, opts) {
  return `<div class="seg">${opts.map(([v, l]) => `<button type="button" class="${H.settings[key] === v ? 'on' : ''}" data-set="${key}" data-v="${v}">${l}</button>`).join('')}</div>`;
}
function vSetup() {
  return `<div class="setup">
    <header class="hero"><div class="hero-ic">⚖️</div>
      <h1>مسابقة تصنيف المنتجات حسب الوزن</h1>
      <p>لعبة جماعية بين فريقين — التربية الفكرية، المرحلة الثانوية</p></header>
    <section class="card">
      <h2>الفريقان</h2>
      <div class="teams-in">${H.teams.map((t, i) => `<label class="team-in" style="--tc:${t.color}"><span class="ti-em">${t.emoji}</span><input data-name="${i}" value="${esc(t.name)}" maxlength="24" aria-label="اسم الفريق ${i + 1}"></label>`).join('')}</div>
      <h2>الإعدادات</h2>
      <div class="set-row"><span>عدد الأسئلة</span>${seg('count', [[6, ar(6)], [10, ar(10)], [15, ar(15)]])}</div>
      <div class="set-row"><span>وقت كل سؤال</span>${seg('time', [[0, 'بلا وقت'], [20, `${ar(20)} ث`], [30, `${ar(30)} ث`], [45, `${ar(45)} ث`]])}</div>
      <div class="set-row"><span>المستوى</span>${seg('level', [['easy', 'سهل'], ['adv', 'متقدم']])}</div>
      <p class="hint">${H.settings.level === 'adv' ? 'متقدم: مقارنة، ميزان، قراءة الأوزان (جم وكجم)، وترتيب ثلاثة منتجات من الأخف إلى الأثقل.' : 'سهل: أيهما أثقل وأيهما أخف، خفيف أم ثقيل، قراءة الميزان، ومقارنة كيسين بنفس الوحدة.'}</p>
      <div class="set-row"><span>قراءة السؤال بالصوت</span>${seg('voice', [[true, '🔊 تشغيل'], [false, '🔇 إيقاف']])}</div>
    </section>
    <div class="modes">
      <button type="button" class="mode" data-act="net"><span class="m-ic">📱</span><b>مسابقة بالجوالات</b><small>كل فريق يجيب من جواله في الوقت نفسه، والنتائج والفائز تظهر هنا على الشاشة</small></button>
      <button type="button" class="mode alt" data-act="local"><span class="m-ic">🖥️</span><b>على شاشة واحدة</b><small>للسبورة الذكية: الشاشة تنقسم نصفين، نصف لكل فريق (لا تحتاج إنترنت)</small></button>
    </div>
    <details class="card join"><summary>📲 أنا طالبة: الانضمام برمز المسابقة</summary>
      <div class="join-in"><input id="joinCode" inputmode="numeric" maxlength="4" placeholder="الرمز" aria-label="رمز المسابقة">
      ${H.teams.map((t, i) => `<button type="button" class="btn" style="--tc:${t.color}" data-join="${i + 1}">${t.emoji} ${esc(t.name)}</button>`).join('')}</div>
    </details>
  </div>`;
}
function vLobby() {
  const base = location.origin + location.pathname;
  const ok = H.peerStatus === 'ok';
  const st = { opening: '⏳ جارٍ تجهيز المسابقة...', reconnecting: '⏳ جارٍ إعادة الاتصال...', error: '⚠️ تعذّر الاتصال بخدمة الربط، تأكدي من الإنترنت. نعيد المحاولة تلقائياً...', nolib: '⚠️ تعذّر تحميل أداة الاتصال. تأكدي من الإنترنت ثم حدّثي الصفحة، أو العبي «على شاشة واحدة».' }[H.peerStatus] || '';
  const localWarn = /^(localhost|127\.|\[::1\])/.test(location.hostname) || location.protocol === 'file:'
    ? '<p class="warn">⚠️ الصفحة مفتوحة من جهازك فقط (localhost)، فلن يفتح الرمز في الجوالات. انشري مجلد site على Netlify وافتحي اللعبة من رابط الموقع.</p>' : '';
  return `<div class="lobby">
    <div class="lobby-top"><h1>امسحي الرمز بكاميرا جوال الفريق 📷</h1>
      <div class="room">رمز المسابقة <b>${ok ? ar(H.room) : '...'}</b></div></div>
    ${st ? `<p class="status">${st}</p>` : ''}${localWarn}
    <div class="lobby-teams">${H.teams.map((t, i) => {
      const url = `${base}?room=${H.room}&team=${i + 1}`, n = devCount(i);
      return `<div class="lt" style="--tc:${t.color}">
        <h2>${t.emoji} ${esc(t.name)}</h2>
        <div class="qr">${ok ? qrSVG(url) : '<div class="qr-wait">⏳</div>'}</div>
        <div class="lt-dev ${n ? 'on' : ''}">${n ? `✅ متصل: ${ar(n)} ${n === 1 ? 'جوال' : 'جوالات'}` : '⏳ بانتظار جوال الفريق...'}</div>
        <div class="lt-url" dir="ltr">${esc(url)}</div></div>`;
    }).join('')}</div>
    <div class="actions">
      <button type="button" class="btn primary big" data-act="start" ${ok ? '' : 'disabled'}>▶ ابدئي المسابقة</button>
      <button type="button" class="btn" data-act="setup">رجوع للإعدادات</button>
    </div>
    ${ok && (!devCount(0) || !devCount(1)) ? '<p class="hint center">يمكن البدء في أي وقت، والجوال الذي يتصل متأخراً يلحق بالسؤال الحالي.</p>' : ''}
  </div>`;
}
function qrSVG(url) {
  if (!window.qrcode) return `<div class="qr-wait small">${esc(url)}</div>`;
  const q = qrcode(0, 'M'); q.addData(url); q.make();
  return q.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
}
function teamCard(t) {
  const tm = H.teams[t]; let st = '', bump = '';
  if (H.phase === 'q') st = H.answers[t] ? '<span class="st done">✅ أجابت</span>' : '<span class="st think">🤔 تفكّر...</span>';
  if (H.phase === 'reveal') {
    const r = H.results[t];
    st = r.ok ? `<span class="st ok">✔ +${ar(r.pts)}${r.fast ? ' ⚡ الأسرع' : ''}</span>` : `<span class="st bad">${H.answers[t] ? '✘ إجابة خاطئة' : '⏰ لم تُجب'}</span>`;
    if (r.ok && H.animKey !== `r${H.idx}`) bump = 'bump';
  }
  const dev = H.mode === 'net' ? `<span class="dev" title="الجوالات المتصلة">📱${ar(devCount(t))}</span>` : '';
  return `<div class="tcard" style="--tc:${tm.color}"><div class="tc-name">${tm.emoji} ${esc(tm.name)}${dev}</div><div class="tc-score ${bump}">${ar(tm.score)}</div>${st}</div>`;
}
function hostOptions(q) {
  const rev = H.phase === 'reveal';
  if (q.type === 'order') {
    return `<div class="opts n3">${q.options.map((o, i) => optHTML(o, i, { tag: 'div', cls: rev ? 'ok' : '', extra: rev ? rankBadge(q.answer.indexOf(i), 'good') : '' })).join('')}</div>`;
  }
  return `<div class="opts n${q.options.length} k-${q.kind}">${q.options.map((o, i) => {
    let cls = '', marks = '';
    if (rev) {
      cls = i === q.answer ? 'ok' : 'dim';
      const who = H.teams.map((t, k) => H.answers[k]?.value === i ? `<span class="mark" style="--tc:${t.color}">${t.emoji}</span>` : '').join('');
      if (who) marks = `<span class="marks">${who}</span>`;
    }
    return optHTML(o, i, { tag: 'div', cls, extra: marks });
  }).join('')}</div>`;
}
function vQuestion() {
  const q = H.quiz[H.idx], rev = H.phase === 'reveal', last = H.idx === H.quiz.length - 1;
  const local = H.mode === 'local';
  const timer = H.deadline && !rev ? `<div class="tmr" data-end="${H.deadline}"></div>` : '';
  const enter = H.animKey !== `q${H.idx}` && !rev ? 'enter' : '';
  return `<div class="qscreen ${local ? 'is-local' : 'is-net'}">
    <div class="topbar">${teamCard(0)}<div class="mid"><div class="prog">السؤال ${ar(H.idx + 1)} من ${ar(H.quiz.length)}</div>${timer}</div>${teamCard(1)}</div>
    <div class="qmain ${enter}">
      <h1 class="prompt">${esc(q.prompt)} <button type="button" class="say" data-act="say" aria-label="قراءة السؤال">🔊</button></h1>
      ${displayHTML(q.display)}
      ${local ? '' : hostOptions(q)}
      ${rev ? `<div class="explain">💡 ${esc(q.explain)}</div>` : ''}
    </div>
    ${local ? `<div class="panels">${H.teams.map((t, i) => `<div class="panel" id="panel${i}" style="--tc:${t.color}"></div>`).join('')}</div>` : ''}
    <div class="hostbar">
      ${rev ? `<button type="button" class="btn primary big" data-act="next">${last ? '🏆 إعلان الفائز' : 'السؤال التالي ◀'}</button>`
            : `<button type="button" class="btn big" data-act="reveal">👁 إظهار الإجابة</button>`}
      <button type="button" class="btn ghost" data-act="finish">⏹ إنهاء المسابقة</button>
    </div>
  </div>`;
}
function vEnd() {
  if (!H.endReady) return `<div class="end suspense"><div class="drum">🥁</div><h1>والفائز هو...</h1></div>`;
  const w = H.winner, tie = w === -1;
  const col = tie ? '#16a34a' : H.teams[w].color;
  return `<div class="end" style="--tc:${col}">
    <div class="trophy">${tie ? '🤝' : '🏆'}</div>
    <h1>${tie ? 'تعادل! كلا الفريقين فائز 🌟' : `الفائز: ${H.teams[w].emoji} ${esc(H.teams[w].name)}`}</h1>
    <div class="final">${H.teams.map((t, i) => `<div class="fs ${i === w ? 'win' : ''}" style="--tc:${t.color}">${i === w ? '<span class="crown">👑</span>' : ''}<div>${t.emoji} ${esc(t.name)}</div><b>${ar(t.score)}</b><small>نقطة</small></div>`).join('')}</div>
    <p class="cheer">أحسنتن جميعاً! 👏👏</p>
    <div class="actions">
      <button type="button" class="btn primary big" data-act="again">🔁 مسابقة جديدة</button>
      <button type="button" class="btn" data-act="setup">⚙️ الإعدادات</button>
    </div>
  </div>`;
}
function renderHost() {
  if (CLIENT) return;
  const v = { setup: vSetup, lobby: vLobby, q: vQuestion, reveal: vQuestion, end: vEnd }[H.phase] || vSetup;
  // لا نعيد رسم الإعدادات أثناء الكتابة في اسم الفريق
  if (H.phase === 'setup' && document.activeElement?.matches?.('[data-name], #joinCode')) return;
  app.innerHTML = v();
  document.body.className = 'host ph-' + H.phase;
  if (H.phase === 'q') H.animKey = `q${H.idx}`;
  if (H.phase === 'reveal') H.animKey = `r${H.idx}`;
  if (H.mode === 'local' && (H.phase === 'q' || H.phase === 'reveal')) {
    if (!H.local) H.local = [mkClient(0, true), mkClient(1, true)];
    H.local.forEach((c, i) => { c.el = document.getElementById('panel' + i); renderClient(c, snapshot(i)); });
  }
  tick();
}

app.addEventListener('click', e => {
  if (CLIENT) return;
  const b = e.target.closest('[data-act],[data-set],[data-join]');
  if (!b) return;
  ac();
  if (b.dataset.set) {
    const k = b.dataset.set, raw = b.dataset.v;
    H.settings[k] = raw === 'true' ? true : raw === 'false' ? false : /^\d+$/.test(raw) ? +raw : raw;
    hostSave(); renderHost(); return;
  }
  if (b.dataset.join) {
    const code = (document.getElementById('joinCode').value || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g, '');
    if (code.length !== 4) { alert('اكتبي رمز المسابقة المكوّن من ٤ أرقام'); return; }
    location.href = `?room=${code}&team=${b.dataset.join}`; return;
  }
  const act = b.dataset.act;
  if (act === 'net') {
    H.mode = 'net'; H.phase = 'lobby'; H.local = null;
    if (!H.peer || H.peer.destroyed || !H.room) openRoom(newCode());
    update();
  } else if (act === 'local') {
    if (H.peer && !H.peer.destroyed) { H.peer.destroy(); H.peer = null; H.conns = []; H.peerStatus = 'off'; }
    H.mode = 'local'; startQuiz();
  } else if (act === 'start') startQuiz();
  else if (act === 'reveal') reveal();
  else if (act === 'next') nextQ();
  else if (act === 'finish') { if (confirm('إنهاء المسابقة وإعلان الفائز الآن؟')) finish(); }
  else if (act === 'again') { if (H.mode === 'net') { H.phase = 'lobby'; update(); } else startQuiz(); }
  else if (act === 'setup') toSetup();
  else if (act === 'say') say(H.quiz[H.idx]?.speak);
});
app.addEventListener('input', e => {
  if (CLIENT || !e.target.matches('[data-name]')) return;
  H.teams[+e.target.dataset.name].name = e.target.value.trim() || DEFAULT_TEAMS[+e.target.dataset.name].name;
  hostSave(); broadcast();
});
document.addEventListener('keydown', e => {
  if (CLIENT || e.target.matches('input')) return;
  if (!['Enter', ' ', 'ArrowLeft', 'PageDown'].includes(e.key)) return;
  if (H.phase === 'q') { e.preventDefault(); reveal(); }
  else if (H.phase === 'reveal') { e.preventDefault(); nextQ(); }
});

// ============================================================
// الطالبة: جوال الفريق (ويستخدم أيضاً لنصفي الشاشة في وضع الشاشة الواحدة)
// ============================================================
function mkClient(team, local) {
  const c = { team, local, el: null, s: null, sel: { idx: -1, arr: [] }, lastReveal: -1, lastEnd: false };
  c.send = local ? m => { if (m.t === 'ans') hostAnswer(team, m.idx, m.value); } : m => { try { C.conn?.open && C.conn.send(m); } catch { /* */ } };
  return c;
}
function clientHTML(c, s) {
  const L = c.local;
  if (s.phase === 'setup' || s.phase === 'lobby') {
    return `<div class="c-wait"><div class="c-badge">${s.emoji}</div><h1>أنتِ في ${esc(s.name)}</h1><p>انتظري المعلمة لتبدأ المسابقة ⏳</p><div class="dots"><i></i><i></i><i></i></div></div>`;
  }
  if (s.phase === 'end') {
    if (L) return '';
    if (!s.endReady) return `<div class="c-end"><div class="drum">🥁</div><h1>والفائز هو...</h1></div>`;
    if (s.winner === -1) return `<div class="c-end"><div class="trophy">🤝</div><h1>تعادل! كلا الفريقين فائز 🌟</h1><p>نقاط فريقكِ: <b>${ar(s.scores[s.team])}</b></p></div>`;
    if (s.winner === s.team) return `<div class="c-end win"><div class="trophy">🏆</div><h1>مبروك! فاز ${esc(s.name)}</h1><p>نقاط فريقكِ: <b>${ar(s.scores[s.team])}</b></p></div>`;
    return `<div class="c-end"><div class="trophy">👏</div><h1>أحسنتن!</h1><p>الفائز: ${s.emojis[s.winner]} ${esc(s.names[s.winner])}<br>نقاط فريقكِ: <b>${ar(s.scores[s.team])}</b></p><p>حاولن مرة أخرى في المسابقة القادمة 💪</p></div>`;
  }
  const q = s.q; if (!q) return '';
  const rev = s.phase === 'reveal', canPick = s.phase === 'q' && !s.answered;
  if (c.sel.idx !== s.idx) c.sel = { idx: s.idx, arr: [] };
  let opts;
  if (q.type === 'order') {
    const mine = s.answered ? s.myValue : c.sel.arr;
    opts = q.options.map((o, i) => {
      const r = mine ? mine.indexOf(i) : -1;
      let cls = canPick ? '' : 'locked', extra = r >= 0 ? rankBadge(r) : '';
      if (rev) { const cr = s.correct.indexOf(i); cls = r === cr ? 'ok' : 'bad'; extra = rankBadge(cr, 'good'); }
      return optHTML(o, i, { cls, extra });
    }).join('');
  } else {
    opts = q.options.map((o, i) => {
      let cls = '';
      if (rev) cls = i === s.correct ? 'ok' : i === s.myValue ? 'bad' : 'dim';
      else if (s.answered) cls = i === s.myValue ? 'chosen' : 'dim';
      return optHTML(o, i, { cls });
    }).join('');
  }
  let banner = '';
  if (rev) {
    const r = s.result;
    banner = r.ok ? `<div class="banner good">🎉 إجابة صحيحة! <b>+${ar(r.pts)}</b>${r.fast ? ' ⚡ الأسرع' : ''}</div>`
                  : `<div class="banner oops">${s.answered ? '💪 لا بأس، حاولي في السؤال القادم' : '⏰ انتهى الوقت'}</div>`;
    if (!L) banner += `<div class="c-explain">💡 ${esc(s.explain)}</div>`;
  } else if (s.answered) banner = `<div class="banner wait">✔ تم إرسال الإجابة — انتظري الفريق الآخر</div>`;
  else if (q.type === 'order') {
    banner = `<div class="order-bar">${c.sel.arr.length ? '<button type="button" class="btn" data-c="reset">↺ إعادة</button>' : ''}${c.sel.arr.length === q.options.length ? '<button type="button" class="btn primary" data-c="send">✔ إرسال الترتيب</button>' : `<span class="hint">اضغطي على الأخف أولاً (${ar(c.sel.arr.length)}/${ar(q.options.length)})</span>`}</div>`;
  }
  const top = L ? `<div class="p-head">${s.emoji} ${esc(s.name)}</div>`
    : `<div class="c-top"><span class="c-team">${s.emoji} ${esc(s.name)}</span><span class="c-prog">${ar(s.idx + 1)}/${ar(s.total)}</span>${s.left != null ? `<span class="tmr sm" data-end="${Date.now() + s.left}"></span>` : ''}<span class="c-score">⭐ ${ar(s.scores[s.team])}</span></div>
       <h1 class="c-prompt">${esc(q.prompt)} <button type="button" class="say" data-c="say" aria-label="اسمعي السؤال">🔊</button></h1>${displayHTML(q.display)}`;
  return `${top}<div class="opts n${q.options.length} k-${q.kind} ${canPick ? 'live' : ''}">${opts}</div>${banner}`;
}
function renderClient(c, s) {
  c.s = s;
  if (!c.el) return;
  c.el.innerHTML = clientHTML(c, s);
  if (!c.el._bound) {
    c.el._bound = true;
    c.el.addEventListener(c.local ? 'pointerdown' : 'click', e => clientTap(c, e));
  }
  if (!c.local) {
    document.body.style.setProperty('--tc', s.color);
    if (s.phase === 'reveal' && c.lastReveal !== s.idx) { c.lastReveal = s.idx; s.result?.ok ? SFX.ok() : SFX.bad(); if (navigator.vibrate) navigator.vibrate(s.result?.ok ? 120 : [60, 60, 60]); }
    if (s.phase === 'end' && s.endReady && !c.lastEnd) { c.lastEnd = true; if (s.winner === s.team || s.winner === -1) { SFX.win(); confetti([s.color]); } }
    if (s.phase !== 'end') c.lastEnd = false;
  }
  tick();
}
function clientTap(c, e) {
  const s = c.s; if (!s) return;
  const b = e.target.closest('[data-opt],[data-c]'); if (!b) return;
  ac();
  if (b.dataset.c === 'say') { say(s.q?.speak); return; }
  if (s.phase !== 'q' || s.answered) return;
  if (b.dataset.c === 'reset') { c.sel.arr = []; renderClient(c, s); return; }
  if (b.dataset.c === 'send') { submit(c, [...c.sel.arr]); return; }
  const i = +b.dataset.opt;
  if (s.q.type === 'choice') { submit(c, i); return; }
  if (!c.sel.arr.includes(i)) { c.sel.arr.push(i); SFX.tap(); renderClient(c, s); }
}
function submit(c, value) {
  SFX.tap();
  if (c.local) { c.send({ t: 'ans', idx: c.s.idx, value }); return; }
  c.send({ t: 'ans', idx: c.s.idx, value });
  renderClient(c, { ...c.s, answered: true, myValue: value });
}

// ---------- الاتصال (الجوال) ----------
const CLIENT = params.has('room');
const C = { room: (params.get('room') || '').replace(/\D/g, ''), team: params.get('team') === '2' ? 1 : params.get('team') === '1' ? 0 : null, peer: null, conn: null, status: 'connecting', lastSeen: 0, retryT: null, ui: null };

function clientShell() {
  document.body.className = 'client';
  if (C.team == null) {
    app.innerHTML = `<div class="c-wait"><div class="c-badge">⚖️</div><h1>اختاري فريقكِ</h1>
      <div class="pick-team">${DEFAULT_TEAMS.map((t, i) => `<a class="btn big" style="--tc:${t.color}" href="?room=${C.room}&team=${i + 1}">${t.emoji} ${t.name}</a>`).join('')}</div></div>`;
    return false;
  }
  app.innerHTML = `<div class="c-shell"><div id="cnet" class="cnet"></div><div id="cview" class="c-view"></div></div>`;
  C.ui = mkClient(C.team, false);
  C.ui.el = document.getElementById('cview');
  return true;
}
function clientStatus() {
  const box = document.getElementById('cnet'); if (!box) return;
  const msg = C.status === 'ok' ? '' : C.status === 'noroom' ? `🔎 نبحث عن المسابقة رقم ${ar(C.room)}... تأكدي أن شاشة المعلمة مفتوحة` : '📶 جارٍ الاتصال بالمسابقة...';
  box.textContent = msg; box.hidden = !msg;
  if (!C.ui.s && C.ui.el) C.ui.el.innerHTML = `<div class="c-wait"><div class="c-badge">${DEFAULT_TEAMS[C.team].emoji}</div><h1>${msg || 'متصل ✔'}</h1><div class="dots"><i></i><i></i><i></i></div></div>`;
}
function clientStart() {
  if (!window.Peer) { C.status = 'connecting'; clientStatus(); app.querySelector('#cnet').textContent = '⚠️ تعذّر تحميل أداة الاتصال، تأكدي من الإنترنت ثم حدّثي الصفحة'; return; }
  if (!C.peer || C.peer.destroyed) {
    C.peer = new Peer({ debug: 0 });
    C.peer.on('open', clientConnect);
    C.peer.on('disconnected', () => { setTimeout(() => { if (C.peer && !C.peer.destroyed && C.peer.disconnected) C.peer.reconnect(); }, 1000); });
    C.peer.on('error', e => {
      if (e.type === 'peer-unavailable') { C.status = 'noroom'; clientStatus(); clientRetry(3000); return; }
      C.status = 'connecting'; clientStatus();
      if (C.peer.destroyed) C.peer = null;
      clientRetry(3000);
    });
  } else if (C.peer.open) clientConnect();
  else if (C.peer.disconnected) C.peer.reconnect();
}
function clientConnect() {
  if (C.conn) { const old = C.conn; C.conn = null; try { old.close(); } catch { /* */ } }
  const conn = C.peer.connect(PREFIX + C.room, { reliable: true, serialization: 'json' });
  C.conn = conn;
  const guard = setTimeout(() => { if (C.conn === conn && !conn.open) { try { conn.close(); } catch { /* */ } clientRetry(500); } }, 9000);
  conn.on('open', () => { clearTimeout(guard); C.lastSeen = Date.now(); conn.send({ t: 'hello', team: C.team }); });
  conn.on('data', d => {
    C.lastSeen = Date.now();
    if (d?.t === 'state') { C.status = 'ok'; clientStatus(); renderClient(C.ui, d.s); }
  });
  const lost = () => { if (C.conn === conn) { C.status = 'connecting'; clientStatus(); clientRetry(2000); } };
  conn.on('close', lost); conn.on('error', lost);
}
function clientRetry(ms) {
  if (C.retryT) return;
  C.retryT = setTimeout(() => { C.retryT = null; clientStart(); }, ms);
}
function clientInit() {
  if (!clientShell()) return;
  clientStatus(); clientStart();
  setInterval(() => {
    if (C.conn?.open) {
      try { C.conn.send({ t: 'ping' }); } catch { /* */ }
      if (Date.now() - C.lastSeen > 12000) { C.status = 'connecting'; clientStatus(); const c = C.conn; C.conn = null; try { c.close(); } catch { /* */ } clientRetry(300); }
    }
  }, 4000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !C.conn?.open) clientRetry(100); });
}

// ---------- مؤقت مشترك ----------
function tick() {
  document.querySelectorAll('.tmr[data-end]').forEach(el => {
    const left = Math.max(0, Math.ceil((+el.dataset.end - Date.now()) / 1000));
    el.textContent = ar(left);
    el.classList.toggle('low', left <= 5);
  });
  if (!CLIENT && H.phase === 'q' && H.deadline && Date.now() >= H.deadline) reveal();
}
setInterval(tick, 250);

// ---------- البدء ----------
if (CLIENT) clientInit();
else {
  hostLoad();
  if (H.phase !== 'setup' && H.mode === 'net' && H.room) openRoom(H.room, 0, false);
  if (H.phase === 'q' && H.deadline && Date.now() >= H.deadline) reveal();
  renderHost();
}

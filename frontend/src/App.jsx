// app.jsx
// ╔══════════════════════════════════════════════════════════════════╗
// ║  HidayahHub v5.0  —  AI Islamic Knowledge Engine               ║
// ║  NEW: Surah Browser · Accounts · Streaks · AI Chatbot · Summary║
// ╚══════════════════════════════════════════════════════════════════╝

import { useState, useRef, useEffect, useCallback } from "react";

const API = "http://localhost:8000";

// ── QURAN AUDIO ───────────────────────────────────────────────────────────────
function parseRef(reference) {
  const m = (reference || "").match(/(\d+):(\d+)/);
  if (!m) return null;
  return { surah: m[1].padStart(3, "0"), ayah: m[2].padStart(3, "0") };
}
function getAudioUrl(reference) {
  const p = parseRef(reference);
  if (!p) return null;
  return `https://everyayah.com/data/Alafasy_128kbps/${p.surah}${p.ayah}.mp3`;
}

// ── AUTH HELPERS ──────────────────────────────────────────────────────────────
function loadUsers() {
  try { return JSON.parse(localStorage.getItem("hh_users") || "{}"); } catch { return {}; }
}
function saveUsers(u) { localStorage.setItem("hh_users", JSON.stringify(u)); }
function loadSession() {
  try { return JSON.parse(localStorage.getItem("hh_session") || "null"); } catch { return null; }
}
function saveSession(u) { localStorage.setItem("hh_session", JSON.stringify(u)); }
function clearSession() { localStorage.removeItem("hh_session"); }

// ── STREAK HELPERS ─────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().slice(0, 10); }
function updateStreak(username) {
  const users = loadUsers();
  if (!users[username]) return;
  const u = users[username];
  const today = todayStr();
  if (u.lastVisit === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (u.lastVisit === yesterday) {
    u.streak = (u.streak || 0) + 1;
  } else if (u.lastVisit !== today) {
    u.streak = 1;
  }
  u.lastVisit = today;
  u.longestStreak = Math.max(u.longestStreak || 0, u.streak);
  users[username] = u;
  saveUsers(users);
  return u;
}

// ── 114 SURAHS DATA ───────────────────────────────────────────────────────────
const SURAHS = [
  {n:1,ar:"الفاتحة",en:"Al-Fatiha",meaning:"The Opening",ayahs:7,type:"Meccan"},
  {n:2,ar:"البقرة",en:"Al-Baqarah",meaning:"The Cow",ayahs:286,type:"Medinan"},
  {n:3,ar:"آل عمران",en:"Ali 'Imran",meaning:"Family of Imran",ayahs:200,type:"Medinan"},
  {n:4,ar:"النساء",en:"An-Nisa",meaning:"The Women",ayahs:176,type:"Medinan"},
  {n:5,ar:"المائدة",en:"Al-Ma'idah",meaning:"The Table Spread",ayahs:120,type:"Medinan"},
  {n:6,ar:"الأنعام",en:"Al-An'am",meaning:"The Cattle",ayahs:165,type:"Meccan"},
  {n:7,ar:"الأعراف",en:"Al-A'raf",meaning:"The Heights",ayahs:206,type:"Meccan"},
  {n:8,ar:"الأنفال",en:"Al-Anfal",meaning:"The Spoils of War",ayahs:75,type:"Medinan"},
  {n:9,ar:"التوبة",en:"At-Tawbah",meaning:"The Repentance",ayahs:129,type:"Medinan"},
  {n:10,ar:"يونس",en:"Yunus",meaning:"Jonah",ayahs:109,type:"Meccan"},
  {n:11,ar:"هود",en:"Hud",meaning:"Hud",ayahs:123,type:"Meccan"},
  {n:12,ar:"يوسف",en:"Yusuf",meaning:"Joseph",ayahs:111,type:"Meccan"},
  {n:13,ar:"الرعد",en:"Ar-Ra'd",meaning:"The Thunder",ayahs:43,type:"Medinan"},
  {n:14,ar:"إبراهيم",en:"Ibrahim",meaning:"Abraham",ayahs:52,type:"Meccan"},
  {n:15,ar:"الحجر",en:"Al-Hijr",meaning:"The Rocky Tract",ayahs:99,type:"Meccan"},
  {n:16,ar:"النحل",en:"An-Nahl",meaning:"The Bee",ayahs:128,type:"Meccan"},
  {n:17,ar:"الإسراء",en:"Al-Isra",meaning:"The Night Journey",ayahs:111,type:"Meccan"},
  {n:18,ar:"الكهف",en:"Al-Kahf",meaning:"The Cave",ayahs:110,type:"Meccan"},
  {n:19,ar:"مريم",en:"Maryam",meaning:"Mary",ayahs:98,type:"Meccan"},
  {n:20,ar:"طه",en:"Ta-Ha",meaning:"Ta-Ha",ayahs:135,type:"Meccan"},
  {n:21,ar:"الأنبياء",en:"Al-Anbiya",meaning:"The Prophets",ayahs:112,type:"Meccan"},
  {n:22,ar:"الحج",en:"Al-Hajj",meaning:"The Pilgrimage",ayahs:78,type:"Medinan"},
  {n:23,ar:"المؤمنون",en:"Al-Mu'minun",meaning:"The Believers",ayahs:118,type:"Meccan"},
  {n:24,ar:"النور",en:"An-Nur",meaning:"The Light",ayahs:64,type:"Medinan"},
  {n:25,ar:"الفرقان",en:"Al-Furqan",meaning:"The Criterion",ayahs:77,type:"Meccan"},
  {n:26,ar:"الشعراء",en:"Ash-Shu'ara",meaning:"The Poets",ayahs:227,type:"Meccan"},
  {n:27,ar:"النمل",en:"An-Naml",meaning:"The Ant",ayahs:93,type:"Meccan"},
  {n:28,ar:"القصص",en:"Al-Qasas",meaning:"The Stories",ayahs:88,type:"Meccan"},
  {n:29,ar:"العنكبوت",en:"Al-'Ankabut",meaning:"The Spider",ayahs:69,type:"Meccan"},
  {n:30,ar:"الروم",en:"Ar-Rum",meaning:"The Romans",ayahs:60,type:"Meccan"},
  {n:31,ar:"لقمان",en:"Luqman",meaning:"Luqman",ayahs:34,type:"Meccan"},
  {n:32,ar:"السجدة",en:"As-Sajdah",meaning:"The Prostration",ayahs:30,type:"Meccan"},
  {n:33,ar:"الأحزاب",en:"Al-Ahzab",meaning:"The Combined Forces",ayahs:73,type:"Medinan"},
  {n:34,ar:"سبأ",en:"Saba",meaning:"Sheba",ayahs:54,type:"Meccan"},
  {n:35,ar:"فاطر",en:"Fatir",meaning:"Originator",ayahs:45,type:"Meccan"},
  {n:36,ar:"يس",en:"Ya-Sin",meaning:"Ya Sin",ayahs:83,type:"Meccan"},
  {n:37,ar:"الصافات",en:"As-Saffat",meaning:"Those who set the Ranks",ayahs:182,type:"Meccan"},
  {n:38,ar:"ص",en:"Sad",meaning:"The Letter Sad",ayahs:88,type:"Meccan"},
  {n:39,ar:"الزمر",en:"Az-Zumar",meaning:"The Troops",ayahs:75,type:"Meccan"},
  {n:40,ar:"غافر",en:"Ghafir",meaning:"The Forgiver",ayahs:85,type:"Meccan"},
  {n:41,ar:"فصلت",en:"Fussilat",meaning:"Explained in Detail",ayahs:54,type:"Meccan"},
  {n:42,ar:"الشورى",en:"Ash-Shuraa",meaning:"The Consultation",ayahs:53,type:"Meccan"},
  {n:43,ar:"الزخرف",en:"Az-Zukhruf",meaning:"The Ornaments of Gold",ayahs:89,type:"Meccan"},
  {n:44,ar:"الدخان",en:"Ad-Dukhan",meaning:"The Smoke",ayahs:59,type:"Meccan"},
  {n:45,ar:"الجاثية",en:"Al-Jathiyah",meaning:"The Crouching",ayahs:37,type:"Meccan"},
  {n:46,ar:"الأحقاف",en:"Al-Ahqaf",meaning:"The Wind-Curved Sandhills",ayahs:35,type:"Meccan"},
  {n:47,ar:"محمد",en:"Muhammad",meaning:"Muhammad",ayahs:38,type:"Medinan"},
  {n:48,ar:"الفتح",en:"Al-Fath",meaning:"The Victory",ayahs:29,type:"Medinan"},
  {n:49,ar:"الحجرات",en:"Al-Hujurat",meaning:"The Rooms",ayahs:18,type:"Medinan"},
  {n:50,ar:"ق",en:"Qaf",meaning:"The Letter Qaf",ayahs:45,type:"Meccan"},
  {n:51,ar:"الذاريات",en:"Adh-Dhariyat",meaning:"The Winnowing Winds",ayahs:60,type:"Meccan"},
  {n:52,ar:"الطور",en:"At-Tur",meaning:"The Mount",ayahs:49,type:"Meccan"},
  {n:53,ar:"النجم",en:"An-Najm",meaning:"The Star",ayahs:62,type:"Meccan"},
  {n:54,ar:"القمر",en:"Al-Qamar",meaning:"The Moon",ayahs:55,type:"Meccan"},
  {n:55,ar:"الرحمن",en:"Ar-Rahman",meaning:"The Beneficent",ayahs:78,type:"Medinan"},
  {n:56,ar:"الواقعة",en:"Al-Waqi'ah",meaning:"The Inevitable",ayahs:96,type:"Meccan"},
  {n:57,ar:"الحديد",en:"Al-Hadid",meaning:"The Iron",ayahs:29,type:"Medinan"},
  {n:58,ar:"المجادلة",en:"Al-Mujadila",meaning:"The Pleading Woman",ayahs:22,type:"Medinan"},
  {n:59,ar:"الحشر",en:"Al-Hashr",meaning:"The Exile",ayahs:24,type:"Medinan"},
  {n:60,ar:"الممتحنة",en:"Al-Mumtahanah",meaning:"She That is to be Examined",ayahs:13,type:"Medinan"},
  {n:61,ar:"الصف",en:"As-Saf",meaning:"The Ranks",ayahs:14,type:"Medinan"},
  {n:62,ar:"الجمعة",en:"Al-Jumu'ah",meaning:"Friday",ayahs:11,type:"Medinan"},
  {n:63,ar:"المنافقون",en:"Al-Munafiqun",meaning:"The Hypocrites",ayahs:11,type:"Medinan"},
  {n:64,ar:"التغابن",en:"At-Taghabun",meaning:"The Mutual Disillusion",ayahs:18,type:"Medinan"},
  {n:65,ar:"الطلاق",en:"At-Talaq",meaning:"The Divorce",ayahs:12,type:"Medinan"},
  {n:66,ar:"التحريم",en:"At-Tahrim",meaning:"The Prohibition",ayahs:12,type:"Medinan"},
  {n:67,ar:"الملك",en:"Al-Mulk",meaning:"The Sovereignty",ayahs:30,type:"Meccan"},
  {n:68,ar:"القلم",en:"Al-Qalam",meaning:"The Pen",ayahs:52,type:"Meccan"},
  {n:69,ar:"الحاقة",en:"Al-Haqqah",meaning:"The Reality",ayahs:52,type:"Meccan"},
  {n:70,ar:"المعارج",en:"Al-Ma'arij",meaning:"The Ascending Stairways",ayahs:44,type:"Meccan"},
  {n:71,ar:"نوح",en:"Nuh",meaning:"Noah",ayahs:28,type:"Meccan"},
  {n:72,ar:"الجن",en:"Al-Jinn",meaning:"The Jinn",ayahs:28,type:"Meccan"},
  {n:73,ar:"المزمل",en:"Al-Muzzammil",meaning:"The Enshrouded One",ayahs:20,type:"Meccan"},
  {n:74,ar:"المدثر",en:"Al-Muddaththir",meaning:"The Cloaked One",ayahs:56,type:"Meccan"},
  {n:75,ar:"القيامة",en:"Al-Qiyamah",meaning:"The Resurrection",ayahs:40,type:"Meccan"},
  {n:76,ar:"الإنسان",en:"Al-Insan",meaning:"The Man",ayahs:31,type:"Medinan"},
  {n:77,ar:"المرسلات",en:"Al-Mursalat",meaning:"The Emissaries",ayahs:50,type:"Meccan"},
  {n:78,ar:"النبأ",en:"An-Naba",meaning:"The Tidings",ayahs:40,type:"Meccan"},
  {n:79,ar:"النازعات",en:"An-Nazi'at",meaning:"Those who drag forth",ayahs:46,type:"Meccan"},
  {n:80,ar:"عبس",en:"Abasa",meaning:"He Frowned",ayahs:42,type:"Meccan"},
  {n:81,ar:"التكوير",en:"At-Takwir",meaning:"The Overthrowing",ayahs:29,type:"Meccan"},
  {n:82,ar:"الانفطار",en:"Al-Infitar",meaning:"The Cleaving",ayahs:19,type:"Meccan"},
  {n:83,ar:"المطففين",en:"Al-Mutaffifin",meaning:"The Defrauding",ayahs:36,type:"Meccan"},
  {n:84,ar:"الانشقاق",en:"Al-Inshiqaq",meaning:"The Sundering",ayahs:25,type:"Meccan"},
  {n:85,ar:"البروج",en:"Al-Buruj",meaning:"The Mansions of the Stars",ayahs:22,type:"Meccan"},
  {n:86,ar:"الطارق",en:"At-Tariq",meaning:"The Nightcomer",ayahs:17,type:"Meccan"},
  {n:87,ar:"الأعلى",en:"Al-A'la",meaning:"The Most High",ayahs:19,type:"Meccan"},
  {n:88,ar:"الغاشية",en:"Al-Ghashiyah",meaning:"The Overwhelming",ayahs:26,type:"Meccan"},
  {n:89,ar:"الفجر",en:"Al-Fajr",meaning:"The Dawn",ayahs:30,type:"Meccan"},
  {n:90,ar:"البلد",en:"Al-Balad",meaning:"The City",ayahs:20,type:"Meccan"},
  {n:91,ar:"الشمس",en:"Ash-Shams",meaning:"The Sun",ayahs:15,type:"Meccan"},
  {n:92,ar:"الليل",en:"Al-Layl",meaning:"The Night",ayahs:21,type:"Meccan"},
  {n:93,ar:"الضحى",en:"Ad-Duhaa",meaning:"The Morning Hours",ayahs:11,type:"Meccan"},
  {n:94,ar:"الشرح",en:"Ash-Sharh",meaning:"The Relief",ayahs:8,type:"Meccan"},
  {n:95,ar:"التين",en:"At-Tin",meaning:"The Fig",ayahs:8,type:"Meccan"},
  {n:96,ar:"العلق",en:"Al-'Alaq",meaning:"The Clot",ayahs:19,type:"Meccan"},
  {n:97,ar:"القدر",en:"Al-Qadr",meaning:"The Power",ayahs:5,type:"Meccan"},
  {n:98,ar:"البينة",en:"Al-Bayyinah",meaning:"The Clear Proof",ayahs:8,type:"Medinan"},
  {n:99,ar:"الزلزلة",en:"Az-Zalzalah",meaning:"The Earthquake",ayahs:8,type:"Medinan"},
  {n:100,ar:"العاديات",en:"Al-'Adiyat",meaning:"The Coursers",ayahs:11,type:"Meccan"},
  {n:101,ar:"القارعة",en:"Al-Qari'ah",meaning:"The Calamity",ayahs:11,type:"Meccan"},
  {n:102,ar:"التكاثر",en:"At-Takathur",meaning:"The Rivalry in World Increase",ayahs:8,type:"Meccan"},
  {n:103,ar:"العصر",en:"Al-'Asr",meaning:"The Declining Day",ayahs:3,type:"Meccan"},
  {n:104,ar:"الهمزة",en:"Al-Humazah",meaning:"The Traducer",ayahs:9,type:"Meccan"},
  {n:105,ar:"الفيل",en:"Al-Fil",meaning:"The Elephant",ayahs:5,type:"Meccan"},
  {n:106,ar:"قريش",en:"Quraysh",meaning:"Quraysh",ayahs:4,type:"Meccan"},
  {n:107,ar:"الماعون",en:"Al-Ma'un",meaning:"The Small Kindnesses",ayahs:7,type:"Meccan"},
  {n:108,ar:"الكوثر",en:"Al-Kawthar",meaning:"The Abundance",ayahs:3,type:"Meccan"},
  {n:109,ar:"الكافرون",en:"Al-Kafirun",meaning:"The Disbelievers",ayahs:6,type:"Meccan"},
  {n:110,ar:"النصر",en:"An-Nasr",meaning:"The Divine Support",ayahs:3,type:"Medinan"},
  {n:111,ar:"المسد",en:"Al-Masad",meaning:"The Palm Fibre",ayahs:5,type:"Meccan"},
  {n:112,ar:"الإخلاص",en:"Al-Ikhlas",meaning:"The Sincerity",ayahs:4,type:"Meccan"},
  {n:113,ar:"الفلق",en:"Al-Falaq",meaning:"The Daybreak",ayahs:5,type:"Meccan"},
  {n:114,ar:"الناس",en:"An-Nas",meaning:"Mankind",ayahs:6,type:"Meccan"},
];

// ── ASMA UL HUSNA DATA ────────────────────────────────────────────────────────
const ASMA = [
  {n:1, ar:"اللَّهُ", tr:"Allah", en:"The One God", desc:"The greatest name of Allah, encompassing all His attributes of perfection.", dua:"O Allah, You are Allah, there is no God but You."},
  {n:2, ar:"الرَّحْمَٰنُ", tr:"Ar-Rahman", en:"The Most Gracious", desc:"The One Who has vast mercy for all creation in this world, believer and disbeliever alike.", dua:"O Ar-Rahman, shower Your mercy upon us."},
  {n:3, ar:"الرَّحِيمُ", tr:"Ar-Raheem", en:"The Most Merciful", desc:"The One Whose special mercy is reserved for the believers in the Hereafter.", dua:"O Ar-Raheem, grant us Your special mercy on the Day of Judgment."},
  {n:4, ar:"الْمَلِكُ", tr:"Al-Malik", en:"The Sovereign", desc:"The King of all, the Owner of everything in existence.", dua:"O Malik, You are the true Owner of all things."},
  {n:5, ar:"الْقُدُّوسُ", tr:"Al-Quddus", en:"The Holy", desc:"The One free from all imperfection, the Purest.", dua:"O Quddus, purify our hearts and souls."},
  {n:6, ar:"السَّلَامُ", tr:"As-Salam", en:"The Source of Peace", desc:"The One who grants peace and security.", dua:"O Salam, grant us peace in this life and the next."},
  {n:7, ar:"الْمُؤْمِنُ", tr:"Al-Mu'min", en:"The Guardian of Faith", desc:"The One who gives security and affirms truth.", dua:"O Mu'min, protect us and keep us firm in faith."},
  {n:8, ar:"الْمُهَيْمِنُ", tr:"Al-Muhaymin", en:"The Protector", desc:"The One who watches over and protects all.", dua:"O Muhaymin, protect us and guide our steps."},
  {n:9, ar:"الْعَزِيزُ", tr:"Al-Aziz", en:"The Almighty", desc:"The One invincible, supreme in power.", dua:"O Aziz, grant us strength in Your obedience."},
  {n:10, ar:"الْجَبَّارُ", tr:"Al-Jabbar", en:"The Compeller", desc:"The One who restores and compels according to His will.", dua:"O Jabbar, mend our brokenness and set right our affairs."},
  {n:11, ar:"الْمُتَكَبِّرُ", tr:"Al-Mutakabbir", en:"The Supreme", desc:"The One who is above all creation in majesty.", dua:"O Mutakabbir, grant us humility before Your greatness."},
  {n:12, ar:"الْخَالِقُ", tr:"Al-Khaliq", en:"The Creator", desc:"The One who creates everything from nothing.", dua:"O Khaliq, create goodness in our hearts and lives."},
  {n:13, ar:"الْبَارِئُ", tr:"Al-Bari", en:"The Evolver", desc:"The One who brings all things into existence.", dua:"O Bari, bring forth good in our lives."},
  {n:14, ar:"الْمُصَوِّرُ", tr:"Al-Musawwir", en:"The Fashioner", desc:"The One who shapes all creation.", dua:"O Musawwir, beautify our character."},
  {n:15, ar:"الْغَفَّارُ", tr:"Al-Ghaffar", en:"The Forgiver", desc:"The One who repeatedly forgives sins.", dua:"O Ghaffar, forgive our sins and cover our faults."},
  {n:16, ar:"الْقَهَّارُ", tr:"Al-Qahhar", en:"The Subduer", desc:"The One who dominates and controls all.", dua:"O Qahhar, subdue our egos and desires."},
  {n:17, ar:"الْوَهَّابُ", tr:"Al-Wahhab", en:"The Giver", desc:"The One who gives freely without expecting return.", dua:"O Wahhab, grant us beneficial knowledge and provision."},
  {n:18, ar:"الرَّزَّاقُ", tr:"Ar-Razzaq", en:"The Provider", desc:"The One who provides for all creation.", dua:"O Razzaq, provide for us from halal sources."},
  {n:19, ar:"الْفَتَّاحُ", tr:"Al-Fattah", en:"The Opener", desc:"The One who opens doors of mercy and provision.", dua:"O Fattah, open for us the doors of goodness."},
  {n:20, ar:"الْعَلِيمُ", tr:"Al-Alim", en:"The All-Knowing", desc:"The One with perfect knowledge of all things.", dua:"O Alim, grant us beneficial knowledge."},
  {n:21, ar:"الْقَابِضُ", tr:"Al-Qabid", en:"The Withholder", desc:"The One who restricts provisions as He wills.", dua:"O Qabid, protect us from greed and excess."},
  {n:22, ar:"الْبَاسِطُ", tr:"Al-Basit", en:"The Expander", desc:"The One who expands provisions and hearts.", dua:"O Basit, expand our hearts with faith and wisdom."},
  {n:23, ar:"الْخَافِضُ", tr:"Al-Khafid", en:"The Abaser", desc:"The One who lowers and humbles whom He wills.", dua:"O Khafid, keep us away from arrogance and pride."},
  {n:24, ar:"الرَّافِعُ", tr:"Ar-Rafi", en:"The Exalter", desc:"The One who raises and honors whom He wills.", dua:"O Rafi, raise our status in this life and the next."},
  {n:25, ar:"الْمُعِزُّ", tr:"Al-Mu'izz", en:"The Honorer", desc:"The One who grants honor and dignity.", dua:"O Mu'izz, grant us honor through our faith in You."},
  {n:26, ar:"الْمُذِلُّ", tr:"Al-Mudhill", en:"The Dishonorer", desc:"The One who humiliates the arrogant.", dua:"O Mudhill, humiliate those who oppose Your religion."},
  {n:27, ar:"السَّمِيعُ", tr:"As-Sami", en:"The All-Hearing", desc:"The One who hears all voices and prayers.", dua:"O Sami, hear our prayers and answer our calls."},
  {n:28, ar:"الْبَصِيرُ", tr:"Al-Basir", en:"The All-Seeing", desc:"The One who sees all things, visible and hidden.", dua:"O Basir, guide our sight towards what pleases You."},
  {n:29, ar:"الْحَكَمُ", tr:"Al-Hakam", en:"The Judge", desc:"The One who judges with perfect justice.", dua:"O Hakam, judge between us with truth and justice."},
  {n:30, ar:"الْعَدْلُ", tr:"Al-Adl", en:"The Just", desc:"The One who is perfectly just in all matters.", dua:"O Adl, establish justice in our hearts and societies."},
  {n:31, ar:"اللَّطِيفُ", tr:"Al-Latif", en:"The Subtle", desc:"The One who knows the finest details of all matters.", dua:"O Latif, be kind and gentle with us in all affairs."},
  {n:32, ar:"الْخَبِيرُ", tr:"Al-Khabir", en:"The All-Aware", desc:"The One who is fully aware of everything.", dua:"O Khabir, make us aware of our own shortcomings."},
  {n:33, ar:"الْحَلِيمُ", tr:"Al-Halim", en:"The Forbearing", desc:"The One who is patient and does not punish immediately.", dua:"O Halim, forgive our mistakes and grant us time to repent."},
  {n:34, ar:"الْعَظِيمُ", tr:"Al-Azim", en:"The Magnificent", desc:"The One with absolute greatness and majesty.", dua:"O Azim, fill our hearts with awe and reverence for You."},
  {n:35, ar:"الْغَفُورُ", tr:"Al-Ghafur", en:"The Forgiving", desc:"The One who forgives abundantly.", dua:"O Ghafur, forgive our sins and conceal our faults."},
  {n:36, ar:"الشَّكُورُ", tr:"Ash-Shakur", en:"The Appreciative", desc:"The One who rewards abundantly for small deeds.", dua:"O Shakur, accept our good deeds and multiply our rewards."},
  {n:37, ar:"الْعَلِيُّ", tr:"Al-Aliyy", en:"The Most High", desc:"The One who is exalted above all creation.", dua:"O Aliyy, raise us to the highest ranks of Paradise."},
  {n:38, ar:"الْكَبِيرُ", tr:"Al-Kabir", en:"The Greatest", desc:"The One who is greater than everything.", dua:"O Kabir, make us recognize Your greatness in all things."},
  {n:39, ar:"الْحَفِيظُ", tr:"Al-Hafiz", en:"The Preserver", desc:"The One who preserves all things from corruption.", dua:"O Hafiz, preserve our faith and protect our good deeds."},
  {n:40, ar:"الْمُقِيتُ", tr:"Al-Muqit", en:"The Nourisher", desc:"The One who provides sustenance to all beings.", dua:"O Muqit, nourish our souls with faith and obedience."},
  {n:41, ar:"الْحَسِيبُ", tr:"Al-Hasib", en:"The Reckoner", desc:"The One who takes account of all actions.", dua:"O Hasib, give us an easy reckoning on Judgment Day."},
  {n:42, ar:"الْجَلِيلُ", tr:"Al-Jalil", en:"The Majestic", desc:"The One with absolute majesty and glory.", dua:"O Jalil, fill our hearts with love for Your majesty."},
  {n:43, ar:"الْكَرِيمُ", tr:"Al-Karim", en:"The Generous", desc:"The One who gives abundantly without limit.", dua:"O Karim, shower us with Your generosity and kindness."},
  {n:44, ar:"الرَّقِيبُ", tr:"Ar-Raqib", en:"The Watchful", desc:"The One who watches over all actions.", dua:"O Raqib, make us mindful that You are always watching."},
  {n:45, ar:"الْمُجِيبُ", tr:"Al-Mujib", en:"The Responsive", desc:"The One who answers prayers and supplications.", dua:"O Mujib, answer our prayers and fulfill our needs."},
  {n:46, ar:"الْوَاسِعُ", tr:"Al-Wasi", en:"The All-Encompassing", desc:"The One whose mercy and knowledge encompass everything.", dua:"O Wasi, encompass us with Your mercy and forgiveness."},
  {n:47, ar:"الْحَكِيمُ", tr:"Al-Hakim", en:"The Wise", desc:"The One whose wisdom is perfect in all matters.", dua:"O Hakim, grant us wisdom in our decisions and actions."},
  {n:48, ar:"الْوَدُودُ", tr:"Al-Wadud", en:"The Loving", desc:"The One who loves His righteous servants.", dua:"O Wadud, fill our hearts with love for You and for the believers."},
  {n:49, ar:"الْمَجِيدُ", tr:"Al-Majid", en:"The Glorious", desc:"The One with perfect glory and honor.", dua:"O Majid, honor us with Your presence in Paradise."},
  {n:50, ar:"الْبَاعِثُ", tr:"Al-Ba'ith", en:"The Resurrector", desc:"The One who will resurrect all creation for judgment.", dua:"O Ba'ith, raise us with the righteous on Judgment Day."},
  {n:51, ar:"الشَّهِيدُ", tr:"Ash-Shahid", en:"The Witness", desc:"The One who witnesses all things.", dua:"O Shahid, be a witness for us on the Day of Judgment."},
  {n:52, ar:"الْحَقُّ", tr:"Al-Haqq", en:"The Truth", desc:"The One whose existence is absolute truth.", dua:"O Haqq, guide us to the truth and keep us firm upon it."},
  {n:53, ar:"الْوَكِيلُ", tr:"Al-Wakil", en:"The Trustee", desc:"The One to trust for all affairs.", dua:"O Wakil, we place our trust in You for all our affairs."},
  {n:54, ar:"الْقَوِيُّ", tr:"Al-Qawiyy", en:"The Strong", desc:"The One with absolute strength and power.", dua:"O Qawiyy, strengthen our faith and our bodies in Your worship."},
  {n:55, ar:"الْمَتِينُ", tr:"Al-Matin", en:"The Firm", desc:"The One whose strength is unshakeable.", dua:"O Matin, make our faith firm and unshakeable."},
  {n:56, ar:"الْوَلِيُّ", tr:"Al-Waliyy", en:"The Protecting Friend", desc:"The One who is the ally of the believers.", dua:"O Waliyy, be our protector and guide us on the straight path."},
  {n:57, ar:"الْحَمِيدُ", tr:"Al-Hamid", en:"The Praiseworthy", desc:"The One who deserves all praise.", dua:"O Hamid, make us among those who constantly praise You."},
  {n:58, ar:"الْمُحْصِي", tr:"Al-Muhsi", en:"The Reckoner", desc:"The One who counts all things.", dua:"O Muhsi, count our good deeds and forgive our sins."},
  {n:59, ar:"الْمُبْدِئُ", tr:"Al-Mubdi", en:"The Originator", desc:"The One who begins creation.", dua:"O Mubdi, begin for us a new page of forgiveness."},
  {n:60, ar:"الْمُعِيدُ", tr:"Al-Mu'id", en:"The Restorer", desc:"The One who restores creation after death.", dua:"O Mu'id, restore our faith and bring us back to You."},
  {n:61, ar:"الْمُحْيِي", tr:"Al-Muhyi", en:"The Giver of Life", desc:"The One who gives life to all beings.", dua:"O Muhyi, give life to our hearts with faith and knowledge."},
  {n:62, ar:"الْمُمِيتُ", tr:"Al-Mumit", en:"The Taker of Life", desc:"The One who causes death at the appointed time.", dua:"O Mumit, let us die in a state of faith and submission."},
  {n:63, ar:"الْحَيُّ", tr:"Al-Hayy", en:"The Ever-Living", desc:"The One who is eternally alive.", dua:"O Hayy, keep our hearts alive with love for You."},
  {n:64, ar:"الْقَيُّومُ", tr:"Al-Qayyum", en:"The Self-Sustaining", desc:"The One who sustains all creation.", dua:"O Qayyum, sustain us with Your mercy and provision."},
  {n:65, ar:"الْوَاجِدُ", tr:"Al-Wajid", en:"The Finder", desc:"The One who finds all things.", dua:"O Wajid, find us in our moments of need and respond to us."},
  {n:66, ar:"الْمَاجِدُ", tr:"Al-Majid", en:"The Noble", desc:"The One with perfect nobility and generosity.", dua:"O Majid, honor us with Your noble company in Paradise."},
  {n:67, ar:"الْوَاحِدُ", tr:"Al-Wahid", en:"The One", desc:"The One who is unique and indivisible.", dua:"O Wahid, unite our hearts upon Your worship alone."},
  {n:68, ar:"الْأَحَدُ", tr:"Al-Ahad", en:"The Only One", desc:"The One who has no partners or equals.", dua:"O Ahad, make us sincere in our worship of You alone."},
  {n:69, ar:"الصَّمَدُ", tr:"As-Samad", en:"The Eternal Refuge", desc:"The One upon whom all depend.", dua:"O Samad, free us from needing anyone but You."},
  {n:70, ar:"الْقَادِرُ", tr:"Al-Qadir", en:"The Able", desc:"The One who has power over all things.", dua:"O Qadir, give us the ability to do what pleases You."},
  {n:71, ar:"الْمُقْتَدِرُ", tr:"Al-Muqtadir", en:"The All-Determined", desc:"The One who has absolute power and authority.", dua:"O Muqtadir, determine for us what is best for our faith."},
  {n:72, ar:"الْمُقَدِّمُ", tr:"Al-Muqaddim", en:"The Expediter", desc:"The One who brings forward what He wills.", dua:"O Muqaddim, bring us forward to Your mercy and forgiveness."},
  {n:73, ar:"الْمُؤَخِّرُ", tr:"Al-Mu'akhkhir", en:"The Delayer", desc:"The One who delays what He wills.", dua:"O Mu'akhkhir, delay our punishment and grant us time to repent."},
  {n:74, ar:"الْأَوَّلُ", tr:"Al-Awwal", en:"The First", desc:"The One who was before all things.", dua:"O Awwal, there is nothing before You. Forgive us."},
  {n:75, ar:"الْآخِرُ", tr:"Al-Akhir", en:"The Last", desc:"The One who remains after all things.", dua:"O Akhir, You are our final destination. Grant us goodness."},
  {n:76, ar:"الظَّاهِرُ", tr:"Az-Zahir", en:"The Manifest", desc:"The One whose existence is evident.", dua:"O Zahir, make Your signs manifest in our lives."},
  {n:77, ar:"الْبَاطِنُ", tr:"Al-Batin", en:"The Hidden", desc:"The One who is hidden from human perception.", dua:"O Batin, reveal to us the hidden realities of faith."},
  {n:78, ar:"الْوَالِي", tr:"Al-Wali", en:"The Governor", desc:"The One who manages all affairs.", dua:"O Wali, take charge of our affairs and guide us rightly."},
  {n:79, ar:"الْمُتَعَالِي", tr:"Al-Muta'ali", en:"The Exalted", desc:"The One who is exalted above all imperfections.", dua:"O Muta'ali, exalt our status through our devotion to You."},
  {n:80, ar:"الْبَرُّ", tr:"Al-Barr", en:"The Beneficent", desc:"The One who is kind and good to His creation.", dua:"O Barr, be kind and merciful to us on the Day of Judgment."},
  {n:81, ar:"التَّوَّابُ", tr:"At-Tawwab", en:"The Acceptor of Repentance", desc:"The One who accepts repentance repeatedly.", dua:"O Tawwab, accept our repentance and turn to us with mercy."},
  {n:82, ar:"الْمُنْتَقِمُ", tr:"Al-Muntaqim", en:"The Avenger", desc:"The One who punishes the wrongdoers.", dua:"O Muntaqim, protect us from being among the wrongdoers."},
  {n:83, ar:"الْعَفُوُّ", tr:"Al-Afuw", en:"The Pardoner", desc:"The One who pardons and overlooks sins.", dua:"O Afuw, pardon our sins and wipe away our misdeeds."},
  {n:84, ar:"الرَّؤُوفُ", tr:"Ar-Ra'uf", en:"The Compassionate", desc:"The One with intense mercy and kindness.", dua:"O Ra'uf, show us Your compassion in this life and the next."},
  {n:85, ar:"مَالِكُ الْمُلْكِ", tr:"Malik-ul-Mulk", en:"The Owner of Sovereignty", desc:"The One who owns all dominion.", dua:"O Malik-ul-Mulk, grant us honor in this world and the next."},
  {n:86, ar:"ذُو الْجَلَالِ وَالْإِكْرَامِ", tr:"Dhu-al-Jalal wa-al-Ikram", en:"The Lord of Majesty and Generosity", desc:"The One with absolute majesty and boundless generosity.", dua:"O Dhu-al-Jalal wa-al-Ikram, honor us with Your majesty."},
  {n:87, ar:"الْمُقْسِطُ", tr:"Al-Muqsit", en:"The Equitable", desc:"The One who acts with perfect justice.", dua:"O Muqsit, establish justice in our hearts and societies."},
  {n:88, ar:"الْجَامِعُ", tr:"Al-Jami", en:"The Gatherer", desc:"The One who will gather all creation for judgment.", dua:"O Jami, gather us with the righteous on Judgment Day."},
  {n:89, ar:"الْغَنِيُّ", tr:"Al-Ghaniyy", en:"The Self-Sufficient", desc:"The One who is free of all needs.", dua:"O Ghaniyy, make us independent of all creation."},
  {n:90, ar:"الْمُغْنِي", tr:"Al-Mughni", en:"The Enricher", desc:"The One who enriches whom He wills.", dua:"O Mughni, enrich our hearts with faith and contentment."},
  {n:91, ar:"الْمَانِعُ", tr:"Al-Mani", en:"The Preventer", desc:"The One who prevents what He wills.", dua:"O Mani, prevent us from falling into sin and error."},
  {n:92, ar:"الضَّارُ", tr:"Ad-Darr", en:"The Distressor", desc:"The One who causes harm as He wills.", dua:"O Darr, protect us from harm and distress."},
  {n:93, ar:"النَّافِعُ", tr:"An-Nafi", en:"The Benefiter", desc:"The One who brings benefit as He wills.", dua:"O Nafi, benefit us with Your knowledge and mercy."},
  {n:94, ar:"النُّورُ", tr:"An-Nur", en:"The Light", desc:"The One who is the light of the heavens and earth.", dua:"O Nur, illuminate our hearts with faith and guidance."},
  {n:95, ar:"الْهَادِي", tr:"Al-Hadi", en:"The Guide", desc:"The One who guides whom He wills.", dua:"O Hadi, guide us to the straight path of Islam."},
  {n:96, ar:"الْبَدِيعُ", tr:"Al-Badi", en:"The Incomparable", desc:"The One who creates without any model.", dua:"O Badi, create for us a good ending to our lives."},
  {n:97, ar:"الْبَاقِي", tr:"Al-Baqi", en:"The Everlasting", desc:"The One who remains forever.", dua:"O Baqi, make our good deeds everlasting in Your sight."},
  {n:98, ar:"الْوَارِثُ", tr:"Al-Warith", en:"The Inheritor", desc:"The One who inherits all things.", dua:"O Warith, let us inherit the gardens of Paradise."},
  {n:99, ar:"الرَّشِيدُ", tr:"Ar-Rashid", en:"The Guide to Right Path", desc:"The One who guides to the right path.", dua:"O Rashid, keep us firm on the path of guidance until we meet You."},
];

const MOODS = [
  {id:"anxious",  emoji:"😰",name:"Anxious",    desc:"Worry & fear"},
  {id:"sad",      emoji:"😢",name:"Sad",         desc:"Grief & sorrow"},
  {id:"grateful", emoji:"🤲",name:"Grateful",    desc:"Thankfulness"},
  {id:"lost",     emoji:"🌀",name:"Lost",         desc:"Need guidance"},
  {id:"hopeful",  emoji:"🌟",name:"Hopeful",     desc:"Optimism"},
  {id:"angry",    emoji:"😤",name:"Angry",       desc:"Need calm"},
  {id:"lonely",   emoji:"🌙",name:"Lonely",      desc:"Seeking comfort"},
  {id:"motivated",emoji:"💪",name:"Motivated",   desc:"Drive & purpose"},
  {id:"sinful",   emoji:"💧",name:"Repentant",   desc:"Seeking forgiveness"},
  {id:"stressed", emoji:"😓",name:"Stressed",    desc:"Overwhelmed"},
];

const TOPICS_LIST = [
  {emoji:"⏳",name:"patience and perseverance"},
  {emoji:"🤲",name:"gratitude and thankfulness"},
  {emoji:"💚",name:"forgiveness and mercy"},
  {emoji:"📖",name:"seeking knowledge and wisdom"},
  {emoji:"🕊️",name:"trust in Allah tawakkul"},
  {emoji:"🕌",name:"prayer and worship"},
  {emoji:"✨",name:"good character and manners"},
  {emoji:"🌅",name:"hope and optimism"},
  {emoji:"👨‍👩‍👧",name:"family and relationships"},
  {emoji:"💧",name:"repentance and forgiveness"},
  {emoji:"🌈",name:"hardship and relief"},
  {emoji:"🌙",name:"death and afterlife"},
  {emoji:"💝",name:"generosity and charity"},
  {emoji:"⚖️",name:"justice and truth"},
  {emoji:"❤️",name:"love and compassion"},
];

const SUGGS = [
  "patience during hardship","gratitude and thankfulness",
  "forgiveness and mercy","seeking knowledge","trust in Allah",
  "good character","hope after difficulty","love and compassion",
];

// ── STYLES ────────────────────────────────────────────────────────────────────
const S = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;700&family=Playfair+Display:ital,wght@0,500;0,700;1,400;1,600&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ink:#1A1C1E;
  --ink2:#2A2D30;
  --ink3:#3A3D40;
  --card:#2F3236;
  --card2:#3B3F44;
  --white:#FFFFFF;
  --white-off:#F5F7FA;
  --emerald:#10B981;
  --emerald-l:#34D399;
  --emerald-xl:#6EE7B7;
  --emerald-d:#059669;
  --emerald-bg:rgba(16,185,129,.1);
  --gold:#F59E0B;
  --gold-l:#FBBF24;
  --gold-xl:#FCD34D;
  --gold-d:#D97706;
  --gold-bg:rgba(245,158,11,.08);
  --rose:#9F1239;
  --rose-l:#BE185D;
  --rose-bg:rgba(159,18,57,.08);
  --sky:#0369A1;
  --sky-l:#0284C7;
  --sky-bg:rgba(3,105,161,.09);
  --text:#F9FAFB;
  --t2:#D1D5DB;
  --t3:#9CA3AF;
  --t4:#6B7280;
  --border:rgba(16,185,129,.2);
  --border-h:rgba(16,185,129,.4);
  --shadow:0 8px 40px rgba(0,0,0,.5);
  --shadow-t:0 4px 20px rgba(16,185,129,.2);
  --r:14px;
}
body{background:var(--ink);color:var(--text);font-family:'DM Sans',sans-serif;line-height:1.55;min-height:100vh;overflow-x:hidden}
button,input,textarea{font-family:'DM Sans',sans-serif}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:var(--ink)}
::-webkit-scrollbar-thumb{background:var(--border-h);border-radius:2px}

.scene{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.scene::before{content:'';position:absolute;inset:0;
  background:
    radial-gradient(ellipse 70% 55% at 5% 8%, rgba(16,185,129,.08) 0%,transparent 55%),
    radial-gradient(ellipse 60% 50% at 95% 92%, rgba(245,158,11,.06) 0%,transparent 55%),
    radial-gradient(ellipse 45% 45% at 50% 50%, rgba(16,185,129,.03) 0%,transparent 65%)}
.grid{position:absolute;inset:0;opacity:.02;
  background-image:linear-gradient(rgba(16,185,129,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,.8) 1px,transparent 1px);
  background-size:64px 64px}

.shell{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column}

/* NAV */
.nav{
  display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;
  padding:14px 36px;border-bottom:1px solid var(--border);
  background:rgba(26,28,30,.95);backdrop-filter:blur(24px);
  position:sticky;top:0;z-index:200
}
.mobile-toggle{display:none;align-items:center;justify-content:center;width:40px;height:40px;border-radius:9px;border:1px solid var(--border);background:transparent;color:var(--t2);cursor:pointer}
.mobile-toggle:hover{border-color:var(--border-h);color:var(--text)}
.mobile-search-btn{display:none;align-items:center;justify-content:center;width:40px;height:40px;border-radius:9px;border:1px solid var(--border);background:transparent;color:var(--t2);cursor:pointer}
.mobile-search-btn:hover{border-color:var(--border-h);color:var(--text)}
.mobile-menu{display:none;width:100%;order:4}
.mobile-menu.open{display:block;background:var(--ink2);border:1px solid var(--border);border-radius:16px;padding:12px;z-index:210;box-shadow:var(--shadow)}
.mobile-menu .tab-btn{display:flex;width:100%;text-align:left;padding:11px 14px;border-radius:10px;margin-bottom:6px;justify-content:flex-start}
.mobile-search{display:none;padding:10px}
.mobile-search.show{display:block;padding:12px}
.logo{display:flex;align-items:center;gap:11px;cursor:pointer;text-decoration:none}
.logo-gem{
  width:36px;height:36px;border-radius:10px;flex-shrink:0;
  background:linear-gradient(135deg,var(--emerald-d),var(--emerald));
  display:flex;align-items:center;justify-content:center;
  font-family:'Amiri',serif;font-size:16px;color:var(--ink);font-weight:700;
  box-shadow:0 4px 14px rgba(16,185,129,.3)
}
.logo-text{font-size:17px;font-weight:700;color:var(--emerald-xl);letter-spacing:.3px}
.logo-sub{font-size:9px;color:var(--t3);font-weight:400;letter-spacing:.5px;text-transform:uppercase;margin-top:1px}
.tabs{display:flex;gap:8px;flex-wrap:wrap;align-items:center;background:transparent;border-radius:0;padding:0}
.tab-btn{
  padding:9px 14px;border-radius:999px;border:1px solid transparent;background:rgba(255,255,255,.02);
  color:var(--t2);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap
}
.tab-btn:hover{color:var(--text);border-color:var(--border-h);background:rgba(255,255,255,.04)}
.tab-btn.on{background:linear-gradient(135deg,var(--emerald-d),var(--emerald));color:var(--white);font-weight:800;border-color:transparent}
.nav-main{display:flex;align-items:center;gap:18px;min-width:0;flex:1}
.nav-brand{display:flex;align-items:center;gap:11px;min-width:0;cursor:pointer}
.nav-brand-copy{display:flex;flex-direction:column;min-width:0}
.nav-title-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.nav-kicker{padding:4px 9px;border-radius:999px;background:var(--emerald-bg);border:1px solid var(--border-h);font-size:9px;font-weight:700;color:var(--emerald-xl);text-transform:uppercase;letter-spacing:1.2px}
.nav-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.nav-stat{min-width:84px;padding:8px 10px;border-radius:12px;text-align:center;background:rgba(255,255,255,.02);border:1px solid var(--border)}
.nav-stat-n{font-size:15px;font-weight:800;color:var(--emerald-xl);line-height:1}
.nav-stat-l{font-size:8px;color:var(--t3);text-transform:uppercase;letter-spacing:1.4px;margin-top:4px}
.nav-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.mobile-shell-actions{display:none}
.streak-badge{
  display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;
  background:linear-gradient(135deg,rgba(245,158,11,.15),rgba(252,211,77,.08));
  border:1px solid rgba(245,158,11,.3);cursor:pointer;transition:all .2s
}
.streak-badge:hover{border-color:var(--gold-l)}
.streak-fire{font-size:16px}
.streak-num{font-size:14px;font-weight:800;color:var(--gold-xl)}
.streak-lbl{font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px}
.user-btn{
  display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:20px;
  background:var(--card2);border:1px solid var(--border);cursor:pointer;transition:all .2s
}
.user-btn:hover{border-color:var(--border-h)}
.user-avatar{
  width:28px;height:28px;border-radius:50%;
  background:linear-gradient(135deg,var(--emerald-d),var(--emerald));
  display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--white)
}
.user-name-sm{font-size:12px;font-weight:600;color:var(--t2)}

/* PAGE */
.app-body{display:flex;gap:18px;align-items:flex-start;flex:1;max-width:1440px;width:100%;margin:0 auto;padding:18px 18px 72px}
.side-dash{
  position:sticky;top:88px;align-self:flex-start;flex-shrink:0;
  width:74px;min-height:calc(100vh - 120px);padding:12px;
  border:1px solid var(--border);border-radius:22px;
  background:rgba(42,45,48,.9);backdrop-filter:blur(18px);
  box-shadow:0 10px 28px rgba(0,0,0,.25);transition:width .24s ease,padding .24s ease
}
.side-dash.open{width:250px;padding:14px}
.home-corner{
  width:100%;display:flex;align-items:center;gap:10px;border:none;cursor:pointer;
  border-radius:16px;background:linear-gradient(135deg,rgba(16,185,129,.16),rgba(16,185,129,.06));
  color:var(--text);padding:12px 12px;border:1px solid var(--border);transition:all .2s
}
.home-corner:hover{border-color:var(--border-h);background:rgba(16,185,129,.12)}
.home-corner-ico{
  width:40px;height:40px;border-radius:14px;flex-shrink:0;
  background:linear-gradient(135deg,var(--emerald-d),var(--emerald));color:var(--white);
  display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px
}
.home-corner-copy{display:none;flex-direction:column;align-items:flex-start;min-width:0}
.side-dash.open .home-corner-copy{display:flex}
.home-corner-t{font-size:13px;font-weight:800;line-height:1.1}
.home-corner-s{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:1.2px;margin-top:3px}
.side-pages{display:none;flex-direction:column;gap:8px;margin-top:14px}
.side-dash.open .side-pages{display:flex}
.side-page{
  width:100%;display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:14px;
  border:1px solid transparent;background:rgba(255,255,255,.02);color:var(--t2);cursor:pointer;transition:all .2s;text-align:left
}
.side-page:hover{border-color:var(--border-h);color:var(--text);background:rgba(255,255,255,.04)}
.side-page.on{background:linear-gradient(135deg,var(--emerald-d),var(--emerald));color:var(--white);font-weight:800;border-color:transparent}
.side-page-ico{width:28px;height:28px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.04);flex-shrink:0}
.side-page-txt{font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.side-dash:not(.open) .side-page-txt{display:none}
.page{flex:1;min-width:0;padding:0 0 72px;max-width:1140px;width:100%;margin:0;animation:fUp .4s ease both}

/* HERO */
.hero{text-align:center;padding:68px 0 44px}
.bism{
  font-family:'Amiri',serif;font-size:30px;color:var(--emerald-xl);
  opacity:.7;direction:rtl;margin-bottom:28px;letter-spacing:2px;
  text-shadow:0 0 40px rgba(110,231,183,.2)
}
.hero-badge{
  display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:20px;
  background:var(--emerald-bg);border:1px solid var(--border-h);
  font-size:11px;font-weight:700;color:var(--emerald-xl);
  margin-bottom:22px;letter-spacing:1px;text-transform:uppercase
}
.hero-h1{
  font-family:'Playfair Display',serif;
  font-size:clamp(38px,6.5vw,70px);font-weight:700;line-height:1.08;margin-bottom:18px;
  color:var(--text)
}
.hero-h1 em{font-style:italic;color:var(--emerald-xl)}
.hero-p{font-size:16px;color:var(--t2);max-width:520px;margin:0 auto 48px;line-height:1.8;font-weight:300}

/* SEARCH */
.s-outer{width:100%;max-width:720px;margin:0 auto}
.s-box{
  display:flex;align-items:center;gap:12px;
  background:var(--card2);border:1.5px solid var(--border);border-radius:16px;
  padding:13px 18px;transition:all .25s;box-shadow:var(--shadow)
}
.s-box:focus-within{border-color:var(--border-h);box-shadow:0 0 0 4px rgba(16,185,129,.09),var(--shadow)}
.s-ico{font-size:20px;color:var(--emerald-d);flex-shrink:0}
.s-in{flex:1;background:none;border:none;outline:none;color:var(--text);font-size:16px;font-weight:400}
.s-in::placeholder{color:var(--t3)}
.voice-btn{
  width:38px;height:38px;border-radius:9px;border:1px solid var(--border);
  background:transparent;color:var(--t2);font-size:16px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s
}
.voice-btn:hover{border-color:var(--border-h);color:var(--text)}
.voice-btn.on{background:var(--emerald-bg);border-color:var(--emerald-d);color:var(--emerald-xl);animation:pulse 1.2s ease infinite}
.go-btn{
  background:linear-gradient(135deg,var(--emerald-d),var(--emerald));
  border:none;border-radius:10px;padding:10px 24px;
  color:var(--white);font-size:13px;font-weight:700;flex-shrink:0;
  cursor:pointer;transition:all .2s;letter-spacing:.3px
}
.go-btn:hover{transform:translateY(-1px);box-shadow:var(--shadow-t)}
.go-btn:disabled{opacity:.4;transform:none;cursor:not-allowed}
.filtrs{display:flex;gap:7px;margin-top:13px;justify-content:center;flex-wrap:wrap}
.f-btn{
  padding:6px 16px;border-radius:20px;border:1px solid var(--border);
  background:transparent;color:var(--t2);font-size:12px;font-weight:500;transition:all .2s;cursor:pointer
}
.f-btn:hover{border-color:var(--border-h);color:var(--text)}
.f-btn.on{background:var(--emerald-bg);border-color:var(--emerald-d);color:var(--emerald-xl);font-weight:600}

/* MOOD DETECT BANNER */
.mood-detect{
  display:flex;align-items:center;gap:12px;padding:12px 18px;border-radius:12px;
  background:linear-gradient(135deg,rgba(16,185,129,.12),rgba(245,158,11,.07));
  border:1px solid rgba(16,185,129,.25);margin-bottom:14px;animation:fUp .35s ease
}
.md-emoji{font-size:22px}
.md-info{flex:1}
.md-lbl{font-size:9px;color:var(--t3);letter-spacing:1.5px;text-transform:uppercase}
.md-val{font-size:13px;color:var(--emerald-xl);font-weight:600}
.md-btn{
  padding:6px 14px;border-radius:8px;border:1px solid rgba(16,185,129,.3);
  background:var(--emerald-bg);color:var(--emerald-xl);font-size:11px;font-weight:700;
  cursor:pointer;white-space:nowrap;transition:all .2s
}
.md-btn:hover{background:rgba(16,185,129,.2)}

.expand-row{margin-top:12px;animation:fUp .4s .15s ease both}
.expand-lbl{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--t3);margin-bottom:8px}
.expand-chips{display:flex;flex-wrap:wrap;gap:6px}
.exp-chip{
  padding:5px 13px;border-radius:20px;border:1px solid var(--emerald-d);
  background:var(--emerald-bg);color:var(--emerald-xl);font-size:11px;font-weight:500;
  cursor:pointer;transition:all .2s
}
.exp-chip:hover{background:rgba(16,185,129,.2)}

.chips-wrap{margin-top:34px;text-align:center}
.chips-lbl{font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:2px;margin-bottom:13px}
.chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.chip{
  padding:7px 17px;border-radius:20px;border:1px solid var(--border);
  background:rgba(255,255,255,.018);color:var(--t2);font-size:12px;cursor:pointer;transition:all .2s
}
.chip:hover{border-color:var(--border-h);color:var(--text);background:var(--emerald-bg)}

/* MODULES */
.modules{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:52px}
.mod-card{
  background:var(--card2);border:1px solid var(--border);border-radius:16px;
  padding:22px;cursor:pointer;transition:all .25s;position:relative;overflow:hidden
}
.mod-card::before{
  content:'';position:absolute;inset:0;opacity:0;transition:opacity .3s;
  background:linear-gradient(135deg,var(--emerald-bg),transparent)
}
.mod-card:hover{border-color:var(--border-h);transform:translateY(-3px);box-shadow:var(--shadow-t)}
.mod-card:hover::before{opacity:1}
.mod-card.full{grid-column:span 2}
.mod-ico{font-size:30px;margin-bottom:12px}
.mod-name{font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px}
.mod-desc{font-size:12px;color:var(--t2);line-height:1.65}
.mod-arrow{
  display:inline-flex;align-items:center;gap:5px;margin-top:12px;
  font-size:11px;font-weight:600;color:var(--emerald-l);
  border:none;background:transparent;cursor:pointer;padding:0
}

/* MOOD SHORTCUTS */
.mood-quick{margin-top:52px}
.sec-title{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:2px;margin-bottom:18px;text-align:center}
.mood-row{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.mood-mini{
  background:var(--card2);border:1px solid var(--border);border-radius:14px;
  padding:16px 12px;text-align:center;transition:all .22s;cursor:pointer
}
.mood-mini:hover{border-color:var(--border-h);transform:translateY(-2px);box-shadow:var(--shadow-t)}
.mm-emoji{font-size:26px;margin-bottom:7px}
.mm-name{font-size:11px;font-weight:600;color:var(--t2);text-transform:capitalize}

/* DAILY PREVIEW */
.daily-preview{
  margin-top:52px;padding:28px;border-radius:16px;
  background:linear-gradient(135deg,rgba(16,185,129,.07),rgba(245,158,11,.04));
  border:1px solid var(--border);cursor:pointer;transition:all .2s
}
.daily-preview:hover{border-color:var(--border-h)}
.dp-label{font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--emerald-xl);margin-bottom:14px;font-weight:700}
.dp-arabic{
  font-family:'Amiri',serif;font-size:22px;direction:rtl;text-align:right;
  color:var(--text);line-height:1.9;margin-bottom:12px;padding:14px 18px;
  background:rgba(16,185,129,.04);border-radius:9px;border-right:3px solid var(--emerald-d)
}
.dp-english{font-size:14px;color:var(--t2);line-height:1.7;font-style:italic;margin-bottom:10px}
.dp-ref{font-size:11px;color:var(--t3)}
.dp-cta{font-size:11px;color:var(--emerald-l);font-weight:600;margin-top:14px;display:flex;align-items:center;gap:5px;border:none;background:transparent;cursor:pointer;padding:0}

/* RESULTS */
.results-hd{
  display:flex;align-items:center;justify-content:space-between;
  padding:22px 0 18px;border-bottom:1px solid var(--border);margin-bottom:20px
}
.r-count{font-size:13px;color:var(--t2)}
.r-count strong{color:var(--emerald-xl);font-size:15px;font-weight:700}
.r-qry{font-size:12px;color:var(--t3);font-style:italic}

/* RESULT CARD */
.rc{
  background:var(--card);border:1px solid var(--border);border-radius:var(--r);
  padding:24px;margin-bottom:14px;transition:all .25s;animation:fUp .4s ease both;
  position:relative;overflow:hidden
}
.rc::after{
  content:'';position:absolute;top:0;left:0;right:0;height:1.5px;
  background:linear-gradient(90deg,transparent,var(--emerald-d),transparent);
  opacity:0;transition:opacity .3s
}
.rc:hover{border-color:var(--border-h);transform:translateY(-2px);box-shadow:var(--shadow)}
.rc:hover::after{opacity:1}
.rc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:10px}
.rc-left{display:flex;align-items:center;gap:8px}
.badge{padding:3px 11px;border-radius:20px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px}
.bq{background:rgba(245,158,11,.1);color:var(--gold-xl);border:1px solid rgba(245,158,11,.2)}
.bh{background:var(--emerald-bg);color:var(--emerald-xl);border:1px solid rgba(16,185,129,.2)}
.rc-ref{font-size:12px;color:var(--t2);font-weight:600}
.score-pill{
  padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;
  background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.15);color:var(--emerald-xl)
}
.arabic-text{
  font-family:'Amiri',serif;font-size:23px;line-height:1.95;direction:rtl;text-align:right;
  color:var(--text);padding:16px 20px;background:rgba(16,185,129,.035);border-radius:10px;
  border-right:3px solid var(--emerald-d);margin-bottom:13px
}
.english-text{font-size:14px;line-height:1.75;color:var(--t2);margin-bottom:16px}


/* URDU TRANSLATION */
.urdu-panel{
  margin-top:11px;padding:14px 18px;border-radius:10px;
  background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.18);animation:fUp .3s ease
}
.urdu-hd{font-size:9px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:var(--emerald-xl);margin-bottom:9px}
.urdu-text{
  font-family:'Noto Nastaliq Urdu','Amiri',serif;font-size:17px;
  line-height:2.2;direction:rtl;text-align:right;color:var(--text)
}

.rc-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
.book{font-size:11px;color:var(--t3);font-style:italic}
.acts{display:flex;gap:5px;flex-wrap:wrap}
.act{
  padding:6px 12px;border-radius:7px;border:1px solid var(--border);background:transparent;
  color:var(--t2);font-size:11px;font-weight:500;cursor:pointer;transition:all .2s;
  display:flex;align-items:center;gap:4px
}
.act:hover{border-color:var(--border-h);color:var(--text);background:rgba(255,255,255,.025)}
.act.saved{color:var(--gold-xl);border-color:var(--gold-d);background:var(--gold-bg)}
.act.on{color:var(--emerald-xl);border-color:var(--emerald-d);background:var(--emerald-bg)}
.act.urdu-on{color:var(--emerald-xl);border-color:var(--emerald-d);background:var(--emerald-bg)}

/* AI PANELS */
.panel{margin-top:13px;padding:16px;border-radius:10px;animation:fUp .3s ease}
.why-panel{background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.18)}
.taf-panel{background:rgba(245,158,11,.05);border:1px solid rgba(245,158,11,.15)}
.sim-panel{background:rgba(3,105,161,.05);border:1px solid rgba(3,105,161,.15)}
.p-hd{font-size:9px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:9px}
.why-hd{color:var(--emerald-xl)}
.taf-hd{color:var(--gold-xl)}
.sim-hd{color:var(--sky-xl)}
.p-text{font-size:13px;color:var(--t2);line-height:1.7;white-space:pre-wrap}
.taf-q{
  width:100%;background:rgba(245,158,11,.04);border:1px solid rgba(245,158,11,.18);
  border-radius:8px;padding:9px 13px;margin-top:10px;
  color:var(--text);font-size:13px;outline:none;resize:none
}
.taf-q:focus{border-color:rgba(245,158,11,.4)}
.taf-ask{
  margin-top:7px;padding:7px 16px;border-radius:7px;border:1px solid var(--gold-d);
  background:var(--gold-bg);color:var(--gold-xl);
  font-size:12px;font-weight:600;cursor:pointer;transition:all .2s
}
.taf-ask:disabled{opacity:.45;cursor:not-allowed}

/* AUDIO */
.audio-wrap{
  display:flex;align-items:center;gap:10px;margin-top:13px;
  padding:12px 16px;border-radius:10px;
  background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.18)
}
.audio-lbl{font-size:10px;color:var(--emerald-xl);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;flex-shrink:0}
.audio-play{
  width:34px;height:34px;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg,var(--emerald-d),var(--emerald));
  border:none;color:var(--white);font-size:13px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;transition:all .2s
}
.audio-play:hover{transform:scale(1.08);box-shadow:var(--shadow-t)}
.audio-info{flex:1;font-size:11px;color:var(--t2)}
.audio-reciter{font-size:10px;color:var(--t3);margin-top:1px}
audio{display:none}
.sim-item{padding:10px 13px;background:var(--card2);border-radius:8px;margin-bottom:7px;border:1px solid var(--border);cursor:pointer;transition:all .2s}
.sim-item:hover{border-color:var(--border-h)}
.sim-ref{font-size:10px;color:var(--t3);margin-bottom:4px}
.sim-txt{font-size:12px;color:var(--t2);line-height:1.5}

/* CHATBOT */
.chatbot-container{
  position:fixed;bottom:24px;right:24px;z-index:1000;
}
.chat-toggle{
  width:56px;height:56px;border-radius:50%;
  background:linear-gradient(135deg,var(--emerald-d),var(--emerald));
  border:none;color:var(--white);font-size:24px;
  cursor:pointer;box-shadow:var(--shadow);transition:all .2s;
  display:flex;align-items:center;justify-content:center;
}
.chat-toggle:hover{transform:scale(1.08);}
.chat-window{
  position:fixed;bottom:90px;right:24px;
  width:380px;height:550px;
  background:var(--ink2);border:1px solid var(--border-h);
  border-radius:20px;display:flex;flex-direction:column;
  overflow:hidden;box-shadow:var(--shadow);animation:fUp .3s ease;
}
.chat-header{
  padding:16px;background:linear-gradient(135deg,var(--emerald-d),var(--emerald));
  color:var(--white);display:flex;justify-content:space-between;
  align-items:center;
}
.chat-header h3{font-size:16px;font-weight:700;margin:0;}
.chat-close{
  background:none;border:none;color:var(--white);font-size:20px;
  cursor:pointer;width:28px;height:28px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
}
.chat-close:hover{background:rgba(255,255,255,.2);}
.chat-messages{
  flex:1;overflow-y:auto;padding:16px;display:flex;
  flex-direction:column;gap:12px;
}
.chat-message{
  max-width:85%;padding:10px 14px;border-radius:14px;
  font-size:13px;line-height:1.5;
}
.chat-message.user{
  align-self:flex-end;background:var(--emerald-bg);
  border:1px solid var(--emerald-d);color:var(--text);
}
.chat-message.bot{
  align-self:flex-start;background:var(--card2);
  border:1px solid var(--border);color:var(--t2);
}
.chat-message.bot strong{color:var(--emerald-xl);}
.chat-input-area{
  display:flex;gap:10px;padding:12px;border-top:1px solid var(--border);
  background:var(--ink);
}
.chat-input{
  flex:1;padding:10px 14px;border-radius:20px;
  background:var(--card2);border:1px solid var(--border);
  color:var(--text);font-size:13px;outline:none;
}
.chat-input:focus{border-color:var(--border-h);}
.chat-send{
  padding:8px 18px;border-radius:20px;
  background:linear-gradient(135deg,var(--emerald-d),var(--emerald));
  border:none;color:var(--white);font-size:13px;font-weight:600;
  cursor:pointer;transition:all .2s;
}
.chat-send:hover{transform:translateY(-1px);}
.chat-send:disabled{opacity:.5;cursor:not-allowed;}
.chat-loading{
  display:flex;gap:4px;padding:8px 12px;background:var(--card2);
  border-radius:14px;width:fit-content;
}
.chat-loading span{
  width:6px;height:6px;border-radius:50%;
  background:var(--t3);animation:bounce 1.4s infinite ease-in-out both;
}
.chat-loading span:nth-child(1){animation-delay:-0.32s;}
.chat-loading span:nth-child(2){animation-delay:-0.16s;}
@keyframes bounce{0%,80%,100%{transform:scale(0);}40%{transform:scale(1);}}

/* JOURNEY MODAL */
.overlay{
  position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.85);backdrop-filter:blur(14px);
  display:flex;align-items:center;justify-content:center;padding:24px;animation:fIn .2s ease
}
.modal{
  background:var(--ink2);border:1px solid var(--border-h);border-radius:22px;
  width:100%;max-width:640px;max-height:88vh;overflow-y:auto;padding:32px;
  animation:sUp .3s ease;box-shadow:var(--shadow)
}
.modal-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}
.modal-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--emerald-xl)}
.modal-sub{font-size:12px;color:var(--t3);margin-top:4px}
.x-btn{
  width:34px;height:34px;border-radius:8px;border:1px solid var(--border);
  background:transparent;color:var(--t2);font-size:15px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0
}
.x-btn:hover{border-color:var(--border-h);color:var(--text)}
.j-step{display:flex;gap:14px;margin-bottom:22px;animation:fUp .4s ease both}
.j-track{display:flex;flex-direction:column;align-items:center;flex-shrink:0}
.j-dot{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}
.j-dot-1{background:rgba(110,231,183,.1);border:2px solid var(--emerald-d);color:var(--emerald-xl)}
.j-dot-2{background:rgba(245,158,11,.1);border:2px solid var(--gold-d);color:var(--gold-xl)}
.j-dot-3{background:rgba(16,185,129,.1);border:2px solid var(--emerald);color:var(--emerald-xl)}
.j-dot-4{background:rgba(125,211,252,.1);border:2px solid var(--sky);color:var(--sky-xl)}
.j-conn{flex:1;width:1px;background:var(--border);min-height:18px;margin:5px 0}
.j-body{flex:1}
.j-lbl{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;font-weight:700}
.j-card{background:var(--card);border:1px solid var(--border);border-radius:11px;padding:16px}
.j-ar{font-family:'Amiri',serif;font-size:19px;direction:rtl;text-align:right;color:var(--text);margin-bottom:9px;line-height:1.85}
.j-en{font-size:13px;color:var(--t2);line-height:1.65}
.j-ref{font-size:10px;color:var(--t3);margin-top:7px;font-style:italic}
.j-audio{display:flex;align-items:center;gap:8px;margin-top:10px;padding:8px 12px;border-radius:8px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.15)}
.j-play{width:28px;height:28px;border-radius:50%;background:var(--emerald-bg);border:1px solid var(--emerald-d);color:var(--emerald-xl);font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
.j-play:hover{background:rgba(16,185,129,.2)}
.j-audio-info{font-size:10px;color:var(--t2)}

/* MOOD PAGE */
.mood-pg{padding:40px 0}
.pg-hd{text-align:center;margin-bottom:32px}
.pg-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:20px;background:var(--emerald-bg);border:1px solid var(--border-h);font-size:11px;font-weight:700;color:var(--emerald-xl);margin-bottom:14px;letter-spacing:1px;text-transform:uppercase}
.pg-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--text);margin-bottom:8px}
.pg-sub{font-size:13px;color:var(--t3)}
.mood-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:36px}
.mood-big{background:var(--card2);border:1px solid var(--border);border-radius:14px;padding:18px 12px;text-align:center;cursor:pointer;transition:all .22s}
.mood-big:hover,.mood-big.on{border-color:var(--border-h);transform:translateY(-2px);box-shadow:var(--shadow-t)}
.mood-big.on{border-color:var(--emerald-l);background:var(--emerald-bg)}
.mb-emoji{font-size:34px;margin-bottom:9px}
.mb-name{font-size:13px;font-weight:600;color:var(--text);text-transform:capitalize}
.mb-desc{font-size:10px;color:var(--t3);margin-top:3px}
.mood-result-banner{display:flex;align-items:center;gap:14px;padding:18px 22px;border-radius:14px;background:linear-gradient(135deg,rgba(16,185,129,.12),rgba(245,158,11,.06));border:1px solid var(--border-h);margin-bottom:24px;animation:fUp .4s ease}
.mrb-emoji{font-size:36px}
.mrb-name{font-size:18px;font-weight:700;color:var(--emerald-xl);font-family:'Playfair Display',serif}
.mrb-sub{font-size:12px;color:var(--t2);margin-top:3px}

/* TOPICS PAGE */
.topics-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;padding:28px 0}
.topic-card{background:var(--card2);border:1px solid var(--border);border-radius:13px;padding:18px;cursor:pointer;transition:all .22s}
.topic-card:hover,.topic-card.on{border-color:var(--border-h);transform:translateY(-2px);box-shadow:var(--shadow-t)}
.topic-card.on{border-color:var(--emerald-l);background:var(--emerald-bg)}
.t-ico{font-size:26px;margin-bottom:9px}
.t-name{font-size:13px;font-weight:600;color:var(--text);text-transform:capitalize}

/* DAILY PAGE */
.daily-pg{padding:44px 0}
.daily-main{background:var(--card2);border:1px solid var(--border-h);border-radius:22px;padding:38px;margin-bottom:22px;background:linear-gradient(135deg,rgba(16,185,129,.06),rgba(245,158,11,.04))}
.d-lbl{font-size:10px;color:var(--emerald-xl);text-transform:uppercase;letter-spacing:2px;margin-bottom:22px;font-weight:700}
.d-arabic{font-family:'Amiri',serif;font-size:28px;line-height:2;color:var(--text);direction:rtl;text-align:center;margin-bottom:22px;padding:22px;background:rgba(16,185,129,.04);border-radius:12px}
.d-english{font-size:17px;color:var(--t2);line-height:1.8;margin-bottom:14px;font-weight:300;text-align:center}
.d-ref{font-size:13px;color:var(--emerald-xl);font-weight:600;text-align:center;margin-bottom:20px}
.d-actions{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}
.d-btn{display:flex;align-items:center;gap:7px;padding:10px 20px;border-radius:11px;border:1px solid var(--border-h);background:transparent;color:var(--emerald-xl);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
.d-btn:hover{background:var(--emerald-bg)}
.d-audio-wrap{display:flex;align-items:center;gap:12px;padding:14px 20px;border-radius:12px;background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.2);margin-bottom:18px}
.d-play{width:42px;height:42px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--emerald-d),var(--emerald));border:none;color:var(--white);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
.d-play:hover{transform:scale(1.08);box-shadow:var(--shadow-t)}
.d-audio-text{flex:1}
.d-audio-t{font-size:12px;color:var(--emerald-xl);font-weight:600;margin-bottom:2px}
.d-audio-sub{font-size:10px;color:var(--t3)}
.d-hadith{background:var(--card2);border:1px solid rgba(16,185,129,.18);border-radius:16px;padding:24px}
.d-had-lbl{font-size:10px;color:var(--emerald-xl);text-transform:uppercase;letter-spacing:2px;margin-bottom:14px;font-weight:700}
.tafseer-box{margin-top:18px;padding:18px;border-radius:12px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);animation:fUp .4s ease}
.taf-box-hd{font-size:10px;color:var(--gold-xl);text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;font-weight:700}
.taf-box-text{font-size:14px;color:var(--t2);line-height:1.75;white-space:pre-wrap}
.taf-box-q{width:100%;background:rgba(245,158,11,.04);border:1px solid rgba(245,158,11,.2);border-radius:8px;padding:9px 13px;margin-top:12px;color:var(--text);font-size:13px;outline:none;resize:none}
.taf-box-ask{margin-top:8px;padding:8px 18px;border-radius:8px;border:1px solid var(--gold-d);background:var(--gold-bg);color:var(--gold-xl);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s}
.taf-box-ask:disabled{opacity:.45;cursor:not-allowed}

/* SAVED PAGE */
.saved-pg{padding:36px 0}
.saved-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sv-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:18px;transition:all .22s;animation:fUp .4s ease both}
.sv-card:hover{border-color:var(--border-h);transform:translateY(-2px)}
.sv-ar{font-family:'Amiri',serif;font-size:15px;direction:rtl;text-align:right;color:var(--text);line-height:1.8;margin-bottom:9px}
.sv-en{font-size:11px;color:var(--t2);line-height:1.6;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.sv-foot{display:flex;justify-content:space-between;align-items:center}
.sv-ref{font-size:10px;color:var(--t3)}
.sv-rm{padding:3px 9px;border-radius:5px;font-size:10px;border:1px solid var(--border);background:transparent;color:var(--t3);cursor:pointer;transition:all .2s}
.sv-rm:hover{border-color:rgba(16,185,129,.3);color:var(--emerald-xl)}
.reflect-btn{width:100%;margin-top:22px;padding:14px;border-radius:var(--r);background:linear-gradient(135deg,var(--emerald-d),var(--emerald));border:none;color:var(--white);font-family:'Playfair Display',serif;font-size:16px;font-style:italic;cursor:pointer;transition:all .2s}
.reflect-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
.reflect-btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
.reflect-out{margin-top:18px;padding:24px;background:var(--emerald-bg);border:1px solid rgba(16,185,129,.22);border-radius:var(--r);animation:fUp .5s ease}
.reflect-hd{font-size:9px;color:var(--emerald-xl);letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;font-weight:700}
.reflect-txt{font-size:14px;color:var(--text);line-height:1.9;white-space:pre-wrap}

/* SURAH BROWSER */
.surah-pg{padding:36px 0}
.surah-search-wrap{max-width:480px;margin:0 auto 28px;display:flex;align-items:center;gap:10px;background:var(--card2);border:1.5px solid var(--border);border-radius:12px;padding:10px 16px}
.surah-search-wrap:focus-within{border-color:var(--border-h)}
.surah-search-in{flex:1;background:none;border:none;outline:none;color:var(--text);font-size:14px}
.surah-search-in::placeholder{color:var(--t3)}
.surah-filter-row{display:flex;gap:8px;justify-content:center;margin-bottom:24px;flex-wrap:wrap}
.sf-btn{padding:5px 14px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--t2);font-size:11px;cursor:pointer;transition:all .2s}
.sf-btn:hover,.sf-btn.on{border-color:var(--border-h);color:var(--emerald-xl);background:var(--emerald-bg)}
.surah-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.surah-card{
  background:var(--card2);border:1px solid var(--border);border-radius:12px;
  padding:14px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden
}
.surah-card:hover{border-color:var(--border-h);transform:translateY(-2px);box-shadow:var(--shadow-t)}
.surah-num{
  position:absolute;top:10px;left:10px;
  width:26px;height:26px;border-radius:50%;
  background:var(--emerald-bg);border:1px solid var(--emerald-d);
  display:flex;align-items:center;justify-content:center;
  font-size:9px;font-weight:700;color:var(--emerald-xl)
}
.surah-ar{font-family:'Amiri',serif;font-size:18px;direction:rtl;text-align:right;color:var(--text);margin-bottom:4px;line-height:1.5}
.surah-en{font-size:11px;font-weight:600;color:var(--t2)}
.surah-meta{display:flex;align-items:center;justify-content:space-between;margin-top:8px}
.surah-ayah-count{font-size:10px;color:var(--t3)}
.surah-type{font-size:9px;padding:2px 7px;border-radius:10px;font-weight:700;letter-spacing:.5px}
.type-meccan{background:rgba(245,158,11,.1);color:var(--gold-xl);border:1px solid rgba(245,158,11,.2)}
.type-medinan{background:var(--emerald-bg);color:var(--emerald-xl);border:1px solid var(--border)}
.surah-meaning{font-size:9px;color:var(--t3);margin-top:4px;font-style:italic}

/* SURAH DETAIL */
.surah-detail{padding:28px 0}
.surah-detail-hd{
  background:linear-gradient(135deg,var(--card2),rgba(16,185,129,.06));
  border:1px solid var(--border-h);border-radius:20px;padding:32px;text-align:center;margin-bottom:28px
}
.sd-back{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--t2);background:transparent;border:none;cursor:pointer;margin-bottom:18px;padding:0;transition:color .2s}
.sd-back:hover{color:var(--emerald-xl)}
.sd-ar{font-family:'Amiri',serif;font-size:36px;color:var(--emerald-xl);direction:rtl;margin-bottom:10px;text-shadow:0 0 30px rgba(110,231,183,.2)}
.sd-en{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px}
.sd-meaning{font-size:13px;color:var(--t2);font-style:italic;margin-bottom:16px}
.sd-meta{display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap}
.sd-meta-item{text-align:center}
.sd-meta-n{font-size:18px;font-weight:700;color:var(--emerald-xl)}
.sd-meta-l{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:1.5px;margin-top:2px}
.bism-surah{font-family:'Amiri',serif;font-size:22px;direction:rtl;text-align:center;color:var(--emerald-xl);opacity:.6;margin-bottom:22px;letter-spacing:2px}
.ayah-card{
  background:var(--card);border:1px solid var(--border);border-radius:var(--r);
  padding:22px;margin-bottom:12px;transition:all .22s;animation:fUp .3s ease both
}
.ayah-card:hover{border-color:var(--border-h)}
.ayah-num-badge{
  display:inline-flex;align-items:center;justify-content:center;
  width:28px;height:28px;border-radius:50%;
  background:var(--gold-bg);border:1px solid rgba(245,158,11,.25);
  font-size:11px;font-weight:700;color:var(--gold-xl);margin-bottom:12px
}
.ayah-arabic{
  font-family:'Amiri',serif;font-size:22px;line-height:2;direction:rtl;text-align:right;
  color:var(--text);padding:14px 18px;background:rgba(16,185,129,.03);
  border-radius:9px;border-right:3px solid var(--emerald-d);margin-bottom:11px
}
.ayah-english{font-size:13.5px;color:var(--t2);line-height:1.75;margin-bottom:10px}
.ayah-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
.ayah-act{
  padding:5px 11px;border-radius:7px;border:1px solid var(--border);background:transparent;
  color:var(--t2);font-size:11px;cursor:pointer;transition:all .2s
}
.ayah-act:hover{border-color:var(--border-h);color:var(--text)}
.ayah-act.on{color:var(--emerald-xl);border-color:var(--emerald);background:var(--emerald-bg)}
.load-more-btn{
  width:100%;margin-top:14px;padding:12px;border-radius:12px;
  background:var(--card2);border:1px solid var(--border);color:var(--t2);
  font-size:13px;cursor:pointer;transition:all .2s
}
.load-more-btn:hover{border-color:var(--border-h);color:var(--text)}

/* ASMA UL HUSNA */
.asma-pg{padding:36px 0}
.asma-search-wrap{max-width:480px;margin:0 auto 24px;display:flex;align-items:center;gap:10px;background:var(--card2);border:1.5px solid var(--border);border-radius:12px;padding:10px 16px}
.asma-search-wrap:focus-within{border-color:var(--border-h)}
.asma-search-in{flex:1;background:none;border:none;outline:none;color:var(--text);font-size:14px}
.asma-search-in::placeholder{color:var(--t3)}
.asma-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.asma-card{
  background:var(--card2);border:1px solid var(--border);border-radius:14px;
  padding:18px 14px;text-align:center;cursor:pointer;transition:all .25s;position:relative;overflow:hidden
}
.asma-card:hover{border-color:var(--border-h);transform:translateY(-2px);box-shadow:var(--shadow-t);background:linear-gradient(135deg,rgba(16,185,129,.08),rgba(245,158,11,.04))}
.asma-card.expanded{border-color:var(--emerald-l);background:linear-gradient(135deg,rgba(16,185,129,.12),rgba(245,158,11,.05))}
.asma-num{
  position:absolute;top:10px;left:10px;
  width:22px;height:22px;border-radius:50%;
  background:var(--gold-bg);border:1px solid rgba(245,158,11,.3);
  display:flex;align-items:center;justify-content:center;
  font-size:8px;font-weight:700;color:var(--gold-xl)
}
.asma-ar{font-family:'Amiri',serif;font-size:22px;color:var(--emerald-xl);margin-bottom:6px;line-height:1.5;text-shadow:0 0 20px rgba(110,231,183,.2)}
.asma-transliteration{font-size:11px;font-weight:700;color:var(--text);margin-bottom:4px;letter-spacing:.3px}
.asma-meaning{font-size:10px;color:var(--t2);line-height:1.5}
.asma-expand{margin-top:12px;padding:10px 12px;background:rgba(16,185,129,.06);border-radius:9px;border:1px solid rgba(16,185,129,.15);text-align:left;animation:fUp .3s ease}
.asma-desc{font-size:11px;color:var(--t2);line-height:1.65}
.asma-dua{margin-top:8px;font-size:10px;color:var(--emerald-xl);font-style:italic}
.asma-counter-wrap{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px}
.asma-counter-btn{padding:5px 14px;border-radius:8px;border:1px solid var(--emerald-d);background:var(--emerald-bg);color:var(--emerald-xl);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s}
.asma-counter-btn:hover{background:rgba(16,185,129,.2)}
.asma-count-num{font-size:16px;font-weight:800;color:var(--emerald-xl);min-width:28px;text-align:center}

/* PRAYER TIMES */
.prayer-pg{padding:36px 0}
.city-selector{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:28px}
.city-btn{padding:7px 16px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--t2);font-size:12px;font-weight:500;cursor:pointer;transition:all .2s}
.city-btn:hover{border-color:var(--border-h);color:var(--text);background:var(--emerald-bg)}
.city-btn.on{background:linear-gradient(135deg,var(--emerald-d),var(--emerald));color:var(--white);border-color:var(--emerald);font-weight:700}
.prayer-card{background:linear-gradient(135deg,rgba(16,185,129,.08),rgba(245,158,11,.04));border:1px solid var(--border-h);border-radius:20px;padding:28px;margin-bottom:18px}
.prayer-city-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
.prayer-city-name{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--emerald-xl)}
.prayer-date{font-size:12px;color:var(--t3)}
.prayer-hijri{font-size:11px;color:var(--gold-xl);margin-top:2px}
.prayer-list{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
.prayer-item{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center;transition:all .2s}
.prayer-item.active{border-color:var(--emerald-l);background:var(--emerald-bg);box-shadow:0 0 18px rgba(16,185,129,.15)}
.prayer-item.passed{opacity:.5}
.prayer-icon{font-size:22px;margin-bottom:6px}
.prayer-name-ar{font-family:'Amiri',serif;font-size:14px;color:var(--t2);margin-bottom:2px}
.prayer-name-en{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
.prayer-time{font-size:18px;font-weight:800;color:var(--text)}
.prayer-time.active{color:var(--emerald-xl)}
.next-prayer-banner{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:12px;background:rgba(16,185,129,.1);border:1px solid var(--emerald-d);margin-bottom:16px;animation:fUp .4s ease}
.npb-label{font-size:10px;color:var(--emerald-xl);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:3px}
.npb-name{font-size:16px;font-weight:700;color:var(--text)}
.npb-time{font-size:22px;font-weight:800;color:var(--emerald-xl)}
.npb-countdown{font-size:11px;color:var(--t2);margin-top:2px}
.prayer-note{font-size:11px;color:var(--t3);text-align:center;margin-top:10px;font-style:italic}
.method-note{font-size:10px;color:var(--t3);text-align:center;margin-top:6px}
.adhan-reminder{margin-top:14px;padding:12px 16px;border-radius:10px;background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.2);font-size:12px;color:var(--gold-xl);text-align:center}

/* AUTH MODAL */
.auth-modal{
  background:var(--ink2);border:1px solid var(--border-h);border-radius:22px;
  width:100%;max-width:420px;padding:36px;animation:sUp .3s ease;box-shadow:var(--shadow)
}
.auth-title{font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:var(--emerald-xl);text-align:center;margin-bottom:6px}
.auth-sub{font-size:13px;color:var(--t3);text-align:center;margin-bottom:28px}
.auth-tabs{display:flex;gap:4px;background:var(--card2);border-radius:10px;padding:4px;margin-bottom:22px}
.auth-tab{flex:1;padding:8px;border-radius:8px;border:none;background:transparent;color:var(--t2);font-size:13px;font-weight:500;cursor:pointer;transition:all .2s}
.auth-tab.on{background:linear-gradient(135deg,var(--emerald-d),var(--emerald));color:var(--white);font-weight:700}
.auth-field{margin-bottom:14px}
.auth-lbl{font-size:11px;color:var(--t2);margin-bottom:6px;display:block;font-weight:600;letter-spacing:.3px}
.auth-in{
  width:100%;padding:11px 14px;border-radius:10px;
  background:var(--card);border:1.5px solid var(--border);color:var(--text);
  font-size:14px;outline:none;transition:all .2s
}
.auth-in:focus{border-color:var(--border-h)}
.auth-btn{
  width:100%;padding:13px;border-radius:12px;margin-top:6px;
  background:linear-gradient(135deg,var(--emerald-d),var(--emerald));border:none;
  color:var(--white);font-size:14px;font-weight:700;cursor:pointer;transition:all .2s
}
.auth-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
.auth-btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
.auth-err{font-size:12px;color:var(--rose-xl);text-align:center;margin-top:10px;padding:8px;border-radius:8px;background:var(--rose-bg)}
.auth-ok{font-size:12px;color:var(--emerald-xl);text-align:center;margin-top:10px}

/* PROFILE MODAL */
.profile-modal{
  background:var(--ink2);border:1px solid var(--border-h);border-radius:22px;
  width:100%;max-width:480px;padding:36px;animation:sUp .3s ease;box-shadow:var(--shadow)
}
.profile-top{text-align:center;margin-bottom:28px}
.profile-avatar{
  width:72px;height:72px;border-radius:50%;margin:0 auto 14px;
  background:linear-gradient(135deg,var(--emerald-d),var(--emerald));
  display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:var(--white)
}
.profile-name{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px}
.profile-email{font-size:12px;color:var(--t3)}
.streak-section{
  background:linear-gradient(135deg,rgba(245,158,11,.1),rgba(252,211,77,.05));
  border:1px solid rgba(245,158,11,.25);border-radius:16px;padding:22px;margin-bottom:20px
}
.streak-title{font-size:10px;color:var(--gold-xl);text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:16px;text-align:center}
.streak-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;text-align:center}
.streak-stat-n{font-size:26px;font-weight:800;color:var(--gold-xl)}
.streak-stat-l{font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-top:3px}
.streak-flames{display:flex;justify-content:center;gap:4px;margin-top:16px}
.flame{font-size:20px;filter:grayscale(1);transition:filter .3s}
.flame.lit{filter:none}
.logout-btn{
  width:100%;padding:12px;border-radius:12px;
  background:transparent;border:1px solid var(--border);
  color:var(--t2);font-size:13px;cursor:pointer;transition:all .2s
}
.logout-btn:hover{border-color:rgba(16,185,129,.3);color:var(--emerald-xl);background:var(--emerald-bg)}

/* UTILS */
.loading{padding:72px 0;text-align:center}
.spinner{width:48px;height:48px;border-radius:50%;border:2px solid var(--border);border-top-color:var(--emerald);animation:spin .85s linear infinite;margin:0 auto 18px}
.l-ar{font-family:'Amiri',serif;font-size:18px;color:var(--emerald-xl);opacity:.55;margin-bottom:8px;animation:breathe 2s ease infinite}
.l-txt{font-size:12px;color:var(--t3)}
.err{padding:13px 18px;background:rgba(159,18,57,.07);border:1px solid rgba(159,18,57,.2);border-radius:10px;color:#F472B6;font-size:12px;text-align:center;margin:14px 0}
.toast{position:fixed;bottom:28px;right:28px;z-index:400;background:var(--card2);border:1px solid var(--border-h);border-radius:11px;padding:13px 20px;font-size:13px;color:var(--text);animation:sRight .3s ease;box-shadow:var(--shadow);display:flex;align-items:center;gap:9px}
.empty{text-align:center;padding:72px 0}
.empty-sym{font-family:'Amiri',serif;font-size:52px;color:var(--emerald-xl);opacity:.15;margin-bottom:14px}
.empty-t{font-family:'Playfair Display',serif;font-size:20px;color:var(--text);margin-bottom:8px}
.empty-s{font-size:13px;color:var(--t3)}

@keyframes fUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fIn{from{opacity:0}to{opacity:1}}
@keyframes sUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
@keyframes sRight{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:translateX(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes breathe{0%,100%{opacity:.55}50%{opacity:.85}}

@media(max-width:660px){
  .nav{padding:12px 14px;gap:12px}
  .nav-main{width:100%;order:1;justify-content:space-between}
  .nav-right{width:100%;order:3;justify-content:space-between;gap:8px}
  .nav-actions{display:none}
  .mobile-shell-actions{display:flex;align-items:center;gap:8px;order:2;margin-left:auto}
  .app-body{display:block;padding:12px 14px 60px}
  .side-dash{display:none}
  .logo-text{font-size:15px}
  .logo-sub{display:none}
  .tabs{display:none}
  .mobile-toggle{display:flex}
  .mobile-search-btn{display:flex}
  .page{max-width:none;padding:0}
  .modules{grid-template-columns:1fr}
  .mod-card.full{grid-column:span 1}
  .mood-grid,.mood-row{grid-template-columns:repeat(2,1fr)}
  .topics-grid,.surah-grid{grid-template-columns:1fr 1fr}
  .saved-grid{grid-template-columns:1fr}
  .modal,.auth-modal,.profile-modal{padding:18px}
  .chat-window{width:calc(100vw - 40px);right:20px;bottom:90px;height:500px;}
}
`;

// ── AUDIO COMPONENT ───────────────────────────────────────────────────────────
function AyahAudio({ reference, size = "normal" }) {
  const [playing, setPlaying] = useState(false);
  const [error,   setError]   = useState(false);
  const audioRef = useRef(null);
  const url = getAudioUrl(reference);
  if (!url) return null;

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().catch(()=>setError(true)); setPlaying(true); }
  };

  if (size === "daily") return (
    <div className="d-audio-wrap">
      <button className="d-play" onClick={toggle}>{playing?"⏸":"▶"}</button>
      <div className="d-audio-text">
        <div className="d-audio-t">🎧 Listen to this Ayah</div>
        <div className="d-audio-sub">Mishary Rashid Alafasy · {error?"Audio unavailable":"Click to play"}</div>
      </div>
      <audio ref={audioRef} src={url} onEnded={()=>setPlaying(false)}/>
    </div>
  );

  if (size === "journey") return (
    <div className="j-audio">
      <button className="j-play" onClick={toggle}>{playing?"⏸":"▶"}</button>
      <div className="j-audio-info">{error?"Audio unavailable":"🎧 Listen · Mishary Alafasy"}</div>
      <audio ref={audioRef} src={url} onEnded={()=>setPlaying(false)}/>
    </div>
  );

  return (
    <div className="audio-wrap">
      <span className="audio-lbl">🎧 Listen</span>
      <button className="audio-play" onClick={toggle}>{playing?"⏸":"▶"}</button>
      <div>
        <div className="audio-info">{error?"Audio unavailable":"Mishary Rashid Alafasy"}</div>
        <div className="audio-reciter">Hafs An Asim · 128kbps</div>
      </div>
      <audio ref={audioRef} src={url} onEnded={()=>setPlaying(false)}/>
    </div>
  );
}



// ── AI CHATBOT COMPONENT ──────────────────────────────────────────────────────
function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", content: "Assalamu Alaikum! 🌙 I'm HidayahBot, your Islamic AI assistant powered by Claude. Ask me anything about the Quran, Hadith, Islamic teachings, or spiritual guidance. I'll provide authentic answers based on Islamic sources." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch(`${API}/chat?query=${encodeURIComponent(userMsg)}`);
      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        role: "bot", 
        content: data.response || "I apologize, I couldn't generate a response. Please try again." 
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: "bot", 
        content: "⚠️ I'm having trouble connecting to the AI service. Please make sure the backend server is running on port 8000 and try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      {!isOpen && (
        <button className="chat-toggle" onClick={() => setIsOpen(true)}>
          🤖
        </button>
      )}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>🤖 HidayahBot — AI Islamic Assistant</h3>
            <button className="chat-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                {msg.role === "bot" ? (
                  <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
                ) : (
                  msg.content
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-loading">
                <span></span><span></span><span></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-area">
            <input
              className="chat-input"
              placeholder="Ask about Islam, Quran, Hadith..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="chat-send" onClick={sendMessage} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── RESULT CARD ───────────────────────────────────────────────────────────────
function ResultCard({ r, idx, onJourney, onSave, saved }) {
  const [showWhy,   setShowWhy]   = useState(false);
  const [whyTxt,    setWhyTxt]    = useState("");
  const [whyLoad,   setWhyLoad]   = useState(false);
  const [showTaf,   setShowTaf]   = useState(false);
  const [tafTxt,    setTafTxt]    = useState("");
  const [tafLoad,   setTafLoad]   = useState(false);
  const [tafQ,      setTafQ]      = useState("");
  const [showSim,   setShowSim]   = useState(false);
  const [simData,   setSimData]   = useState([]);
  const [simLoad,   setSimLoad]   = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [copied,    setCopied]    = useState(false);

  const pct = Math.round(r.score * 100);
  const isQuran = r.source?.toLowerCase() === "quran";
  const hasAudio = isQuran && !!getAudioUrl(r.reference);

  const handleWhy = async () => {
    if (showWhy) { setShowWhy(false); return; }
    setShowWhy(true);
    if (!whyTxt) {
      setWhyLoad(true);
      try {
        const res = await fetch(`${API}/chat?query=Explain why this Islamic text is relevant to understanding: ${encodeURIComponent(r.english.slice(0,100))}`);
        const data = await res.json();
        setWhyTxt(data.response || "This text provides guidance related to the topic based on Islamic teachings.");
      } catch {
        setWhyTxt("This verse/hadith offers valuable spiritual guidance relevant to your search.");
      }
      setWhyLoad(false);
    }
  };

  const handleTafseer = async (q) => {
    setTafLoad(true);
    try {
      const res = await fetch(`${API}/tafseer?reference=${encodeURIComponent(r.reference)}&question=${encodeURIComponent(q || "")}`);
      const data = await res.json();
      setTafTxt(data.tafseer || "Tafseer not available for this reference.");
    } catch {
      setTafTxt("Unable to load tafseer. Please check your connection.");
    }
    setTafLoad(false);
  };

  const handleSimilar = async () => {
    if (showSim) { setShowSim(false); return; }
    setSimLoad(true); setShowSim(true);
    try {
      const res = await fetch(`${API}/similar/${r.id}`);
      setSimData((await res.json()).results || []);
    } catch { setSimData([]); }
    setSimLoad(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${r.arabic ? r.arabic+"\n" : ""}${r.english}\n— ${r.reference}${r.book?", "+r.book:""}`);
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };

  return (
    <div className="rc" style={{ animationDelay:`${idx*0.06}s` }}>
      <div className="rc-top">
        <div className="rc-left">
          <span className={`badge ${isQuran?"bq":"bh"}`}>{r.source}</span>
          <span className="rc-ref">{r.reference}</span>
        </div>
        <span className="score-pill">{pct}% match</span>
      </div>

      {r.arabic && <div className="arabic-text">{r.arabic}</div>}
      <div className="english-text">{r.english}</div>

      <div className="rc-foot">
        <span className="book">{r.book}</span>
        <div className="acts">
          <button className={`act ${showWhy?"on":""}`} onClick={handleWhy}>✦ {showWhy?"Hide":"Why this?"}</button>
          <button className={`act ${showTaf?"on":""}`} onClick={()=>{if(showTaf){setShowTaf(false);return;}setShowTaf(true);if(!tafTxt)handleTafseer(null);}}>📖 {showTaf?"Hide":"Tafseer"}</button>
          <button className={`act ${showSim?"on":""}`} onClick={handleSimilar}>◈ {showSim?"Hide":"Similar"}</button>
          {hasAudio && <button className={`act ${showAudio?"on":""}`} onClick={()=>setShowAudio(!showAudio)}>🎧 {showAudio?"Hide":"Audio"}</button>}
          <button className="act" onClick={handleCopy}>{copied?"✓ Copied":"📋 Copy"}</button>
          <button className={`act ${saved?"saved":""}`} onClick={()=>onSave(r)}>{saved?"♥ Saved":"♡ Save"}</button>
          <button className="act" onClick={()=>onJourney(r.english)}>🗺 Journey</button>
        </div>
      </div>

      {showAudio && hasAudio && <AyahAudio reference={r.reference} size="normal"/>}

      {showWhy && (
        <div className="panel why-panel">
          <div className="p-hd why-hd">✦ AI Relevance Explanation</div>
          <div className="p-text">{whyLoad?"Analysing semantic connection…":whyTxt}</div>
        </div>
      )}

      {showTaf && (
        <div className="panel taf-panel">
          <div className="p-hd taf-hd">📖 AI Tafseer — {r.reference}</div>
          <div className="p-text">{tafLoad?"Consulting classical sources…":tafTxt}</div>
          {!tafLoad && <>
            <textarea className="taf-q" rows={2} placeholder="Ask a specific question about this ayah/hadith…" value={tafQ} onChange={e=>setTafQ(e.target.value)}/>
            <button className="taf-ask" disabled={!tafQ.trim()||tafLoad} onClick={()=>{handleTafseer(tafQ);setTafQ("");}}>Ask Scholar →</button>
          </>}
        </div>
      )}

      {showSim && (
        <div className="panel sim-panel">
          <div className="p-hd sim-hd">◈ Semantically Similar</div>
          {simLoad ? <div className="p-text">Finding similar…</div>
            : simData.length === 0 ? <div className="p-text">None found.</div>
            : simData.map((s,i)=>(
              <div className="sim-item" key={i}>
                <div className="sim-ref">{s.source} · {s.reference} · {Math.round(s.score*100)}% match</div>
                <div className="sim-txt">{s.english?.slice(0,150)}…</div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ── JOURNEY MODAL ──────────────────────────────────────────────────────────────
function JourneyModal({ query, onClose }) {
  const [steps,   setSteps]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/journey?query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error();
        setSteps((await res.json()).steps || []);
      } catch { setError(true); }
      setLoading(false);
    })();
  }, [query]);

  const dotClass = ["j-dot-1","j-dot-2","j-dot-3","j-dot-4"];

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-hd">
          <div>
            <div className="modal-title">🗺 Spiritual Journey</div>
            <div className="modal-sub">AI-guided 4-step path for: "{query.slice(0,55)}{query.length>55?"…":""}"</div>
          </div>
          <button className="x-btn" onClick={onClose}>✕</button>
        </div>
        {loading && <div className="loading"><div className="spinner"/><div className="l-ar">يَبْتَغُونَ الْهُدَى</div><div className="l-txt">Building your spiritual journey…</div></div>}
        {error   && <div className="err">Could not load journey. Check backend is running.</div>}
        {!loading && !error && steps.length === 0 && <div className="err">No journey steps returned.</div>}
        {!loading && steps.map((s, i) => (
          <div className="j-step" key={i} style={{ animationDelay:`${i*0.1}s` }}>
            <div className="j-track">
              <div className={`j-dot ${dotClass[i]||"j-dot-1"}`}>{i+1}</div>
              {i < steps.length-1 && <div className="j-conn"/>}
            </div>
            <div className="j-body">
              <div className="j-lbl">{s.label} — {s.desc}</div>
              <div className="j-card">
                {s.arabic && <div className="j-ar">{s.arabic}</div>}
                <div className="j-en">{s.english}</div>
                <div className="j-ref">{s.reference} · {s.book}</div>
                {s.source === "Quran" && getAudioUrl(s.reference) && (
                  <AyahAudio reference={s.reference} size="journey"/>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SURAH BROWSER ─────────────────────────────────────────────────────────────
function SurahPage() {
  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selected,   setSelected]   = useState(null);
  const [ayahs,      setAyahs]      = useState([]);
  const [ayahsLoad,  setAyahsLoad]  = useState(false);
  const [displayCount, setDisplayCount] = useState(30);

  const filtered = SURAHS.filter(s => {
    const q = search.toLowerCase();
    const matchText = s.en.toLowerCase().includes(q) || s.ar.includes(q) ||
      s.meaning.toLowerCase().includes(q) || String(s.n).includes(q);
    const matchType = typeFilter === "All" || s.type === typeFilter;
    return matchText && matchType;
  });

  const loadSurah = async (surah) => {
    setSelected(surah);
    setAyahs([]);
    setDisplayCount(30);
    setAyahsLoad(true);
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surah.n}/editions/quran-uthmani,en.sahih`);
      const data = await res.json();
      if (data.code === 200) {
        const arabic = data.data[0].ayahs;
        const english = data.data[1].ayahs;
        const combined = arabic.map((a, i) => ({
          number: a.numberInSurah,
          arabic: a.text,
          english: english[i]?.text || "",
        }));
        setAyahs(combined);
      }
    } catch {
      setAyahs([]);
    }
    setAyahsLoad(false);
  };

  if (selected) {
    const visibleAyahs = ayahs.slice(0, displayCount);
    return (
      <div className="surah-detail">
        <div className="surah-detail-hd">
          <button className="sd-back" onClick={()=>setSelected(null)}>← Back to Surahs</button>
          <div className="sd-ar">{selected.ar}</div>
          <div className="sd-en">{selected.en}</div>
          <div className="sd-meaning">{selected.meaning}</div>
          <div className="sd-meta">
            <div className="sd-meta-item">
              <div className="sd-meta-n">{selected.n}</div>
              <div className="sd-meta-l">Surah No.</div>
            </div>
            <div className="sd-meta-item">
              <div className="sd-meta-n">{selected.ayahs}</div>
              <div className="sd-meta-l">Ayaat</div>
            </div>
            <div className="sd-meta-item">
              <div className="sd-meta-n">{selected.type}</div>
              <div className="sd-meta-l">Revelation</div>
            </div>
          </div>
        </div>

        {selected.n !== 9 && (
          <div className="bism-surah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        )}

        {ayahsLoad && <div className="loading"><div className="spinner"/><div className="l-ar">يُتْلَى عَلَيْكُمْ</div><div className="l-txt">Loading {selected.en}…</div></div>}

        {!ayahsLoad && ayahs.length === 0 && (
          <div className="err">Could not load ayaat. Check internet connection.</div>
        )}

        {visibleAyahs.map((a, i) => (
          <AyahCard
            key={a.number} a={a} surah={selected}
            idx={i}
          />
        ))}

        {!ayahsLoad && displayCount < ayahs.length && (
          <button className="load-more-btn" onClick={() => setDisplayCount(p => p + 30)}>
            Load more ayaat ({displayCount}/{ayahs.length} shown)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="surah-pg">
      <div className="pg-hd">
        <div className="pg-badge">📖 Surah Browser</div>
        <div className="pg-title">114 Surahs of the Quran</div>
        <p className="pg-sub">Click any surah to read all its ayaat with Arabic & English</p>
      </div>

      <div className="surah-search-wrap">
        <span style={{color:"var(--t3)"}}>🔍</span>
        <input
          className="surah-search-in"
          placeholder="Search by name, number, or meaning…"
          value={search} onChange={e=>setSearch(e.target.value)}
        />
        {search && <button style={{background:"none",border:"none",color:"var(--t3)",cursor:"pointer"}} onClick={()=>setSearch("")}>✕</button>}
      </div>

      <div className="surah-filter-row">
        {["All","Meccan","Medinan"].map(f=>(
          <button key={f} className={`sf-btn ${typeFilter===f?"on":""}`} onClick={()=>setTypeFilter(f)}>{f}</button>
        ))}
        <span style={{fontSize:11,color:"var(--t3)",paddingTop:6}}>{filtered.length} surahs</span>
      </div>

      <div className="surah-grid">
        {filtered.map(s=>(
          <div key={s.n} className="surah-card" onClick={()=>loadSurah(s)}>
            <div className="surah-num">{s.n}</div>
            <div style={{paddingLeft:28}}>
              <div className="surah-ar">{s.ar}</div>
              <div className="surah-en">{s.en}</div>
              <div className="surah-meaning">{s.meaning}</div>
              <div className="surah-meta">
                <span className="surah-ayah-count">{s.ayahs} ayaat</span>
                <span className={`surah-type ${s.type==="Meccan"?"type-meccan":"type-medinan"}`}>{s.type}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── INDIVIDUAL AYAH CARD ──────────────────────────────────────────────────────
function AyahCard({ a, surah, idx }) {
  const [copied,   setCopied]   = useState(false);
  const ref = `${surah.n}:${a.number}`;
  const audioUrl = getAudioUrl(ref);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${a.arabic}\n${a.english}\n— ${surah.en} ${ref}`);
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };


  return (
    <div className="ayah-card" style={{animationDelay:`${Math.min(idx,20)*0.03}s`}}>
      <div className="ayah-num-badge">{a.number}</div>
      <div className="ayah-arabic">{a.arabic}</div>
      <div className="ayah-english">{a.english}</div>

      <div className="ayah-actions">
        <button className="ayah-act" onClick={handleCopy}>{copied?"✓":"📋"} Copy</button>
        {audioUrl && (
          <SmallAudio ref_={ref}/>
        )}
      </div>
    </div>
  );
}

function SmallAudio({ ref_ }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const url = getAudioUrl(ref_);
  return (
    <span>
      <button className="ayah-act" onClick={()=>{
        if (!audioRef.current) return;
        if (playing) { audioRef.current.pause(); setPlaying(false); }
        else { audioRef.current.play(); setPlaying(true); }
      }}>🎧 {playing?"⏸":"▶"}</button>
      <audio ref={audioRef} src={url} onEnded={()=>setPlaying(false)} style={{display:"none"}}/>
    </span>
  );
}

// ── ASMA UL HUSNA PAGE ────────────────────────────────────────────────────────
function AsmaPage() {
  const [search, setSearch]   = useState("");
  const [expanded, setExpanded] = useState(null);
  const [counters, setCounters] = useState({});

  const filtered = ASMA.filter(a =>
    !search.trim() ||
    a.tr.toLowerCase().includes(search.toLowerCase()) ||
    a.en.toLowerCase().includes(search.toLowerCase()) ||
    a.ar.includes(search) ||
    String(a.n).includes(search)
  );

  const increment = (n, e) => {
    e.stopPropagation();
    setCounters(p => ({ ...p, [n]: (p[n] || 0) + 1 }));
  };

  const reset = (n, e) => {
    e.stopPropagation();
    setCounters(p => ({ ...p, [n]: 0 }));
  };

  return (
    <div className="asma-pg">
      <div className="pg-hd">
        <div className="pg-badge">☪ Asma ul Husna</div>
        <div className="pg-title">99 Beautiful Names of Allah</div>
        <p className="pg-sub">Click any name to read its meaning, description & make dhikr</p>
      </div>

      <div className="asma-search-wrap">
        <span style={{color:"var(--t3)"}}>🔍</span>
        <input className="asma-search-in" placeholder="Search by name, meaning or number…"
          value={search} onChange={e => setSearch(e.target.value)}/>
        {search && <button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"var(--t3)",cursor:"pointer",fontSize:16}}>✕</button>}
      </div>

      <div style={{textAlign:"center",marginBottom:18,fontSize:11,color:"var(--t3)"}}>
        {filtered.length} of 99 names
      </div>

      <div className="asma-grid">
        {filtered.map(a => {
          const isOpen = expanded === a.n;
          const count  = counters[a.n] || 0;
          return (
            <div key={a.n} className={`asma-card ${isOpen ? "expanded" : ""}`}
              onClick={() => setExpanded(isOpen ? null : a.n)}>
              <div className="asma-num">{a.n}</div>
              <div className="asma-ar">{a.ar}</div>
              <div className="asma-transliteration">{a.tr}</div>
              <div className="asma-meaning">{a.en}</div>

              {isOpen && (
                <div className="asma-expand">
                  <div className="asma-desc">{a.desc}</div>
                  <div className="asma-dua">🤲 {a.dua}</div>
                  <div className="asma-counter-wrap" onClick={e=>e.stopPropagation()}>
                    <button className="asma-counter-btn" onClick={e=>increment(a.n, e)}>+ Dhikr</button>
                    <span className="asma-count-num">{count}</span>
                    <button className="asma-counter-btn" style={{fontSize:11,opacity:.6}} onClick={e=>reset(a.n, e)}>Reset</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PRAYER TIMES DATA & PAGE ──────────────────────────────────────────────────
const PAK_CITIES = [
  { name:"Karachi",    lat:24.8607, lng:67.0011 },
  { name:"Lahore",     lat:31.5204, lng:74.3587 },
  { name:"Islamabad",  lat:33.6844, lng:73.0479 },
  { name:"Rawalpindi", lat:33.5651, lng:73.0169 },
  { name:"Peshawar",   lat:34.0151, lng:71.5249 },
  { name:"Quetta",     lat:30.1798, lng:66.9750 },
  { name:"Multan",     lat:30.1575, lng:71.5249 },
  { name:"Faisalabad", lat:31.4504, lng:73.1350 },
  { name:"Hyderabad",  lat:25.3960, lng:68.3578 },
  { name:"Sialkot",    lat:32.4945, lng:74.5229 },
];

const PRAYERS = [
  { key:"Fajr",    ar:"الفجر",    en:"Fajr",    icon:"🌙" },
  { key:"Sunrise", ar:"الشروق",   en:"Sunrise",  icon:"🌅" },
  { key:"Dhuhr",   ar:"الظهر",    en:"Dhuhr",   icon:"☀️" },
  { key:"Asr",     ar:"العصر",    en:"Asr",     icon:"🌤️" },
  { key:"Maghrib", ar:"المغرب",   en:"Maghrib", icon:"🌇" },
  { key:"Isha",    ar:"العشاء",   en:"Isha",    icon:"🌃" },
];

function PrayerPage() {
  const [city,    setCity]    = useState(PAK_CITIES[1]);
  const [times,   setTimes]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [now,     setNow]     = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setLoading(true); setError(null); setTimes(null);
    const d = new Date();
    const date = `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`;
    fetch(`https://api.aladhan.com/v1/timings/${date}?latitude=${city.lat}&longitude=${city.lng}&method=1`)
      .then(r => r.json())
      .then(data => {
        if (data.code === 200) {
          setTimes(data.data);
        } else {
          setError("Could not load prayer times.");
        }
      })
      .catch(() => setError("Network error. Please check your connection."))
      .finally(() => setLoading(false));
  }, [city]);

  const toDate = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const getNextPrayer = () => {
    if (!times) return null;
    const prayerKeys = ["Fajr","Dhuhr","Asr","Maghrib","Isha"];
    for (const key of prayerKeys) {
      const t = toDate(times.timings[key]);
      if (t && t > now) return { key, time: times.timings[key], date: t };
    }
    return { key: "Fajr", time: times.timings["Fajr"], date: null, tomorrow: true };
  };

  const formatCountdown = (target) => {
    if (!target) return "";
    const diff = target - now;
    if (diff < 0) return "";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const isPassed = (timeStr) => {
    const t = toDate(timeStr);
    return t && t < now;
  };

  const isActive = (key) => {
    if (!times) return false;
    const next = getNextPrayer();
    if (!next) return false;
    const idx = PRAYERS.findIndex(p => p.key === next.key);
    const thisIdx = PRAYERS.findIndex(p => p.key === key);
    return thisIdx === idx;
  };

  const next = times ? getNextPrayer() : null;
  const today = now.toLocaleDateString("en-PK", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  return (
    <div className="prayer-pg">
      <div className="pg-hd">
        <div className="pg-badge">🕌 Prayer Times</div>
        <div className="pg-title">Salah Times — Pakistan</div>
        <p className="pg-sub">Select your city for accurate prayer times powered by Al-Adhan API</p>
      </div>

      <div className="city-selector">
        {PAK_CITIES.map(c => (
          <button key={c.name} className={`city-btn ${city.name===c.name?"on":""}`}
            onClick={() => setCity(c)}>{c.name}</button>
        ))}
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"/>
          <div className="l-ar">الصلاة خير من النوم</div>
          <div className="l-txt">Calculating prayer times for {city.name}…</div>
        </div>
      )}

      {error && <div className="err">⚠ {error}</div>}

      {times && !loading && (
        <div className="prayer-card">
          <div className="prayer-city-hd">
            <div>
              <div className="prayer-city-name">🕌 {city.name}</div>
              <div className="prayer-date">{today}</div>
              {times.date?.hijri && (
                <div className="prayer-hijri">
                  ☪ {times.date.hijri.day} {times.date.hijri.month?.en} {times.date.hijri.year} AH
                </div>
              )}
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:24,fontWeight:800,color:"var(--emerald-xl)",fontVariantNumeric:"tabular-nums"}}>
                {now.toLocaleTimeString("en-PK",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
              </div>
              <div style={{fontSize:10,color:"var(--t3)",marginTop:2}}>Pakistan Standard Time</div>
            </div>
          </div>

          {next && (
            <div className="next-prayer-banner">
              <div style={{fontSize:28}}>{PRAYERS.find(p=>p.key===next.key)?.icon}</div>
              <div style={{flex:1}}>
                <div className="npb-label">Next Prayer</div>
                <div className="npb-name">
                  {PRAYERS.find(p=>p.key===next.key)?.ar} &nbsp;·&nbsp; {next.key}
                  {next.tomorrow ? " (Tomorrow)" : ""}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div className="npb-time">{next.time}</div>
                {next.date && <div className="npb-countdown">in {formatCountdown(next.date)}</div>}
              </div>
            </div>
          )}

          <div className="prayer-list">
            {PRAYERS.map(p => {
              const t = times.timings[p.key];
              const active = isActive(p.key);
              const passed = p.key !== "Sunrise" && isPassed(t) && !active;
              return (
                <div key={p.key} className={`prayer-item ${active?"active":""} ${passed?"passed":""}`}>
                  <div className="prayer-icon">{p.icon}</div>
                  <div className="prayer-name-ar">{p.ar}</div>
                  <div className="prayer-name-en">{p.en}</div>
                  <div className={`prayer-time ${active?"active":""}`}>{t}</div>
                </div>
              );
            })}
          </div>

          <div className="method-note">📐 Calculation: University of Islamic Sciences, Karachi (Method 1) · Hanafi Madhab</div>
          <div className="adhan-reminder">
            🤲 "Establish prayer at the decline of the sun…" — Quran 17:78
          </div>
        </div>
      )}
    </div>
  );
}

// ── AUTH MODAL ────────────────────────────────────────────────────────────────
function AuthModal({ onClose, onLogin }) {
  const [mode,   setMode]   = useState("login");
  const [name,   setName]   = useState("");
  const [email,  setEmail]  = useState("");
  const [pass,   setPass]   = useState("");
  const [error,  setError]  = useState("");
  const [ok,     setOk]     = useState("");
  const [loading,setLoading]= useState(false);

  const handleSubmit = () => {
    setError(""); setOk("");
    if (!email.trim() || !pass.trim()) { setError("Please fill all fields."); return; }
    if (mode === "signup" && !name.trim()) { setError("Please enter your name."); return; }
    if (pass.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    const users = loadUsers();

    if (mode === "signup") {
      if (users[email]) { setError("An account with this email already exists."); setLoading(false); return; }
      const newUser = { email, name, password: pass, streak: 0, longestStreak: 0, lastVisit: null, joinedAt: new Date().toISOString() };
      users[email] = newUser;
      saveUsers(users);
      const updated = updateStreak(email);
      const sessionUser = { email, name, ...(updated || newUser) };
      saveSession(sessionUser);
      onLogin(sessionUser);
      setOk("Account created! Welcome to HidayahHub 🌙");
      setTimeout(onClose, 1200);
    } else {
      const user = users[email];
      if (!user || user.password !== pass) { setError("Invalid email or password."); setLoading(false); return; }
      const updated = updateStreak(email);
      const sessionUser = { ...user, ...(updated || {}) };
      saveSession(sessionUser);
      onLogin(sessionUser);
      setOk(`Welcome back, ${user.name}! 🌙`);
      setTimeout(onClose, 1000);
    }
    setLoading(false);
  };

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="auth-modal">
        <div className="auth-title">هدایت</div>
        <div className="auth-sub">Sign in to track your streak & save your journey</div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode==="login"?"on":""}`} onClick={()=>{setMode("login");setError("");}}>Login</button>
          <button className={`auth-tab ${mode==="signup"?"on":""}`} onClick={()=>{setMode("signup");setError("");}}>Create Account</button>
        </div>

        {mode === "signup" && (
          <div className="auth-field">
            <label className="auth-lbl">Your Name</label>
            <input className="auth-in" placeholder="e.g. Abdullah" value={name} onChange={e=>setName(e.target.value)}/>
          </div>
        )}
        <div className="auth-field">
          <label className="auth-lbl">Email Address</label>
          <input className="auth-in" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
        </div>
        <div className="auth-field">
          <label className="auth-lbl">Password</label>
          <input className="auth-in" type="password" placeholder="Min. 6 characters" value={pass} onChange={e=>setPass(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>
        </div>

        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait…" : mode==="signup" ? "Create Account" : "Sign In"}
        </button>

        {error && <div className="auth-err">{error}</div>}
        {ok    && <div className="auth-ok">✓ {ok}</div>}
      </div>
    </div>
  );
}

// ── PROFILE / STREAK MODAL ────────────────────────────────────────────────────
function ProfileModal({ user, onClose, onLogout }) {
  const streak  = user.streak || 0;
  const longest = user.longestStreak || 0;
  const joined  = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString("en-US",{month:"long",year:"numeric"}) : "Recently";

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="profile-modal">
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <button className="x-btn" onClick={onClose}>✕</button>
        </div>

        <div className="profile-top">
          <div className="profile-avatar">{(user.name||"U")[0].toUpperCase()}</div>
          <div className="profile-name">{user.name}</div>
          <div className="profile-email">{user.email} · Joined {joined}</div>
        </div>

        <div className="streak-section">
          <div className="streak-title">🔥 Your Streak</div>
          <div className="streak-stats">
            <div>
              <div className="streak-stat-n">{streak}</div>
              <div className="streak-stat-l">Day Streak</div>
            </div>
            <div>
              <div className="streak-stat-n">{longest}</div>
              <div className="streak-stat-l">Best Streak</div>
            </div>
            <div>
              <div className="streak-stat-n">{streak >= 7 ? "🏆" : streak >= 3 ? "⭐" : "🌱"}</div>
              <div className="streak-stat-l">Badge</div>
            </div>
          </div>
          <div className="streak-flames">
            {Array.from({length:7},(_,i)=>(
              <span key={i} className={`flame ${i < streak % 7 || (streak >= 7 && i < 7) ? "lit":""}`}>🔥</span>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:12,fontSize:11,color:"var(--gold)"}}>
            {streak === 0 ? "Visit daily to start your streak!" :
             streak === 1 ? "Great start! Come back tomorrow 🌙" :
             streak < 7  ? `${7-streak} more days to earn a weekly badge!` :
             "MashaAllah! 7-day streak achieved! 🏆"}
          </div>
        </div>

        <button className="logout-btn" onClick={()=>{clearSession();onLogout();onClose();}}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ── DAILY PAGE ─────────────────────────────────────────────────────────────────
function DailyPage({ onJourney, onSave, saved }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tafTxt,  setTafTxt]  = useState("");
  const [tafLoad, setTafLoad] = useState(false);
  const [tafQ,    setTafQ]    = useState("");
  const [showTaf, setShowTaf] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setTafTxt(""); setShowTaf(false);
    try { setData((await (await fetch(`${API}/daily`)).json())); }
    catch { setData(null); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTafseer = async (q) => {
    if (!data?.ayah) return;
    setTafLoad(true);
    try {
      const res = await fetch(`${API}/tafseer?reference=${encodeURIComponent(data.ayah.reference)}&question=${encodeURIComponent(q || "")}`);
      const tafData = await res.json();
      setTafTxt(tafData.tafseer || "Tafseer not available.");
    } catch {
      setTafTxt("Unable to load tafseer.");
    }
    setTafLoad(false);
  };

  if (loading) return <div className="loading"><div className="spinner"/><div className="l-ar">آيَةٌ كَرِيمَةٌ</div><div className="l-txt">Loading today's ayah…</div></div>;
  if (!data)   return <div className="err">Could not load. Check backend is running.</div>;

  const isSaved = !!saved?.find(s=>s.id===data.ayah.id);

  return (
    <div className="daily-pg">
      <div className="pg-hd">
        <div className="pg-badge">✨ Daily Ayah</div>
        <div className="pg-title">Your Verse for Today</div>
        <p className="pg-sub">A new verse every visit — refresh for another</p>
      </div>
      <div className="daily-main">
        <div className="d-lbl">📖 {data.ayah.source} — {data.ayah.reference}</div>
        <div className="d-arabic">{data.ayah.arabic}</div>
        <div className="d-english">"{data.ayah.english}"</div>
        <div className="d-ref">{data.ayah.reference} · {data.ayah.book}</div>
        {getAudioUrl(data.ayah.reference) && <AyahAudio reference={data.ayah.reference} size="daily"/>}
        <div className="d-actions">
          <button className="d-btn" onClick={load}>↻ New Ayah</button>
          <button className="d-btn" onClick={()=>onJourney(data.ayah.english)}>🗺 Journey</button>
          <button className="d-btn" onClick={()=>{setShowTaf(!showTaf);if(!showTaf&&!tafTxt)handleTafseer(null);}}>
            📖 {showTaf?"Hide Tafseer":"Read Tafseer"}
          </button>
          <button className={`d-btn ${isSaved?"saved":""}`} onClick={()=>onSave(data.ayah)} style={isSaved?{color:"var(--gold-xl)",borderColor:"var(--gold-d)"}:{}}>
            {isSaved?"♥ Saved":"♡ Save"}
          </button>
        </div>
        {showTaf && (
          <div className="tafseer-box">
            <div className="taf-box-hd">📖 AI Tafseer — {data.ayah.reference}</div>
            <div className="taf-box-text">{tafLoad?"Consulting classical sources…":tafTxt}</div>
            {!tafLoad && <>
              <textarea className="taf-box-q" rows={2} placeholder="Ask a question about this ayah…" value={tafQ} onChange={e=>setTafQ(e.target.value)}/>
              <button className="taf-box-ask" disabled={!tafQ.trim()||tafLoad} onClick={()=>{handleTafseer(tafQ);setTafQ("");}}>Ask →</button>
            </>}
          </div>
        )}
      </div>
      {data.related_hadith && (
        <div className="d-hadith">
          <div className="d-had-lbl">🕌 Related Hadith</div>
          {data.related_hadith.arabic && (
            <div style={{fontFamily:"'Amiri',serif",fontSize:19,direction:"rtl",textAlign:"right",marginBottom:12,lineHeight:1.85,color:"var(--text)"}}>
              {data.related_hadith.arabic}
            </div>
          )}
          <div style={{fontSize:14,color:"var(--t2)",lineHeight:1.7,marginBottom:10}}>{data.related_hadith.english}</div>
          <div style={{fontSize:11,color:"var(--t3)",fontStyle:"italic"}}>{data.related_hadith.reference} · {data.related_hadith.book}</div>
        </div>
      )}
    </div>
  );
}

// ── MOOD PAGE ─────────────────────────────────────────────────────────────────
function MoodPage({ globalSave, globalSaved }) {
  const [active,  setActive]  = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [journey, setJourney] = useState(null);

  const pick = async mood => {
    setActive(mood); setLoading(true); setResults([]);
    try { setResults(((await (await fetch(`${API}/mood/${mood.id}`)).json()).results)||[]); }
    catch { setResults([]); }
    setLoading(false);
  };

  return (
    <div className="mood-pg">
      <div className="pg-hd">
        <div className="pg-badge">💭 Mood Guidance</div>
        <div className="pg-title">How Are You Feeling?</div>
        <p className="pg-sub">Select your mood — AI semantic search finds the most relevant divine guidance</p>
      </div>
      <div className="mood-grid">
        {MOODS.map(m=>(
          <div key={m.id} className={`mood-big ${active?.id===m.id?"on":""}`} onClick={()=>pick(m)}>
            <div className="mb-emoji">{m.emoji}</div>
            <div className="mb-name">{m.name}</div>
            <div className="mb-desc">{m.desc}</div>
          </div>
        ))}
      </div>
      {active && !loading && results.length > 0 && (
        <div className="mood-result-banner">
          <span className="mrb-emoji">{active.emoji}</span>
          <div>
            <div className="mrb-name">Guidance for being {active.id === "sad" ? "being sad" : active.name.toLowerCase()}</div>
            <div className="mrb-sub">{results.length} results · {active.desc}</div>
          </div>
        </div>
      )}
      {loading && <div className="loading"><div className="spinner"/><div className="l-txt">Finding guidance for {active?.name}…</div></div>}
      {!loading && active && results.map((r,i)=>(
        <ResultCard key={r.id} r={r} idx={i}
          onJourney={q=>setJourney(q)}
          onSave={globalSave}
          saved={!!globalSaved.find(x=>x.id===r.id)}/>
      ))}
      {journey && <JourneyModal query={journey} onClose={()=>setJourney(null)}/>}
    </div>
  );
}

// ── TOPICS PAGE ───────────────────────────────────────────────────────────────
function TopicsPage({ globalSave, globalSaved }) {
  const [selected, setSelected] = useState(null);
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [journey,  setJourney]  = useState(null);

  const pick = async t => {
    setSelected(t); setLoading(true); setResults([]);
    try { setResults(((await (await fetch(`${API}/topic/${encodeURIComponent(t.name)}`)).json()).results)||[]); }
    catch { setResults([]); }
    setLoading(false);
  };

  return (
    <div>
      <div className="pg-hd" style={{paddingTop:32}}>
        <div className="pg-badge">🗂 Topic Explorer</div>
        <div className="pg-title">Browse by Topic</div>
        <p className="pg-sub">Select a topic to explore related verses and hadiths</p>
      </div>
      <div className="topics-grid">
        {TOPICS_LIST.map(t=>(
          <div key={t.name} className={`topic-card ${selected?.name===t.name?"on":""}`} onClick={()=>pick(t)}>
            <div className="t-ico">{t.emoji}</div>
            <div className="t-name">{t.name}</div>
          </div>
        ))}
      </div>
      {loading && <div className="loading"><div className="spinner"/><div className="l-txt">Exploring {selected?.name}…</div></div>}
      {!loading && selected && results.length > 0 && (
        <>
          <div className="results-hd">
            <div className="r-count">{selected.emoji} <strong>{results.length}</strong> results for "{selected.name}"</div>
          </div>
          {results.map((r,i)=>(
            <ResultCard key={r.id} r={r} idx={i}
              onJourney={q=>setJourney(q)}
              onSave={globalSave}
              saved={!!globalSaved.find(x=>x.id===r.id)}/>
          ))}
        </>
      )}
      {journey && <JourneyModal query={journey} onClose={()=>setJourney(null)}/>}
    </div>
  );
}

// ── SAVED PAGE ────────────────────────────────────────────────────────────────
function SavedPage({ saved, onRemove, onJourney }) {
  const [reflection, setReflection] = useState("");
  const [loading,    setLoading]    = useState(false);

  const handleReflect = async () => {
    if (!saved.length) return;
    setLoading(true);
    try {
      const savedText = saved.map(i=>`${i.reference}: ${i.english}`).join("\n");
      const res = await fetch(`${API}/chat?query=Based on these saved verses, write a personal spiritual reflection: ${encodeURIComponent(savedText.slice(0,500))}`);
      const data = await res.json();
      setReflection(data.response || "Reflection could not be generated.");
    } catch {
      setReflection("Unable to generate reflection.");
    }
    setLoading(false);
  };

  if (saved.length === 0) return (
    <div className="saved-pg">
      <div className="empty">
        <div className="empty-sym">🔖</div>
        <div className="empty-t">No saved verses yet</div>
        <div className="empty-s">Search and save ayaat & hadiths — they'll appear here</div>
      </div>
    </div>
  );

  return (
    <div className="saved-pg">
      <div className="pg-hd">
        <div className="pg-badge">🔖 My Collection</div>
        <div className="pg-title">Saved Verses & Hadiths</div>
        <p className="pg-sub">{saved.length} saved — your personal Islamic knowledge collection</p>
      </div>
      <div className="saved-grid">
        {saved.map((r,i)=>(
          <div className="sv-card" key={r.id} style={{animationDelay:`${i*0.05}s`}}>
            {r.arabic && <div className="sv-ar">{r.arabic}</div>}
            <div className="sv-en">{r.english}</div>
            <div className="sv-foot">
              <span className="sv-ref">{r.reference}</span>
              <button className="sv-rm" onClick={()=>onRemove(r)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <button className="reflect-btn" onClick={handleReflect} disabled={loading}>
        {loading?"Generating your reflection…":"✦ Generate AI Spiritual Reflection"}
      </button>
      {reflection && (
        <div className="reflect-out">
          <div className="reflect-hd">✦ Your Personalised Spiritual Reflection</div>
          <div className="reflect-txt">{reflection}</div>
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function HidayahHub() {
  const [tab,       setTab]      = useState("home");
  const [query,     setQuery]    = useState("");
  const [filter,    setFilter]   = useState("All");
  const [results,   setResults]  = useState([]);
  const [loading,   setLoading]  = useState(false);
  const [searched,  setSearched] = useState(false);
  const [error,     setError]    = useState(null);
  const [journey,   setJourney]  = useState(null);
  const [saved,     setSaved]    = useState([]);
  const [toast,     setToast]    = useState(null);
  const [listening, setListening]= useState(false);
  const [mood,      setMood]     = useState(null);
  const [expanded,  setExpanded] = useState([]);
  const [dailyData, setDailyData]= useState(null);

  // Auth & Streak
  const [user,        setUser]        = useState(null);
  const [showAuth,    setShowAuth]    = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenu,  setMobileMenu]  = useState(false);
  const [mobileSearch,setMobileSearch]= useState(false);
  const [stats,       setStats]       = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const inputRef  = useRef(null);
  const recRef    = useRef(null);
  const moodTimer = useRef(null);

  // Restore session on mount
  useEffect(() => {
    const s = loadSession();
    if (s) {
      const updated = updateStreak(s.email);
      if (updated) {
        const fresh = { ...s, ...updated };
        saveSession(fresh);
        setUser(fresh);
      } else {
        setUser(s);
      }
    }
  }, []);

  // Load daily data
  useEffect(() => {
    fetch(`${API}/daily`).then(r=>r.json()).then(setDailyData).catch(()=>{});
  }, []);

  useEffect(() => {
    fetch(`${API}/stats`).then(r=>r.json()).then(setStats).catch(()=>{});
  }, []);

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(null), 2800); };

  const openTab = (nextTab) => {
    setTab(nextTab);
    setSearched(false);
    setMobileMenu(false);
    setMobileSearch(false);
  };

  const toggleSave = r => {
    const has = saved.find(x=>x.id===r.id);
    if (has) { setSaved(p=>p.filter(x=>x.id!==r.id)); showToast("Removed from collection"); }
    else      { setSaved(p=>[...p,r]); showToast("✦ Saved to collection"); }
  };

  const handleVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast("Voice search not supported in this browser"); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const rec = new SR(); rec.lang="en-US"; rec.interimResults=false;
    rec.onresult = e => { const t=e.results[0][0].transcript; setQuery(t); setListening(false); handleSearch(t); };
    rec.onerror = rec.onend = () => setListening(false);
    recRef.current=rec; rec.start(); setListening(true);
    showToast("🎙️ Listening… speak now");
  }, [listening]);

  // AI mood detect
  useEffect(() => {
    if (!query.trim() || query.length < 8) { setMood(null); return; }
    clearTimeout(moodTimer.current);
    moodTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/chat?query=Detect the emotion in this text. Return ONLY a JSON: {"mood":"one word","emoji":"one emoji","suggestion":"short suggestion"} Text: ${encodeURIComponent(query)}`);
        const data = await res.json();
        try {
          const parsed = JSON.parse(data.response);
          setMood(parsed);
        } catch {
          setMood(null);
        }
      } catch {
        setMood(null);
      }
    }, 1300);
    return () => clearTimeout(moodTimer.current);
  }, [query]);

  const handleSearch = async (q = query) => {
    if (!q.trim()) return;
    setLoading(true); setSearched(true); setResults([]); setError(null); setExpanded([]);
    setTab("home");
    try {
      const res = await fetch(`${API}/search?query=${encodeURIComponent(q)}&filter=${filter}&top_k=10`);
      if (!res.ok) throw new Error();
      setResults((await res.json()).results || []);
      
      // Get related suggestions
      try {
        const suggestRes = await fetch(`${API}/chat?query=Generate 4 related search suggestions for: ${encodeURIComponent(q)}. Return ONLY JSON: {"queries":["q1","q2","q3","q4"]}`);
        const suggestData = await suggestRes.json();
        const parsed = JSON.parse(suggestData.response);
        if (parsed.queries) setExpanded(parsed.queries);
      } catch {}
    } catch {
      setError("Backend not connected. Run: uvicorn main:app --reload --port 8000");
    } finally { setLoading(false); }
  };

  const NAV_TABS = [
    { id:"home",    label:"Search" },
    { id:"mood",    label:"Mood" },
    { id:"topics",  label:"Topics" },
    { id:"surahs",  label:"Surahs" },
    { id:"daily",   label:"Daily" },
    { id:"asma",    label:"Asma" },
    { id:"prayer",  label:"Prayer" },
    { id:"saved",   label:`Saved${saved.length>0?` (${saved.length})`:""}` },
  ];

  const DASH_PAGES = [
    { id:"home",   label:"Search",          icon:"🔍" },
    { id:"mood",   label:"Mood",            icon:"💭" },
    { id:"topics", label:"Topics",          icon:"🗂" },
    { id:"surahs", label:"Surahs",          icon:"📖" },
    { id:"daily",  label:"Daily",           icon:"✨" },
    { id:"asma",   label:"Asma ul Husna",   icon:"☪" },
    { id:"prayer", label:"Prayer Times",    icon:"🕌" },
    { id:"saved",  label:`Saved${saved.length>0?` (${saved.length})`:""}`, icon:"🔖" },
  ];

  return (
    <>
      <style>{S}</style>
      <div className="scene"><div className="grid"/></div>
      <div className="shell">

        {/* NAV */}
        <nav className="nav">
          <div className="nav-main">
            <div className="nav-brand" onClick={()=>{openTab("home");setResults([]);}}>
              <div className="logo-gem">ه</div>
              <div className="nav-brand-copy">
                <div className="nav-title-row">
                  <div className="logo-text">HidayahHub</div>
                  <span className="nav-kicker">AI Quran + Hadith</span>
                </div>
                <div className="logo-sub" style={{display:"block"}}>Clear search, reading, and guidance in one place</div>
              </div>
            </div>

          </div>

          <div className="mobile-shell-actions">
            <button className="mobile-search-btn" onClick={()=>{ openTab("home"); setTimeout(()=>inputRef.current?.focus(),80); }} aria-label="Search">🔍</button>
            <button className="mobile-toggle" onClick={()=>setMobileMenu(m=>!m)} aria-label="Menu">☰</button>
          </div>

          <div className="nav-right">
            <div className="nav-actions">
              <div className="nav-stat"><div className="nav-stat-n">{stats?.total ?? "—"}</div><div className="nav-stat-l">Total</div></div>
              <div className="nav-stat"><div className="nav-stat-n">{stats?.quran ?? "—"}</div><div className="nav-stat-l">Quran</div></div>
              <div className="nav-stat"><div className="nav-stat-n">{stats?.hadith ?? "—"}</div><div className="nav-stat-l">Hadith</div></div>
            </div>

            {user && user.streak > 0 && (
              <div className="streak-badge" onClick={()=>setShowProfile(true)}>
                <span className="streak-fire">🔥</span>
                <div>
                  <div className="streak-num">{user.streak}</div>
                  <div className="streak-lbl">day streak</div>
                </div>
              </div>
            )}

            {user ? (
              <div className="user-btn" onClick={()=>setShowProfile(true)}>
                <div className="user-avatar">{(user.name||"U")[0].toUpperCase()}</div>
                <span className="user-name-sm">{user.name.split(" ")[0]}</span>
              </div>
            ) : (
              <button className="go-btn" style={{padding:"7px 16px",fontSize:12}} onClick={()=>setShowAuth(true)}>
                Sign In
              </button>
            )}
          </div>

          <div className={`mobile-menu ${mobileMenu ? "open" : ""}`}>
            {NAV_TABS.map(t=>(
              <button key={t.id} className={`tab-btn ${tab===t.id?"on":""}`} onClick={()=>openTab(t.id)}>{t.label}</button>
            ))}
          </div>
        </nav>

        <div className="app-body">
          <aside className={`side-dash ${sidebarOpen ? "open" : ""}`}>
            <button className="home-corner" onClick={()=>setSidebarOpen(o=>!o)}>
              <div className="home-corner-ico">⌂</div>
              <div className="home-corner-copy">
                <div className="home-corner-t">Home corner</div>
                <div className="home-corner-s">{sidebarOpen ? "Hide pages" : "Show pages"}</div>
              </div>
            </button>
            <div className="side-pages">
              {DASH_PAGES.map(page => (
                <button
                  key={page.id}
                  className={`side-page ${tab===page.id ? "on" : ""}`}
                  onClick={()=>openTab(page.id)}
                  title={page.label}
                >
                  <span className="side-page-ico">{page.icon}</span>
                  <span className="side-page-txt">{page.label}</span>
                </button>
              ))}
            </div>
          </aside>

          <div className="page">

          {tab==="mood"    && <MoodPage globalSave={toggleSave} globalSaved={saved}/>}
          {tab==="topics"  && <TopicsPage globalSave={toggleSave} globalSaved={saved}/>}
          {tab==="surahs"  && <SurahPage/>}
          {tab==="daily"   && <DailyPage onJourney={setJourney} onSave={toggleSave} saved={saved}/>}
          {tab==="asma"    && <AsmaPage/>}
          {tab==="prayer"  && <PrayerPage/>}
          {tab==="saved"   && <SavedPage saved={saved} onRemove={toggleSave} onJourney={setJourney}/>}

          {/* HOME */}
          {tab==="home" && (
            <>
              {!searched && (
                <div className="hero">
                  <div className="bism">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                  <div className="hero-badge">✦ AI Semantic Search Engine</div>
                  <h1 className="hero-h1">Search by  Meaning,<br/>Not Just Words</h1>
                  <p className="hero-p">
                    Explore 39,000+ Quranic verses and hadiths using AI semantic embeddings.
                    Type a feeling, concept, or question in plain English.
                  </p>

                  <div className="s-outer">
                    {mood && (
                      <div className="mood-detect">
                        <span className="md-emoji">{mood.emoji}</span>
                        <div className="md-info">
                          <div className="md-lbl">Mood detected</div>
                          <div className="md-val">{mood.mood} — {mood.suggestion}</div>
                        </div>
                        <button className="md-btn" onClick={()=>{setQuery(mood.suggestion || mood.mood);handleSearch(mood.suggestion || mood.mood);}}>Search →</button>
                      </div>
                    )}
                    <div className="s-box">
                      <span className="s-ico">⊙</span>
                      <input ref={inputRef} className="s-in"
                        placeholder="e.g. patience during hardship, gratitude, forgiveness..."
                        value={query} onChange={e=>setQuery(e.target.value)}
                        onKeyDown={e=>e.key==="Enter"&&handleSearch()}/>
                      <button className={`voice-btn ${listening?"on":""}`} onClick={handleVoice} title="Voice search">🎙️</button>
                      <button className="go-btn" onClick={()=>handleSearch()} disabled={!query.trim()}>Search</button>
                    </div>
                    <div className="filtrs">
                      {["All","Quran","Hadith"].map(f=>(
                        <button key={f} className={`f-btn ${filter===f?"on":""}`} onClick={()=>setFilter(f)}>{f}</button>
                      ))}
                    </div>
                  </div>

                  <div className="chips-wrap">
                    <div className="chips-lbl">Try searching for</div>
                    <div className="chips">
                      {SUGGS.map(s=>(
                        <button key={s} className="chip" onClick={()=>{setQuery(s);handleSearch(s);}}>{s}</button>
                      ))}
                    </div>
                  </div>

                  <div className="modules">
                    <div className="mod-card" onClick={()=>setTab("mood")}>
                      <div className="mod-ico">💭</div>
                      <div className="mod-name">Mood-Based Guidance</div>
                      <div className="mod-desc">Select how you feel right now — AI semantic search finds the most relevant divine guidance for your emotional state.</div>
                      <button className="mod-arrow">Open Mood Search →</button>
                    </div>
                    <div className="mod-card" onClick={()=>setTab("surahs")}>
                      <div className="mod-ico">📖</div>
                      <div className="mod-name">Browse All 114 Surahs</div>
                      <div className="mod-desc">Complete Quran browser with Arabic, English & Urdu translation for every ayah. Audio recitation by Mishary Alafasy.</div>
                      <button className="mod-arrow">Open Surah Browser →</button>
                    </div>
                    <div className="mod-card" onClick={()=>setTab("asma")}>
                      <div className="mod-ico">☪</div>
                      <div className="mod-name">Asma ul Husna</div>
                      <div className="mod-desc">Explore all 99 Beautiful Names of Allah with meanings, descriptions, and a dhikr counter for each name.</div>
                      <button className="mod-arrow">Open Asma ul Husna →</button>
                    </div>
                    <div className="mod-card" onClick={()=>setTab("prayer")}>
                      <div className="mod-ico">🕌</div>
                      <div className="mod-name">Prayer Times — Pakistan</div>
                      <div className="mod-desc">Live prayer times for 10 major Pakistani cities — Karachi, Lahore, Islamabad, Peshawar and more. Live countdown to next prayer.</div>
                      <button className="mod-arrow">View Prayer Times →</button>
                    </div>
                    <div className="mod-card" onClick={()=>setTab("topics")}>
                      <div className="mod-ico">🗂</div>
                      <div className="mod-name">Topic Explorer</div>
                      <div className="mod-desc">Browse 15 curated Islamic topics — patience, gratitude, tawakkul, forgiveness and more.</div>
                      <button className="mod-arrow">Explore Topics →</button>
                    </div>
                    <div className="mod-card" onClick={()=>setTab("daily")}>
                      <div className="mod-ico">✨</div>
                      <div className="mod-name">Daily Ayah + Tafseer</div>
                      <div className="mod-desc">A fresh verse every visit with AI Tafseer, audio recitation, and a related hadith.</div>
                      <button className="mod-arrow">Open Daily Ayah →</button>
                    </div>
                    <div className="mod-card" onClick={()=>user?setShowProfile(true):setShowAuth(true)}>
                      <div className="mod-ico">🔥</div>
                      <div className="mod-name">Daily Streak</div>
                      <div className="mod-desc">{user ? `Your streak: ${user.streak || 0} day${(user.streak||0)===1?"":"s"}. Best: ${user.longestStreak||0} days. Keep coming back daily!` : "Sign in to track your daily visit streak and earn badges for consistency."}</div>
                      <button className="mod-arrow">{user?"View Streak →":"Sign In to Track →"}</button>
                    </div>
                    <div className="mod-card" onClick={()=>setTab("saved")}>
                      <div className="mod-ico">🔖</div>
                      <div className="mod-name">My Collection</div>
                      <div className="mod-desc">Save verses and hadiths. Generate a personalised AI spiritual reflection from your collection.</div>
                      <button className="mod-arrow">View Collection ({saved.length} saved) →</button>
                    </div>
                  </div>

                  <div className="mood-quick">
                    <div className="sec-title">Quick Mood Search</div>
                    <div className="mood-row">
                      {MOODS.slice(0,5).map(m=>(
                        <div key={m.id} className="mood-mini" onClick={()=>setTab("mood")}>
                          <div className="mm-emoji">{m.emoji}</div>
                          <div className="mm-name">{m.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {dailyData && (
                    <div className="daily-preview" onClick={()=>setTab("daily")}>
                      <div className="dp-label">✨ Today's Ayah — Click to open full view</div>
                      <div className="dp-arabic">{dailyData.ayah.arabic}</div>
                      <div className="dp-english">"{dailyData.ayah.english}"</div>
                      <div className="dp-ref">— {dailyData.ayah.reference} · {dailyData.ayah.book}</div>
                      <button className="dp-cta">Open Daily Ayah with Tafseer & Audio →</button>
                    </div>
                  )}
                </div>
              )}

              {searched && (
                <div style={{padding:"22px 0 0"}}>
                  <div className="s-outer" style={{maxWidth:"100%"}}>
                    {mood && (
                      <div className="mood-detect">
                        <span className="md-emoji">{mood.emoji}</span>
                        <div className="md-info"><div className="md-lbl">Mood</div><div className="md-val">{mood.mood} — {mood.suggestion}</div></div>
                        <button className="md-btn" onClick={()=>handleSearch(mood.suggestion || mood.mood)}>Search mood →</button>
                      </div>
                    )}
                    <div className="s-box">
                      <span className="s-ico">⊙</span>
                      <input className="s-in" placeholder="Search again…"
                        value={query} onChange={e=>setQuery(e.target.value)}
                        onKeyDown={e=>e.key==="Enter"&&handleSearch()}/>
                      <button className={`voice-btn ${listening?"on":""}`} onClick={handleVoice}>🎙️</button>
                      <button className="go-btn" onClick={()=>handleSearch()} disabled={!query.trim()}>Search</button>
                    </div>
                    <div className="filtrs">
                      {["All","Quran","Hadith"].map(f=>(
                        <button key={f} className={`f-btn ${filter===f?"on":""}`} onClick={()=>setFilter(f)}>{f}</button>
                      ))}
                    </div>
                    {expanded.length > 0 && (
                      <div className="expand-row">
                        <div className="expand-lbl">🔮 AI also suggests</div>
                        <div className="expand-chips">
                          {expanded.map(q=>(
                            <button key={q} className="exp-chip" onClick={()=>{setQuery(q);handleSearch(q);}}>{q}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && <div className="err">⚠ {error}</div>}
              {loading && (
                <div className="loading">
                  <div className="spinner"/>
                  <div className="l-ar">يَبْتَغُونَ الْعِلْمَ</div>
                  <div className="l-txt">Searching through divine wisdom via AI semantic embeddings…</div>
                </div>
              )}
              {!loading && searched && !error && (
                results.length > 0 ? (
                  <>
                    <div className="results-hd">
                      <div className="r-count"><strong>{results.length}</strong> results found</div>
                      <div className="r-qry">"{query}"</div>
                    </div>
                    {results.map((r,i)=>(
                      <ResultCard key={r.id} r={r} idx={i}
                        onJourney={setJourney}
                        onSave={toggleSave}
                        saved={!!saved.find(s=>s.id===r.id)}/>
                    ))}
                  </>
                ) : (
                  <div className="empty">
                    <div className="empty-sym">◌</div>
                    <div className="empty-t">No results found</div>
                    <div className="empty-s">Try different keywords or use the Mood / Topic search</div>
                  </div>
                )
              )}
            </>
          )}
          </div>
        </div>
      </div>

      {/* AI Chatbot */}
      <AiChatbot />

      {journey    && <JourneyModal query={journey} onClose={()=>setJourney(null)}/>}
      {showAuth   && <AuthModal onClose={()=>setShowAuth(false)} onLogin={u=>{setUser(u);showToast(`Welcome, ${u.name}! 🌙`);}}/>}
      {showProfile && user && (
        <ProfileModal
          user={user}
          onClose={()=>setShowProfile(false)}
          onLogout={()=>{setUser(null);showToast("Signed out. Fi amanillah 🌙");}}
        />
      )}
      {toast && <div className="toast">✦ {toast}</div>}
    </>
  );
}
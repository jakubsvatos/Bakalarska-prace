const essayInput = document.querySelector("#essayText");
const studentNameInput = document.querySelector("#studentName");
const evaluateButton = document.querySelector("#evaluateButton");
const sampleButton = document.querySelector("#sampleButton");
const documentInput = document.querySelector("#documentInput");
const fileStatus = document.querySelector("#fileStatus");
const fileMeta = document.querySelector("#fileMeta");
const uploadAlert = document.querySelector("#uploadAlert");
const emptyState = document.querySelector("#emptyState");
const emptyStateMessage = document.querySelector("#emptyStateMessage");
const resultsPanel = document.querySelector("#resultsPanel");
const scoreTitle = document.querySelector("#scoreTitle");
const scoreValue = document.querySelector("#scoreValue");
const starCount = document.querySelector("#starCount");
const badgeCount = document.querySelector("#badgeCount");
const trophyCount = document.querySelector("#trophyCount");
const sectionPanels = document.querySelector("#sectionPanels");
const criteriaList = document.querySelector("#criteriaList");
const tipsToggle = document.querySelector("#tipsToggle");
const tipsPanel = document.querySelector("#tipsPanel");
const tipsList = document.querySelector("#tipsList");

const STAR_ICON = "⭐";
const BADGE_ICON = "🏅";
const TROPHY_ICON = "🏆";
const GUIDE_ICON = "🧭";
const A4_WORD_TARGET = 450;
const INTRO_TARGET_WORDS = 230;
const THEORY_TARGET_WORDS = 600;
const PRACTICE_TARGET_WORDS = 600;
const CONCLUSION_TARGET_WORDS = 300;

const sampleEssay = `Můj projekt se jmenuje Péče o školní zahradu.

Úvod
Brr, ráno bylo na školní zahradě chladné a listy se skoro třpytily! Hned mě napadlo, že právě tady se dá skvěle sledovat, co rostliny potřebují ke zdravému růstu. Cílem práce je popsat podmínky růstu rostlin a ověřit je pozorováním školního záhonu. Hypotéza zní: Pokud mají rostliny vhodné podmínky, rostou zdravěji a lépe odolávají suchu.

Teoretická část

1. Podmínky růstu rostlin
Rostlina potřebuje světlo, vodu, vzduch, živiny a vhodnou teplotu. Fotosyntéza je děj, při kterém rostlina vytváří organické látky. Kořen přijímá vodu a minerální látky z půdy. Stonek rozvádí vodu do dalších částí rostliny. List obsahuje chlorofyl, který zachycuje světelnou energii. Půda ovlivňuje množství vody i přístup vzduchu. Humus zlepšuje úrodnost půdy. Nedostatek vláhy zpomaluje růst. Přebytek vody může poškodit kořenový systém. Každý druh rostliny potřebuje jiné podmínky prostředí.

2. Péče o školní záhon
Při pěstování rostlin je důležité pravidelné zalévání, kypření půdy a odstraňování plevele. Hustota výsadby ovlivňuje přístup světla i vzduchu. Plevel odebírá pěstovaným rostlinám živiny. Mulčování pomáhá udržet vlhkost v půdě. Kompost zvyšuje obsah organických látek. Pozorování stavu listů ukazuje, zda je rostlina zdravá. Žloutnutí listů může souviset s nedostatkem živin. Suchá půda snižuje schopnost rostlin přijímat vodu. Pravidelná péče podporuje stabilní růst. Tyto poznatky souvisejí s praktickou částí, ve které je sledován stav školního záhonu.

Praktická část
Nejprve bylo po dobu jednoho týdne sledováno, jak vypadá půda a listy rostlin na školním záhonu. Potom bylo zapisováno, kdy je půda suchá a kdy byla provedena zálivka. Pozorování ukázalo, že nejvíce vadly rostliny vysazené blízko sebe. Po zalití se zlepšil vzhled listů a půda byla déle vlhká v záhonu s mulčem. Výsledek podporuje hypotézu, že vhodné podmínky pomáhají zdravému růstu.

Závěr
Jaký rozdíl dokáže udělat obyčejná voda a správná péče! Teoretické poznatky pomohly vysvětlit výsledky pozorování ve školní zahradě. Praktická část ukázala, že péče o půdu, zalévání a rozestupy mezi rostlinami mají skutečný vliv na jejich stav. Hypotéza byla podpořena a práce ukázala, že školní zahrada je vhodným místem pro přírodovědné pozorování.`;

let loadedDocumentName = "";

const DEFAULT_EMPTY_MESSAGE = "Sem se zobrazí tvoje hvězdy, odznaky a doporučení.";

function normalizeText(text) {
  return text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function splitParagraphs(text) {
  return text.split(/\n\s*\n/).map((paragraph) => paragraph.trim().replace(/\n+/g, " ")).filter(Boolean);
}

function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
}

function getWords(text) {
  const matches = text.match(/[A-Za-zÁ-ž0-9]+/g);
  return matches ? matches : [];
}

function quoteSnippet(text, maxLength = 110) {
  const clean = (text || "").trim().replace(/\s+/g, " ");
  if (!clean) return "„“";
  const shortened = clean.length > maxLength ? `${clean.slice(0, maxLength - 1).trim()}…` : clean;
  return `„${shortened}“`;
}

function evaluateLength(words, target, label, rewardTitle, rewardDescription, maxPoints = 10) {
  const detail = `${label} má přibližně ${words} slov.`;
  if (words >= target) {
    return {
      points: maxPoints,
      strength: `${label} má výborný rozsah. ${detail}`,
      reward: createReward(STAR_ICON, rewardTitle, rewardDescription),
      detail,
    };
  }
  if (words >= Math.round(target * 0.7)) {
    return {
      points: Math.max(6, maxPoints - 3),
      strength: `${label} už má solidní rozsah. ${detail}`,
      missing: `${label} můžeš ještě trochu rozšířit, aby působil(a) úplně hotově.`,
      detail,
    };
  }
  return {
    points: Math.max(2, maxPoints - 7),
    missing: `${label} je zatím spíš krátký/krátká vzhledem k cílovému rozsahu.`,
    tip: `Zkus ${label.toLowerCase()} rozšířit o další konkrétní informace, vysvětlení nebo příklady.`,
    detail,
  };
}

function pickSentence(sentences, predicate = () => true) {
  return sentences.find((sentence) => predicate(sentence)) || sentences[0] || "";
}

function createExamplePicker(context) {
  const used = new Set();

  function take(sentences, predicate = () => true, fallback = "") {
    const normalizedSentences = (sentences || []).filter(Boolean);
    const freshMatch = normalizedSentences.find((sentence) => predicate(sentence) && !used.has(sentence));
    if (freshMatch) {
      used.add(freshMatch);
      return freshMatch;
    }

    const anyMatch = normalizedSentences.find((sentence) => predicate(sentence));
    if (anyMatch) {
      used.add(anyMatch);
      return anyMatch;
    }

    if (fallback) {
      return fallback;
    }

    return normalizedSentences[0] || "";
  }

  return {
    intro: () => take(context.introSentences, () => true, context.introText),
    introExpressive: () => take(
      context.introSentences,
      (sentence) => countExpressiveWords(sentence) + countSensoryWords(sentence) + countEmotionAppeals(sentence) + countInterjections(sentence) + countDialogueMarkers(sentence) > 0,
      context.introText,
    ),
    theoryObjective: () => take(
      context.theorySentences,
      (sentence) => !/\b(já|myslím|můj|moje|mně|mě)\b/i.test(sentence) && getWords(sentence).length >= 6,
      context.theoryText,
    ),
    practice: () => take(context.practiceSentences, () => true, context.practiceText),
    practiceConnection: () => take(
      context.practiceSentences,
      (sentence) => /\b(hypotéza|výsledek|ukázalo|potvrdilo|souvisí|podporuje)\b/i.test(sentence),
      context.practiceText,
    ),
    conclusion: () => take(context.conclusionSentences, () => true, context.conclusionText),
    conclusionExpressive: () => take(
      context.conclusionSentences,
      (sentence) => countExpressiveWords(sentence) + countSensoryWords(sentence) + countEmotionAppeals(sentence) + countInterjections(sentence) + countDialogueMarkers(sentence) > 0,
      context.conclusionText,
    ),
    formatted: () => take(
      context.allSentences,
      (sentence) => /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(sentence) && /[.!?]"?$/.test(sentence),
      context.text,
    ),
  };
}

function countMatches(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function stripHeadingNumber(text) {
  return text.replace(/^\d+[\).]?\s*/, "").trim();
}

function isHeadingParagraph(paragraph) {
  const clean = stripHeadingNumber(paragraph.trim());
  if (!clean) return false;
  if (/^(úvod|teoretická část|praktická část|závěr)$/i.test(clean)) return true;
  return !/[.!?]/.test(clean) && getWords(clean).length <= 8;
}

function detectSectionName(paragraph) {
  const clean = stripHeadingNumber(paragraph.trim().toLowerCase());
  if (clean === "úvod") return "intro";
  if (clean === "teoretická část" || clean === "teorie") return "theory";
  if (clean === "praktická část" || clean === "praxe") return "practice";
  if (clean === "závěr") return "conclusion";
  return "";
}

function parseStructure(text) {
  const paragraphs = splitParagraphs(text);
  const sections = {
    intro: { paragraphs: [] },
    theory: { paragraphs: [], chapters: [] },
    practice: { paragraphs: [] },
    conclusion: { paragraphs: [] },
  };
  let currentSection = "";
  let currentTheoryChapter = null;

  paragraphs.forEach((paragraph) => {
    const explicitSection = detectSectionName(paragraph);
    if (explicitSection) {
      currentSection = explicitSection;
      currentTheoryChapter = null;
      return;
    }
    if (!currentSection) return;

    sections[currentSection].paragraphs.push(paragraph);
    if (currentSection === "theory") {
      if (isHeadingParagraph(paragraph)) {
        currentTheoryChapter = { heading: stripHeadingNumber(paragraph), paragraphs: [] };
        sections.theory.chapters.push(currentTheoryChapter);
        return;
      }
      if (!currentTheoryChapter) {
        currentTheoryChapter = { heading: "Teoretická kapitola", paragraphs: [] };
        sections.theory.chapters.push(currentTheoryChapter);
      }
      currentTheoryChapter.paragraphs.push(paragraph);
    }
  });

  return sections;
}

function extractExpertTerms(theoryText, theoryChapters) {
  const genericWords = new Set([
    "teoretická", "praktická", "kapitola", "část", "části", "protože", "zároveň", "některá", "některé",
    "informace", "pravidelná", "souvislost", "nezajímalo", "jedenáct", "důležité", "důležitý", "několik",
    "většinou", "skutečný", "skutečně", "vhodnou", "vhodné", "různé", "dalších", "další", "pomáhá",
    "ukazuje", "ukázalo", "výsledek", "výsledky", "pozorování", "pravidelně", "prostředí", "podmínky",
    "rostliny", "rostlina", "téma", "práce", "autor", "autora", "obsah", "obsahu", "kapitoly", "závěr",
    "úvod", "praktická", "teoretické", "teoretický", "vysvětlení", "poznatky", "informací", "napsal",
    "napsala", "zajímalo", "něčeho", "nějaký", "nějaká", "jednotlivé", "růst", "péče"
  ]);

  const suffixPattern = /(óza|émie|ismus|izace|ologie|grafie|metrie|fyl|systém|kompost|humus|mulčování|fotosyntéza|chlorofyl|minerální|organické|kořenový)/i;
  const wordMatches = theoryText.match(/[A-Za-zÁ-ž0-9]+/g) || [];
  const frequencies = new Map();

  wordMatches.forEach((rawWord) => {
    const word = rawWord.toLowerCase();
    if (word.length < 5 || /\d/.test(word) || genericWords.has(word)) {
      return;
    }
    frequencies.set(word, (frequencies.get(word) || 0) + 1);
  });

  const headingWords = new Set(
    theoryChapters
      .flatMap((chapter) => (chapter.heading.match(/[A-Za-zÁ-ž0-9]+/g) || []).map((word) => word.toLowerCase()))
      .filter((word) => word.length >= 5 && !genericWords.has(word))
  );

  const singleWordTerms = [...frequencies.entries()]
    .filter(([word, count]) => count >= 2 || headingWords.has(word) || suffixPattern.test(word))
    .map(([word]) => word);

  const phrasePattern = /([A-Za-zÁ-ž]{5,})\s+([A-Za-zÁ-ž]{5,})/g;
  const phraseCounts = new Map();
  let match;
  while ((match = phrasePattern.exec(theoryText)) !== null) {
    const first = match[1].toLowerCase();
    const second = match[2].toLowerCase();
    if (genericWords.has(first) || genericWords.has(second)) {
      continue;
    }
    if (!headingWords.has(first) && !headingWords.has(second) && !suffixPattern.test(`${first} ${second}`)) {
      continue;
    }
    const phrase = `${first} ${second}`;
    phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
  }

  const phraseTerms = [...phraseCounts.entries()]
    .filter(([, count]) => count >= 1)
    .map(([phrase]) => phrase);

  return [...new Set([...phraseTerms, ...singleWordTerms])];
}

function getKeywordSet(text) {
  const stopwords = new Set(["který", "která", "které", "kterou", "kterým", "kterých", "protože", "také", "ještě", "práce", "část", "části", "text", "téma", "tématu", "tento", "tato", "tyto", "jako", "jsou", "byla", "byly", "bude", "bylo", "když", "tedy", "nebo", "proto", "měla", "měl", "mají", "mít", "může", "mohou", "je", "jsme", "jsem", "bych", "aby", "na", "do", "od", "po", "se", "si", "v", "ve", "u", "o", "a", "i", "z", "za", "pro", "s", "že", "to", "ten", "ta"]);
  return new Set(getWords(text).map((word) => word.toLowerCase()).filter((word) => word.length >= 5 && !stopwords.has(word)));
}

function getIntersectionValues(setA, setB) {
  const values = [];
  setA.forEach((value) => {
    if (setB.has(value)) values.push(value);
  });
  return values;
}

function countExpressiveWords(text) {
  return countMatches(text, /\b(úžasn|nádhern|siln|tich|chladn|tepl|voňav|jasn|temn|rychl|pomalu|najednou|opravdu|velmi|nečekaně|krásn|smutn|radostn|děsiv)\w*\b/gi);
}

function countSensoryWords(text) {
  return countMatches(text, /\b(viděl|vidět|zářil|leskl|třpytil|voněl|vůně|slyšel|ticho|hluk|chutnal|dotkl|chladn|tepl|měkk|such|vlhk)\w*\b/gi);
}

function countDialogueMarkers(text) {
  return countMatches(text, /["„“]|:\s*["„]|-\s*[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/g);
}

function countInterjections(text) {
  return countMatches(text, /\b(ach|jé|hej|bum|brr|au|hurá|jejda|páni)\b/gi);
}

function countEmotionAppeals(text) {
  return countMatches(text, /\b(cítil|cítila|překvap|bál|radost|smutek|úžas|napětí|strach|těšil|nadšen)\w*\b/gi);
}

function averageSentenceLength(sentences) {
  if (!sentences.length) return 0;
  return sentences.reduce((sum, sentence) => sum + getWords(sentence).length, 0) / sentences.length;
}

function countRichLanguageWords(text) {
  return countMatches(text, /\b([A-Za-zÁ-ž]{8,})\b/g);
}

function createReward(icon, title, description) {
  return { icon, title, description };
}

function setFileMessage(message, meta = "", isError = false) {
  fileStatus.textContent = message;
  fileStatus.style.color = isError ? "#b44a21" : "";

  if (meta) {
    fileMeta.textContent = meta;
    fileMeta.classList.remove("hidden");
  } else {
    fileMeta.textContent = "";
    fileMeta.classList.add("hidden");
  }
}

function setUploadAlert(message = "") {
  if (!message) {
    uploadAlert.textContent = "";
    uploadAlert.classList.add("hidden");
    return;
  }

  uploadAlert.textContent = message;
  uploadAlert.classList.remove("hidden");
}

function showEmptyState(message = DEFAULT_EMPTY_MESSAGE) {
  resultsPanel.classList.add("hidden");
  emptyState.classList.remove("hidden");
  emptyStateMessage.textContent = message;
}

function getFriendlyUploadError(error, file) {
  const fallback = "Dokument se nepodařilo načíst. Zkus ho otevřít, uložit znovu a nahrát ještě jednou.";
  const message = (error && error.message ? error.message : "").trim();

  if (!file) return fallback;
  if (!/\.pdf$|\.docx$/i.test(file.name)) {
    return "Nahraj prosím soubor ve formátu PDF nebo Word (.docx).";
  }
  if (file.size > 15 * 1024 * 1024) {
    return "Soubor je příliš velký. Zkus menší PDF nebo DOCX do 15 MB.";
  }
  if (/knihovna/i.test(message) || /mammoth|pdfjs/i.test(message)) {
    return "Nepodařilo se načíst knihovnu pro čtení souboru. Zkus stránku obnovit a nahrát dokument znovu.";
  }
  if (/žádný čitelný text/i.test(message)) {
    return "V dokumentu jsem nenašel čitelný text. Zkus textový PDF nebo znovu ulož dokument z Wordu.";
  }
  if (/password|hesl|encrypted/i.test(message)) {
    return "Soubor je pravděpodobně zamčený nebo chráněný. Ulož ho bez hesla a zkus to znovu.";
  }
  if (/network|fetch|failed|worker/i.test(message)) {
    return "Načtení souboru se přerušilo. Obnov stránku a zkus dokument nahrát znovu.";
  }

  return message || fallback;
}

async function extractTextFromPdf(file) {
  if (!window.pdfjsLib) {
    throw new Error("Knihovna pro čtení PDF se nenačetla.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

async function extractTextFromDocx(file) {
  if (!window.mammoth) {
    throw new Error("Knihovna pro čtení Word dokumentů se nenačetla.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function loadDocumentText(file) {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf")) {
    return extractTextFromPdf(file);
  }

  if (lowerName.endsWith(".docx")) {
    return extractTextFromDocx(file);
  }

  throw new Error("Podporované jsou zatím jen soubory .docx a .pdf.");
}

function evaluateStorytellingPart(text, sample, label) {
  const sentences = splitSentences(text);
  const expressive = countExpressiveWords(text);
  const sensory = countSensoryWords(text);
  const dialogue = countDialogueMarkers(text);
  const interjections = countInterjections(text);
  const emotions = countEmotionAppeals(text);
  const avgLength = averageSentenceLength(sentences);
  const richWords = countRichLanguageWords(text);
  const sentenceCount = sentences.length;

  const strengths = [];
  const missing = [];
  const rewards = [];
  let points = 0;

  if (sentenceCount >= 3 && avgLength >= 8) {
    points += 10;
    strengths.push(`${label} je srozumitelný a dobře se čte. Příklad věty: ${quoteSnippet(sample || text)}.`);
    rewards.push(createReward(STAR_ICON, "Srozumitelný hlas", "Text je čitelný a dává smysl."));
  } else {
    missing.push(`${label} potřebuje více rozvinutých a srozumitelných vět.`);
  }

  if (expressive + sensory + emotions + interjections >= 3) {
    points += 10;
    strengths.push(`${label} působí poutavě a snaží se čtenáře vtáhnout do děje nebo nálady.`);
    rewards.push(createReward(BADGE_ICON, "Poutavý autor", "Text umí zaujmout a nese atmosféru."));
  } else {
    missing.push(`${label} by mohl být poutavější pomocí výraznějších slov nebo silnější atmosféry.`);
  }

  if (dialogue > 0 || interjections > 0 || sensory > 0 || emotions > 0) {
    points += 10;
    const tricks = [];
    if (dialogue > 0) tricks.push("přímá řeč");
    if (interjections > 0) tricks.push("citoslovce");
    if (emotions > 0) tricks.push("apel na emoce");
    if (sensory > 0) tricks.push("věty působící na smysly");
    strengths.push(`${label} používá spisovatelské triky. Příklad: ${tricks.join(", ")}.`);
    rewards.push(createReward(STAR_ICON, "Spisovatelský trik", "Autor pracuje s výrazovými prostředky."));
  } else {
    missing.push(`${label} zatím skoro nevyužívá spisovatelské triky jako přímou řeč, citoslovce nebo věty působící na smysly.`);
  }

  if (richWords >= 4 && avgLength >= 10) {
    points += 10;
    strengths.push(`${label} používá bohatší jazyk a rozvitější věty.`);
    rewards.push(createReward(BADGE_ICON, "Bohatý jazyk", "V textu jsou rozvitější věty i pestřejší slovní zásoba."));
  } else {
    missing.push(`${label} by mohl více využít bohatší slovní zásobu, přídavná jména a příslovce.`);
  }

  return {
    points,
    max: 40,
    strengths,
    missing,
    rewards,
    detail: `Výrazová slova: ${expressive}, smyslové výrazy: ${sensory}, citoslovce nebo přímá řeč: ${dialogue + interjections}.`,
  };
}

function evaluateReflectionConclusion(text, sample) {
  const sentences = splitSentences(text);
  const lower = text.toLowerCase();
  const strengths = [];
  const missing = [];
  const rewards = [];
  let points = 0;

  const hasTopic =
    /\b(co mi dalo|co mi vzalo|psaní bakalářské práce|psaní práce|tato práce|tahle práce|tenhle projekt)\b/i.test(text);
  const reasonCount = countMatches(lower, /\b(protože|proto|díky|kvůli|zjistil(?:a)? jsem|uvědomil(?:a)? jsem si|naučil(?:a)? jsem se|pomohlo mi|donutilo mě)\b/gi);
  const opinionCount = countMatches(lower, /\b(myslím|podle mě|za mě|domnívám se|pro mě|můj názor|shrnuji|celkově|závěrem)\b/gi);
  const questionCount = countMatches(text, /\?/g);
  const answerCount = countMatches(lower, /\b(odpověď|odpovídám|ano|ne|myslím, že|došel(?:a)? jsem k tomu|uvědomil(?:a)? jsem si|zjistil(?:a)? jsem)\b/gi);
  const thinkAloudCount = countMatches(lower, /\b(přemýšlel(?:a)? jsem|uvědomil(?:a)? jsem si|došlo mi|možná|asi|nejdřív jsem si myslel(?:a)?|nakonec jsem zjistil(?:a)?)\b/gi);
  const structureCount = countMatches(lower, /\b(proto|protože|takže|na jednu stranu|na druhou stranu|nejdřív|potom|nakonec)\b/gi);
  const concreteCount = countMatches(lower, /\b(konkrétně|například|třeba|při psaní|při hledání|při opravách|čas|zdroj|kapitola|úvod|teorie|praxe|závěr)\b/gi);
  const positives = countMatches(lower, /\b(dalo mi|pomohlo mi|naučilo mě|zlepšilo|bavilo mě|přineslo mi|výhoda|plus|dobré bylo)\b/gi);
  const negatives = countMatches(lower, /\b(vzalo mi|bylo těžké|nebavilo mě|nevýhoda|mínus|potíž|problém|náročné bylo|zabralo mi)\b/gi);

  if (hasTopic) {
    points += 5;
    strengths.push(`Závěr jasně představuje téma úvahy. Příklad věty: ${quoteSnippet(sample || text)}.`);
    rewards.push(createReward(STAR_ICON, "Téma úvahy", "Závěr drží jasné téma: co práce dala a vzala."));
  } else {
    missing.push("V závěru zatím není dost jasně pojmenované téma úvahy: co ti psaní bakalářské práce dalo a vzalo.");
  }

  if (reasonCount >= 2) {
    points += 5;
    strengths.push("V závěru vysvětluješ důvody a ukazuješ, proč sis svůj názor vytvořil(a).");
  } else {
    missing.push("Závěr by měl víc vysvětlovat důvody, ne jen říct výsledek.");
  }

  if (opinionCount >= 1) {
    points += 5;
    strengths.push("V závěru shrnuješ svůj názor nebo osobní pohled na psaní práce.");
    rewards.push(createReward(BADGE_ICON, "Vlastní hlas", "V závěru je slyšet vlastní názor autora."));
  } else {
    missing.push("V závěru by měl být jasněji shrnutý tvůj vlastní názor.");
  }

  if (questionCount >= 1) {
    points += 5;
    strengths.push("Závěr si klade otázky, což podporuje úvahový styl.");
  } else {
    missing.push("Úvahový závěr může být silnější, když si položíš aspoň jednu otázku.");
  }

  if (questionCount >= 1 && answerCount >= 1) {
    points += 5;
    strengths.push("Na položené otázky si také odpovídáš, takže úvaha nezůstává otevřená bez reakce.");
  } else {
    missing.push("Když si v závěru položíš otázku, zkus si na ni také odpovědět.");
  }

  if (thinkAloudCount >= 1) {
    points += 5;
    strengths.push("V závěru je vidět přemýšlení nahlas a osobní uvažování nad tématem.");
  } else {
    missing.push("Závěr může víc ukázat, jak nad tématem opravdu přemýšlíš.");
  }

  if ((questionCount >= 1 && answerCount >= 1 && structureCount >= 2) || structureCount >= 4) {
    points += 5;
    strengths.push("Otázky, odpovědi a další myšlenky na sebe navazují a tvoří strukturu úvahy.");
  } else {
    missing.push("Zkus lépe propojit otázky, odpovědi a další myšlenky, aby úvaha působila souvisle.");
  }

  if (concreteCount >= 2 && sentences.length >= 3) {
    points += 5;
    strengths.push("Závěr píše konkrétně a opírá se o skutečné zkušenosti z psaní práce.");
  } else {
    missing.push("V závěru zkus psát konkrétněji, třeba co přesně bylo těžké, užitečné nebo překvapivé.");
  }

  if (positives >= 1 && negatives >= 1) {
    points += 5;
    strengths.push("Závěr zmiňuje klady i zápory tématu, takže působí vyváženě.");
    rewards.push(createReward(TROPHY_ICON, "Vyvážená úvaha", "Autor dokáže pojmenovat přínosy i nevýhody."));
  } else {
    missing.push("Úvahový závěr by měl zmínit jak to, co ti práce dala, tak i to, co ti vzala nebo ztížila.");
  }

  return {
    points,
    max: 45,
    strengths,
    missing,
    rewards,
    detail: `Otázky: ${questionCount}, důvody: ${reasonCount}, názorové formulace: ${opinionCount}, klady: ${positives}, zápory: ${negatives}.`,
  };
}

function buildContext(text) {
  const normalized = normalizeText(text);
  const paragraphs = splitParagraphs(normalized);
  const sentences = splitSentences(normalized);
  const structure = parseStructure(normalized);
  const introText = structure.intro.paragraphs.join(" ");
  const theoryText = structure.theory.paragraphs.join(" ");
  const practiceText = structure.practice.paragraphs.join(" ");
  const conclusionText = structure.conclusion.paragraphs.join(" ");
  const theoryWords = getWords(theoryText);
  const theorySentences = splitSentences(theoryText);
  const practiceSentences = splitSentences(practiceText);
  const capitalStarts = sentences.filter((sentence) => /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(sentence));
  const punctuationEnds = sentences.filter((sentence) => /[.!?]"?$/.test(sentence));
  const overlapKeywords = getIntersectionValues(getKeywordSet(theoryText), getKeywordSet(practiceText));

  const theoryChapters = structure.theory.chapters.map((chapter) => {
    const textContent = chapter.paragraphs.join(" ");
    const chapterSentences = splitSentences(textContent);
    const factSentences = chapterSentences.filter((sentence) => getWords(sentence).length >= 6);
    return {
      heading: chapter.heading,
      paragraphs: chapter.paragraphs,
      text: textContent,
      words: getWords(textContent),
      sentences: chapterSentences,
      factCount: factSentences.length,
      isEmpty: getWords(textContent).length === 0,
    };
  });

  const emptyTheoryChapters = theoryChapters.filter((chapter) => chapter.isEmpty);
  const hasEmptyTheoryChapter = emptyTheoryChapters.length > 0;

  const expertTerms = extractExpertTerms(theoryText, theoryChapters);

  return {
    text: normalized,
    allSentences: sentences,
    wordCount: getWords(normalized).length,
    paragraphCount: paragraphs.length,
    sentenceCount: sentences.length,
    capitalSentenceRatio: sentences.length ? capitalStarts.length / sentences.length : 0,
    punctuationSentenceRatio: sentences.length ? punctuationEnds.length / sentences.length : 0,
    hasIntro: structure.intro.paragraphs.length > 0,
    hasTheory: structure.theory.paragraphs.length > 0,
    hasPractice: structure.practice.paragraphs.length > 0,
    hasConclusion: structure.conclusion.paragraphs.length > 0,
      introText,
      theoryText,
      practiceText,
      conclusionText,
      introWordCount: getWords(introText).length,
      hasGoalInIntro: /\b(cílem|cíl)\b/i.test(introText),
    hasHypothesisInIntro: /\b(hypotéza|hypotézu|hypotézy)\b/i.test(introText),
    hasClearHypothesis:
      /\b(hypotéza\b|\bhypotéza zní\b|\bstanovil(?:a)? jsem hypotézu\b|\bočekávám, že\b|\bpředpokládám, že\b|\bpokud\b.+\bpak\b)/i.test(introText)
      && splitSentences(introText).some((sentence) => /\b(hypotéza\b|očekávám, že|předpokládám, že|pokud\b.+\bpak\b)/i.test(sentence)),
    hasMethodInPractice: /\b(pozorov|sledov|měřen|zapisov|porovn|zkoumal|provedeno)\b/i.test(practiceText),
    hasResultInPractice: /\b(výsledek|ukázalo|ukázala|zjistilo|zjistila|potvrdilo|podporuje)\b/i.test(practiceText),
    practicePreparationCount: countMatches(practiceText, /\b(před experimentem|nejprve|připravil(?:a)?|nachystal(?:a)?|nakoupil(?:a)?|sehnal(?:a)?|zorganizoval(?:a)?|domluvil(?:a)?|pomohl(?:a)?|pomáhal(?:a)?|komplikac|problém|potíž|příprava)\b/gi),
    practiceMethodDetailCount: countMatches(practiceText, /\b(měřil(?:a)?|měření|pozoroval(?:a)?|sledoval(?:a)?|zapisoval(?:a)?|zaznamenal(?:a)?|porovnával(?:a)?|porovnání|po dobu|každý den|pomocí|tabulka|záznam)\b/gi),
    practiceMeasuredWhatCount: countMatches(practiceText, /\b(vlhkost|teplota|výška|čas|počet|délka|barva|stav listů|hmotnost|rozestupy|půda|listy|zálivka)\b/gi),
    hasGraphMention: /\b(graf|tabulka|sloupcový graf|čárový graf|osa x|osa y)\b/i.test(practiceText),
    graphExplanationCount: countMatches(practiceText, /\b(z grafu|graf ukazuje|na grafu je vidět|je vidět, že|z výsledků vyplývá|autor zjistil|zjistil(?:a)? jsem|lze použít|mohlo by být použito|využít)\b/gi),
      hasSummaryInConclusion: /\b(shrn|ukázala|ukázalo|vyplývá|potvrd|závěrem)\b/i.test(conclusionText),
      theoryWordCount: theoryWords.length,
      practiceWordCount: getWords(practiceText).length,
      conclusionWordCount: getWords(conclusionText).length,
      theoryParagraphCount: structure.theory.paragraphs.length,
    theoryChapterCount: theoryChapters.length,
    averageTheoryChapterWords: theoryChapters.length ? theoryChapters.reduce((sum, chapter) => sum + chapter.words.length, 0) / theoryChapters.length : 0,
    theoryFactCount: theoryChapters.reduce((sum, chapter) => sum + chapter.factCount, 0),
    theoryChapters,
    emptyTheoryChapters,
    hasEmptyTheoryChapter,
    factsEnoughPerChapter: theoryChapters.length >= 2 && theoryChapters.every((chapter) => !chapter.isEmpty && chapter.factCount >= 10),
    uniqueTheoryTerms: expertTerms,
    theoryChaptersHaveContent: theoryChapters.length >= 2 && theoryChapters.every((chapter) => !chapter.isEmpty && chapter.words.length >= 80 && chapter.heading.length > 0),
    theoryOpinionCount: countMatches(theoryText, /\b(myslím|myslela|myslel|podle mě|domnívám|domnívala|líbí se mi|mám rád|mám ráda|zdá se mi)\b/gi),
    theoryFirstPersonCount: countMatches(theoryText, /\b(já|mně|mě|můj|moje|moji|myslím|zjistil jsem|zjistila jsem|vybral jsem|vybrala jsem)\b/gi),
    theoryPracticeKeywordOverlap: overlapKeywords.length,
    overlapKeywords,
    hasHypothesisWord: /\b(hypotéza|hypotézu|hypotézy)\b/i.test(normalized),
  };
}

function evaluatePractice(context, examplePicker) {
  const strengths = [];
  const missing = [];
  const tips = [];
  const rewards = [];
  const breakdown = [];
  let points = 0;
  let max = 0;

  if (!context.hasPractice || getWords(context.practiceText).length === 0) {
    return {
      strengths,
      missing: ["Praktická část zatím nebyla rozpoznána jako samostatná část s obsahem."],
      tips: ["Doplň praktickou část jako samostatný oddíl a popiš v ní přípravy, postup, výsledky i práci s grafem."],
      rewards,
      breakdown: [
        { label: "Jednoznačná hypotéza", points: 0, max: 10, percent: 0, detail: "Bez praktické části nelze ověřit návaznost na hypotézu." },
        { label: "Vyprávění o přípravách", points: 0, max: 10, percent: 0, detail: "Bez textu není možné hodnotit přípravy před experimentem." },
        { label: "Metodický postup a vědecká metoda", points: 0, max: 15, percent: 0, detail: "Bez textu není možné hodnotit průběh měření ani zaznamenávání." },
        { label: "Graf a vysvětlení výsledků", points: 0, max: 15, percent: 0, detail: "Bez textu není možné hodnotit graf ani vysvětlení výsledků." },
        { label: "Bohatý vypravěčský jazyk", points: 0, max: 15, percent: 0, detail: "Bez textu není možné hodnotit jazyk praktické části." },
        { label: "Propojení s teorií a hypotézou", points: 0, max: 10, percent: 0, detail: "Bez praktické části nelze posoudit návaznost na teorii." },
      ],
      points: 0,
      max: 75,
    };
  }

  const practiceStory = evaluateStorytellingPart(context.practiceText, examplePicker.practice(), "Praktická část");
  const practiceLength = evaluateLength(
    context.practiceWordCount,
    PRACTICE_TARGET_WORDS,
    "Praktická část",
    "Rozsáhlý badatel",
    "Praktická část je rozpracovaná do pěkné šířky.",
    10,
  );

  const criteria = [
    {
      label: "Rozsah praktické části",
      max: 10,
      result: practiceLength,
    },
    {
      label: "Jednoznačná hypotéza",
      max: 10,
      result: (() => {
        if (context.hasClearHypothesis) {
          return {
            points: 10,
            strength: "Práce obsahuje jednoznačně formulovanou hypotézu, o kterou se může praktická část opřít.",
            reward: createReward(BADGE_ICON, "Jasná hypotéza", "Praktická část má zřetelnou výzkumnou otázku nebo očekávání."),
            detail: `Ukázka hypotézy: ${quoteSnippet(examplePicker.intro())}.`,
          };
        }
        if (context.hasHypothesisInIntro || context.hasHypothesisWord) {
          return {
            points: 6,
            strength: "Hypotéza je v práci naznačená.",
            missing: "Hypotézu je potřeba formulovat ještě jednoznačněji, aby bylo jasné, co se má ověřovat.",
            tip: "Napiš hypotézu jako jasné očekávání, například co se stane, když se změní podmínky.",
            detail: `Zmínka o hypotéze: ${quoteSnippet(examplePicker.intro())}.`,
          };
        }
        return {
          points: 0,
          missing: "V práci zatím chybí jednoznačná hypotéza, na kterou by praktická část navazovala.",
          tip: "Doplň jednu jasně napsanou hypotézu, kterou bude možné v praktické části ověřovat.",
          detail: "Aplikace zatím nenašla jasně formulovanou hypotézu.",
        };
      })(),
    },
    {
      label: "Vyprávění o přípravách",
      max: 10,
      result: (() => {
        if (context.practicePreparationCount >= 4) {
          return {
            points: 10,
            strength: `Praktická část vypráví i o přípravách před experimentem. Příklad věty: ${quoteSnippet(examplePicker.practice())}.`,
            reward: createReward(STAR_ICON, "Poctivá příprava", "Autor ukazuje, co bylo potřeba zařídit ještě před samotným měřením."),
            detail: `Nalezené zmínky o přípravě nebo komplikacích: ${context.practicePreparationCount}.`,
          };
        }
        if (context.practicePreparationCount >= 2) {
          return {
            points: 6,
            strength: "V textu už jsou vidět některé přípravy před experimentem.",
            missing: "Přípravy by šly popsat ještě konkrétněji: co se chystalo, nakupovalo nebo organizovalo.",
            tip: "Doplň, co se dělo před měřením, kdo pomáhal a jaké komplikace bylo potřeba řešit.",
            detail: `Nalezené zmínky o přípravě nebo komplikacích: ${context.practicePreparationCount}.`,
          };
        }
        return {
          points: 2,
          missing: "V praktické části zatím skoro není popsáno, co se dělo před experimentem.",
          tip: "Přidej vyprávění o přípravách: co jsi nachystal(a), nakoupil(a), zorganizoval(a) nebo jaké vznikly komplikace.",
          detail: "Aplikace zatím našla jen málo zmínek o přípravách.",
        };
      })(),
    },
    {
      label: "Metodický postup a vědecká metoda",
      max: 15,
      result: (() => {
        if (context.hasMethodInPractice && context.practiceMethodDetailCount >= 4 && context.practiceMeasuredWhatCount >= 2) {
          return {
            points: 15,
            strength: "Metodický postup praktické části je popsaný srozumitelně a věcně.",
            reward: createReward(BADGE_ICON, "Vědecký postup", "Je jasné, jak měření probíhalo, co bylo sledováno a jak se zapisovalo."),
            detail: `Zjištěné prvky postupu: ${context.practiceMethodDetailCount}, měřené nebo sledované jevy: ${context.practiceMeasuredWhatCount}.`,
          };
        }
        if (context.hasMethodInPractice) {
          return {
            points: 9,
            strength: "V praktické části je vidět postup práce nebo pozorování.",
            missing: "Metodický popis by měl ještě přesněji říct, co bylo měřeno a jak se údaje zaznamenávaly.",
            tip: "Doplň, jak měření probíhalo krok za krokem a do čeho nebo jak ses výsledky zapisoval(a).",
            detail: `Zjištěné prvky postupu: ${context.practiceMethodDetailCount}, měřené nebo sledované jevy: ${context.practiceMeasuredWhatCount}.`,
          };
        }
        return {
          points: 3,
          missing: "V praktické části zatím není dost jasně popsáno, jak měření nebo pozorování probíhalo.",
          tip: "Popiš postup vědecky: co jsi dělal(a), co bylo měřeno, čím a jak se vše zaznamenávalo.",
          detail: "Aplikace zatím nenašla dost znaků metodického postupu.",
        };
      })(),
    },
    {
      label: "Graf a vysvětlení výsledků",
      max: 15,
      result: (() => {
        if (context.hasGraphMention && context.graphExplanationCount >= 3 && context.hasResultInPractice) {
          return {
            points: 15,
            strength: "Praktická část pracuje s grafem nebo tabulkou a vysvětluje, co z výsledků vyplývá.",
            reward: createReward(TROPHY_ICON, "Čtenář výsledků", "Autor neukazuje jen data, ale umí je i vysvětlit a využít."),
            detail: `Zmínka o grafu nebo tabulce: ano, vysvětlující formulace: ${context.graphExplanationCount}.`,
          };
        }
        if (context.hasGraphMention || context.hasResultInPractice) {
          return {
            points: 8,
            strength: "V praktické části už jsou vidět výsledky nebo práce s grafem.",
            missing: "Bylo by dobré jasněji popsat, co je na grafu vidět, co autor zjistil a k čemu se to dá použít.",
            tip: "Doplň vysvětlení výsledků: co ukazuje graf, jaký je hlavní závěr a kde by se zjištění dalo využít.",
            detail: `Zmínka o grafu nebo tabulce: ${context.hasGraphMention ? "ano" : "ne"}, vysvětlující formulace: ${context.graphExplanationCount}.`,
          };
        }
        return {
          points: 2,
          missing: "V praktické části zatím není vidět práce s grafem ani vysvětlení výsledků.",
          tip: "Pokud máš graf nebo tabulku, napiš, co na nich vidíš, co jsi zjistil(a) a k čemu by výsledek mohl být užitečný.",
          detail: "Aplikace zatím nenašla zmínku o grafu ani jasné vysvětlení výsledků.",
        };
      })(),
    },
    {
      label: "Bohatý vypravěčský jazyk",
      max: 15,
      result: (() => {
        if (practiceStory.points >= 30) {
          return {
            points: 15,
            strength: "Praktická část používá bohatý a poutavý vypravěčský jazyk podobně jako úvod.",
            reward: createReward(STAR_ICON, "Poutavý badatel", "Praktická část je nejen věcná, ale i čtivá."),
            detail: practiceStory.detail,
          };
        }
        if (practiceStory.points >= 20) {
          return {
            points: 10,
            strength: "Praktická část už má čtivý jazyk a některé vypravěčské prvky.",
            missing: "Jazyk by mohl být ještě bohatší a výraznější, podobně jako v úvodu.",
            tip: "Zkus doplnit rozvitější věty, pestřejší slovní zásobu a silnější vypravěčské momenty.",
            detail: practiceStory.detail,
          };
        }
        return {
          points: 4,
          missing: "Praktická část zatím působí spíš úsečně a mohla by být vypravěčsky bohatší.",
          tip: "Přidej bohatší slovní zásobu, rozvitější věty a čtivější popis toho, co se dělo.",
          detail: practiceStory.detail,
        };
      })(),
    },
    {
      label: "Propojení s teorií a hypotézou",
      max: 10,
      result: (() => {
        if (context.theoryPracticeKeywordOverlap >= 5 && context.hasHypothesisWord) {
          return {
            points: 10,
            strength: `Praxe dobře navazuje na teorii i hypotézu. Příklad slov: ${context.overlapKeywords.slice(0, 5).join(", ")}.`,
            reward: createReward(TROPHY_ICON, "Most mezi teorií a praxí", "Teorie podporuje to, co potom sleduješ v praxi."),
            detail: `Společná tematická slova: ${context.overlapKeywords.slice(0, 6).join(", ")}.`,
          };
        }
        if (context.theoryPracticeKeywordOverlap >= 2 || context.hasHypothesisWord) {
          return {
            points: 7,
            strength: "Je vidět snaha propojit teorii s praktickou částí.",
            missing: "Propojení s hypotézou nebo praktickou částí může být ještě těsnější.",
            tip: "Ukaž jasněji, jak praktická část ověřuje hypotézu a navazuje na teoretické poznatky.",
            detail: `Společná tematická slova: ${context.overlapKeywords.slice(0, 6).join(", ")}.`,
          };
        }
        return {
          points: 3,
          missing: "V teoretické části zatím není moc vidět souvislost s praktickou částí nebo hypotézou.",
          tip: "Propoj praktickou část s teorií a připomeň, které poznatky nebo pojmy jsi v praxi ověřoval(a).",
          detail: "Aplikace zatím našla jen slabé propojení teorie, hypotézy a praxe.",
        };
      })(),
    },
  ];

  criteria.forEach((criterion) => {
    const result = criterion.result;
    points += result.points;
    max += criterion.max;
    if (result.strength) strengths.push(result.strength);
    if (result.missing) missing.push(result.missing);
    if (result.tip) tips.push(result.tip);
    if (result.reward) rewards.push(result.reward);
    breakdown.push({
      label: criterion.label,
      points: result.points,
      max: criterion.max,
      percent: Math.round((result.points / criterion.max) * 100),
      detail: result.detail || "",
    });
  });

  return { strengths, missing, tips, rewards, breakdown, points, max };
}

function evaluateTheory(context, examplePicker) {
  const strengths = [];
  const missing = [];
  const tips = [];
  const rewards = [];
  const breakdown = [];
  let points = 0;
  let max = 0;

  const criteria = [
      {
        label: "Rozsah teoretické části",
        max: 15,
        result: (() => {
          const detail = context.theoryWordCount ? `Teorie má přibližně ${context.theoryWordCount} slov.` : "Teoretická část nebyla jasně rozpoznána.";
          if (context.theoryWordCount >= THEORY_TARGET_WORDS) return { points: 15, strength: `Teoretická část má dostatečný rozsah. ${detail}`, reward: createReward(STAR_ICON, "Vytrvalý badatel", "Teorie je opravdu rozpracovaná a bohatá na obsah."), detail };
          if (context.theoryWordCount >= 420) return { points: 10, strength: `Teoretická část už má solidní rozsah. ${detail}`, missing: "K cíli 600 slov ještě zbývá část textu doplnit.", tip: "Rozšiř obě teoretické kapitoly o další vysvětlení, příklady a fakta k tématu.", detail };
          return { points: 4, missing: "Teoretická část je zatím příliš krátká vzhledem k cíli 600 slov.", tip: "Doplň další informace k tématu. Pomůže, když každou kapitolu rozšíříš o více vysvětlení a konkrétních poznatků.", detail };
        })(),
      },
    {
      label: "Kapitoly teoretické části",
      max: 15,
      result: (() => {
        const preview = context.theoryChapters.map((chapter) => `„${chapter.heading}“`).join(", ");
        if (context.hasEmptyTheoryChapter) {
          const emptyNames = context.emptyTheoryChapters.map((chapter) => `„${chapter.heading}“`).join(", ");
          return {
            points: 0,
            missing: `Některá kapitola má jen nadpis a žádný obsah: ${emptyNames}. Taková kapitola je hotová na 0 %.`,
            tip: "Doplň pod každý nadpis skutečný text. Samotný název kapitoly nestačí.",
            detail: `Prázdné kapitoly: ${emptyNames}.`,
          };
        }
        if (context.theoryChapterCount >= 2 && context.averageTheoryChapterWords >= 220) return { points: 15, strength: `Teoretická část je rozdělena aspoň do dvou smysluplných kapitol. Příklad kapitol: ${preview}.`, reward: createReward(BADGE_ICON, "Stavitel kapitol", "Nadpisy a členění pomáhají čtenáři rychle pochopit obsah."), detail: `Rozpoznané kapitoly: ${preview}.` };
        if (context.theoryChapterCount >= 2) return { points: 10, strength: `Teoretická část už obsahuje alespoň dvě kapitoly. Příklad: ${preview}.`, missing: "Jedna nebo obě kapitoly ještě potřebují více rozpracovat.", tip: "Zkontroluj, jestli každá kapitola rozvíjí jedno jasné téma a není příliš krátká.", detail: `Rozpoznané kapitoly: ${preview}.` };
        return { points: 3, missing: "V teoretické části zatím nejsou dobře rozeznatelné alespoň dvě kapitoly.", tip: "Rozděl teorii nejméně do dvou kapitol s vlastními nadpisy.", detail: "Aplikace zatím nenašla dvě samostatné kapitoly." };
      })(),
    },
      {
        label: "Množství faktů v teorii",
        max: 15,
        result: (() => {
          const countedChapters = context.theoryChapters
            .filter((chapter) => chapter.factCount > 0)
            .map((chapter) => `„${chapter.heading}“: ${chapter.factCount} faktů`);
          const counts = countedChapters.join("; ");
          if (context.hasEmptyTheoryChapter) {
            const emptyNames = context.emptyTheoryChapters.map((chapter) => `„${chapter.heading}“`).join(", ");
            return {
              points: 0,
              missing: "Nejdřív je potřeba dodělat ostatní kapitoly, aby šlo spravedlivě hodnotit množství faktů v celé teorii.",
              tip: "Doplň text do rozpracovaných nebo prázdných kapitol a pak zkontroluj, jestli je v každé kapitole dost konkrétních faktů.",
              detail: counts ? `Počet faktů v hotových kapitolách: ${counts}.` : "Zatím není hotová žádná kapitola s obsahem a fakty.",
            };
          }
          if (context.theoryFactCount >= 30) return { points: 15, strength: `V teoretické části je dostatek faktů. ${counts}.`, reward: createReward(STAR_ICON, "Lovec faktů", "Teorie přináší hodně užitečných poznatků k tématu."), detail: `Počet faktů podle kapitol: ${counts}. Celkem: ${context.theoryFactCount} faktů.` };
          if (context.theoryFactCount >= 20) return { points: 11, strength: counts ? `V teorii už je hodně důležitých informací. ${counts}.` : "V teorii už je hodně důležitých informací.", missing: "K plnému počtu bodů ještě chybí doplnit další fakta až k hranici 30.", tip: "Projdi si každou teoretickou kapitolu a doplň další konkrétní fakta, vysvětlení nebo odborné poznatky.", detail: counts ? `Počet faktů podle kapitol: ${counts}. Celkem: ${context.theoryFactCount} faktů.` : `Celkem: ${context.theoryFactCount} faktů.` };
          if (context.theoryFactCount >= 12) return { points: 9, strength: counts ? `V teorii už je několik důležitých informací. ${counts}.` : "V teorii už je několik důležitých informací.", missing: "K plnému počtu bodů je potřeba přidat víc faktů až k hranici 30.", tip: "Projdi si každou teoretickou kapitolu a doplň další konkrétní fakta, vysvětlení nebo odborné poznatky.", detail: counts ? `Počet faktů podle kapitol: ${counts}. Celkem: ${context.theoryFactCount} faktů.` : `Celkem: ${context.theoryFactCount} faktů.` };
          return { points: 4, missing: "Teoretická část zatím obsahuje málo jasně popsaných faktů.", tip: "Do každé kapitoly přidej více konkrétních informací, ne jen obecné věty.", detail: counts ? `Počet faktů podle kapitol: ${counts}.` : "Zatím nebyla nalezena kapitola s napočítanými fakty." };
        })(),
      },
    {
      label: "Odborné termíny",
      max: 10,
      result: (() => {
        const terms = context.uniqueTheoryTerms.slice(0, 6).join(", ");
        if (context.uniqueTheoryTerms.length >= 8) return { points: 10, strength: `V teoretické části se objevují různé tematické odborné termíny. Příklad: ${terms}.`, reward: createReward(STAR_ICON, "Znalec pojmů", "Používáš pojmy, které skutečně patří k tématu práce."), detail: `Nalezené odborné termíny a sousloví: ${terms}.` };
        if (context.uniqueTheoryTerms.length >= 4) return { points: 7, strength: `Některé tematické odborné pojmy už v textu používáš. Příklad: ${terms}.`, missing: "Odborných termínů by mohlo být ještě víc a měly by být lépe rozprostřené v kapitolách.", tip: "Přidej další pojmy nebo sousloví, které se používají přímo pro tvoje téma.", detail: `Nalezené odborné termíny a sousloví: ${terms}.` };
        return { points: 3, missing: "V teoretické části zatím skoro nejsou vidět odborné termíny přímo spojené s tématem.", tip: "Zkus doplnit přesnější pojmy nebo sousloví, která se používají výhradně pro tvoje téma.", detail: "Aplikace zatím našla jen malý počet skutečně tematických termínů." };
      })(),
    },
    {
      label: "Pořadí a členění informací",
      max: 10,
      result: (() => {
        if (context.hasEmptyTheoryChapter) {
          const emptyNames = context.emptyTheoryChapters.map((chapter) => `„${chapter.heading}“`).join(", ");
          return {
              points: 0,
              missing: `Členění teorie není dokončené, protože některá kapitola zůstala prázdná: ${emptyNames}.`,
              tip: "Každý nadpis potřebuje vlastní odstavec nebo více odstavců s obsahem.",
              detail: "Nejdřív je potřeba doplnit obsah pod všechny nadpisy teoretické části.",
            };
          }
        if (context.theoryChapterCount >= 2 && context.theoryParagraphCount >= 4 && context.theoryChaptersHaveContent) return { points: 10, strength: "Informace v teoretické části působí uspořádaně a dobře se čtou.", reward: createReward(BADGE_ICON, "Pořádný organizátor", "Nadpisy i odstavce vedou čtenáře logicky od jedné myšlenky ke druhé."), detail: "Nadpisy i odstavce působí logicky a drží jednotlivá témata pohromadě." };
        if (context.theoryParagraphCount >= 2) return { points: 7, strength: "Text už je částečně členěný do odstavců a kapitol.", missing: "Některé části by ještě mohly být logičtěji seřazené nebo lépe oddělené.", tip: "Podívej se, jestli každá kapitola drží jedno hlavní téma a odstavce na sebe navazují.", detail: "Členění už je vidět, ale některé části mohou být ještě přehlednější." };
        return { points: 3, missing: "Teoretická část zatím nepůsobí dostatečně členěně.", tip: "Použij více odstavců a zkontroluj, jestli nadpis kapitoly odpovídá tomu, co je pod ním napsané.", detail: "Členění teorie zatím není z textu dost dobře vidět." };
      })(),
    },
    {
      label: "Odborný styl bez osobního názoru",
      max: 10,
      result: (() => {
        const exampleSentence = quoteSnippet(examplePicker.theoryObjective());
        if (context.theoryOpinionCount === 0 && context.theoryFirstPersonCount === 0) return { points: 10, strength: `Teoretická část je psaná odborně a bez osobního názoru. Příklad věty: ${exampleSentence}.`, reward: createReward(BADGE_ICON, "Odborný hlas", "V teorii zůstáváš u faktů místo osobních pocitů."), detail: `Ukázka věcného stylu: ${exampleSentence}.` };
        if (context.theoryOpinionCount <= 2) return { points: 6, strength: `Teoretická část je většinou věcná. Příklad věty: ${exampleSentence}.`, missing: "Místy se do teorie dostává osobní názor nebo mluvení o sobě.", tip: "V teorii piš spíš o faktech a poznatcích. Osobní zkušenost nech hlavně do praktické části nebo závěru.", detail: `Ukázka věcného stylu: ${exampleSentence}.` };
        return { points: 2, missing: "V teoretické části se objevuje příliš osobních názorů nebo formulací o autorovi.", tip: "Zkus věty přeformulovat tak, aby zněly věcně a odborně, bez 'myslím si' nebo 'já'.", detail: "Aplikace našla více osobních formulací v teoretické části." };
      })(),
    },
  ];

  criteria.forEach((criterion) => {
    const result = criterion.result;
    points += result.points;
    max += criterion.max;
    if (result.strength) strengths.push(result.strength);
    if (result.missing) missing.push(result.missing);
    if (result.tip) tips.push(result.tip);
    if (result.reward) rewards.push(result.reward);
    breakdown.push({
      label: criterion.label,
      points: result.points,
      max: criterion.max,
      percent: Math.round((result.points / criterion.max) * 100),
      detail: result.detail || "",
    });
  });

  if (context.hasEmptyTheoryChapter) {
    strengths.length = 0;
    rewards.length = 0;
    missing.unshift("V teoretické části je potřeba nejdřív dodělat ostatní kapitoly, aby šlo hodnotit práci jako celek.");
  }

  return { strengths, missing, tips, rewards, breakdown, points, max };
}

function evaluatePanels(context) {
  const examplePicker = createExamplePicker(context);
  const theory = evaluateTheory(context, examplePicker);
  const practice = evaluatePractice(context, examplePicker);
  const introStory = evaluateStorytellingPart(context.introText, examplePicker.introExpressive(), "Úvod");
  const conclusionReflection = evaluateReflectionConclusion(context.conclusionText, examplePicker.conclusion());
  const introLength = evaluateLength(
    context.introWordCount,
    INTRO_TARGET_WORDS,
    "Úvod",
    "Silný start",
    "Úvod má dost místa na rozvinutí tématu i zaujmutí čtenáře.",
    10,
  );
  const conclusionLength = evaluateLength(
    context.conclusionWordCount,
    CONCLUSION_TARGET_WORDS,
    "Závěr",
    "Plný závěr",
    "Závěr má dost prostoru na shrnutí i vlastní úvahu.",
    10,
  );

  const introStrengths = [];
  const introMissing = [];
  const introRewards = [...introStory.rewards];
  if (context.hasIntro) {
    introStrengths.push(`Úvod je v textu jasně přítomný. Příklad věty: ${quoteSnippet(examplePicker.intro())}.`);
    if (context.hasGoalInIntro) introStrengths.push("Úvod jasně naznačuje cíl práce.");
    else introMissing.push("V úvodu by měl být ještě jasněji napsaný cíl práce.");
    if (context.hasHypothesisInIntro) introStrengths.push("Úvod obsahuje i hypotézu nebo očekávání.");
    else introMissing.push("V úvodu zatím chybí jasně vyjádřená hypotéza nebo očekávání.");
    } else {
      introMissing.push("Úvod zatím nebyl rozpoznán jako samostatná část.");
    }
    if (introLength.strength) introStrengths.push(introLength.strength);
    if (introLength.missing) introMissing.push(introLength.missing);
    if (introLength.reward) introRewards.push(introLength.reward);
    introStrengths.push(...introStory.strengths);
    introMissing.push(...introStory.missing);

  const practiceStrengths = [];
  const practiceMissing = [];
  const practiceRewards = [...practice.rewards];
  if (context.hasPractice) {
    practiceStrengths.push(`Praktická část je v textu oddělená. Příklad věty: ${quoteSnippet(examplePicker.practice())}.`);
  } else {
    practiceMissing.push("Praktická část zatím nebyla rozpoznána jako samostatná část.");
  }
  practiceStrengths.push(...practice.strengths);
  practiceMissing.push(...practice.missing);

    const conclusionStrengths = [];
    const conclusionMissing = [];
    const conclusionRewards = [...conclusionReflection.rewards];
    if (context.hasConclusion) {
      conclusionStrengths.push(`Závěr je v práci přítomný. Příklad věty: ${quoteSnippet(examplePicker.conclusion())}.`);
      if (context.hasSummaryInConclusion) conclusionStrengths.push("Závěr shrnuje, k čemu práce došla.");
      else conclusionMissing.push("Závěr by měl ještě jasněji shrnout hlavní zjištění.");
    } else {
      conclusionMissing.push("Závěr zatím nebyl rozpoznán jako samostatná část.");
    }
    if (conclusionLength.strength) conclusionStrengths.push(conclusionLength.strength);
    if (conclusionLength.missing) conclusionMissing.push(conclusionLength.missing);
    if (conclusionLength.reward) conclusionRewards.push(conclusionLength.reward);
    conclusionStrengths.push(...conclusionReflection.strengths);
    conclusionMissing.push(...conclusionReflection.missing);

  const languagePoints = context.capitalSentenceRatio >= 0.92 && context.punctuationSentenceRatio >= 0.92 ? 10 : context.capitalSentenceRatio >= 0.75 && context.punctuationSentenceRatio >= 0.75 ? 7 : 3;
  const languageBreakdown = {
    label: "Pravopis a pečlivost",
    points: languagePoints,
    max: 10,
    percent: Math.round((languagePoints / 10) * 100),
    detail: `Ukázka upravené věty: ${quoteSnippet(examplePicker.formatted())}.`,
  };
  if (languagePoints >= 7) {
    conclusionStrengths.push(`Text je většinou pečlivě zapsaný. Příklad věty: ${quoteSnippet(examplePicker.formatted())}.`);
    conclusionRewards.push(createReward(STAR_ICON, "Pečlivý pisatel", "Na práci je vidět kontrola větných začátků a zakončení."));
  } else {
    conclusionMissing.push("Práce potřebuje ještě pečlivější jazykovou kontrolu.");
  }

  const panels = [
    {
        key: "intro",
        title: "Úvod",
        icon: "🚀",
        sample: quoteSnippet(examplePicker.intro()),
        strengths: introStrengths,
        missing: introMissing,
        rewards: introRewards,
      points: introStory.points + introLength.points + (context.hasGoalInIntro ? 5 : 0) + (context.hasHypothesisInIntro ? 5 : 0),
        max: introStory.max + 20,
    },
    {
        key: "theory",
        title: "Teoretická část",
        icon: "📚",
        sample: quoteSnippet(examplePicker.theoryObjective()),
        strengths: theory.strengths,
        missing: theory.missing,
        rewards: theory.rewards,
      points: theory.points,
      max: theory.max,
    },
    {
        key: "practice",
        title: "Praktická část",
        icon: "🧪",
        sample: quoteSnippet(examplePicker.practiceConnection()),
        strengths: practiceStrengths,
        missing: practiceMissing,
        rewards: practiceRewards,
        points: practice.points,
        max: practice.max,
      },
    {
        key: "conclusion",
        title: "Závěr",
        icon: "🏁",
        sample: quoteSnippet(examplePicker.conclusion()),
        strengths: conclusionStrengths,
        missing: conclusionMissing,
          rewards: conclusionRewards,
          points: conclusionReflection.points + conclusionLength.points + (context.hasSummaryInConclusion ? 5 : 0) + languagePoints,
          max: conclusionReflection.max + 25,
        },
      ].map((panel) => ({ ...panel, percent: Math.round((panel.points / panel.max) * 100) }));

  const breakdown = [
        {
          label: "Úvod jako kvalitní vyprávění",
          points: panels[0].points,
          max: panels[0].max,
          percent: panels[0].percent,
        detail: `${introLength.detail} Ukázka úvodu: ${quoteSnippet(examplePicker.introExpressive())}.`,
        },
      ...theory.breakdown,
        {
          label: "Praktická část",
          points: panels[2].points,
          max: panels[2].max,
          percent: panels[2].percent,
          detail: `Ukázka praktické části: ${quoteSnippet(examplePicker.practice())}.`,
        },
        {
        label: "Závěr jako úvahový text",
        points: conclusionReflection.points + conclusionLength.points + (context.hasSummaryInConclusion ? 5 : 0),
        max: conclusionReflection.max + 15,
        percent: Math.round(((conclusionReflection.points + conclusionLength.points + (context.hasSummaryInConclusion ? 5 : 0)) / (conclusionReflection.max + 15)) * 100),
        detail: `${conclusionLength.detail} ${conclusionReflection.detail}`,
        },
      languageBreakdown,
    ];

  const areaBreakdown = [
    {
      key: "intro",
      label: "Úvod",
      points: panels[0].points,
      max: panels[0].max,
      percent: panels[0].percent,
      details: [
        breakdown[0],
      ],
    },
    {
      key: "theory",
      label: "Teoretická část",
      points: panels[1].points,
      max: panels[1].max,
      percent: panels[1].percent,
      details: theory.breakdown,
    },
      {
        key: "practice",
        label: "Praktická část",
        points: panels[2].points,
        max: panels[2].max,
        percent: panels[2].percent,
        details: practice.breakdown,
      },
    {
      key: "conclusion",
      label: "Závěr",
      points: panels[3].points,
      max: panels[3].max,
      percent: panels[3].percent,
      details: [
        breakdown[theory.breakdown.length + 2],
        breakdown[theory.breakdown.length + 3],
      ],
    },
  ];

  const tips = [...theory.tips];
  if (introMissing.length) tips.push("V úvodu zkus přidat výraznější začátek, bohatší jazyk nebo silnější atmosféru.");
  tips.push(...practice.tips);
  if (conclusionMissing.length) tips.push("V závěru zkus shrnout zjištění a přidat silnější dojem na čtenáře.");

  return {
    panels,
    breakdown,
    areaBreakdown,
    tips: [...new Set(tips)],
    rewards: panels.flatMap((panel) => panel.rewards),
  };
}

function evaluateEssay(text, studentName) {
  const context = buildContext(text);
  if (context.wordCount < 60) {
    return {
      error: `${studentName ? `${studentName}, ` : ""}text je zatím moc krátký na smysluplné vyhodnocení. Zkus vložit delší pracovní verzi.`,
    };
  }

  const { panels, breakdown, areaBreakdown, tips, rewards } = evaluatePanels(context);
  const total = breakdown.reduce((sum, item) => sum + item.points, 0);
  const max = breakdown.reduce((sum, item) => sum + item.max, 0);
  const score = Math.round((total / max) * 100);

  let title = "Moje bakalářská práce se rozvíjí dobře";
  if (score >= 85) title = "Moje bakalářská práce je skoro hotová";
  else if (score >= 70) title = "Moje bakalářská práce má spoustu silných míst";
  else if (score < 50) title = "Moje bakalářská práce potřebuje ještě dopracovat";

  return {
    score,
    title,
    panels,
    breakdown,
    areaBreakdown,
    tips,
    stars: rewards.filter((reward) => reward.icon === STAR_ICON).length,
    badges: rewards.filter((reward) => reward.icon === BADGE_ICON).length,
    trophies: rewards.filter((reward) => reward.icon === TROPHY_ICON).length,
  };
}

function renderList(element, items) {
  element.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    element.appendChild(li);
  });
}

function renderBreakdown(items) {
  criteriaList.innerHTML = "";
  items.forEach((item) => {
    const detailsMarkup = item.details.map((detail) => `
        <article class="criterion-detail-card">
          <div class="criterion-top">
            <span>${detail.label}</span>
            <span>${detail.points} / ${detail.max}</span>
          </div>
          <p>${detail.percent} % splněno</p>
          <div class="criterion-bar criterion-bar-sub">
            <div class="criterion-fill" style="width: ${detail.percent}%"></div>
          </div>
          ${detail.detail ? `<p class="criterion-detail">${detail.detail}</p>` : ""}
        </article>
      `).join("");

    const card = document.createElement("details");
    card.className = "criterion criterion-accordion";
    card.innerHTML = `
      <summary class="criterion-summary">
        <div class="criterion-top">
          <span>${item.label}</span>
          <span>${item.points} / ${item.max}</span>
        </div>
        <p>${item.percent} % splněno</p>
        <div class="criterion-bar">
          <div class="criterion-fill" style="width: ${item.percent}%"></div>
        </div>
      </summary>
      <div class="criterion-accordion-body">
        ${detailsMarkup}
      </div>
    `;
    criteriaList.appendChild(card);
  });
}

function renderPanels(panels) {
  sectionPanels.innerHTML = "";
  panels.forEach((panel) => {
    const card = document.createElement("article");
    card.className = "section-panel";
    card.innerHTML = `
        <div class="section-panel-head">
          <div>
            <p class="section-panel-label">${panel.icon} ${panel.title}</p>
            <h3>${panel.percent} % splněno</h3>
          </div>
          <div class="section-mini-badge">${panel.rewards.length}</div>
        </div>
        <p class="section-sample">${panel.sample}</p>
        <div class="section-columns">
          <div class="section-column success">
            <h4>Co se povedlo</h4>
            <ul>${panel.strengths.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>
        <div class="section-column attention">
          <h4>Co doplnit</h4>
          <ul>${panel.missing.map((item) => `<li>${item}</li>`).join("")}</ul>
        </div>
      </div>
      <div class="section-rewards">
        ${panel.rewards.length
          ? panel.rewards.map((reward) => `<span class="panel-reward">${reward.icon} ${reward.title}</span>`).join("")
          : `<span class="panel-reward muted">${GUIDE_ICON} Další ocenění čekají</span>`}
      </div>
    `;
    sectionPanels.appendChild(card);
  });
}

function showResults(result) {
  emptyState.classList.add("hidden");
  resultsPanel.classList.remove("hidden");
  emptyStateMessage.textContent = DEFAULT_EMPTY_MESSAGE;
  scoreTitle.textContent = result.title;
  scoreValue.textContent = result.score;
  starCount.textContent = result.stars;
  badgeCount.textContent = result.badges;
  trophyCount.textContent = result.trophies;
  renderPanels(result.panels);
  renderList(tipsList, result.tips);
  renderBreakdown(result.areaBreakdown);
}

function showValidationMessage(message) {
  showResults({
    score: 0,
    title: "Ještě chvíli piš",
    stars: 0,
    badges: 0,
    trophies: 0,
    tips: ["Zkus vložit delší verzi textu a odděl úvod, teorii, praxi a závěr."],
    breakdown: [],
      areaBreakdown: [
        { key: "intro", label: "Úvod", points: 0, max: 1, percent: 0, details: [] },
        { key: "theory", label: "Teoretická část", points: 0, max: 1, percent: 0, details: [] },
        { key: "practice", label: "Praktická část", points: 0, max: 1, percent: 0, details: [] },
        { key: "conclusion", label: "Závěr", points: 0, max: 1, percent: 0, details: [] },
      ],
      panels: [
        { key: "intro", title: "Úvod", icon: "🚀", strengths: ["Začal jsi psát, a to je první důležitý krok."], missing: [message], rewards: [], sample: "Úvod zatím není dost dlouhý na hodnocení.", percent: 0 },
        { key: "theory", title: "Teoretická část", icon: "📚", strengths: ["Až přidáš víc textu, objeví se tu přesnější ocenění."], missing: ["Teoretická část zatím není dost dlouhá na analýzu."], rewards: [], sample: "Teorie zatím čeká na doplnění.", percent: 0 },
        { key: "practice", title: "Praktická část", icon: "🧪", strengths: ["Praktickou část můžeš doplnit později."], missing: ["Zatím není dost textu k rozpoznání postupu a výsledků."], rewards: [], sample: "Praxe zatím čeká na doplnění.", percent: 0 },
        { key: "conclusion", title: "Závěr", icon: "🏁", strengths: ["Závěr můžeš doplnit na konci práce."], missing: ["Na vyhodnocení závěru je zatím text moc krátký."], rewards: [], sample: "Závěr zatím čeká na doplnění.", percent: 0 },
      ],
    });
  }

async function handleDocumentUpload(file) {
  if (!file) {
    return;
  }

  setUploadAlert("");
  if (file.size > 15 * 1024 * 1024) {
    const message = "Soubor je příliš velký. Nahraj prosím PDF nebo DOCX do 15 MB.";
    essayInput.value = "";
    loadedDocumentName = "";
    setFileMessage(message, file.name, true);
    showEmptyState(message);
    setUploadAlert("Tip: Pokud je dokument velký, zkus ho uložit znovu jako menší PDF nebo odstraň obrázky.");
    return;
  }

  setFileMessage(`Načítám dokument ${file.name}...`);

  try {
    const extractedText = normalizeText(await loadDocumentText(file));

    if (!extractedText) {
      throw new Error("V dokumentu se nepodařilo najít žádný čitelný text.");
    }

      essayInput.value = extractedText;
      loadedDocumentName = file.name;
      const studentName = studentNameInput.value.trim();
      const result = evaluateEssay(extractedText, studentName);
      if (result.error) {
        setFileMessage("Dokument je načtený, ale text je zatím příliš krátký na plné hodnocení.", `${file.name} | ${getWords(extractedText).length} slov`, true);
        setUploadAlert("Dokument se načetl správně. Teď je potřeba doplnit víc textu, aby šlo práci smysluplně vyhodnotit.");
        showValidationMessage(result.error);
        return;
      }
      setUploadAlert("");
      setFileMessage("Dokument je načtený a připravený k vyhodnocení.", `${file.name} | ${getWords(extractedText).length} slov`);
      showResults(result);
    } catch (error) {
      essayInput.value = "";
      loadedDocumentName = "";
      const friendlyMessage = getFriendlyUploadError(error, file);
      setFileMessage("Dokument se nepodařilo načíst.", file.name, true);
      setUploadAlert(friendlyMessage);
      showEmptyState(friendlyMessage);
    }
  }

evaluateButton.addEventListener("click", () => {
  const essay = essayInput.value;
  const studentName = studentNameInput.value.trim();
  const result = evaluateEssay(essay, studentName);
  if (result.error) {
    showValidationMessage(result.error);
    return;
  }
  showResults(result);
});

sampleButton.addEventListener("click", () => {
  essayInput.value = sampleEssay;
  studentNameInput.value = "Tereza";
  loadedDocumentName = "Ukázkový dokument";
  setUploadAlert("");
  setFileMessage("Ukázkový dokument je připravený k vyhodnocení.", `Ukázkový dokument | ${getWords(sampleEssay).length} slov`);
});

tipsToggle.addEventListener("click", () => {
  const isHidden = tipsPanel.classList.toggle("hidden");
  tipsToggle.setAttribute("aria-expanded", String(!isHidden));
  tipsToggle.textContent = isHidden ? "Zobrazit návrhy ke zlepšení" : "Skrýt návrhy ke zlepšení";
});

documentInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  await handleDocumentUpload(file);
  event.target.value = "";
});

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js";
}

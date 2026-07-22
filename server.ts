import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client to prevent crash on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured in your Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// NG Words List for Content Moderation (Condition 5)
const NG_WORDS = [
  // 汚い言葉 (Dirty/offensive words)
  "ばか", "バカ", "あほ", "アホ", "うんこ", "ウンコ", "ちんちん", "おっぱい", "くそ", "クソ", 
  "うざい", "ウザい", "きもい", "キモい", "ぶす", "ブス", "はげ", "ハゲ", "でぶ", "デブ",
  "きえろ", "消えろ", "うざ", "うっとうしい", "まぬけ", "ゴミ", "ごみ", "かす", "カス",
  // 性的な刺激のある言葉 (Sexually suggestive/explicit words)
  "エッチ", "えっち", "セックス", "せっくす", "オナニー", "おなにー", "アダルト", "ぽるの", "ポルノ",
  "せいこう", "性交", "いんらん", "淫乱", "ちんぽ", "まんこ", "せいぶき", "性器", "フェラ",
  // 死や暴力に関係する言葉 (Violence/death related words)
  "しね", "死ね", "ころす", "殺す", "ごろし", "殺し", "暴力", "ぼうりょく", "なぐる", "殴る", 
  "ける", "蹴る", "ぶっとばす", "ぶっ飛ばす", "いじめ", "イジメ", "血", "ちまみれ", "ナイフ", 
  "じゅう", "銃", "ばくだん", "爆弾", "自殺", "じさつ", "じこ", "事故", "たいほ", "逮捕",
  "てろ", "テロ", "ゆうかい", "誘拐"
];

// Helper to check for NG words
function containsNgWord(text: string): { hasNg: boolean; word: string | null } {
  const normalized = text.toLowerCase().replace(/[\s\u3000]/g, ""); // space removal
  for (const word of NG_WORDS) {
    if (normalized.includes(word)) {
      return { hasNg: true, word };
    }
  }
  return { hasNg: false, word: null };
}

// Helper to clean and format AI errors gracefully for children
function getFriendlyErrorMessage(error: any): string {
  if (!error) return "通信エラーがおきました。もう一度お試しください。";
  const errorMsg = typeof error === "string" ? error : (error.message || JSON.stringify(error));
  
  if (
    errorMsg.includes("RESOURCE_EXHAUSTED") || 
    errorMsg.includes("Quota exceeded") || 
    errorMsg.includes("quota") || 
    errorMsg.includes("429") ||
    errorMsg.includes("limit")
  ) {
    return "ただいまAI（エーアイ）がたいへん混み合っています。すこし時間をおいてから、もう一度ボタンを押してみてね！";
  }
  
  return errorMsg;
}

// --- API Endpoints ---

// Check Text for safety
app.post("/api/security-check", (req, res) => {
  const { text } = req.body;
  if (typeof text !== "string") {
    return res.status(400).json({ error: "テキストが正しくありません。" });
  }

  const check = containsNgWord(text);
  return res.json({ safe: !check.hasNg, word: check.word });
});

// Dynamic AI Hints Generation based on Recipient & Tone Mode (Condition 4 & Condition 2)
app.post("/api/generate-hints", async (req, res) => {
  const { relation, mode, step, recipientName, experience, feeling, promiseHelp } = req.body;
  
  // Validation
  if (!relation || !mode || !step) {
    return res.status(400).json({ error: "必要な情報が足りません。" });
  }

  // Safety moderation check on custom relation and other inputs
  const relationCheck = containsNgWord(relation);
  if (relationCheck.hasNg) {
    return res.status(400).json({ error: `「${relationCheck.word}」はやさしくない言葉のため、使えません。` });
  }
  if (recipientName && containsNgWord(recipientName).hasNg) {
    return res.status(400).json({ error: "お名前にやさしくない言葉が入っています。" });
  }
  if (experience && containsNgWord(experience).hasNg) {
    return res.status(400).json({ error: "入力内容にやさしくない言葉が入っています。" });
  }
  if (feeling && containsNgWord(feeling).hasNg) {
    return res.status(400).json({ error: "入力内容にやさしくない言葉が入っています。" });
  }
  if (promiseHelp && containsNgWord(promiseHelp).hasNg) {
    return res.status(400).json({ error: "入力内容にやさしくない言葉が入っています。" });
  }

  try {
    const ai = getAiClient();
    
    let prompt = "";
    if (step === "experience") {
      const nameContext = recipientName ? `（お相手のお名前は「${recipientName}」さんです）` : "";
      prompt = `
あなたは小学生向けの優しい作文の先生です。
お礼を書きたい相手が「${relation}」${nameContext}で、全体の文章スタイルが「${mode === "keigo" ? "敬語（丁寧な表現、〜していただきました、ありがとうございます、など）" : "常態（親しい表現、〜してくれた、ありがとう、など）"}」のとき、
「その相手（${relation}）が自分にしてくれたことで、お礼を言いたくなるような具体的な体験」の選択肢を5個、小学生が直感的に選べるように考えてください。

以下のルールを絶対に守ってください：
1. 出力は必ず指定のJSONスキーマに従ってください。
2. 小学生が読んでワクワクする、身近で温かい体験にしてください。
3. 文末は必ず指定した言葉遣い（${mode === "keigo" ? "「〜していただきました」「〜してくれました」" : "「〜してくれたね」「〜してくれたよ」"}）にし、必ず最後に「。」（句点）を1個つけてください。
4. 各選択肢には、その体験にピッタリ合う「楽しい絵文字」を1個つけてください。
      `;
    } else if (step === "feeling") {
      const expContext = experience ? `相手が自分にしてくれたこと：『${experience}』\n` : "";
      prompt = `
あなたは小学生向けの優しい作文の先生です。
相手が「${relation}」で、お礼のスタイルが「${mode === "keigo" ? "敬語" : "常態"}」のとき、
「何かをしてもらったとき、自分が感じた気持ちや思ったこと」の選択肢を5個考えてください。

${expContext ? `今回は特に、【${expContext.trim()}】という素敵な体験を相手にしてもらったときの気持ちであることを踏まえて考えてください。` : ""}

以下のルールを絶対に守ってください：
1. 出力は必ず指定のJSONスキーマに従ってください。
2. 文末は指定のスタイルに合わせ、${mode === "keigo" ? "「〜で嬉しかったです」「〜と思いました」" : "「〜で嬉しかったよ」「〜と思ったよ」"}にし、必ず最後に「。」（句点）を1個つけてください。
3. 各選択肢に、その気持ちにピッタリ合う「表情や感情の絵文字」を1個つけてください。
      `;
    } else if (step === "help") {
      const expContext = experience ? `相手が自分にしてくれたこと：『${experience}』\n` : "";
      const feelContext = feeling ? `そのときの気持ち：『${feeling}』\n` : "";
      const historyContext = (expContext || feelContext) ? `これまでの作文内容：\n${expContext}${feelContext}` : "";

      prompt = `
あなたは小学生向けの優しい作文の先生です。
相手が「${relation}」で、お礼のスタイルが「${mode === "keigo" ? "敬語" : "常態"}」のとき、
「お礼のあとに、これからは自分がその相手（${relation}）に対してやりたいお手伝いや、応援の言葉、約束」の選択肢を5個考えてください。

${historyContext ? `これまでの内容：\n${historyContext}\n上記を踏まえて、この素晴らしい相手（${relation}）に対して恩返しやお手伝い、これからの約束としてふさわしい具体的な行動プランを考えてください。` : ""}

以下のルールを絶対に守ってください：
1. 出力は必ず指定のJSONスキーマに従ってください。
2. 小学生が自分でできそうな、具体的で優しい行動や温かい応援にしてください。
3. 文末は指定のスタイルに合わせ、${mode === "keigo" ? "「〜をします」「〜してくださいね」" : "「〜をするね」「〜してね」"}にし、必ず最後に「。」（句点）を1個つけてください。
4. 各選択肢に、その行動にピッタリ合う「絵文字」を1個つけてください。
      `;
    } else if (step === "thankYou") {
      const expContext = experience ? `してくれたこと：『${experience}』\n` : "";
      const feelContext = feeling ? `そのときの気持ち：『${feeling}』\n` : "";
      const helpContext = promiseHelp ? `これからの約束やお手伝い：『${promiseHelp}』\n` : "";
      const historyContext = (expContext || feelContext || helpContext) ? `これまでの作文内容：\n${expContext}${feelContext}${helpContext}` : "";

      prompt = `
あなたは小学生向けの優しい作文の先生です。
相手が「${relation}」で、お礼のスタイルが「${mode === "keigo" ? "敬語" : "常態"}」のとき、
「さいごに、相手に一番伝えたい感謝の気持ちや、これからもよろしくね、といったお礼の結びの言葉」の選択肢を5個考えてください。

${historyContext ? `これまでの内容：\n${historyContext}\nこれらを踏まえて、全体のストーリー（してくれたことや、その時の嬉しかった気持ち、これからの約束）を綺麗に締めくくる、小学生らしい心温まる「ありがとう」の言葉を考えてください。` : ""}

以下のルールを絶対に守ってください：
1. 出力は必ず指定のJSONスキーマに従ってください。
2. 小学生が素直に「ありがとう」を表現できる、温かい言葉にしてください。
3. 文末は指定のスタイルに合わせ、${mode === "keigo" ? "「〜本当にありがとうございます」「〜これからもよろしくお願いいたします」" : "「〜本当にありがとう」「〜これからもよろしくね」"}にし、必ず最後に「。」（句点）を1個つけてください。
4. 各選択肢に、その結びにピッタリ合う「感謝や笑顔の絵文字」を1個つけてください。
      `;
    } else {
      return res.status(400).json({ error: "ステップが正しくありません。" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hints: {
              type: Type.ARRAY,
              description: "相手に合わせたお礼の選択肢（ヒント）のリスト。5個生成してください。",
              items: {
                type: Type.OBJECT,
                properties: {
                  emoji: {
                    type: Type.STRING,
                    description: "選択肢にふさわしい絵文字（1文字）。",
                  },
                  text: {
                    type: Type.STRING,
                    description: "お礼の体験や気持ち、約束のテキスト（ひらがな多めで小学生が読める文章）。",
                  },
                },
                required: ["emoji", "text"],
              },
            },
          },
          required: ["hints"],
        },
      },
    });

    const rawText = response.text || "";
    if (!rawText.trim()) {
      throw new Error("AIから有効なヒントが返されませんでした。もう一度お試しください。");
    }

    let cleanedText = rawText.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, "");
      cleanedText = cleanedText.replace(/\s*```$/, "");
      cleanedText = cleanedText.trim();
    }

    let result;
    try {
      result = JSON.parse(cleanedText);
    } catch (parseErr: any) {
      console.error("Failed to parse hints JSON. Raw text:", rawText, "Error:", parseErr);
      throw new Error("AIの言葉をうまく読み込めませんでした。もう一度ボタンをおしてみてね！");
    }

    // Force trailing period "。" on each text option if missing
    if (result && Array.isArray(result.hints)) {
      result.hints = result.hints.map((hint: any) => {
        if (hint && typeof hint.text === "string") {
          let text = hint.text.trim();
          if (text) {
            // Remove any trailing period or spaces first, then append a single proper proper Japanese period "。"
            while (text.endsWith(".") || text.endsWith("。")) {
              text = text.slice(0, -1).trim();
            }
            text = text + "。";
          }
          hint.text = text;
        }
        return hint;
      });
    }

    return res.json(result);
  } catch (error: any) {
    console.error("Generate Hints Error:", error);
    return res.status(500).json({ error: getFriendlyErrorMessage(error) });
  }
});

// AI Proofreading Endpoint (Condition 1 & 4 & 5)
app.post("/api/proofread-essay", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "作文のテキストがありません。" });
  }

  // Security moderation check
  const safetyCheck = containsNgWord(text);
  if (safetyCheck.hasNg) {
    return res.status(400).json({ error: `「${safetyCheck.word}」はやさしくない言葉のため、使えません。` });
  }

  try {
    const ai = getAiClient();
    const prompt = `
以下の子供が書いたお礼の作文を、意味や気持ちは変えずに、少しだけ自然で読みやすいきれいな日本語に直してください。
接続詞を自然に補ったり、文のつながりを整えてください。

元の作文：
${text}

修正ルール：
1. 難しい漢字は絶対に使わず、ひらがなと小学校低学年レベルの漢字（例：友、母、先生、手伝い、元気、行くなど）だけで書いてください。
2. 語尾のスタイル（敬語の「〜です、〜ます、〜ありがとうございます」か、常態の「〜だよ、〜したよ、〜ありがとう」か）は、元の作文の雰囲気に合わせて一貫させてください。絶対に混ぜないでください。
3. 余計な説明、アドバイス、タイトル、挨拶などは一切含めず、修正した作文の本文のみを出力してください。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    // Run safety check on generated text just in case
    const outText = response.text?.trim() || "";
    const safetyCheckOut = containsNgWord(outText);
    if (safetyCheckOut.hasNg) {
      return res.status(400).json({ error: "安全な文章を生成できませんでした。" });
    }

    return res.json({ text: outText });
  } catch (error: any) {
    console.error("Proofread Error:", error);
    return res.status(500).json({ error: getFriendlyErrorMessage(error) });
  }
});

// AI Expand Endpoint (Condition 1 & 4 & 5)
app.post("/api/expand-essay", async (req, res) => {
  const { text, mode } = req.body;
  if (!text) {
    return res.status(400).json({ error: "作文のテキストがありません。" });
  }

  // Security moderation check
  const safetyCheck = containsNgWord(text);
  if (safetyCheck.hasNg) {
    return res.status(400).json({ error: `「${safetyCheck.word}」はやさしくない言葉のため、使えません。` });
  }

  try {
    const ai = getAiClient();
    const prompt = `
以下の短い作文の骨組みを元に、少しだけ具体的な情景や、そのときのワクワクした気持ち、感謝の思いを補って、温かくて素敵な手紙（作文）にふくらませてください。

元の作文：
${text}

ふくらませルール：
1. 元の文章の内容からかけ離れすぎないようにしてください（架空の事実を過剰に作り出さない）。
2. 言葉遣いは「${mode === "keigo" ? "丁寧な敬語（〜です、〜ます、ありがとうございました）" : "優しい常態（〜だよ、〜したよ、ありがとう）"}」に完全に統一してください。
3. 難しい漢字は一切使わず、ひらがなと簡単な漢字（小学校低学年レベル）で書いてください。
4. アドバイスや挨拶などの余計な記述は省き、完成した手紙（作文）の本文のみを出力してください。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const outText = response.text?.trim() || "";
    const safetyCheckOut = containsNgWord(outText);
    if (safetyCheckOut.hasNg) {
      return res.status(400).json({ error: "安全な文章を生成できませんでした。" });
    }

    return res.json({ text: outText });
  } catch (error: any) {
    console.error("Expand Error:", error);
    return res.status(500).json({ error: getFriendlyErrorMessage(error) });
  }
});


// Grade-Based Kanji Conversion Endpoint
app.post("/api/convert-kanji", async (req, res) => {
  const { text, grade } = req.body;
  if (!text || !grade) {
    return res.status(400).json({ error: "テキストと学年が足りません。" });
  }

  // Security moderation check
  const safetyCheck = containsNgWord(text);
  if (safetyCheck.hasNg) {
    return res.status(400).json({ error: `「${safetyCheck.word}」はやさしくない言葉のため、使えません。` });
  }

  try {
    const ai = getAiClient();
    
    let gradeRule = "";
    if (grade === "hiragana") {
      gradeRule = "漢字は一切使わず、すべてひらがな（とカタカナ）だけで書いてください。漢字はすべて平仮名に直してください。";
    } else if (grade === "1") {
      gradeRule = "小学校1年生までに習う漢字（80字：一右雨円王音下火花貝学気九休金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早足多大男竹中虫町天田土二日入年白八百文木本名目立力林）のみを使ってください。2年生以上で習う漢字はすべてひらがなに変換してください。";
    } else if (grade === "2") {
      gradeRule = "小学校2年生までに習う漢字（1年生＋2年生の漢字）のみを使ってください。3年生以上で習う漢字はすべてひらがなに変換してください。";
    } else if (grade === "3") {
      gradeRule = "小学校3年生までに習う漢字（1〜3年生の漢字）のみを使ってください。4年生以上で習う漢字はすべてひらがなに変換してください。";
    } else if (grade === "4") {
      gradeRule = "小学校4年生までに習う漢字（1〜4年生の漢字）のみを使ってください。5年生以上で習う漢字はすべてひらがなに変換してください。";
    } else if (grade === "5") {
      gradeRule = "小学校5年生までに習う漢字（1〜5年生の漢字）のみを使ってください。6年生で習う漢字はすべてひらがなに変換してください。";
    } else if (grade === "6") {
      gradeRule = "小学校6年生までに習う漢字（小学校で習うすべての教育漢字）のみを使ってください。中学校以上で習う漢字はすべてひらがなに変換してください。";
    } else {
      gradeRule = "中学生以上の一般的な漢字まじり文にしてください。一般的な漢字を自由に使ってください。";
    }

    const prompt = `
あなたは小学校の優しい先生です。
子供が書いたお礼の作文（手紙）を、指定された学年レベルに合わせて、これまでに習った漢字だけを使った文章に変換（習っていない漢字をすべてひらがなに変換、またはすべての漢字をひらがなにするなど）してください。

元の作文：
${text}

変換ルール：
1. ${gradeRule}
2. お礼の気持ち、語尾（敬語・常態）、文章のニュアンス、絵文字、記号などは絶対に改変しないでください。
3. 送り仮名が正しくなるように配慮してください。
4. 解説や挨拶、アドバイスなどの余計な記述は一切省き、変換完了した手紙の本文のみを出力してください。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    const outText = response.text?.trim() || "";
    const safetyCheckOut = containsNgWord(outText);
    if (safetyCheckOut.hasNg) {
      return res.status(400).json({ error: "安全な文章を生成できませんでした。" });
    }

    return res.json({ text: outText });
  } catch (error: any) {
    console.error("Convert Kanji Error:", error);
    return res.status(500).json({ error: getFriendlyErrorMessage(error) });
  }
});


// --- Vite Dynamic Loading Setup ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

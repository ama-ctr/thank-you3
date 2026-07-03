import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, 
  Sparkles, 
  User, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertTriangle,
  Send,
  Wand2,
  Smile,
  ChevronRight,
  BookOpen
} from "lucide-react";

// Client-side NG word detection (Condition 5)
const NG_WORDS_CLIENT = [
  "ばか", "バカ", "あほ", "アホ", "うんこ", "ウンコ", "ちんちん", "おっぱい", "くそ", "クソ", 
  "うざい", "ウザい", "きもい", "キモい", "ぶす", "ブス", "はげ", "ハゲ", "でぶ", "デブ",
  "きえろ", "消えろ", "うざ", "うっとうしい", "まぬけ", "ゴミ", "ごみ", "かす", "カス",
  "エッチ", "えっち", "セックス", "せっくす"
];

interface Hint {
  emoji: string;
  text: string;
}

// Rich Local Static Hints Database for Offline & High-Performance Fallbacks
const LOCAL_HINTS_DATABASE: Record<
  string,
  Record<
    "keigo" | "jotai",
    {
      experience: Hint[];
      feeling: Hint[];
      help: Hint[];
      thankYou: Hint[];
    }
  >
> = {
  "おかあさん": {
    keigo: {
      experience: [
        { emoji: "🍳", text: "いつも美味しいごはんを作っていただきました" },
        { emoji: "🧼", text: "お洋服をいつもきれいに洗っていただきました" },
        { emoji: "🤒", text: "風邪をひいたときに優しく看病していただきました" },
        { emoji: "🎒", text: "忘れ物がないかいっしょに確認していただきました" },
      ],
      feeling: [
        { emoji: "💖", text: "とてもあったかい気持ちになりました" },
        { emoji: "😄", text: "すごく嬉しかったです" },
        { emoji: "😌", text: "とても安心しました" },
      ],
      help: [
        { emoji: "🍽️", text: "これからはお皿洗いを積極的にお手伝いします" },
        { emoji: "🧹", text: "自分の部屋を毎日きれいに掃除します" },
        { emoji: "🍀", text: "これからもお仕事や家事をがんばってください" },
      ],
      thankYou: [
        { emoji: "💝", text: "いつも本当にありがとうございます" },
        { emoji: "🌸", text: "お母さんの子供でいられて幸せです。感謝しています" },
      ]
    },
    jotai: {
      experience: [
        { emoji: "🍳", text: "いつも美味しいごはんを作ってくれたね" },
        { emoji: "🧼", text: "お洋服をいつもきれいに洗ってくれたね" },
        { emoji: "🤒", text: "風邪をひいたときに優しく看病してくれたね" },
        { emoji: "🎒", text: "忘れ物がないかいっしょに確認してくれたね" },
      ],
      feeling: [
        { emoji: "💖", text: "あったかい気持ちになったよ" },
        { emoji: "😄", text: "すごく嬉しかったよ" },
        { emoji: "😌", text: "ホッとして安心したよ" },
      ],
      help: [
        { emoji: "🍽️", text: "これからはお皿洗いをてつだうね" },
        { emoji: "🧹", text: "自分の部屋をちゃんとお片付けするね" },
        { emoji: "🍀", text: "これからも無理しないでがんばってね" },
      ],
      thankYou: [
        { emoji: "💝", text: "いつも本当にありがとう" },
        { emoji: "✨", text: "お母さんがだーいすきだよ。ありがとう" },
      ]
    }
  },
  "おとうさん": {
    keigo: {
      experience: [
        { emoji: "⚽", text: "休みの日にいっしょに公園でたくさん遊んでいただきました" },
        { emoji: "🔧", text: "壊れたおもちゃを一生懸命直していただきました" },
        { emoji: "🚗", text: "車で楽しいところに連れて行っていただきました" },
        { emoji: "📚", text: "わからない宿題を優しく教えていただきました" },
      ],
      feeling: [
        { emoji: "😄", text: "すごく嬉しかったです" },
        { emoji: "🔥", text: "お父さんのように強くなりたいと思いました" },
        { emoji: "🌟", text: "とても頼もしくてかっこいいなと思いました" },
      ],
      help: [
        { emoji: "🧼", text: "これからはお風呂洗いを積極的にお手伝いします" },
        { emoji: "📦", text: "重い荷物があるときは喜んで運びます" },
        { emoji: "💪", text: "これからもお仕事をがんばってください" },
      ],
      thankYou: [
        { emoji: "💝", text: "いつも優しくしてくれてありがとうございます" },
        { emoji: "🌟", text: "お父さんのことが大好きです。本当に感謝しています" },
      ]
    },
    jotai: {
      experience: [
        { emoji: "⚽", text: "休みの日にいっしょに公園でたくさん遊んでくれたね" },
        { emoji: "🔧", text: "壊れたおもちゃをいっしょに直してくれたね" },
        { emoji: "🚗", text: "車でいろんな楽しいところに連れて行ってくれたね" },
        { emoji: "📚", text: "わからない宿題を優しく教えてくれたね" },
      ],
      feeling: [
        { emoji: "😄", text: "すごく嬉しかったよ" },
        { emoji: "🔥", text: "お父さんみたいに強くなりたいって思ったよ" },
        { emoji: "🌟", text: "かっこよくてすごいなーと思ったよ" },
      ],
      help: [
        { emoji: "🧼", text: "これからはお風呂洗いをてつだうね" },
        { emoji: "📦", text: "お荷物運びとかお留守番とかがんばるね" },
        { emoji: "💪", text: "お仕事いつもお疲れ様。これからもがんばってね" },
      ],
      thankYou: [
        { emoji: "💝", text: "お父さん、いつも本当にありがとう" },
        { emoji: "✨", text: "お父さんのことがだーいすきだよ。ありがとう" },
      ]
    }
  },
  "せんせい": {
    keigo: {
      experience: [
        { emoji: "🏫", text: "学校で勉強を優しくわかりやすく教えていただきました" },
        { emoji: "🏃", text: "運動会やイベントで一生懸命応援していただきました" },
        { emoji: "🤝", text: "困っているときに親身になって相談に乗っていただきました" },
        { emoji: "📖", text: "面白い本を紹介していただいたり読み聞かせをしていただきました" },
      ],
      feeling: [
        { emoji: "✏️", text: "勉強がもっと楽しくなりました" },
        { emoji: "💖", text: "勇気がわいてきて元気になりました" },
        { emoji: "🌟", text: "先生のことがもっと大好きになりました" },
      ],
      help: [
        { emoji: "🙋", text: "これからは授業中にたくさん手を挙げて発表します" },
        { emoji: "🧹", text: "クラスのお掃除や係のお仕事をしっかりやります" },
        { emoji: "🎒", text: "お友達に優しくして楽しいクラスにします" },
      ],
      thankYou: [
        { emoji: "🌸", text: "先生、いつも優しくご指導いただきありがとうございます" },
        { emoji: "🎓", text: "これからも先生の教えを大切にがんばります" },
      ]
    },
    jotai: {
      experience: [
        { emoji: "🏫", text: "学校で勉強をわかりやすくおしえてくれたね" },
        { emoji: "🏃", text: "運動会やイベントでいっぱい応援してくれたね" },
        { emoji: "🤝", text: "困っているときに優しく話を聞いてくれたね" },
        { emoji: "📖", text: "面白い本をたくさん紹介してくれたね" },
      ],
      feeling: [
        { emoji: "✏️", text: "勉強がもっと楽しくなったよ" },
        { emoji: "💖", text: "元気と勇気がわいてきたよ" },
        { emoji: "🌟", text: "先生のことがもっと好きになったよ" },
      ],
      help: [
        { emoji: "🙋", text: "これからは授業中にたくさん発表するね" },
        { emoji: "🧹", text: "クラスのお掃除や係の仕事を一生懸命がんばるね" },
        { emoji: "🎒", text: "お友達と仲良くして元気いっぱいにすごすね" },
      ],
      thankYou: [
        { emoji: "🌸", text: "先生、いつも本当にありがとう" },
        { emoji: "✨", text: "先生に会えて本当によかったよ。ありがとう" },
      ]
    }
  },
  "おともだち": {
    keigo: {
      experience: [
        { emoji: "👦👧", text: "休み時間に校庭でいっしょに楽しく遊んでいただきました" },
        { emoji: "✏️", text: "忘れた鉛筆を快く貸していただきました" },
        { emoji: "🤝", text: "悲しいときにそばにいて優しく慰めていただきました" },
        { emoji: "🍦", text: "面白いお話をたくさんして笑わせていただきました" },
      ],
      feeling: [
        { emoji: "😄", text: "笑顔になれてとても楽しかったです" },
        { emoji: "💖", text: "素晴らしい友達がいて幸せだなと思いました" },
        { emoji: "🌈", text: "明日もまた学校に行きたいと思いました" },
      ],
      help: [
        { emoji: "🤝", text: "これからは困っているときに私が絶対に助けます" },
        { emoji: "🎁", text: "面白い遊びをまた見つけていっしょにやりましょう" },
        { emoji: "🎒", text: "これからもずっと仲の良い友達でいてください" },
      ],
      thankYou: [
        { emoji: "💝", text: "いつも仲良くしてくれて本当にありがとうございます" },
        { emoji: "✨", text: "あなたと友達になれて本当に嬉しいです。ありがとう" },
      ]
    },
    jotai: {
      experience: [
        { emoji: "👦👧", text: "休み時間に校庭でいっしょに遊んでくれたね" },
        { emoji: "✏️", text: "忘れた鉛筆を優しく貸してくれたね" },
        { emoji: "🤝", text: "悲しいときにそばにいて慰めてくれたね" },
        { emoji: "🍦", text: "面白いお話をたくさんして笑わせてくれたね" },
      ],
      feeling: [
        { emoji: "😄", text: "笑顔になれてとても楽しかったよ" },
        { emoji: "💖", text: "最高の友達がいてくれて嬉しいなと思ったよ" },
        { emoji: "🌈", text: "明日もまたいっしょに遊びたいなと思ったよ" },
      ],
      help: [
        { emoji: "🤝", text: "これからは困っているときに絶対助けるね" },
        { emoji: "🎁", text: "また面白い遊びを見つけていっしょに遊ぼうね" },
        { emoji: "🎒", text: "これからもずっとずっと仲良しでいようね" },
      ],
      thankYou: [
        { emoji: "💝", text: "いつも仲良くしてくれて本当にありがとう" },
        { emoji: "✨", text: "友達になってくれて嬉しいよ！ありがとう" },
      ]
    }
  },
  "おじいちゃん": {
    keigo: {
      experience: [
        { emoji: "👴", text: "遊びに行ったときに優しい笑顔で迎えていただきました" },
        { emoji: "🎣", text: "面白いお話や昔の遊びを教えていただきました" },
        { emoji: "🎁", text: "素敵なお菓子やプレゼントを買っていただきました" },
        { emoji: "🌳", text: "いっしょにお散歩をして色々なものを見せていただきました" },
      ],
      feeling: [
        { emoji: "💖", text: "とてもあったかくて幸せな気持ちになりました" },
        { emoji: "😄", text: "おじいちゃんに会えて本当に嬉しかったです" },
        { emoji: "🌟", text: "色々なことを知っていてすごいなと思いました" },
      ],
      help: [
        { emoji: "💌", text: "これからは定期的にお手紙をたくさん書きます" },
        { emoji: "🍵", text: "肩たたきや荷物持ちなどのお手伝いをします" },
        { emoji: "🍀", text: "いつまでも元気で長生きしてくださいね" },
      ],
      thankYou: [
        { emoji: "💝", text: "いつも優しく見守っていただき本当にありがとうございます" },
        { emoji: "🌟", text: "おじいちゃんが大好きです。いつも感謝しています" },
      ]
    },
    jotai: {
      experience: [
        { emoji: "👴", text: "遊びに行ったときに優しい笑顔で迎えてくれたね" },
        { emoji: "🎣", text: "面白いお話や昔の遊びを教えてくれたね" },
        { emoji: "🎁", text: "美味しいお菓子やプレゼントを買ってくれたね" },
        { emoji: "🌳", text: "いっしょにお散歩に行っていろんなものを見つけてくれたね" },
      ],
      feeling: [
        { emoji: "💖", text: "とてもあったかくて幸せな気持ちになったよ" },
        { emoji: "😄", text: "おじいちゃんに会えてすごく嬉しかったよ" },
        { emoji: "🌟", text: "いろんなことを知っていてすごいなーと思ったよ" },
      ],
      help: [
        { emoji: "💌", text: "これからはお手紙をたくさん書くね" },
        { emoji: "🍵", text: "肩たたきとかお茶をいれたりとかお手伝いするね" },
        { emoji: "🍀", text: "いつまでも元気で長生きしてね" },
      ],
      thankYou: [
        { emoji: "💝", text: "おじいちゃん、いつも本当にありがとう" },
        { emoji: "✨", text: "おじいちゃんがだーいすきだよ。いつもありがとう" },
      ]
    }
  },
  "おばあちゃん": {
    keigo: {
      experience: [
        { emoji: "👵", text: "遊びに行ったときに美味しいおやつを用意していただきました" },
        { emoji: "🧶", text: "折り紙やあやとりなどの遊びを優しく教えていただきました" },
        { emoji: "🤗", text: "優しく抱きしめて温かい言葉をかけていただきました" },
        { emoji: "🍲", text: "美味しい手作り料理をたくさん作っていただきました" },
      ],
      feeling: [
        { emoji: "💖", text: "とてもあったかくて幸せな気持ちになりました" },
        { emoji: "😄", text: "おばあちゃんに会えて本当に嬉しかったです" },
        { emoji: "🌸", text: "優しさに包まれてホッと安心しました" },
      ],
      help: [
        { emoji: "💌", text: "これからは定期的にお手紙をたくさん書きます" },
        { emoji: "👵", text: "おうちに行ったときはたくさんお話をします" },
        { emoji: "🍀", text: "いつまでも元気で長生きしてくださいね" },
      ],
      thankYou: [
        { emoji: "💝", text: "いつも優しくしていただき本当にありがとうございます" },
        { emoji: "🌟", text: "おばあちゃんが大好きです。いつも感謝しています" },
      ]
    },
    jotai: {
      experience: [
        { emoji: "👵", text: "遊びに行ったときに美味しいおやつをくれたね" },
        { emoji: "🧶", text: "折り紙やあやとりを優しく教えてくれたね" },
        { emoji: "🤗", text: "優しく抱きしめて温かい言葉をかけてくれたね" },
        { emoji: "🍲", text: "美味しい手作り料理をたくさん作ってくれたね" },
      ],
      feeling: [
        { emoji: "💖", text: "とてもあったかくて幸せな気持ちになったよ" },
        { emoji: "😄", text: "おばあちゃんに会えてすごく嬉しかったよ" },
        { emoji: "🌸", text: "おばあちゃんの優しさにホッと安心したよ" },
      ],
      help: [
        { emoji: "💌", text: "これからはお手紙をたくさん書くね" },
        { emoji: "👵", text: "遊びに行ったときはいっぱいお話ししようね" },
        { emoji: "🍀", text: "いつまでも元気で長生きしてね" },
      ],
      thankYou: [
        { emoji: "💝", text: "おばあちゃん、いつも本当にありがとう" },
        { emoji: "✨", text: "おばあちゃんがだーいすきだよ。いつもありがとう" },
      ]
    }
  },
  "その他": {
    keigo: {
      experience: [
        { emoji: "🎁", text: "いつも温かいご支援をいただきました" },
        { emoji: "📚", text: "色々と親身になって教えていただきました" },
        { emoji: "🤝", text: "困っているときに優しく助けていただきました" },
        { emoji: "🌟", text: "一生懸命に自分のために力を貸していただきました" },
      ],
      feeling: [
        { emoji: "💖", text: "本当に嬉しく感謝の気持ちでいっぱいです" },
        { emoji: "😌", text: "とても安心しました" },
        { emoji: "🔥", text: "自分もがんばろうという気持ちになりました" },
      ],
      help: [
        { emoji: "💪", text: "これからは学んだことを活かしてがんばります" },
        { emoji: "🤝", text: "またお会いできる日を楽しみにしています" },
        { emoji: "🍀", text: "お体に気をつけて元気でお過ごしください" },
      ],
      thankYou: [
        { emoji: "💝", text: "本当にありがとうございました。感謝しております" },
        { emoji: "✨", text: "これからもどうぞよろしくお願いいたします" },
      ]
    },
    jotai: {
      experience: [
        { emoji: "🎁", text: "いつも優しく力を貸してくれたね" },
        { emoji: "📚", text: "いろんなことを親身になって教えてくれたね" },
        { emoji: "🤝", text: "困っているときに優しく助けてくれたね" },
        { emoji: "🌟", text: "一生懸命にいっしょにがんばってくれたね" },
      ],
      feeling: [
        { emoji: "💖", text: "本当に嬉しくて感謝の気持ちでいっぱいだよ" },
        { emoji: "😌", text: "すごく安心したよ" },
        { emoji: "🔥", text: "自分ももっとがんばろうって思ったよ" },
      ],
      help: [
        { emoji: "💪", text: "これからは教えてもらったことをがんばるね" },
        { emoji: "🤝", text: "またいっしょにお話しできるのを楽しみにしてるね" },
        { emoji: "🍀", text: "体に気をつけて元気にすごしてね" },
      ],
      thankYou: [
        { emoji: "💝", text: "本当にありがとう！感謝してるよ" },
        { emoji: "✨", text: "これからもどうぞよろしくね" },
      ]
    }
  }
};

export default function App() {
  // Mode selection (Condition 2)
  const [toneMode, setToneMode] = useState<"keigo" | "jotai">("keigo");
  
  // Form States
  const [recipientRelation, setRecipientRelation] = useState("おかあさん");
  const [customRelation, setCustomRelation] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [experience, setExperience] = useState("");
  const [feeling, setFeeling] = useState("");
  const [promiseHelp, setPromiseHelp] = useState("");
  const [thankYouWord, setThankYouWord] = useState("");
  const [senderName, setSenderName] = useState("");

  // AI Generated / Fallback Hints state (Condition 4)
  const [experienceHints, setExperienceHints] = useState<Hint[]>([]);
  const [feelingHints, setFeelingHints] = useState<Hint[]>([]);
  const [helpHints, setHelpHints] = useState<Hint[]>([]);
  const [thankYouHints, setThankYouHints] = useState<Hint[]>([]);

  // Loading & API States
  const [loadingHints, setLoadingHints] = useState<{ [key: string]: boolean }>({
    experience: false,
    feeling: false,
    help: false,
    thankYou: false,
  });
  const [apiError, setApiError] = useState("");
  const [isGeneratingEssay, setIsGeneratingEssay] = useState(false);
  const [essayText, setEssayText] = useState("");
  const [essayStatusMessage, setEssayStatusMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [isConvertingKanji, setIsConvertingKanji] = useState(false);

  // Security warning state (Condition 5)
  const [securityWarnings, setSecurityWarnings] = useState<{ [key: string]: string }>({});

  // Audio Reading state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Fetch dynamic hints based on recipient & tone (Condition 4 & 2)
  const fetchHints = async (step: "experience" | "feeling" | "help" | "thankYou") => {
    const activeRelation = recipientRelation === "その他" ? (customRelation || "おともだち") : recipientRelation;
    
    // Quick security check before API call
    if (NG_WORDS_CLIENT.some(w => activeRelation.includes(w))) {
      setApiError("お名前や関係にやさしくない言葉がはいっているため、AIにきくことができません。");
      return;
    }

    setLoadingHints(prev => ({ ...prev, [step]: true }));
    setApiError("");

    try {
      const response = await fetch("/api/generate-hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relation: activeRelation,
          mode: toneMode,
          step,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("ただいまAIがたいへん混雑しています（1分間に使える回数を超えました）。");
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "通信エラーがおきました。");
      }

      const data = await response.json();
      if (data.hints && Array.isArray(data.hints) && data.hints.length > 0) {
        if (step === "experience") setExperienceHints(data.hints);
        else if (step === "feeling") setFeelingHints(data.hints);
        else if (step === "help") setHelpHints(data.hints);
        else if (step === "thankYou") setThankYouHints(data.hints);
      } else {
        throw new Error("AIから有効なヒントを受け取れませんでした。");
      }
    } catch (err: any) {
      console.error("Fetch hints error, falling back to local shuffling:", err);
      
      // Resilient local shuffling fallback
      const relationKey = LOCAL_HINTS_DATABASE[recipientRelation] ? recipientRelation : "その他";
      const localSet = LOCAL_HINTS_DATABASE[relationKey][toneMode];
      const itemsToShuffle = [...localSet[step]];
      
      // Simple robust shuffle
      for (let i = itemsToShuffle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = itemsToShuffle[i];
        itemsToShuffle[i] = itemsToShuffle[j];
        itemsToShuffle[j] = temp;
      }
      
      if (step === "experience") setExperienceHints(itemsToShuffle);
      else if (step === "feeling") setFeelingHints(itemsToShuffle);
      else if (step === "help") setHelpHints(itemsToShuffle);
      else if (step === "thankYou") setThankYouHints(itemsToShuffle);

      // Sweet, child-friendly user message
      setApiError("✨ AIがすこし混んでいるため、かわりに べつのヒントを おすすめしたよ！このまま選んでみてね。");
    } finally {
      setLoadingHints(prev => ({ ...prev, [step]: false }));
    }
  };

  // Helper to check text and trigger instant validation (Condition 5)
  const handleInputChange = (field: string, val: string, setter: (v: string) => void) => {
    setter(val);
    
    // Clean-up previous warning
    const newWarnings = { ...securityWarnings };
    delete newWarnings[field];

    const lowerVal = val.toLowerCase().replace(/[\s\u3000]/g, "");
    const foundNgWord = NG_WORDS_CLIENT.find(w => lowerVal.includes(w));
    
    if (foundNgWord) {
      newWarnings[field] = `いやな気持ちになる言葉「${foundNgWord}」が入っています。やさしい言葉にかえましょう！`;
    }
    
    setSecurityWarnings(newWarnings);
  };

  // Synchronously update hints using our rich offline database upon relation or toneMode change,
  // preventing automatic network calls and solving the 429 quota exhausted issue entirely!
  useEffect(() => {
    const relationKey = LOCAL_HINTS_DATABASE[recipientRelation] ? recipientRelation : "その他";
    const localSet = LOCAL_HINTS_DATABASE[relationKey][toneMode];
    setExperienceHints(localSet.experience);
    setFeelingHints(localSet.feeling);
    setHelpHints(localSet.help);
    setThankYouHints(localSet.thankYou);
  }, [recipientRelation, toneMode]);

  // Handle direct hint injection
  const injectHint = (field: string, text: string) => {
    if (field === "experience") {
      handleInputChange("experience", text, setExperience);
      speakText(text);
    } else if (field === "feeling") {
      handleInputChange("feeling", text, setFeeling);
      speakText(text);
    } else if (field === "help") {
      handleInputChange("help", text, setPromiseHelp);
      speakText(text);
    } else if (field === "thankYou") {
      handleInputChange("thankYou", text, setThankYouWord);
      speakText(text);
    }
  };

  // Text-To-Speech (TTS) (移植)
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = "ja-JP";
      msg.rate = 0.9;
      msg.pitch = 1.1;
      msg.onstart = () => setIsSpeaking(true);
      msg.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(msg);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Generate Letter draft (Condition 1)
  const createDraft = () => {
    // Basic validation including client-side security (Condition 5)
    const hasSecurityWarning = Object.keys(securityWarnings).length > 0;
    if (hasSecurityWarning) {
      alert("いやな気持ちになる言葉が入っているため、作文を作れません。やさしい言葉に直してください。");
      return;
    }

    const relation = recipientRelation === "その他" ? customRelation : recipientRelation;
    const finalRecipient = recipientName ? `${recipientName}（${relation}）` : `${relation}`;

    let letter = "";
    if (finalRecipient) {
      letter += `${finalRecipient} へ\n\n`;
    }
    if (experience) {
      letter += `${experience}\n`;
    }
    if (feeling) {
      letter += `${feeling}\n\n`;
    }
    if (promiseHelp) {
      letter += `${promiseHelp}\n`;
    }
    if (thankYouWord) {
      letter += `${thankYouWord}\n\n`;
    }
    if (senderName) {
      letter += `${senderName} より`;
    }

    // Double check whole draft for NG words
    const lowerDraft = letter.toLowerCase().replace(/[\s\u3000]/g, "");
    const foundNgWord = NG_WORDS_CLIENT.find(w => lowerDraft.includes(w));
    if (foundNgWord) {
      alert(`作文の中にいやな気持ちになる言葉「${foundNgWord}」が入っています。やさしい言葉に書き直してください。`);
      return;
    }

    setEssayText(letter);
    setEssayStatusMessage("");
    
    // Smooth scroll to output
    setTimeout(() => {
      document.getElementById("result-box")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Magic API 1: Proofread Essay (魔法で文をきれいにする)
  const handleProofread = async () => {
    if (!essayText) return;
    setIsGeneratingEssay(true);
    setEssayStatusMessage("✨ お手紙を きれいにしているよ... ちょっと待ってね ✨");

    try {
      const res = await fetch("/api/proofread-essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: essayText }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "きれいにできませんでした。");
      }

      const data = await res.json();
      setEssayText(data.text);
      setEssayStatusMessage("🌟 お手紙が とてもきれいになったよ！");
      speakText("お手紙がきれいになりました！");
    } catch (error: any) {
      setEssayStatusMessage(`💦 えらー：${error.message}`);
    } finally {
      setIsGeneratingEssay(false);
    }
  };

  // Magic API 2: Expand Essay (魔法で文をふくらませる)
  const handleExpand = async () => {
    if (!essayText) return;
    setIsGeneratingEssay(true);
    setEssayStatusMessage("✨ AIが おはなしを ふくらませているよ... ちょっと待ってね ✨");

    try {
      const res = await fetch("/api/expand-essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: essayText, mode: toneMode }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "ふくらませられませんでした。");
      }

      const data = await res.json();
      setEssayText(data.text);
      setEssayStatusMessage("🌟 おはなしが すてきに ふくらんだよ！");
      speakText("お話が素敵にふくらみました！");
    } catch (error: any) {
      setEssayStatusMessage(`💦 えらー：${error.message}`);
    } finally {
      setIsGeneratingEssay(false);
    }
  };


  // Magic API 3: Convert Kanji based on grade (学年にあわせた漢字にする)
  const handleConvertKanji = async (grade: string) => {
    if (!essayText) return;
    setIsGeneratingEssay(true);
    setIsConvertingKanji(true);
    
    let gradeLabel = "";
    if (grade === "hiragana") gradeLabel = "ひらがなだけ";
    else if (grade === "all") gradeLabel = "すべての漢字";
    else gradeLabel = `${grade}年生でならう漢字`;
    
    setEssayStatusMessage(`✨ ${gradeLabel}の お手紙に へんかんしているよ... ✨`);

    try {
      const res = await fetch("/api/convert-kanji", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: essayText, grade }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "へんかんできませんでした。");
      }

      const data = await res.json();
      setEssayText(data.text);
      setEssayStatusMessage(`🌟 ${gradeLabel}の お手紙に へんかんできたよ！`);
      speakText(`${gradeLabel}の言葉にへんかんしました！`);
    } catch (error: any) {
      setEssayStatusMessage(`💦 えらー：${error.message}`);
    } finally {
      setIsGeneratingEssay(false);
      setIsConvertingKanji(false);
    }
  };


  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(essayText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-[#F2FBF5] text-[#2D4A3E] font-sans py-6 px-4 sm:px-6 md:py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 md:mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#88C9A1] rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm shrink-0">
              ♥
            </div>
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D3A2E]">
                お礼のことばメーカー
              </h1>
              <p className="text-xs sm:text-sm text-[#6B8E7E] font-bold">
                じゅんばんにこたえるだけで、かんたんにお礼の手紙がつくれます。
              </p>
            </div>
          </div>
          <div className="bg-white/80 px-5 py-2 rounded-full border-2 border-[#B2D8D8] flex items-center gap-2 shadow-sm shrink-0">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-extrabold text-[#2D4A3E] tracking-wider">AI セーフティ稼働中</span>
          </div>
        </header>

        {/* Global Controls: Tone Select Mode (Condition 2) */}
        <div className="bg-white border-2 border-[#B2D8D8] rounded-[40px] p-5 mb-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#88C9A1] text-2xl">🌟</span>
            <span className="font-extrabold text-[#1D3A2E] text-sm sm:text-base">
              お礼をかく「言葉づかい」をえらぼう：
            </span>
          </div>
          <div className="flex bg-[#F2FBF5] p-1.5 rounded-full border-2 border-[#D1E9E9] w-full sm:w-auto">
            <button
              onClick={() => {
                setToneMode("keigo");
                speakText("ていねいモードにしました");
              }}
              className={`flex-1 sm:px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all duration-150 ${
                toneMode === "keigo"
                  ? "bg-white text-[#1D3A2E] shadow-sm font-black"
                  : "text-[#6B8E7E] hover:text-[#2D4A3E]"
              }`}
            >
              👩‍🏫 ていねい（敬語）
            </button>
            <button
              onClick={() => {
                setToneMode("jotai");
                speakText("したしいモードにしました");
              }}
              className={`flex-1 sm:px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all duration-150 ${
                toneMode === "jotai"
                  ? "bg-white text-[#1D3A2E] shadow-sm font-black"
                  : "text-[#6B8E7E] hover:text-[#2D4A3E]"
              }`}
            >
              👦 したしい（ふつう）
            </button>
          </div>
        </div>

        {/* Error message from API */}
        {apiError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-2">
            <AlertTriangle className="text-red-500 shrink-0 mt-1" />
            <p className="text-sm text-red-700 font-bold">{apiError}</p>
          </div>
        )}

        {/* Form Container */}
        <div className="space-y-6">
          
          {/* Question 1: Recipient (Condition 2) */}
          <section className="bg-white rounded-[40px] p-6 border-2 border-[#B2D8D8] shadow-sm relative hover:border-[#88C9A1] transition-colors">
            <div className="absolute -left-3 top-6 w-10 h-10 bg-[#88C9A1] rounded-full border-4 border-[#F2FBF5] flex items-center justify-center text-white font-bold shadow-sm">
              1
            </div>
            
            <div className="ml-6 sm:ml-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#1D3A2E] flex-grow">
                  だれに 書きますか？
                </h2>
                <button
                  type="button"
                  onClick={() => speakText("１ばん。だれに 書きますか？")}
                  className="bg-yellow-100 hover:bg-yellow-200 border-2 border-yellow-300 text-lg rounded-full w-9 h-9 flex items-center justify-center transition-all duration-150 active:translate-y-[2px] shadow-sm shrink-0"
                  title="しつもんを きく"
                >
                  🔊
                </button>
              </div>

              <div className="border-2 border-dashed border-[#A5D8E1] rounded-[30px] p-5 bg-[#F9FEFB] mb-4">
                <p className="text-xs text-[#6B8E7E] font-bold mb-3">
                  💡 だれに「ありがとう」を伝えたいですか？
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: "おかあさん", emoji: "👩" },
                    { name: "おとうさん", emoji: "👨" },
                    { name: "せんせい", emoji: "🧑‍🏫" },
                    { name: "おともだち", emoji: "👦👧" },
                    { name: "おじいちゃん", emoji: "👴" },
                    { name: "おばあちゃん", emoji: "👵" },
                    { name: "その他", emoji: "🎁" },
                  ].map(item => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setRecipientRelation(item.name);
                        speakText(`${item.name}を選びました。`);
                      }}
                      className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm border-2 transition-all duration-150 active:translate-y-[2px] shadow-sm flex items-center gap-1.5 ${
                        recipientRelation === item.name
                          ? "bg-[#E8F4EE] border-[#88C9A1] text-[#2D4A3E] font-extrabold"
                          : "bg-white border-[#D1E9E9] hover:border-[#88C9A1] text-[#6B8E7E]"
                      }`}
                    >
                      <span>{item.emoji}</span>
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {recipientRelation === "その他" && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-[#6B8E7E] ml-2 mb-2">
                    かんけい（例：コーチ、おにいちゃん、など）をいれてね：
                  </label>
                  <input
                    type="text"
                    placeholder="かんけいを いれてね"
                    value={customRelation}
                    onChange={e => handleInputChange("customRelation", e.target.value, setCustomRelation)}
                    className="w-full bg-[#F2FBF5] border-2 border-[#D1E9E9] rounded-full px-4 py-3 text-sm focus:outline-none focus:border-[#88C9A1] focus:bg-white text-[#2D4A3E] transition-all"
                  />
                  {securityWarnings.customRelation && (
                    <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1">
                      <AlertTriangle size={14} /> {securityWarnings.customRelation}
                    </p>
                  )}
                </div>
              )}

              <div className="bg-[#F2FBF5] p-3 rounded-[30px] border-2 border-[#D1E9E9] flex items-center gap-3 mt-4">
                <input
                  type="text"
                  placeholder="あいての お名前を いれてね（例：ゆいちゃん、たろうくん、お母さん）"
                  value={recipientName}
                  onChange={e => handleInputChange("recipientName", e.target.value, setRecipientName)}
                  className="flex-grow bg-white border-2 border-[#D1E9E9] rounded-full px-4 py-2.5 text-sm sm:text-base font-bold focus:outline-none focus:border-[#88C9A1] transition-all"
                />
                <span className="text-base sm:text-lg font-bold text-[#1D3A2E] shrink-0 pr-2">
                  へ
                </span>
              </div>
              {securityWarnings.recipientName && (
                <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1 ml-2">
                  <AlertTriangle size={14} /> {securityWarnings.recipientName}
                </p>
              )}
            </div>
          </section>

          {/* Question 2: What they did (Condition 3 & 4) */}
          <section className="bg-white rounded-[40px] p-6 border-2 border-[#B2D8D8] shadow-sm relative hover:border-[#88C9A1] transition-colors">
            <div className="absolute -left-3 top-6 w-10 h-10 bg-[#88C9A1] rounded-full border-4 border-[#F2FBF5] flex items-center justify-center text-white font-bold shadow-sm">
              2
            </div>

            <div className="ml-6 sm:ml-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#1D3A2E] flex-grow">
                  どんなことを してくれましたか？
                </h2>
                <button
                  type="button"
                  onClick={() => speakText("２ばん。どんなことを してくれましたか？")}
                  className="bg-yellow-100 hover:bg-yellow-200 border-2 border-yellow-300 text-lg rounded-full w-9 h-9 flex items-center justify-center transition-all duration-150 active:translate-y-[2px] shadow-sm shrink-0"
                  title="しつもんを きく"
                >
                  🔊
                </button>
              </div>

              <div className="border-2 border-dashed border-[#A5D8E1] rounded-[30px] p-5 bg-[#F9FEFB] mb-4">
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <p className="text-xs text-[#6B8E7E] font-bold">
                    💡 相手があなたに してくれて嬉しかったこと
                  </p>
                  <button
                    type="button"
                    onClick={() => fetchHints("experience")}
                    disabled={loadingHints.experience}
                    className="text-xs bg-[#E8F4EE] hover:bg-[#D9EFE3] text-[#2D4A3E] px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 transition-all active:translate-y-[2px] font-bold border border-[#B2D8D8] disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={loadingHints.experience ? "animate-spin" : ""} />
                    {loadingHints.experience ? "かんがえ中..." : "AIに別のアイデアをきく"}
                  </button>
                </div>

                {loadingHints.experience ? (
                  <div className="text-xs text-purple-600 animate-pulse font-bold p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
                    ✨ AIが ぴったりのお礼のきっかけを かんがえているよ... ✨
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {experienceHints.map((hint, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => injectHint("experience", hint.text)}
                        className="bg-white border border-[#D1E9E9] hover:border-[#88C9A1] hover:bg-[#F2FBF5] text-[#2D4A3E] px-3 py-2 rounded-full font-bold transition-all active:translate-y-[2px] shadow-sm flex items-center gap-1.5 text-xs sm:text-sm text-left"
                      >
                        <span className="shrink-0">{hint.emoji}</span>
                        <span>{hint.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                rows={3}
                placeholder="ここにかいてね（うえのヒントを おすだけで 入るよ！）"
                value={experience}
                onChange={e => handleInputChange("experience", e.target.value, setExperience)}
                className="w-full bg-[#F2FBF5] border-2 border-[#D1E9E9] rounded-[30px] p-4 text-sm sm:text-base focus:outline-none focus:border-[#88C9A1] focus:bg-white text-[#2D4A3E] transition-all font-bold resize-none"
              />
              {securityWarnings.experience && (
                <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1 ml-2">
                  <AlertTriangle size={14} /> {securityWarnings.experience}
                </p>
              )}
            </div>
          </section>

          {/* Question 3: Feel (Condition 3 & 4) */}
          <section className="bg-white rounded-[40px] p-6 border-2 border-[#B2D8D8] shadow-sm relative hover:border-[#88C9A1] transition-colors">
            <div className="absolute -left-3 top-6 w-10 h-10 bg-[#88C9A1] rounded-full border-4 border-[#F2FBF5] flex items-center justify-center text-white font-bold shadow-sm">
              3
            </div>

            <div className="ml-6 sm:ml-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#1D3A2E] flex-grow">
                  どんな きもちに なりましたか？
                </h2>
                <button
                  type="button"
                  onClick={() => speakText("３ばん。どんな きもちに なりましたか？")}
                  className="bg-yellow-100 hover:bg-yellow-200 border-2 border-yellow-300 text-lg rounded-full w-9 h-9 flex items-center justify-center transition-all duration-150 active:translate-y-[2px] shadow-sm shrink-0"
                  title="しつもんを きく"
                >
                  🔊
                </button>
              </div>

              <div className="border-2 border-dashed border-[#A5D8E1] rounded-[30px] p-5 bg-[#F9FEFB] mb-4">
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <p className="text-xs text-[#6B8E7E] font-bold">
                    💡 してもらったとき、どんな気持ちでしたか？
                  </p>
                  <button
                    type="button"
                    onClick={() => fetchHints("feeling")}
                    disabled={loadingHints.feeling}
                    className="text-xs bg-[#E8F4EE] hover:bg-[#D9EFE3] text-[#2D4A3E] px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 transition-all active:translate-y-[2px] font-bold border border-[#B2D8D8] disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={loadingHints.feeling ? "animate-spin" : ""} />
                    {loadingHints.feeling ? "かんがえ中..." : "AIに別のアイデアをきく"}
                  </button>
                </div>

                {loadingHints.feeling ? (
                  <div className="text-xs text-purple-600 animate-pulse font-bold p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
                    ✨ AIが ぴったりのきもちの言葉を かんがえているよ... ✨
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {feelingHints.map((hint, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => injectHint("feeling", hint.text)}
                        className="bg-white border border-[#D1E9E9] hover:border-[#88C9A1] hover:bg-[#F2FBF5] text-[#2D4A3E] px-3 py-2 rounded-full font-bold transition-all active:translate-y-[2px] shadow-sm flex items-center gap-1.5 text-xs sm:text-sm text-left"
                      >
                        <span className="shrink-0">{hint.emoji}</span>
                        <span>{hint.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                rows={3}
                placeholder="ここにかいてね（ヒントをえらんでも かけるよ）"
                value={feeling}
                onChange={e => handleInputChange("feeling", e.target.value, setFeeling)}
                className="w-full bg-[#F2FBF5] border-2 border-[#D1E9E9] rounded-[30px] p-4 text-sm sm:text-base focus:outline-none focus:border-[#88C9A1] focus:bg-white text-[#2D4A3E] transition-all font-bold resize-none"
              />
              {securityWarnings.feeling && (
                <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1 ml-2">
                  <AlertTriangle size={14} /> {securityWarnings.feeling}
                </p>
              )}
            </div>
          </section>

          {/* Question 4: Help/Promise (Condition 3 & 4) */}
          <section className="bg-white rounded-[40px] p-6 border-2 border-[#B2D8D8] shadow-sm relative hover:border-[#88C9A1] transition-colors">
            <div className="absolute -left-3 top-6 w-10 h-10 bg-[#88C9A1] rounded-full border-4 border-[#F2FBF5] flex items-center justify-center text-white font-bold shadow-sm">
              4
            </div>

            <div className="ml-6 sm:ml-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#1D3A2E] flex-grow">
                  これから あなたができる お手伝いや、約束、応援
                </h2>
                <button
                  type="button"
                  onClick={() => speakText("４ばん。これから あなたができる お手伝いや、約束、応援")}
                  className="bg-yellow-100 hover:bg-yellow-200 border-2 border-yellow-300 text-lg rounded-full w-9 h-9 flex items-center justify-center transition-all duration-150 active:translate-y-[2px] shadow-sm shrink-0"
                  title="しつもんを きく"
                >
                  🔊
                </button>
              </div>

              <div className="border-2 border-dashed border-[#A5D8E1] rounded-[30px] p-5 bg-[#F9FEFB] mb-4">
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <p className="text-xs text-[#6B8E7E] font-bold">
                    💡 これからその人のために、あなたが できそうなこと、応援の言葉
                  </p>
                  <button
                    type="button"
                    onClick={() => fetchHints("help")}
                    disabled={loadingHints.help}
                    className="text-xs bg-[#E8F4EE] hover:bg-[#D9EFE3] text-[#2D4A3E] px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 transition-all active:translate-y-[2px] font-bold border border-[#B2D8D8] disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={loadingHints.help ? "animate-spin" : ""} />
                    {loadingHints.help ? "かんがえ中..." : "AIに別のアイデアをきく"}
                  </button>
                </div>

                {loadingHints.help ? (
                  <div className="text-xs text-purple-600 animate-pulse font-bold p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
                    ✨ AIが ぴったりのおてつだいを かんがえているよ... ✨
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {helpHints.map((hint, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => injectHint("help", hint.text)}
                        className="bg-white border border-[#D1E9E9] hover:border-[#88C9A1] hover:bg-[#F2FBF5] text-[#2D4A3E] px-3 py-2 rounded-full font-bold transition-all active:translate-y-[2px] shadow-sm flex items-center gap-1.5 text-xs sm:text-sm text-left"
                      >
                        <span className="shrink-0">{hint.emoji}</span>
                        <span>{hint.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                rows={3}
                placeholder="ここにかいてね"
                value={promiseHelp}
                onChange={e => handleInputChange("promiseHelp", e.target.value, setPromiseHelp)}
                className="w-full bg-[#F2FBF5] border-2 border-[#D1E9E9] rounded-[30px] p-4 text-sm sm:text-base focus:outline-none focus:border-[#88C9A1] focus:bg-white text-[#2D4A3E] transition-all font-bold resize-none"
              />
              {securityWarnings.promiseHelp && (
                <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1 ml-2">
                  <AlertTriangle size={14} /> {securityWarnings.promiseHelp}
                </p>
              )}
            </div>
          </section>

          {/* Question 5: Thank you word (Condition 3 & 4) */}
          <section className="bg-white rounded-[40px] p-6 border-2 border-[#B2D8D8] shadow-sm relative hover:border-[#88C9A1] transition-colors">
            <div className="absolute -left-3 top-6 w-10 h-10 bg-[#88C9A1] rounded-full border-4 border-[#F2FBF5] flex items-center justify-center text-white font-bold shadow-sm">
              5
            </div>

            <div className="ml-6 sm:ml-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#1D3A2E] flex-grow">
                  いちばん伝えたい「ありがとう」
                </h2>
                <button
                  type="button"
                  onClick={() => speakText("５ばん。いちばん伝えたい、ありがとう の気持ち")}
                  className="bg-yellow-100 hover:bg-yellow-200 border-2 border-yellow-300 text-lg rounded-full w-9 h-9 flex items-center justify-center transition-all duration-150 active:translate-y-[2px] shadow-sm shrink-0"
                  title="しつもんを きく"
                >
                  🔊
                </button>
              </div>

              <div className="border-2 border-dashed border-[#A5D8E1] rounded-[30px] p-5 bg-[#F9FEFB] mb-4">
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <p className="text-xs text-[#6B8E7E] font-bold">
                    💡 さいごに、一番いいたい「ありがとう」
                  </p>
                  <button
                    type="button"
                    onClick={() => fetchHints("thankYou")}
                    disabled={loadingHints.thankYou}
                    className="text-xs bg-[#E8F4EE] hover:bg-[#D9EFE3] text-[#2D4A3E] px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 transition-all active:translate-y-[2px] font-bold border border-[#B2D8D8] disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={loadingHints.thankYou ? "animate-spin" : ""} />
                    {loadingHints.thankYou ? "かんがえ中..." : "AIに別のアイデアをきく"}
                  </button>
                </div>

                {loadingHints.thankYou ? (
                  <div className="text-xs text-purple-600 animate-pulse font-bold p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
                    ✨ AIが ぴったりの「ありがとう」の文を かんがえているよ... ✨
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {thankYouHints.map((hint, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => injectHint("thankYou", hint.text)}
                        className="bg-white border border-[#D1E9E9] hover:border-[#88C9A1] hover:bg-[#F2FBF5] text-[#2D4A3E] px-3 py-2 rounded-full font-bold transition-all active:translate-y-[2px] shadow-sm flex items-center gap-1.5 text-xs sm:text-sm text-left"
                      >
                        <span className="shrink-0">{hint.emoji}</span>
                        <span>{hint.text}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <textarea
                rows={2}
                placeholder="ここにかいてね"
                value={thankYouWord}
                onChange={e => handleInputChange("thankYouWord", e.target.value, setThankYouWord)}
                className="w-full bg-[#F2FBF5] border-2 border-[#D1E9E9] rounded-[30px] p-4 text-sm sm:text-base focus:outline-none focus:border-[#88C9A1] focus:bg-white text-[#2D4A3E] transition-all font-bold resize-none"
              />
              {securityWarnings.thankYouWord && (
                <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1 ml-2">
                  <AlertTriangle size={14} /> {securityWarnings.thankYouWord}
                </p>
              )}
            </div>
          </section>

          {/* Question 6: Sender Name */}
          <section className="bg-white rounded-[40px] p-6 border-2 border-[#B2D8D8] shadow-sm relative hover:border-[#88C9A1] transition-colors">
            <div className="absolute -left-3 top-6 w-10 h-10 bg-[#88C9A1] rounded-full border-4 border-[#F2FBF5] flex items-center justify-center text-white font-bold shadow-sm">
              6
            </div>

            <div className="ml-6 sm:ml-8">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#1D3A2E] flex-grow">
                  あなたの 名前（おなまえ）
                </h2>
                <button
                  type="button"
                  onClick={() => speakText("６ばん。あなたの お名前")}
                  className="bg-yellow-100 hover:bg-yellow-200 border-2 border-yellow-300 text-lg rounded-full w-9 h-9 flex items-center justify-center transition-all duration-150 active:translate-y-[2px] shadow-sm shrink-0"
                  title="しつもんを きく"
                >
                  🔊
                </button>
              </div>

              <div className="border-2 border-dashed border-[#A5D8E1] rounded-[30px] p-4 bg-[#F9FEFB] mb-4 text-xs text-[#6B8E7E] font-bold">
                💡 さいごに、あなたのお名前をかきましょう（ニックネームでも いいよ）。
              </div>

              <div className="bg-[#F2FBF5] p-3 rounded-[30px] border-2 border-[#D1E9E9] flex items-center gap-3">
                <input
                  type="text"
                  placeholder="あなたのお名前を いれてね（例：たろう、さくら、たっくん）"
                  value={senderName}
                  onChange={e => handleInputChange("senderName", e.target.value, setSenderName)}
                  className="flex-grow bg-white border-2 border-[#D1E9E9] rounded-full px-4 py-2.5 text-sm sm:text-base font-bold focus:outline-none focus:border-[#88C9A1] transition-all"
                />
                <span className="text-base sm:text-lg font-bold text-[#1D3A2E] shrink-0 pr-2">
                  より
                </span>
              </div>
              {securityWarnings.senderName && (
                <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1 ml-2">
                  <AlertTriangle size={14} /> {securityWarnings.senderName}
                </p>
              )}
            </div>
          </section>

        </div>

        {/* Action Button: Create Essay */}
        <div className="text-center mt-10 mb-12">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={createDraft}
            className="w-full sm:w-auto px-10 py-5 bg-[#88C9A1] text-white font-extrabold text-xl sm:text-2xl rounded-full shadow-[0_6px_0_0_#629E7A] active:translate-y-1 active:shadow-none hover:bg-[#7bc095] transition-all duration-150"
          >
            ✨ さくぶんを つくる ✨
          </motion.button>
        </div>

        {/* Output Box */}
        <AnimatePresence>
          {essayText && (
            <motion.div
              id="result-box"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white rounded-[40px] border-2 border-[#B2D8D8] shadow-sm flex flex-col overflow-hidden mb-12"
            >
              <div className="p-6 border-b border-[#D1E9E9] bg-[#F2FBF5] rounded-t-[40px]">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-2 text-[#1D3A2E]">
                  <span className="w-8 h-8 bg-white border-2 border-[#88C9A1] rounded-full flex items-center justify-center text-[#88C9A1] text-sm">✓</span>
                  完成したメッセージ
                </h2>
              </div>

              <div className="p-6 sm:p-8 flex flex-col">
                <div className="relative mb-6">
                  <textarea
                    value={essayText}
                    onChange={e => handleInputChange("essayText", e.target.value, setEssayText)}
                    rows={10}
                    className="w-full p-5 border-2 border-[#D1E9E9] rounded-[30px] text-base sm:text-lg font-bold leading-relaxed bg-[#F2FBF5] text-[#2D4A3E] focus:outline-none focus:border-[#88C9A1] transition-all resize-none"
                  />
                  
                  {/* Audio voice control inside letter card */}
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    {isSpeaking ? (
                      <button
                        onClick={stopSpeaking}
                        className="p-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-500 rounded-full transition-all active:translate-y-[2px]"
                        title="とめる"
                      >
                        <VolumeX size={20} />
                      </button>
                    ) : (
                      <button
                        onClick={() => speakText(essayText)}
                        className="p-3 bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-200 text-yellow-600 rounded-full transition-all active:translate-y-[2px]"
                        title="おんどくする"
                      >
                        <Volume2 size={20} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Security Warnings inside Draft check */}
                {securityWarnings.essayText && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-red-500 shrink-0" />
                    <p className="text-xs sm:text-sm text-red-700 font-bold">{securityWarnings.essayText}</p>
                  </div>
                )}

                {/* Status Message for AI Generation (e.g., loading, success) */}
                {essayStatusMessage && (
                  <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 mb-6 text-center">
                    <p className="text-xs sm:text-sm font-bold text-purple-700 animate-pulse">
                      {essayStatusMessage}
                    </p>
                  </div>
                )}

                {/* Grade Selection & Kanji Conversion */}
                <div className="bg-[#F2FBF5] border-2 border-[#D1E9E9] rounded-[30px] p-5 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#88C9A1] text-xl">🎒</span>
                    <span className="font-extrabold text-[#1D3A2E] text-sm sm:text-base">
                      学年（がくねん）に合わせた かん字に へんかんする
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {[
                      { id: "hiragana", label: "ひらがなだけ", emoji: "🐣" },
                      { id: "1", label: "1年生 (いちねん)", emoji: "✏️" },
                      { id: "2", label: "2年生 (にねん)", emoji: "🎨" },
                      { id: "3", label: "3年生 (さんねん)", emoji: "🔍" },
                      { id: "4", label: "4年生 (よねん)", emoji: "🗺️" },
                      { id: "5", label: "5年生 (ごねん)", emoji: "🔭" },
                      { id: "6", label: "6年生 (ろくねん)", emoji: "🎓" },
                      { id: "all", label: "かん字（ふつう）", emoji: "📚" },
                    ].map(gradeItem => (
                      <button
                        key={gradeItem.id}
                        type="button"
                        onClick={() => {
                          setSelectedGrade(gradeItem.id);
                          speakText(`${gradeItem.label.split(" ")[0]}を選びました。`);
                        }}
                        className={`px-3 py-2.5 rounded-2xl border-2 font-bold text-xs transition-all flex items-center justify-center gap-1 shadow-sm active:translate-y-[1px] ${
                          selectedGrade === gradeItem.id
                            ? "bg-[#E8F4EE] border-[#88C9A1] text-[#1D3A2E] font-black"
                            : "bg-white border-[#E8F4EE] hover:border-[#88C9A1] text-[#6B8E7E]"
                        }`}
                      >
                        <span>{gradeItem.emoji}</span>
                        <span>{gradeItem.label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleConvertKanji(selectedGrade)}
                    disabled={isGeneratingEssay || !!securityWarnings.essayText}
                    className="w-full py-3.5 bg-[#88C9A1]/20 hover:bg-[#88C9A1]/30 text-[#1D3A2E] font-extrabold rounded-2xl border-2 border-[#88C9A1] flex items-center justify-center gap-2 transition-all active:translate-y-[2px] disabled:opacity-50 text-sm sm:text-base shadow-sm"
                  >
                    <Sparkles size={18} className="text-[#88C9A1]" />
                    えらんだ学年の漢字に へんかんする！
                  </button>
                </div>

                {/* Action Buttons inside Card */}
                <div className="flex flex-col md:flex-row gap-3 justify-center mb-6">
                  <button
                    onClick={handleProofread}
                    disabled={isGeneratingEssay || !!securityWarnings.essayText}
                    className="flex-1 bg-[#E8F4EE] hover:bg-[#D9EFE3] text-[#2D4A3E] font-bold py-3 px-5 rounded-2xl border border-[#B2D8D8] flex items-center justify-center gap-2 transition-all active:translate-y-[2px] disabled:opacity-50 text-sm sm:text-base"
                  >
                    <Wand2 size={18} className="text-[#88C9A1]" />
                    まほうで ぶんを きれいにする
                  </button>
                  <button
                    onClick={handleExpand}
                    disabled={isGeneratingEssay || !!securityWarnings.essayText}
                    className="flex-1 bg-[#E8F4EE] hover:bg-[#D9EFE3] text-[#2D4A3E] font-bold py-3 px-5 rounded-2xl border border-[#B2D8D8] flex items-center justify-center gap-2 transition-all active:translate-y-[2px] disabled:opacity-50 text-sm sm:text-base"
                  >
                    <BookOpen size={18} className="text-[#88C9A1]" />
                    まほうで ぶんを ふくらませる
                  </button>
                </div>

                {/* Bottom interactive and Safety indicator area */}
                <div className="bg-[#F9FEFB] border-t border-[#D1E9E9] pt-6 flex flex-col gap-4">
                  <div className="bg-white border-2 border-dashed border-[#FFB4B4] rounded-2xl p-4 flex items-start gap-3">
                    <div className="text-red-400 font-extrabold text-xl leading-none shrink-0">!</div>
                    <p className="text-xs text-[#A66E6E] leading-tight font-bold">
                      【あんぜん確認】きれいな言葉で書かれています。汚い言葉、人を傷つける言葉、暴力的な表現はAIがチェックしてブロックします。
                    </p>
                  </div>
                  
                  <button
                    onClick={handleCopy}
                    className="w-full py-4 bg-[#88C9A1] text-white font-extrabold text-base sm:text-lg rounded-full shadow-[0_4px_0_0_#629E7A] active:translate-y-1 active:shadow-none hover:bg-[#7bc095] transition-all flex items-center justify-center gap-2"
                  >
                    {isCopied ? <Check size={18} /> : <Copy size={18} />}
                    {isCopied ? "コピーしたよ！" : "このメッセージをコピーする"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative Footer Item */}
        <div className="h-20 bg-[#D1E9E9]/40 rounded-full flex items-center px-10 gap-6 opacity-60 mb-6">
          <div className="w-3 h-3 bg-white rounded-full"></div>
          <div className="w-full h-2 bg-white/50 rounded-full"></div>
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

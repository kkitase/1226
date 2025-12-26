
import { GoogleGenAI, Type } from "@google/genai";
import { Message, AssessmentResult, Scenario } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getChatResponse = async (scenario: Scenario, history: Message[]) => {
  const model = "gemini-3-flash-preview";
  const contents = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  const response = await genAI.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: `${scenario.systemPrompt} 日本語で自然に対話してください。1回の発言は150文字以内に収めてください。`,
      temperature: 0.8,
    },
  });

  return response.text || "申し訳ありません。エラーが発生しました。";
};

export const assessConversation = async (scenario: Scenario, history: Message[]): Promise<AssessmentResult> => {
  const model = "gemini-3-pro-preview"; // Use Pro for complex analysis
  const conversationText = history.map(h => `${h.role === 'user' ? 'ユーザー' : '相手'}: ${h.text}`).join('\n');

  const prompt = `
    以下のコミュニケーション（シナリオ: ${scenario.title}）のログを分析し、ユーザーのコミュニケーション能力を評価してください。
    
    【会話ログ】
    ${conversationText}
    
    【評価基準】
    - 共感力: 相手の感情や状況を理解し、寄り添えているか
    - 論理性: 話の筋道が通っており、一貫性があるか
    - 分かりやすさ: 簡潔で明瞭な表現ができているか
    - 自信: 堂々としており、迷いがないか（テキストから推測されるトーン）
    - 説得力: 相手を納得させる力があるか
  `;

  const response = await genAI.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scores: {
            type: Type.OBJECT,
            properties: {
              empathy: { type: Type.NUMBER },
              logic: { type: Type.NUMBER },
              clarity: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER },
              persuasion: { type: Type.NUMBER },
            },
            required: ["empathy", "logic", "clarity", "confidence", "persuasion"],
          },
          overallFeedback: { type: Type.STRING },
          strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          improvements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          advice: { type: Type.STRING },
        },
        required: ["scores", "overallFeedback", "strengths", "improvements", "advice"],
      },
    },
  });

  try {
    return JSON.parse(response.text || '{}') as AssessmentResult;
  } catch (e) {
    console.error("Failed to parse assessment result", e);
    throw new Error("評価の生成に失敗しました。");
  }
};

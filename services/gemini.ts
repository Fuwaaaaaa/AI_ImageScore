import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from '../types';

// Initialize Gemini Client
// IMPORTANT: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A creative and artistic title for the VRChat screenshot.",
    },
    totalScore: {
      type: Type.NUMBER,
      description: "An overall score from 0 to 100 based on VRChat photography standards.",
    },
    summary: {
      type: Type.STRING,
      description: "A concise executive summary of the critique (approx. 2-3 sentences).",
    },
    criteria: {
      type: Type.ARRAY,
      description: "Detailed scores for specific aspects of VRChat photography.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "The name of the criterion (e.g., World Integration, Avatar Aesthetics, Lighting/Unity, Composition).",
          },
          score: {
            type: Type.NUMBER,
            description: "Score for this criterion from 0 to 100.",
          },
          comment: {
            type: Type.STRING,
            description: "Specific feedback regarding this criterion.",
          },
        },
        required: ["name", "score", "comment"],
      },
    },
    advice: {
      type: Type.STRING,
      description: "Actionable advice on photography technique (angle, focal length, world settings).",
    },
    avatarCritique: {
      type: Type.STRING,
      description: "Specific critique on the avatar's fashion, makeup, textures, and overall style.",
    },
    posingAdvice: {
      type: Type.STRING,
      description: "Advice on where to stand, body language, facial expressions, or camera angle relative to the subject.",
    },
    accessoryRecommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 3-4 specific accessories (e.g., glasses, halo, specific jewelry, particle effects) that would enhance the avatar or photo.",
    },
    technicalDetails: {
      type: Type.STRING,
      description: "Guess at technical/world settings (e.g., bloom intensity, depth of field, particle systems).",
    },
  },
  required: ["title", "totalScore", "summary", "criteria", "advice", "avatarCritique", "posingAdvice", "accessoryRecommendations"],
};

export const analyzeImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // Strip the data URL prefix if present to get raw base64
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          {
            text: `
              あなたはVRChat界隈で有名な「バーチャルフォトグラファー」兼「アバターファッションスタイリスト（衣装・メイク・改変のプロ）」です。
              提供されたVRChatのスクリーンショット（写真）を審査し、以下の観点で厳しくも愛のあるアドバイスをJSON形式で出力してください。

              ## 役割設定
              - 写真技術だけでなく、アバターの「かわいさ/かっこよさ」、ワールドの雰囲気との調和を重視します。
              - Unityのライティングやシェーダーの知識に基づいた技術的な指摘も行います。

              ## 評価観点 (criteria)
              1. Composition & Angle (構図・アングル)
              2. Lighting & Atmosphere (光の演出・ワールドの空気感)
              3. Avatar Aesthetics (アバターの改変・衣装・メイクのクオリティ)
              4. Posing & Expression (ポージング・表情・視線)
              5. Storytelling (写真から伝わる物語・エモさ)

              ## 具体的な出力内容
              - **avatarCritique**: アバターの顔立ち、メイクの濃さ、衣装のテクスチャや色合わせについて具体的にコメントしてください。「もっとチークを濃くしたほうがワールドのライティングに映える」「アイラインを強調して」など。
              - **posingAdvice**: 「もう少し右に立って逆光を利用しよう」「カメラを下から煽って足を長く見せよう」「目線を外してアンニュイに」など、立ち位置とポーズの具体的な指示。
              - **accessoryRecommendations**: このアバターや写真の雰囲気をさらに良くするための具体的なアイテム提案（例：「細フレームの眼鏡」「青白いパーティクル」「パンクなチョーカー」など）。

              言語は日本語で、VRChatユーザーに響くトーン（丁寧だが専門用語も少し交える）でお願いします。
              点数は0から100の間で評価してください。
            `,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.4,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};
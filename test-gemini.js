import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

async function test() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
      console.error(".env.local not found");
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    const apiKey = match ? match[1].trim() : null;

    if (!apiKey) {
      console.error("GEMINI_API_KEY not found in .env.local");
      return;
    }

    console.log("Found API Key (length):", apiKey.length);

    const ai = new GoogleGenAI({ apiKey: apiKey });
    try {
        const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [{ text: "Hello, are you working?" }]
        }
        });
        console.log("Response:", response.text);
    } catch (apiError) {
        console.error("API Error Message:", apiError.message);
        // console.error("Full Error:", JSON.stringify(apiError, null, 2));
    }

  } catch (error) {
    console.error("Script Error:", error);
  }
}

test();

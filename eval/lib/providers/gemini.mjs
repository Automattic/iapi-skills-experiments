/**
 * Google Gemini LLM provider using @google/generative-ai.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLMProvider } from "./base.mjs";

export class GeminiProvider extends LLMProvider {
  constructor(opts) {
    super(opts);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async complete({ system, user }) {
    const model = this.genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: system,
      generationConfig: {
        temperature: this.temperature,
        maxOutputTokens: this.maxTokens,
      },
    });

    const result = await model.generateContent(user);
    return result.response.text();
  }
}

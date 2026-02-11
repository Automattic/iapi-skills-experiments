/**
 * OpenAI LLM provider using the openai SDK.
 */

import OpenAI from "openai";
import { LLMProvider } from "./base.mjs";

export class OpenAIProvider extends LLMProvider {
  constructor(opts) {
    super(opts);
    this.client = new OpenAI();
  }

  async complete({ system, user }) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    return response.choices[0]?.message?.content ?? "";
  }
}

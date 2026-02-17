/**
 * Anthropic LLM provider using @anthropic-ai/sdk.
 */

import Anthropic from "@anthropic-ai/sdk";
import { LLMProvider } from "./base.mjs";

export class AnthropicProvider extends LLMProvider {
  constructor(opts) {
    super(opts);
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }
    this.client = new Anthropic();
  }

  async complete({ system, user }) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      system,
      messages: [{ role: "user", content: user }],
    });

    // Extract text from the response content blocks.
    return response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");
  }
}

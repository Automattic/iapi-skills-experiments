/**
 * Provider factory.
 *
 * Returns an LLM provider instance based on the config.
 */

import { AnthropicProvider } from "./anthropic.mjs";
import { OpenAIProvider } from "./openai.mjs";

const PROVIDERS = {
  anthropic: AnthropicProvider,
  openai: OpenAIProvider,
};

/**
 * Create an LLM provider instance.
 *
 * @param {object} opts
 * @param {string} opts.provider    - "anthropic" or "openai"
 * @param {string} opts.model       - Model identifier
 * @param {number} [opts.temperature]
 * @param {number} [opts.maxTokens]
 * @returns {import("./base.mjs").LLMProvider}
 */
export function createProvider({ provider, model, temperature, maxTokens }) {
  const Provider = PROVIDERS[provider];
  if (!Provider) {
    throw new Error(
      `Unknown provider "${provider}". Available: ${Object.keys(PROVIDERS).join(", ")}`
    );
  }
  return new Provider({ model, temperature, maxTokens });
}

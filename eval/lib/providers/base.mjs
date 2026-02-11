/**
 * Abstract LLM provider base class.
 *
 * Subclasses must implement `complete({ system, user })`.
 */
export class LLMProvider {
  constructor({ model, temperature = 0, maxTokens = 4096 }) {
    if (new.target === LLMProvider) {
      throw new Error("LLMProvider is abstract and cannot be instantiated directly.");
    }
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
  }

  /**
   * Send a completion request.
   *
   * @param {object} params
   * @param {string} params.system - System prompt.
   * @param {string} params.user   - User prompt.
   * @returns {Promise<string>} The assistant's text response.
   */
  async complete({ system, user }) {
    throw new Error("complete() must be implemented by the subclass.");
  }
}

/**
 * LLM-as-judge evaluation.
 *
 * Sends the student's generated code plus the merged rubric to the judge LLM.
 * Returns per-criterion pass/fail with reasoning.
 */

/**
 * Evaluate generated code against a rubric using a judge LLM.
 *
 * @param {object} params
 * @param {import("./providers/base.mjs").LLMProvider} params.judge - Judge LLM provider.
 * @param {string} params.prompt       - The original prompt given to the student.
 * @param {string} params.generatedCode - The student's generated code.
 * @param {Array<{ id: string, description: string }>} params.rubric - Merged rubric criteria.
 * @returns {Promise<{ results: Array<{ criterion: string, id: string, pass: boolean, reasoning: string }> }>}
 */
export async function evaluate({ judge, prompt, generatedCode, rubric }) {
  const rubricText = rubric
    .map((c, i) => `${i + 1}. [${c.id}] ${c.description}`)
    .join("\n");

  const system = `You are an expert WordPress Interactivity API code reviewer.
You will be given:
1. A PROMPT that was given to a student AI.
2. The CODE the student AI generated.
3. A RUBRIC of criteria to evaluate against.

For each criterion, determine if the code passes or fails.
Return ONLY a JSON array (no markdown fences, no extra text) where each element is:
{
  "id": "<criterion id>",
  "criterion": "<criterion description>",
  "pass": true/false,
  "reasoning": "<brief explanation>"
}

Be strict but fair. A criterion passes only if the code clearly satisfies it.`;

  const user = `## PROMPT
${prompt}

## CODE
${generatedCode}

## RUBRIC
${rubricText}

Evaluate each criterion. Return ONLY the JSON array.`;

  const response = await judge.complete({ system, user });

  // Parse the JSON response. The judge should return a raw JSON array.
  let results;
  try {
    // Strip potential markdown fences if the model adds them despite instructions.
    const cleaned = response.replace(/^```(?:json)?\s*\n?/m, "").replace(/\n?```\s*$/m, "");
    results = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Judge returned invalid JSON.\n\nRaw response:\n${response}`
    );
  }

  if (!Array.isArray(results)) {
    throw new Error(
      `Judge returned non-array JSON.\n\nParsed:\n${JSON.stringify(results, null, 2)}`
    );
  }

  return { results };
}

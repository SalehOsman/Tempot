import type { AITool } from '../ai-core.types.js';

/** Generate "did you mean...?" suggestions using keyword-based tool matching */
export class AlternativeSuggestions {
  /** Generate up to maxSuggestions alternative suggestions based on available tools */
  suggest(userMessage: string, filteredTools: AITool[], maxSuggestions: number = 3): string[] {
    const words = userMessage.toLowerCase().split(/\s+/);
    const scored = filteredTools
      .map((tool) => {
        const desc = tool.description.toLowerCase();
        const nameWords = tool.name.split('.').join(' ').toLowerCase();
        let score = 0;
        for (const word of words) {
          if (desc.includes(word)) score++;
          if (nameWords.includes(word)) score += 2;
        }
        return { tool, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);

    return scored.map((s) => s.tool.description);
  }
}

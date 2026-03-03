

import { llm } from "./2_config.js";

async function classifyQuery(query, resolvedEntities) {
  // Build resolved entity context
  const entityContext = resolvedEntities.entities.length > 0
    ? resolvedEntities.entities
        .map((e) => `"${e.searchTerm}" is a ${e.label} (full name: "${e.nodeName}")`)
        .join("\n")
    : "No entities were found in the database.";

  // Add unresolved terms if any
  const unresolvedContext = resolvedEntities.unresolved.length > 0
    ? `\nThese terms were NOT found in the database: ${resolvedEntities.unresolved.join(", ")}`
    : "";

  const prompt = `You are a query classifier for a movie knowledge graph.

RESOLVED ENTITIES (we already looked these up in the database):
${entityContext}${unresolvedContext}

CLASSIFY the query as ONE of:

1. "graph" — anything that can be answered from structured data
2. "similarity" — finding similar or recommended items

Respond ONLY with JSON: {"type": "graph" or "similarity", "reasoning": "one sentence"}
No markdown, no backticks.`;

  const response = await llm.invoke([
    { role: "system", content: prompt },
    { role: "human", content: query },
  ]);

  let raw = response.content;

  // Handle array response format
  if (Array.isArray(raw)) {
    raw = raw
      .filter((block) => typeof block === "string" || block.type === "text")
      .map((block) => (typeof block === "string" ? block : block.text))
      .join("\n");
  }

  // Clean markdown wrappers if present
  raw = raw.trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Classification failed, defaulting to graph");
    return { type: "graph", reasoning: "Default fallback" };
  }
}

export { classifyQuery };
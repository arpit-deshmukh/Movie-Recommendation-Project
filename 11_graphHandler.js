

import { driver, llm } from "./2_config.js";
import { buildCypher } from "./8_cypherTemplates.js";

// Create query plan using resolved entities
async function createQueryPlan(query, resolvedEntities) {
  const entityContext = resolvedEntities.entities
    .map((e) => `"${e.searchTerm}" = ${e.label} (exact name in DB: "${e.nodeName}")`)
    .join("\n");

  const unresolvedContext = resolvedEntities.unresolved.length > 0
    ? `\nNOT FOUND in database: ${resolvedEntities.unresolved.join(", ")}`
    : "";

  const prompt = `You are a query planner for a movie knowledge graph.

RESOLVED ENTITIES (already verified in the database):
${entityContext}${unresolvedContext}

IMPORTANT: Use exact nodeName values.

GRAPH SCHEMA:
Nodes: Movie(title,year), Director(name), Actor(name), Genre(name), Theme(name), Award(name,category)
Relationships: Director-[:DIRECTED]->Movie, Actor-[:ACTED_IN]->Movie, Movie-[:BELONGS_TO]->Genre, Movie-[:EXPLORES]->Theme, Movie-[:WON]->Award

OUTPUT a JSON plan using only supported step types.
Always include projection or aggregation unless using describe or path.
Output only valid JSON.`;

  const response = await llm.invoke([
    { role: "system", content: prompt },
    { role: "human", content: query },
  ]);

  let raw = response.content;

  if (Array.isArray(raw)) {
    raw = raw
      .filter((block) => typeof block === "string" || block.type === "text")
      .map((block) => (typeof block === "string" ? block : block.text))
      .join("\n");
  }

  raw = raw.trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse plan:", raw.substring(0, 300));
    throw new Error("Query planning failed. Please rephrase your question.");
  }
}

// Describe entity with all connected data
async function executeDescribe(label, name) {
  const session = driver.session({ defaultAccessMode: "READ" });

  try {
    let cypher;
    const params = { name };

    switch (label) {
      case "Movie":
        cypher = `
          MATCH (m:Movie {title: $name})
          OPTIONAL MATCH (d:Director)-[:DIRECTED]->(m)
          OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
          OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
          OPTIONAL MATCH (m)-[:EXPLORES]->(t:Theme)
          OPTIONAL MATCH (m)-[:WON]->(aw:Award)
          RETURN m.title AS title, m.year AS year,
                 collect(DISTINCT d.name) AS directors,
                 collect(DISTINCT a.name) AS actors,
                 collect(DISTINCT g.name) AS genres,
                 collect(DISTINCT t.name) AS themes,
                 collect(DISTINCT {name: aw.name, category: aw.category}) AS awards`;
        break;

      case "Director":
        cypher = `
          MATCH (d:Director {name: $name})-[:DIRECTED]->(m:Movie)
          OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
          OPTIONAL MATCH (m)-[:EXPLORES]->(t:Theme)
          OPTIONAL MATCH (m)-[:WON]->(aw:Award)
          OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
          RETURN d.name AS name,
                 collect(DISTINCT {title: m.title, year: m.year}) AS movies,
                 collect(DISTINCT g.name) AS genres,
                 collect(DISTINCT t.name) AS themes,
                 collect(DISTINCT a.name) AS collaborators,
                 collect(DISTINCT {name: aw.name, category: aw.category}) AS awards`;
        break;

      case "Actor":
        cypher = `
          MATCH (a:Actor {name: $name})-[:ACTED_IN]->(m:Movie)
          OPTIONAL MATCH (d:Director)-[:DIRECTED]->(m)
          OPTIONAL MATCH (m)-[:BELONGS_TO]->(g:Genre)
          OPTIONAL MATCH (m)-[:EXPLORES]->(t:Theme)
          OPTIONAL MATCH (m)-[:WON]->(aw:Award)
          RETURN a.name AS name,
                 collect(DISTINCT {title: m.title, year: m.year}) AS movies,
                 collect(DISTINCT d.name) AS directors,
                 collect(DISTINCT g.name) AS genres,
                 collect(DISTINCT t.name) AS themes,
                 collect(DISTINCT {name: aw.name, category: aw.category}) AS awards`;
        break;

      case "Genre":
        cypher = `
          MATCH (m:Movie)-[:BELONGS_TO]->(g:Genre {name: $name})
          OPTIONAL MATCH (d:Director)-[:DIRECTED]->(m)
          RETURN g.name AS name,
                 collect(DISTINCT {title: m.title, year: m.year}) AS movies,
                 collect(DISTINCT d.name) AS directors`;
        break;

      case "Theme":
        cypher = `
          MATCH (m:Movie)-[:EXPLORES]->(t:Theme {name: $name})
          OPTIONAL MATCH (d:Director)-[:DIRECTED]->(m)
          RETURN t.name AS name,
                 collect(DISTINCT {title: m.title, year: m.year}) AS movies,
                 collect(DISTINCT d.name) AS directors`;
        break;

      case "Award":
        cypher = `
          MATCH (m:Movie)-[:WON]->(aw:Award {name: $name})
          OPTIONAL MATCH (d:Director)-[:DIRECTED]->(m)
          RETURN aw.name AS name,
                 collect(DISTINCT {title: m.title, year: m.year, category: aw.category}) AS movies,
                 collect(DISTINCT d.name) AS directors`;
        break;

      default:
        return [{ error: `Unknown label: ${label}` }];
    }

    console.log(`Describe Cypher: ${cypher.replace(/\s+/g, " ").trim()}`);

    const result = await session.run(cypher, params);

    return result.records.map((record) => {
      const obj = {};
      record.keys.forEach((key) => {
        const value = record.get(key);
        obj[key] = typeof value === "object" && value?.toNumber
          ? value.toNumber()
          : value;
      });
      return obj;
    });
  } finally {
    await session.close();
  }
}

// Shortest path between two entities
async function executePath(fromLabel, fromName, toLabel, toName) {
  const session = driver.session({ defaultAccessMode: "READ" });

  try {
    const cypher = `
      MATCH (a:${fromLabel} {${fromLabel === "Movie" ? "title" : "name"}: $fromName}),
            (b:${toLabel} {${toLabel === "Movie" ? "title" : "name"}: $toName}),
            path = shortestPath((a)-[*..6]-(b))
      RETURN [node IN nodes(path) | {
        labels: labels(node),
        name: coalesce(node.name, node.title),
        year: node.year
      }] AS pathNodes,
      [rel IN relationships(path) | type(rel)] AS pathRels`;

    console.log(`Path Cypher: ${cypher.replace(/\s+/g, " ").trim()}`);

    const result = await session.run(cypher, { fromName, toName });

    if (result.records.length === 0) {
      return [{ error: `No connection found between ${fromName} and ${toName}` }];
    }

    return result.records.map((record) => ({
      pathNodes: record.get("pathNodes"),
      pathRels: record.get("pathRels"),
    }));
  } finally {
    await session.close();
  }
}

// Execute template-generated Cypher
async function executeTemplateCypher(plan) {
  const { cypher, params } = buildCypher(plan);

  console.log(`Cypher: ${cypher}`);
  console.log(`Params:`, params);

  const session = driver.session({ defaultAccessMode: "READ" });

  try {
    const result = await session.run(cypher, params);

    return result.records.map((record) => {
      const obj = {};
      record.keys.forEach((key) => {
        const value = record.get(key);
        obj[key] = typeof value === "object" && value?.toNumber
          ? value.toNumber()
          : value;
      });
      return obj;
    });
  } finally {
    await session.close();
  }
}

// Main graph query handler
async function handleGraphQuery(query, resolvedEntities) {
  console.log("Creating query plan...");
  const plan = await createQueryPlan(query, resolvedEntities);
  console.log("Plan:", JSON.stringify(plan, null, 2));

  let records;
  const firstStep = plan.steps[0];

  if (firstStep.type === "describe") {
    records = await executeDescribe(firstStep.label, firstStep.name);
  } else if (firstStep.type === "path") {
    records = await executePath(
      firstStep.fromLabel,
      firstStep.fromName,
      firstStep.toLabel,
      firstStep.toName
    );
  } else {
    records = await executeTemplateCypher(plan);
  }

  if (records.length === 0 || records[0]?.error) {
    const errorMsg = records[0]?.error || "No results found";
    return `I couldn't find an answer: ${errorMsg}`;
  }

  const responsePrompt = `Given the question and database results, provide a clear natural language answer.

Question: ${query}

Database Results:
${JSON.stringify(records.slice(0, 50), null, 2)}`;

  const response = await llm.invoke([
    { role: "system", content: "Respond only in plain English text." },
    { role: "human", content: responsePrompt },
  ]);

  let answer = response.content;

  if (Array.isArray(answer)) {
    answer = answer
      .filter((block) => typeof block === "string" || block.type === "text")
      .map((block) => (typeof block === "string" ? block : block.text))
      .join("\n");
  }

  return answer.trim();
}

export { handleGraphQuery };
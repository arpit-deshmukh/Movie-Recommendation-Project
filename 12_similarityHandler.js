


import { llm, embedText, pineconeIndex, driver } from "./2_config.js";

// Extract movie title from chunk text
function extractTitleFromChunk(chunkText) {
  const match = chunkText.match(/Movie Title:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

// Get genres of a movie
async function getMovieGenres(movieTitle) {
  const session = driver.session({ defaultAccessMode: "READ" });
  try {
    const result = await session.run(
      `MATCH (m:Movie)-[:BELONGS_TO]->(g:Genre)
       WHERE m.title = $title
       RETURN g.name AS genre`,
      { title: movieTitle }
    );
    return result.records.map((r) => r.get("genre"));
  } finally {
    await session.close();
  }
}

// Get themes of a movie
async function getMovieThemes(movieTitle) {
  const session = driver.session({ defaultAccessMode: "READ" });
  try {
    const result = await session.run(
      `MATCH (m:Movie)-[:EXPLORES]->(t:Theme)
       WHERE m.title = $title
       RETURN t.name AS theme`,
      { title: movieTitle }
    );
    return result.records.map((r) => r.get("theme"));
  } finally {
    await session.close();
  }
}

// Filter candidate movies by genre overlap
async function filterByGenre(movieTitles, sourceGenres) {
  const session = driver.session({ defaultAccessMode: "READ" });
  try {
    const result = await session.run(
      `MATCH (m:Movie)-[:BELONGS_TO]->(g:Genre)
       WHERE m.title IN $titles
       WITH m, collect(g.name) AS genres
       WHERE any(genre IN genres WHERE genre IN $sourceGenres)
       RETURN m.title AS title, genres`,
      { titles: movieTitles, sourceGenres }
    );
    return result.records.map((r) => ({
      title: r.get("title"),
      genres: r.get("genres"),
    }));
  } finally {
    await session.close();
  }
}

// Main similarity query handler
async function handleSimilarityQuery(query, resolvedEntities) {
  const movieEntity = resolvedEntities.entities.find(
    (e) => e.label === "Movie"
  );

  if (!movieEntity) {
    console.log("No movie entity resolved. Falling back to vector search...");
    return await fallbackVectorSearch(query);
  }

  const movieName = movieEntity.nodeName;
  console.log(`Finding movies similar to: "${movieName}"`);

  // Pinecone search
  const queryVector = await embedText(movieName);

  const searchResults = await pineconeIndex.query({
    vector: queryVector,
    topK: 50,
    includeMetadata: true,
  });

  if (!searchResults.matches || searchResults.matches.length === 0) {
    return "I couldn't find any similar movies.";
  }

  // Get source genres and themes
  const sourceGenres = await getMovieGenres(movieName);
  const sourceThemes = await getMovieThemes(movieName);

  if (sourceGenres.length === 0) {
    console.warn(`No genres found for "${movieName}". Using vector results only.`);
    return await fallbackVectorSearch(query);
  }

  // Extract titles from chunks
  const candidateTitles = [];
  const chunkMap = {};

  for (const match of searchResults.matches) {
    const title = extractTitleFromChunk(match.metadata.text);
    if (title && title.toLowerCase() !== movieName.toLowerCase()) {
      candidateTitles.push(title);
      chunkMap[title] = match.metadata.text;
    }
  }

  // Filter by genre
  const genreMatched = await filterByGenre(candidateTitles, sourceGenres);

  if (genreMatched.length === 0) {
    return `I found movies in the database but none share genres with "${movieName}" (${sourceGenres.join(", ")}). Try a broader search.`;
  }

  // LLM ranking
  const candidateList = genreMatched.map((m) => ({
    title: m.title,
    genres: m.genres.join(", "),
    chunkText: chunkMap[m.title] || "",
  }));

  const prompt = `The user wants movies similar to: "${movieName}"
- Genres: ${sourceGenres.join(", ")}
- Themes: ${sourceThemes.join(", ")}

Here are ${candidateList.length} movies that share at least one genre:
${candidateList.map((c) => `- ${c.title} [Genres: ${c.genres}]\n  Info: ${c.chunkText}`).join("\n\n")}

Pick the 10 BEST matches.
Rank by genre overlap, theme similarity, and overall vibe.

Explain each in 1-2 sentences.
Format as a numbered list.`;

  const response = await llm.invoke([
    { role: "system", content: "Respond only with a numbered list of recommendations with short explanations." },
    { role: "human", content: prompt },
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

// Fallback: pure vector search
async function fallbackVectorSearch(query) {
  console.log("Fallback: Pure vector search...");

  const queryVector = await embedText(query);

  const searchResults = await pineconeIndex.query({
    vector: queryVector,
    topK: 20,
    includeMetadata: true,
  });

  if (!searchResults.matches || searchResults.matches.length === 0) {
    return "I couldn't find any matching movies.";
  }

  const candidates = searchResults.matches.map((m) => m.metadata.text);

  const prompt = `The user asked: "${query}"

Here are ${candidates.length} movies from our database:
${candidates.map((text, i) => `--- Movie ${i + 1} ---\n${text}`).join("\n\n")}

Pick the 10 BEST matches.
Explain each in 1-2 sentences.
Format as a numbered list.`;

  const response = await llm.invoke([
    { role: "system", content: "Respond only with a numbered list of recommendations with short explanations." },
    { role: "human", content: prompt },
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

export { handleSimilarityQuery };
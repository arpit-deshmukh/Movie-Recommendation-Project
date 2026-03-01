import { genai } from "./2_config.js";
import { createPartFromUri } from "@google/genai";

// Prompt for structured movie extraction
const EXTRACTION_PROMPT = `You are a precise entity extractor for a movie knowledge graph.

From the attached PDF, extract movies {START} through {END} (by their order in the document).

For EACH movie, output this EXACT JSON structure:
{
  "movie": {"title": "string", "year": number},
  "director": {"name": "string"},
  "actors": ["string"],
  "genres": ["string"],
  "themes": ["string"],
  "awards": ["string"]
}

Rules:
- If awards say "None", return awards as empty array []
- Keep exact names as written in the PDF
- Year must be a number, not string
- Return a JSON ARRAY of objects: [{...}, {...}, ...]
- Return ONLY valid JSON. No markdown, no backticks, no explanation.`;

// Upload PDF and wait until processed
async function uploadPDF(pdfPath) {
  console.log("Uploading PDF...");

  const file = await genai.files.upload({
    file: pdfPath,
    config: { mimeType: "application/pdf" },
  });

  let fileInfo = await genai.files.get({ name: file.name });
  while (fileInfo.state === "PROCESSING") {
    await new Promise((r) => setTimeout(r, 3000));
    fileInfo = await genai.files.get({ name: file.name });
  }

  if (fileInfo.state === "FAILED") {
    throw new Error("PDF upload processing failed");
  }

  return fileInfo;
}

// Extract one batch with retry logic
async function extractBatch(fileInfo, start, end, attempt = 1) {
  const maxRetries = 3;
  const prompt = EXTRACTION_PROMPT
    .replace("{START}", start)
    .replace("{END}", end);

  try {
    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            createPartFromUri(fileInfo.uri, fileInfo.mimeType),
            { text: prompt },
          ],
        },
      ],
    });

    let raw = response.text.trim();
    raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    if (attempt < maxRetries) {
      const is429 = err.message?.includes("429");
      const wait = is429 ? attempt * 30 : attempt * 10;
      await new Promise((r) => setTimeout(r, wait * 1000));
      return extractBatch(fileInfo, start, end, attempt + 1);
    }

    console.error(`Batch ${start}-${end} failed:`, err.message?.substring(0, 150));
    return [];
  }
}

// Extract all movies in batches with concurrency
async function extractAllEntities(pdfPath, totalMovies = 1000, batchSize = 50) {
  const fileInfo = await uploadPDF(pdfPath);

  const allBatches = [];
  const totalBatches = Math.ceil(totalMovies / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    allBatches.push({
      start: i * batchSize + 1,
      end: Math.min((i + 1) * batchSize, totalMovies),
    });
  }

  const CONCURRENCY = 5;
  const results = [];
  const failedBatches = [];

  for (let i = 0; i < allBatches.length; i += CONCURRENCY) {
    const chunk = allBatches.slice(i, i + CONCURRENCY);

    const promises = chunk.map((batch) =>
      extractBatch(fileInfo, batch.start, batch.end)
        .then((res) => ({ batch, results: res }))
    );

    const batchResults = await Promise.all(promises);

    for (const { batch, results: res } of batchResults) {
      if (res.length > 0) {
        results.push(...res);
      } else {
        failedBatches.push(batch);
      }
    }

    if (i + CONCURRENCY < allBatches.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Retry failed batches sequentially
  for (const batch of failedBatches) {
    const batchResults = await extractBatch(fileInfo, batch.start, batch.end);

    if (batchResults.length > 0) {
      results.push(...batchResults);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  try {
    await genai.files.delete({ name: fileInfo.name });
  } catch (e) {}

  console.log(`Total extracted: ${results.length}/${totalMovies}`);
  return results;
}

export { extractAllEntities, uploadPDF };
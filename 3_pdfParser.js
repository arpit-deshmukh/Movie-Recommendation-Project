import fs from "fs";
import pdf from "pdf-parse";


async function parsePDF(pdfPath) {
  // Read PDF as binary buffer
  const dataBuffer = fs.readFileSync(pdfPath);

  // Extract full text
  const pdfData = await pdf(dataBuffer);
  const rawText = pdfData.text;

  console.log(`PDF parsed: ${pdfData.numpages} pages, ${rawText.length} characters`);

  // Split into movie sections using dash separator
  const movieBlocks = rawText
    .split(/-{10,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0 && block.includes("Movie Title"));

  console.log(`Found ${movieBlocks.length} movie blocks`);
  return movieBlocks;
}

export { parsePDF };
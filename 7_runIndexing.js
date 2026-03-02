import { extractAllEntities } from "./4_entityExtractor.js";
import { buildGraph } from "./5_graphBuilder.js";
import { buildVectorStore } from "./6_vectorStore.js";
import { closeConnections } from "./2_config.js";

async function runIndexing(pdfPath) {
  console.log("GraphRAG Indexing Pipeline\n");

  const startTime = Date.now();

  try {
    // Step 1: Extract Entities
    console.log("Step 1: Extracting Entities");
    const entities = await extractAllEntities(pdfPath);

    // Step 2: Build Graph
    console.log("\nStep 2: Building Graph");
    await buildGraph(entities);

    // Step 3: Build Vector Store
    console.log("\nStep 3: Building Vector Store");
    await buildVectorStore(pdfPath);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\nIndexing complete in ${elapsed}s`);
  } catch (err) {
    console.error("\nIndexing failed:", err.message);
    console.error(err.stack);
  } finally {
    await closeConnections();
  }
}

const pdfPath = "./data/movies.pdf";

if (!pdfPath) {
  console.error("Usage: npm run index -- ./data/movies.pdf");
  process.exit(1);
}

runIndexing(pdfPath);
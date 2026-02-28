import { driver, pineconeIndex, llm, embedText, closeConnections } from "./2_config.js";

async function testConnections() {
  console.log("Testing connections...\n");

  // Neo4j
  try {
    const session = driver.session();
    const result = await session.run("RETURN 'Neo4j Connected!' AS message");
    console.log("Neo4j:", result.records[0].get("message"));
    await session.close();
  } catch (err) {
    console.error("Neo4j Error:", err.message);
  }

  // Pinecone
  try {
    const stats = await pineconeIndex.describeIndexStats();
    console.log("Pinecone: Connected | Vectors:", stats.totalRecordCount || 0);
  } catch (err) {
    console.error("Pinecone Error:", err.message);
  }

  // Gemini LLM
  try {
    const response = await llm.invoke("Say 'Gemini Connected!' and nothing else.");
    console.log("Gemini LLM:", response.content.trim());
  } catch (err) {
    console.error("Gemini LLM Error:", err.message);
  }

  // Gemini Embeddings
  try {
    const vector = await embedText("test");
    console.log("Gemini Embeddings: Dimension =", vector.length);
  } catch (err) {
    console.error("Gemini Embeddings Error:", err.message);
  }

  await closeConnections();
}

testConnections();
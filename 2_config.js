import dotenv from "dotenv";
import neo4j from "neo4j-driver";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenAI } from "@google/genai";

dotenv.config(); 

// Neo4j driver (connection pool)
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

// Pinecone index referance 
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);

// Gemini LLM (deterministic output)
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0,
});

// Google GenAI SDK (embeddings + file handling)
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Embed single text (returns 3072-dim vector)
async function embedText(text) {
  const response = await genai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });
  return response.embeddings[0].values;
}

// Embed multiple texts
async function embedTexts(texts) {
  const response = await genai.models.embedContent({
    model: "gemini-embedding-001",
    contents: texts,
  });
  return response.embeddings.map((e) => e.values);
}

// Close Neo4j connection
async function closeConnections() {
  await driver.close();
  console.log("All connections closed.");
}

export {
  driver,
  pinecone,
  pineconeIndex,
  llm,
  genai,
  embedText,
  embedTexts,
  closeConnections,
};
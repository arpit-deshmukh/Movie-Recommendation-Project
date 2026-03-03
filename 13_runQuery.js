// Interactive query CLI

import readline from "readline";
import { resolveQueryEntities } from "./9_entityResolver.js";
import { classifyQuery } from "./10_queryClassifier.js";
import { handleGraphQuery } from "./11_graphHandler.js";
import { handleSimilarityQuery } from "./12_similarityHandler.js";
import { closeConnections } from "./2_config.js";

async function processQuery(query) {
  console.log("\n═══════════════════════════════════════════");

  // Step 1: Entity resolution
  console.log("\nENTITY RESOLUTION");
  const resolved = await resolveQueryEntities(query);

  // Step 2: Classification
  console.log("\nCLASSIFICATION");
  const classification = await classifyQuery(query, resolved);
  console.log(`Type: ${classification.type} | Reason: ${classification.reasoning}`);

  // Step 3: Route to handler
  let answer;

  if (classification.type === "similarity") {
    console.log("\n→ SIMILARITY handler...");
    answer = await handleSimilarityQuery(query, resolved);
  } else {
    console.log("\n→ GRAPH handler...");
    answer = await handleGraphQuery(query, resolved);
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("Answer:\n");
  console.log(answer);
  console.log("\n═══════════════════════════════════════════");
}

async function startCLI() {
  console.log("===========================================");
  console.log("GraphRAG Movie Query System");
  console.log("===========================================");
  console.log('Type your question. Type "exit" to quit.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = () => {
    rl.question("You: ", async (input) => {
      const query = input.trim();

      if (query.toLowerCase() === "exit") {
        console.log("\nGoodbye!");
        rl.close();
        await closeConnections();
        process.exit(0);
      }

      if (!query) { 
        ask(); 
        return; 
      }

      try {
        await processQuery(query);
      } catch (err) {
        console.error("\nError:", err.message);
      }

      ask();
    });
  };

  ask();
}

startCLI();
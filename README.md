# 🎬 GraphRAG Movie Recommendation System

A **Graph + Vector + LLM powered Movie Recommendation Engine** built using **Gemini, Neo4j, and Pinecone**.

This project combines **structured knowledge graphs** and **semantic search** to generate intelligent, context-aware movie recommendations using a GraphRAG architecture.

## 🚀 Project Overview

Traditional recommendation systems rely only on collaborative filtering or metadata.

This project builds a **GraphRAG (Graph Retrieval-Augmented Generation)** system where:

1. 📄 Movies are parsed from PDFs
2. 🤖 Gemini extracts structured entities (Actors, Directors, Genres, Awards, etc.)
3. 🧠 Neo4j stores relationship graphs
4. 🔎 Pinecone stores semantic embeddings
5. 💬 User queries are answered using hybrid retrieval (Graph + Vector)

   <p>
     <br/><br/>
   <img align="centre" width="751" height="672" alt="image" src="https://github.com/user-attachments/assets/20d3e8bd-ea34-4bfa-95c9-0b46b68571de" />

 <br/><br/>
   <img  align="centre" width="751" height="672" alt="image" src="https://github.com/user-attachments/assets/0cc063c1-7467-420f-b2d0-e04b49eb0707" />
   <br/><br/>
      <img   align="centre" width="550" height="387" alt="image" src="https://github.com/user-attachments/assets/98ad92cc-f8d6-442f-ba2d-cc2c14fb5f18" />

      
   </p>




## ⚙️ Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/movie-graphrag.git
cd movie-graphrag
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Setup Environment Variables

Create a `.env` file:

```
GEMINI_API_KEY=your_key
NEO4J_URI=your_uri
NEO4J_USERNAME=your_username
NEO4J_PASSWORD=your_password
PINECONE_API_KEY=your_key
PINECONE_INDEX=your_index
```

---

## 📥 Index Movies

Run indexing pipeline:

```bash
npm run index -- ./data/movies.pdf
```

This will:

- Extract entities using Gemini
- Store relationships in Neo4j
- Generate embeddings
- Store vectors in Pinecone


## 🔍 Run Query CLI

```bash
npm run query
```

Example Queries:

- “Recommend movies like Interstellar”
- “Movies directed by Christopher Nolan”
- “Oscar-winning inspirational movies”
- “Best Indian national award movies with deep message”

---

## 🧠 Key Features

✅ Hybrid Retrieval (Graph + Vector)

✅ Context-aware Recommendations

✅ Relationship-based Filtering

✅ CLI Interactive Interface

✅ Scalable Architecture

✅ Modular Indexing Pipeline

---

## 📌 Why GraphRAG?

Traditional RAG → Only semantic similarity

GraphRAG → Uses:

- Explicit relationships
- Structured knowledge
- Multi-hop reasoning

This allows:

- Better explainability
- Richer recommendations
- Complex query handling

---

## 📊 Example Use Case

User Query:

> "Suggest motivational Oscar-winning movies directed by female directors"
> 

System Flow:

1. Graph filters → Director (Female) + Awards (Oscar)
2. Vector search → Motivational theme
3. LLM synthesizes response

---

## 🔮 Future Improvements

- 🌐 Web UI (React + Express)
- 📈 Graph visualization dashboard
- 🔁 Incremental indexing
- 🎯 User personalization layer
- 📊 Recommendation scoring metrics
- 🧪 Evaluation framework

---

🎥 Demo



---
## 👨‍💻 Author

**Arpit**

If you found this interesting, feel free to ⭐ the repo.



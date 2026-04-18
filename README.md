# 🎬 GraphRAG Movie Recommendation System

A **Graph + Vector + LLM powered Movie Recommendation Engine** built using **Gemini, Neo4j, and Pinecone**.

This project combines **structured knowledge graphs** and **semantic search** to generate intelligent, context-aware movie recommendations using a GraphRAG architecture.



🔗 **Live Demo:** [GraphRAG Movie Recommendation System](https://movie-recommendation-project-v1.vercel.app/)

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

 <p align="center">
  <img src="https://github.com/user-attachments/assets/20d3e8bd-ea34-4bfa-95c9-0b46b68571de"
       style="width:44%; height:260px; object-fit:cover; border-radius:10px; margin-right:8px;" /><img
  src="https://github.com/user-attachments/assets/98ad92cc-f8d6-442f-ba2d-cc2c14fb5f18"
       style="width:44%; height:260px; object-fit:cover; border-radius:10px;" />
</p>

  <br/><br/>

  <br/><br/>

   

<h2 align="center">📸 Project Screenshots</h2>

<p align="center">
  <img src="https://github.com/user-attachments/assets/3295c683-5521-4439-9cc4-6384545dfd76" style="width:45%; height:250px; object-fit:cover;" />
  <img src="https://github.com/user-attachments/assets/2ac29cb7-42f2-4b49-a3ca-d1182c9f7fc2" style="width:45%; height:250px; object-fit:cover;" />
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/b44497b0-5c37-4cd1-94c1-355357240da3" style="width:45%; height:250px; object-fit:cover;" />
  <img src="https://github.com/user-attachments/assets/67b02805-8627-425c-8a39-95fa862b759e" style="width:45%; height:250px; object-fit:cover;" />
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



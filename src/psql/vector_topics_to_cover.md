---

### 📘 **Foundations to Cover**

1. **What is a Vector Database?**

   * Difference between traditional DBs and vector DBs
   * Use cases: semantic search, recommendation systems, RAG (Retrieval-Augmented Generation)

2. **Embeddings and Vectors**

   * What are embeddings?
   * How textual, visual, or audio data is converted to vectors
   * Cosine similarity vs Euclidean distance

3. **Indexing Techniques**

   * Flat vs approximate nearest neighbors (ANN)
   * Algorithms: HNSW, IVF, PQ, ScaNN, Faiss

4. **Vector DB Internals**

   * Storage: how vectors are stored and indexed
   * Filtering (metadata), hybrid search
   * Scalability: sharding, replication, streaming inserts

---

### 🛠️ **Popular Vector Databases**

We'll deep dive into their architecture and APIs:

* **FAISS** (Facebook AI Similarity Search) – good for local, performant search
* **Pinecone** – fully managed cloud vector DB
* **Weaviate** – hybrid search, modular
* **Milvus** – open-source, high-performance, scalable
* **Qdrant** – open-source with filtering and clustering
* **pgvector** – PostgreSQL extension, great for integrating vector search into relational DBs

---

### 💡 **Advanced Topics**

* Vector compression techniques
* Index maintenance & update strategies
* Vector search in production (monitoring, latency, costs)
* RAG + Vector DB integration (LangChain, LlamaIndex)

---

### ✅ Learning Plan Suggestion

Would you like a structured roadmap like:

1. Week-by-week topics
2. Hands-on project ideas (e.g., build a semantic search engine)
3. Tool-specific tutorials (e.g., using pgvector or Milvus with LangChain)

Let me know your preferences, and I’ll tailor the learning plan accordingly.



m (max_connections):

Default: 16

Higher values improve recall but increase index size and build time

Typical range: 10-100

ef_construction:

Default: 64

Controls the quality of the graph during construction

Higher values improve recall but increase build time

Typical range: 50-400

ef_search:

Runtime parameter (not part of index creation)

Controls the number of candidates considered during search

Higher values improve recall but slow down queries

Can be set per query with SET hnsw.ef_search = value
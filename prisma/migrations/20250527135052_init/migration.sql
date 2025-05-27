-- Check for extension to be exist or not
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "vector" vector(768),  -- Add dimension specification here
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- Create HNSW index (requires pgvector 0.5+)
CREATE INDEX document_vector_hnsw_idx
ON "Document"
USING hnsw (vector vector_l2_ops)
WITH (m = 16, ef_construction = 200);
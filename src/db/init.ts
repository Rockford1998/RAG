import { initializeDatabase } from "./pgsql";
import { VectorService } from "../vectorServices/vectorService";


// This function initializes the database and creates a table for storing document embeddings.
// It should be called once at application startup to set up the necessary schema.
export async function init() {
  try {
    // Initialize the database
    await initializeDatabase();
    // Create a table for our vectors
    const TABLE_NAME = "document_embeddings";
    const VECTOR_DIMENSIONS = 768; // Adjust based on your model (e.g., OpenAI uses 1536)
    await VectorService.createTableWithIndex(TABLE_NAME, VECTOR_DIMENSIONS, {
      type: "ivfflat",
    });
  } catch (error) {
    console.error("Application error:", error);
  }
}

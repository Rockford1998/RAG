import { initializeDatabase } from './db/db';
import { VectorService } from './psql/vectorService';

export async function init() {
    try {
        // Initialize the database
        await initializeDatabase();
        // Create a table for our vectors
        const TABLE_NAME = 'document_embeddings';
        const VECTOR_DIMENSIONS = 768; // Adjust based on your model (e.g., OpenAI uses 1536)
        const indexParams = {
            type: 'ivfflat',
        }
        await VectorService.createTableWithIndex(TABLE_NAME, VECTOR_DIMENSIONS, { type: "ivfflat" });
        // Example: Search for similar vectors
    } catch (error) {
        console.error('Application error:', error);
    }
}

import { embedWithOllama } from '../embedding';
import { prisma } from '../prisma';

export const getSimilarChunks = async (query: string, top = 3, similarityThreshold = 0.75) => {
  console.log('Searching for similar chunks...', similarityThreshold);
  const queryEmbedding = await embedWithOllama(query);
  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT content FROM documents
    ORDER BY embedding <-> '[${queryEmbedding.join(',')}]'
    LIMIT 5;
  `);
  return result.map((row) => row.content);
};
import { embedWithOllama } from "../embedding";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getSimilarChunks = async (
  query: string,
  similarityThreshold = 0.75,
) => {
  const queryEmbedding = await embedWithOllama(query);
  const result = (await prisma.$queryRawUnsafe(
    `
    SELECT content FROM documents
    ORDER BY embedding <-> '[${queryEmbedding.join(",")}]'
    LIMIT 5;
  `,
  )) as any[];
  return result.map((row) => row.content);
};

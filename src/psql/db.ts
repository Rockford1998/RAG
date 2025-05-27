import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const insertDocument = async (
  content: string,
  embedding: number[],
  metadata = {},
) => {
  try {
    // Use parameterized query with proper vector casting
    await prisma.$executeRaw`
            INSERT INTO documents (content, embedding, metadata)
            VALUES (${content}, ${embedding}::vector, ${metadata}::jsonb)
        `;
  } catch (error) {
    console.error("Failed to insert document:", error);
    throw error;
  }
};

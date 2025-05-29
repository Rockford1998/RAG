import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { generateEmbedding } from "../llmServices/generateEmbedding";
import { VectorService } from "../vectorServices/vectorService";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { generateAnswer } from "../llmServices/generateAnswer";

interface DocumentMetadata extends Record<string, any> {
  source: string;
  timestamp: string;
  chunkIndex?: number;
  totalChunks?: number;
}

type StoreEmbeddedDocumentType = {
  text: string;
  retryCount?: number;
  metadata: DocumentMetadata;
};

export const storeEmbeddedDocument = async ({
  text,
  metadata,
  retryCount = 3,
}: StoreEmbeddedDocumentType): Promise<void> => {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      if (!text.trim()) {
        console.warn("Skipping empty text document");
        return;
      }

      const embedding = await generateEmbedding(text);
      await VectorService.insertVector("document_embeddings", {
        embedding,
        content: text,
        metadata,
      });
      if (attempt > 1) {
        console.log(`Document stored successfully after ${attempt} attempts`);
      }
      return;
    } catch (error) {
      if (attempt === retryCount) {
        console.error(`Failed to store document after ${retryCount} attempts`, {
          error: error instanceof Error ? error.message : String(error),
          textLength: text.length,
          metadata,
        });
        throw new Error("Document storage failed");
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, attempt)),
      );
    }
  }
};

export const train = async (
  pdfPath: string,
  chunkSize = 200,
  chunkOverlap = 20,
) => {
  const startTime = Date.now();
  let successCount = 0;

  try {
    const loader = new PDFLoader(pdfPath, {
      splitPages: false,
    });

    const docs = await loader.load();

    if (docs.length === 0) {
      throw new Error("No documents were extracted from PDF");
    }

    // Combine all page contents if needed
    const rawText = docs.map((doc) => doc.pageContent).join("\n");

    if (!rawText || rawText.trim().length === 0) {
      throw new Error("Extracted PDF text is empty");
    }

    // Split the text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
    });

    const chunks = await textSplitter.splitText(rawText);

    // Process chunks in parallel batches with limited concurrency
    const batchSize = 5;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (chunk, index) => {
          try {
            await storeEmbeddedDocument({
              metadata: {
                source: pdfPath,
                timestamp: new Date().toISOString(),
                chunkIndex: i + index,
                totalChunks: chunks.length,
              },
              text: chunk,
            });
            // await storeEmbeddedDocument(chunk, {
            //   source: pdfPath,
            //   timestamp: new Date().toISOString(),
            //   chunkIndex: i + index,
            //   totalChunks: chunks.length,
            // });
            successCount++;

            // Progress reporting
            if (successCount % 10 === 0 || successCount === chunks.length) {
              console.log(
                `Processed ${successCount}/${
                  chunks.length
                } chunks (${Math.round(
                  (successCount / chunks.length) * 100,
                )}%)`,
              );
            }
          } catch (error) {
            console.error(
              `Failed to process chunk ${i + index}:`,
              error instanceof Error ? error.message : String(error),
            );
          }
        }),
      );
    }

    const duration = (Date.now() - startTime) / 1000;
    return {
      success: true,
      message: `Processed ${successCount}/${chunks.length} chunks successfully`,
      chunksTotal: chunks.length,
      chunksProcessed: successCount,
      duration: `${duration.toFixed(2)} seconds`,
    };
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.error("Training failed after", duration, "seconds:", error);

    return {
      success: false,
      message: error instanceof Error ? error.message : "Training failed",
      chunksProcessed: successCount,
      duration: `${duration.toFixed(2)} seconds`,
    };
  }
};

export const test = async (q: number) => {
  try {
    let question;
    if (q === 1) {
      question = "How much years of experience atul has?";
    } else if (q === 2) {
      question = "atuls EDUCATION?";
    } else {
      question = "Details about atul?";
    }
    const queryEmbedding = await generateEmbedding(question);

    // Get relevant chunks with threshold
    const relevantChunks = await VectorService.searchVectors(
      "document_embeddings",
      queryEmbedding,
    );
    if (relevantChunks.length === 0) {
      console.warn("No relevant chunks found above similarity threshold");
      return;
    }
    // Extract just the content for the answer generation
    const answer = await generateAnswer(question, relevantChunks);

    console.log("Answer:", answer);
  } catch (error) {
    console.error(
      "Test failed:",
      error instanceof Error ? error.message : String(error),
    );
  }
};

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { generateEmbedding } from "../llmServices/generateEmbedding";
import { VectorService } from "../vectorServices/vectorService";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { generateAnswer } from "../llmServices/generateAnswer";
import { promptImprovement } from "../llmServices/promptImprovement";
import { Request, Response } from "express";
import { generateFileHash } from "../util/generateFileHash";
import { readFile } from "../util/readFile";

interface DocumentMetadata extends Record<string, any> {
  source: string;
  timestamp: string;
  chunkIndex?: number;
  totalChunks?: number;
  fileName: string,
}

type StoreEmbeddedDocumentType = {
  text: string;
  retryCount?: number;
  metadata: DocumentMetadata;
};

//
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


// 
export const train = async (
  req: Request, res: Response
) => {
  let chunkSize = 400;
  let chunkOverlap = 20
  const startTime = Date.now();
  let successCount = 0;

  try {
    const file = req.file;
    if (!file) {
      res.status(400).send("No file uploaded");
      return;
    }
    const filePath = `uploads/${file.filename}`

    const fileHash = await generateFileHash({ filePath: filePath });
    if (await VectorService.CheckIfkBPresentByFileHash({ fileHash })) {
      console.log("Knowledge base already exists for this file, skipping processing.");
      res.status(200).json({
        success: true,
        message: "Knowledge base already exists for this file",
      });
      return;
    }

    // Load the file text based on its type
    const docs = await readFile({ fileName: file.filename, filePath })
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
              text: chunk,
              metadata: {
                source: filePath,
                timestamp: new Date().toISOString(),
                chunkIndex: i + index,
                totalChunks: chunks.length,
                fileName: file.originalname,
                fileHash: fileHash,
              },
            });
            successCount++;
            // Progress reporting
            if (successCount % 10 === 0 || successCount === chunks.length) {
              console.log(
                `Processed ${successCount}/${chunks.length
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
    res.status(200).json({
      success: true,
      message: `Processed ${successCount}/${chunks.length} chunks successfully`,
      chunksTotal: chunks.length,
      chunksProcessed: successCount,
      duration: `${duration.toFixed(2)} seconds`,
    });
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    console.error("Training failed after", duration, "seconds:", error);

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Training failed",
      chunksProcessed: successCount,
      duration: `${duration.toFixed(2)} seconds`,
    });
  }
};

//
export const test = async (q: number) => {
  try {
    let prompt;
    if (q === 1) {
      prompt = "features of Java programming language?";
    } else if (q === 2) {
      prompt = "four pillers of oops concepts?";
    } else {
      prompt = "full name of PCOE?";
    }
    console.log("Testing RAG with query:", prompt);
    const improvedPrompt = await promptImprovement(prompt);
    console.log("Improved Prompt:", improvedPrompt);
    const queryEmbedding = await generateEmbedding(improvedPrompt);

    // Get relevant chunks with threshold
    const relevantChunks = await VectorService.searchVectors(
      "document_embeddings",
      queryEmbedding,
    );
    console.log(relevantChunks.length, "relevant chunks found");
    console.log("Relevant Chunks:", relevantChunks);

    if (relevantChunks.length === 0) {
      console.warn("No relevant chunks found above similarity threshold");
      return;
    }
    // Extract just the content for the answer generation
    const answer = await generateAnswer(prompt, relevantChunks);

    console.log("Answer:", answer);
  } catch (error) {
    console.error(
      "Test failed:",
      error instanceof Error ? error.message : String(error),
    );
  }
};

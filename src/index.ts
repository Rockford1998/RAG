

import { embedWithOllama } from '../ollama';
import { insertDocument } from '../db';
import { getSimilarChunks } from '../search';
import { generateAnswer } from '../answer';
import { chunkText } from "../chunker";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { LlamaCppEmbeddings } from "@langchain/community/embeddings/llama_cpp";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

interface DocumentMetadata extends Record<string, any> {
    source: string;
    timestamp: string;
    chunkIndex?: number;
}



async function storeEmbeddedDocument(
    text: string,
    metadata: DocumentMetadata,
    retryCount = 3
): Promise<void> {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
            if (!text.trim()) {
                console.warn('Skipping empty text document');
                return;
            }

            const embedding = await embedWithOllama(text);
            await insertDocument(text, embedding, metadata);

            if (attempt > 1) {
                console.log(`Document stored successfully after ${attempt} attempts`);
            }
            return;
        } catch (error) {
            if (attempt === retryCount) {
                console.error(`Failed to store document after ${retryCount} attempts`, {
                    error: error instanceof Error ? error.message : String(error),
                    textLength: text.length,
                    metadata
                });
                throw new Error('Document storage failed');
            }

            // Exponential backoff
            await new Promise(resolve =>
                setTimeout(resolve, 1000 * Math.pow(2, attempt))
            );
        }
    }
}

const train = async (pdfPath: string, chunkSize = 100, chunkOverlap = 20) => {
    const startTime = Date.now();
    let successCount = 0;

    try {
        const loader = new PDFLoader(pdfPath, {
            splitPages: false,
        });

        const docs = await loader.load();

        if (docs.length === 0) {
            throw new Error('No documents were extracted from PDF');
        }

        // Combine all page contents if needed
        const rawText = docs.map(doc => doc.pageContent).join('\n');

        if (!rawText || rawText.trim().length === 0) {
            throw new Error('Extracted PDF text is empty');
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

            await Promise.all(batch.map(async (chunk, index) => {
                try {
                    await storeEmbeddedDocument(chunk, {
                        source: pdfPath,
                        timestamp: new Date().toISOString(),
                        chunkIndex: i + index,
                        totalChunks: chunks.length
                    });
                    successCount++;

                    // Progress reporting
                    if (successCount % 10 === 0 || successCount === chunks.length) {
                        console.log(`Processed ${successCount}/${chunks.length} chunks (${Math.round((successCount / chunks.length) * 100)}%)`);
                    }
                } catch (error) {
                    console.error(`Failed to process chunk ${i + index}:`,
                        error instanceof Error ? error.message : String(error));
                }
            }));
        }

        const duration = (Date.now() - startTime) / 1000;
        return {
            success: true,
            message: `Processed ${successCount}/${chunks.length} chunks successfully`,
            chunksTotal: chunks.length,
            chunksProcessed: successCount,
            duration: `${duration.toFixed(2)} seconds`
        };
    } catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        console.error('Training failed after', duration, 'seconds:', error);

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Training failed',
            chunksProcessed: successCount,
            duration: `${duration.toFixed(2)} seconds`
        };
    }
}


const test = async (q: number) => {
    try {
        let question
        if (q === 1) {
            question = 'How much years of experience atul has?'
        } else if (q === 2) {
            question = 'atuls EDUCATION?'
        } else {
            question = 'Details about atul?'
        }
        const similarityThreshold = 0.75;

        // Get relevant chunks with threshold
        const relevantChunks = await getSimilarChunks(question, 3, similarityThreshold);

        if (relevantChunks.length === 0) {
            console.warn('No relevant chunks found above similarity threshold');
            return;
        }
        // Extract just the content for the answer generation
        const answer = await generateAnswer(question, relevantChunks);

        console.log('Answer:', answer);
    } catch (error) {
        console.error('Test failed:', error instanceof Error ? error.message : String(error));
    }
}

import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/train', async (req: Request, res: Response) => {
    await train("Sample.pdf")
    res.send('Creating RAG!');
});
app.get('/test/:q', async (req: Request, res: Response) => {
    const q = parseInt(req.params.q, 10);
    await test(q)
    res.send('Testing RAG!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


import { embedWithOllama } from '../ollama';
import { insertDocument } from '../db';
import { getSimilarChunks } from '../search';
import { generateAnswer } from '../answer';
import { chunkText } from "../chunker";


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

const train = async (pdfPath: string, chunkSize = 5, chunkOverlap = 1) => {
    const startTime = Date.now();
    let successCount = 0;

    try {
        console.log(`Extracting text from ${pdfPath}...`);
        const rawText = "Shubhams age is 27 on 11-05-2025. Shubhams full name is Shubham bankar. He don’t have an girlfriend. He is currently in IT Job with saleri 33k. He is from india"
        if (!rawText.trim()) {
            throw new Error('Extracted PDF text is empty');
        }

        const chunks = chunkText(rawText);
        console.log('Chunking complete');
        console.log('Number of chunks:', chunks);
        if (chunks.length === 0) {
            throw new Error('No valid chunks generated');
        }

        console.log(`Processing ${chunks.length} chunks...`);

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
            question = 'What is age of shubham in 2020?'
        } else if (q === 2) {
            question = 'what is the Capital of india?'
        } else {
            question = 'What is the full name of shubham?'
        }

        const similarityThreshold = 0.7;

        // Get relevant chunks with threshold
        const relevantChunks = await getSimilarChunks(question, 3, similarityThreshold);

        if (relevantChunks.length === 0) {
            console.warn('No relevant chunks found above similarity threshold');
            return;
        }

        console.log('Relevant chunks:', relevantChunks);

        // Extract just the content for the answer generation
        const answer = await generateAnswer(question, relevantChunks);

        console.log('Answer:', answer);
    } catch (error) {
        console.error('Test failed:', error instanceof Error ? error.message : String(error));
    }
}

import express, { Request, Response } from 'express';
import { constants } from 'buffer';
import extractTextFromPDF from '../extractor';

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


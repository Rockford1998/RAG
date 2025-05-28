import axios from 'axios';

type relevantChunks = {
    id: number;
    content: string;
    metadata: Record<string, any>;
    distance: number;
}

export const generateAnswer = async (
    query: string,
    contextChunks: Array<relevantChunks>,
    model: string = 'llama3.2:latest'
): Promise<string> => {
    try {
        const context = contextChunks
            .map((c, i) => `[Context ${i + 1}]: ${c.content}`)
            .join('\n\n');
            
        console.log("contextChunks", contextChunks);

        const prompt = `Answer the question based on the following context:\n\n${context}\n\nQuestion: ${query}\n\nAnswer:`;
        const res = await axios.post('http://localhost:11434/api/generate', {
            model,
            prompt,
            stream: false,
        });

        if (!res.data?.response) {
            throw new Error('Invalid response format from Ollama');
        }

        return res.data.response.trim();
    } catch (error) {
        console.error('Answer generation failed:', {
            error: error instanceof Error ? error.message : String(error),
            query,
            contextLength: contextChunks.length
        });
        throw new Error('Failed to generate answer');
    }
};



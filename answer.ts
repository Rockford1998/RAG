import axios from 'axios';

export const generateAnswer = async (
    query: string,
    contextChunks: string[],
    model: string = 'gemma3:1b'
): Promise<string> => {
    try {
        console.log("query", query);
        const context = contextChunks
            .map((c, i) => `[Context ${i + 1}]: ${c}`)
            .join('\n\n');

        const prompt = `Answer the question based on the following context:\n\n${context}\n\nQuestion: ${query}\n\nAnswer:`;

        const res = await axios.post('http://localhost:11434/api/generate', {
            model,
            prompt,
            stream: false,
        }, {
            timeout: 30000 // 30-second timeout
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



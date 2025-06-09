import axios from "axios";
/**
 * Needs to improvement
 */
export const promptImprovement = async (
    rawQuery: string,
): Promise<string> => {  
        try {
        const prompt = `Improve this search query for better document retrieval: Original: ${rawQuery} Consider: Synonyms, technical terms, and question intent. Only return the improved query without any additional text.`;

        const res = await axios.post("http://localhost:11434/api/generate", {
            model: "llama3.2:latest",
            prompt,
            stream: false,
        });

        if (!res.data?.response) {
            throw new Error("Invalid response format from Ollama");
        }

        return res.data.response.trim();
    } catch (error) {
        console.error("Query improvement failed:", error); 
        throw new Error("Failed to generate improved query");
    }
};
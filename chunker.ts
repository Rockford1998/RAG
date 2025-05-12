export const chunkText = (text: string, chunkSize = 5): string[] => {
    const sentences = text.split(/(?<=[.?!])\s+/);
    const chunks: string[] = [];
    let chunk = '';
    for (const sentence of sentences) {
        if ((chunk + sentence).length > chunkSize) {
            chunks.push(chunk.trim());
            chunk = sentence;
        } else {
            chunk += ' ' + sentence;
        }
    }
    if (chunk) chunks.push(chunk.trim());
    return chunks;
};
// import fs from 'fs';
// type PDFTextExtractionOptions = {
//     preserveLineBreaks?: boolean;
//     includePageNumbers?: boolean;
// };

// export async function extractPDFText(
//     filePath: string,
//     options: PDFTextExtractionOptions = {}
// ): Promise<string> {
//     // Read the PDF file into a Uint8Array
//     const data = new Uint8Array(fs.readFileSync(filePath));

//     // Load the PDF document
//     const pdf = await getDocument({
//         data,
//         useWorkerFetch: false, // Disable worker in Node.js
//         isEvalSupported: false,
//         useSystemFonts: true // Better for Node.js
//     }).promise;

//     let fullText = '';

//     // Process each page
//     for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
//         const page = await pdf.getPage(pageNum);
//         const textContent = await page.getTextContent();

//         // Add page number if requested
//         if (options.includePageNumbers) {
//             fullText += `\n[Page ${pageNum}]\n`;
//         }

//         // Process the text items
//         fullText += processTextItems(textContent.items, options);

//         // Add separator if not last page
//         if (pageNum < pdf.numPages) {
//             fullText += options.preserveLineBreaks ? '\n\n' : ' ';
//         }
//     }
//     console.log('Full text extracted:', fullText);
//     return fullText.trim();
// }

// function processTextItems(items: any[], options: PDFTextExtractionOptions): string {
//     // Sort items by vertical position (top to bottom) and horizontal position (left to right)
//     const sortedItems = [...items].sort((a, b) => {
//         const aY = a.transform[5] || 0;
//         const bY = b.transform[5] || 0;
//         const aX = a.transform[4] || 0;
//         const bX = b.transform[4] || 0;
//         return bY - aY || aX - bX; // Sort Y descending, X ascending
//     });

//     let result = '';
//     let lastY = 0;

//     for (const item of sortedItems) {
//         const str = item.str;
//         const y = item.transform[5] || 0;

//         // Add newline if we've moved to a new line
//         if (options.preserveLineBreaks && Math.abs(y - lastY) > 5 && result) {
//             result += '\n';
//         }
//         // Add space if we're on the same line but there's a gap
//         else if (result && !result.endsWith(' ') && !result.endsWith('\n')) {
//             result += ' ';
//         }

//         result += str;
//         lastY = y;
//     }

//     return result;
// }

// // Example usage
// async function main() {
//     try {
//         const text = await extractPDFText('sample.pdf', {
//             preserveLineBreaks: true,
//             includePageNumbers: false
//         });
//         console.log(text);
//         return text;
//     } catch (error) {
//         console.error('Error extracting text:', error);
//         throw error;
//     }
// }

// // Uncomment to run directly
// // main();
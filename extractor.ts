import * as fs from 'fs';

async function extractTextFromPDF(pdfPath: string): Promise<string> {
  try {
    // Dynamically import pdfjs-dist
    const pdfjs = await import('pdfjs-dist');

    // Set worker path (important for some environments)
    pdfjs.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.min.js');

    // Read the PDF file
    const data: Uint8Array = new Uint8Array(fs.readFileSync(pdfPath));

    // Load the PDF document
    const loadingTask = pdfjs.getDocument(data);
    const pdfDocument = await loadingTask.promise;

    let fullText = '';

    // Extract text from each page
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();

      // Concatenate text items with space separation
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += pageText + ' ';
    }

    // Clean up extra spaces
    fullText = fullText.replace(/\s+/g, ' ').trim();

    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

export default extractTextFromPDF;


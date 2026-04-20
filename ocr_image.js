import { createWorker } from 'tesseract.js';
import path from 'path';

async function extractText() {
  const imagePath = 'C:\\Users\\Pichau\\.gemini\\antigravity\\brain\\c617ac97-16b9-44b0-8e63-f1c20a53cbc3\\media__1776641318534.png';
  console.log(`Starting OCR on ${imagePath}...`);
  
  const worker = await createWorker('eng+por');
  
  try {
    const { data: { text } } = await worker.recognize(imagePath);
    console.log('--- OCR Result ---');
    console.log(text);
    console.log('------------------');
  } catch (err) {
    console.error('Error during OCR:', err);
  } finally {
    await worker.terminate();
  }
}

extractText();

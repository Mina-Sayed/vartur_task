import sharp from 'sharp';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export async function processAndSaveImage(file: File, filename: string): Promise<string> {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image
    const processedBuffer = await sharp(buffer)
      .resize(3200, 3200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toBuffer();

    // Save image
    const relativePath = join('uploads', filename);
    const fullPath = join(process.cwd(), 'public', relativePath);
    await sharp(processedBuffer).toFile(fullPath);

    // Return relative path for database storage
    return relativePath.replace(/\\/g, '/');
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
} 

import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary'; // Cloudinary config
import { Readable } from 'stream';

// Helper function to convert ReadableStream to Buffer
async function streamToBuffer(readableStream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = readableStream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        chunks.push(value);
      }
    }
    return Buffer.concat(chunks);
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Convert file to buffer
    if (!file.stream) {
        return NextResponse.json({ error: 'File stream is not available.' }, { status: 400 });
    }
    const fileBuffer = await streamToBuffer(file.stream());

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'fitjourney_uploads' }, // Optional: organize in Cloudinary folder
        (error, result) => {
          if (error) {
            console.error('Cloudinary Stream Upload Error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      Readable.from(fileBuffer).pipe(uploadStream);
    });

    if (!result || !(result as any).secure_url) {
        console.error('Cloudinary upload result missing secure_url:', result);
        return NextResponse.json({ error: 'Upload to Cloudinary failed to return a URL.' }, { status: 500 });
    }

    return NextResponse.json({ secure_url: (result as any).secure_url });

  } catch (error: any) {
    console.error('API Upload Error:', error);
    // Check if the error object has a message property
    const errorMessage = error.message || 'Internal server error during image upload.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

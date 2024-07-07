import { Storage } from '@google-cloud/storage';
import path from 'path';
import 'dotenv/config';

const storage = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET as string);

export const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  const blob = bucket.file(Date.now() + path.extname(file.originalname));
  const blobStream = blob.createWriteStream({
    resumable: false,
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', reject);
    blobStream.on('finish', () => {
        resolve(blob.name);
    });
    blobStream.end(file.buffer);
  });
};

export const getSignedUrl = async (filePath: string): Promise<string> => {
    const options = {
      action: 'read' as 'read', // Ensure action is of type 'read'
      expires: Date.now() + 1000 * 60 * 60, // 1 hour
    };
  
    const [url] = await bucket.file(filePath).getSignedUrl(options);
    return url;
};


export const deleteImageFromGCBucket = async (filePath: string): Promise<void> => {
  await bucket.file(filePath).delete();
}
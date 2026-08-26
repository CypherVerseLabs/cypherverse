import {
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey =
  process.env.R2_SECRET_ACCESS_KEY;

const bucket = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

if (!endpoint) {
  throw new Error(
    "R2_ENDPOINT is not defined"
  );
}

if (!accessKeyId) {
  throw new Error(
    "R2_ACCESS_KEY_ID is not defined"
  );
}

if (!secretAccessKey) {
  throw new Error(
    "R2_SECRET_ACCESS_KEY is not defined"
  );
}

if (!bucket) {
  throw new Error(
    "R2_BUCKET_NAME is not defined"
  );
}

if (!publicUrl) {
  throw new Error(
    "R2_PUBLIC_URL is not defined"
  );
}

export const r2 = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const R2_BUCKET = bucket;

export const R2_PUBLIC_URL =
  publicUrl.replace(/\/+$/, "");

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType?: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType:
        contentType ||
        "application/octet-stream",
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(
  key: string
): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}
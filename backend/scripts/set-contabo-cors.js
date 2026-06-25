'use strict';

// One-time helper: apply a CORS policy to the Contabo bucket so the browser can
// upload directly via presigned PUT URLs. Without this, every direct upload
// fails with a CORS error in the browser (the presigned URL is fine — it's the
// bucket rejecting the cross-origin PUT).
//
// Run:  node scripts/set-contabo-cors.js
//
// AllowedOrigins comes from CORS_ALLOWED_ORIGINS (comma-separated) or falls back
// to "*". For production, set it to your real frontend origin(s).

const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
const env = require('../src/config/env');

const origins = (process.env.CORS_ALLOWED_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

async function main() {
  if (!env.contabo.bucket || !env.contabo.endpoint) {
    console.error('Missing CONTABO_* env (endpoint/bucket). Check backend/.env.');
    process.exit(1);
  }

  const s3 = new S3Client({
    endpoint: env.contabo.endpoint,
    region: env.contabo.region || 'auto',
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.contabo.accessKey,
      secretAccessKey: env.contabo.secretKey,
    },
  });

  await s3.send(
    new PutBucketCorsCommand({
      Bucket: env.contabo.bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedMethods: ['GET', 'PUT', 'HEAD'],
            AllowedOrigins: origins,
            AllowedHeaders: ['*'], // covers Content-Type + x-amz-acl on the PUT
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    })
  );

  console.log(`[cors] applied to bucket "${env.contabo.bucket}" for origins: ${origins.join(', ')}`);
}

main().catch((err) => {
  console.error('[cors] failed:', err.message);
  process.exit(1);
});

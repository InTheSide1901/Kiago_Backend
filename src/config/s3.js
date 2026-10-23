const { S3Client } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
    }
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = {
    s3Client,
    BUCKET_NAME,
    JWT_SECRET
};
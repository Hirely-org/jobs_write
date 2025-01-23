const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require('uuid');
const s3Client = require('./config/s3Config');

class S3Service {
    async uploadImage(file) {
        try {
            const fileExtension = file.originalname.split('.').pop();
            const imageKey = `${uuidv4()}.${fileExtension}`;

            await s3Client.send(new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET, // hirely-job-image-bucket
                Key: imageKey,
                Body: file.buffer,
                ContentType: file.mimetype,
            }));

            return imageKey;
        } catch (error) {
            console.error('Error uploading to S3:', error);
            throw new Error('Failed to upload image');
        }
    }

    async getSignedImageUrl(imageKey, type = 'processed') {
        if (!imageKey) return null;
        
        try {
            const bucket = type === 'processed' 
                ? process.env.AWS_S3_BUCKET_PROCESSED // hirely-job-image-bucket-processed
                : process.env.AWS_S3_BUCKET; // hirely-job-image-bucket

            const command = new GetObjectCommand({
                Bucket: bucket,
                Key: imageKey,
            });

            return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        } catch (error) {
            console.error('Error generating signed URL:', error);
            return null;
        }
    }
}

module.exports = new S3Service();
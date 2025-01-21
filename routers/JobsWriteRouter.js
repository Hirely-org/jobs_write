const router = require('express').Router();
const RabbitMQService = require('../rabbitMQService');
const db = require('../models');
const upload = require('../middleware/fileUpload');
const s3Service = require('../S3Service')

router.get('/', async (req, res) => {
    let jobs;
    try{
        jobs = await db.Job.findAll();

    } catch(error){
        console.error('Error getting jobs:', error);
        return res.status(500).send('Error getting jobs');
    }
    console.log('Jobs:', jobs);
    return res.json(jobs);
});

router.get('/test', async (req, res) => {
    console.log('Sending message to queue');
    RabbitMQService.sendToQueue("q_b", "Hello from service A!");
    return res.send('Hello World!');
});

router.post('/', upload.single('image'), async (req, res) => {
    const { name, description, status } = req.body;
    const userRole = req.headers['x-forwarded-role'];

    if (!["Admin", "Employer"].includes(userRole)) {
        return res.status(403).send('Forbidden');
    }

    try {
        // Handle image upload if present
        let imageKey = null;
        if (req.file) {
            imageKey = await s3Service.uploadImage(req.file);
        }
        console.log('Image key:', imageKey);
        // Create job in database
        const job = await db.Job.create({
            name,
            description,
            status,
            imageId: imageKey,
            createdAt: new Date()
        });

        // Get signed URLs for both original and processed images
        const originalImageUrl = await s3Service.getSignedImageUrl(imageKey, 'original');
        const processedImageUrl = await s3Service.getSignedImageUrl(imageKey, 'processed');
        
        const jobResponse = {
            ...job.toJSON(),
            originalImageUrl,
            processedImageUrl
        };

        console.log('Created job:', job.name);
        RabbitMQService.sendToQueue("q_a", Buffer.from(JSON.stringify(job)));
        
        return res.json(jobResponse);

    } catch (error) {
        console.error('Error creating job:', error);
        return res.status(500).send('Error creating job', error);
    }
});

module.exports = router;
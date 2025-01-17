const router = require('express').Router();
const RabbitMQService = require('../rabbitMQService');
const db = require('../models');

router.get('/', async (req, res) => {
    let jobs;
    try{
        jobs = await db.Job.findAll();

        const userRole = req.headers['x-Forwarded-Role'];
        const userIdentity = req.headers['x-Forwarded-User'];

        console.log("Headers: ", req.headers);

        if (userRole) res.setHeader('X-Forwarded-Role', userRole);
        if (userIdentity) res.setHeader('X-Forwarded-User', userIdentity);

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

router.post('/', async (req, res) => {
    const { name, description, status, imageId } = req.body;
    let job;
    try{
        job = await db.Job.create({
            name,
            description,
            status,
            imageId,
            createdAt: new Date()
        });
    } catch(error){
        console.error('Error creating job:', error);
        return res.status(500).send('Error creating job');
    }
    console.log('Created job:', job.name);
    RabbitMQService.sendToQueue("q_a", Buffer.from(JSON.stringify(job)));
    return res.json(job);
});

module.exports = router;
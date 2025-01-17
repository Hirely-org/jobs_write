const router = require('express').Router();
const RabbitMQService = require('../rabbitMQService');
const db = require('../models');

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

router.post('/', async (req, res) => {
    const { name, description, status, imageId } = req.body;

    const userRole = req.headers['x-Forwarded-Role'];

    if(userRole !== 'admin'){
        return res.status(403).send('Forbidden');
    }

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
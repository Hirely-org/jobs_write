// jobEventHandler.js
const db = require('../models');
const RabbitMQService = require('../rabbitMQService');

async function handleJobEvent(msg) {
    try {
        const jobData = JSON.parse(msg.content.toString());
        await db.Job.create({
            name: jobData.name,
            description: jobData.description,
            status: jobData.status,
            imageId: jobData.imageId,
            createdAt: new Date()
        }); // Insert into Service B's database
        // console.log('Job inserted into Service B database:', jobData);
    } catch (error) {
        console.error("Error handling job event:", error);
    }
}

async function startJobEventConsumer() {
    await RabbitMQService.connect();
    RabbitMQService.consumeQueue("q_a", handleJobEvent);
}

module.exports = startJobEventConsumer;

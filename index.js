const express = require('express');
const cors = require('cors');
const RabbitMQService = require('./rabbitMQService');
const db = require('./models');

const app = express();

const port = 5000;

const jobWriteRouter = require('./routers/JobsWriteRouter');

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-Role', 'X-Forwarded-User'],
    exposedHeaders: ['X-Forwarded-Role', 'X-Forwarded-User'],
    credentials: false
};
app.options('*', cors(corsOptions));

// Apply CORS to all routes
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/jobWrite", jobWriteRouter);


(async () => {
    try {
        await RabbitMQService.connect();
        RabbitMQService.consumeQueue("q_b", (msg) => {
            console.log('Service A Received from service B:', msg.content.toString());
        });

        await db.sequelize.sync();
        app.listen(port, () => {
            console.log(`Example app listening on port ${port}`);
        });
    } catch (error) {
        console.error("Error during setup:", error);
        process.exit(1);
    }
})();

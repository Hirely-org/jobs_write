const express = require('express');
const cors = require('cors');
const RabbitMQService = require('./rabbitMQService');
const db = require('./models');

const app = express();

const port = 5000;

const jobWriteRouter = require('./routers/JobsWriteRouter');

app.use(cors());
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

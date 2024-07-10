import 'reflect-metadata';
import express from 'express';
import bodyParser from 'body-parser';
import userRoutes from './routes/userRoutes';
import partnerRoutes from './routes/partnerRoutes';
import postRoutes from './routes/postRoutes';
import questionRoutes from './routes/questionRoutes';
import eventRoutes from './routes/eventRoutes';
import { AppDataSource } from './data-source';
import 'dotenv/config';
import cleanupOldPosts from './jobs/cleanUpPosts';
import addQuestions from './jobs/populateQuestions';


const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/user', userRoutes);
app.use('/partner', partnerRoutes);
app.use('/post', postRoutes);
app.use('/question', questionRoutes);
app.use('/calendar', eventRoutes);

// Connect to PostgreSQL and synchronize the database
AppDataSource.initialize().then(async () => {
    console.log('[STARTUP INFO]: Connected to PostgreSQL');

    // Populate questions
    addQuestions();
    // Start up clean posts job
    cleanupOldPosts();

    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`[STARTUP INFO]: Server is running on port ${PORT}`);
    });
}).catch(error => console.log(error));

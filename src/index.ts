import 'reflect-metadata';
import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from './routes/authRoutes';
import partnerRoutes from './routes/partnerRoutes';
import { AppDataSource } from './data-source';
import 'dotenv/config';

const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);
app.use('/partner', partnerRoutes);

// Connect to PostgreSQL and synchronize the database
AppDataSource.initialize().then(async () => {
    console.log('Connected to PostgreSQL');

    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(error => console.log(error));

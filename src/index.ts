import 'reflect-metadata';
import express from 'express';
import bodyParser from 'body-parser';
import userRoutes from './routes/userRoutes';
import { AppDataSource } from './data-source';
import 'dotenv/config';

const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/user', userRoutes);

// Connect to PostgreSQL and synchronize the database
AppDataSource.initialize().then(async () => {
    console.log('Connected to PostgreSQL');

    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch(error => console.log(error));

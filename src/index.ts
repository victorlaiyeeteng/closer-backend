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
import { wss } from './sockets/socketServer';
import http from 'http';
import jwt from 'jsonwebtoken';
import { User } from './entity/User';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/user', userRoutes);
app.use('/partner', partnerRoutes);
app.use('/post', postRoutes);
app.use('/question', questionRoutes);
app.use('/calendar', eventRoutes);

// WebSocket setup
server.on('upgrade', (request, socket, head) => {
    const token = request.headers['sec-websocket-protocol'] as string;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
            AppDataSource.getRepository(User).findOne({ where: { id: decoded.id } }).then(user => {
                if (user) {
                    wss.handleUpgrade(request, socket, head, (ws) => {
                        wss.emit('connection', ws, request);
                    });
                } else {
                    socket.destroy();
                }
            }).catch(() => {
                socket.destroy();
            });
        } catch {
            socket.destroy();
        }
    } else {
        socket.destroy();
    }
});

server.listen(8081, () => {
    console.log('[STARTUP INFO]: WebSocketServer is running on port 8081');
});


// Connect to PostgreSQL and synchronize the database
AppDataSource.initialize().then(async () => {
    console.log('[STARTUP INFO]: Connected to PostgreSQL');

    // Populate questions
    addQuestions();
    // Start up clean posts job
    // cleanupOldPosts();

    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`[STARTUP INFO]: Server is running on port ${PORT}`);
    });
}).catch(error => console.log(error));

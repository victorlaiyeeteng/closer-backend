import WebSocket, { WebSocketServer } from 'ws';
import { User } from '../entity/User'; 
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source';

// In-memory store for messages
const messageStore = new Map<number, { fromId: number, fromUsername: string, message: string }[]>();

const wss = new WebSocketServer({ noServer: true });

interface UserSocket extends WebSocket {
    userId?: number;
    username?: string;
    partnerId?: number;
    partnerUsername?: string;
}

const users = new Map<number, UserSocket>();

wss.on('connection', async (ws: UserSocket, request) => {
    console.log('New WebSocket connection established');

    const token = request.headers['sec-websocket-protocol'] as string;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number, username: string };

            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({ where: { id: decoded.id }, relations: ['partner'] });

            if (user) {
                ws.userId = user.id;
                ws.username = user.username;
                ws.partnerId = user.partner?.id;
                ws.partnerUsername = user.partner?.username;
                users.set(user.id, ws);
                console.log(`User ${ws.userId} connected with partner ID ${ws.partnerId}`);

                if (user.partner) {
                    ws.send(JSON.stringify({
                        type: 'partner',
                        userId: user.id,
                        username: user.username,
                        partnerId: user.partner.id,
                        partnerUsername: user.partner.username
                    }));

                    // Send stored messages if any
                    const storedMessages = messageStore.get(user.id);
                    if (storedMessages) {
                        storedMessages.forEach(message => {
                            ws.send(JSON.stringify({
                                type: 'message',
                                fromId: message.fromId,
                                fromUsername: message.fromUsername,
                                message: message.message
                            }));
                        });
                        // Clear stored messages after sending
                        messageStore.delete(user.partner.id);
                    }
                }
            } else {
                ws.close(4000, 'Invalid user');
            }
        } catch (error) {
            console.error('JWT verification failed:', error);
            ws.close(4000, 'Invalid token');
        }
    } else {
        ws.close(4000, 'Token missing');
    }

    ws.on('message', (message: string) => {
        const data = JSON.parse(message);

        if (data.type === 'message') {
            const partnerSocket = users.get(ws.partnerId!);

            if (partnerSocket) {
                // Send message to partner
                partnerSocket.send(JSON.stringify({
                    type: 'message',
                    fromId: ws.userId,
                    fromUsername: ws.username,
                    message: data.message
                }));
                // Send confirmation to sender
                ws.send(JSON.stringify({
                    type: 'message',
                    fromId: ws.userId,
                    fromUsername: ws.username,
                    message: data.message,
                    status: 'sent'
                }));
            } else {
                // Store message if partner is not connected
                if (!messageStore.has(ws.partnerId!)) {
                    messageStore.set(ws.partnerId!, []);
                }

                messageStore.get(ws.partnerId!)!.push({
                    fromId: ws.userId!,
                    fromUsername: ws.username!,
                    message: data.message
                });
                // Send confirmation to sender
                ws.send(JSON.stringify({
                    type: 'message',
                    fromId: ws.userId,
                    fromUsername: ws.username,
                    message: data.message,
                    status: 'sent'
                }));
            }
        }
    });

    ws.on('close', () => {
        if (ws.userId) {
            users.delete(ws.userId);
            console.log(`User ${ws.username} disconnected`);
        }
    });
});

export { wss };

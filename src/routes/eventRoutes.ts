import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { Event } from '../entity/Event';
import { User } from '../entity/User';
import { authenticate } from '../utils/auth';
import CustomRequest from '../types/request';
import { convertToTimeZone } from '../utils/timezone';

const router = Router();
const eventRepository = AppDataSource.getRepository(Event);
const userRepository = AppDataSource.getRepository(User);

// Create a new event
router.post('/create', authenticate, async (req: CustomRequest, res) => {
    const { name, description, datetime, color } = req.body;
    const authenticatedUser = req.user as User;

    try {
        const event = eventRepository.create({
            name,
            description,
            datetime,
            color,
            user: authenticatedUser,
        });

        const savedEvent = await eventRepository.save(event);
        res.status(201).json(savedEvent);
    } catch (error) {
        res.status(400).json({ message: 'Error creating calendar event.', error });
    }
});

// Get all events for the authenticated user and their partner
router.get('/view', authenticate, async (req: CustomRequest, res) => {
    const authenticatedUser = req.user as User;
    const authenticatedUserData = await userRepository.findOne({
        where: { id: authenticatedUser.id },
        relations: ['partner'],
    });
    if (!authenticatedUserData) return res.status(400).json({ message: 'User not found.' });
    if (!authenticatedUserData.partner) return res.status(400).json({ message: 'You do not have a partner to view events.' });

    try {
        const userEvents = await eventRepository.find({ where: { user: authenticatedUser }, relations: ['user'] });
        const partnerEvents = await eventRepository.find({ where: { user: authenticatedUserData.partner }, relations: ['user'] });
        const allEvents = [...userEvents, ...partnerEvents];

        const events = allEvents.map(event => {
            const userTimestamp = convertToTimeZone(event.datetime.toISOString(), authenticatedUserData.timezone);
            if (!authenticatedUserData.partner) return res.status(400).json({ message: 'You do not have a partner to view posts.' });
            const partnerTimestamp = convertToTimeZone(event.datetime.toISOString(), authenticatedUserData.partner.timezone);
            return {
                ...event,
                userTimestamp,
                partnerTimestamp,
            };
        })

        res.json(events);
    } catch (error) {
        res.status(400).json({ message: 'Error viewing calendar events.', error });
    }
});

// Update an event
router.put('/update/:id', authenticate, async (req: CustomRequest, res) => {
    const { id } = req.params;
    const { name, description, datetime, color } = req.body;
    const authenticatedUser = req.user as User;
    const authenticatedUserData = await userRepository.findOne({ where: { username: authenticatedUser.username }, relations: ['partner']});
    if (!authenticatedUserData) return res.status(400).json({ message: 'User not found.' });
    if (!authenticatedUserData.partner) return res.status(400).json({ message: 'You do not have a partner to view events.' });

    try {
        const event = await eventRepository.findOne({ where: [
            { id: Number(id), user: authenticatedUser },
            { id: Number(id), user: authenticatedUserData.partner }
        ]});
        if (!event) return res.status(404).json({ message: 'Event not found or you do not have permission to edit this event' });

        event.name = name || event.name;
        event.datetime = datetime || event.datetime;
        event.description = description || event.description;
        event.color = color || event.color;

        const updatedEvent = await eventRepository.save(event);
        res.json(updatedEvent);
    } catch (error) {
        res.status(400).json({ message: 'Error updating calendar event.', error });
    }
});

// Delete an event
router.delete('/remove/:id', authenticate, async (req: CustomRequest, res) => {
    const { id } = req.params;
    const authenticatedUser = req.user as User;
    const authenticatedUserData = await userRepository.findOne({ where: { username: authenticatedUser.username }, relations: ['partner']});
    if (!authenticatedUserData) return res.status(400).json({ message: 'User not found.' });
    if (!authenticatedUserData.partner) return res.status(400).json({ message: 'You do not have a partner to view events.' });

    try {
        const event = await eventRepository.findOne({ where: [
            { id: Number(id), user: authenticatedUser },
            { id: Number(id), user: authenticatedUserData.partner }
        ]});
        if (!event) return res.status(404).json({ message: 'Event not found or you do not have permission to edit this event' });

        await eventRepository.remove(event);
        res.status(200).json({ message: 'Event deleted successfully.' });
    } catch (error) {
        res.status(400).json({ message: 'Error deleting calendar event.', error });
    }
});

export default router;

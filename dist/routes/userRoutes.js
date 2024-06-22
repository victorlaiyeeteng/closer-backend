"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../data-source");
const User_1 = require("../entity/User");
const auth_1 = require("../utils/auth");
const PartnerRequest_1 = require("../entity/PartnerRequest");
const router = (0, express_1.Router)();
const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
const partnerRequestRepository = data_source_1.AppDataSource.getRepository(PartnerRequest_1.PartnerRequest);
// Create user account
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, displayName, password, bio, profilePicture } = req.body;
    const hashedPassword = yield (0, auth_1.hashPassword)(password);
    const user = userRepository.create({ username, displayName, password: hashedPassword, bio, profilePicture });
    try {
        const savedUser = yield userRepository.save(user);
        console.log("Successfully added user.");
        res.status(201).json(savedUser);
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        }
        else {
            res.status(400).json({ message: 'An unknown error occurred.' });
        }
        console.log("Error occurred while registering new user.");
    }
}));
// Login user and generate JWT token
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const user = yield userRepository.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isPasswordValid = yield (0, auth_1.verifyPassword)(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }
        const token = (0, auth_1.generateToken)(user);
        res.json({ token });
        console.log(`Successfully logged in as ${username}`);
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        }
        else {
            res.status(400).json({ message: 'An unknown error occurred.' });
        }
        console.log("Error occurred while logging in.");
    }
}));
// Find partner by username
router.get('/partner/:username', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.params;
    const authenticatedUser = req.user;
    if (username === authenticatedUser.username) {
        console.log("Error occurred while finding user.");
        return res.status(400).json({ message: "This is your own username." });
    }
    try {
        const user = yield userRepository.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: ' User not found ' });
        }
        console.log(`Successfully found user: ${username}.`);
        res.json(user);
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        }
        else {
            res.status(400).json({ message: 'An unknown error occurred.' });
        }
        console.log("Error occurred while finding user.");
    }
}));
// Send partner request
router.post('/partner/request/:username', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.params;
    const authenticatedUser = req.user;
    if (authenticatedUser.partner)
        res.status(400).json({ message: 'You already have a partner.' });
    try {
        const requestee = yield userRepository.findOne({ where: { username } });
        if (!requestee)
            return res.status(404).json({ message: ' User not found ' });
        if (requestee.partner)
            res.status(400).json({ message: 'User already has a partner.' });
        const existingRequest = yield partnerRequestRepository.findOne({
            where: { requester: authenticatedUser, requestee }
        });
        if (existingRequest)
            return res.status(400).json({ message: 'Request already sent.' });
        const partnerRequest = partnerRequestRepository.create({ requester: authenticatedUser, requestee });
        yield partnerRequestRepository.save(partnerRequest);
        console.log(`{authenticatedUser.username} successfully sent request to {requestee.username}`);
        res.status(201).json({ message: 'Request sent.' });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        }
        else {
            res.status(400).json({ message: 'An unknown error occurred' });
        }
    }
}));
// View partner requests
router.get('/partner/requests', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authenticatedUser = req.user;
    try {
        const requests = yield partnerRequestRepository.find({
            where: { requestee: authenticatedUser }
        });
        res.status(200).json(requests);
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        }
        else {
            res.status(400).json({ message: 'An unknown error occurred' });
        }
    }
}));
// Accept partner request
router.post('/partner/accept/:username', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.params;
    const authenticatedUser = req.user;
    try {
        const requester = yield userRepository.findOne({ where: { username } });
        if (!requester) {
            return res.status(404).json({ message: 'User not found' });
        }
        const partnerRequest = yield partnerRequestRepository.findOne({
            where: { requester, requestee: authenticatedUser }
        });
        if (!partnerRequest) {
            return res.status(404).json({ message: 'Partner request not found' });
        }
        // Set both users as partners
        authenticatedUser.partner = requester;
        requester.partner = authenticatedUser;
        yield userRepository.save(authenticatedUser);
        yield userRepository.save(requester);
        yield partnerRequestRepository.remove(partnerRequest);
        res.status(200).json({ message: 'Partner request accepted' });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ message: err.message });
        }
        else {
            res.status(400).json({ message: 'An unknown error occurred' });
        }
    }
}));
exports.default = router;
//# sourceMappingURL=userRoutes.js.map
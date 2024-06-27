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
// Find partner by username
router.get('/:username', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.post('/request/:username', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username } = req.params;
    const authenticatedUser = req.user;
    const authenticatedUserData = yield userRepository.findOne({ where: { username: authenticatedUser.username }, relations: ['partner'] });
    if (authenticatedUserData.partner)
        return res.status(400).json({ message: 'You already have a partner.' });
    if (username === authenticatedUser.username)
        return res.status(400).json({ message: "This is your own username." });
    try {
        const requestee = yield userRepository.findOne({ where: { username }, relations: ['partner'] });
        if (!requestee)
            return res.status(404).json({ message: ' User not found ' });
        if (requestee.partner)
            return res.status(400).json({ message: 'User already has a partner.' });
        const existingRequest = yield partnerRequestRepository.findOne({
            where: { requester: authenticatedUser, requestee }
        });
        if (existingRequest)
            return res.status(400).json({ message: 'Request already sent.' });
        const partnerRequest = partnerRequestRepository.create({ requester: authenticatedUser, requestee });
        yield partnerRequestRepository.save(partnerRequest);
        console.log(`${authenticatedUser.username} successfully sent request to ${requestee.username}`);
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
router.get('/requests/view', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
router.post('/accept/:id', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = parseInt(req.params.id, 10);
    const authenticatedUser = req.user;
    try {
        const requester = yield userRepository.findOne({ where: { id } });
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
//# sourceMappingURL=partnerRoutes.js.map
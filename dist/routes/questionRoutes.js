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
const Question_1 = require("../entity/Question");
const auth_1 = require("../utils/auth");
const User_1 = require("../entity/User");
const QuestionResponse_1 = require("../entity/QuestionResponse");
const typeorm_1 = require("typeorm");
const router = (0, express_1.Router)();
const questionRepository = data_source_1.AppDataSource.getRepository(Question_1.Question);
const questionResponseRepository = data_source_1.AppDataSource.getRepository(QuestionResponse_1.QuestionResponse);
const userRepository = data_source_1.AppDataSource.getRepository(User_1.User);
// Generate question
router.get('/generate', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authenticatedUser = req.user;
    try {
        const questionResponses = yield questionResponseRepository.find({ where: { user: authenticatedUser }, relations: ['question', 'user'] });
        const answeredQuestionIds = questionResponses.map(response => response.question.id);
        const questions = yield questionRepository.find({
            where: answeredQuestionIds.length > 0
                ? { id: (0, typeorm_1.Not)((0, typeorm_1.In)(answeredQuestionIds)) }
                : {},
        });
        if (questions.length === 0)
            return res.status(404).json({ message: 'No more questions available' });
        const randomIndex = Math.floor(Math.random() * questions.length);
        const randomQuestion = questions[randomIndex];
        res.status(201).json(randomQuestion);
    }
    catch (error) {
        res.status(400).json({ message: 'Error generating questions', error });
    }
}));
// Answer question
router.post('/answer/:questionId', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authenticatedUser = req.user;
    const { questionId } = req.params;
    const { answer } = req.body;
    if (!questionId)
        return res.status(400).json({ message: 'Question Id missing.' });
    if (!answer)
        return res.status(400).json({ message: 'Answer missing.' });
    try {
        const question = yield questionRepository.findOne({ where: { id: Number(questionId) } });
        if (!question)
            return res.status(404).json({ message: 'Question not found.' });
        const questionResponse = questionResponseRepository.create({
            user: authenticatedUser,
            question: question,
            response: answer
        });
        yield questionResponseRepository.save(questionResponse);
        res.status(201).json(questionResponse);
    }
    catch (error) {
        res.status(400).json({ message: 'Error saving question response.', error });
    }
}));
// Get responses
router.get('/response/:questionId', auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authenticatedUser = req.user;
    const { questionId } = req.params;
    if (!questionId)
        return res.status(400).json({ message: 'Question Id missing.' });
    const question = yield questionRepository.findOne({ where: { id: Number(questionId) } });
    if (!question)
        return res.status(404).json({ message: 'Question not found.' });
    try {
        const authenticatedUserData = yield userRepository.findOne({ where: { username: authenticatedUser.username }, relations: ['partner'] });
        if (!authenticatedUserData)
            return res.status(404).json({ message: ' User not found ' });
        const partner = authenticatedUserData.partner;
        if (!partner)
            return res.status(404).json({ message: ' Partner not found ' });
        const userResponse = yield questionResponseRepository.findOne({ where: { user: authenticatedUser, question } });
        const partnerResponse = yield questionResponseRepository.findOne({ where: { user: partner, question } });
        const responses = {
            "user": userResponse === null || userResponse === void 0 ? void 0 : userResponse.response,
            "partnerResponse": partnerResponse === null || partnerResponse === void 0 ? void 0 : partnerResponse.response
        };
        res.status(201).json(responses);
    }
    catch (error) {
        res.status(400).json({ message: 'Error fetching question responses.', error });
    }
}));
exports.default = router;
//# sourceMappingURL=questionRoutes.js.map
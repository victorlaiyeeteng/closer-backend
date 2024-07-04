import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Question } from "../entity/Question";
import { authenticate } from "../utils/auth";
import CustomRequest from "../types/request";
import { User } from "../entity/User";
import { QuestionResponse } from "../entity/QuestionResponse";
import { In, Not } from "typeorm";



const router = Router();
const questionRepository = AppDataSource.getRepository(Question);
const questionResponseRepository = AppDataSource.getRepository(QuestionResponse);
const userRepository = AppDataSource.getRepository(User);



// Generate question
router.get('/generate', authenticate, async (req: CustomRequest, res) => {
    const authenticatedUser = req.user as User;

    try {
        const questionResponses = await questionResponseRepository.find({ where: { user: authenticatedUser }, relations: ['question', 'user'] });
        const answeredQuestionIds = questionResponses.map(response => response.question.id);
        const questions = await questionRepository.find({
            where: answeredQuestionIds.length > 0 
                ? { id: Not(In(answeredQuestionIds))} 
                : {},
        });
        if (questions.length === 0) return res.status(404).json({ message: 'No more questions available' });

        const randomIndex = Math.floor(Math.random() * questions.length);
        const randomQuestion = questions[randomIndex];
        
        res.status(201).json(randomQuestion);
    } catch (error) {
        res.status(400).json({ message: 'Error generating questions', error });
    }
})

// Answer question
router.post('/answer/:questionId', authenticate, async (req: CustomRequest, res) => {
    const authenticatedUser = req.user as User;
    const { questionId } = req.params;
    const { answer } = req.body;

    if (!questionId) return res.status(400).json({ message: 'Question Id missing.' });
    if (!answer) return res.status(400).json({ message: 'Answer missing.' });

    try {

        const question = await questionRepository.findOne({where: {id: Number(questionId) } });
        if (!question) return res.status(404).json({ message: 'Question not found.' });

        const questionResponse = questionResponseRepository.create({
            user: authenticatedUser, 
            question: question, 
            response: answer
        })

        await questionResponseRepository.save(questionResponse);

        res.status(201).json(questionResponse);
    } catch (error) {
        res.status(400).json({ message: 'Error saving question response.', error });
    }

})

// Get responses
router.get('/response/:questionId', authenticate, async (req: CustomRequest, res) => {
    const authenticatedUser = req.user as User;
    const { questionId } = req.params;

    if (!questionId) return res.status(400).json({ message: 'Question Id missing.' });
    const question = await questionRepository.findOne({where: {id: Number(questionId) } });
    if (!question) return res.status(404).json({ message: 'Question not found.' });


    try {
        const authenticatedUserData = await userRepository.findOne({ where: {username: authenticatedUser.username}, relations: ['partner']});
        if (!authenticatedUserData) return res.status(404).json({ message: ' User not found '});
        const partner = authenticatedUserData.partner;
        if (!partner) return res.status(404).json({ message: ' Partner not found '});

        const userResponse = await questionResponseRepository.findOne({ where: {user: authenticatedUser, question }});
        const partnerResponse = await questionResponseRepository.findOne({ where: {user: partner, question }});

        const responses = {
            "user": userResponse?.response, 
            "partnerResponse": partnerResponse?.response
        }

        res.status(201).json(responses);
    } catch (error) {
        res.status(400).json({ message: 'Error fetching question responses.', error });
    }
})


export default router;
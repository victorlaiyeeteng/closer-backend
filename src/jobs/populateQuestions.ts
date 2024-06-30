import { AppDataSource } from "../data-source";
import { Question } from "../entity/Question";


const questionRepository = AppDataSource.getRepository(Question);

const questions = [
    "what is your favourite NBA team?", 
    "who is your favourite NBA player?"
]


const addQuestions = async () => {
    try {
        var count = 0;
        for (const question of questions) {
            const existingQuestion = await questionRepository.findOne({ where: {question: question } });
            if (! existingQuestion) {
                const newQuestion = questionRepository.create({question: question});
                await questionRepository.save(newQuestion);
                count += 1;
            }
        }
        console.log(`Populated ${count} questions.`);
    } catch (err) {
        console.error('Error populating questions:', err);
    }
}

export default addQuestions;
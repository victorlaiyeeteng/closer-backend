import { AppDataSource } from "../data-source";
import { Question } from "../entity/Question";
import fs from 'fs';
import path from 'path';


const questionRepository = AppDataSource.getRepository(Question);
const filePath = path.resolve(__dirname, '../questions.txt');
const fileContents = fs.readFileSync(filePath, 'utf-8');
const questions = fileContents.split('\n').filter(Boolean);


const addQuestions = async () => {
    try {
        var count = 0;
        for (const question of questions) {
            const existingQuestion = await questionRepository.findOne({ where: {question: question } });
            if (!existingQuestion) {
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
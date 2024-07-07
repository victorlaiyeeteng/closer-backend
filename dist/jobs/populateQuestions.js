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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../data-source");
const Question_1 = require("../entity/Question");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const questionRepository = data_source_1.AppDataSource.getRepository(Question_1.Question);
const filePath = path_1.default.resolve(__dirname, '../questions.txt');
const fileContents = fs_1.default.readFileSync(filePath, 'utf-8');
const questions = fileContents.split('\n').filter(Boolean);
const addQuestions = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        var count = 0;
        for (const question of questions) {
            const existingQuestion = yield questionRepository.findOne({ where: { question: question } });
            if (!existingQuestion) {
                const newQuestion = questionRepository.create({ question: question });
                yield questionRepository.save(newQuestion);
                count += 1;
            }
        }
        console.log(`Populated ${count} questions.`);
    }
    catch (err) {
        console.error('Error populating questions:', err);
    }
});
exports.default = addQuestions;
//# sourceMappingURL=populateQuestions.js.map
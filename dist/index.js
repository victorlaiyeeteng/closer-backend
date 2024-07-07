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
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const partnerRoutes_1 = __importDefault(require("./routes/partnerRoutes"));
const postRoutes_1 = __importDefault(require("./routes/postRoutes"));
const questionRoutes_1 = __importDefault(require("./routes/questionRoutes"));
const data_source_1 = require("./data-source");
require("dotenv/config");
const cleanUpPosts_1 = __importDefault(require("./jobs/cleanUpPosts"));
const populateQuestions_1 = __importDefault(require("./jobs/populateQuestions"));
const app = (0, express_1.default)();
// Middleware
app.use(body_parser_1.default.json());
// Routes
app.use('/auth', authRoutes_1.default);
app.use('/partner', partnerRoutes_1.default);
app.use('/post', postRoutes_1.default);
app.use('/question', questionRoutes_1.default);
// Connect to PostgreSQL and synchronize the database
data_source_1.AppDataSource.initialize().then(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Connected to PostgreSQL');
    // Populate questions
    (0, populateQuestions_1.default)();
    // Start up clean posts job
    (0, cleanUpPosts_1.default)();
    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})).catch(error => console.log(error));
//# sourceMappingURL=index.js.map
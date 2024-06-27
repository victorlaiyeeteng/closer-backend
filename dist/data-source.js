"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./entity/User");
const Post_1 = require("./entity/Post");
require("dotenv/config");
const PartnerRequest_1 = require("./entity/PartnerRequest");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: false,
    entities: [User_1.User, Post_1.Post, PartnerRequest_1.PartnerRequest],
    migrations: [],
    subscribers: [],
});
//# sourceMappingURL=data-source.js.map
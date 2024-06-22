import { Request } from "express";
import { User } from "../entity/User";

interface CustomRequest extends Request {
    user?: User;
}

export default CustomRequest;
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthRequest extends Request {
    userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, nest: NextFunction) {
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({error: "Unauthorized"});
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {userId: string};
        req.userId = decoded.userId;
        nest();
    }
    catch(err){
        return res.status(401).json({error: 'Invalid or expired token'})
    }
}
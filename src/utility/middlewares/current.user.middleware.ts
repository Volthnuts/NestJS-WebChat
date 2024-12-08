import { Injectable , NestMiddleware } from "@nestjs/common";
import { isArray } from "class-validator";
import { verify } from "jsonwebtoken";
import { Request , Response , NextFunction } from "express";
import { UserService } from "src/user/user.service";
import { UserEntity } from "src/user/entities/user.entity";

declare global{
    namespace Express{
        interface Request{
            currentUser?:UserEntity; //เพิ่มตัวแปร optional currentUser ใน model
        }
    }
} 

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
    constructor(
        private readonly userService:UserService
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const authHeader = req.headers.authorization || req.headers.Authorization || req.headers.token || req.headers.Token;
        if(!authHeader || isArray(authHeader) || !authHeader.startsWith('Bearer ')){
            req.currentUser = null;
            next();
            return;
        }else{
            try{
                const token = authHeader.split(' ')[1];
                const { id } =<JwtPayload>verify(token,process.env.SECRET_KEY);
                const currentUser = await this.userService.findOne(Number(id)); 
                req.currentUser = currentUser; //จากตรงนี้ req.currentUser จะเก็บค่าของ currentUser ไว้ ซึ่งค่านี้จะเก็บข้อมูลของ user ที่ login มา โดยข้อมูลนี้มาจากการนำ id มาหาใน database ผ่าน findOne ใน userService
                //โดยตรงนี้จะนำไปใช้ใน decorator ในอนาคต
                next();
            }catch(err){
                req.currentUser = null;
                next();
            }
        }
    }
}

interface JwtPayload{ //ถอดเอาอะไรออกมาจาก jwt
    id:string;
}


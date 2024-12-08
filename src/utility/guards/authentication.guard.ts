import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class AuthenticationGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest(); //เก็บ object ทั้งหมดที่ถูกยิงเข้ามา
        //currentUser มาจาก middleware => current.user.middleware.ts
        //โดยตัว middleware นี้จะถูกประกาศใน app.module ซึ่งทุก api จะเรียกใช้หมดเลย
        //ตัว AuthenticationGuard สามารถนำไปใช้คั่นตรงส่วนที่สำคัญหรือต้องการป้องกันได้
        if(request.currentUser){ //เช็คว่ามี currentUser เข้ามามั้ย ถ้าไม่ null เป็น true
            return true;
        }else{ //null เป็น fault หรือทำอะไรสักอย่าง
            //return false
            throw new UnauthorizedException('Unauthorized access');
        }
    }
}
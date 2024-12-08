import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { connectDb } from 'config/connect';
import { CurrentUserMiddleware } from './utility/middlewares/current.user.middleware';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [TypeOrmModule.forRoot(connectDb),UserModule, ChatModule, NotificationModule,],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) { //configure เป็น method ของ Module ที่เกี่ยวกับ middleware
    consumer.apply(CurrentUserMiddleware) //เรียก middlewares มาใช้
            .forRoutes({  path: '*', method: RequestMethod.ALL });
            //เป็นตัวบอกว่าทุก api เรียกใช้หมดเลย
  };
}

// consumer.apply(CurrentUserMiddleware)
//         .forRoutes(
//             { path: 'users', method: RequestMethod.GET }, 
//             { path: 'posts', method: RequestMethod.POST }
// );
// กรณีอยากเรียกบาง api
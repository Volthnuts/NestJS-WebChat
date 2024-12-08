import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MainNotifyEntity } from './entities/mainNotify.entity'; 
import { PrivateNotifyEntity } from './entities/privateChatNotify.entity';
import { UserEntity } from 'src/user/entities/user.entity';
import { NotificationService } from './notification.service';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity, MainNotifyEntity, PrivateNotifyEntity])],
    controllers: [],
    providers: [NotificationService],
    exports: [] 
})

export class NotificationModule {}

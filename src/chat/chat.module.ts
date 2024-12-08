import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendsEntity } from './entities/groupChat.entity';
import { PrivateChatEntity } from './entities/privateChat.entity';
import { MainNotifyEntity } from 'src/notification/entities/mainNotify.entity';
import { PrivateNotifyEntity } from 'src/notification/entities/privateChatNotify.entity';
import { NotificationService } from 'src/notification/notification.service';
import { UserEntity } from 'src/user/entities/user.entity'
@Module({
  imports: [TypeOrmModule.forFeature([FriendsEntity, PrivateChatEntity, UserEntity, MainNotifyEntity, PrivateNotifyEntity])],
  controllers: [ChatController],
  providers: [ChatService, NotificationService],
})

export class ChatModule {}

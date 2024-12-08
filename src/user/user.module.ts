import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity'; 
import { FriendsEntity } from './entities/friend.entity';
import { PrivateChatEntity } from 'src/chat/entities/privateChat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, FriendsEntity, PrivateChatEntity])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}

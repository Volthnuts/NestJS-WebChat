import { Injectable, NotFoundException, UploadedFile, BadRequestException } from '@nestjs/common';
import { FriendsEntity } from '../user/entities/friend.entity'
import { UserEntity } from '../user/entities/user.entity'
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrivateChatEntity } from './entities/privateChat.entity';
import { PrivateChatDto } from './dto/privateChat.dto';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(FriendsEntity) 
            private readonly friendRepository: Repository<FriendsEntity>,
        @InjectRepository(PrivateChatEntity) 
            private readonly privateChatRepository: Repository<PrivateChatEntity>,
        @InjectRepository(UserEntity)
            private readonly usersRepository: Repository<UserEntity>,
    ) {}

    async findUser(id : number) : Promise<UserEntity> {
        const user = this.usersRepository.findOneBy({ id });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async friendCheck(myprofile : UserEntity, friend : UserEntity) : Promise<FriendsEntity> {
        const friended = await this.friendRepository.findOne({
            where: [
                {senderID: myprofile.id, receiverID: friend.id, status: 'friend'},
                {senderID: friend.id, receiverID: myprofile.id, status: 'friend'}
            ]
        });
        if(!friended) throw new BadRequestException('You are not friend with this user');
        return friended;
    }
    
    async createChat(myProfile : UserEntity, privateChatDto : PrivateChatDto) : Promise<any> {
        const chatData = {
            ...privateChatDto,
            senderID: myProfile.id,
            receiverID: privateChatDto.receiverID,
        };
        const chat = this.privateChatRepository.create(chatData);
        return await this.privateChatRepository.save(chat);
    }

    async viewChat(myProfile : UserEntity, friend : UserEntity) : Promise<any> {
        const myMessage = await this.privateChatRepository.find({
            where: [
                { senderID: myProfile.id, receiverID: friend.id },
                { senderID: friend.id, receiverID: myProfile.id },
            ],
            order: {
                createdAt: 'DESC'
            },
        });

        const formattedMessage = await Promise.all(
            myMessage.map(async (data) => {
                return {
                    message: data.message ?? data.image,
                    type: data.image ? 'image' : 'text',
                    sender: data.senderID === myProfile.id ? 'me' : 'friend', // if true then sender: 'me', if false then sender: 'friend'
                    seen: data.seen,
                    createdAt: data.createdAt,
                };
            })
        );
        await this.privateChatRepository.update(
            { receiverID: myProfile.id },
            { seen: true }
        );

        return formattedMessage;
    }
}

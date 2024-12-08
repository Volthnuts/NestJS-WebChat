import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MainNotifyEntity, NotifyType } from './entities/mainNotify.entity';
import { PrivateNotifyEntity } from './entities/privateChatNotify.entity';
import { UserEntity } from 'src/user/entities/user.entity';

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(MainNotifyEntity) private readonly mainNotifyRepository: Repository<MainNotifyEntity>,
        @InjectRepository(PrivateNotifyEntity) private readonly privateNotifyRepository: Repository<PrivateNotifyEntity>,
    ) {}

    async createPrivateNotify(myProfile : UserEntity, friend : UserEntity, message : string, img : string) : Promise<any> {
        let content : string;
        if(message == null) {
            content = 'ส่งรูปภาพ'
        }else {
            content = message;
        }
        const privateNotifyData = {
            senderID: myProfile.id,
            receiverID: friend.id,
            message: content,
        }
        const privateNotify = await this.privateNotifyRepository.save(privateNotifyData);

        const mainNotifyData = {
            notifyID : privateNotify.id,
            type : NotifyType.PRIVATE,
        }

        return await this.mainNotifyRepository.save(mainNotifyData);
    }

    async viewNotify(myProfile : UserEntity)
}
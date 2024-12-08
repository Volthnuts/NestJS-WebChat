import { Controller, Get, Post, Body, Patch, Param, Delete, 
            BadRequestException, HttpStatus, HttpException, 
            NotFoundException, UnauthorizedException, 
            UploadedFile, UploadedFiles, Res, UseGuards, 
            UseInterceptors,
            Put} from '@nestjs/common';
import { ChatService } from './chat.service'
import { NotificationService } from 'src/notification/notification.service';
import { PrivateChatEntity } from './entities/privateChat.entity'
import { PrivateChatDto } from './dto/privateChat.dto';
import { AuthenticationGuard } from 'src/utility/guards/authentication.guard';
import { CurrentUser } from 'src/utility/decorators/current.user.decorator';
import { FriendsEntity } from '../user/entities/friend.entity';
import { UserEntity } from '../user/entities/user.entity';
import { FriendDto } from '../user/dto/friend.dto'
import { FileInterceptor } from '@nestjs/platform-express'; // single img
import { FilesInterceptor } from '@nestjs/platform-express'; // multiple img
import { diskStorage } from 'multer';

@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly notificationService: NotificationService
    ) {}

    @UseGuards(AuthenticationGuard)
    // ฟังก์ชันสร้างข้อความ
    @Post('createChat')
    // multiple image
    @UseInterceptors(FilesInterceptor('file', 10,{
        storage: diskStorage({
        destination: './uploaded/chatFile',
            filename: (req, file, cb) => {
                // const extension = file.originalname.split('.')[1];
                const storedName = `${Date.now()}-${file.originalname}`;
                cb(null, storedName);
                //cb(err,filename)
            }
        }),
        fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
            return cb(null, false);
            }
            cb(null, true);
        }
    }))
    async createChat(
        @CurrentUser() myProfile:UserEntity,
        @UploadedFiles() files: Express.Multer.File[], 
        @Body() privateChatDto: PrivateChatDto) : Promise<{ status: string; message: string }> {
        try {

            const checkUser = await this.chatService.findUser(privateChatDto.receiverID);
            const checkFriend = await this.chatService.friendCheck(myProfile, checkUser);

            if((!privateChatDto.message || privateChatDto.message.trim() == '') && (!files || files.length == 0)) {
                return { 
                    status: 'failed', 
                    message: 'Can not send blank message.' 
                };
            }

            if(privateChatDto.message) {
                await this.chatService.createChat(myProfile, {
                    ...privateChatDto,
                    image: null
                });
                await this.notificationService.createPrivateNotify(myProfile, checkUser, privateChatDto.message, null);
            }

            if (files && files.length > 0) {
                await Promise.all(
                    files.map(async (file) => {
                        await this.chatService.createChat(myProfile, {
                            ...privateChatDto,
                            message: null,
                            image: file.filename,
                        });
                        await this.notificationService.createPrivateNotify(myProfile, checkUser, null, file.filename);
                    })
                );
            }
            return { 
                status: 'ok', 
                message: 'Send message success' 
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw new HttpException({
                    status: 'failed',
                    message: error.message
                },HttpStatus.BAD_REQUEST);
            }

            if (error instanceof NotFoundException) {
                throw new HttpException({
                    status: 'failed',
                    message: error.message
                },HttpStatus.NOT_FOUND);
            }

            throw new HttpException({
            status: 'failed',
            message: error.message
            },HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @UseGuards(AuthenticationGuard)
    // ฟังก์ชันดูข้อความ
    @Get('viewChat/:id')
    async viewChat(@CurrentUser() myProfile : UserEntity, @Param('id') friend : number){
        try{
            const checkUser = await this.chatService.findUser(friend);
            const checkFriend = await this.chatService.friendCheck(myProfile, checkUser);

            return {
                status : 'ok',
                message : await this.chatService.viewChat(myProfile, checkUser)
            }

        } catch (error) {
            if (error instanceof BadRequestException) {
                throw new HttpException({
                    status: 'failed',
                    message: error.message
                },HttpStatus.BAD_REQUEST);
            }

            if (error instanceof NotFoundException) {
                throw new HttpException({
                    status: 'failed',
                    message: error.message
                },HttpStatus.NOT_FOUND);
            }

            throw new HttpException({
            status: 'failed',
            message: error.message
            },HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
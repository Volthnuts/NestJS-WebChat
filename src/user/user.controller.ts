import { Controller, Get, Post, Body, Patch, Param, Delete, 
          BadRequestException, HttpStatus, HttpException, 
          NotFoundException, UnauthorizedException, 
          UploadedFile, Res, UseGuards, 
          UseInterceptors,
          Put} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserUpdateDto } from './dto/user-update.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { UserEntity } from './entities/user.entity';
import { Express,Response } from 'express';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'src/utility/decorators/current.user.decorator';
import { AuthenticationGuard } from 'src/utility/guards/authentication.guard';
import { FriendDto } from './dto/friend.dto';
import { FriendsEntity } from './entities/friend.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  
  @Post('register')
  // ฟังก์ชันสมัคร
  @UseInterceptors(FileInterceptor('profileImage', {
    storage: diskStorage({
      destination: './uploaded/profileImage',
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
  async register(@UploadedFile() file: Express.Multer.File, @Body() userRegisterDto: UserRegisterDto):Promise<{ status: string; message: string }> {
    if(file){
      userRegisterDto.profileImage = file.filename;
    }
      try {
        await this.userService.register(userRegisterDto);
        return { 
          status: 'ok', 
          message: 'Registration successful' 
        };
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw new HttpException({
            status: 'failed',
            message: error.message
          },HttpStatus.BAD_REQUEST);
        }
        throw new HttpException({
          status: 'failed',
          message: error.message
        },HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }

  @Post('login')
  // ฟังก์ชันเข้าสู่ระบบ
  async login(@Body() userLoginDto: UserLoginDto, @Res() res: Response) {
    try {
      const user = await this.userService.login(userLoginDto);
      const token = await this.userService.generateToken(user);
      return res.status(HttpStatus.OK).json({
        status: 'ok',
        message: 'Login successful',
        token: token,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          status: 'failed',
          message: error.message,
        });
      }
  
      if (error instanceof UnauthorizedException) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          status: 'failed',
          message: error.message,
        });
      }
  
      return res.status(HttpStatus.BAD_REQUEST).json({
        status: 'failed',
        message: error.message,
      });
    }
  }

  @UseGuards(AuthenticationGuard)
  @Get('viewMyProfile')
  // ฟังก์ชันดูโปรไฟล์ตัวเอง
  viewProfile(@CurrentUser() myProfile:UserEntity) {
    const { password, id, ...formattedProfile } = myProfile;
    return formattedProfile;
  }

  @UseGuards(AuthenticationGuard)
  @Get('viewAllFriend')
  // ฟังก์ชันดูรายชื่อเพื่อนทั้งหมด
  async viewAllFriend(@CurrentUser() myProfile:UserEntity) {
    return this.userService.viewAllFriend(myProfile)
  }

  @UseGuards(AuthenticationGuard)
  @Put('update/:id')
  // ฟังก์ชันอัพเดตโปรไฟล์ตัวเอง
  @UseInterceptors(FileInterceptor('profileImage', {
    storage: diskStorage({
      destination: './uploaded/profileImage',
      filename: (req, file, cb) => {
        // const extension = file.originalname.split('.')[1];
        const storedName = `${Date.now()}-${file.originalname}`;
        cb(null, storedName);
        //cb(err,filename)
      }
    }),
      fileFilter: async (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
          return cb(null, false);
        }
        cb(null, true);
      }
  }))
  async update(@UploadedFile() file: Express.Multer.File, @Param('id') id: number, @Body() userUpdateDto: UserUpdateDto) {
      userUpdateDto.profileImage = `${file.filename}`;
      try {
        await this.userService.update(id, userUpdateDto, file.filename);
        return { 
          status: 'ok', 
          message: 'Update successful' 
        };
      } catch (error) {
        throw new HttpException({
          status: 'failed',
          message: error.message
        },HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }

  @UseGuards(AuthenticationGuard)
  @Get('viewAllUser')
  // ฟังก์ชันดูผู้ใช้ทั้งหมด
  async viewAllUser(@CurrentUser() myProfile: UserEntity):Promise<UserEntity[]> {
    return this.userService.viewAllUser(myProfile)
  }

  @UseGuards(AuthenticationGuard)
  @Post('sendOrCancel')
  // ฟังก์ชันส่ง/ยกเลิกคำขอเป็นเพื่อน
  async sendOrCancelFriendRequest(@CurrentUser() myProfile: UserEntity, @Body() friendDto: FriendDto){
    return this.userService.sendOrCancelFriendRequest(myProfile, friendDto);
  }

  @UseGuards(AuthenticationGuard)
  @Post('acceptOrReject')
  // ฟังก์ชันยอมรับ/ปฏิเสธคำขอ
  async acceptOrRejectFriendRequest(@CurrentUser() myProfile: UserEntity, @Body() friendDto: FriendDto){
    return this.userService.acceptOrRejectFriendRequest(myProfile, friendDto);
  }

  @UseGuards(AuthenticationGuard)
  @Post('deleteFriend')
  // ฟังก์ชันลบเพื่อน
  async deleteFriend(@CurrentUser() myProfile: UserEntity, @Body() friendDto: FriendDto){
    return this.userService.deleteFriend(myProfile, friendDto);
  }

  @UseGuards(AuthenticationGuard)
  @Get('viewAllRequest')
  // ฟังก์ชันดูคนขอเป็นเพื่อนทั้งหมด
  async viewAllRequest(@CurrentUser() myProfile: UserEntity){
    return this.userService.viewAllRequest(myProfile);
  }

  @UseGuards(AuthenticationGuard)
  @Post('searchUsers')
  // ฟังก์ชันดูผลลัพธ์จากการค้นหา
  async searchUsers(@CurrentUser() myProfile: UserEntity, @Body('searchInput') searchInput: string){
    return this.userService.searchUsers(myProfile, searchInput);
  }
}
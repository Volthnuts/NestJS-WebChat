import { Injectable, BadRequestException, NotFoundException, UnauthorizedException, InternalServerErrorException , ForbiddenException} from '@nestjs/common';
import { UserRegisterDto } from './dto/user-register.dto';
import { UserUpdateDto } from './dto/user-update.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository, Timestamp } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { hash, compare } from 'bcrypt';
import { unlink } from 'fs/promises';
import { FriendDto } from './dto/friend.dto';
import { FriendsEntity } from './entities/friend.entity';
import { PrivateChatEntity } from 'src/chat/entities/privateChat.entity';

@Injectable()
export class UserService {

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(FriendsEntity)
    private readonly friendsRepository: Repository<FriendsEntity>,
    @InjectRepository(PrivateChatEntity)
    private readonly privateChatRepository: Repository<PrivateChatEntity>,
  ) {}

  async register(userRegisterDto: UserRegisterDto): Promise<UserEntity> {

    const userExists = await this.findUserByEmail(userRegisterDto.email);
    if (userExists) throw new BadRequestException('Email already exists');

    userRegisterDto.password = await hash(userRegisterDto.password,10);
    const user = this.usersRepository.create(userRegisterDto);
    return await this.usersRepository.save(user);
  }

  async findUserByEmail(email: string): Promise<UserEntity> {
    return this.usersRepository.findOneBy({ email });
  }

  async login(userLoginDto: UserLoginDto){

    const userExists = await this.usersRepository.createQueryBuilder('users')
                        .addSelect('users.password')
                        .where('users.email = :email', {email:userLoginDto.email})
                        .getOne();

    if (!userExists) throw new NotFoundException('User not found');
    
    const matchPassword = await compare(userLoginDto.password,userExists.password);
    if(!matchPassword) throw new UnauthorizedException('Password not match');
    return userExists;
  }

  async generateToken(user: UserEntity): Promise<string> {
    const payload = { id: user.id };
    return 'Bearer '+sign(payload, process.env.SECRET_KEY, { expiresIn: process.env.EXPIRE_TIME });
  }

  async findOne(id: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: number, userUpdateDto: Partial<UserUpdateDto>, filename: String): Promise<UserEntity> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    if (user.profileImage !== null) {
      try {
        await unlink(`./uploaded/profileImage/${user.profileImage}`);
      } catch (error) {
        await unlink(`./uploaded/profileImage/${filename}`);
        throw new BadRequestException('Failed to delete old profileImage');
      }
    }
    if (userUpdateDto.password) {
      userUpdateDto.password = await hash(userUpdateDto.password, 10);
    }
    Object.assign(user, userUpdateDto);
    return await this.usersRepository.save(user);
  }

  async viewAllUser(myProfile: UserEntity,): Promise<any> {
    const users = await this.usersRepository.find();
    const formattedUsers = await Promise.all(users.map(async (user) => {
      const relation = await this.getFriendRelation(myProfile.id, user.id); //fetch ข้อมูลจากตาราง friend
      const { password, createdAt, updatedAt, ...filteredUser } = user;
      return {
        ...filteredUser,
        status: this.determineStatus(user.id, myProfile.id, relation), //เอาข้อมูลจากตาราง friend ที่เก็บใน relation เอาไปหาว่าลงเงื่อนไขไหน แล้วเอา status ออกมา
      };
    }));    
    return formattedUsers;
  }

  async viewAllFriend(myProfile: UserEntity) : Promise<any> {
    const users = await this.usersRepository.find();
    const formattedUsers = await Promise.all(users.map(async (user) => {
      if(user.id === myProfile.id) {
        return null;
      }
      const relation = await this.getFriendRelation(myProfile.id, user.id);
      if(relation && relation.status === 'friend') { //เช็คว่า relation.status หรือ status ในตาราง friendEntity หากไม่ null และเป็น friend
        const unseenMessage = await this.privateChatRepository.count({
          where:{
            receiverID: myProfile.id,
            seen: false,
          }
        })
        const { password, createdAt, updatedAt, ...friendsUser } = user;
        return {
          ...friendsUser,
          unseenMessage: unseenMessage, // Include unseen message count
      };
      }else{
        return null;
      }
    }));
    const allFriends = formattedUsers.filter(user => user !== null ); //กรองเอา null ออก
    if(allFriends.length === 0 || allFriends === null) { //ถ้า allFriends ที่กรองแล้ว ไม่มีข้อมูลหรือเป็น null ['' or null]
      return {
        status: "You do not have any friends."
      };
    }
    return allFriends;
  }

  async getFriendRelation(userID: number, friendID: number): Promise<FriendsEntity | null> { //ฟังก์ชัน fetch ตาราง friendsEntity(model ของ friend)
    //Promise<FriendsEntity | null> หมายถึงจะแสดงหรือส่งผลลัพธ์ที่ได้ เป็นข้อมูลใน ตาราง Friend หรือค่า null
    const relation = await this.friendsRepository.findOne({
      where: [
        { senderID: userID, receiverID: friendID },
        { senderID: friendID, receiverID: userID },
      ],
    });
    return relation;
  }

  determineStatus(userID: number, myProfileID: number, relation: FriendsEntity | null): string { //หลังจากเรียกใช้ getFriendRelation เมื่อดึงข้อมูลจากตาราง friend จะนำ friend.status มาเช็คว่าเป็นอะไร แล้ว return ค่า status ที่อยากให้โชว์
    if (myProfileID === userID) {
      return 'me';
    }
    if (!relation) {
      return 'canSendRequest';
    }
    if (relation.status === 'pending' && relation.senderID === userID) {
      return 'alreadySendRequest';
    }
    if (relation.status === 'pending' && relation.receiverID === userID) {
      return 'receiveRequest';
    }
    if (relation.status === 'friend') {
      return 'friended';
    }
    return 'canSendRequest';
  }

  async sendOrCancelFriendRequest(myProfile: UserEntity, friendDto: FriendDto) {
    try {
      const receiverExists = await this.usersRepository.findOne({ 
        where: {
          id:friendDto.receiverID 
        }
      })

      if(!receiverExists) {
        return new NotFoundException('Receiver not found');
      }
      
      const currentUser = myProfile.id;
      const friend = friendDto.senderID ?? friendDto.receiverID
      const alreadyFriend = await this.friendsRepository.findOne({
        where: [
          { senderID: currentUser, receiverID: friend, status:'friend' },
          { senderID: friend, receiverID: currentUser, status:'friend' },
        ]
      });

      if(alreadyFriend) {
        return new BadRequestException('Already being friend');
      }

      friendDto.status = 'pending'; 
      const requestExist = await this.friendsRepository.findOne({
        where: [
          { senderID: currentUser, receiverID: friendDto.receiverID },
        ]
      });
      if (friendDto.method === 'sendRequest') {
        if(!requestExist) {
          const sendRequest = await this.friendsRepository.create({
            senderID: currentUser,
            receiverID: friendDto.receiverID,
            status: friendDto.status,
          })
          return await this.friendsRepository.save(sendRequest);
        }
        return new BadRequestException('You already send a request or already be friend.');
      }

      if (friendDto.method === 'cancelRequest') {
        if(requestExist) {
          const cancelRequest = await this.friendsRepository.find({
            where: [
              { senderID: currentUser, receiverID: friendDto.receiverID }
            ]
          })
          return await this.friendsRepository.remove(cancelRequest);
        }
        return new NotFoundException('Request not found');
      } 
        
      return new ForbiddenException('Your acrion is invalid');
      
    } catch (error) {
      return new BadRequestException('Error processing request');
    }
  }

  async acceptOrRejectFriendRequest(myProfile: UserEntity, friendDto: FriendDto) {
    try {
      friendDto.receiverID = myProfile.id; 
      const requestExist = await this.friendsRepository.findOne({
        where: [
          { senderID: friendDto.senderID,receiverID: friendDto.receiverID, status:'pending' },
        ]
      });

      if (friendDto.method === 'accept') {
          if(requestExist) {
            requestExist.status = 'friend'
            return await this.friendsRepository.save(requestExist);
          }
          return new NotFoundException('Friend or request not found');
      }
      
      if (friendDto.method === 'reject') {
          if(requestExist) {
            return await this.friendsRepository.remove(requestExist);
          }
          return new NotFoundException('Friend or request not found');
      }

      return new ForbiddenException('Your acrion is invalid');
    
    } catch (error) {
      return new BadRequestException('Error processing request');
    }
  }

  async deleteFriend(myProfile: UserEntity, friendDto: FriendDto) {
    try {
      const currentUser = myProfile.id;
      const friend = friendDto.senderID ?? friendDto.receiverID
      const friendExist = await this.friendsRepository.findOne({
        where: [
          { senderID: currentUser, receiverID: friend, status:'friend' },
          { senderID: friend, receiverID: currentUser, status:'friend' },
        ]
      });
      if(friendExist) {
        return await this.friendsRepository.remove(friendExist);
      }
      return new NotFoundException('Friend not found');
    } catch (error) {
      return new BadRequestException('Error processing request');
    }
  }

  async viewAllRequest(myProfile: UserEntity) : Promise<any[]> {
    try {
      const allRequest = await this.friendsRepository.createQueryBuilder('requests')
                          .leftJoin('users', 'user', 'requests.senderID = user.id')
                          //leftJoin('db name to connect', 'called as' , 'condition')?
                          .select([
                            'requests.senderID AS senderID',
                            'user.username AS senderName',
                            'user.profileImage AS profileImage',
                            'user.email AS email'
                          ])
                          .where('requests.receiverID = :receiverID', { receiverID: myProfile.id })
                          .andWhere('requests.status = :status', { status: 'pending' })
                          .getRawMany();

      if(allRequest && allRequest.length !== 0) {
        return allRequest;
      }
      throw new NotFoundException('Friend not found');
    } catch (error) {
      throw new BadRequestException('Error processing request');
    }
  }

  async searchUsers(myProfile: UserEntity, searchInput: string): Promise<any[]> {
    if (searchInput && searchInput.trim() !== '') {
      const users = await this.usersRepository.createQueryBuilder('user')
                                              .where('user.username LIKE :searchInput OR user.email LIKE :searchInput', { searchInput: `%${searchInput.trim() }%` })
                                              .getMany();

      const formattedUsers = await Promise.all(users.map(async (user) => {
        const relation = await this.getFriendRelation(myProfile.id, user.id); // fetch friend relation
        const { password, createdAt, updatedAt, ...filteredUser } = user;

        return {
          ...filteredUser,
          status: this.determineStatus(user.id, myProfile.id, relation), // Determine friend status
        };
      }));
    return formattedUsers;

    } else {
      return this.viewAllUser(myProfile);
    }
  }

}
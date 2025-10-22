import { Injectable, Logger } from '@nestjs/common';
import { RegisterDto } from '../auth/dto/register.dto';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: RegisterDto) {
    this.logger.log(`Creating new user with email: ${createUserDto.email}`);
    try {
      const user = this.userRepository.create(createUserDto);
      const savedUser = await this.userRepository.save(user);
      this.logger.log(`User created successfully with ID: ${savedUser.id}`);
      return savedUser;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByEmail(email: string) {
    try {
      const user = await this.userRepository.findOneBy({ email });
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to find user by email: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const user = await this.userRepository.findOneBy({ id });
      return user;
    } catch (error) {
      this.logger.error(
        `Failed to find user by ID: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

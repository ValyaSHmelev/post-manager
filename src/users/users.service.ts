import { Injectable, ConflictException } from '@nestjs/common';
import { RegisterDto } from '../auth/dto/register.dto';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async create(createUserDto: RegisterDto) {
        const user = this.userRepository.create(createUserDto);
        return this.userRepository.save(user);
    }

    async findByEmail(email: string) {
        return this.userRepository.findOneBy({ email });
    }

    async findById(id: string) {
        return this.userRepository.findOneBy({ id });
    }
}

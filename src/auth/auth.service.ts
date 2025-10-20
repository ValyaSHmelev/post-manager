import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenPayload } from './types/access-token-payload';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService) { }

    async validateUser(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new BadRequestException('User not found');
        }
        const isMatch: boolean = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            throw new BadRequestException('Password does not match');
        }
        return user;
    }

    async login(user: User) {
        const payload: AccessTokenPayload = { email: user.email, userId: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async register(user: RegisterDto) {
        const existingUser = await this.usersService.findByEmail(user.email);
        if (existingUser) {
            throw new BadRequestException('email already exists');
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);
        const newUser = await this.usersService.create({ ...user, password: hashedPassword });

        return this.login(newUser);
    }
}

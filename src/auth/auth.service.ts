import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenPayload } from './types/access-token-payload';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    this.logger.log(`Attempting to validate user: ${email}`);
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`User not found: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch: boolean = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      this.logger.warn(`Invalid password attempt for user: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.log(`User validated successfully: ${email}`);
    return user;
  }

  login(user: User) {
    this.logger.log(`User logged in: ${user.email}`);
    const payload: AccessTokenPayload = { email: user.email, userId: user.id };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };
  }

  async register(user: RegisterDto) {
    this.logger.log(`Attempting to register user: ${user.email}`);
    const existingUser = await this.usersService.findByEmail(user.email);
    if (existingUser) {
      this.logger.warn(
        `Registration failed - email already exists: ${user.email}`,
      );
      throw new BadRequestException('email already exists');
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = await this.usersService.create({
      ...user,
      password: hashedPassword,
    });
    this.logger.log(`User registered successfully: ${user.email}`);

    return this.login(newUser);
  }
}

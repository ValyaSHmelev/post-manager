import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword123',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  const mockUserRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'hashedPassword123',
    };

    it('should create a new user successfully', async () => {
      const newUser: User = {
        ...mockUser,
        email: createUserDto.email,
        password: createUserDto.password,
      };

      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockResolvedValue(newUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(newUser);
      expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(userRepository.save).toHaveBeenCalledWith(newUser);
    });

    it('should throw an error when save fails', async () => {
      const error = new Error('Database error');
      const newUser: User = {
        ...mockUser,
        email: createUserDto.email,
        password: createUserDto.password,
      };

      userRepository.create.mockReturnValue(newUser);
      userRepository.save.mockRejectedValue(error);

      await expect(service.create(createUserDto)).rejects.toThrow('Database error');
      expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(userRepository.save).toHaveBeenCalledWith(newUser);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      const email = 'test@example.com';

      userRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findByEmail(email);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ email });
    });

    it('should return null when user is not found', async () => {
      const email = 'nonexistent@example.com';

      userRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ email });
    });

    it('should throw an error when database query fails', async () => {
      const email = 'test@example.com';
      const error = new Error('Database connection error');

      userRepository.findOneBy.mockRejectedValue(error);

      await expect(service.findByEmail(email)).rejects.toThrow('Database connection error');
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ email });
    });
  });

  describe('findById', () => {
    it('should find user by id successfully', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';

      userRepository.findOneBy.mockResolvedValue(mockUser);

      const result = await service.findById(id);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id });
    });

    it('should return null when user is not found', async () => {
      const id = 'nonexistent-id';

      userRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findById(id);

      expect(result).toBeNull();
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id });
    });

    it('should throw an error when database query fails', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const error = new Error('Database connection error');

      userRepository.findOneBy.mockRejectedValue(error);

      await expect(service.findById(id)).rejects.toThrow('Database connection error');
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ id });
    });
  });
});

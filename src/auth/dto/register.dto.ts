import { IsEmail, IsStrongPassword } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные символы',
    example: 'Password123!',
    minLength: 8,
  })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password should contain at least 8 characters, including uppercase and lowercase letters, numbers, and special characters',
    },
  )
  password: string;
}

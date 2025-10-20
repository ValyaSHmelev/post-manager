import { IsEmail, IsStrongPassword } from "class-validator";

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }, {
        message: 'Password should contain at least 8 characters, including uppercase and lowercase letters, numbers, and special characters'
    })
    password: string;
}

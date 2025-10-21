import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateArticleDto {
    @IsNotEmpty()
    @IsString()
    @MaxLength(128)
    title: string;
    
    @IsNotEmpty()
    @IsString()
    @MaxLength(1024)
    description: string;
}

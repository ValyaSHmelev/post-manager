import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty({
    description: 'Заголовок статьи',
    example: 'Моя первая статья',
    maxLength: 128,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  title: string;

  @ApiProperty({
    description: 'Описание статьи',
    example: 'Это подробное описание моей первой статьи о программировании',
    maxLength: 1024,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1024)
  description: string;
}

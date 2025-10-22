import {
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ArticleFilterDto {
  @ApiPropertyOptional({
    description: 'Фильтр по ID автора',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiPropertyOptional({
    description: 'Дата публикации от (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  publishDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Дата публикации до (ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  publishDateTo?: string;

  @ApiPropertyOptional({
    description: 'Номер страницы',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Количество элементов на странице',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

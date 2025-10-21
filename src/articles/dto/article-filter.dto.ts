import { IsOptional, IsUUID, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class ArticleFilterDto {
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsOptional()
  @IsDateString()
  publishDateFrom?: string;

  @IsOptional()
  @IsDateString()
  publishDateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

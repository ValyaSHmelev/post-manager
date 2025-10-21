import { ApiProperty } from '@nestjs/swagger';
import { ArticleResponseDto } from './article-response.dto';

export class PaginatedArticlesResponseDto {
  @ApiProperty({
    description: 'Массив статей',
    type: [ArticleResponseDto],
    example: [
      {
        id: '56139fdc-4533-45b9-84f0-fc4ea7474a45',
        title: 'Test title',
        description: 'Test description',
        authorId: '3e2fc8a4-9171-4402-82e7-7e075f915505',
        createdAt: '2025-10-21T01:54:33.529Z',
        updatedAt: '2025-10-21T01:54:33.529Z',
      },
      {
        id: 'f40844ee-6d15-45e0-9861-b33fa1411de7',
        title: 'Other title',
        description: 'Test description',
        authorId: '3e2fc8a4-9171-4402-82e7-7e075f915505',
        createdAt: '2025-10-20T22:12:06.792Z',
        updatedAt: '2025-10-20T22:29:15.659Z',
      },
    ],
  })
  data: ArticleResponseDto[];

  @ApiProperty({
    description: 'Общее количество статей',
    example: 17,
  })
  total: number;

  @ApiProperty({
    description: 'Текущая страница',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Количество элементов на странице',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Общее количество страниц',
    example: 2,
  })
  totalPages: number;
}

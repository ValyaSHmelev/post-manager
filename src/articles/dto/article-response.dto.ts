import { ApiProperty } from '@nestjs/swagger';

export class ArticleResponseDto {
  @ApiProperty({
    description: 'UUID статьи',
    example: '56139fdc-4533-45b9-84f0-fc4ea7474a45',
  })
  id: string;

  @ApiProperty({
    description: 'Заголовок статьи',
    example: 'Test title',
  })
  title: string;

  @ApiProperty({
    description: 'Описание статьи',
    example: 'Test description',
  })
  description: string;

  @ApiProperty({
    description: 'UUID автора статьи',
    example: '3e2fc8a4-9171-4402-82e7-7e075f915505',
  })
  authorId: string;

  @ApiProperty({
    description: 'Дата создания статьи',
    example: '2025-10-21T01:54:33.529Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата последнего обновления статьи',
    example: '2025-10-21T01:54:33.529Z',
  })
  updatedAt: Date;
}

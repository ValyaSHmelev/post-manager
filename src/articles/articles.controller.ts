import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleFilterDto } from './dto/article-filter.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import { PaginatedArticlesResponseDto } from './dto/paginated-articles-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';

@ApiTags('Статьи')
@Controller('articles')
@UseInterceptors(CacheInterceptor)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать новую статью' })
  @ApiResponse({
    status: 201,
    description: 'Статья успешно создана',
    type: ArticleResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Пользователь не авторизован',
  })
  create(
    @CurrentUser('userId') userId: string,
    @Body() createArticleDto: CreateArticleDto,
  ) {
    return this.articlesService.create(userId, createArticleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список всех статей' })
  @ApiResponse({
    status: 200,
    description: 'Список статей успешно получен с пагинацией',
    type: PaginatedArticlesResponseDto,
  })
  findAll(@Query() filterDto: ArticleFilterDto) {
    return this.articlesService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить статью по ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID статьи',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Статья успешно получена',
    type: ArticleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Статья не найдена',
  })
  findOne(@Param('id') articleId: string) {
    return this.articlesService.findOne(articleId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить статью' })
  @ApiParam({
    name: 'id',
    description: 'UUID статьи',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Статья успешно обновлена (вернется обновленная статья)',
    type: ArticleResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Пользователь не авторизован',
  })
  @ApiForbiddenResponse({
    description: 'Нет прав для редактирования этой статьи',
  })
  @ApiNotFoundResponse({
    description: 'Статья не найдена',
  })
  update(
    @Param('id') articleId: string,
    @CurrentUser('userId') userId: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(articleId, userId, updateArticleDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить статью' })
  @ApiParam({
    name: 'id',
    description: 'UUID статьи',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Статья успешно удалена (вернется удаленная статья)',
    type: ArticleResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Пользователь не авторизован',
  })
  @ApiForbiddenResponse({
    description: 'Нет прав для удаления этой статьи',
  })
  @ApiNotFoundResponse({
    description: 'Статья не найдена',
  })
  remove(
    @Param('id') articleId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.articlesService.remove(articleId, userId);
  }
}

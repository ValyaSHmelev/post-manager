import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleFilterDto } from './dto/article-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('userId') userId: string, @Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(userId, createArticleDto);
  }

  @Get()
  findAll(@Query() filterDto: ArticleFilterDto) {
    return this.articlesService.findAll(filterDto);
  }

  @Get(':id')
  findOne(@Param('id') articleId: string) {
    return this.articlesService.findOne(articleId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') articleId: string, @CurrentUser('userId') userId: string, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articlesService.update(articleId, userId, updateArticleDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') articleId: string, @CurrentUser('userId') userId: string) {
    return this.articlesService.remove(articleId, userId);
  }
}

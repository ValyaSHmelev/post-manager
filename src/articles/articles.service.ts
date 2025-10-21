import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from '../entities/article.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { PaginatedResult } from './interfaces/paginated-result';
import { ArticleFilterDto } from './dto/article-filter.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) { }

  async create(userId: string, createArticleDto: CreateArticleDto) {
    const article = this.articleRepository.create(createArticleDto);
    article.authorId = userId;
    await this.articleRepository.save(article);
    await this.clearArticleCache();
    return article;
  }

  async findAll(filterDto: ArticleFilterDto): Promise<PaginatedResult<Article>> {
    const { page = 1, limit = 10, authorId, publishDateFrom, publishDateTo } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (authorId) {
      where.authorId = authorId;
    }

    if (publishDateFrom && publishDateTo) {
      where.createdAt = Between(new Date(publishDateFrom), new Date(publishDateTo));
    } else if (publishDateFrom) {
      where.createdAt = MoreThanOrEqual(new Date(publishDateFrom));
    } else if (publishDateTo) {
      where.createdAt = LessThanOrEqual(new Date(publishDateTo));
    }

    const [data, total] = await this.articleRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    return article;
  }

  async update(id: string, userId: string, updateArticleDto: UpdateArticleDto) {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    this.validateArticleOwner(article, userId);
    Object.assign(article, updateArticleDto);
    await this.articleRepository.save(article);
    await this.clearArticleCache();
    return article;
  }

  async remove(id: string, userId: string) {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    this.validateArticleOwner(article, userId);
    await this.articleRepository.delete(id);
    await this.clearArticleCache();
    return article;
  }

  private validateArticleOwner(article: Article, userId: string) {
    if (article.authorId !== userId) {
      throw new ForbiddenException('Only the author can modify the article');
    }
  }

  private async clearArticleCache() {
    await this.cacheManager.clear();
  }
}

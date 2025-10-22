import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
  Logger,
} from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Article } from '../entities/article.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  FindOperator,
} from 'typeorm';
import { PaginatedResult } from './interfaces/paginated-result';
import { ArticleFilterDto } from './dto/article-filter.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async create(userId: string, createArticleDto: CreateArticleDto) {
    this.logger.log(
      `Creating article "${createArticleDto.title}" for user: ${userId}`,
    );
    try {
      const article = this.articleRepository.create(createArticleDto);
      article.authorId = userId;
      await this.articleRepository.save(article);
      await this.clearArticleCache();
      this.logger.log(`Article created successfully with ID: ${article.id}`);
      return article;
    } catch (error) {
      this.logger.error(
        `Failed to create article: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findAll(
    filterDto: ArticleFilterDto,
  ): Promise<PaginatedResult<Article>> {
    const {
      page = 1,
      limit = 10,
      authorId,
      publishDateFrom,
      publishDateTo,
    } = filterDto;
    const skip = (page - 1) * limit;

    const where: { authorId?: string; createdAt?: FindOperator<Date> } = {};

    if (authorId) {
      where.authorId = authorId;
    }

    if (publishDateFrom && publishDateTo) {
      where.createdAt = Between(
        new Date(publishDateFrom),
        new Date(publishDateTo),
      );
    } else if (publishDateFrom) {
      where.createdAt = MoreThanOrEqual(new Date(publishDateFrom));
    } else if (publishDateTo) {
      where.createdAt = LessThanOrEqual(new Date(publishDateTo));
    }

    try {
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
    } catch (error) {
      this.logger.error(
        `Failed to fetch articles: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const article = await this.articleRepository.findOne({ where: { id } });
      if (!article) {
        throw new NotFoundException('Article not found');
      }
      return article;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch article: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async update(id: string, userId: string, updateArticleDto: UpdateArticleDto) {
    this.logger.log(`Updating article ${id} by user ${userId}`);
    try {
      const article = await this.articleRepository.findOne({ where: { id } });
      if (!article) {
        this.logger.warn(`Article not found for update with ID: ${id}`);
        throw new NotFoundException('Article not found');
      }
      this.validateArticleOwner(article, userId);
      Object.assign(article, updateArticleDto);
      await this.articleRepository.save(article);
      await this.clearArticleCache();
      this.logger.log(`Article ${id} updated successfully`);
      return article;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update article: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    this.logger.log(`Deleting article ${id} by user ${userId}`);
    try {
      const article = await this.articleRepository.findOne({ where: { id } });
      if (!article) {
        this.logger.warn(`Article not found for deletion with ID: ${id}`);
        throw new NotFoundException('Article not found');
      }
      this.validateArticleOwner(article, userId);
      await this.articleRepository.delete(id);
      await this.clearArticleCache();
      this.logger.log(`Article ${id} deleted successfully`);
      return article;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to delete article: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private validateArticleOwner(article: Article, userId: string) {
    if (article.authorId !== userId) {
      this.logger.warn(
        `User ${userId} attempted to modify article ${article.id} owned by ${article.authorId}`,
      );
      throw new ForbiddenException('Only the author can modify the article');
    }
  }

  private async clearArticleCache() {
    try {
      await this.cacheManager.clear();
      this.logger.debug('Article cache cleared successfully');
    } catch (error) {
      this.logger.error(
        `Failed to clear article cache: ${error.message}`,
        error.stack,
      );
      // Не пробрасываем ошибку, чтобы не прерывать основную операцию
    }
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Article } from '../entities/article.entity';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleFilterDto } from './dto/article-filter.dto';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let repository: Repository<Article>;
  let cacheManager: any;

  const mockArticle: Article = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Article',
    description: 'Test Description',
    authorId: 'user-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Article;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    delete: jest.fn(),
  };

  const mockCacheManager = {
    clear: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: getRepositoryToken(Article),
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    repository = module.get<Repository<Article>>(getRepositoryToken(Article));
    cacheManager = module.get(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an article successfully', async () => {
      const userId = 'user-123';
      const createDto: CreateArticleDto = {
        title: 'New Article',
        description: 'New Description',
      };

      const createdArticle = { ...mockArticle, ...createDto, authorId: userId };

      mockRepository.create.mockReturnValue(createdArticle);
      mockRepository.save.mockResolvedValue(createdArticle);
      mockCacheManager.clear.mockResolvedValue(undefined);

      const result = await service.create(userId, createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(createdArticle);
      expect(mockCacheManager.clear).toHaveBeenCalled();
      expect(result).toEqual(createdArticle);
      expect(result.authorId).toBe(userId);
    });

    it('should throw error if save fails', async () => {
      const userId = 'user-123';
      const createDto: CreateArticleDto = {
        title: 'New Article',
        description: 'New Description',
      };

      mockRepository.create.mockReturnValue(mockArticle);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(userId, createDto)).rejects.toThrow('Database error');
    });

    it('should not fail if cache clear fails', async () => {
      const userId = 'user-123';
      const createDto: CreateArticleDto = {
        title: 'New Article',
        description: 'New Description',
      };

      const createdArticle = { ...mockArticle, ...createDto, authorId: userId };

      mockRepository.create.mockReturnValue(createdArticle);
      mockRepository.save.mockResolvedValue(createdArticle);
      mockCacheManager.clear.mockRejectedValue(new Error('Cache error'));

      const result = await service.create(userId, createDto);

      expect(result).toEqual(createdArticle);
    });
  });

  describe('findAll', () => {
    it('should return paginated articles without filters', async () => {
      const filterDto: ArticleFilterDto = { page: 1, limit: 10 };
      const articles = [mockArticle];
      const total = 1;

      mockRepository.findAndCount.mockResolvedValue([articles, total]);

      const result = await service.findAll(filterDto);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual({
        data: articles,
        total,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by authorId', async () => {
      const filterDto: ArticleFilterDto = { page: 1, limit: 10, authorId: 'user-123' };
      const articles = [mockArticle];

      mockRepository.findAndCount.mockResolvedValue([articles, 1]);

      await service.findAll(filterDto);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { authorId: 'user-123' },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by date range (from and to)', async () => {
      const filterDto: ArticleFilterDto = {
        page: 1,
        limit: 10,
        publishDateFrom: '2024-01-01',
        publishDateTo: '2024-12-31',
      };

      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filterDto);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          createdAt: Between(new Date('2024-01-01'), new Date('2024-12-31')),
        },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by date from only', async () => {
      const filterDto: ArticleFilterDto = {
        page: 1,
        limit: 10,
        publishDateFrom: '2024-01-01',
      };

      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filterDto);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          createdAt: MoreThanOrEqual(new Date('2024-01-01')),
        },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by date to only', async () => {
      const filterDto: ArticleFilterDto = {
        page: 1,
        limit: 10,
        publishDateTo: '2024-12-31',
      };

      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(filterDto);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          createdAt: LessThanOrEqual(new Date('2024-12-31')),
        },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
    });

    it('should calculate pagination correctly', async () => {
      const filterDto: ArticleFilterDto = { page: 3, limit: 5 };
      const articles = [mockArticle];
      const total = 20;

      mockRepository.findAndCount.mockResolvedValue([articles, total]);

      const result = await service.findAll(filterDto);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 10, // (3-1) * 5
        take: 5,
        order: { createdAt: 'DESC' },
      });
      expect(result.totalPages).toBe(4); // Math.ceil(20/5)
    });

    it('should throw error if database query fails', async () => {
      const filterDto: ArticleFilterDto = { page: 1, limit: 10 };

      mockRepository.findAndCount.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll(filterDto)).rejects.toThrow('Database error');
    });
  });

  describe('findOne', () => {
    it('should return an article by id', async () => {
      const articleId = '123e4567-e89b-12d3-a456-426614174000';

      mockRepository.findOne.mockResolvedValue(mockArticle);

      const result = await service.findOne(articleId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: articleId } });
      expect(result).toEqual(mockArticle);
    });

    it('should throw NotFoundException if article not found', async () => {
      const articleId = 'non-existent-id';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(articleId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(articleId)).rejects.toThrow('Article not found');
    });

    it('should rethrow NotFoundException', async () => {
      const articleId = 'test-id';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(articleId)).rejects.toThrow(NotFoundException);
    });

    it('should throw error if database query fails', async () => {
      const articleId = 'test-id';

      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(service.findOne(articleId)).rejects.toThrow('Database error');
    });
  });

  describe('update', () => {
    it('should update an article successfully', async () => {
      const articleId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';
      const updateDto: UpdateArticleDto = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const updatedArticle = { ...mockArticle, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository.save.mockResolvedValue(updatedArticle);
      mockCacheManager.clear.mockResolvedValue(undefined);

      const result = await service.update(articleId, userId, updateDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: articleId } });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockCacheManager.clear).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
      expect(result.description).toBe('Updated Description');
    });

    it('should throw NotFoundException if article not found', async () => {
      const articleId = 'non-existent-id';
      const userId = 'user-123';
      const updateDto: UpdateArticleDto = { title: 'Updated' };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(articleId, userId, updateDto)).rejects.toThrow(NotFoundException);
      await expect(service.update(articleId, userId, updateDto)).rejects.toThrow('Article not found');
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      const articleId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'different-user';
      const updateDto: UpdateArticleDto = { title: 'Updated' };

      mockRepository.findOne.mockResolvedValue(mockArticle);

      await expect(service.update(articleId, userId, updateDto)).rejects.toThrow(ForbiddenException);
      await expect(service.update(articleId, userId, updateDto)).rejects.toThrow('Only the author can modify the article');
    });

    it('should not fail if cache clear fails', async () => {
      const articleId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';
      const updateDto: UpdateArticleDto = { title: 'Updated' };

      const updatedArticle = { ...mockArticle, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository.save.mockResolvedValue(updatedArticle);
      mockCacheManager.clear.mockRejectedValue(new Error('Cache error'));

      const result = await service.update(articleId, userId, updateDto);

      expect(result).toEqual(updatedArticle);
    });

    it('should throw error if save fails', async () => {
      const articleId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';
      const updateDto: UpdateArticleDto = { title: 'Updated' };

      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.update(articleId, userId, updateDto)).rejects.toThrow('Database error');
    });
  });

  describe('remove', () => {
    it('should delete an article successfully', async () => {
      const articleId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';

      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      mockCacheManager.clear.mockResolvedValue(undefined);

      const result = await service.remove(articleId, userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: articleId } });
      expect(mockRepository.delete).toHaveBeenCalledWith(articleId);
      expect(mockCacheManager.clear).toHaveBeenCalled();
      expect(result).toEqual(mockArticle);
    });

    it('should throw NotFoundException if article not found', async () => {
      const articleId = 'non-existent-id';
      const userId = 'user-123';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(articleId, userId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(articleId, userId)).rejects.toThrow('Article not found');
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      const articleId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'different-user';

      mockRepository.findOne.mockResolvedValue(mockArticle);

      await expect(service.remove(articleId, userId)).rejects.toThrow(ForbiddenException);
      await expect(service.remove(articleId, userId)).rejects.toThrow('Only the author can modify the article');
    });

    it('should not fail if cache clear fails', async () => {
      const articleId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';

      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      mockCacheManager.clear.mockRejectedValue(new Error('Cache error'));

      const result = await service.remove(articleId, userId);

      expect(result).toEqual(mockArticle);
    });

    it('should throw error if delete fails', async () => {
      const articleId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';

      mockRepository.findOne.mockResolvedValue(mockArticle);
      mockRepository.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.remove(articleId, userId)).rejects.toThrow('Database error');
    });
  });
});

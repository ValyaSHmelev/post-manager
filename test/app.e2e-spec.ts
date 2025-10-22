import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Main Flow (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: string;
  let articleId: string;

  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  const testArticle = {
    title: 'Тестовая статья',
    description: 'Это описание тестовой статьи для e2e тестирования',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Flow', () => {
    describe('POST /auth/register', () => {
      it('должен успешно зарегистрировать нового пользователя', () => {
        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send(testUser)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('access_token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('id');
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.user).not.toHaveProperty('password');
            
            accessToken = res.body.access_token;
            userId = res.body.user.id;
          });
      });

      it('должен вернуть ошибку при регистрации с существующим email', () => {
        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send(testUser)
          .expect(400);
      });

      it('должен вернуть ошибку при невалидном email', () => {
        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: 'invalid-email',
            password: 'TestPassword123!',
          })
          .expect(400);
      });

      it('должен вернуть ошибку при слабом пароле', () => {
        return request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: `test2-${Date.now()}@example.com`,
            password: 'weak',
          })
          .expect(400);
      });
    });

    describe('POST /auth/login', () => {
      it('должен успешно авторизовать пользователя', () => {
        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send(testUser)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('access_token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testUser.email);
            
            accessToken = res.body.access_token;
          });
      });

      it('должен вернуть ошибку при неверном пароле', () => {
        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'WrongPassword123!',
          })
          .expect(401);
      });

      it('должен вернуть ошибку при несуществующем email', () => {
        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'TestPassword123!',
          })
          .expect(401);
      });
    });
  });

  describe('Articles Flow', () => {
    describe('POST /articles', () => {
      it('должен создать новую статью для авторизованного пользователя', () => {
        return request(app.getHttpServer())
          .post('/api/articles')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(testArticle)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body.title).toBe(testArticle.title);
            expect(res.body.description).toBe(testArticle.description);
            expect(res.body.authorId).toBe(userId);
            expect(res.body).toHaveProperty('createdAt');
            expect(res.body).toHaveProperty('updatedAt');
            
            articleId = res.body.id;
          });
      });

      it('должен вернуть ошибку при создании статьи без авторизации', () => {
        return request(app.getHttpServer())
          .post('/api/articles')
          .send(testArticle)
          .expect(401);
      });

      it('должен вернуть ошибку при невалидных данных статьи', () => {
        return request(app.getHttpServer())
          .post('/api/articles')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: '',
            description: '',
          })
          .expect(400);
      });

      it('должен вернуть ошибку при превышении максимальной длины заголовка', () => {
        return request(app.getHttpServer())
          .post('/api/articles')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: 'a'.repeat(129),
            description: 'Valid description',
          })
          .expect(400);
      });
    });

    describe('GET /articles', () => {
      it('должен получить список всех статей', () => {
        return request(app.getHttpServer())
          .get('/api/articles')
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('page');
            expect(res.body).toHaveProperty('limit');
            expect(res.body).toHaveProperty('totalPages');
          });
      });

      it('должен получить список статей с пагинацией', () => {
        return request(app.getHttpServer())
          .get('/api/articles?page=1&limit=5')
          .expect(200)
          .expect((res) => {
            expect(res.body.page).toBe(1);
            expect(res.body.limit).toBe(5);
            expect(res.body.data.length).toBeLessThanOrEqual(5);
          });
      });

      it('должен получить список статей с фильтрацией по автору', () => {
        return request(app.getHttpServer())
          .get(`/api/articles?authorId=${userId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.data.length).toBeGreaterThan(0);
            // Проверяем, что все статьи принадлежат указанному автору
            expect(res.body.data.every((article: any) => article.authorId === userId)).toBe(true);
          });
      });
    });

    describe('GET /articles/:id', () => {
      it('должен получить статью по ID', () => {
        return request(app.getHttpServer())
          .get(`/api/articles/${articleId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(articleId);
            expect(res.body.title).toBe(testArticle.title);
            expect(res.body.description).toBe(testArticle.description);
          });
      });

      it('должен вернуть ошибку при запросе несуществующей статьи', () => {
        const fakeId = '550e8400-e29b-41d4-a716-446655440000';
        return request(app.getHttpServer())
          .get(`/api/articles/${fakeId}`)
          .expect(404);
      });

      it('должен вернуть ошибку при невалидном UUID', () => {
        return request(app.getHttpServer())
          .get('/api/articles/invalid-uuid')
          .expect(500); // TypeORM возвращает 500 при невалидном UUID
      });
    });

    describe('PATCH /articles/:id', () => {
      it('должен обновить статью автором', () => {
        const updatedData = {
          title: 'Обновленная тестовая статья',
          description: 'Это обновленное описание статьи',
        };

        return request(app.getHttpServer())
          .patch(`/api/articles/${articleId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updatedData)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(articleId);
            expect(res.body.title).toBe(updatedData.title);
            expect(res.body.description).toBe(updatedData.description);
            expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(
              new Date(res.body.createdAt).getTime()
            );
          });
      });

      it('должен обновить только заголовок статьи', () => {
        const updatedData = {
          title: 'Только новый заголовок',
        };

        return request(app.getHttpServer())
          .patch(`/api/articles/${articleId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updatedData)
          .expect(200)
          .expect((res) => {
            expect(res.body.title).toBe(updatedData.title);
          });
      });

      it('должен вернуть ошибку при обновлении статьи без авторизации', () => {
        return request(app.getHttpServer())
          .patch(`/api/articles/${articleId}`)
          .send({ title: 'Новый заголовок' })
          .expect(401);
      });

      it('должен вернуть ошибку при обновлении чужой статьи', async () => {
        // Создаем нового пользователя
        const anotherUser = {
          email: `another-${Date.now()}@example.com`,
          password: 'AnotherPassword123!',
        };

        const registerRes = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(anotherUser);

        const anotherToken = registerRes.body.access_token;

        return request(app.getHttpServer())
          .patch(`/api/articles/${articleId}`)
          .set('Authorization', `Bearer ${anotherToken}`)
          .send({ title: 'Попытка обновить чужую статью' })
          .expect(403);
      });

      it('должен вернуть ошибку при обновлении несуществующей статьи', () => {
        const fakeId = '550e8400-e29b-41d4-a716-446655440000';
        return request(app.getHttpServer())
          .patch(`/api/articles/${fakeId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'Новый заголовок' })
          .expect(404);
      });
    });

    describe('DELETE /articles/:id', () => {
      it('должен вернуть ошибку при удалении статьи без авторизации', () => {
        return request(app.getHttpServer())
          .delete(`/api/articles/${articleId}`)
          .expect(401);
      });

      it('должен вернуть ошибку при удалении чужой статьи', async () => {
        // Используем другого пользователя
        const anotherUser = {
          email: `delete-test-${Date.now()}@example.com`,
          password: 'DeleteTest123!',
        };

        const registerRes = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send(anotherUser);

        const anotherToken = registerRes.body.access_token;

        return request(app.getHttpServer())
          .delete(`/api/articles/${articleId}`)
          .set('Authorization', `Bearer ${anotherToken}`)
          .expect(403);
      });

      it('должен вернуть ошибку при удалении несуществующей статьи', () => {
        const fakeId = '550e8400-e29b-41d4-a716-446655440000';
        return request(app.getHttpServer())
          .delete(`/api/articles/${fakeId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      });

      it('должен успешно удалить статью автором', () => {
        return request(app.getHttpServer())
          .delete(`/api/articles/${articleId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(articleId);
          });
      });

      it('должен вернуть ошибку при попытке получить удаленную статью', () => {
        return request(app.getHttpServer())
          .get(`/api/articles/${articleId}`)
          .expect(404);
      });
    });
  });
});

import type { EntityManager, FilterQuery, QueryOrderMap } from '@mikro-orm/core';
import type {
    Page,
    ReadProfile,
    RepositoryRequest,
    RepositoryResponse,
    UpdateProfile,
    WriteProfile,
} from '../../../core/contracts.js';
import { PersistenceNotFoundError } from '../../../core/errors.js';
import { MikroOrmRepository } from '../../../adapters/mikro-orm/repository.js';
import type { ArticleRepository } from '../contracts/article.repository.js';
import type {
    ArticleListInput,
    ArticleRecord,
    CreateArticleInput,
    DeleteArticleOutput,
    UpdateArticleInput,
} from '../contracts/article.types.js';
import { ArticleEntity, ArticlePublishStatus } from '../entities/article.entity.js';
import { toArticleRecord } from '../mappers/article.mapper.js';
import { UserEntity } from '../../user/entities/user.entity.js';

/** ArticleRepository 的 MikroORM 实现。 */
export class MikroOrmArticleRepository extends MikroOrmRepository implements ArticleRepository {
    constructor(em: EntityManager) {
        super(em);
    }

    async getById(
        request: RepositoryRequest<{ id: string }>,
    ): Promise<RepositoryResponse<ArticleRecord | null, ReadProfile>> {
        const { result, timing } = await this.measure(request.context.options?.collectTiming, 'load', async () => {
            return this.entityManager(request.context).findOne(ArticleEntity, {
                id: request.input.id,
                deleted: false,
            });
        });

        return { output: result ? toArticleRecord(result) : null, profile: { timing } };
    }

    async list(
        request: RepositoryRequest<ArticleListInput>,
    ): Promise<RepositoryResponse<Page<ArticleRecord>, ReadProfile>> {
        const { filter, page, sort } = request.input;
        const where: FilterQuery<ArticleEntity> = { deleted: false };

        if (filter?.creatorId) {
            where.creator = filter.creatorId;
        }
        if (filter?.publishStatus) {
            where.publishStatus = filter.publishStatus;
        }
        if (filter?.keyword) {
            where.title = { $like: `%${filter.keyword}%` };
        }

        const { result, timing } = await this.measure(request.context.options?.collectTiming, 'list', async () => {
            return this.entityManager(request.context).findAndCount(ArticleEntity, where, {
                limit: page.size,
                offset: (page.number - 1) * page.size,
                orderBy: { [sort?.field ?? 'createdAt']: sort?.direction ?? 'desc' } as QueryOrderMap<ArticleEntity>,
            });
        });
        const [entities, total] = result;

        return {
            output: { items: entities.map(toArticleRecord), total, page },
            profile: { timing },
        };
    }

    async create(
        request: RepositoryRequest<CreateArticleInput>,
    ): Promise<RepositoryResponse<ArticleRecord, WriteProfile>> {
        const { result, timing } = await this.measure(request.context.options?.collectTiming, 'persist', async () => {
            const em = this.entityManager(request.context);
            const creator = await this.findActiveActor(em, request.context.actor?.id);
            const entity = em.create(ArticleEntity, {
                ...request.input,
                publishStatus: request.input.publishStatus ?? ArticlePublishStatus.DRAFT,
                creator,
            });
            await em.persist(entity).flush();
            return entity;
        });

        return { output: toArticleRecord(result), profile: { timing } };
    }

    async update(
        request: RepositoryRequest<UpdateArticleInput>,
    ): Promise<RepositoryResponse<ArticleRecord, UpdateProfile>> {
        const { result, timing } = await this.measure(request.context.options?.collectTiming, 'update', async () => {
            const em = this.entityManager(request.context);
            const entity = await em.findOne(ArticleEntity, { id: request.input.id, deleted: false });

            if (!entity) {
                throw new PersistenceNotFoundError('Article', request.input.id);
            }

            const updater = await this.findActiveActor(em, request.context.actor?.id);
            const changes = request.context.options?.collectChanges
                ? Object.entries(request.input.patch).flatMap(([field, after]) => {
                      const before = (entity as unknown as Record<string, unknown>)[field];
                      return before === after ? [] : [{ field, before, after }];
                  })
                : undefined;

            // DTO 即更新白名单，禁止通过通用 assign 写入审计或软删除字段。
            if (request.input.patch.title !== undefined) {
                entity.title = request.input.patch.title;
            }
            if (request.input.patch.content !== undefined) {
                entity.content = request.input.patch.content;
            }
            if (request.input.patch.publishStatus !== undefined) {
                entity.publishStatus = request.input.patch.publishStatus;
            }
            entity.updater = updater;
            await em.flush();
            return { entity, changes };
        });

        return {
            output: toArticleRecord(result.entity),
            profile: { timing, changes: result.changes },
        };
    }

    async softDelete(
        request: RepositoryRequest<{ id: string }>,
    ): Promise<RepositoryResponse<DeleteArticleOutput, WriteProfile>> {
        const { result, timing } = await this.measure(
            request.context.options?.collectTiming,
            'soft-delete',
            async () => {
                const em = this.entityManager(request.context);
                const entity = await em.findOne(ArticleEntity, { id: request.input.id, deleted: false });

                if (!entity) {
                    throw new PersistenceNotFoundError('Article', request.input.id);
                }

                entity.updater = await this.findActiveActor(em, request.context.actor?.id);
                const deletedAt = new Date();
                entity.deleted = true;
                entity.deletedAt = deletedAt;
                await em.flush();
                return { id: entity.id, deletedAt };
            },
        );

        return { output: result, profile: { timing } };
    }

    private async findActiveActor(em: EntityManager, actorId: string | undefined): Promise<UserEntity> {
        if (!actorId) {
            throw new PersistenceNotFoundError('Actor', 'missing');
        }

        const actor = await em.findOne(UserEntity, { id: actorId, deleted: false });
        if (!actor) {
            throw new PersistenceNotFoundError('User', actorId);
        }

        return actor;
    }
}

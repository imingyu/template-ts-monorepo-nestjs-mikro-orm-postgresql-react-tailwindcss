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
import { UserEntity } from '../entities/user.entity.js';
import { toUserRecord } from '../mappers/user.mapper.js';
import type { UserRepository } from '../contracts/user.repository.js';
import type {
    CreateUserInput,
    DeleteUserOutput,
    UpdateUserInput,
    UserListInput,
    UserRecord,
} from '../contracts/user.types.js';

/** UserRepository 的 MikroORM 实现。 */
export class MikroOrmUserRepository extends MikroOrmRepository implements UserRepository {
    constructor(em: EntityManager) {
        super(em);
    }

    async getById(
        request: RepositoryRequest<{ id: string }>,
    ): Promise<RepositoryResponse<UserRecord | null, ReadProfile>> {
        const { result, timing } = await this.measure(request.context.options?.collectTiming, 'load', async () => {
            return this.entityManager(request.context).findOne(UserEntity, {
                id: request.input.id,
                deletedAt: null,
            });
        });

        return { output: result ? toUserRecord(result) : null, profile: { timing } };
    }

    async list(request: RepositoryRequest<UserListInput>): Promise<RepositoryResponse<Page<UserRecord>, ReadProfile>> {
        const { filter, page, sort } = request.input;
        const where: FilterQuery<UserEntity> = { deletedAt: null };

        if (filter?.disabled !== undefined) {
            where.disabled = filter.disabled;
        }
        if (filter?.keyword) {
            where.nickname = { $like: `%${filter.keyword}%` };
        }

        const { result, timing } = await this.measure(request.context.options?.collectTiming, 'list', async () => {
            return this.entityManager(request.context).findAndCount(UserEntity, where, {
                limit: page.size,
                offset: (page.number - 1) * page.size,
                orderBy: { [sort?.field ?? 'createdAt']: sort?.direction ?? 'desc' } as QueryOrderMap<UserEntity>,
            });
        });
        const [entities, total] = result;

        return {
            output: { items: entities.map(toUserRecord), total, page },
            profile: { timing },
        };
    }

    async create(request: RepositoryRequest<CreateUserInput>): Promise<RepositoryResponse<UserRecord, WriteProfile>> {
        const { result, timing } = await this.measure(request.context.options?.collectTiming, 'persist', async () => {
            const em = this.entityManager(request.context);
            const entity = em.create(UserEntity, request.input);
            await em.persist(entity).flush();
            return entity;
        });

        return { output: toUserRecord(result), profile: { timing } };
    }

    async update(request: RepositoryRequest<UpdateUserInput>): Promise<RepositoryResponse<UserRecord, UpdateProfile>> {
        const { result, timing } = await this.measure(request.context.options?.collectTiming, 'update', async () => {
            const em = this.entityManager(request.context);
            const entity = await em.findOne(UserEntity, { id: request.input.id, deletedAt: null });

            if (!entity) {
                throw new PersistenceNotFoundError('User', request.input.id);
            }

            const changes = request.context.options?.collectChanges
                ? Object.entries(request.input.patch).flatMap(([field, after]) => {
                      const before = (entity as unknown as Record<string, unknown>)[field];
                      return before === after ? [] : [{ field, before, after }];
                  })
                : undefined;

            // DTO 即更新白名单，禁止以通用 ORM assign 绕过字段限制。
            if (request.input.patch.nickname !== undefined) {
                entity.nickname = request.input.patch.nickname;
            }
            if (request.input.patch.disabled !== undefined) {
                entity.disabled = request.input.patch.disabled;
            }
            await em.flush();
            return { entity, changes };
        });

        return {
            output: toUserRecord(result.entity),
            profile: { timing, changes: result.changes },
        };
    }

    async softDelete(
        request: RepositoryRequest<{ id: string }>,
    ): Promise<RepositoryResponse<DeleteUserOutput, WriteProfile>> {
        const { result, timing } = await this.measure(
            request.context.options?.collectTiming,
            'soft-delete',
            async () => {
                const em = this.entityManager(request.context);
                const entity = await em.findOne(UserEntity, { id: request.input.id, deletedAt: null });

                if (!entity) {
                    throw new PersistenceNotFoundError('User', request.input.id);
                }

                const deletedAt = new Date();
                entity.deletedAt = deletedAt;
                await em.flush();
                return { id: entity.id, deletedAt };
            },
        );

        return { output: result, profile: { timing } };
    }
}

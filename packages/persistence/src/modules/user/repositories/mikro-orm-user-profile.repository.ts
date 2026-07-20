import type { EntityManager, FilterQuery } from '@mikro-orm/core';
import type {
    ReadProfile,
    RepositoryRequest,
    RepositoryResponse,
    UpdateProfile,
    WriteProfile,
} from '../../../core/contracts.js';
import { PersistenceNotFoundError } from '../../../core/errors.js';
import { MikroOrmRepository } from '../../../adapters/mikro-orm/repository.js';
import type { UserProfileRepository } from '../contracts/user-profile.repository.js';
import type {
    CreateUserProfileInput,
    UpdateUserProfileInput,
    UserProfileRecord,
} from '../contracts/user-profile.types.js';
import { UserEntity } from '../entities/user.entity.js';
import { UserProfileEntity } from '../entities/user-profile.entity.js';
import { toUserProfileRecord } from '../mappers/user-profile.mapper.js';

/** UserProfileRepository 的 MikroORM 实现。 */
export class MikroOrmUserProfileRepository extends MikroOrmRepository implements UserProfileRepository {
    constructor(em: EntityManager) {
        super(em);
    }

    async getByUserId(
        request: RepositoryRequest<{ userId: string }>,
    ): Promise<RepositoryResponse<UserProfileRecord | null, ReadProfile>> {
        const { result, timing } = await this.measure(request.context.options?.collectTiming, 'load', async () => {
            return this.findByActiveUserId(this.entityManager(request.context), request.input.userId);
        });

        return { output: result ? toUserProfileRecord(result) : null, profile: { timing } };
    }

    async create(
        request: RepositoryRequest<CreateUserProfileInput>,
    ): Promise<RepositoryResponse<UserProfileRecord, WriteProfile>> {
        const { result, timing } = await this.measure(request.context.options?.collectTiming, 'persist', async () => {
            const em = this.entityManager(request.context);
            const user = await em.findOne(UserEntity, { id: request.input.userId, deletedAt: null });

            if (!user) {
                throw new PersistenceNotFoundError('User', request.input.userId);
            }

            const entity = em.create(UserProfileEntity, {
                user,
                ...(request.input.gender !== undefined ? { gender: request.input.gender } : {}),
                ...(request.input.birthday !== undefined ? { birthday: request.input.birthday } : {}),
                ...(request.input.avatarUrl !== undefined ? { avatarUrl: request.input.avatarUrl } : {}),
                ...(request.input.email !== undefined ? { email: request.input.email } : {}),
            });
            await em.persist(entity).flush();
            return entity;
        });

        return { output: toUserProfileRecord(result), profile: { timing } };
    }

    async update(
        request: RepositoryRequest<UpdateUserProfileInput>,
    ): Promise<RepositoryResponse<UserProfileRecord, UpdateProfile>> {
        const { result, timing } = await this.measure(request.context.options?.collectTiming, 'update', async () => {
            const em = this.entityManager(request.context);
            const entity = await this.findByActiveUserId(em, request.input.userId);

            if (!entity) {
                throw new PersistenceNotFoundError('UserProfile', request.input.userId);
            }

            const changes = request.context.options?.collectChanges
                ? Object.entries(request.input.patch).flatMap(([field, after]) => {
                      const before = (entity as unknown as Record<string, unknown>)[field];
                      return before === after ? [] : [{ field, before, after }];
                  })
                : undefined;

            // DTO 即更新白名单，禁止通过通用 assign 写入 user_id 或审计字段。
            if (request.input.patch.gender !== undefined) {
                entity.gender = request.input.patch.gender;
            }
            if (request.input.patch.birthday !== undefined) {
                entity.birthday = request.input.patch.birthday;
            }
            if (request.input.patch.avatarUrl !== undefined) {
                entity.avatarUrl = request.input.patch.avatarUrl;
            }
            if (request.input.patch.email !== undefined) {
                entity.email = request.input.patch.email;
            }
            await em.flush();
            return { entity, changes };
        });

        return {
            output: toUserProfileRecord(result.entity),
            profile: { timing, changes: result.changes },
        };
    }

    private async findByActiveUserId(em: EntityManager, userId: string): Promise<UserProfileEntity | null> {
        return em.findOne(UserProfileEntity, {
            user: { id: userId, deletedAt: null },
        } as FilterQuery<UserProfileEntity>);
    }
}

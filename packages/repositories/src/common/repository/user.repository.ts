import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { User } from '../entity/user.entity.js';
import type { CreateEntityInput, UpdateEntityInput } from '@mono-ts/types';
import { BaseRepository, type RepositoryMethodArgInfo } from '../../base/repository.js';

/**
 * 用户仓储类
 */
export class UserRepository extends BaseRepository<
    User,
    RepositoryMethodArgInfo,
    CreateEntityInput<User>,
    UpdateEntityInput<User>
> {
    constructor(em: EntityManager) {
        super(User, em);
    }

    protected getAllowUpdateFields() {
        return ['nickname', 'disabled'] as const;
    }

    /**
     * 构建关键字查询条件
     */
    protected buildKeywordQuery(keyword: string): FilterQuery<User>[] {
        return [{ nickname: { $like: `%${keyword}%` } } as FilterQuery<User>];
    }
}

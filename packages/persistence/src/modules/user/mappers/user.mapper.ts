import type { UserEntity } from '../entities/user.entity.js';
import type { UserRecord } from '../contracts/user.types.js';

/** 将受管理 ORM 实体映射为可安全跨层传递的用户记录。 */
export const toUserRecord = (entity: UserEntity): UserRecord => {
    return {
        id: entity.id,
        nickname: entity.nickname,
        disabled: entity.disabled,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        deletedAt: entity.deletedAt,
    };
};
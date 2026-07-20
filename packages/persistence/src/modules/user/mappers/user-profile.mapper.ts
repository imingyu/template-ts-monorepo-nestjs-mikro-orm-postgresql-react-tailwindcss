import type { UserProfileEntity } from '../entities/user-profile.entity.js';
import type { UserProfileRecord } from '../contracts/user-profile.types.js';

/** 将受管理 ORM 实体映射为可安全跨层传递的用户资料记录。 */
export const toUserProfileRecord = (entity: UserProfileEntity): UserProfileRecord => {
    return {
        id: entity.id,
        userId: entity.user.id,
        gender: entity.gender,
        birthday: entity.birthday,
        avatarUrl: entity.avatarUrl,
        email: entity.email,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
    };
};
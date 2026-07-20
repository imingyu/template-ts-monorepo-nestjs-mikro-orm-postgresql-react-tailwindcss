import { UserEntity } from './user.entity.js';
import { UserProfileEntity } from './user-profile.entity.js';

/** 启动 MikroORM 时可直接传入的用户模块实体集合。 */
export const userEntities = [UserEntity, UserProfileEntity] as const;

export * from './user.entity.js';
export * from './user-profile.entity.js';
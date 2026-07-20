import { randomUUID } from 'node:crypto';
import { OptionalProps } from '@mikro-orm/core';
import { Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import type { UserProfileGender } from '../contracts/user-profile.types.js';
import { UserEntity } from './user.entity.js';

/**
 * `user_profile` 表：以唯一 user_id 与 users 建立一对一关系。
 * 个人资料字段与账户主表分离，后续扩展不会频繁改变 users 表结构。
 */
@Entity({ tableName: 'user_profile', comment: '用户个人资料' })
export class UserProfileEntity {
    /** 由 ORM 自动生成或维护的字段不要求出现在创建 DTO 中。 */
    [OptionalProps]?: 'createdAt' | 'gender' | 'id' | 'updatedAt';

    @PrimaryKey({ type: 'uuid', onCreate: () => randomUUID() })
    id!: string;

    @OneToOne({ entity: () => UserEntity, owner: true, fieldName: 'user_id', unique: true, comment: '所属用户' })
    user!: UserEntity;

    @Property({ type: 'string', length: 16, default: 'unspecified', comment: '性别' })
    gender: UserProfileGender = 'unspecified';

    @Property({ type: 'date', nullable: true, comment: '生日' })
    birthday: Date | null = null;

    @Property({ type: 'string', length: 2048, nullable: true, fieldName: 'avatar_url', comment: '头像 URL' })
    avatarUrl: string | null = null;

    /** 邮箱由数据库唯一约束保护，不能仅依赖应用层预检查。 */
    @Property({ type: 'string', length: 320, nullable: true, unique: true, comment: '邮箱' })
    email: string | null = null;

    @Property({ type: 'datetime', onCreate: () => new Date(), comment: '创建时间' })
    createdAt!: Date;

    @Property({ type: 'datetime', nullable: true, onUpdate: () => new Date(), comment: '更新时间' })
    updatedAt: Date | null = null;
}

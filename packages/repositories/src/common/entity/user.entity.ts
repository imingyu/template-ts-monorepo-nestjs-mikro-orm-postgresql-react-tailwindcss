import { type RequiredNullable, OptionalProps } from '@mikro-orm/core';
import { ManyToOne, Entity, Property, Index } from '@mikro-orm/decorators/legacy';
import { type WithBaseEntityOptionalProps } from '../../base/entity.js';
import { CrossEntity } from '../../base/cross.js';

/**
 * 用户实体
 */
@Entity({ comment: '用户' })
export class User extends CrossEntity {
    [OptionalProps]?: WithBaseEntityOptionalProps<'avatarUrl'>;

    /**
     * 创建用户
     */
    @ManyToOne({ entity: () => User, comment: '创建该条数据的用户', fieldName: 'created_by' })
    creater!: User;

    /**
     * 更新用户
     */
    @ManyToOne({ entity: () => User, nullable: true, comment: '更新该条数据的用户', fieldName: 'updated_by' })
    updater: RequiredNullable<User> = null;

    /**
     * 删除用户
     */
    @ManyToOne({ entity: () => User, nullable: true, comment: '删除该条数据的用户', fieldName: 'deleted_by' })
    deleter: RequiredNullable<User> = null;

    /**
     * 昵称
     */
    @Property({ type: 'string', length: 200, comment: '昵称' })
    nickname!: string;

    /**
     * 是否禁用
     */
    @Property({ type: 'boolean', comment: '是否禁用' })
    @Index()
    disabled!: boolean;
}

/** 用户实体类型 */
export type TypeUserEntity = InstanceType<typeof User>;

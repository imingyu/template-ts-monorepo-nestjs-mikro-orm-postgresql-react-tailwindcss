import { OptionalProps, type RequiredNullable } from '@mikro-orm/core';
import { User } from '../common/entity/user.entity.js';
import { CrossEntity } from './cross.js';
import { ManyToOne } from '@mikro-orm/decorators/legacy';

/***
 * 公共实体
 */
abstract class CommonEntity extends CrossEntity {
    /**
     * 创建该条数据的用户
     */
    @ManyToOne({ entity: () => User, comment: '创建该条数据的用户', fieldName: 'created_by' })
    creater!: User;

    /**
     * 更新该条数据的用户
     */
    @ManyToOne({ entity: () => User, nullable: true, comment: '更新该条数据的用户', fieldName: 'updated_by' })
    updater: RequiredNullable<User> = null;

    /**
     * 删除该条数据的用户
     */
    @ManyToOne({ entity: () => User, nullable: true, comment: '删除该条数据的用户', fieldName: 'deleted_by' })
    deleter: RequiredNullable<User> = null;
}

export type BaseEntityOptionalProps = 'createdAt' | 'updatedAt' | 'updater' | 'deletedAt' | 'deleted' | 'deleter';
export type WithBaseEntityOptionalProps<T extends string> = T | BaseEntityOptionalProps;

export type EntityConstructor<T extends BaseEntity<string>> = abstract new (...args: any[]) => T;

/**
 * 基础实体抽象类,所有实体都应该继承此类.
 */
export class BaseEntity<TOptionalProps extends string = BaseEntityOptionalProps> extends CommonEntity {
    [OptionalProps]?: TOptionalProps;
}

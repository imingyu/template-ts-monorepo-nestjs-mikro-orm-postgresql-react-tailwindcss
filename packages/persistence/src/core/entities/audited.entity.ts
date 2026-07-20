import { randomUUID } from 'node:crypto';
import { type EntityName, OptionalProps } from '@mikro-orm/core';
import { ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import type { UserEntity } from '../../modules/user/entities/user.entity.js';

/**
 * 所有需要审计与软删除的业务实体的公共字段。
 * `creator` 与 `updater` 记录可信调用上下文中的操作者，不承担授权判断。
 */
export abstract class AuditedEntity {
    /** 由 ORM 自动生成或维护的字段不要求出现在创建 DTO 中。 */
    [OptionalProps]?: 'createdAt' | 'creator' | 'deleted' | 'deletedAt' | 'id' | 'updatedAt' | 'updater';

    @PrimaryKey({ type: 'uuid', onCreate: () => randomUUID() })
    id!: string;

    @Property({ type: 'datetime', onCreate: () => new Date(), comment: '创建时间' })
    createdAt!: Date;

    // 使用实体名称延迟解析，避免基类与 UserEntity 的运行时循环依赖。
    @ManyToOne({
        entity: () => 'UserEntity' as unknown as EntityName<UserEntity>,
        fieldName: 'creator_id',
        comment: '创建人',
    })
    creator!: UserEntity;

    @Property({ type: 'datetime', nullable: true, onUpdate: () => new Date(), comment: '更新时间' })
    updatedAt: Date | null = null;

    @ManyToOne({
        entity: () => 'UserEntity' as unknown as EntityName<UserEntity>,
        nullable: true,
        fieldName: 'updater_id',
        comment: '更新人',
    })
    updater: UserEntity | null = null;

    @Property({ type: 'boolean', default: false, comment: '是否删除' })
    deleted = false;

    @Property({ type: 'datetime', nullable: true, comment: '删除时间' })
    deletedAt: Date | null = null;
}

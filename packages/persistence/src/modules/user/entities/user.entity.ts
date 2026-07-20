import { randomUUID } from 'node:crypto';
import { OptionalProps } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/** `users` 表：保存账户主信息，不承载可频繁扩展的个人资料字段。 */
@Entity({ tableName: 'users', comment: '用户账户主信息' })
export class UserEntity {
    /** 由 ORM 自动生成或维护的字段不要求出现在创建 DTO 中。 */
    [OptionalProps]?: 'createdAt' | 'deletedAt' | 'id' | 'updatedAt';

    @PrimaryKey({ type: 'uuid', onCreate: () => randomUUID() })
    id!: string;

    @Property({ type: 'string', length: 200, comment: '用户昵称' })
    nickname!: string;

    @Property({ type: 'boolean', default: false, comment: '是否禁用' })
    disabled = false;

    @Property({ type: 'datetime', onCreate: () => new Date(), comment: '创建时间' })
    createdAt!: Date;

    @Property({ type: 'datetime', nullable: true, onUpdate: () => new Date(), comment: '更新时间' })
    updatedAt: Date | null = null;

    /** 软删除字段使普通仓储查询能够默认排除已删除账户。 */
    @Property({ type: 'datetime', nullable: true, comment: '删除时间' })
    deletedAt: Date | null = null;
}

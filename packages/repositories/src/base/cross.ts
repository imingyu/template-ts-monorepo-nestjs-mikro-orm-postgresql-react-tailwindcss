import { type RequiredNullable } from '@mikro-orm/core';
import { Index, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { createUUID, nowDate } from '../helper/date.js';

/***
 * 跨平台实体
 */
export abstract class CrossEntity {
    @PrimaryKey({
        type: 'uuid',
        comment: '主键 ID (UUID)',
        unique: true,
        onCreate: () => createUUID(),
    })
    id!: string;

    /**
     * 创建时间
     */
    @Property({
        type: 'datetime',
        comment: '创建时间',
        onCreate: () => nowDate(),
    })
    @Index()
    createdAt!: Date;

    /**
     * 更新时间
     */
    @Property({ type: 'datetime', nullable: true, onUpdate: () => nowDate(), comment: '更新时间' })
    updatedAt: RequiredNullable<Date> = null;

    /**
     * 删除时间
     */
    @Property({ type: 'datetime', nullable: true, comment: '删除时间' })
    @Index()
    deletedAt: RequiredNullable<Date> = null;

    /**
     * 删除标记
     */
    @Property({ type: 'boolean', comment: '删除标记', default: false })
    @Index()
    deleted!: boolean;
}

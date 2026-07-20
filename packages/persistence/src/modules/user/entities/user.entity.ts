import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { AuditedEntity } from '../../../core/entities/audited.entity.js';

/** `users` 表：保存账户主信息，不承载可频繁扩展的个人资料字段。 */
@Entity({ tableName: 'users', comment: '用户账户主信息' })
export class UserEntity extends AuditedEntity {
    @Property({ type: 'string', length: 200, comment: '用户昵称' })
    nickname!: string;

    @Property({ type: 'boolean', default: false, comment: '是否禁用' })
    disabled = false;
}

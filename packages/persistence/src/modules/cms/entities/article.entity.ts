import { Entity, Property } from '@mikro-orm/decorators/legacy';
import { createEnum, type EnumValueOf } from '@mono-ts/shared';
import { AuditedEntity } from '../../../core/entities/index.js';

/** 文章可持久化的发布状态。 */
export const ArticlePublishStatus = createEnum(
    {
        草稿: 'draft',
        已发布: 'published',
        已归档: 'archived',
    } as const,
    {
        DRAFT: 'draft',
        PUBLISHED: 'published',
        ARCHIVED: 'archived',
    } as const,
);
export type ArticlePublishStatusValue = EnumValueOf<typeof ArticlePublishStatus>;

/** `cms_articles` 表：CMS 文章内容与发布状态。 */
@Entity({ tableName: 'cms_articles', comment: 'CMS 文章' })
export class ArticleEntity extends AuditedEntity {
    @Property({ type: 'string', length: 500, comment: '标题' })
    title!: string;

    @Property({ type: 'text', comment: '内容' })
    content!: string;

    /** 使用 createEnum 声明的受控状态集合，默认创建为草稿。 */
    @Property({ type: 'string', length: 16, default: 'draft', comment: '发布状态' })
    publishStatus: ArticlePublishStatusValue = ArticlePublishStatus.DRAFT;
}

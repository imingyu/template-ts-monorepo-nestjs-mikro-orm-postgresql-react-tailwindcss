import type { ArticleRecord } from '../contracts/article.types.js';
import type { ArticleEntity } from '../entities/article.entity.js';

/** 将受管理 ORM 实体映射为可安全跨层传递的文章记录。 */
export const toArticleRecord = (entity: ArticleEntity): ArticleRecord => {
    return {
        id: entity.id,
        title: entity.title,
        content: entity.content,
        publishStatus: entity.publishStatus,
        createdAt: entity.createdAt,
        creatorId: entity.creator.id,
        updatedAt: entity.updatedAt,
        updaterId: entity.updater?.id ?? null,
        deleted: entity.deleted,
        deletedAt: entity.deletedAt,
    };
};

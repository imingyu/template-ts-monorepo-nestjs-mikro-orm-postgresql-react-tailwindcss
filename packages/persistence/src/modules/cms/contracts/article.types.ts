import type { PageRequest } from '../../../core/contracts.js';
import type { ArticlePublishStatusValue } from '../entities/article.entity.js';

/** 文章仓储对外返回的稳定记录结构，不暴露受管理 ORM 实体。 */
export interface ArticleRecord {
    id: string;
    title: string;
    content: string;
    publishStatus: ArticlePublishStatusValue;
    createdAt: Date;
    creatorId: string;
    updatedAt: Date | null;
    updaterId: string | null;
    deleted: boolean;
    deletedAt: Date | null;
}

/** 文章列表允许的显式筛选、分页与排序条件。 */
export interface ArticleListInput {
    filter?: {
        creatorId?: string;
        keyword?: string;
        publishStatus?: ArticlePublishStatusValue;
    };
    page: PageRequest;
    sort?: {
        field: 'createdAt' | 'publishStatus' | 'title' | 'updatedAt';
        direction: 'asc' | 'desc';
    };
}

/** 创建文章所需的业务字段；创建人从可信 context.actor 写入。 */
export interface CreateArticleInput {
    title: string;
    content: string;
    publishStatus?: ArticlePublishStatusValue;
}

/** 文章更新白名单；更新人从可信 context.actor 写入。 */
export interface UpdateArticleInput {
    id: string;
    patch: {
        title?: string;
        content?: string;
        publishStatus?: ArticlePublishStatusValue;
    };
}

/** 软删除成功后的最小确认结果。 */
export interface DeleteArticleOutput {
    id: string;
    deletedAt: Date;
}

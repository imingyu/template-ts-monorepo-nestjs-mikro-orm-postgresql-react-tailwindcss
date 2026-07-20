import { describe, expect, it } from 'vitest';
import { ArticlePublishStatus } from '../../src/modules/cms/entities/article.entity.js';
import { toArticleRecord } from '../../src/modules/cms/mappers/article.mapper.js';

describe('toArticleRecord', () => {
    it('只映射公开文章字段及审计关联标识', () => {
        const record = toArticleRecord({
            id: 'article-1',
            title: '文章标题',
            content: '文章内容',
            publishStatus: ArticlePublishStatus.DRAFT,
            createdAt: new Date('2026-07-21T00:00:00.000Z'),
            creator: { id: 'user-1' },
            updatedAt: null,
            updater: null,
            deleted: false,
            deletedAt: null,
        } as never);

        expect(record).toMatchObject({
            id: 'article-1',
            publishStatus: 'draft',
            creatorId: 'user-1',
            updaterId: null,
            deleted: false,
        });
    });
});

import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/postgresql';
import { describe, expect, it } from 'vitest';
import { ArticleEntity, ArticlePublishStatus, cmsEntities } from '../../src/modules/cms/entities/index.js';
import { UserEntity, userEntities } from '../../src/modules/user/entities/index.js';

describe('CMS 文章实体元数据集成', () => {
    it('继承审计字段并映射文章内容、发布状态和创建人关系', async () => {
        // connect: false 仅装载元数据，因此测试不依赖本地 PostgreSQL 服务。
        const options = {
            entities: [...userEntities, ...cmsEntities],
            dbName: 'metadata-only',
            connect: false,
        };
        const orm = await MikroORM.init(options);

        try {
            const articleMetadata = orm.getMetadata().get(ArticleEntity);
            const creatorRelation = articleMetadata.properties.creator;
            const updaterRelation = articleMetadata.properties.updater;

            expect(articleMetadata.tableName).toBe('cms_articles');
            expect(articleMetadata.properties.title.length).toBe(500);
            expect(articleMetadata.properties.content.type).toBe('text');
            expect(articleMetadata.properties.publishStatus.default).toBe('draft');
            expect(ArticlePublishStatus.getValues()).toEqual(['draft', 'published', 'archived']);
            expect(ArticlePublishStatus.DRAFT).toBe('draft');
            expect(creatorRelation.fieldNames).toEqual(['creator_id']);
            expect(creatorRelation.type).toBe(UserEntity.name);
            expect(updaterRelation.fieldNames).toEqual(['updater_id']);
            expect(updaterRelation.nullable).toBe(true);
            expect(articleMetadata.properties.deleted.default).toBe(false);
            expect(articleMetadata.properties.deletedAt.nullable).toBe(true);
        } finally {
            await orm.close(true);
        }
    });
});

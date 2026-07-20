import { ArticleEntity } from './article.entity.js';

/** 启动 MikroORM 时可直接传入的 CMS 模块实体集合。 */
export const cmsEntities = [ArticleEntity] as const;

export * from './article.entity.js';

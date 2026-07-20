import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/postgresql';
import { describe, expect, it } from 'vitest';
import { UserEntity, UserProfileEntity, userEntities } from '../../src/modules/user/entities/index.js';

describe('用户实体元数据集成', () => {
    it('将 users 与 user_profile 映射为唯一一对一关系', async () => {
        // connect: false 仅装载实体元数据，因此测试不依赖本地 PostgreSQL 服务。
        const options = {
            entities: userEntities,
            dbName: 'metadata-only',
            connect: false,
        };
        const orm = await MikroORM.init(options);

        try {
            const userMetadata = orm.getMetadata().get(UserEntity);
            const profileMetadata = orm.getMetadata().get(UserProfileEntity);
            const userRelation = profileMetadata.properties.user;

            expect(userMetadata.tableName).toBe('users');
            expect(profileMetadata.tableName).toBe('user_profile');
            expect(userRelation.fieldNames).toEqual(['user_id']);
            expect(userRelation.unique).toBe(true);
            expect(profileMetadata.properties.email.unique).toBe(true);
        } finally {
            await orm.close(true);
        }
    });
});

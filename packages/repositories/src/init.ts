import { type Options } from '@mikro-orm/core';
import { User } from './common/entity/user.entity.js';

export const init = async (config?: Partial<Options>, generatorSchema = true) => {
    const ORM =
        process.env.DB_TYPE === 'mysql'
            ? (await import('@mikro-orm/mysql')).MikroORM
            : (await import('@mikro-orm/postgresql')).MikroORM;
    const orm = await ORM.init({
        entities: ([User] as Options['entities']).concat(config?.entities || []),
        timezone: '+8:00',
        debug: process.env.ENV_TYPE !== 'prod',
        pool: {
            min: 10, // 最小连接数
            max: 80, // 最大连接数
        },
        driverOptions: {
            connection: {
                timezone: '+8:00',
            },
        },
        dbName: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
    });

    // 开发环境自动更新数据库 schema
    if (generatorSchema) {
        // 更新 schema
        try {
            await orm.schema.drop();
            await orm.schema.create();
            await orm.schema.update();
            console.log('数据库 schema 已同步');
        } catch (error) {
            console.log('忽略数据库 schema 同步', error);
        }
    }

    return orm;
};

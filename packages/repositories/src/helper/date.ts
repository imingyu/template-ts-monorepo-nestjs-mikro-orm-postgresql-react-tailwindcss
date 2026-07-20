import { randomUUID } from 'node:crypto';

/**
 * 创建当前时间的 Date 对象
 * 注意：时区已在 ORM 配置中设置为 '+08:00'，无需手动转换
 */
export const nowDate = () => {
    return new Date();
};

export const createUUID = () => randomUUID();

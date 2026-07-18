export const isValidNormalizeValue = (value: unknown): boolean => {
    return value !== undefined && !Object.is(value, NaN);
};

const normalize = (obj: unknown) => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (obj instanceof Date) {
        return obj;
    }
    return normalizeObject(obj);
};

/**
 * 规范化对象的所有字段值
 *
 * @param input 输入对象
 * @returns 规范化后的对象
 *
 * @example
 * normalizeObject({
 *   name: 'test',
 *   age: undefined,
 *   description: '',
 *   address: ['sh', undefined, null, 'bj'],
 *   profile: { gender: undefined, birthdate: '2020-01-01', hobbies: null },
 *   parentId: null
 * })
 * // { name: 'test', description: '', address: ['sh', null, 'bj'], profile: { birthdate: '2020-01-01', hobbies: null }, parentId: null }
 */
export function normalizeObject<T extends object>(input: T): T {
    if (Array.isArray(input)) {
        return input.reduce((sum, item) => {
            if (isValidNormalizeValue(item)) {
                sum.push(normalize(item));
            }
            return sum;
        }, [] as T);
    }
    const result: any = {};
    for (const [key, value] of Object.entries(input)) {
        if (isValidNormalizeValue(value)) {
            result[key] = normalize(value);
        }
    }
    return result;
}

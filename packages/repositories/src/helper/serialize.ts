import { serialize } from '@mikro-orm/core';
import { isPlainObject } from 'lodash-es';

export const isSerializedValue = (value: unknown): boolean => {
    const type = typeof value;
    if (
        value === null ||
        type === 'symbol' ||
        type === 'undefined' ||
        type === 'string' ||
        type === 'number' ||
        type === 'boolean'
    ) {
        return true;
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return true;
        }
        return isSerializedValue(value[0]);
    }
    return isPlainObject(value);
};

export const serializeEntity = <T extends object = any>(entity: T): unknown => {
    if (isSerializedValue(entity)) {
        return entity;
    }
    return serialize(entity, { populate: ['*' as any] });
};

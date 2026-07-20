import { readFileSync } from 'fs';

export const readJSON = (filePath: string) => {
    const file = readFileSync(filePath, 'utf-8');
    return JSON.parse(file);
};

export const getFileName = (filePath: string) => {
    return filePath.split('/').pop();
};

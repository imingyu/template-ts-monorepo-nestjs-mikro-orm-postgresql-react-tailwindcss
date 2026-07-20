declare namespace NodeJS {
    interface ProcessEnv {
        /** 环境类型,dev,test,prod */
        ENV_TYPE: 'dev' | 'test' | 'prod';
        DB_TYPE: 'postgresql' | 'mysql';
        DB_NAME: string;
        DB_HOST: string;
        DB_PORT: string;
        DB_USERNAME: string;
        DB_PASSWORD: string;
    }
}

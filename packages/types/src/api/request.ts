/** 请求基础信息 */
export interface IApiRequestBasic {
    /** 发送请求时对应的时间戳 */
    ts: number;
}

export interface IApiRequest<T = any> {
    /** 请求基础信息 */
    basic: IApiRequestBasic;
    /** 请求的核心数据 */
    data: T;
}
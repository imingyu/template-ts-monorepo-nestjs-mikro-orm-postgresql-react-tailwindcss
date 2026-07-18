/** API服务响应成功对象 */
export interface IApiResponseSuccess<T = any> {
    success: true;
    result: T;
}
/** API服务响应异常对象 */
export interface IApiResponseError {
    success: false;
    message: string;
}

/** API服务响应对象 */
export type IApiResponse<T = any> = IApiResponseSuccess<T> | IApiResponseError;

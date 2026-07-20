/** 个人资料性别的公开取值。 */
export type UserProfileGender = 'female' | 'male' | 'unspecified';

/** 用户资料仓储对外返回的稳定记录结构。 */
export interface UserProfileRecord {
    id: string;
    userId: string;
    gender: UserProfileGender;
    birthday: Date | null;
    avatarUrl: string | null;
    email: string | null;
    createdAt: Date;
    updatedAt: Date | null;
}

/** 新建资料时的字段；每个用户最多只有一条资料记录。 */
export interface CreateUserProfileInput {
    userId: string;
    gender?: UserProfileGender;
    birthday?: Date | null;
    avatarUrl?: string | null;
    email?: string | null;
}

/** 资料更新白名单。 */
export interface UpdateUserProfileInput {
    userId: string;
    patch: {
        gender?: UserProfileGender;
        birthday?: Date | null;
        avatarUrl?: string | null;
        email?: string | null;
    };
}
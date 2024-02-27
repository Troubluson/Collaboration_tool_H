export interface IUserContext {
    userId: string | null;
};

export interface IUser {
    id: string;
    nickName: string;
    isActive: boolean; //Can also be status: "active|inactive|offline if needed"

};

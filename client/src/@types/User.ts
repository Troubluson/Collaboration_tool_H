export interface IUser {
  id: string;
  username: string;
  isActive: boolean; // Can also be status: "active|inactive|offline if needed"
}

export interface IUserContext {
  user: IUser | null;
  setUser: (user: IUser) => void;
}

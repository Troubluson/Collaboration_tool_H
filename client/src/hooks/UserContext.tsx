import { ReactNode, createContext, useContext, useState } from 'react';
import { IUser, IUserContext } from '../@types/User';
import Login from '../components/Login/Login';

export const UserContext = createContext<IUserContext>({
  user: null,
  setUser: () => {},
});
export const useUser = (): IUserContext => useContext(UserContext);

interface Props {
  children: ReactNode;
}

export const UserProvider = ({ children }: Props) => {
  const [user, setUser] = useState<IUser | null>(null);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
      }}
    >
      {user ? children : <Login />}
    </UserContext.Provider>
  );
};

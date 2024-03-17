import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { IUser, IUserContext } from '../@types/User';
import Login from '../components/Login/Login';
import { pingLatency } from '../components/Diagnostics/Measurement';

export const UserContext = createContext<IUserContext>({
  user: null,
  setUser: () => {},
  logout: () => {},
});
export const useUser = (): IUserContext => useContext(UserContext);

interface Props {
  children: ReactNode;
}

export const UserProvider = ({ children }: Props) => {
  const [user, setUser] = useState<IUser | null>(null);

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    pingLatency(user.id);
    //Ping every 30s
    setInterval(() => pingLatency(user.id), 30000);
  }, [user]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        logout,
      }}
    >
      {user ? children : <Login />}
    </UserContext.Provider>
  );
};

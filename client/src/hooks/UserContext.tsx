import { ReactNode, createContext, useContext, useState } from 'react';
import { IUserContext } from '../@types/User';
import { v4 as uuidv4 } from 'uuid';

export const UserContext = createContext<IUserContext>({
  userId: null,
});
export const useUser = (): IUserContext => useContext(UserContext);

interface Props {
  children: ReactNode;
}

export const UserProvider = ({ children }: Props) => {
  const [userId, _setUserId] = useState<string>(uuidv4());

  return (
    <UserContext.Provider
      value={{
        userId,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

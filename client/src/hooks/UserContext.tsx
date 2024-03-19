import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { IUser, IUserContext } from '../@types/User';
import Login from '../components/Login/Login';
import useWebSocket from 'react-use-websocket';
import { WS_BASE_URL } from '../config';
import { reportLatency } from '../components/Diagnostics/Measurement';

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

  const { sendJsonMessage, readyState } = useWebSocket(`${WS_BASE_URL}/latency`, {
    onOpen: () => console.log('websocket opened'),
    shouldReconnect: () => false,
    onMessage: ({ data }) => {
      if (!user) return;
      const end_time = new Date();
      const start_time = new Date(JSON.parse(data).data.start_time);
      const latency = Number(end_time) - Number(new Date(start_time));
      reportLatency(user.id, latency);
    },
  });

  useEffect(() => {
    if (!user || !readyState) return;
    //Ping every 15s
    setInterval(
      () =>
        sendJsonMessage({
          event: 'ping',
          data: { start_time: new Date() },
        }),
      15000,
    );
  }, [user, readyState]);

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

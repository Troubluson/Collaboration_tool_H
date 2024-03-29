import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { IUser, IUserContext } from '../@types/User';
import Login from '../components/Login/Login';
import useWebSocket from 'react-use-websocket';
import { BASE_URL, WS_BASE_URL } from '../config';
import { reportLatency } from '../components/Diagnostics/Measurement';
import throughput_test from '../throughput_test.mp4';
import { message } from 'antd';
import apiClient from '../api/apiClient';

export const UserContext = createContext<IUserContext>({
  user: null,
  setUser: () => {},
  logout: () => {},
  measureThroughput: () => ({} as any),
  downloadThroughput: null,
  uploadThroughput: null,
});
export const useUser = (): IUserContext => useContext(UserContext);

interface Props {
  children: ReactNode;
}

export const UserProvider = ({ children }: Props) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [downloadThroughput, setDownloadThroughput] = useState<number | null>(null);
  const [uploadThroughput, setUploadThroughput] = useState<number | null>(null);

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const { sendJsonMessage, readyState } = useWebSocket(
    `${WS_BASE_URL}/latency/${user?.id ?? ''}`,
    {
      onOpen: () => console.log('websocket opened'),
      shouldReconnect: () => true,
      onMessage: ({ data }) => {
        const end_time = new Date();
        if (!user) return;
        const message = JSON.parse(data);
        const start_time = new Date(message.data.start_time);
        const latency = Number(end_time) - Number(new Date(start_time));
        reportLatency(user.id, latency);
      },
    },
  );

  const measureThroughput = async () => {
    try {
      const download_start = new Date();
      const file = await fetch(throughput_test + `?cache=${new Date()}`, {
        cache: 'no-cache',
      });
      const download_end = new Date();
      const size = Number(file.headers.get('content-length'));
      const blob = await file.blob();

      const formData = new FormData();
      formData.append('file', blob);
      formData.append('start_time', String(new Date().getTime()));

      const { data } = await apiClient.postForm('/throughput', formData);

      const upload = Number(Number(data.upload_throughput).toFixed(2));
      const ms = download_end.getTime() - download_start.getTime();
      const seconds = ms / 1000;
      const MB = size / 1000000;
      const download = Number((MB / seconds).toFixed(2));

      setUploadThroughput(upload);
      setDownloadThroughput(download);
    } catch (error) {
      message.error('Failed to measure throughput');
    }
  };

  useEffect(() => {
    if (!user || !readyState) return;
    // Send initial ping
    sendJsonMessage({
      event: 'ping',
      data: { start_time: new Date() },
    });
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
        measureThroughput,
        downloadThroughput,
        uploadThroughput,
      }}
    >
      {user ? children : <Login />}
    </UserContext.Provider>
  );
};

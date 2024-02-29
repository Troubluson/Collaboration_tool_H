import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { IChannelContext, IChannel } from '../@types/Channel';
import axios from 'axios';
import { useUser } from './UserContext';

const serverBaseURL = 'http://localhost:8000';

export const ChannelContext = createContext<IChannelContext>({
  joinedChannels: [],
  availableChannels: [],
  currentChannel: null,
  joinChannel: () => void 0,
  leaveChannel: () => void 0,
  setChannel: () => void 0,
});
export const useChannel = (): IChannelContext => useContext(ChannelContext);

interface Props {
  children: ReactNode;
}

export const ChannelProvider = ({ children }: Props) => {
  const { user } = useUser();
  const [joinedChannels, setJoinedChannels] = useState<IChannel[]>([]);
  const [availableChannels, setAvailableChannels] = useState<IChannel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<IChannel | null>(null);

  const joinChannel = (channel: IChannel) => {
    setJoinedChannels([...joinedChannels, channel]);
    setAvailableChannels(
      availableChannels.filter((ch) => ch.id != channel.id),
    );
  };

  const leaveChannel = (channel: IChannel) => {
    setAvailableChannels([...availableChannels, channel]);
    setJoinedChannels(joinedChannels.filter((ch) => ch.id != channel.id));
  };

  const setChannel = (channel: IChannel) => setCurrentChannel(channel);

  const fetchChannels = async () => {
    const { data } = await axios.get<IChannel[]>(`${serverBaseURL}/channels`);
    setAvailableChannels(data.filter((channel) => channel.users.every((u) => u.id !== user?.id)));
    setJoinedChannels(data.filter((channel) => channel.users.some((u) => u.id === user?.id)))
  }

  useEffect(() => {
    fetchChannels();
  }, [user?.id]);

  return (
    <ChannelContext.Provider
      value={{
        joinedChannels,
        availableChannels,
        joinChannel,
        leaveChannel,
        currentChannel,
        setChannel,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
};

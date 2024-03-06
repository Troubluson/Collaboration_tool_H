import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { IChannelContext, IChannel } from '../@types/Channel';
import axios from 'axios';
import { useUser } from './UserContext';
import { IUser } from '../@types/User';

const serverBaseURL = 'http://localhost:8000';

export const ChannelContext = createContext<IChannelContext>({
  joinedChannels: [],
  availableChannels: [],
  currentChannel: null,
  joinChannel: () => {},
  leaveChannel: () => {},
  setChannel: () => {},
  userJoinChannel: () => {},
  userLeaveChannel: () => {},
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
    setAvailableChannels(availableChannels.filter((ch) => ch.id != channel.id));
  };

  const leaveChannel = async () => {
    if (!currentChannel) return;
    axios.post<IChannel>(`${serverBaseURL}/channels/${currentChannel.id}/leave`, user);
    setAvailableChannels([...availableChannels, currentChannel]);
    setJoinedChannels(joinedChannels.filter((ch) => ch.id != currentChannel.id));
    setCurrentChannel(null);
  };

  const setChannel = (channel: IChannel) => setCurrentChannel({ ...channel, users: [] });

  const fetchChannels = async () => {
    const { data } = await axios.get<IChannel[]>(`${serverBaseURL}/channels`);
    setAvailableChannels(
      data.filter((channel) => channel.users.every((u) => u.id !== user?.id)),
    );
    setJoinedChannels(
      data.filter((channel) => channel.users.some((u) => u.id === user?.id)),
    );
  };

  const updateChannelUserList = (user: IUser, action: 'join' | 'leave') => {
    if (!currentChannel) return;
    const users = currentChannel.users;
    if (action === 'join') {
      setCurrentChannel({ ...currentChannel, users: [...users, user] });
    } else {
      setCurrentChannel({
        ...currentChannel,
        users: users.filter((e) => e.id !== user.id),
      });
    }
  };

  const userJoinChannel = (user: IUser) => {
    updateChannelUserList(user, 'join');
  };

  const userLeaveChannel = (user: IUser) => {
    updateChannelUserList(user, 'leave');
  };

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
        userJoinChannel,
        userLeaveChannel,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
};

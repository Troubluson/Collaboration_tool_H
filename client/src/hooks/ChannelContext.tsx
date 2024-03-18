import { ReactNode, createContext, useContext, useMemo, useState } from 'react';
import { IChannelContext, IChannel, CreateChannelRequest } from '../@types/Channel';
import { useUser } from './UserContext';
import { IUser } from '../@types/User';
import apiClient from '../api/apiClient';
import { message } from 'antd';
import { update } from 'lodash';

export const ChannelContext = createContext<IChannelContext>({
  channels: [],
  joinedChannels: [],
  availableChannels: [],
  currentChannel: null,
  joinExistingChannel: () => {},
  createChannel: () => {},
  leaveChannel: () => {},
  setCurrentChannel: () => {},
  setChannels: () => {},
  userJoinChannel: () => {},
  userLeaveChannel: () => {},
  updateUserStatus: () => {},
  channelCreated: () => {},
  channelDeleted: () => {},
});
export const useChannel = (): IChannelContext => useContext(ChannelContext);

interface Props {
  children: ReactNode;
}

export const ChannelProvider = ({ children }: Props) => {
  const { user } = useUser();
  const [channels, setChannels] = useState<IChannel[]>([]);
  const availableChannels = useMemo(
    () => channels.filter((ch) => ch.users.every((u) => u.id !== user?.id)),
    [channels],
  );
  const joinedChannels = useMemo(
    () => channels.filter((ch) => ch.users.some((u) => u.id === user?.id)),
    [channels],
  );
  const [currentChannel, setCurrentChannel] = useState<IChannel | null>(null);

  const updateChannel = (channel: IChannel) => {
    const index = channels.findIndex((e) => e.id === channel.id);
    if (index === -1) message.error('Channel does not exist');
    const newChannelList = [...channels];
    newChannelList[index] = channel;
    setChannels(newChannelList);
  };

  const joinExistingChannel = async (channel: IChannel) => {
    try {
      const { data } = await apiClient.post<IChannel>(
        `/channels/${channel.id}/join`,
        user,
      );
      updateChannel(data);
      setCurrentChannel(data);
    } catch (error) {
      message.error(`Could not join channel:\n ${(error as Error).message}`);
    }
  };

  const createChannel = async (name: string) => {
    try {
      const { data: channel } = await apiClient.post<IChannel>(`/channels`, {
        name,
        userId: user?.id,
      } as CreateChannelRequest);
      const newChannelList = [...channels];
      newChannelList.push(channel);
      setChannels(newChannelList);
      setCurrentChannel(channel);
    } catch (error) {
      message.error(`Could not create channel:\n ${(error as Error).message}`);
    }
  };
  const leaveChannel = async () => {
    if (!currentChannel) return;
    try {
      const res = await apiClient.post<IChannel>(
        `/channels/${currentChannel.id}/leave`,
        user,
      );
      updateChannel(res.data);
      setCurrentChannel(null);
    } catch (error) {
      message.error(`Could not leave channel:\n ${(error as Error).message}`);
    }
  };

  const channelCreated = (channel: IChannel) => {
    // Channel already seen (created by user) - ignore event
    if (channels.some((e) => e.id === channel.id)) return;

    const newChannelList = [...channels];
    newChannelList.push(channel);
    setChannels(newChannelList);
  };

  const channelDeleted = (channel: IChannel) => {
    const newChannelList = [...channels];
    const index = newChannelList.findIndex((e) => e.id === channel.id);
    newChannelList.splice(index, 1);
    setChannels(newChannelList);
  };

  const setChannel = (channel: IChannel) => setCurrentChannel({ ...channel, users: [] });

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

  const updateUserStatus = (user: IUser) => {
    if (!currentChannel) return;
    const users = [...currentChannel.users];
    const index = users.findIndex((e) => e.id === user.id);
    if (index === -1) return; // User no longer part of channel
    users[index].isActive = user.isActive;
    setCurrentChannel({ ...currentChannel, users });
  };

  return (
    <ChannelContext.Provider
      value={useMemo(
        () => ({
          channels,
          setChannels,
          joinedChannels,
          availableChannels,
          joinExistingChannel,
          createChannel,
          leaveChannel,
          currentChannel,
          setCurrentChannel: setChannel,
          userJoinChannel,
          userLeaveChannel,
          updateUserStatus,
          channelCreated,
          channelDeleted,
        }),
        [joinedChannels, availableChannels, currentChannel],
      )}
    >
      {children}
    </ChannelContext.Provider>
  );
};

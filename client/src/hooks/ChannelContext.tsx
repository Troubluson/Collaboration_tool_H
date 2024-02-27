import { ReactNode, createContext, useContext, useState } from 'react';
import { IChannelContext, IChannel } from '../@types/Channel';

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

const mockJoinedChannels: IChannel[] = [
  { channelId: '1', channelName: 'Your Channel 1' },
  { channelId: '2', channelName: 'Your Channel 2' },
  { channelId: '3', channelName: 'Your Channel 3' },
];

const mockAvailableChannels: IChannel[] = [
  { channelId: '4', channelName: 'Channel 4' },
  { channelId: '5', channelName: 'Channel 5' },
  { channelId: '6', channelName: 'Channel 6' },
];

export const ChannelProvider = ({ children }: Props) => {
  const [joinedChannels, setJoinedChannels] = useState<IChannel[]>(mockJoinedChannels);
  const [availableChannels, setAvailableChannels] =
    useState<IChannel[]>(mockAvailableChannels);
  const [currentChannel, setCurrentChannel] = useState<IChannel | null>(null);

  const joinChannel = (channel: IChannel) => {
    setJoinedChannels([...joinedChannels, channel]);
    setAvailableChannels(
      availableChannels.filter((ch) => ch.channelId != channel.channelId),
    );
  };

  const leaveChannel = (channel: IChannel) => {
    setAvailableChannels([...availableChannels, channel]);
    setJoinedChannels(joinedChannels.filter((ch) => ch.channelId != channel.channelId));
  };

  const setChannel = (channel: IChannel) => setCurrentChannel(channel);

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

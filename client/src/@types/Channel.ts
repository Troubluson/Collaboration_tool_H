export interface IChannel {
    channelName: string;
    channelId: number;
}

export interface IChannelContext {
    availableChannels: IChannel[];
    joinedChannels: IChannel[];
    currentChannel: IChannel | null;
    setChannel: (channel: IChannel) => void;
    joinChannel: (channel: IChannel) => void;
    leaveChannel: (channel: IChannel) => void;
};

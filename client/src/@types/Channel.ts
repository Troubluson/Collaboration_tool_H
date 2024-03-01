import { IUser } from './User';

export interface IChannel {
    id: string;
    name: string;
    users: IUser[];
}

export interface IChannelContext {
    availableChannels: IChannel[];
    joinedChannels: IChannel[];
    currentChannel: IChannel | null;
    setChannel: (channel: IChannel) => void;
    joinChannel: (channel: IChannel) => void;
    leaveChannel: (channel: IChannel) => void;
};

export interface CreateChannelRequest {
    name: string;
    userId: string;

}

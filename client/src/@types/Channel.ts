import { IMessage } from './Message';
import { IUser } from './User';

export interface IChannel {
  id: string;
  name: string;
  users: IUser[];
}

type IChannelEvents = 'new_message' | 'user_join' | 'user_leave';

export interface IChannelEvent {
  type: IChannelEvents;
  content: IUser | IMessage;
}

export interface IChannelContext {
  availableChannels: IChannel[];
  joinedChannels: IChannel[];
  currentChannel: IChannel | null;
  setChannel: (channel: IChannel) => void;
  joinChannel: (channel: IChannel) => void;
  leaveChannel: () => void;
  userJoinChannel: (user: IUser) => void;
  userLeaveChannel: (user: IUser) => void;
}

export interface CreateChannelRequest {
  name: string;
  userId: string;
}

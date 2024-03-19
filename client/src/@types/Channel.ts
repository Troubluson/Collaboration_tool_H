import { ICollaborativeDocument } from './CollaborativeDocument';
import { IMessage } from './Message';
import { IUser } from './User';

export interface IChannel {
  id: string;
  name: string;
  users: IUser[];
  events: IChannelEvent[];
}

type IChannelEvents =
  | 'channel_sync'
  | 'new_message'
  | 'user_join'
  | 'user_leave'
  | 'user_status_change'
  | 'document_created'
  | 'document_deleted';

export interface IChannelEvent {
  type: IChannelEvents;
  content: IChannel | IUser | IMessage | ICollaborativeDocument;
}

type IChannelOperations = 'channel_sync' | 'channel_created' | 'channel_deleted';

export type IChannelOperationEvents =
  | {
    type: Omit<IChannelOperations, 'channel_sync'>;
    content: IChannel;
  }
  | {
    type: Extract<IChannelOperations, 'channel_sync'>;
    content: IChannel[];
  };

export interface IChannelContext {
  channels: IChannel[];
  availableChannels: IChannel[];
  joinedChannels: IChannel[];
  setChannels: (channels: IChannel[]) => void;
  currentChannel: IChannel | null;
  setCurrentChannel: (channel: IChannel) => void;
  joinExistingChannel: (channel: IChannel) => void;
  createChannel: (channe: string) => void;
  leaveChannel: () => void;
  userJoinChannel: (user: IUser) => void;
  userLeaveChannel: (user: IUser) => void;
  updateUserStatus: (user: IUser) => void;
  channelCreated: (channel: IChannel) => void;
  channelDeleted: (channel: IChannel) => void;
}

export interface CreateChannelRequest {
  name: string;
  userId: string;
}

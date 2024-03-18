import { IUser } from './User';

export interface IMessage {
  id: string;
  content: string;
  file?: string;
  sender: IUser;
  channelId: string;
}

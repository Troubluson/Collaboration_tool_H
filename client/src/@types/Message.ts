import { IUser } from './User';

export interface IMessage {
  id: string;
  content: string;
  sender: IUser;
  channelId: string;
}

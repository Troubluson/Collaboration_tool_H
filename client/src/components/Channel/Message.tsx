import { useUser } from '../../hooks/UserContext';

export interface IMessage {
  id: string;
  content: string;
  senderId: string;
  channelId: string;
}

interface Props {
  message: IMessage;
}

const Message = ({ message }: Props) => {
  const { user } = useUser();

  const isFromSelf = message.senderId === user?.id;
  return (
    <div
      id="message-row"
      style={{
        width: '100%',
      }}
    >
      <div
        id="message-bubble"
        style={{
          maxWidth: '30vw',
          background: isFromSelf ? 'yellow' : 'teal',
          borderRadius: '0.4em',
          padding: '1em',
          margin: '1em',
          width: '15em',
          float: isFromSelf ? 'left' : 'right',
        }}
      >
        {message.content}
      </div>
    </div>
  );
};

export default Message;

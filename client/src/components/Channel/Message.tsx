import { Avatar, Button } from 'antd';
import { IMessage } from '../../@types/Message';
import { useUser } from '../../hooks/UserContext';
import { DownloadOutlined } from '@ant-design/icons';
import { BASE_URL } from '../../config';

interface Props {
  message: IMessage;
}

const textColor = '#a6aaae';

const Message = ({ message }: Props) => {
  const { user } = useUser();

  const isFromSelf = message.sender.id === user?.id;
  return (
    <div
      id="message-row"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isFromSelf ? 'flex-start' : 'flex-end',
      }}
    >
      <Avatar
        src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${message.sender.id}`}
        shape="circle"
        style={{ backgroundColor: textColor }}
        gap={1}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          flexDirection: 'column',
        }}
      >
        <p
          style={{
            alignSelf: 'flex-start',
            marginBottom: '0.25em',
            marginLeft: '1em',
            fontSize: '12px',
            fontWeight: 'lighter',
          }}
        >
          {message.sender.username}
        </p>
        <div
          id="message-bubble"
          style={{
            maxWidth: '30vw',
            background: isFromSelf ? 'yellow' : 'teal',
            borderRadius: '0.4em',
            padding: '0.75em',
            margin: '0.75em',
            marginTop: 0,
            paddingTop: '0.5em',
            width: 'fit-content',
            wordBreak: 'break-word',
            float: isFromSelf ? 'left' : 'right',
            overflowX: 'hidden',
          }}
        >
          {message.file ? (
            <Button
              type="text"
              icon={<DownloadOutlined rev={undefined} />}
              style={{ padding: 0, width: '100%', wordBreak: 'break-word' }}
              size="small"
              href={`${BASE_URL}/file/${message.file}`}
              target="_blank"
            >
              {message.content}
            </Button>
          ) : (
            message.content
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;

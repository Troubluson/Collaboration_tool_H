import { Flex, Layout, Typography, theme, message, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Message from './Message';
import MessageInput from './MessageInput';
import { useChannel } from '../../hooks/ChannelContext';
import { useUser } from '../../hooks/UserContext';
import { IMessage } from '../../@types/Message';
import { IChannelEvent } from '../../@types/Channel';
import { IUser } from '../../@types/User';
import { ErrorResponse } from '../../@types/ErrorResponse';
import { ApiOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Header, Content } = Layout;

const serverBaseURL = 'http://localhost:8000';
const Channel = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const { currentChannel, userJoinChannel, userLeaveChannel, updateUserStatus } =
    useChannel();
  const { user } = useUser();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newEvent, setNewEvent] = useState<IChannelEvent | null>(null);

  const onMessageSent = async (messageToSend: string) => {
    try {
      if (!currentChannel?.id || !user) return;
      const newMessage: Partial<IMessage> = {
        content: messageToSend,
        sender: user,
        channelId: currentChannel.id,
      };
      await axios.post<IMessage>(`${serverBaseURL}/channel/message`, newMessage);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response) {
        const responseError = e.response?.data?.detail as ErrorResponse;
        message.error(`${responseError.type}: ${responseError.reason}`);
      } else {
        message.error((e as Error).message);
      }
    }
  };

  const handleChannelEvents = (event: IChannelEvent) => {
    // Temporarily save new incoming messages to separate state to avoid message list resetting
    setNewEvent(event);
  };

  useEffect(() => {
    if (!newEvent) return;
    switch (newEvent.type) {
      case 'new_message':
        setMessages([...messages, newEvent.content as IMessage]);
        break;
      case 'user_join':
        userJoinChannel(newEvent.content as IUser);
        break;
      case 'user_leave':
        userLeaveChannel(newEvent.content as IUser);
        break;
      case 'user_status_change':
        updateUserStatus(newEvent.content as IUser);
        break;
      default:
        console.error('Unrecognized event', newEvent);
        break;
    }
  }, [newEvent]);

  useEffect(() => {
    setMessages([]);
    let eventSource: EventSource | null = null;
    if (!currentChannel || !user?.id) return;
    try {
      eventSource = new EventSource(
        `${serverBaseURL}/stream/${currentChannel.id}?user_id=${user?.id}`,
      );
      eventSource.onmessage = (e) => {
        handleChannelEvents(JSON.parse(e.data));
      };

      eventSource.onerror = (e) => {
        eventSource?.close();
      };
    } catch (error) {
      eventSource?.close();
      console.error('error', 'An unexpected error has occured', error);
    }
    return () => {
      eventSource?.close();
    };
  }, [currentChannel?.id, user?.id]);

  if (!currentChannel) {
    return <ChannelHeader />;
  }

  return (
    <>
      <ChannelHeader channelName={currentChannel.name} />
      <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
        <Flex
          vertical
          justify="space-between"
          style={{
            padding: 24,
            textAlign: 'center',
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: '85vh',
          }}
        >
          <Content
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '75vh',
              overflowY: 'auto',
              marginBottom: '1em',
            }}
          >
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </Content>
          <MessageInput onSend={onMessageSent} />
        </Flex>
      </Content>
    </>
  );
};
export default Channel;

interface HeaderProps {
  channelName?: string;
}

const ChannelHeader = ({ channelName }: HeaderProps) => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const { currentChannel, leaveChannel } = useChannel();
  return (
    <Header style={{ padding: 0, background: colorBgContainer }}>
      <Flex justify="space-between" align="center" style={{ marginInline: '2rem' }}>
        <Title level={2}>{channelName ?? 'Select A Channel From the Sidebar'}</Title>
        {currentChannel && (
          <Button
            type="primary"
            shape="round"
            icon={<ApiOutlined rev={undefined} />}
            size="middle"
            onClick={leaveChannel}
          >
            Leave Channel
          </Button>
        )}
      </Flex>
    </Header>
  );
};

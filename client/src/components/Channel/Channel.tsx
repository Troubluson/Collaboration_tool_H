import { Flex, Layout, Typography, theme } from 'antd';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Message, { IMessage } from './Message';
import MessageInput from './MessageInput';
import { useChannel } from '../../hooks/ChannelContext';
import { useUser } from '../../hooks/UserContext';
import UserList from '../Userlist/Userlist';

const { Title } = Typography;
const { Header, Content } = Layout;

const serverBaseURL = 'http://localhost:8000';

const Channel = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const { currentChannel } = useChannel();
  const { userId } = useUser();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState<IMessage | null>(null);

  const onMessageSent = (message: string) => {
    if (!currentChannel?.channelId || !userId) return;
    const newMessage: Partial<IMessage> = {
      content: message,
      senderId: userId,
      channelId: currentChannel.channelId,
    };
    axios.post<IMessage>(`${serverBaseURL}/channel/message`, newMessage);
  };

  const updateMessages = (message: IMessage) => {
    // Temporarily save new incoming messages to separate state to avoid message list resetting
    setNewMessage(message);
  };

  useEffect(() => {
    if (!newMessage) return;
    setMessages([...messages, newMessage]);
  }, [newMessage]);

  useEffect(() => {
    setMessages([]);
    let eventSource: EventSource | null = null;
    if (!currentChannel) return;
    try {
      eventSource = new EventSource(
        `${serverBaseURL}/stream/${currentChannel.channelId}`,
      );
      eventSource.onmessage = (e) => {
        updateMessages(JSON.parse(e.data));
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch (error) {
      eventSource?.close();
      console.error('error', 'An unexpected error has occured', error);
    }
    return () => {
      eventSource?.close();
    };
  }, [currentChannel, currentChannel?.channelId]);

  if (!currentChannel) {
    return <ChannelHeader />;
  }

  return (
    <>
      <ChannelHeader channelName={currentChannel.channelName} />
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
  return (
    <Header style={{ padding: 0, background: colorBgContainer }}>
      <Title level={2}>{channelName ?? 'Select A Channel From the Sidebar'}</Title>
    </Header>
  );
};

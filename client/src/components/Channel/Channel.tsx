import { Flex, Layout, Typography, theme } from 'antd';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Message, { IMessage } from './Message';
import MessageInput from './MessageInput';
import { IChannel } from '../../@types/Channel';
import { useChannel } from '../../hooks/ChannelContext';

const { Title } = Typography;
const { Header, Content } = Layout;

const serverBaseURL = 'http://localhost:8000';

const Channel = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { currentChannel } = useChannel();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState<IMessage | null>(null);

  const onMessageSent = async (message: string) => {
    if (!currentChannel?.channelId) return;
    const newMessage: Partial<IMessage> = {
      content: message,
      senderId: '1',
      channelId: currentChannel.channelId,
    };
    const sentMessage = await axios.post<IMessage>(
      `${serverBaseURL}/channel/message`,
      newMessage,
    );
    setMessages([...messages, sentMessage.data]);
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
    return (
      <Header style={{ padding: 0, background: colorBgContainer }}>
        <Title level={2}>Select A Channel From the Sidebar</Title>
      </Header>
    );
  }

  return (
    <>
      <Header style={{ padding: 0, background: colorBgContainer }}>
        <Title level={2}>{currentChannel?.channelName}</Title>
      </Header>
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

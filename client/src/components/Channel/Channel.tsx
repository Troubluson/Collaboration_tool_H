import { Flex, Layout, Typography, theme } from 'antd';
import React, { useEffect, useState } from 'react';
import Message, { IMessage } from './Message';
import MessageInput from './MessageInput';
import { IChannel } from '../../@types/Channel';
import { useChannel } from '../../hooks/ChannelContext';

const { Title } = Typography;
const { Header, Content } = Layout;

const initialMessages: IMessage[] = Array.from({ length: 5 }, (_, index) => ({
  content: 'Mesasge ' + index,
  senderId: (Math.floor(Math.random() * 10) % 2).toString(),
}));

const Channel = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { currentChannel } = useChannel();

  useEffect(() => {
    //Fetch messages for channel
  }, [currentChannel]);
  const [messages, setMessages] = useState(initialMessages);

  const onMessageSent = (message: string) => {
    const newMessage: IMessage = {
      content: message,
      senderId: '1',
    };
    setMessages([...messages, newMessage]);
  };
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
          {messages.map((message) => (
            <Message message={message} />
          ))}
          <MessageInput onSend={onMessageSent} />
        </Flex>
      </Content>
    </>
  );
};
export default Channel;

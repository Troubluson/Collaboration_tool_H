import { Flex, Layout, Typography, Tabs, theme, message, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { useChannel } from '../../hooks/ChannelContext';
import { useUser } from '../../hooks/UserContext';
import { IMessage } from '../../@types/Message';
import { IChannel, IChannelEvent } from '../../@types/Channel';
import { IUser } from '../../@types/User';
import { ApiOutlined } from '@ant-design/icons';
import MessageInput from './MessageInput';
import Message from './Message';
import CollaborativeDocumentTab from '../CollaborativeDocument/CollaborativeDocumentTab';
import { RcFile } from 'antd/es/upload';
import apiClient from '../../api/apiClient';
import { BASE_URL } from '../../config';

const { Title } = Typography;
const { Header, Content } = Layout;

const Channel = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const {
    currentChannel,
    setCurrentChannel,
    userJoinChannel,
    userLeaveChannel,
    updateUserStatus,
  } = useChannel();
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
      await apiClient.post<IMessage>(`/channel/message`, newMessage);
    } catch (error) {
      message.error(`Could not send message:\n ${(error as Error).message}`);
    }
  };

  const onFileSend = async (file: RcFile) => {
    try {
      if (!user?.id || !currentChannel?.id) return;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('senderId', user.id);
      formData.append('channelId', currentChannel.id);
      await apiClient.postForm('/channel/file', formData);
    } catch (error) {
      message.error(`Could not send file:\n ${(error as Error).message}`);
    }
  };

  const handleChannelEvents = (event: IChannelEvent) => {
    // Temporarily save new incoming messages to separate state to avoid message list resetting
    setNewEvent(event);
  };

  useEffect(() => {
    if (!newEvent) return;
    switch (newEvent.type) {
      case 'channel_sync':
        const channel = newEvent.content as IChannel;
        setCurrentChannel(channel);
        const messageEvents = channel.events
          .filter((e) => e.type === 'new_message')
          .map((e) => e.content as IMessage);
        setMessages(messageEvents);
        break;
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
      case 'document_created':
        break;
      case 'document_deleted':
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
        `${BASE_URL}/stream/${currentChannel.id}?user_id=${user?.id}`,
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
  const chat = (
    <Flex
      vertical
      justify="space-between"
      style={{
        padding: 24,
        textAlign: 'center',
        background: colorBgContainer,
        borderRadius: borderRadiusLG,
        maxHeight: '84vh',
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
      <MessageInput onSend={onMessageSent} onFileSend={onFileSend} />
    </Flex>
  );

  return (
    <>
      <ChannelHeader channelName={currentChannel.name} />
      <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: 'chat',
              label: 'chat',
              children: chat,
            },
            {
              key: 'docs',
              label: 'docs',
              children: (
                <CollaborativeDocumentTab
                  documentEvent={
                    ['document_created', 'document_deleted'].includes(
                      newEvent?.type ?? '',
                    )
                      ? newEvent
                      : null
                  }
                />
              ),
            },
          ]}
        />
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

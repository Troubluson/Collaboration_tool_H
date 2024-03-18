import { AppstoreOutlined, PlusCircleOutlined, TeamOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import {
  Button,
  Flex,
  Input,
  Layout,
  Menu,
  Modal,
  Space,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';

import { Logo } from '../Logo/Logo';
import { useChannel } from '../../hooks/ChannelContext';
import { useUser } from '../../hooks/UserContext';
import {
  CreateChannelRequest,
  IChannel,
  IChannelOperationEvents,
} from '../../@types/Channel';
import apiClient from '../../api/apiClient';
import { BASE_URL } from '../../config';

const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key?: React.Key | null,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const SideBar = () => {
  const {
    joinedChannels,
    availableChannels,
    setChannels,
    setCurrentChannel,
    joinExistingChannel,
    createChannel,
    channelCreated,
    channelDeleted,
  } = useChannel();
  const { user, logout } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [channelOpsEvent, setChannelOpsEvent] = useState<IChannelOperationEvents | null>(
    null,
  );

  const items: MenuProps['items'] = [
    getItem(
      'Your Channels',
      'A',
      <TeamOutlined rev={undefined} />,
      joinedChannels.map((channel) => getItem(channel.name, channel.id)),
    ),
    getItem(
      'Available Channels',
      'B',
      <AppstoreOutlined rev={undefined} />,
      availableChannels.map((channel) => getItem(channel.name, channel.id)),
    ),
    getItem('Create Channel', 'C', <PlusCircleOutlined rev={undefined} />),
  ];

  // WIP
  const onItemSelect: MenuProps['onSelect'] = ({ key }) => {
    if (key === 'C') {
      setIsModalOpen(true);
      return;
    }
    const availableChannelIndex = availableChannels
      .map((channel) => channel.id)
      .indexOf(key);
    if (availableChannelIndex !== -1) {
      const channel = availableChannels[availableChannelIndex];
      joinExistingChannel(channel);
      return;
    }
    const channel = joinedChannels.find((channel) => channel.id === key);
    channel && setCurrentChannel(channel);
  };

  const onChannelCreate = () => {
    if (!name) {
      message.error('Channel name is required');
      return;
    }
    createChannel(name);
    setIsModalOpen(false);
    setName('');
  };

  const handleChannelEvents = (event: IChannelOperationEvents) => {
    switch (event.type) {
      case 'channel_sync':
        setChannels(event.content as IChannel[]);
        break;
      case 'channel_created':
        channelCreated(event.content as IChannel);
        break;
      case 'channel_deleted':
        channelDeleted(event.content as IChannel);
        break;
      default:
        console.error('Unrecognized event', event.type);
    }
  };

  useEffect(() => {
    if (!channelOpsEvent) return;
    handleChannelEvents(channelOpsEvent);
  }, [channelOpsEvent]);

  useEffect(() => {
    setChannels([]);
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${BASE_URL}/channels`);
      eventSource.onmessage = (e) => {
        setChannelOpsEvent(JSON.parse(e.data));
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
  }, [user?.id]);

  return (
    <Sider
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
      }}
    >
      <Flex style={{ alignItems: 'center' }}>
        <Logo />
        <Typography>Collaboration tool</Typography>
      </Flex>
      <Menu
        theme="dark"
        mode="inline"
        defaultOpenKeys={['A', 'B']}
        onSelect={onItemSelect}
        items={items}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          paddingLeft: '2rem',
          width: '100%',
          display: 'flex',
        }}
      >
        <Space size={20}>
          <Typography
            style={{
              color: 'whitesmoke',
              fontSize: '18px',
              fontWeight: 'bold',
              alignSelf: 'baseline',
            }}
          >
            {user?.username}
          </Typography>
          <Button ghost danger size="small" onClick={logout}>
            Logout
          </Button>
        </Space>
      </div>

      <Modal
        title="Create Channel"
        open={isModalOpen}
        okButtonProps={{ disabled: !name }}
        onOk={onChannelCreate}
        onCancel={() => setIsModalOpen(false)}
      >
        <Input
          placeholder="Channel Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Modal>
    </Sider>
  );
};

export default SideBar;

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
import { IChannel, IChannelOperationEvents } from '../../@types/Channel';
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
    currentChannel,
    setChannels,
    setCurrentChannel,
    joinExistingChannel,
    createChannel,
    channelCreated,
    channelDeleted,
  } = useChannel();
  const { user, logout, measureThroughput, downloadThroughput, uploadThroughput } =
    useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [channelOpsEvent, setChannelOpsEvent] = useState<IChannelOperationEvents | null>(
    null,
  );
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

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
  const onItemSelect: MenuProps['onSelect'] = ({ key, selectedKeys }) => {
    if (key === 'C') {
      setIsModalOpen(true);
      return;
    }
    setSelectedKeys(selectedKeys);
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

  const closeModal = () => {
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

  // Prevent menu item not being selectable despite not active
  useEffect(() => {
    if (currentChannel?.id) {
      setSelectedKeys([currentChannel.id]);
    } else {
      setSelectedKeys([]);
    }
  }, [currentChannel]);

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
        selectedKeys={selectedKeys}
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
      <div
        style={{
          position: 'absolute',
          bottom: '5rem',
          paddingInline: '1.5rem',
          width: '100%',
          display: 'flex',
        }}
      >
        <Flex justify="center" vertical>
          <Flex style={{ marginBottom: '0.5rem' }}>
            <Typography
              style={{
                color: 'whitesmoke',
                fontSize: '12px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginRight: '1rem',
                textWrap: 'nowrap',
              }}
            >
              Throughput
            </Typography>
            <Button ghost size="small" onClick={measureThroughput}>
              Measure
            </Button>
          </Flex>
          <Flex vertical>
            <Flex justify="space-between" style={{ paddingInline: '1rem' }}>
              <Typography
                style={{
                  color: 'whitesmoke',
                  fontSize: '10px',
                }}
              >
                Upload
              </Typography>
              {uploadThroughput && (
                <Typography
                  style={{
                    color: 'whitesmoke',
                    fontSize: '10px',
                  }}
                >
                  {uploadThroughput} MB/s
                </Typography>
              )}
            </Flex>
            <Flex justify="space-between" style={{ paddingInline: '1rem' }}>
              <Typography
                style={{
                  color: 'whitesmoke',
                  fontSize: '10px',
                }}
              >
                Download
              </Typography>
              {downloadThroughput && (
                <Typography
                  style={{
                    color: 'whitesmoke',
                    fontSize: '10px',
                  }}
                >
                  {downloadThroughput} MB/s
                </Typography>
              )}
            </Flex>
          </Flex>
        </Flex>
      </div>

      <Modal
        title="Create Channel"
        open={isModalOpen}
        okButtonProps={{ disabled: !name }}
        onOk={onChannelCreate}
        onCancel={closeModal}
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

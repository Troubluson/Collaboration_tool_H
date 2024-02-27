import { AppstoreOutlined, PlusCircleOutlined, TeamOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Flex, Layout, Menu, Space, Typography } from 'antd';
import React, { useEffect } from 'react';

import { Logo } from '../Logo/Logo';
import { useChannel } from '../../hooks/ChannelContext';
import { useUser } from '../../hooks/UserContext';

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
  const { availableChannels, joinedChannels, setChannel, joinChannel } = useChannel();
  const { user, logout } = useUser();

  const items: MenuProps['items'] = [
    getItem(
      'Your Channels',
      'A',
      <TeamOutlined rev={undefined} />,
      joinedChannels.map((channel) => getItem(channel.channelName, channel.channelId)),
    ),
    getItem(
      'Available Channels',
      'B',
      <AppstoreOutlined rev={undefined} />,
      availableChannels.map((channel) => getItem(channel.channelName, channel.channelId)),
    ),
    getItem('Create Channel', 'C', <PlusCircleOutlined rev={undefined} />),
  ];

  // WIP
  const onItemSelect: MenuProps['onSelect'] = ({ key }) => {
    const availableChannelIndex = availableChannels
      .map((channel) => channel.channelId)
      .indexOf(key);
    if (availableChannelIndex !== -1) {
      const channel = availableChannels[availableChannelIndex];
      joinChannel(channel);
      setChannel(channel);
      return;
    }
    const channel = joinedChannels.find((channel) => channel.channelId === key);
    channel && setChannel(channel);
  };

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
    </Sider>
  );
};

export default SideBar;

import {
  AppstoreOutlined,
  BarChartOutlined,
  CloudOutlined,
  PlusCircleOutlined,
  ShopOutlined,
  TeamOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu, Typography } from 'antd';
import React, { useState } from 'react';

import { Logo } from '../Logo/Logo';
import { useChannel } from '../../hooks/ChannelContext';

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
      <div
        className="demo-logo-vertical"
        style={{ display: 'flex', color: 'white', alignItems: 'center' }}
      >
        <Logo />
        <Typography>Collaboration tool</Typography>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        defaultOpenKeys={['A', 'B']}
        onSelect={onItemSelect}
        items={items}
      />
    </Sider>
  );
};

export default SideBar;

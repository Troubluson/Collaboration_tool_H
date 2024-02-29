import { AppstoreOutlined, PlusCircleOutlined, TeamOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Flex, Form, Input, Layout, Menu, Modal, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

import { Logo } from '../Logo/Logo';
import { useChannel } from '../../hooks/ChannelContext';
import { useUser } from '../../hooks/UserContext';
import axios from 'axios';
import { IChannel } from '../../@types/Channel';

const serverBaseURL = 'http://localhost:8000';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');

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
      joinChannel(channel);
      setChannel(channel);
      return;
    }
    const channel = joinedChannels.find((channel) => channel.id === key);
    channel && setChannel(channel);
  };

  const createChannel = async () => {
    const res = await axios.post<IChannel>(`${serverBaseURL}/channels`, { name, users: [user] });
    joinChannel(res.data);
    setIsModalOpen(false);
  }

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

      <Modal title="Create Channel" open={isModalOpen} okButtonProps={{ disabled: !name }} onOk={createChannel} onCancel={() => setIsModalOpen(false)}>
        <Input placeholder='Channel Name' value={name} onChange={(e) => setName(e.target.value)} />
      </Modal>
    </Sider >
  );
};

export default SideBar;

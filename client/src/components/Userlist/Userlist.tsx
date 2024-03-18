import Sider from 'antd/es/layout/Sider';
import { IUser } from '../../@types/User';
import { useUser } from '../../hooks/UserContext';
import { Avatar, List, Tooltip, message, theme } from 'antd';
import { CheckCircleTwoTone, MinusCircleTwoTone } from '@ant-design/icons';
import { useChannel } from '../../hooks/ChannelContext';
import Title from 'antd/es/typography/Title';
import axios from 'axios';
import { ILatencyMeasurement } from '../../@types/Measurement';
import { useEffect, useState } from 'react';
import apiClient from '../../api/apiClient';

const textColor = '#a6aaae';

const UserList = () => {
  const { user } = useUser();
  const { currentChannel } = useChannel();
  const users: IUser[] = currentChannel?.users || [];
  const [usersWithLatency, setUserWithLatency] = useState(users);
  const getStatusDescription = (user: IUser) => {
    let statusIcon = <MinusCircleTwoTone twoToneColor={'#cccccc'} rev={undefined} />;
    let statusText = 'Offline';
    if (user.isActive) {
      statusIcon = <CheckCircleTwoTone twoToneColor={'#34c300'} rev={undefined} />;
      statusText = 'Active';
    }
    return (
      <span>
        {statusIcon}&nbsp;{statusText}
      </span>
    );
  };

  useEffect(() => {
    getUserLatencies();
    setInterval(() => getUserLatencies(), 30000);
  }, [users]);

  const getUserLatencies = () => {
    if (!currentChannel || !users.length || !user) return;
    apiClient
      .get<ILatencyMeasurement[]>(`/channel/${currentChannel?.id}/latency`)
      .then((response) => response.data)
      .then((latencies) => {
        if (!currentChannel) return;
        const modifiedUsers: IUser[] = users.map((user) => {
          const latencyMeasurement = latencies.find(
            (measurement) => measurement.user_id === user.id,
          );
          return {
            ...user,
            latency: latencyMeasurement?.latency,
          };
        });
        setUserWithLatency(modifiedUsers);
      })
      .catch(() => console.error('Could not get user latencies'));
  };

  if (!currentChannel) {
    return null;
  }

  return (
    <Sider style={{ padding: '0 1rem' }}>
      <List
        header={
          <Title style={{ color: textColor, borderBlockEnd: '1px solid' }} level={4}>
            Users
          </Title>
        }
        itemLayout="horizontal"
        dataSource={usersWithLatency}
        renderItem={(u) => (
          <List.Item key={u.id} style={{ borderBlockEndColor: textColor }}>
            <List.Item.Meta
              avatar={
                <Avatar
                  src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${u.id}`}
                  shape="circle"
                  style={{ backgroundColor: textColor }}
                  gap={1}
                />
              }
              title={
                <Tooltip
                  color="blue"
                  title={`latency ${
                    u?.latency && u.isActive ? `${u.latency}ms` : '<not available>'
                  }`}
                >
                  <span style={{ color: textColor }}>
                    {u.id === user?.id ? `${u.username} (You)` : u.username}
                  </span>
                </Tooltip>
              }
              description={getStatusDescription(u)}
            />
          </List.Item>
        )}
      />
    </Sider>
  );
};

export default UserList;

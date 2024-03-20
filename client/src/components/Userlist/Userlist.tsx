import Sider from 'antd/es/layout/Sider';
import { IUser } from '../../@types/User';
import { useUser } from '../../hooks/UserContext';
import { Avatar, List } from 'antd';
import { CheckCircleTwoTone, MinusCircleTwoTone } from '@ant-design/icons';
import { useChannel } from '../../hooks/ChannelContext';
import Title from 'antd/es/typography/Title';
import { UserStatusTooltip } from './UserStatusTooltip';

const textColor = '#a6aaae';

const UserList = () => {
  const { user } = useUser();
  const { currentChannel } = useChannel();
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
        dataSource={currentChannel.users}
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
              title={<UserStatusTooltip user={u} currentUser={user} />}
              description={getStatusDescription(u)}
            />
          </List.Item>
        )}
      />
    </Sider>
  );
};

export default UserList;

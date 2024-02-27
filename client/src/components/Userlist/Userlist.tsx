import Sider from 'antd/es/layout/Sider';
import { IUser } from '../../@types/User';
import { useUser } from '../../hooks/UserContext';
import { Avatar, List, theme } from 'antd';
import { CheckCircleTwoTone, MinusCircleTwoTone } from '@ant-design/icons';
import { useChannel } from '../../hooks/ChannelContext';
import Title from 'antd/es/typography/Title';

const textColor = '#a6aaae';

const UserList = () => {
  //Get users either through props or useEffect, probably useEffect to update state

  const { userId } = useUser();
  const { currentChannel } = useChannel();
  const users: IUser[] = [
    { id: userId ?? '', isActive: true, nickName: 'You' },
    { id: '123', isActive: true, nickName: 'User123' },
    { id: '456', isActive: true, nickName: 'User456' },
    { id: '678', isActive: false, nickName: 'User678' },
  ];
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
        dataSource={users}
        renderItem={(user, index) => (
          <List.Item style={{ borderBlockEndColor: textColor }}>
            <List.Item.Meta
              avatar={
                <Avatar
                  src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`}
                  shape="circle"
                  style={{ backgroundColor: textColor }}
                  gap={1}
                />
              }
              title={<span style={{ color: textColor }}>{user.nickName}</span>}
              description={getStatusDescription(user)}
            />
          </List.Item>
        )}
      />
    </Sider>
  );
};

export default UserList;

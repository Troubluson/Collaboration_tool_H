import Sider from 'antd/es/layout/Sider';
import { IUser } from '../../@types/User';
import { useUser } from '../../hooks/UserContext';
import { Avatar, List, theme } from 'antd';
import { CheckCircleTwoTone, MinusCircleTwoTone } from '@ant-design/icons';
import { useChannel } from '../../hooks/ChannelContext';

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
    let statusIcon = <MinusCircleTwoTone twoToneColor={'#eeeeee'} rev={undefined} />;
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
    <Sider style={{ paddingTop: '2rem', paddingLeft: '1rem' }}>
      <List
        itemLayout="horizontal"
        dataSource={users}
        renderItem={(user, index) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Avatar
                  src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`}
                  shape="circle"
                  style={{ backgroundColor: '#a6aaae' }}
                  gap={1}
                />
              }
              title={<span style={{ color: '#a6aaae' }}>{user.nickName}</span>}
              description={getStatusDescription(user)}
            />
          </List.Item>
        )}
      />
    </Sider>
  );
};

export default UserList;

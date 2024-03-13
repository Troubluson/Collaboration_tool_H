import './index.css';

import { useEffect } from 'react';
import { ConfigProvider, Layout, theme } from 'antd';
import SideBar from './components/Sidebar/Sidebar';
import Channel from './components/Channel/Channel';
import { ChannelProvider } from './hooks/ChannelContext';
import { UserProvider, useUser } from './hooks/UserContext';
import UserList from './components/Userlist/Userlist';
import axios from 'axios';
import Test from './components/Diagnostics/Measurement';

const { Footer } = Layout;

const App = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#001529',
          colorTextDescription: '#a6aaae',
          borderRadius: 4,
        },
      }}
    >
      <Layout hasSider>
        <UserProvider>
          <ChannelProvider>
            <Test />
            <SideBar />
            <Layout style={{ marginLeft: 200, height: '100vh' }}>
              <Channel />
              <Footer style={{ textAlign: 'center' }}>Collaboration tool H</Footer>
            </Layout>
            <UserList />
          </ChannelProvider>
        </UserProvider>
      </Layout>
    </ConfigProvider>
  );
};

export default App;

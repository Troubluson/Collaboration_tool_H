import './index.css';

import { ConfigProvider, Layout, theme } from 'antd';
import React, { useState } from 'react';
import SideBar from './components/Sidebar/Sidebar';
import Channel from './components/Channel/Channel';
import { ChannelProvider } from './hooks/ChannelContext';

const { Header, Content, Footer, Sider } = Layout;

const App = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout hasSider>
      <ChannelProvider>
        <SideBar />
        <Layout style={{ marginLeft: 200, height: '100vh' }}>
          <Channel />
          <Footer style={{ textAlign: 'center' }}>Collaboration tool H</Footer>
        </Layout>
      </ChannelProvider>
    </Layout>
  );
};

export default App;

import './index.css';

import { Layout, theme } from 'antd';
import SideBar from './components/Sidebar/Sidebar';
import Channel from './components/Channel/Channel';
import { ChannelProvider } from './hooks/ChannelContext';
import { UserProvider } from './hooks/UserContext';

const { Footer } = Layout;

const App = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout hasSider>
      <UserProvider>
        <ChannelProvider>
          <SideBar />
          <Layout style={{ marginLeft: 200, height: '100vh' }}>
            <Channel />
            <Footer style={{ textAlign: 'center' }}>Collaboration tool H</Footer>
          </Layout>
        </ChannelProvider>
      </UserProvider>
    </Layout>
  );
};

export default App;

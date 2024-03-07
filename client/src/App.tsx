import './index.css';

import { useEffect } from 'react';
import { ConfigProvider, Layout, theme } from 'antd';
import SideBar from './components/Sidebar/Sidebar';
import Channel from './components/Channel/Channel';
import { ChannelProvider } from './hooks/ChannelContext';
import { UserProvider } from './hooks/UserContext';
import UserList from './components/Userlist/Userlist';
import axios from 'axios';

async function testLatencyAndThroughput(): Promise<void> {
  try {
    const startTime: number = new Date().getTime();
    const response: Response = await axios.get('http://localhost:8000/data');
    const endTime: number = new Date().getTime();

    if (!response.ok) {
      throw new Error(`HTTP error! status : ${response.status}`);
    }

    const latency: number = endTime - startTime;
    const size: number = parseInt(response.headers.get('Content-Length') || '0');
    const throughput: number = size / latency;

    console.log(`Latency: ${latency} ms`);
    console.log(`Throughput: ${throughput} bytes/ms`);

    // Post the result to the server
    const result: { latency: number; throughput: number } = { latency, throughput };
    await axios.post('http://localhost:8000/data', {
      result
    });
  } catch (error) {
    console.error('There was an error with the fetch operation: ', error);
  }
}

const { Footer } = Layout;

const App = () => {
  useEffect(() => {
    // Start the test when the component mounts (i.e., when the user logs in)
    testLatencyAndThroughput();

    // Repeat the test every 30 seconds
    const intervalId = setInterval(testLatencyAndThroughput, 30000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

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

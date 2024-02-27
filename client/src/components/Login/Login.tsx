import { Form, Input, Button, theme } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Content } from 'antd/es/layout/layout';
import axios from 'axios';
import { IUser } from '../../@types/User';
import { useUser } from '../../hooks/UserContext';
import { useEffect } from 'react';

const serverBaseURL = 'http://localhost:8000';

const Login = () => {
  const {
    token: { colorBgContainer, borderRadiusLG, paddingLG },
  } = theme.useToken();

  const { setUser } = useUser();

  const onFinish = async ({ username }: Partial<IUser>) => {
    const { data } = await axios.post<IUser>(`${serverBaseURL}/login`, { username });
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <Content
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Form
        initialValues={{
          remember: true,
        }}
        onFinish={onFinish}
        style={{
          backgroundColor: colorBgContainer,
          paddingInline: paddingLG,
          paddingTop: paddingLG,
          borderRadius: borderRadiusLG,
        }}
      >
        <Form.Item
          name="username"
          rules={[
            {
              required: true,
              message: 'Please input your Username!',
            },
          ]}
        >
          <Input prefix={<UserOutlined rev={undefined} />} placeholder="Username" />
        </Form.Item>
        <Form.Item style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" htmlType="submit">
            Log in
          </Button>
        </Form.Item>
      </Form>
    </Content>
  );
};

export default Login;

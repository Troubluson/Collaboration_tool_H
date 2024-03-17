import { Form, Input, Button, theme, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Content } from 'antd/es/layout/layout';
import axios from 'axios';
import { IUser } from '../../@types/User';
import { useUser } from '../../hooks/UserContext';
import { useEffect } from 'react';
import { ErrorResponse } from '../../@types/ErrorResponse';
import apiClient from '../../api/apiClient';

const serverBaseURL = 'http://localhost:8000';

const Login = () => {
  const {
    token: { colorBgContainer, borderRadiusLG, paddingLG },
  } = theme.useToken();

  const { setUser, logout } = useUser();

  const onFinish = async ({ username }: Partial<IUser>) => {
    try {
      const { data } = await apiClient.post<IUser>(`/login`, { username });
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch (error) {
      message.error(`Login failed:\n ${(error as Error).message}`);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user: IUser = {
        ...JSON.parse(savedUser),
        isActive: true,
      };
      apiClient
        .post<IUser>(`/login_existing`, user)
        .then(() => setUser(user))
        .catch(() => {
          message.error(`Could not log in ${user.username} automically`);
          logout();
        });
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

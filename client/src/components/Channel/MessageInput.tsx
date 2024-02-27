import { Button, Flex, Form } from 'antd';
import { useState } from 'react';

interface Props {
  onSend: (message: string) => void;
}

const MessageInput = ({ onSend }: Props) => {
  const [message, setMessage] = useState('');
  //Usercontext

  const onFinish = () => {
    onSend(message);
    setMessage('');
  };
  return (
    <Form onFinish={onFinish} className="send-message">
      <Flex>
        <input
          style={{
            flexGrow: 1,
          }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button
          style={{
            flexGrow: 0,
          }}
          type="primary"
          htmlType="submit"
        >
          Send
        </Button>
      </Flex>
    </Form>
  );
};

export default MessageInput;

import { UploadOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Upload } from 'antd';
import { useState } from 'react';
import { RcFile } from 'antd/es/upload';

interface Props {
  onSend: (message: string) => void;
  onFileSend: (file: RcFile) => void;
}

const MessageInput = ({ onSend, onFileSend }: Props) => {
  const [message, setMessage] = useState('');

  const onFinish = () => {
    onSend(message);
    setMessage('');
  };

  return (
    <Form onFinish={onFinish} className="send-message">
      <Flex>
        <Upload
          name="file"
          fileList={[]}
          style={{ maxHeight: '2vh' }}
          multiple={false}
          customRequest={({ file }) => onFileSend(file as RcFile)}
        >
          <Button
            type="primary"
            shape="circle"
            icon={<UploadOutlined rev={undefined} />}
            size="middle"
          />
        </Upload>
        <input
          style={{
            flexGrow: 1,
            marginLeft: '1rem',
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

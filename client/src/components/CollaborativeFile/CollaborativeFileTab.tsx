import axios from 'axios';
import { useEffect, useState } from 'react';
import { useChannel } from '../../hooks/ChannelContext';
import { ICollaborativeFile } from '../../@types/CollaborativeFile';
import { Button, Flex, Input, Modal, Typography } from 'antd';
import CollaborativeFile from './CollaborativeFile';

const serverBaseURL = 'http://localhost:8000';

const CollaborativeFileTab = () => {
  const { currentChannel } = useChannel();
  const [files, setFiles] = useState<ICollaborativeFile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [openFile, setOpenFile] = useState<string | null>(null);

  useEffect(() => {
    if (!currentChannel) {
      console.log('No channel');
      return;
    }
    axios
      .get<ICollaborativeFile[]>(
        `${serverBaseURL}/channels/${currentChannel.id}/collaborate`,
      )
      .then((res) => setFiles(res.data))
      .catch(console.error);
  }, [currentChannel]);

  const createNewFile = async () => {
    if (!currentChannel) {
      console.log('No channel');
      return;
    }
    const res = await axios.post<ICollaborativeFile>(
      `${serverBaseURL}/channels/${currentChannel?.id}/collaborate`,
      {
        name: newFileName,
      },
    );
    if (res.data) {
      setFiles([...files, res.data]);
      setIsModalOpen(false);
    }
  };
  useEffect(() => {
    setFiles([]);
    setOpenFile(null);
  }, [currentChannel]);

  return (
    <>
      {files.length ? (
        <Flex>
          {files.map((file) => (
            <Button key={file.id} onClick={() => setOpenFile(file.id)}>
              {file.name}
            </Button>
          ))}
        </Flex>
      ) : (
        <Typography>No files created yet for this channel</Typography>
      )}
      <Button onClick={() => setIsModalOpen(true)}>Create new file</Button>
      {openFile && <CollaborativeFile documentId={openFile} />}
      <Modal
        title="Create Channel"
        open={isModalOpen}
        okButtonProps={{ disabled: !newFileName }}
        onOk={createNewFile}
        onCancel={() => setIsModalOpen(false)}
      >
        <Input
          placeholder="Document Name"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
        />
      </Modal>
    </>
  );
};

export default CollaborativeFileTab;

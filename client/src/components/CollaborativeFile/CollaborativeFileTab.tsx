import axios from 'axios';
import { useEffect, useState } from 'react';
import { useChannel } from '../../hooks/ChannelContext';
import { ICollaborativeFile } from '../../@types/CollaborativeFile';
import { Button, Flex, Input, Modal, Space, Typography, message } from 'antd';
import CollaborativeFile from './CollaborativeFile';
import { IChannelEvent } from '../../@types/Channel';

const serverBaseURL = `${window.location.host}`;

interface Props {
  documentEvent: IChannelEvent | null;
}

const CollaborativeFileTab = ({ documentEvent }: Props) => {
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
      .get<ICollaborativeFile[]>(`/channels/${currentChannel.id}/collaborate`)
      .then((res) => setFiles(res.data))
      .catch(console.error);
  }, [currentChannel]);

  const createNewFile = async () => {
    if (!currentChannel) {
      console.log('No channel');
      return;
    }
    const res = await axios.post<ICollaborativeFile>(
      `/channels/${currentChannel?.id}/collaborate`,
      {
        name: newFileName,
      },
    );
    if (res.data) {
      setIsModalOpen(false);
    }
  };
  useEffect(() => {
    setFiles([]);
    setOpenFile(null);
  }, [currentChannel]);

  useEffect(() => {
    switch (documentEvent?.type) {
      case 'document_deleted':
        const documentId = (documentEvent.content as ICollaborativeFile).id;
        setFiles(files.filter((file) => file.id !== documentId));
        if (openFile === documentId) {
          setOpenFile(null);
          message.warning(`File was deleted`);
        }
        break;
      case 'document_created':
        setFiles([...files, documentEvent.content as ICollaborativeFile]);
        break;
      default:
        break;
    }
  }, [documentEvent]);

  return (
    <>
      {!openFile && (
        <>
          {files.length ? (
            <Flex>
              <Space>
                {files.map((file) => (
                  <Button key={file.id} onClick={() => setOpenFile(file.id)} size="large">
                    {file.name}
                  </Button>
                ))}
              </Space>
            </Flex>
          ) : (
            <Typography>No files created yet for this channel</Typography>
          )}
          <Button
            shape="round"
            style={{ marginTop: '1rem' }}
            onClick={() => setIsModalOpen(true)}
          >
            Create new file
          </Button>
        </>
      )}
      {openFile && (
        <CollaborativeFile
          documentId={openFile}
          documentName={files.find((file) => file.id === openFile)?.name ?? ''}
          onClose={() => setOpenFile(null)}
          onDelete={() => {
            /*todo*/
          }}
        />
      )}
      <Modal
        title="Create Document"
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

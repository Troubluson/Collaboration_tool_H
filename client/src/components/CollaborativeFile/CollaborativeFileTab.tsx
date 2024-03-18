import { useEffect, useState } from 'react';
import { useChannel } from '../../hooks/ChannelContext';
import { ICollaborativeFile } from '../../@types/CollaborativeFIle';
import { Button, Flex, Input, Modal, Space, Typography, message } from 'antd';
import CollaborativeFile from './CollaborativeFile';
import { IChannelEvent } from '../../@types/Channel';
import apiClient from '../../api/apiClient';

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
    apiClient
      .get<ICollaborativeFile[]>(`/channels/${currentChannel.id}/collaborate`)
      .then((res) => setFiles(res.data))
      .catch((error) => message.error(`Could not get files:\n ${error.message}`));
  }, [currentChannel?.id]);

  const createNewFile = async () => {
    if (!currentChannel) {
      console.log('No channel');
      return;
    }
    try {
      const { data } = await apiClient.post<ICollaborativeFile>(
        `/channels/${currentChannel?.id}/collaborate`,
        {
          name: newFileName,
        },
      );
      setIsModalOpen(false);
    } catch (error) {
      message.error(`Could not create document:\n ${(error as Error).message}`);
    }
  };
  useEffect(() => {
    setFiles([]);
    setOpenFile(null);
  }, [currentChannel?.id]);

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

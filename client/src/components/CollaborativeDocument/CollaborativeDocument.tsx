import { useState, useEffect, ChangeEvent, useRef, useMemo, useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useChannel } from '../../hooks/ChannelContext';
import {
  IChangeMessage,
  ISyncMessage,
  IErrorMessage,
  IWebSocketMessage,
  Operation,
} from '../../@types/CollaborativeDocument';
import _ from 'lodash';
import TextArea, { TextAreaRef } from 'antd/es/input/TextArea';
import { useUser } from '../../hooks/UserContext';
import { Button, Flex, Popconfirm, Typography, message } from 'antd';
import { CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import apiClient from '../../api/apiClient';
import { WS_BASE_URL } from '../../config';

interface Props {
  documentId: string | null;
  documentName: string;
  onClose: () => void;
  onDelete: () => void;
}

const CollaborativeDocument = ({
  documentId,
  documentName,
  onClose,
  onDelete,
}: Props) => {
  const [originalContent, setOriginalContent] = useState<string>('');
  const [currentContent, setCurrentContent] = useState<string>('');
  const [revision, setRevision] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(false);
  const { currentChannel } = useChannel();
  const { user } = useUser();
  const textareaRef = useRef<null | TextAreaRef>(null);
  const path = `/channels/${currentChannel?.id}/collaborate/${documentId}`;

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    `${WS_BASE_URL}${path}`,
    {
      onOpen: () => console.log('websocket opened'),
      shouldReconnect: (closeEvent) => false,
    },
  );

  const deleteDocument = useCallback(() => {
    apiClient
      .delete(path)
      .then(onDelete)
      .catch((error) =>
        message.error(`Could not delete document:\n ${(error as Error).message}`),
      );
  }, [currentChannel?.id]);

  useEffect(() => {
    if (lastJsonMessage) {
      const websocketMessage: IWebSocketMessage = JSON.parse(lastJsonMessage);
      switch (websocketMessage.event) {
        case 'sync_document':
          const syncMessage = websocketMessage as ISyncMessage;
          setCurrentContent(syncMessage.data.content);
          setOriginalContent(syncMessage.data.content);
          setRevision(syncMessage.data.revision);
          break;
        case 'change':
          const changeMessage = websocketMessage as IChangeMessage;
          handleChange(changeMessage.data.operation);
          setRevision(changeMessage.data.revision);
          break;
        case 'error':
          const errorMessage = websocketMessage as IErrorMessage;
          message.error(errorMessage.data.reason);
          break;
        default:
          break;
      }
    }
  }, [lastJsonMessage]);

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      setRevision(0);
      setCurrentContent('');
      sendJsonMessage({
        event: 'sync_document',
        data: {},
      });
    }
  }, [readyState]);

  const handleChange = useMemo(
    () => (operation: Operation) => {
      let text = originalContent;
      let cursorPos = cursorPosition;
      if (operation.type === 'insert') {
        const firstSlice = originalContent.slice(0, operation.index) + operation.text;
        const secondSlice = originalContent.slice(operation.index);
        text = firstSlice + secondSlice;
        cursorPos = cursorPos + (operation.index < cursorPos ? operation.text.length : 0);
      } else if (operation.type === 'delete') {
        const firstSlice = originalContent.slice(0, operation.index);
        const secondSlice = originalContent.slice(
          operation.index + operation.text.length,
        );
        text = firstSlice + secondSlice;
        cursorPos = cursorPos - (operation.index < cursorPos ? operation.text.length : 0);
      }
      const newCursorPos = Math.max(cursorPos, 0);
      if (text !== currentContent) {
        console.log(newCursorPos);
        setCursorPosition(newCursorPos);
        setCurrentContent(text);
        setForceUpdate(true);
      }
      setOriginalContent(text);
    },
    [lastJsonMessage],
  );
  useEffect(() => {
    if (textareaRef.current?.resizableTextArea && forceUpdate) {
      textareaRef.current.resizableTextArea.textArea.setSelectionRange(
        cursorPosition,
        cursorPosition,
      );
    }
    setForceUpdate(false);
  }, [cursorPosition, forceUpdate]);

  const handleInputChange = ({ target }: ChangeEvent<HTMLTextAreaElement>): void => {
    const textArea = textareaRef.current?.resizableTextArea?.textArea;
    if (!textArea) {
      console.error('no ref to textarea');
      return;
    }
    const newContent: string = target.value;
    const selectionStart = textArea.selectionStart;
    const index = selectionStart;
    const changeLength = newContent.length - currentContent.length;
    const absChangeLen = Math.abs(changeLength);
    const isInsert = changeLength > 0;
    let changeStart = index - absChangeLen;
    if (!isInsert) {
      changeStart = index;
    }

    const stringToTakeChangeFrom = changeLength > 0 ? newContent : currentContent;
    const change = stringToTakeChangeFrom.substring(
      changeStart,
      changeStart + absChangeLen,
    );

    const message = {
      event: 'change',
      data: {
        operation: {
          type: isInsert ? 'insert' : 'delete',
          index: changeStart,
          userId: user?.id ?? '',
          text: change,
        } as Operation,
        revision: revision + 1,
      },
    } as IChangeMessage;
    setRevision(revision + 1);
    sendJsonMessage(message);
    setCurrentContent(newContent);
  };

  return (
    <div>
      <div>
        <Flex justify="space-between" align="center" style={{ marginInline: '2rem' }}>
          <h1>{documentName}</h1>

          {currentChannel &&
            useMemo(
              () => (
                <div>
                  <Button
                    type="primary"
                    shape="default"
                    icon={<CloseOutlined rev={undefined} />}
                    size="middle"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                  <Popconfirm
                    title={`delete ${documentName}?`}
                    description={
                      'are you sure you want to delete the document? This operation cannot be reversed'
                    }
                    onConfirm={deleteDocument}
                  >
                    <Button
                      type="primary"
                      shape="default"
                      icon={<DeleteOutlined rev={undefined} />}
                      danger
                      size="middle"
                    >
                      Delete
                    </Button>
                  </Popconfirm>
                </div>
              ),
              [currentChannel, documentId],
            )}
        </Flex>
      </div>
      {useMemo(
        () => (
          <>
            {readyState !== ReadyState.OPEN && (
              <Typography>Not connected to document</Typography>
            )}
            <TextArea
              key={documentId}
              rows={10}
              cols={50}
              value={currentContent}
              disabled={readyState !== ReadyState.OPEN}
              onChange={handleInputChange}
              ref={textareaRef}
              onSelect={({ currentTarget }) =>
                setCursorPosition(currentTarget.selectionStart)
              }
            />
          </>
        ),
        [readyState, currentContent],
      )}
    </div>
  );
};

export default CollaborativeDocument;

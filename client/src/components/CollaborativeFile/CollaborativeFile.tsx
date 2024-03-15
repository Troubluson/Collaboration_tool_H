import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useChannel } from '../../hooks/ChannelContext';
import {
  IChangeMessage,
  IDocumentMessage,
  IEditMessage,
  IWebSocketMessage,
  Operation,
} from '../../@types/CollaborativeFile';
import _ from 'lodash';
import TextArea, { TextAreaRef } from 'antd/es/input/TextArea';
import { useUser } from '../../hooks/UserContext';
import { Button, Flex, Popconfirm, message } from 'antd';
import { CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface Props {
  documentId: string | null;
  documentName: string;
  onClose: () => void;
  onDelete: () => void;
}

const CollaborativeFile = ({ documentId, documentName, onClose, onDelete }: Props) => {
  const [currentContent, setCurrentContent] = useState<string>('');
  const [revision, setRevision] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const { currentChannel } = useChannel();
  const [lastOperation, setLastOperation] = useState<Operation | null>(null);
  const [lastCursorPosition, setLastCursorPosition] = useState<number>(cursorPosition);
  const [lastContent, setLastContent] = useState('');
  const { user } = useUser();
  const textareaRef = useRef<null | TextAreaRef>(null);
  const baseUrl = `localhost:8000/channels/${currentChannel?.id}/collaborate/${documentId}`;

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    `ws://${baseUrl}`,
    {
      onOpen: () => console.log('websocket opened'),
      shouldReconnect: (closeEvent) => false,
    },
  );

  const deleteDocument = () => {
    axios.delete(`http://${baseUrl}`).then(onDelete).catch(console.error); //Todo better error handling
  };

  useEffect(() => {
    if (lastJsonMessage) {
      const message: IWebSocketMessage = JSON.parse(lastJsonMessage);
      if (message.event === 'document') {
        const syncMessage = message as IDocumentMessage;
        setCurrentContent(syncMessage.data.content);
        setLastContent(syncMessage.data.content);
        setRevision(syncMessage.data.revision);
      }
      if (message.event === 'change') {
        const changeMessage = message as IChangeMessage;
        handleChange(changeMessage.data.operation);
        setRevision(changeMessage.data.revision ?? revision);
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

  const handleOperation = (operation: Operation): [string, number] => {
    let text = lastContent;
    let cursorPos = cursorPosition;
    if (operation.type === 'insert') {
      const firstSlice = lastContent.slice(0, operation.index) + operation.text;
      const secondSlice = lastContent.slice(operation.index);
      text = firstSlice + secondSlice;
      cursorPos = cursorPos + operation.text.length;
    } else if (operation.type === 'delete') {
      const firstSlice = lastContent.slice(0, operation.index);
      const secondSlice = lastContent.slice(operation.index + operation.text.length);
      text = firstSlice + secondSlice;
      cursorPos = cursorPos - (operation.index < cursorPos ? operation.text.length : 0);
    }
    return [text, cursorPos];
  };

  const handleChange = (operation: Operation) => {
    if (
      operation.text === lastOperation?.text &&
      operation.index === lastOperation.index
    ) {
      return;
    } else {
    }
  };

  useEffect(() => {
    //if (!isTypingRef.current) {
    const textArea = textareaRef.current?.resizableTextArea?.textArea;
    textArea?.setSelectionRange(cursorPosition, cursorPosition);
    //}
  }, [cursorPosition]);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    if (!textareaRef.current?.resizableTextArea) {
      console.error('no ref to textarea');
      return;
    }
    const newContent: string = e.target.value;
    console.log(newContent);
    const selectionStart =
      textareaRef.current.resizableTextArea?.textArea.selectionStart ?? 0;
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
    const operation = {
      type: isInsert ? 'insert' : 'delete',
      index: changeStart,
      userId: user?.id ?? '',
      revision: revision + 1,
      text: change,
    } as Operation;

    const [text, cursorPos] = handleOperation(operation);
    setCursorPosition(cursorPos);
    setCurrentContent(text);
    setLastContent(text);
    setLastOperation(operation);

    const message = {
      event: 'edit',
      data: operation,
    } as IEditMessage;
    sendJsonMessage(message);
  };

  return (
    <div>
      <div>
        <Flex justify="space-between" align="center" style={{ marginInline: '2rem' }}>
          <h1>{documentName}</h1>

          {currentChannel && (
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
          )}
        </Flex>
        <TextArea
          rows={10}
          cols={50}
          value={currentContent}
          disabled={readyState !== ReadyState.OPEN}
          onChange={handleInputChange}
          ref={textareaRef}
          onKeyUp={() =>
            setCursorPosition(
              textareaRef.current?.resizableTextArea?.textArea.selectionStart ??
                cursorPosition,
            )
          }
        />
      </div>
    </div>
  );
};

export default CollaborativeFile;

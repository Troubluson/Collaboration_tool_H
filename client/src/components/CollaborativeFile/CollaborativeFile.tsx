import React, { useState, useEffect, ChangeEvent, useCallback, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useChannel } from '../../hooks/ChannelContext';
import {
  IChangeMessage,
  IEditMessage,
  ISyncMessage,
  IWebSocketMessage,
  Operation,
} from '../../@types/CollaborativeFile';
import _ from 'lodash';
import TextArea, { TextAreaRef } from 'antd/es/input/TextArea';
import { useUser } from '../../hooks/UserContext';

interface Props {
  documentId: string | null;
}

const CollaborativeFile = ({ documentId }: Props) => {
  const [originalContent, setOriginalContent] = useState<string>('');
  const [currentContent, setCurrentContent] = useState<string>('');
  const [revision, setRevision] = useState(0);
  const [locked, setLocked] = useState<boolean>(false);
  const { currentChannel } = useChannel();
  const { user } = useUser();
  const textareaRef = useRef<null | TextAreaRef>(null);

  const { sendJsonMessage, lastJsonMessage, readyState, getWebSocket } = useWebSocket(
    `ws://localhost:8000/channels/${currentChannel?.id}/collaborate/${documentId}`,
    {
      onOpen: () => console.log('websocket opened'),
      shouldReconnect: (closeEvent) => false,
    },
  );

  useEffect(() => {
    if (lastJsonMessage) {
      const message: IWebSocketMessage = JSON.parse(lastJsonMessage);
      if (message.event === 'sync_document') {
        const syncMessage = message as ISyncMessage;
        setCurrentContent(syncMessage.data.content);
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
      console.log('sync');
      sendJsonMessage({
        event: 'sync_document',
        data: {},
      });
    }
  }, [readyState]);

  const handleChange = (operation: Operation) => {
    const cursorPos =
      textareaRef.current?.resizableTextArea?.textArea.selectionStart ?? 0;
    if (operation.type === 'insert') {
      const newContent = currentContent;
      const firstSlice = newContent.slice(0, operation.index) + operation.text;
      const secondSlice = newContent.slice(operation.index + 1);
      const newCursorPos =
        cursorPos + (operation.index < cursorPos ? operation.text.length : 0);
      textareaRef.current?.resizableTextArea?.textArea.setSelectionRange(
        newCursorPos,
        newCursorPos,
      );

      setCurrentContent(firstSlice + secondSlice);
    } else if (operation.type === 'delete') {
      const newContent = currentContent;
      console.log(operation);
      const firstSlice = newContent.slice(0, operation.index + 1);
      const secondSlice = newContent.slice(operation.index + operation.text.length);
      console.log(firstSlice + secondSlice);
      const newCursorPos =
        cursorPos - (operation.index < cursorPos ? operation.text.length : 0);

      textareaRef.current?.resizableTextArea?.textArea.setSelectionRange(
        newCursorPos,
        newCursorPos,
      );
      setCurrentContent(firstSlice + secondSlice);
    }
  };

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    if (!textareaRef.current?.resizableTextArea) {
      console.error('no ref to textarea');
      return;
    }
    const newContent: string = e.target.value;
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
    console.log(changeStart, changeStart + absChangeLen);
    const change = stringToTakeChangeFrom.substring(
      changeStart,
      changeStart + absChangeLen,
    );

    setCurrentContent(newContent);
    const message = {
      event: 'Edit',
      data: {
        type: isInsert ? 'insert' : 'delete',
        index: changeStart,
        userId: user?.id ?? '',
        revision: revision + 1,
        text: change,
      },
    } as IEditMessage;
    sendJsonMessage(message);
  };

  return (
    <div>
      <h1>Collaborative Text Document</h1>
      <TextArea
        rows={10}
        cols={50}
        value={currentContent}
        onChange={handleInputChange}
        ref={textareaRef}
      ></TextArea>
    </div>
  );
};

export default CollaborativeFile;

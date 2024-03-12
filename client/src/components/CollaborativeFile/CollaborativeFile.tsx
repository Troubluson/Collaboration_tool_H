import React, { useState, useEffect, ChangeEvent, useCallback, useRef } from 'react';
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
import { Button } from 'antd';

interface Props {
  documentId: string | null;
  documentName: string;
  onClose: () => void;
}

const CollaborativeFile = ({ documentId, documentName, onClose }: Props) => {
  const [originalContent, setOriginalContent] = useState<string>('');
  const [currentContent, setCurrentContent] = useState<string>('');
  const [revision, setRevision] = useState(0);
  const [locked, setLocked] = useState<boolean>(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const { currentChannel } = useChannel();
  const { user } = useUser();
  const textareaRef = useRef<null | TextAreaRef>(null);

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    `ws://localhost:8000/channels/${currentChannel?.id}/collaborate/${documentId}`,
    {
      onOpen: () => console.log('websocket opened'),
      shouldReconnect: (closeEvent) => false,
    },
  );
  useEffect(() => {
    if (lastJsonMessage) {
      const message: IWebSocketMessage = JSON.parse(lastJsonMessage);
      if (message.event === 'document') {
        const syncMessage = message as IDocumentMessage;
        setCurrentContent(syncMessage.data.content);
        setOriginalContent(syncMessage.data.content);
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
    let text = originalContent;
    let cursorPos = cursorPosition;
    if (operation.type === 'insert') {
      const firstSlice = originalContent.slice(0, operation.index) + operation.text;
      const secondSlice = originalContent.slice(operation.index);
      text = firstSlice + secondSlice;
      cursorPos = cursorPos + operation.text.length;
    } else if (operation.type === 'delete') {
      const firstSlice = originalContent.slice(0, operation.index);
      const secondSlice = originalContent.slice(operation.index + operation.text.length);
      text = firstSlice + secondSlice;
      cursorPos = cursorPos - (operation.index < cursorPos ? operation.text.length : 0);
    }
    setCursorPosition(cursorPos);
    setCurrentContent(text);
    setOriginalContent(text);
  };

  useEffect(() => {
    //if (!isTypingRef.current) {
    const textArea = textareaRef.current?.resizableTextArea?.textArea;
    console.log(cursorPosition);
    textArea?.focus();
    textArea?.setSelectionRange(cursorPosition, cursorPosition);
    //}
  }, [cursorPosition, currentContent, textareaRef]);

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
    const change = stringToTakeChangeFrom.substring(
      changeStart,
      changeStart + absChangeLen,
    );

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
      <div>
        <h1>
          {documentName} <Button onClick={onClose}>Close</Button>
        </h1>
      </div>
      <TextArea
        rows={10}
        cols={50}
        value={currentContent}
        onChange={handleInputChange}
        ref={textareaRef}
        onKeyUp={() =>
          setCursorPosition(
            textareaRef.current?.resizableTextArea?.textArea.selectionStart ??
              cursorPosition,
          )
        }
      ></TextArea>
    </div>
  );
};

export default CollaborativeFile;

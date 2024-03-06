import React, { useState, useEffect, ChangeEvent, useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useChannel } from '../../hooks/ChannelContext';
import { IWebSocketMessage } from '../../@types/CollaborativeFIle';

interface Props {
  documentId: string | null;
}

const CollaborativeFile = ({ documentId }: Props) => {
  const [originalContent, setOriginalContent] = useState<string>('');
  const [currentContent, setCurrentContent] = useState<string>('');
  const [lockedChunk, setLockedChunk] = useState<number | null>(null);
  const { currentChannel } = useChannel();

  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
    `ws://localhost:8000/channels/${currentChannel?.id}/collaborate/${documentId}`,
    {
      onOpen: () => console.log('websocket opened'),
      shouldReconnect: (closeEvent) => true,
    },
  );

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    const newContent: string = e.target.value;
    setCurrentContent(newContent);
    sendJsonMessage({
      event: 'Edit',
      data: {
        content: currentContent,
      },
    } as IWebSocketMessage);
    /*
    const chunkIndex: number = e.target.selectionStart || 0;

    if (lockedChunk === null) {
      // Lock the chunk
      setLockedChunk(chunkIndex);
      socket.emit('update_chunk', { index: chunkIndex, content: newContent });
    } else if (lockedChunk === chunkIndex) {
      // Update the chunk
      socket.emit('update_chunk', { index: chunkIndex, content: newContent });
    } else {
      // Do not update if the chunk is locked
      e.preventDefault();
      alert('This chunk is locked by another user.');
    }
    */
  };

  return (
    <div>
      <h1>Collaborative Text Document</h1>
      <textarea
        rows={10}
        cols={50}
        value={currentContent}
        onChange={handleInputChange}
      ></textarea>
    </div>
  );
};

export default CollaborativeFile;

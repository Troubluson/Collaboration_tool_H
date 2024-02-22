import { useEffect, useState } from 'react';

const serverBaseURL = 'http://localhost:8000';

type Message = {
  id: number;
  message: string;
};

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const updateMessages = (message: Message) => {
    setMessages([...messages, message]);
  };

  function initEventSource() {
    console.log('loaded');
    try {
      if (eventSource) return;
      const socket = new EventSource(`${serverBaseURL}/stream/`);
      socket.onmessage = (e) => {
        updateMessages(JSON.parse(e.data));
      };

      socket.onerror = () => {
        socket?.close();
        setEventSource(null);
      };

      setEventSource(socket);
      return () => {
        socket?.close();
        setEventSource(null);
      };
    } catch (error) {
      setEventSource(null);
      console.error('error', 'An unexpected error has occured', error);
    }
  }

  useEffect(() => {
    initEventSource();
  }, []);

  return (
    <div style={{ display: 'grid', placeItems: 'center' }}>
      <h1>Messages</h1>
      {messages.length &&
        messages.map((e) => (
          <p key={e.id}>
            {e.id} {e.message}
          </p>
        ))}
    </div>
  );
}

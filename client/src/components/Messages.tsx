import { useEffect, useState } from 'react';

const serverBaseURL = 'http://localhost:8000';

type Message = {
  id: number;
  message: string;
};

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<Message | null>(null);

  const updateMessages = (message: Message) => {
    // Temporarily save new incoming messages to separate state to avoid message list resetting
    setNewMessage(message);
  };

  useEffect(() => {
    if (!newMessage) return;
    setMessages([...messages, newMessage]);
  }, [newMessage]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${serverBaseURL}/stream/`);
      eventSource.onmessage = (e) => {
        updateMessages(JSON.parse(e.data));
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch (error) {
      eventSource?.close();
      console.error('error', 'An unexpected error has occured', error);
    }
    return () => {
      eventSource?.close();
    };
  }, []);

  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <h1>Messages</h1>
      <div
        style={{
          height: '20vh',
          overflowY: 'auto',
          width: '80vw',
        }}
      >
        {messages.map((e) => (
          <p key={e.id}>
            {e.id} {e.message}
          </p>
        ))}
      </div>
    </div>
  );
}

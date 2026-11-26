import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import MessageBubble from './MessageBubble';

export default function ChatWindow() {
  const { activeId, messages } = useSelector((s) => s.chat);
  const list = activeId ? messages[activeId] || [] : [];
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView(); }, [list]);

  if (list.length === 0) {
    return (
      <div className='flex flex-1 items-center justify-center text-zinc-500'>
        Pick an agent below and start a conversation.
      </div>
    );
  }
  return (
    <div className='flex-1 space-y-4 overflow-y-auto p-6'>
      {list.map((m, i) => <MessageBubble key={i} message={m} />)}
      <div ref={endRef} />
    </div>
  );
}
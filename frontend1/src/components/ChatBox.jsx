import { useEffect, useRef } from "react";
import Message from "./Message";

export default function ChatBox({ messages, loading }) {

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="chat-box">

      {messages.map((message, index) => (
        <Message
          key={index}
          message={message}
        />
      ))}

      {loading && (
        <div className="assistant">

          <div className="message-bubble">

            Thinking...

          </div>

        </div>
      )}

      <div ref={bottomRef}></div>

    </div>
  );
}
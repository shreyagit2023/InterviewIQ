import ReactMarkdown from "react-markdown";
import SourceCard from "./SourceCard";

export default function Message({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`message ${isUser ? "user" : "assistant"}`}>

      <div className="message-bubble">

        <ReactMarkdown>
          {message.content}
        </ReactMarkdown>

        {!isUser &&
          message.sources &&
          message.sources.length > 0 && (

            <div className="sources">

              <h4>Sources</h4>

              {message.sources.map((source, index) => (
                <SourceCard
                  key={index}
                  source={source}
                />
              ))}

            </div>

          )}

      </div>

    </div>
  );
}
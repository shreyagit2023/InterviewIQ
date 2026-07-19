import { useState } from "react";
import "./App.css";

import UploadBox from "./components/UploadBox";
import ChatBox from "./components/ChatBox";
import ChatInput from "./components/ChatInput";
import Sidebar from "./components/SideBar";

import api from "./services/api";

function App() {
  const [uploaded, setUploaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/upload", formData);

      console.log(res.data);

      setUploaded(true);

      setMessages([
        {
          role: "assistant",
          content:
            "Document uploaded successfully.\n\nAsk me anything about your document.",
          sources: [],
        },
      ]);
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    }
  };

  const sendMessage = async (question) => {
    if (!question.trim()) return;

    if (!uploaded) {
      setMessages([
        {
          role: "assistant",
          content: "Please upload a PDF before asking questions.",
          sources: [],
        },
      ]);
      return;
    }

    const userMessage = {
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);

    try {
      const res = await api.post("/chat", {
        question,
      });

      const assistantMessage = {
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong.",
          sources: [],
        },
      ]);
    }

    setLoading(false);
  };

  const newChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Started a new conversation. Ask anything about your uploaded document.",
        sources: [],
      },
    ]);
  };

  return (
    <div className="layout">
      <Sidebar
    onNewChat={newChat}
    uploaded={uploaded}
    fileName="ShreyaResume.pdf"
    onUploadClick={() => setUploaded(false)}
/>

      <main className="main-content">
        {!uploaded ? (
          <div className="hero">
            <h1>InterviewIQ</h1>
            <p>Your AI Interview Preparation Assistant</p>

            <UploadBox onUpload={handleUpload} />
          </div>
        ) : (
          <>
            <div className="chat-header">
              <h2>InterviewIQ</h2>
              <p>Ask anything about your uploaded document.</p>
            </div>

            <div className="chat-container">
              <ChatBox
                messages={messages}
                loading={loading}
              />
            </div>
          </>
        )}

        <ChatInput onSend={sendMessage} />
      </main>
    </div>
  );
}

export default App;
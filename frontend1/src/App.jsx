import { useState } from "react";
import "./App.css";

import UploadBox from "./components/UploadBox";
import ChatBox from "./components/ChatBox";
import ChatInput from "./components/ChatInput";
import Sidebar from "./components/SideBar";
import InterviewSetup from "./components/InterviewSetup";
import InterviewScreen from "./components/InterviewScreen";
import FinalInterviewReport from "./components/FinalInterviewReport";

import api from "./services/api";

function App() {
  const [uploaded, setUploaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentView, setCurrentView] = useState("chat");

  const [interviewData, setInterviewData] = useState(null);
  const [interviewReport, setInterviewReport] = useState(null);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/upload", formData);

      console.log(res.data);

      setUploaded(true);
      setCurrentView("chat");

      setInterviewData(null);
      setInterviewReport(null);

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
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setCurrentView("chat");
    setInterviewData(null);
    setInterviewReport(null);

    setMessages([
      {
        role: "assistant",
        content:
          "Started a new conversation. Ask anything about your uploaded document.",
        sources: [],
      },
    ]);
  };

  const openInterview = () => {
    if (!uploaded) {
      alert("Please upload your resume before starting an interview.");
      return;
    }

    setCurrentView("interview-setup");
  };

  const exitInterview = () => {
    setCurrentView("chat");
    setInterviewData(null);
  };

  const handleInterviewTimeUp = () => {
    alert("Your 30-minute interview time is over.");

    setInterviewData(null);
    setCurrentView("interview-setup");
  };

  const startInterview = async ({
    interview_type,
    num_questions,
  }) => {
    setLoading(true);

    try {
      const res = await api.post("/interview/start", {
        interview_type,
        num_questions,
      });

      console.log("Interview started:", res.data);

      setInterviewData(res.data);
      setInterviewReport(null);
      setCurrentView("interview");
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.detail ||
          "Failed to start the interview."
      );
    } finally {
      setLoading(false);
    }
  };

  const submitInterviewAnswer = async (answer) => {
    if (!interviewData) {
      throw new Error("Interview session not found.");
    }

    try {
      const res = await api.post("/interview/answer", {
        session_id: interviewData.session_id,
        question: interviewData.question,
        answer: answer,
        question_number: interviewData.question_number,
      });

      if (res.data.completed) {
        console.log(
          "Final interview report:",
          res.data.report
        );

        setInterviewReport(res.data.report);
        setInterviewData(null);
        setCurrentView("report");

        return;
      }

      setInterviewData((prev) => ({
        ...prev,
        question: res.data.question,
        question_number: res.data.question_number,
        total_questions: res.data.total_questions,
      }));
    } catch (err) {
      console.error(
        "Interview answer submission failed:",
        err
      );

      throw err;
    }
  };

  return (
    <div className="layout">
      <Sidebar
        onNewChat={newChat}
        uploaded={uploaded}
        fileName="ShreyaResume.pdf"
        onUploadClick={() => {
          setUploaded(false);
          setCurrentView("chat");

          setInterviewData(null);
          setInterviewReport(null);
        }}
        onInterviewClick={openInterview}
      />

      <main className="main-content">

        {/* Upload Screen */}
        {!uploaded && (
          <>
            <div className="hero">
              <h1>InterviewIQ</h1>
              <p>Your AI Interview Preparation Assistant</p>

              <UploadBox onUpload={handleUpload} />
            </div>

            <ChatInput onSend={sendMessage} />
          </>
        )}

        {/* Normal Chat */}
        {uploaded && currentView === "chat" && (
          <>
            <div className="chat-header">
              <h2>InterviewIQ</h2>
              <p>
                Ask anything about your uploaded document.
              </p>
            </div>

            <div className="chat-container">
              <ChatBox
                messages={messages}
                loading={loading}
              />
            </div>

            <ChatInput onSend={sendMessage} />
          </>
        )}

        {/* Interview Setup */}
        {uploaded &&
          currentView === "interview-setup" && (
            <InterviewSetup
              onStart={startInterview}
              onBack={exitInterview}
              loading={loading}
            />
          )}

        {/* Live Interview */}
        {uploaded &&
          currentView === "interview" &&
          interviewData && (
            <InterviewScreen
              interviewData={interviewData}
              onExit={exitInterview}
              onComplete={submitInterviewAnswer}
              onTimeUp={handleInterviewTimeUp}
            />
          )}

        {/* Final Report */}
        {uploaded && currentView === "report" && (
          <FinalInterviewReport
            report={interviewReport}
            onBack={() => {
              setInterviewReport(null);
              setCurrentView("interview-setup");
            }}
          />
        )}

      </main>
    </div>
  );
}

export default App;
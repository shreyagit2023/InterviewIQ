import React, {useState} from "react";
import { ArrowLeft, BriefcaseBusiness, Code2, Play } from "lucide-react";
import "./Interview.css"

export default function InterviewSetup({
  onStart,
  onBack,
  loading = false,
}) {
  const [interviewType, setInterviewType] = useState("technical");
  const [numQuestions, setNumQuestions] = useState(5);

  const handleStart = () => {
    onStart({
      interview_type: interviewType,
      num_questions: Number(numQuestions),
    });
  };

  return (
    <div className="interview-page">
      <div className="interview-setup">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="interview-setup-header">
          <span className="interview-label">AI INTERVIEW</span>
          <h1>Prepare for your interview</h1>
          <p>
            Choose your interview type and configure the number of questions.
          </p>
        </div>

        <div className="setup-section">
          <h3>Interview Type</h3>

          <div className="interview-type-grid">
            <button
              className={`interview-type-card ${
                interviewType === "hr" ? "selected" : ""
              }`}
              onClick={() => setInterviewType("hr")}
            >
              <div className="type-icon">
                <BriefcaseBusiness size={24} />
              </div>

              <div>
                <h4>HR Interview</h4>
                <p>
                  Behavioural, communication, teamwork, leadership and
                  career-focused questions.
                </p>
              </div>
            </button>

            <button
              className={`interview-type-card ${
                interviewType === "technical" ? "selected" : ""
              }`}
              onClick={() => setInterviewType("technical")}
            >
              <div className="type-icon">
                <Code2 size={24} />
              </div>

              <div>
                <h4>Technical Interview</h4>
                <p>
                  Projects, programming, technologies, fundamentals and
                  technical follow-up questions.
                </p>
              </div>
            </button>
          </div>
        </div>

        <div className="setup-section">
          <h3>Number of Questions</h3>

          <select
            className="question-select"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
          >
            <option value={3}>3 Questions</option>
            <option value={5}>5 Questions</option>
            <option value={7}>7 Questions</option>
            <option value={10}>10 Questions</option>
          </select>
        </div>

        <button
          className="start-interview-button"
          onClick={handleStart}
          disabled={loading}
        >
          <Play size={18} />
          {loading ? "Starting Interview..." : "Start Interview"}
        </button>
      </div>
    </div>
  );
}
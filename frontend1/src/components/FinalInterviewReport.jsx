import {
  CheckCircle2,
  ArrowLeft,
  Trophy,
  MessageSquareText,
  Brain,
  Target,
  Sparkles,
} from "lucide-react";

export default function FinalInterviewReport({
  report,
  onBack,
}) {
  if (!report) {
    return (
      <div className="report-page">
        <div className="report-empty">
          <h2>No interview report available.</h2>

          <button
            className="report-back-button"
            onClick={onBack}
          >
            <ArrowLeft size={17} />
            Back to Interview
          </button>
        </div>
      </div>
    );
  }

  const getScoreClass = (score) => {
    if (score >= 80) return "score-excellent";
    if (score >= 60) return "score-good";
    return "score-needs-work";
  };

  const questionFeedback =
    report.question_feedback || [];

  return (
    <div className="report-page">
      <div className="report-container">

        <button
          className="report-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Back to Interview
        </button>

        <div className="report-header">
          <div className="report-success-icon">
            <CheckCircle2 size={30} />
          </div>

          <div>
            <span className="interview-label">
              INTERVIEW COMPLETE
            </span>

            <h1>Final Interview Report</h1>

            <p>
              Here's how you performed during your
              interview.
            </p>
          </div>
        </div>

        {/* Overall Score */}
        <div className="overall-score-card">
          <div className="overall-score-left">
            <div className="trophy-icon">
              <Trophy size={25} />
            </div>

            <div>
              <span>Overall Score</span>

              <h2>
                {report.overall_score}
                <small>/100</small>
              </h2>
            </div>
          </div>

          <div
            className={`score-badge ${getScoreClass(
              report.overall_score
            )}`}
          >
            {report.overall_score >= 80
              ? "Excellent"
              : report.overall_score >= 60
              ? "Good"
              : "Needs Improvement"}
          </div>
        </div>

        {/* Performance Scores */}
        <div className="report-section">
          <h2>Performance Breakdown</h2>

          <div className="score-grid">

            <ScoreCard
              icon={<MessageSquareText size={20} />}
              label="Communication"
              score={report.communication}
            />

            <ScoreCard
              icon={<Brain size={20} />}
              label="Technical Knowledge"
              score={report.technical_knowledge}
            />

            <ScoreCard
              icon={<Target size={20} />}
              label="Answer Relevance"
              score={report.answer_relevance}
            />

            <ScoreCard
              icon={<MessageSquareText size={20} />}
              label="Clarity"
              score={report.clarity}
            />

            <ScoreCard
              icon={<Brain size={20} />}
              label="Problem Solving"
              score={report.problem_solving}
            />

          </div>
        </div>

        {/* Strengths and Improvements */}
        <div className="report-two-column">

          <FeedbackCard
            title="Strengths"
            icon={<CheckCircle2 size={20} />}
            items={extractSection(
              report.raw_report,
              "STRENGTHS:",
              "AREAS_FOR_IMPROVEMENT:"
            )}
          />

          <FeedbackCard
            title="Areas for Improvement"
            icon={<Target size={20} />}
            items={extractSection(
              report.raw_report,
              "AREAS_FOR_IMPROVEMENT:",
              "FINAL_FEEDBACK:"
            )}
          />

        </div>

        {/* Question-wise Feedback */}
        <div className="report-section">
          <h2>Question-wise Feedback</h2>

          <div className="question-feedback-list">
            {questionFeedback.map((item, index) => (
              <div
                className="question-feedback-card"
                key={index}
              >
                <div className="feedback-question">
                  <span>
                    Question {index + 1}
                  </span>

                  <div className="question-score">
                    {item.score}/10
                  </div>
                </div>

                <p className="feedback-question-text">
                  {item.question}
                </p>

                <p className="feedback-evaluation">
                  {item.evaluation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Final AI Feedback */}
        <div className="final-feedback-card">
          <div className="final-feedback-heading">
            <Sparkles size={21} />

            <h2>Final AI Feedback</h2>
          </div>

          <p>
            {extractFinalFeedback(report.raw_report)}
          </p>
        </div>

        <button
          className="finish-report-button"
          onClick={onBack}
        >
          Return to Interview Setup
        </button>

      </div>
    </div>
  );
}


function ScoreCard({
  icon,
  label,
  score = 0,
}) {
  return (
    <div className="score-card">
      <div className="score-card-top">
        <div className="score-card-icon">
          {icon}
        </div>

        <span>{label}</span>
      </div>

      <div className="score-card-bottom">
        <strong>{score}</strong>
        <span>/100</span>
      </div>

      <div className="score-progress">
        <div
          className="score-progress-fill"
          style={{
            width: `${Math.max(
              0,
              Math.min(100, score)
            )}%`,
          }}
        />
      </div>
    </div>
  );
}


function FeedbackCard({
  title,
  icon,
  items,
}) {
  return (
    <div className="feedback-card">

      <div className="feedback-card-header">
        {icon}

        <h2>{title}</h2>
      </div>

      <div className="feedback-items">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div
              className="feedback-item"
              key={index}
            >
              <span>•</span>
              <p>{item}</p>
            </div>
          ))
        ) : (
          <p className="no-feedback">
            No detailed feedback available.
          </p>
        )}
      </div>

    </div>
  );
}


function extractSection(
  text,
  startMarker,
  endMarker
) {
  if (!text) return [];

  const start = text.indexOf(startMarker);

  if (start === -1) return [];

  const sectionStart =
    start + startMarker.length;

  const end = text.indexOf(
    endMarker,
    sectionStart
  );

  const section =
    end === -1
      ? text.slice(sectionStart)
      : text.slice(sectionStart, end);

  return section
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*[-*]\s*/, "")
        .trim()
    )
    .filter(Boolean);
}


function extractFinalFeedback(text) {
  if (!text) {
    return "No final feedback was generated.";
  }

  const marker = "FINAL_FEEDBACK:";
  const start = text.indexOf(marker);

  if (start === -1) {
    return "No final feedback was generated.";
  }

  return text
    .slice(start + marker.length)
    .trim();
}
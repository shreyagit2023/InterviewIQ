import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Send,
  LogOut,
  UserRound,
  Clock,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  TriangleAlert,
  Eye,
} from "lucide-react";
import './Interview.css';

import {
  initializeFaceDetector,
  detectFace,
} from "../services/faceDetection";

const INTERVIEW_DURATION = 30 * 60; // 30 minutes
// For testing, temporarily use: 6 * 60

export default function InterviewScreen({
  interviewData,
  onExit,
  onComplete,
  onTimeUp,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  const faceDetectionIntervalRef = useRef(null);
  const faceDetectorRef = useRef(null);

  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] =
    useState(INTERVIEW_DURATION);

  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] =
    useState(true);

  // Face detection states
  const [faceDetected, setFaceDetected] =
    useState(false);

  const [faceDetectionReady, setFaceDetectionReady] =
    useState(false);

  // Browser visibility state
  const [pageVisible, setPageVisible] =
    useState(true);

  /*
   * Start camera, timer and speech recognition
   */
  useEffect(() => {
    startCamera();
    startFaceDetection();

    timerRef.current = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    } else {
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setError("");
      };

      recognition.onresult = (event) => {
        let transcript = "";

        for (
          let i = event.resultIndex;
          i < event.results.length;
          i++
        ) {
          transcript +=
            event.results[i][0].transcript;
        }

        setAnswer(transcript);
      };

      recognition.onerror = (event) => {
        console.error(
          "Speech recognition error:",
          event.error
        );

        if (event.error !== "aborted") {
          setError(
            "Voice recognition failed. You can type your answer instead."
          );
        }

        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopCamera();

      clearInterval(timerRef.current);

      clearInterval(
        faceDetectionIntervalRef.current
      );

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      window.speechSynthesis.cancel();
    };
  }, []);

  /*
   * Timer reaches zero
   */
  useEffect(() => {
    if (timeLeft === 0) {
      clearInterval(timerRef.current);

      stopCamera();

      clearInterval(
        faceDetectionIntervalRef.current
      );

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      window.speechSynthesis.cancel();

      setIsListening(false);
      setIsSpeaking(false);

      if (onTimeUp) {
        onTimeUp();
      }
    }
  }, [timeLeft, onTimeUp]);

  //tab visibility

  useEffect(() => {
  const handleVisibilityChange = () => {
    const visible = !document.hidden;

    setPageVisible(visible);

    if (!visible) {
      window.speechSynthesis.cancel();

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      setIsListening(false);
      setIsSpeaking(false);
    }
  };

  document.addEventListener(
    "visibilitychange",
    handleVisibilityChange
  );

  return () => {
    document.removeEventListener(
      "visibilitychange",
      handleVisibilityChange
    );
  };
}, []);

  /*
   * Speak every new AI question
   */
  useEffect(() => {
    if (interviewData?.question) {
      speakQuestion(interviewData.question);
    }
  }, [interviewData?.question]);

  /*
   * Detect tab/window changes
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;

      setPageVisible(visible);

      if (!visible) {
        window.speechSynthesis.cancel();

        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }

        setIsListening(false);
        setIsSpeaking(false);
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  /*
   * Start webcam
   */
  const startCamera = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
        });

      streamRef.current = stream;
      setCameraAvailable(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(
        "Camera access denied:",
        err
      );

      setCameraAvailable(false);
    }
  };

  /*
   * Stop webcam
   */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }
  };

  /*
   * Initialize face detector
   */
  const startFaceDetection = async () => {
    try {
      const detector =
        await initializeFaceDetector();

      faceDetectorRef.current = detector;

      setFaceDetectionReady(true);

      startFaceMonitoring();
    } catch (err) {
      console.error(
        "Face detector initialization failed:",
        err
      );

      setFaceDetectionReady(false);
    }
  };

  /*
   * Monitor face approximately once per second
   */
  const startFaceMonitoring = () => {
    clearInterval(
      faceDetectionIntervalRef.current
    );

    faceDetectionIntervalRef.current =
      setInterval(() => {
        if (
          !videoRef.current ||
          !faceDetectorRef.current ||
          document.hidden
        ) {
          return;
        }

        try {
          const detected = detectFace(
            videoRef.current,
            performance.now()
          );

          setFaceDetected(detected);
        } catch (err) {
          console.error(
            "Face detection error:",
            err
          );
        }
      }, 1000);
  };

  /*
   * Text-to-speech for interviewer
   */
  const speakQuestion = (question) => {
    if (
      !question ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(question);

    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(
      utterance
    );
  };

  /*
   * Start / stop microphone
   */
  const toggleListening = () => {
    if (
      !speechSupported ||
      !recognitionRef.current
    ) {
      setError(
        "Voice recognition is not supported in this browser. Please type your answer."
      );

      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    setError("");

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error(
        "Could not start speech recognition:",
        err
      );
    }
  };

  /*
   * Format timer
   */
  const formatTime = (seconds) => {
    const minutes = Math.floor(
      seconds / 60
    );

    const remainingSeconds =
      seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  /*
   * Submit candidate answer
   */
  const handleSubmit = async () => {
    if (
      !answer.trim() ||
      submitting ||
      timeLeft === 0
    ) {
      return;
    }

    if (
      recognitionRef.current &&
      isListening
    ) {
      recognitionRef.current.stop();
    }

    window.speechSynthesis.cancel();

    setIsListening(false);
    setIsSpeaking(false);
    setError("");
    setSubmitting(true);

    try {
      await onComplete(
        answer.trim()
      );

      setAnswer("");
    } catch (err) {
      console.error(
        "Answer submission failed:",
        err
      );

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Something went wrong while submitting your answer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * Exit interview
   */
  const handleExit = () => {
    stopCamera();

    clearInterval(
      timerRef.current
    );

    clearInterval(
      faceDetectionIntervalRef.current
    );

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    window.speechSynthesis.cancel();

    setIsListening(false);
    setIsSpeaking(false);

    onExit();
  };

  const timerClass =
    timeLeft <= 60
      ? "timer-critical"
      : timeLeft <= 5 * 60
      ? "timer-warning"
      : "";

  return (
    <div className="interview-screen">

      {/* =========================
          TOP BAR
          ========================= */}
      <div className="interview-topbar">

        <div>
          <span className="interview-label">
            AI INTERVIEW
          </span>

          <h1>Live Interview</h1>
        </div>

        <div className="interview-topbar-actions">

          <div
            className={`interview-timer ${timerClass}`}
          >
            <Clock size={17} />

            <span>
              {formatTime(timeLeft)}
            </span>

            <small>
              remaining
            </small>
          </div>

          <button
            className="exit-interview-button"
            onClick={handleExit}
          >
            <LogOut size={16} />
            Exit Interview
          </button>

        </div>
      </div>

      {/* =========================
          PAGE VISIBILITY WARNING
          ========================= */}
      {!pageVisible && (
        <div className="page-warning">
          <TriangleAlert size={15} />
          Interview window inactive. Please return to
          the interview.
        </div>
      )}

      {/* =========================
          CAMERA + AI QUESTION
          ========================= */}
      <div className="interview-content">
        {!pageVisible && (
  <div className="page-warning">
    <div className="page-warning-icon">
      <TriangleAlert size={18} />
    </div>

    <div>
      <strong>Interview window inactive</strong>

      <span>
        Please return to this tab to continue your interview.
      </span>
    </div>
  </div>
)}

        {/* CAMERA */}
        <div className="interview-visuals">

          <div className="camera-card">

            {cameraAvailable ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="webcam"
                />

                <div className="camera-status">
                  <Camera size={14} />
                  Camera active
                </div>

                {/* FACE PRESENCE */}
                {faceDetectionReady && (
  <div
    className={`presence-status ${
      faceDetected
        ? "presence-ok"
        : "presence-warning"
    }`}
  >
    {faceDetected ? (
      <>
        <div className="presence-icon">
          <Eye size={14} />
        </div>

        <div className="presence-text">
          <strong>Candidate detected</strong>
          <span>Camera monitoring active</span>
        </div>
      </>
    ) : (
      <>
        <div className="presence-icon warning-icon">
          <TriangleAlert size={14} />
        </div>

        <div className="presence-text">
          <strong>Face not detected</strong>
          <span>Please stay visible in the camera</span>
        </div>
      </>
    )}
  </div>
)}
              </>
            ) : (
              <div className="camera-placeholder">

                <div className="camera-placeholder-icon">
                  <CameraOff size={30} />
                </div>

                <h3>
                  Camera unavailable
                </h3>

                <p>
                  Camera access was denied or is
                  unavailable. You can continue the
                  interview without it.
                </p>

              </div>
            )}

          </div>

          <div className="candidate-label">
            <UserRound size={15} />
            Candidate
          </div>

        </div>

        {/* AI INTERVIEWER */}
        <div className="interviewer-card">

          <div className="interviewer-header">

            <div className="interviewer-icon">
              AI
            </div>

            <div>
              <h3>
                AI Interviewer
              </h3>

              <span>
                Placement Interview
              </span>
            </div>

          </div>

          <div className="question-area">

            <span className="question-number">
              Question{" "}
              {interviewData?.question_number} of{" "}
              {interviewData?.total_questions}
            </span>

            <p className="question-text">
              {interviewData?.question}
            </p>

            <div className="speech-status">
              {isSpeaking ? (
                <>
                  <Volume2 size={16} />
                  AI Interviewer is speaking
                </>
              ) : (
                <>
                  <VolumeX size={16} />
                  Question ready
                </>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* =========================
          ANSWER SECTION
          ========================= */}
      <div className="answer-section">

        <div className="answer-heading">
          <span>
            Your Answer
          </span>

          {isListening && (
            <div className="listening-indicator">
              <span className="listening-dot"></span>
              Listening...
            </div>
          )}
        </div>

        <textarea
          value={answer}
          onChange={(e) =>
            setAnswer(e.target.value)
          }
          placeholder={
            speechSupported
              ? "Click Start Answer and speak, or type your answer..."
              : "Type your answer..."
          }
          disabled={
            submitting ||
            timeLeft === 0
          }
          rows={5}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              (e.ctrlKey || e.metaKey)
            ) {
              handleSubmit();
            }
          }}
        />

        {error && (
          <div className="interview-error">
            {error}
          </div>
        )}

        <div className="answer-footer">

          <span>
            {speechSupported
              ? "Review your transcript before submitting."
              : "Voice recognition is unavailable. Type your answer."}
          </span>

          <div className="answer-actions">

            {/* MICROPHONE */}
            {speechSupported && (
              <button
                className={`voice-answer-button ${
                  isListening
                    ? "listening"
                    : ""
                }`}
                onClick={
                  toggleListening
                }
                disabled={
                  submitting ||
                  timeLeft === 0
                }
              >
                {isListening ? (
                  <MicOff size={17} />
                ) : (
                  <Mic size={17} />
                )}

                {isListening
                  ? "Stop Answer"
                  : "Start Answer"}
              </button>
            )}

            {/* SUBMIT */}
            <button
              className="submit-answer-button"
              onClick={handleSubmit}
              disabled={
                !answer.trim() ||
                submitting ||
                timeLeft === 0
              }
            >
              <Send size={17} />

              {submitting
                ? "Evaluating..."
                : "Submit Answer"}
            </button>

          </div>
        </div>
      </div>

    </div>
  );
}
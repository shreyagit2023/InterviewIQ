import re
import uuid

from app.services.llm import ask_gemini
from app.services.retriever import retrieve


# Temporary in-memory storage for MVP.
# No database required yet.
INTERVIEW_SESSIONS = {}


def _get_resume_context(interview_type: str):
    """
    Retrieve useful resume chunks using the existing RAG system.
    This reuses FAISS + embeddings and does not create another
    resume parser.
    """

    if interview_type.lower() == "technical":
        query = (
            "candidate projects technical skills programming languages "
            "frameworks technologies databases APIs achievements experience"
        )
    else:
        query = (
            "candidate introduction education experience projects "
            "skills strengths leadership teamwork achievements career"
        )

    try:
        chunks = retrieve(query, k=8)
    except Exception as exc:
        print(f"Resume retrieval failed: {exc}")
        return ""

    context_parts = []

    for chunk in chunks:
        context_parts.append(
            f"[Page {chunk['page']}]\n{chunk['text']}"
        )

    return "\n\n".join(context_parts)


def _clean_question(text: str):
    """
    Removes accidental formatting around the generated question.
    """

    text = text.strip()

    # Remove common prefixes.
    text = re.sub(
        r"^(question|next question)\s*:\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    # Remove surrounding quotes if Gemini adds them.
    if len(text) >= 2 and text[0] == '"' and text[-1] == '"':
        text = text[1:-1].strip()

    return text


def _generate_first_question(interview_type: str, resume_context: str):
    """
    Generate Question 1.
    """

    if interview_type.lower() == "technical":
        role_description = """
Conduct a technical placement interview.
Focus on the candidate's projects, technologies,
programming knowledge, technical decisions, and fundamentals.
"""
    else:
        role_description = """
Conduct an HR placement interview.
Focus on introduction, behavioural situations,
teamwork, leadership, strengths, challenges, goals,
and relevant resume experience.
"""

    prompt = f"""
You are a professional placement interviewer.

{role_description}

You are interviewing a candidate whose resume context is below.

RESUME CONTEXT:
{resume_context}

Rules:
- Ask exactly ONE question.
- Keep the question concise and natural.
- Make it sound like a real interviewer speaking to a candidate.
- Personalize it using the resume whenever useful.
- Never invent information that is not present in the resume.
- Do not provide an answer.
- Do not provide feedback.
- Do not number the question.
- Do not introduce yourself.
- Output ONLY the interview question.

INTERVIEW QUESTION:
"""

    try:
        question = ask_gemini(prompt)
        question = _clean_question(question)

        if question:
            return question

    except Exception as exc:
        print(f"First question generation failed: {exc}")

    # Safe fallback if Gemini fails.
    if interview_type.lower() == "technical":
        return "Can you walk me through one of the technical projects mentioned in your resume?"
    
    return "Could you briefly introduce yourself and walk me through your background?"


def _build_history(session):
    """
    Convert previous interview Q&A into prompt-friendly text.
    """

    history_parts = []

    for item in session["history"]:
        history_parts.append(
            f"Question: {item['question']}\n"
            f"Candidate Answer: {item['answer']}\n"
            f"Evaluation: {item['evaluation']}\n"
            f"Score: {item['score']}/10"
        )

    return "\n\n".join(history_parts)


def _evaluate_and_generate_next_question(
    session,
    question: str,
    answer: str,
):
    """
    Evaluate the candidate's answer and generate the next question
    in a single Gemini call.

    This keeps the MVP reasonably fast and reduces API calls.
    """

    history = _build_history(session)

    if session["interview_type"].lower() == "technical":
        focus = """
For a technical interview:
- Evaluate technical correctness.
- Consider depth of understanding.
- Consider the candidate's use of technologies from the resume.
- Increase difficulty gradually when the candidate performs well.
"""
    else:
        focus = """
For an HR interview:
- Evaluate communication and relevance.
- Consider the candidate's reasoning and examples.
- Ask realistic behavioural follow-ups.
- Explore weaknesses or unclear areas naturally.
"""

    prompt = f"""
You are conducting a professional placement interview.

Interview type:
{session["interview_type"]}

RESUME CONTEXT:
{session["resume_context"]}

PREVIOUS INTERVIEW HISTORY:
{history if history else "No previous questions."}

CURRENT QUESTION:
{question}

CANDIDATE'S ANSWER:
{answer}

{focus}

Evaluate the candidate's current answer internally.

Then generate the next interview question.

IMPORTANT:
- Ask exactly ONE next question.
- The next question should logically follow the candidate's answer
  whenever possible.
- Use the resume context when relevant.
- Do not invent resume information.
- Do not repeat questions already asked.
- Do not reveal the score to the candidate during the interview.
- Do not give the candidate advice.
- Do not behave like a chatbot.
- Keep the next question concise.

Return EXACTLY in this format:

SCORE: <integer from 1 to 10>
EVALUATION: <one short paragraph>
NEXT_QUESTION: <one interview question only>
"""

    try:
        response = ask_gemini(prompt).strip()

        score_match = re.search(
            r"SCORE:\s*(\d+)",
            response,
            flags=re.IGNORECASE,
        )

        evaluation_match = re.search(
            r"EVALUATION:\s*(.*?)(?=\nNEXT_QUESTION:)",
            response,
            flags=re.IGNORECASE | re.DOTALL,
        )

        question_match = re.search(
            r"NEXT_QUESTION:\s*(.*)",
            response,
            flags=re.IGNORECASE | re.DOTALL,
        )

        score = 5

        if score_match:
            score = max(1, min(10, int(score_match.group(1))))

        evaluation = (
            evaluation_match.group(1).strip()
            if evaluation_match
            else "The answer was evaluated by the AI interviewer."
        )

        next_question = (
            _clean_question(question_match.group(1))
            if question_match
            else ""
        )

        return {
            "score": score,
            "evaluation": evaluation,
            "next_question": next_question,
        }

    except Exception as exc:
        print(f"Answer evaluation failed: {exc}")

        # Fallback so the interview doesn't completely break.
        return {
            "score": 5,
            "evaluation": "The answer was reviewed, but detailed evaluation was unavailable.",
            "next_question": "",
        }


def _generate_final_report(session):
    """
    Generate the final interview report from the completed interview.
    """

    history = _build_history(session)

    prompt = f"""
You are a professional placement interview evaluator.

The candidate completed a {session["interview_type"]} interview.

Interview history:

{history}

Generate a concise final interview report.

Evaluate these dimensions from 0 to 100:
- Communication
- Technical Knowledge
- Answer Relevance
- Clarity
- Problem Solving

For an HR interview, Technical Knowledge can represent
the candidate's job-related knowledge demonstrated during
the interview.

Also provide:
- 2 to 4 strengths
- 2 to 4 areas for improvement
- A short final AI feedback paragraph

Return EXACTLY in this format:

OVERALL_SCORE: <0-100>

COMMUNICATION: <0-100>
TECHNICAL_KNOWLEDGE: <0-100>
ANSWER_RELEVANCE: <0-100>
CLARITY: <0-100>
PROBLEM_SOLVING: <0-100>

STRENGTHS:
- <point>
- <point>

AREAS_FOR_IMPROVEMENT:
- <point>
- <point>

FINAL_FEEDBACK:
<short paragraph>
"""

    try:
        response = ask_gemini(prompt).strip()

        return {
            "raw_report": response,
            "overall_score": _extract_score(response, "OVERALL_SCORE"),
            "communication": _extract_score(response, "COMMUNICATION"),
            "technical_knowledge": _extract_score(
                response,
                "TECHNICAL_KNOWLEDGE",
            ),
            "answer_relevance": _extract_score(
                response,
                "ANSWER_RELEVANCE",
            ),
            "clarity": _extract_score(response, "CLARITY"),
            "problem_solving": _extract_score(
                response,
                "PROBLEM_SOLVING",
            ),
        }

    except Exception as exc:
        print(f"Final report generation failed: {exc}")

        # Fallback report.
        scores = [
            item["score"]
            for item in session["history"]
        ]

        overall = round(
            (sum(scores) / len(scores)) * 10
        ) if scores else 0

        return {
            "raw_report": "",
            "overall_score": overall,
            "communication": overall,
            "technical_knowledge": overall,
            "answer_relevance": overall,
            "clarity": overall,
            "problem_solving": overall,
        }


def _extract_score(text: str, label: str):
    """
    Extract a 0-100 score from the Gemini report.
    """

    match = re.search(
        rf"{re.escape(label)}:\s*(\d+)",
        text,
        flags=re.IGNORECASE,
    )

    if not match:
        return 0

    return max(0, min(100, int(match.group(1))))


def start_interview(interview_type: str, num_questions: int):
    """
    Start a new interview session.
    """

    interview_type = interview_type.lower().strip()

    if interview_type not in {"hr", "technical"}:
        raise ValueError(
            "Interview type must be 'hr' or 'technical'."
        )

    num_questions = max(1, min(10, num_questions))

    session_id = str(uuid.uuid4())

    resume_context = _get_resume_context(interview_type)

    session = {
        "session_id": session_id,
        "interview_type": interview_type,
        "total_questions": num_questions,
        "current_question_number": 1,
        "resume_context": resume_context,
        "history": [],
    }

    question = _generate_first_question(
        interview_type,
        resume_context,
    )

    session["current_question"] = question

    INTERVIEW_SESSIONS[session_id] = session

    return {
        "session_id": session_id,
        "question": question,
        "question_number": 1,
        "total_questions": num_questions,
    }


def submit_answer(
    session_id: str,
    question: str,
    answer: str,
    question_number: int,
):
    """
    Process an answer and either return the next question
    or the final interview report.
    """

    if session_id not in INTERVIEW_SESSIONS:
        raise ValueError(
            "Interview session not found. Please start a new interview."
        )

    session = INTERVIEW_SESSIONS[session_id]

    if question_number != session["current_question_number"]:
        raise ValueError("Invalid question number.")

    if question.strip() != session["current_question"].strip():
        raise ValueError("Question does not match the current interview state.")

    answer = answer.strip()

    if not answer:
        raise ValueError("Answer cannot be empty.")

    result = _evaluate_and_generate_next_question(
        session,
        question,
        answer,
    )

    # Store current interview turn.
    session["history"].append(
        {
            "question": question,
            "answer": answer,
            "evaluation": result["evaluation"],
            "score": result["score"],
        }
    )

    # Check whether interview is complete.
    if question_number >= session["total_questions"]:

        report = _generate_final_report(session)

        # Delete session after completion.
        INTERVIEW_SESSIONS.pop(session_id, None)

        return {
            "completed": True,
            "question_number": question_number,
            "total_questions": session["total_questions"],
            "report": {
                "overall_score": report["overall_score"],
                "communication": report["communication"],
                "technical_knowledge": report["technical_knowledge"],
                "answer_relevance": report["answer_relevance"],
                "clarity": report["clarity"],
                "problem_solving": report["problem_solving"],
                "raw_report": report["raw_report"],
                "question_feedback": session["history"],
            },
        }

    # Continue interview.
    next_question = result["next_question"]

    if not next_question:
        if session["interview_type"] == "technical":
            next_question = (
                "Can you explain another technical aspect of "
                "your experience in more detail?"
            )
        else:
            next_question = (
                "Can you describe a situation where you had to "
                "solve a difficult problem?"
            )

    session["current_question_number"] += 1
    session["current_question"] = next_question

    return {
        "completed": False,
        "question": next_question,
        "question_number": session["current_question_number"],
        "total_questions": session["total_questions"],
    }
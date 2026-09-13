from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.interview import (
    start_interview,
    submit_answer,
)


router = APIRouter(
    prefix="/interview",
    tags=["Interview"],
)


class InterviewStartRequest(BaseModel):
    interview_type: str = Field(
        ...,
        description="hr or technical",
    )

    num_questions: int = Field(
        default=5,
        ge=1,
        le=10,
    )


class InterviewAnswerRequest(BaseModel):
    session_id: str
    question: str
    answer: str
    question_number: int


@router.post("/start")
def start(request: InterviewStartRequest):

    try:
        result = start_interview(
            interview_type=request.interview_type,
            num_questions=request.num_questions,
        )

        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        print(f"Interview start error: {exc}")

        raise HTTPException(
            status_code=500,
            detail="Failed to start interview.",
        )


@router.post("/answer")
def answer(request: InterviewAnswerRequest):

    if not request.answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Answer cannot be empty.",
        )

    try:
        result = submit_answer(
            session_id=request.session_id,
            question=request.question,
            answer=request.answer,
            question_number=request.question_number,
        )

        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        print(f"Interview answer error: {exc}")

        raise HTTPException(
            status_code=500,
            detail="Failed to process interview answer.",
        )
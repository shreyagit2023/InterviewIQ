from app.services.llm import ask_gemini

print(
    ask_gemini(
        "Say hello in one sentence."
    )
)
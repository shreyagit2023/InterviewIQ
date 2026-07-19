def build_prompt(question: str, retrieved_chunks: list):

    context = ""

    for chunk in retrieved_chunks:

        context += (
            f"[File: {chunk['filename']} | Page: {chunk['page']}]\n"
            f"{chunk['text']}\n\n"
        )

    prompt = f"""
You are an AI assistant.

Answer ONLY using the context below.

If the answer is not present in the context, say:

"I couldn't find that information in the uploaded document."

Do not make up information.

Context:
{context}

Question:
{question}

Answer:
"""

    return prompt
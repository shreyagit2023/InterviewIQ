from app.services.retriever import retrieve

results = retrieve("What projects have i done?")

for result in results:
    print("=" * 50)
    print("Score:", result["score"])
    print("File:", result["filename"])
    print("Page:", result["page"])
    print("-" * 80)
    print(result["text"])
    print("-" * 80)
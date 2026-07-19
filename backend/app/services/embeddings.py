from sentence_transformers import SentenceTransformer

# Load once when the server starts
model = SentenceTransformer("BAAI/bge-small-en-v1.5")


def generate_embeddings(texts):
    """
    Convert a list of text chunks into embeddings.
    """

    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True
    )

    return embeddings
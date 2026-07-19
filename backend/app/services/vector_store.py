import faiss
import numpy as np
import pickle
import os

VECTOR_DB_DIR = "app/vector_db"

os.makedirs(VECTOR_DB_DIR, exist_ok=True)

INDEX_PATH = os.path.join(VECTOR_DB_DIR, "faiss.index")
METADATA_PATH = os.path.join(VECTOR_DB_DIR, "metadata.pkl")


def save_to_faiss(embeddings, chunks):
    """
    Save embeddings and metadata to FAISS.
    """

    dimension = embeddings.shape[1]

    index = faiss.IndexFlatIP(dimension)

    index.add(np.array(embeddings, dtype=np.float32))

    faiss.write_index(index, INDEX_PATH)

    with open(METADATA_PATH, "wb") as f:
        pickle.dump(chunks, f)

    return len(chunks)
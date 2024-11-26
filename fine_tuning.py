import os
import torch
import logging
import pandas as pd
from flask import Flask, request, jsonify, render_template
from transformers import AutoModelForCausalLM, AutoTokenizer
from sentence_transformers import SentenceTransformer
import faiss

# Logging
if not logging.getLogger().hasHandlers():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# KB's
csv_files = {
    "medical_terms": "./medical_train_data.csv",
    "treatments": "./medical_val_data.csv"
}

# DataFrames
logging.info("Loading CSV files...")
knowledge_bases = {key: pd.read_csv(path) for key, path in csv_files.items()}
logging.info(f"Loaded {len(knowledge_bases)} knowledge bases.")

hf_token = "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"

model_name = "meta-llama/Llama-3.2-1B-Instruct"
logging.info(f"Using model: {model_name}")

# Device selection: prioritize GPU; fallback CPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
if torch.cuda.is_available():
    logging.info(f"CUDA is available. Using GPU: {torch.cuda.get_device_name(0)}")
else:
    logging.warning("CUDA is not available. Using CPU.")

logging.info("Loading tokenizer and model...")
tokenizer = AutoTokenizer.from_pretrained(model_name, token=hf_token)
model = AutoModelForCausalLM.from_pretrained(
    model_name, token=hf_token, torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
).to(device)

# Pad token
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

logging.info("Loading SentenceTransformer for embeddings...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")  # Efficient model for embedding generation

logging.info("Building FAISS index...")
corpus = []  # Flat list to hold all text from knowledge bases
corpus_map = []  # Map corpus entries back to their source knowledge base
for key, df in knowledge_bases.items():
    for col in df.columns:
        corpus.extend(df[col].dropna().tolist())
        corpus_map.extend([(key, idx) for idx in range(len(df))])

# Compute embeddings for the corpus and add them to the FAISS index
corpus_embeddings = embedding_model.encode(corpus, convert_to_tensor=False)
dimension = corpus_embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(corpus_embeddings)
logging.info(f"FAISS index built with {len(corpus)} entries.")

logging.info("Printing corpus and corpus_map:")
print("Corpus:", corpus)
print("Corpus Map:", corpus_map)

logging.info("Computing embeddings for the corpus...")
corpus_embeddings = embedding_model.encode(corpus, convert_to_tensor=False)
print("Corpus Embeddings Shape:", corpus_embeddings.shape)
print("Sample of Corpus Embeddings (first 5):", corpus_embeddings[:5])
logging.info("Printing FAISS index details:")
print("FAISS Index Properties:")
print(f"Number of vectors in the FAISS index: {index.ntotal}")
print(f"Dimension of the embeddings: {dimension}")
print("Sample of FAISS Index Vectors (first 5 vectors):")
sample_vectors = index.reconstruct_n(0, 5) 
print(sample_vectors)

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    """
    Renders the home page containing the chat interface.
    This is the main endpoint for user interaction, providing the HTML layout.
    """
    logging.info("Rendering home page (chat interface)")
    return render_template("index.html")

@app.route("/generate-text", methods=["POST"])
def generate_text():
    """
    Handles text generation requests from the client.
    - Extracts the user prompt from the request.
    - Retrieves relevant context from the knowledge base using FAISS.
    - Constructs a prompt by combining the context and user query.
    - Uses the Hugging Face model to generate a response.
    - Returns the generated response to the client.
    """
    logging.info("Received text generation request")
    data = request.json
    user_prompt = data.get("prompt", "")

    if not user_prompt:
        logging.warning("No prompt provided in the request")
        return jsonify({'error': 'Please provide a prompt.'}), 400

    logging.info(f"User prompt received: {user_prompt}")

    logging.info("Retrieving relevant context using FAISS...")
    context = retrieve_context(user_prompt, index, corpus, top_k=5)

    # Combine retrieved context with the user query to form the final model prompt
    final_prompt = f"{context}\n\nQuestion: {user_prompt}\nAnswer:"
    logging.info(f"Final prompt constructed: {final_prompt}")

    # Tokenize the prompt and calculate token constraints for the model
    inputs = tokenizer(final_prompt, return_tensors="pt", padding=True, truncation=True).to(device)
    max_tokens_for_model = 2048  # Maximum allowable tokens for the model
    input_token_count = inputs.input_ids.size(1)
    max_new_tokens = max_tokens_for_model - input_token_count

    if max_new_tokens <= 0:
        logging.error("Input prompt is too long for the model's token limit.")
        return jsonify({'error': 'Prompt is too long to generate a response.'}), 400

    logging.info("Generating response...")
    with torch.no_grad():
        outputs = model.generate(
            inputs.input_ids,
            attention_mask=inputs.attention_mask,
            max_new_tokens=max_new_tokens,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            pad_token_id=tokenizer.eos_token_id
        )
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    generated_text = response.replace("User", "Question").replace("Assistant", "Answer").replace(final_prompt, "").strip()

    logging.info(f"Generated response: {generated_text}")
    return jsonify({'generated_text': generated_text})


def retrieve_context(query, index, corpus, top_k=5):
    """
    Retrieves the top-k most relevant knowledge base entries for a given query.
    - Uses FAISS to perform similarity search based on text embeddings.
    - Returns a concatenated string of the top-k retrieved entries for context.
    """
    query_embedding = embedding_model.encode([query], convert_to_tensor=False)
    distances, indices = index.search(query_embedding, top_k)
    retrieved_context = [corpus[idx] for idx in indices[0] if idx != -1]
    return "\n\n".join(retrieved_context) if retrieved_context else "No relevant information found."


if __name__ == "__main__":
    """
    Main entry point for starting the Flask application.
    - Runs the web server on the specified host and port.
    - Allows clients to interact with the chatbot via the web interface.
    """
    logging.info("Starting Flask app...")
    app.run(host="0.0.0.0", port=5000, debug=True)
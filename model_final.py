import os
import torch
import logging
from transformers import AutoModelForCausalLM, AutoTokenizer
from flask import Flask, request, jsonify, render_template

# Set up logging to print in real-time without duplication
if not logging.getLogger().hasHandlers():
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Create cache directory if it doesn't exist
cache_dir = "./fine_tuned_model"
os.makedirs(cache_dir, exist_ok=True)
logging.info(f"Cache directory set to: {cache_dir}")

# Hugging Face token (ensure you are authorized to use the model)
hf_token = "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"

# Specify the model name (ensure you have access to this model)
model_name = "meta-llama/Llama-3.2-1B-Instruct"
logging.info(f"Using model: {model_name}")

# Check for available GPU and set precision accordingly
if torch.cuda.is_available():
    device = torch.device("cuda")
    logging.info(f"CUDA is available. Using GPU: {torch.cuda.get_device_name(0)}")
    logging.info(f"CUDA Device Count: {torch.cuda.device_count()}")
else:
    device = torch.device("cpu")
    logging.warning("CUDA is not available. Using CPU.")

# Load tokenizer
logging.info("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(model_name, token=hf_token, cache_dir=cache_dir)

# Load the model with CPU offloading in case of GPU out of memory
try:
    if torch.cuda.is_available():
        logging.info("Loading model with FP16 precision for GPU with CPU offloading...")
        model = AutoModelForCausalLM.from_pretrained(
            model_name, 
            token=hf_token, 
            cache_dir=cache_dir, 
            torch_dtype=torch.float16, 
            device_map="auto",
            max_memory={0: "2.5GiB", "cpu": "10GiB"}  # Changed 'cuda:0' to 0 for proper memory management
        )
        logging.info("Model loaded with FP16 precision and CPU offloading.")
    else:
        logging.info("Loading model with standard precision for CPU...")
        model = AutoModelForCausalLM.from_pretrained(model_name, token=hf_token, cache_dir=cache_dir).to(device)
        logging.info("Model loaded with standard precision on CPU.")
except torch.cuda.OutOfMemoryError:
    logging.error("CUDA out of memory! Offloading model to CPU.")
    model = AutoModelForCausalLM.from_pretrained(model_name, token=hf_token, cache_dir=cache_dir).to("cpu")
    logging.info("Model loaded entirely on CPU due to insufficient GPU memory.")

# Ensure pad_token is set
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token
    logging.info(f"Pad token set to EOS token: {tokenizer.pad_token}")

app = Flask(__name__)

# Home route to display the chat interface
@app.route("/", methods=["GET"])
def home():
    logging.info("Rendering home page (chat interface)")
    return render_template("index.html")

@app.route("/generate-text", methods=["POST"])
def generate_text():
    logging.info("Received text generation request")
    data = request.json
    user_prompt = data.get("prompt", "")

    if not user_prompt:
        logging.warning("No prompt provided in the request")
        return jsonify({'error': 'Please provide a prompt.'}), 400

    logging.info(f"User prompt received: {user_prompt}")

    # Modify the prompt to steer the model towards medical content
    medical_prompt_prefix = (
        "You are a medical expert. Answer the following in the context of healthcare, "
        "medicine, diagnosis, treatment, and patient care. "
    )
    prompt = f"{medical_prompt_prefix}{user_prompt}"
    logging.info(f"Modified prompt for medical context: {prompt}")

    # Tokenize the prompt and move input tensors to the appropriate device (GPU/CPU)
    logging.info("Tokenizing prompt...")
    inputs = tokenizer(prompt, return_tensors="pt", padding=True, truncation=True).to(device)
    prompt_token_length = inputs.input_ids.shape[1]
    logging.info(f"Tokenized input ids: {inputs.input_ids}, prompt token length: {prompt_token_length}")

    # Set a dynamic limit for the maximum number of new tokens generated
    max_new_tokens = max(50, int(prompt_token_length * 1.5))  # Generate 1.5x more tokens than the prompt length
    logging.info(f"Max new tokens for generation set to: {max_new_tokens}")

    # Retry logic in case non-medical content is generated
    max_retries = 3
    retry_count = 0
    generated_text = ""

    while retry_count < max_retries:
        logging.info(f"Generation attempt {retry_count + 1}...")

        # Generate text using faster generation settings (e.g., FP16 on CUDA if available)
        with torch.no_grad():  # Disable gradient computation for inference
            outputs = model.generate(
                inputs.input_ids,
                attention_mask=inputs.attention_mask,
                do_sample=True,  # Sampling for more creative responses
                temperature=0.7,  # Adjust for more random/creative generation
                top_p=0.9,  # Use nucleus sampling for diversity
                max_new_tokens=max_new_tokens,  # Dynamically limit the length of generated tokens
                pad_token_id=tokenizer.eos_token_id,
            )

        logging.info(f"Generated output ids: {outputs}")

        generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        logging.info(f"Generated text: {generated_text}")

        # Remove the prompt from the generated text to avoid repetition
        generated_text = generated_text.replace(prompt, "").strip()

        # Filter for medical context by checking for medical terms or context relevance
        if is_medical_context(generated_text):
            logging.info("Valid medical context generated.")
            break  # Break the loop if valid medical text is generated
        else:
            logging.warning("Generated response is not in the medical context. Retrying...")
            retry_count += 1

    if retry_count == max_retries:
        logging.error("Max retries reached. Unable to generate valid medical content.")
        return jsonify({'error': 'Unable to generate a valid medical response. Please try again later.'}), 500

    # Format the generated text for better readability (e.g., break into paragraphs)
    formatted_text = format_text(generated_text)
    logging.info(f"Formatted text: {formatted_text}")

    return jsonify({'generated_text': formatted_text})

# Function to check if the generated text is relevant to the medical domain
def is_medical_context(text):
    medical_keywords = ["health", "treatment", "disease", "diagnosis", "patient", "symptoms", "therapy", "medication", "doctor", "medical"]
    return any(keyword in text.lower() for keyword in medical_keywords)

# Helper function to format text (e.g., splitting into paragraphs)
def format_text(text):
    # Split the text into sentences for better display in the chat
    sentences = text.split(". ")
    formatted_text = "<br>".join(sentences)  # Add line breaks between sentences
    logging.info("Text formatted with line breaks for display")
    return formatted_text

if __name__ == "__main__":
    logging.info("Starting Flask app...")
    app.run(host="0.0.0.0", port=5000)

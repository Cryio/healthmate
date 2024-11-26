import os
from transformers import AutoModelForCausalLM, AutoTokenizer

model_name = "meta-llama/Llama-3.2-1B-Instruct"
hf_token = "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"

cache_dir = "./model_cache"
os.makedirs(cache_dir, exist_ok=True)

# Download tokenizer and model
tokenizer = AutoTokenizer.from_pretrained(model_name, token=hf_token, cache_dir=cache_dir)
model = AutoModelForCausalLM.from_pretrained(model_name, use_auth_token=hf_token, cache_dir=cache_dir)

print("Model and tokenizer downloaded successfully.")

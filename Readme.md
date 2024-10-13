
# HealthMate

This project demonstrates a Flask application that generates text using the **Meta-Llama 3.1 8B** model from Hugging Face. The model is downloaded locally to save bandwidth and is reused between Docker container runs.

## Prerequisites

Ensure you have the following installed:

- **Docker**: To build and run the application inside containers.
- **Python 3.12+**: For running scripts if needed.
- **Hugging Face Token**: You'll need an API token from [Hugging Face](https://huggingface.co/) to access the model.

## Steps

### 1. Clone the Repository

Start by cloning this repository to your local machine:

```bash
git clone https://github.com/your-repo/healthmate.git
cd healthmate
```

### 2. Download the Hugging Face Model Locally

To avoid redownloading the model every time the container runs, download the model files locally.

1. Run a Python script to download the model using your Hugging Face token.
2. The model will be downloaded into a `model_cache` folder within the project directory.

### 3. Build the Docker Image

After downloading the model locally, build the Docker image using the following command:

```bash
docker build -t healthmate:latest .
```

This will create an image named `healthmate` from the Dockerfile in the current directory.

### 4. Run the Docker Container

To run the container, mount the local directory where the model was downloaded (`model_cache`). Use the following command:

```bash
docker run --rm -it -p 5000:5000 -v $(pwd)/model_cache:/app/model_cache healthmate:latest
```

This command does the following:
- **`-p 5000:5000`**: Exposes the Flask application on port 5000.
- **`-v $(pwd)/model_cache:/app/model_cache`**: Mounts the local model cache directory inside the Docker container, so it can reuse the model without downloading it again.

### 5. Access the Flask API

Once the Docker container is running, you can access the Flask API at `http://localhost:5000`. To generate text, make a POST request to the `/generate` endpoint with a JSON payload that includes your prompt.

For example, you can use `curl` or Postman to make a request:

```bash
curl -X POST http://localhost:5000/generate \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Tell me a story about AI"}'
```

The response will return the generated text.

### 6. Folder Structure

The repository has the following folder structure:

```
healthmate/
├── Dockerfile
├── README.md
├── app.py                # Flask application
├── model_cache/          # Cached model files (downloaded locally)
├── requirements.txt      # Python dependencies
└── test.py               # Application entry point
```

### 7. Environment Variables

You can pass the Hugging Face token directly in the code for testing purposes or manage it through environment variables. For production use, it is better to avoid hardcoding sensitive information like API tokens.

### 8. Verify Model Usage

Once running, verify that the container is correctly using the pre-downloaded model files by checking the mounted folder inside the container. This ensures that bandwidth is saved as the model isn't re-downloaded with each run.

## License

This project is licensed under the MIT License.

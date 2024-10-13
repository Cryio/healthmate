FROM python:3.12-slim

WORKDIR /app

COPY . /app

RUN apt-get update && apt-get install -y \
    python3-venv \
    build-essential \
    && apt-get clean

RUN rm -rf /app/venv

RUN python -m venv /app/venv

EXPOSE 5000

ENV PATH="/app/venv/bin:$PATH"
ENV FLASK_ENV=production
ENV HF_TOKEN=""

RUN mkdir -p /app/model_cache

CMD ["python", "test.py"]

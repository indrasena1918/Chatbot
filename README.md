# Local AI Chat

A lightweight chat web app powered by a locally running [Ollama](https://ollama.com/) model. The Flask server provides the chat interface and forwards messages to Ollama; the browser keeps the conversation history for the current page session.

## Requirements

- Python 3.10 or later
- [Ollama](https://ollama.com/download) installed and running
- The `qwen2.5:3b` model downloaded in Ollama

## Setup

Download the model:

```powershell
ollama pull qwen2.5:3b
```

Create and activate a virtual environment, then install the Python dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

On macOS or Linux, activate the environment with:

```bash
source .venv/bin/activate
```

## Run

Make sure Ollama is running, then start the Flask app:

```powershell
python app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.

## Chat API

`POST /api/chat` accepts a JSON object with a message and optional conversation history:

```json
{
  "message": "What is Flask?",
  "history": []
}
```

History entries must have a `role` of `user` or `assistant` and a string `content`. A successful response contains the assistant's reply:

```json
{
  "response": "Flask is a lightweight Python web framework."
}
```

Messages are limited to 4,000 characters, and up to 20 history messages are sent to Ollama. The server connects to Ollama at `http://localhost:11434` using the `qwen2.5:3b` model.

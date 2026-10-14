from flask import Flask, jsonify, render_template, request
import requests

app = Flask(__name__)

OLLAMA_CHAT_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "qwen2.5:3b"
MAX_MESSAGE_LENGTH = 4000
MAX_HISTORY_MESSAGES = 20


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/chat")
def chat():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify(error="Send a valid JSON request."), 400

    message = data.get("message")
    if not isinstance(message, str) or not message.strip():
        return jsonify(error="Please enter a message."), 400
    if len(message) > MAX_MESSAGE_LENGTH:
        return jsonify(error=f"Messages must be {MAX_MESSAGE_LENGTH} characters or fewer."), 400

    history = data.get("history", [])
    if not isinstance(history, list):
        return jsonify(error="Chat history must be a list."), 400

    messages = []
    for item in history[-MAX_HISTORY_MESSAGES:]:
        if (
            not isinstance(item, dict)
            or item.get("role") not in ("user", "assistant")
            or not isinstance(item.get("content"), str)
        ):
            return jsonify(error="Chat history contains an invalid message."), 400
        messages.append({"role": item["role"], "content": item["content"]})

    messages.append({"role": "user", "content": message.strip()})

    try:
        response = requests.post(
            OLLAMA_CHAT_URL,
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": False},
            timeout=180,
        )
        response.raise_for_status()
    except requests.Timeout:
        return jsonify(error="Ollama took too long to respond. Please try again."), 504
    except requests.ConnectionError:
        return jsonify(
            error="Could not connect to Ollama. Make sure Ollama is running on this computer."
        ), 502
    except requests.RequestException:
        return jsonify(
            error="Ollama could not process the request. Check that qwen2.5:3b is installed."
        ), 502

    try:
        answer = response.json()["message"]["content"]
    except (ValueError, KeyError, TypeError):
        return jsonify(error="Ollama returned an unexpected response."), 502

    if not isinstance(answer, str):
        return jsonify(error="Ollama returned an unexpected response."), 502

    return jsonify(response=answer)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)

const form = document.querySelector("#chat-form");
const input = document.querySelector("#message-input");
const messages = document.querySelector("#messages");
const sendButton = document.querySelector("#send-button");
const clearButton = document.querySelector("#clear-button");
const welcomeMessage = document.querySelector("#welcome-message");

let conversation = [];

function scrollToLatest() {
  messages.scrollTop = messages.scrollHeight;
}

function addMessage(role, content, { error = false } = {}) {
  welcomeMessage.hidden = true;

  const row = document.createElement("div");
  row.className = `message ${role}${error ? " error" : ""}`;

  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = role === "user" ? "Y" : "✦";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;

  row.append(avatar, bubble);
  messages.append(row);
  scrollToLatest();
  return row;
}

function addTypingIndicator() {
  const row = document.createElement("div");
  row.className = "message assistant";
  row.setAttribute("aria-label", "AI is thinking");

  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = "✦";

  const bubble = document.createElement("div");
  bubble.className = "bubble typing-indicator";
  bubble.innerHTML = "<span></span><span></span><span></span>";

  row.append(avatar, bubble);
  messages.append(row);
  scrollToLatest();
  return row;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message || sendButton.disabled) return;

  addMessage("user", message);
  input.value = "";
  input.style.height = "auto";
  sendButton.disabled = true;
  clearButton.disabled = true;
  input.disabled = true;
  const typingIndicator = addTypingIndicator();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: conversation }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "The server could not process your message.");
    }
    if (typeof data.response !== "string") {
      throw new Error("The server returned an unexpected response.");
    }

    conversation.push(
      { role: "user", content: message },
      { role: "assistant", content: data.response },
    );
    conversation = conversation.slice(-20);
    typingIndicator.remove();
    addMessage("assistant", data.response);
  } catch (error) {
    typingIndicator.remove();
    addMessage(
      "assistant",
      error instanceof TypeError
        ? "Could not reach the chatbot server. Make sure the Flask app is running and try again."
        : error.message,
      { error: true },
    );
  } finally {
    sendButton.disabled = false;
    clearButton.disabled = false;
    input.disabled = false;
    input.focus();
  }
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
});

clearButton.addEventListener("click", () => {
  conversation = [];
  messages.querySelectorAll(".message").forEach((message) => message.remove());
  welcomeMessage.hidden = false;
  input.focus();
});

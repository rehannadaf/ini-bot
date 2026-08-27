import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage },
    ]);

    setMessage("");
    setLoading(true);

    try {
const response = await fetch("https://ini-bot-backend.onrender.com/api/chat", 
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: userMessage,
    }),
  }
);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply },
      ]);
   } catch (error) {
  console.error("INI BOT ERROR:", error);

  setMessages((prev) => [
    ...prev,
    {
      role: "assistant",
      text: `Connection error: ${error.message}`,
    },
  ]);
}
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">INI</div>

        <div>
          <h1>INI Bot</h1>
          <p>Your AI assistant</p>
        </div>
      </header>

      <main className="chat">
        {messages.length === 0 ? (
          <div className="welcome">
            <div className="bot-icon">🤖</div>

            <h2>Hello! I'm INI Bot</h2>

            <p>
              Ask me anything. I can help you learn, code,
              write, brainstorm and much more.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${
                msg.role === "user" ? "user" : "assistant"
              }`}
            >
              <div className="bubble">{msg.text}</div>
            </div>
          ))
        )}

        {loading && (
          <div className="message assistant">
            <div className="bubble">INI Bot is thinking...</div>
          </div>
        )}
      </main>

      <div className="input-area">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message INI Bot..."
          rows="1"
        />

        <button onClick={sendMessage} disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;
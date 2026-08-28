import { useEffect, useRef, useState } from "react";
import "./App.css";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "./firebase";

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Firebase authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  // Load saved chat history for the logged-in user
  useEffect(() => {
    if (!user) {
      setMessages([]);
      return;
    }

    try {
      const saved = localStorage.getItem(`ini-chat-${user.uid}`);

      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Could not load chat history:", error);
      setMessages([]);
    }
  }, [user]);

  // Save chat history
  useEffect(() => {
    if (!user) return;

    try {
      localStorage.setItem(
        `ini-chat-${user.uid}`,
        JSON.stringify(messages)
      );
    } catch (error) {
      console.error("Could not save chat history:", error);
    }
  }, [messages, user]);

  // Automatically scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside() {
      setProfileOpen(false);
    }

    if (profileOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [profileOpen]);

  async function handleAuth(event) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setAuthError("Please enter your email and password.");
      return;
    }

    setAuthError("");
    setAuthBusy(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      } else {
        await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
      }

      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Authentication error:", error);

      if (error.code === "auth/invalid-credential") {
        setAuthError("Incorrect email or password.");
      } else if (error.code === "auth/email-already-in-use") {
        setAuthError("This email is already registered.");
      } else if (error.code === "auth/weak-password") {
        setAuthError("Password must be at least 6 characters.");
      } else if (error.code === "auth/invalid-email") {
        setAuthError("Please enter a valid email address.");
      } else {
        setAuthError(error.message);
      }
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);
      setMessages([]);
      setProfileOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  function clearChat() {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to clear your chat history?"
    );

    if (!confirmed) return;

    setMessages([]);
    localStorage.removeItem(`ini-chat-${user.uid}`);
  }

  async function sendMessage() {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    const newUserMessage = {
      id: Date.now(),
      role: "user",
      text: userMessage,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setMessage("");
    setLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat`,
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

      const botMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: data.reply,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Connection error:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "Sorry, I couldn't connect to INI Bot. Please try again.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          error: true,
        },
      ]);
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

  function handleTextareaChange(event) {
    setMessage(event.target.value);

    event.target.style.height = "auto";
    event.target.style.height =
      Math.min(event.target.scrollHeight, 140) + "px";
  }

  function getInitial() {
    return user?.email?.charAt(0).toUpperCase() || "U";
  }

  if (authLoading) {
    return (
      <div className="loading-page">
        <div className="loading-logo">INI</div>
        <div className="loading-spinner"></div>
        <p>Loading INI Bot...</p>
      </div>
    );
  }

  // LOGIN / SIGN UP
  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-glow glow-one"></div>
        <div className="auth-glow glow-two"></div>

        <div className="auth-box">
          <div className="auth-logo">
            <span>INI</span>
          </div>

          <h1>
            {isLogin ? "Welcome back" : "Create your account"}
          </h1>

          <p className="auth-subtitle">
            {isLogin
              ? "Sign in to continue to INI Bot"
              : "Create an account and start chatting with INI Bot"}
          </p>

          <form onSubmit={handleAuth}>
            <label>Email</label>

            <div className="auth-input">
              <span>✉</span>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>

            <label>Password</label>

            <div className="auth-input">
              <span>🔒</span>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  isLogin ? "current-password" : "new-password"
                }
              />
            </div>

            {authError && (
              <div className="auth-error">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={authBusy}
            >
              {authBusy
                ? "Please wait..."
                : isLogin
                ? "Sign In"
                : "Create Account"}

              {!authBusy && <span>→</span>}
            </button>
          </form>

          <div className="auth-divider">
            <span></span>
            <p>OR</p>
            <span></span>
          </div>

          <p className="switch-auth">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              type="button"
              className="switch-button"
              onClick={() => {
                setIsLogin(!isLogin);
                setAuthError("");
              }}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>

          <p className="auth-footer">
            Your conversations are protected by Firebase authentication.
          </p>
        </div>
      </div>
    );
  }

  // CHAT APP
  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo">INI</div>

          <div className="brand-text">
            <h1>INI Bot</h1>
            <div className="online-status">
              <span></span>
              Online
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="clear-button"
            onClick={clearChat}
            title="Clear chat"
          >
            <span>⌫</span>
            <label>Clear</label>
          </button>

          <div className="profile-wrapper">
            <button
              className="profile-button"
              onClick={(event) => {
                event.stopPropagation();
                setProfileOpen(!profileOpen);
              }}
            >
              <div className="avatar">{getInitial()}</div>

              <span className="profile-arrow">
                {profileOpen ? "▲" : "▼"}
              </span>
            </button>

            {profileOpen && (
              <div
                className="profile-menu"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="profile-info">
                  <div className="large-avatar">
                    {getInitial()}
                  </div>

                  <div>
                    <strong>{user.email}</strong>
                    <small>Signed in</small>
                  </div>
                </div>

                <div className="menu-divider"></div>

                <button
                  className="logout-menu-button"
                  onClick={handleLogout}
                >
                  <span>↪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="chat">
        {messages.length === 0 ? (
          <div className="welcome">
            <div className="welcome-icon">
              <div className="robot-face">
                <span></span>
                <span></span>
              </div>
            </div>

            <h2>Hello, I'm INI 👋</h2>

            <p>
              Your personal AI assistant. Ask me anything,
              learn something new, write code, brainstorm ideas,
              or just have a conversation.
            </p>

            <div className="suggestions">
              <button
                onClick={() =>
                  setMessage("Explain artificial intelligence simply")
                }
              >
                💡 Explain something
              </button>

              <button
                onClick={() =>
                  setMessage("Help me write a Python program")
                }
              >
                💻 Help me code
              </button>

              <button
                onClick={() =>
                  setMessage("Give me some creative ideas")
                }
              >
                ✨ Give me ideas
              </button>
            </div>
          </div>
        ) : (
          <div className="messages-container">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${
                  msg.role === "user"
                    ? "user"
                    : "assistant"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="message-avatar">INI</div>
                )}

                <div className="message-content">
                  <div
                    className={`bubble ${
                      msg.error ? "error-bubble" : ""
                    }`}
                  >
                    {msg.text}
                  </div>

                  <div className="message-time">
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message assistant">
                <div className="message-avatar">INI</div>

                <div className="message-content">
                  <div className="bubble typing-bubble">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>
        )}
      </main>

      <div className="input-area">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Message INI Bot..."
            rows="1"
          />

          <button
            className="send-button"
            onClick={sendMessage}
            disabled={!message.trim() || loading}
          >
            {loading ? (
              <div className="button-spinner"></div>
            ) : (
              "↑"
            )}
          </button>
        </div>

        <p className="input-hint">
          Enter to send • Shift + Enter for a new line
        </p>
      </div>
    </div>
  );
}

export default App;
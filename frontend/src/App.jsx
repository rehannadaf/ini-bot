import { useEffect, useState } from "react";
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

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
    await signOut(auth);
    setMessages([]);
  }

  async function sendMessage() {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

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

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply,
        },
      ]);
    } catch (error) {
      console.error("Connection error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I couldn't connect to INI Bot.",
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

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-box">
          <h1>INI</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-box">
          <div className="auth-logo">INI</div>

          <h1>{isLogin ? "Welcome back" : "Create your account"}</h1>

          <p className="auth-subtitle">
            {isLogin
              ? "Sign in to continue to INI Bot"
              : "Create an account to use INI Bot"}
          </p>

          <form onSubmit={handleAuth}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />

            {authError && <div className="auth-error">{authError}</div>}

            <button type="submit" disabled={authBusy}>
              {authBusy
                ? "Please wait..."
                : isLogin
                ? "Sign In"
                : "Sign Up"}
            </button>
          </form>

          <p className="switch-auth">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}{" "}
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
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">INI</div>

        <div className="header-info">
          <h1>INI Bot</h1>
          <p>{user.email}</p>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
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
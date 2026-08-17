"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main>
      <div className="container">
        <img
          src="/TWHC-badge-white.png"
          alt="Telford & Wrekin Hockey Club"
          className="club-logo"
        />

        <h1>THE PREDICTOR</h1>

        <p className="subtitle">
          Predict the results. Score the points. Top the leaderboard.
        </p>

        <div className="card">
          <h2>Sign In</h2>

          <p>Enter your email address and password.</p>

          <form
            onSubmit={handleLogin}
            style={{
              display: "grid",
              gap: "18px",
              textAlign: "left",
            }}
          >
            <label>
              <strong
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontSize: "15px",
                }}
              >
                Email Address
              </strong>

              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  height: "54px",
                  padding: "0 16px",
                  borderRadius: "9px",
                  border: "1px solid #b8c6d4",
                  boxSizing: "border-box",
                  fontSize: "17px",
                  background: "#ffffff",
                  color: "#10243a",
                }}
              />
            </label>

            <label>
              <strong
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontSize: "15px",
                }}
              >
                Password
              </strong>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  height: "54px",
                  padding: "0 16px",
                  borderRadius: "9px",
                  border: "1px solid #b8c6d4",
                  boxSizing: "border-box",
                  fontSize: "17px",
                  background: "#ffffff",
                  color: "#10243a",
                }}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "2px",
              }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p style={{ marginTop: "20px" }}>
            <a href="/forgot-password">
              Forgot Password?
            </a>
          </p>

          <div
            style={{
              margin: "22px 0 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                height: "1px",
                background: "#d7dee7",
                flex: 1,
              }}
            />

            <span
              style={{
                color: "#536579",
                fontSize: "14px",
              }}
            >
              New to The Predictor?
            </span>

            <div
              style={{
                height: "1px",
                background: "#d7dee7",
                flex: 1,
              }}
            />
          </div>

          <a href="/register">
            <button>Create Account</button>
          </a>

          {message && (
            <p
              style={{
                marginTop: "18px",
                fontWeight: "700",
              }}
            >
              {message}
            </p>
          )}
        </div>

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>
    </main>
  );
}

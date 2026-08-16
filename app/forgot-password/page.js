"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleReset(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: "https://hockeypredictor.uk/reset-password",
      }
    );

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Password reset email sent. Please check your inbox."
    );

    setLoading(false);
  }

  return (
    <main>
      <div className="container">
        <div className="badge">TELFORD & WREKIN HC</div>

        <h1>THE PREDICTOR</h1>
        <p className="subtitle">Forgot Password</p>

        <div className="card">
          <h2>Reset Your Password</h2>

          <p>
            Enter the email address linked to your Predictor account.
          </p>

          <form
            onSubmit={handleReset}
            style={{
              display: "grid",
              gap: "16px",
              textAlign: "left",
            }}
          >
            <label>
              <strong>Email Address</strong>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  border: "1px solid #d7dee7",
                  boxSizing: "border-box",
                  fontSize: "16px",
                }}
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Email"}
            </button>
          </form>

          {message && (
            <p
              style={{
                marginTop: "18px",
                fontWeight: "bold",
              }}
            >
              {message}
            </p>
          )}
        </div>

        <a href="/login">
          <button>Back to Sign In</button>
        </a>

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>
    </main>
  );
}

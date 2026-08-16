"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setMessage(
          "This password reset link is invalid or has expired. Please request a new reset email."
        );
        return;
      }

      setReady(true);
    }

    checkSession();
  }, []);

  async function handleUpdatePassword(e) {
    e.preventDefault();

    setMessage("");

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();

    router.push("/login");
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
        <p className="subtitle">Reset Password</p>

        <div className="card">
          <h2>Choose A New Password</h2>

          {!ready ? (
            <p>{message || "Checking reset link..."}</p>
          ) : (
            <>
              <form
                onSubmit={handleUpdatePassword}
                style={{
                  display: "grid",
                  gap: "16px",
                  textAlign: "left",
                }}
              >
                <label>
                  <strong>New Password</strong>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

                <label>
                  <strong>Confirm New Password</strong>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {loading ? "Updating..." : "Update Password"}
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
            </>
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

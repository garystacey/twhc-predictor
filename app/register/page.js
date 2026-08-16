"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [teamName, setTeamName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();

    setMessage("");
    setSuccess(false);

    if (
      !teamName.trim() ||
      !firstName.trim() ||
      !surname.trim() ||
      !email.trim() ||
      !password
    ) {
      setMessage("Please complete all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          team_name: teamName.trim(),
          first_name: firstName.trim(),
          surname: surname.trim(),
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setMessage(
      "Registration successful. Please check your email and confirm your account before signing in."
    );
    setLoading(false);
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
        <p className="subtitle">Create Your Account</p>

        <div className="card">
          <h2>Register</h2>

          <form
            onSubmit={handleRegister}
            style={{
              display: "grid",
              gap: "16px",
              textAlign: "left",
            }}
          >
            <label>
              <strong>Predictor Team Name</strong>

              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Stick Wizards"
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
              <strong>First Name</strong>

              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
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
              <strong>Surname</strong>

              <input
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
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

            <label>
              <strong>Password</strong>

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
              <strong>Confirm Password</strong>

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
              {loading ? "Creating Account..." : "Create Account"}
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

          {success && (
            <a href="/login">
              <button style={{ marginTop: "10px" }}>
                Go to Sign In
              </button>
            </a>
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

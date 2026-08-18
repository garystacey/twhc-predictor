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
    <main className="login-page">
      {/* BACKGROUND EFFECTS */}

      <div className="blue-streak blue-streak-1" />
      <div className="blue-streak blue-streak-2" />

      <div className="red-streak red-streak-1" />
      <div className="red-streak red-streak-2" />

      <div className="login-shell">

        {/* HERO */}

        <div className="login-hero">
          <img
            src="/TWHC-badge-white.png"
            alt="Telford & Wrekin Hockey Club"
            className="login-badge"
          />

          <div className="login-title">
            THE PREDICTO
            <span>R</span>
          </div>

          <div className="login-tagline">
            <span>PREDICT.</span>
            <span>COMPETE.</span>
            <span>WIN.</span>
          </div>

          <p className="login-intro">
            Predict the results. Score the points. Top the leaderboard.
          </p>
        </div>

        {/* SIGN IN CARD */}

        <div className="login-card">
          <div className="login-card-heading">
            <div className="login-small-title">
              WELCOME BACK
            </div>

            <h2>Sign In</h2>

            <p>
              Enter your email address and password.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="login-form"
          >
            <label>
              <strong>
                Email Address
              </strong>

              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />
            </label>

            <label>
              <strong>
                Password
              </strong>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading
                ? "Signing In..."
                : "Sign In"}
            </button>
          </form>

          <a
            href="/forgot-password"
            className="forgot-link"
          >
            Forgot Password?
          </a>

          <div className="login-divider">
            <div />
            <span>NEW TO THE PREDICTOR?</span>
            <div />
          </div>

          <a href="/register">
            <button
              type="button"
              className="create-button"
            >
              Create Account
            </button>
          </a>

          {message && (
            <div className="login-message">
              {message}
            </div>
          )}
        </div>

        <p className="login-footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>

      <style jsx>{`
        .login-page {
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow: hidden;

          display: flex;
          justify-content: center;

          padding: 30px 16px 36px;

          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(20, 91, 180, 0.35),
              transparent 42%
            ),
            radial-gradient(
              circle at 90% 90%,
              rgba(237, 28, 36, 0.15),
              transparent 34%
            ),
            linear-gradient(
              180deg,
              #071d3a 0%,
              #031428 48%,
              #010916 100%
            );
        }

        .login-shell {
          position: relative;
          z-index: 2;

          width: 100%;
          max-width: 720px;

          text-align: center;
        }

        /* HERO */

        .login-hero {
          margin-bottom: 26px;
        }

        .login-badge {
          display: block;

          width: 120px;
          height: auto;

          margin: 0 auto 18px;

          filter:
            drop-shadow(
              0 8px 15px rgba(0, 0, 0, 0.45)
            )
            drop-shadow(
              0 0 16px rgba(35, 113, 255, 0.18)
            );
        }

        .login-title {
          color: #ffffff;

          font-size: 58px;
          line-height: 0.92;

          font-weight: 900;
          letter-spacing: -2px;

          white-space: nowrap;

          text-shadow:
            0 4px 0 rgba(0, 0, 0, 0.24),
            0 0 30px rgba(39, 113, 255, 0.15);
        }

        .login-title span {
          color: #ed1c24;

          text-shadow:
            0 0 18px rgba(237, 28, 36, 0.38);
        }

        .login-tagline {
          display: flex;
          justify-content: center;
          gap: 13px;

          margin-top: 15px;

          font-size: 12px;
          font-weight: 900;

          letter-spacing: 3px;
        }

        .login-tagline span:nth-child(1) {
          color: #ffffff;
        }

        .login-tagline span:nth-child(2) {
          color: #3298ff;
        }

        .login-tagline span:nth-child(3) {
          color: #ed1c24;
        }

        .login-intro {
          margin: 12px auto 0;

          color: #b4c8dc;

          font-size: 14px;
          line-height: 1.5;
        }

        /* CARD */

        .login-card {
          position: relative;

          padding: 26px 24px 24px;

          border-radius: 16px;

          background:
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.99),
              rgba(247, 250, 253, 0.99)
            );

          border:
            1px solid rgba(94, 143, 190, 0.34);

          box-shadow:
            0 20px 45px rgba(0, 0, 0, 0.42),
            0 4px 10px rgba(0, 0, 0, 0.18);

          overflow: hidden;
        }

        .login-card::before {
          content: "";

          position: absolute;

          top: 0;
          left: 0;

          width: 100%;
          height: 6px;

          background:
            linear-gradient(
              90deg,
              #9e0015 0%,
              #ed1c24 43%,
              #ff2d35 55%,
              #b90019 100%
            );

          box-shadow:
            0 2px 9px rgba(237, 28, 36, 0.3);
        }

        .login-card-heading {
          margin-bottom: 20px;
        }

        .login-small-title {
          margin-top: 2px;
          margin-bottom: 4px;

          color: #8192a3;

          font-size: 10px;
          font-weight: 900;

          letter-spacing: 1.4px;
        }

        .login-card h2 {
          margin: 0;

          color: #071d36;

          font-size: 28px;
          font-weight: 900;
        }

        .login-card-heading p {
          margin: 7px 0 0;

          color: #65788c;

          font-size: 13px;
        }

        /* FORM */

        .login-form {
          display: grid;
          gap: 16px;

          text-align: left;
        }

        .login-form label strong {
          display: block;

          margin-bottom: 6px;

          color: #21384f;

          font-size: 14px;
          font-weight: 900;
        }

        .login-form input {
          width: 100%;
          height: 58px;

          padding: 0 16px;

          border-radius: 10px;

          border:
            1px solid #bdccdc !important;

          background: #f8fafd;

          color: #10243a;

          font-size: 17px;

          box-sizing: border-box;

          outline: none;
        }

        .login-form input:focus {
          background: #ffffff;

          border-color:
            #087bd5 !important;

          box-shadow:
            0 0 0 3px
              rgba(8, 123, 213, 0.13);
        }

        /* SIGN IN */

        .login-button {
          margin-top: 3px;

          min-height: 52px;

          background:
            linear-gradient(
              90deg,
              #0577e5 0%,
              #168ff0 48%,
              #075fe2 100%
            );

          box-shadow:
            0 4px 0 #045697,
            0 8px 18px rgba(0, 87, 174, 0.24);

          font-size: 16px;
          font-weight: 900;
        }

        .forgot-link {
          display: inline-block;

          margin-top: 22px;

          color: #0877c9;

          font-size: 13px;
          font-weight: 800;

          text-decoration: none;
        }

        /* DIVIDER */

        .login-divider {
          display: flex;
          align-items: center;
          gap: 11px;

          margin: 23px 0 17px;
        }

        .login-divider div {
          flex: 1;
          height: 1px;

          background: #d5dde6;
        }

        .login-divider span {
          color: #7a8b9d;

          font-size: 10px;
          font-weight: 900;

          letter-spacing: 0.8px;

          white-space: nowrap;
        }

        /* CREATE */

        .create-button {
          min-height: 48px;

          background:
            linear-gradient(
              180deg,
              #102c4d 0%,
              #071d36 100%
            );

          box-shadow:
            0 3px 0 #020d19,
            0 7px 14px rgba(0, 0, 0, 0.19);

          font-weight: 900;
        }

        /* MESSAGE */

        .login-message {
          margin-top: 17px;

          padding: 11px 12px;

          border-radius: 9px;

          background: #fdeaea;

          border:
            1px solid #efb5b8;

          color: #c5161d;

          font-size: 13px;
          font-weight: 800;
        }

        /* FOOTER */

        .login-footer {
          margin-top: 24px;

          color: #849db6;

          font-size: 11px;
        }

        /* BACKGROUND STREAKS */

        .blue-streak,
        .red-streak {
          position: absolute;

          height: 3px;

          opacity: 0.55;

          transform: rotate(-34deg);

          pointer-events: none;
        }

        .blue-streak {
          background:
            linear-gradient(
              90deg,
              transparent,
              #087eff,
              transparent
            );

          box-shadow:
            0 0 15px rgba(8, 126, 255, 0.48);
        }

        .red-streak {
          background:
            linear-gradient(
              90deg,
              transparent,
              #ed1c24,
              transparent
            );

          box-shadow:
            0 0 15px rgba(237, 28, 36, 0.4);
        }

        .blue-streak-1 {
          width: 460px;

          left: -210px;
          top: 34%;
        }

        .blue-streak-2 {
          width: 370px;

          right: -180px;
          top: 67%;
        }

        .red-streak-1 {
          width: 390px;

          right: -200px;
          top: 28%;
        }

        .red-streak-2 {
          width: 440px;

          left: -220px;
          top: 77%;
        }

        /* MOBILE */

        @media (max-width: 600px) {
          .login-page {
            padding:
              24px 13px 30px;
          }

          .login-hero {
            margin-bottom: 22px;
          }

          .login-badge {
            width: 94px;

            margin-bottom: 14px;
          }

          .login-title {
            font-size: 40px;

            letter-spacing: -1.4px;
          }

          .login-tagline {
            gap: 8px;

            margin-top: 11px;

            font-size: 9px;

            letter-spacing: 2px;
          }

          .login-intro {
            margin-top: 9px;

            font-size: 11px;
          }

          .login-card {
            padding:
              23px 16px 19px;

            border-radius: 14px;
          }

          .login-card h2 {
            font-size: 24px;
          }

          .login-card-heading {
            margin-bottom: 17px;
          }

          .login-form {
            gap: 14px;
          }

          .login-form input {
            height: 56px;

            font-size: 16px;
          }

          .login-button {
            min-height: 50px;
          }

          .login-divider {
            margin:
              21px 0 16px;
          }

          .login-divider span {
            font-size: 9px;
          }
        }

        /* SMALL PHONES */

        @media (max-width: 380px) {
          .login-title {
            font-size: 35px;
          }

          .login-badge {
            width: 86px;
          }

          .login-tagline {
            letter-spacing: 1.5px;
          }

          .login-card {
            padding-left: 13px;
            padding-right: 13px;
          }
        }
      `}</style>
    </main>
  );
}

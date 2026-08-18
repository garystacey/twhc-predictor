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
    <main className="wow-login-page">
      <div className="energy energy-blue energy-blue-1" />
      <div className="energy energy-blue energy-blue-2" />
      <div className="energy energy-red energy-red-1" />
      <div className="energy energy-red energy-red-2" />

      <div className="wow-shell">
        {/* REAL CLUB BADGE */}

        <img
          src="/TWHC-badge-white.png"
          alt="Telford & Wrekin Hockey Club"
          className="wow-badge"
        />

        {/* BRANDING */}

        <div className="wow-brand">
          <div className="wow-title">
            THE
            <br className="mobile-title-break" />
            <span className="wow-title-main">
              PREDICTO<span className="wow-red-r">R</span>
            </span>
          </div>

          <div className="wow-glow-line" />

          <div className="wow-tagline">
            <span className="tag-blue">PREDICT</span>
            <span className="tag-dot">•</span>
            <span className="tag-white">COMPETE</span>
            <span className="tag-dot">•</span>
            <span className="tag-red">WIN</span>
          </div>
        </div>

        {/* LOGIN PANEL */}

        <div className="wow-login-card">
          <div className="welcome-label">
            WELCOME BACK
          </div>

          <h2>Sign In</h2>

          <p className="welcome-copy">
            Enter your email address and password to continue
          </p>

          <form
            onSubmit={handleLogin}
            className="wow-form"
          >
            <label>
              <strong>EMAIL ADDRESS</strong>

              <div className="field-wrap">
                <span className="field-icon blue-icon">
                  @
                </span>

                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />
              </div>
            </label>

            <label>
              <strong>PASSWORD</strong>

              <div className="field-wrap">
                <span className="field-icon red-icon">
                  ●
                </span>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="wow-sign-in"
            >
              {loading
                ? "SIGNING IN..."
                : "SIGN IN  →"}
            </button>
          </form>

          <a
            href="/forgot-password"
            className="wow-forgot"
          >
            Forgot Password?
          </a>

          <div className="wow-divider">
            <div />
            <span>NEW TO THE PREDICTOR?</span>
            <div />
          </div>

          <a href="/register">
            <button
              type="button"
              className="wow-create"
            >
              ＋ CREATE ACCOUNT
            </button>
          </a>

          {message && (
            <div className="wow-message">
              {message}
            </div>
          )}
        </div>

        <div className="wow-footer">
          <img
            src="/TWHC-badge-white.png"
            alt=""
            className="wow-footer-badge"
          />

          <div>
            Telford & Wrekin Hockey Club
          </div>
        </div>
      </div>

      <style jsx>{`
        .wow-login-page {
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow: hidden;

          display: flex;
          justify-content: center;

          padding: 24px 14px 34px;

          background:
            radial-gradient(
              circle at 10% 45%,
              rgba(0, 108, 255, 0.18),
              transparent 32%
            ),
            radial-gradient(
              circle at 92% 55%,
              rgba(237, 28, 36, 0.18),
              transparent 35%
            ),
            radial-gradient(
              circle at 50% -5%,
              rgba(24, 92, 180, 0.24),
              transparent 34%
            ),
            linear-gradient(
              180deg,
              #05162c 0%,
              #020b18 62%,
              #010610 100%
            );
        }

        .wow-shell {
          position: relative;
          z-index: 2;

          width: 100%;
          max-width: 560px;

          text-align: center;
        }

        /* BADGE */

        .wow-badge {
          display: block;

          width: 112px;
          height: auto;

          margin: 0 auto 15px;

          filter:
            drop-shadow(
              0 8px 14px rgba(0, 0, 0, 0.45)
            )
            drop-shadow(
              0 0 14px rgba(0, 110, 255, 0.16)
            );
        }

        /* BRAND */

        .wow-brand {
          margin-bottom: 22px;
        }

        .wow-title {
          color: #ffffff;

          font-size: 22px;
          line-height: 0.9;

          font-weight: 900;

          letter-spacing: 2px;

          text-shadow:
            0 4px 0 rgba(0, 0, 0, 0.28),
            0 0 22px rgba(20, 112, 255, 0.12);
        }

        .wow-title-main {
          display: inline-block;

          margin-top: 7px;

          font-size: 62px;
          letter-spacing: -2px;

          white-space: nowrap;
        }

        .wow-red-r {
          color: #ed1c24;

          text-shadow:
            0 0 20px rgba(237, 28, 36, 0.48);
        }

        .mobile-title-break {
          display: none;
        }

        .wow-glow-line {
          width: 82%;
          height: 2px;

          margin: 13px auto 12px;

          background:
            linear-gradient(
              90deg,
              transparent 0%,
              #087eff 25%,
              #ffffff 50%,
              #ed1c24 75%,
              transparent 100%
            );

          box-shadow:
            0 0 15px rgba(35, 128, 255, 0.36);
        }

        .wow-tagline {
          display: flex;
          justify-content: center;
          align-items: center;

          gap: 10px;

          font-size: 13px;
          font-weight: 900;

          letter-spacing: 3px;
        }

        .tag-blue {
          color: #2792ff;
        }

        .tag-white {
          color: #ffffff;
        }

        .tag-red {
          color: #ed1c24;
        }

        .tag-dot {
          color: #8aa0b8;
        }

        /* CARD */

        .wow-login-card {
          position: relative;

          padding: 27px 24px 24px;

          border-radius: 18px;

          color: #ffffff;

          background:
            linear-gradient(
              180deg,
              rgba(13, 30, 56, 0.93) 0%,
              rgba(7, 20, 40, 0.95) 100%
            );

          border:
            1px solid rgba(126, 155, 196, 0.45);

          box-shadow:
            0 24px 55px rgba(0, 0, 0, 0.55),
            inset 0 0 24px rgba(255, 255, 255, 0.025);

          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .welcome-label {
          margin-bottom: 5px;

          color: #ff3440;

          font-size: 11px;
          font-weight: 900;

          letter-spacing: 2px;
        }

        .wow-login-card h2 {
          margin: 0;

          color: #ffffff;

          font-size: 31px;
          font-weight: 900;
        }

        .welcome-copy {
          margin: 8px 0 20px;

          color: #b4bfd0;

          font-size: 13px;
          line-height: 1.45;
        }

        /* FORM */

        .wow-form {
          display: grid;
          gap: 16px;

          text-align: left;
        }

        .wow-form label strong {
          display: block;

          margin-bottom: 7px;

          color: #ffffff;

          font-size: 12px;
          font-weight: 900;

          letter-spacing: 0.8px;
        }

        .field-wrap {
          position: relative;
        }

        .field-icon {
          position: absolute;

          left: 15px;
          top: 50%;

          transform: translateY(-50%);

          z-index: 2;

          display: flex;
          align-items: center;
          justify-content: center;

          width: 24px;

          font-size: 17px;
          font-weight: 900;
        }

        .blue-icon {
          color: #2792ff;
        }

        .red-icon {
          color: #ff3440;
        }

        .wow-form input {
          width: 100%;
          height: 57px;

          padding: 0 16px 0 48px;

          border-radius: 10px;

          border:
            1px solid rgba(144, 166, 201, 0.45) !important;

          background:
            rgba(5, 16, 34, 0.62);

          color: #ffffff;

          font-size: 16px;

          box-sizing: border-box;

          outline: none;
        }

        .wow-form input::placeholder {
          color: #8291a5;
        }

        .wow-form input:focus {
          border-color:
            #278eff !important;

          background:
            rgba(5, 16, 34, 0.78);

          box-shadow:
            0 0 0 3px
              rgba(39, 142, 255, 0.12),
            0 0 16px
              rgba(39, 142, 255, 0.12);
        }

        /* SIGN IN */

        .wow-sign-in {
          min-height: 54px;

          margin-top: 4px;

          border-radius: 10px;

          background:
            linear-gradient(
              90deg,
              #0069f6 0%,
              #405eea 38%,
              #c12665 72%,
              #ed1c24 100%
            );

          box-shadow:
            0 4px 0 rgba(0, 0, 0, 0.3),
            0 9px 22px rgba(13, 75, 180, 0.28),
            0 0 20px rgba(237, 28, 36, 0.1);

          font-size: 15px;
          font-weight: 900;

          letter-spacing: 1.2px;
        }

        .wow-forgot {
          display: inline-block;

          margin-top: 20px;

          color: #3499ff;

          font-size: 13px;
          font-weight: 800;

          text-decoration: none;
        }

        /* DIVIDER */

        .wow-divider {
          display: flex;
          align-items: center;

          gap: 12px;

          margin: 22px 0 17px;
        }

        .wow-divider div {
          flex: 1;
          height: 1px;

          background:
            rgba(153, 171, 199, 0.35);
        }

        .wow-divider span {
          color: #96a5b8;

          font-size: 9px;
          font-weight: 900;

          letter-spacing: 1.2px;

          white-space: nowrap;
        }

        /* CREATE */

        .wow-create {
          min-height: 49px;

          border:
            1px solid #ed1c24;

          background:
            rgba(237, 28, 36, 0.025);

          color: #ff3440;

          box-shadow:
            0 0 14px rgba(237, 28, 36, 0.06);

          font-size: 13px;
          font-weight: 900;

          letter-spacing: 1px;
        }

        .wow-create:hover {
          background:
            rgba(237, 28, 36, 0.08);
        }

        /* ERROR */

        .wow-message {
          margin-top: 17px;

          padding: 11px 12px;

          border-radius: 9px;

          background:
            rgba(237, 28, 36, 0.12);

          border:
            1px solid rgba(237, 28, 36, 0.38);

          color: #ff9da1;

          font-size: 12px;
          font-weight: 800;
        }

        /* FOOTER */

        .wow-footer {
          margin-top: 23px;

          display: flex;
          flex-direction: column;
          align-items: center;

          gap: 7px;

          color: #8799ad;

          font-size: 11px;
        }

        .wow-footer-badge {
          width: 42px;
          height: auto;

          opacity: 0.75;
        }

        /* ENERGY */

        .energy {
          position: absolute;

          pointer-events: none;

          opacity: 0.65;
        }

        .energy-blue {
          background:
            linear-gradient(
              135deg,
              transparent 15%,
              rgba(15, 121, 255, 0.95) 48%,
              transparent 52%
            );

          filter:
            drop-shadow(
              0 0 12px rgba(15, 121, 255, 0.6)
            );
        }

        .energy-red {
          background:
            linear-gradient(
              135deg,
              transparent 15%,
              rgba(237, 28, 36, 0.95) 48%,
              transparent 52%
            );

          filter:
            drop-shadow(
              0 0 12px rgba(237, 28, 36, 0.5)
            );
        }

        .energy-blue-1 {
          width: 470px;
          height: 170px;

          left: -250px;
          top: 19%;

          transform: rotate(-8deg);
        }

        .energy-blue-2 {
          width: 390px;
          height: 150px;

          right: -230px;
          bottom: 12%;

          transform: rotate(7deg);
        }

        .energy-red-1 {
          width: 430px;
          height: 160px;

          right: -250px;
          top: 25%;

          transform: rotate(8deg);
        }

        .energy-red-2 {
          width: 390px;
          height: 150px;

          left: -220px;
          bottom: 15%;

          transform: rotate(-8deg);
        }

        /* MOBILE */

        @media (max-width: 600px) {
          .wow-login-page {
            padding:
              18px 12px 28px;
          }

          .wow-shell {
            max-width: 100%;
          }

          .wow-badge {
            width: 92px;

            margin-bottom: 11px;
          }

          .wow-brand {
            margin-bottom: 17px;
          }

          .wow-title {
            font-size: 17px;
          }

          .wow-title-main {
            margin-top: 5px;

            font-size: 43px;

            letter-spacing: -1.4px;
          }

          .wow-tagline {
            gap: 6px;

            font-size: 9px;

            letter-spacing: 1.8px;
          }

          .wow-glow-line {
            margin:
              10px auto 10px;
          }

          .wow-login-card {
            padding:
              23px 16px 20px;

            border-radius: 15px;
          }

          .wow-login-card h2 {
            font-size: 26px;
          }

          .welcome-copy {
            margin-bottom: 17px;

            font-size: 12px;
          }

          .wow-form {
            gap: 14px;
          }

          .wow-form input {
            height: 55px;

            font-size: 16px;
          }

          .wow-sign-in {
            min-height: 52px;
          }
        }

        /* SMALL PHONES */

        @media (max-width: 380px) {
          .wow-badge {
            width: 82px;
          }

          .wow-title-main {
            font-size: 38px;
          }

          .wow-tagline {
            font-size: 8px;

            letter-spacing: 1.4px;
          }

          .wow-login-card {
            padding-left: 13px;
            padding-right: 13px;
          }
        }
      `}</style>
    </main>
  );
}

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
      {/* BACKGROUND ENERGY */}

      <div className="energy energy-blue energy-blue-1" />
      <div className="energy energy-blue energy-blue-2" />

      <div className="energy energy-red energy-red-1" />
      <div className="energy energy-red energy-red-2" />

      <div className="wow-shell">
        {/* REAL TELFORD & WREKIN BADGE */}

        <img
          src="/TWHC-badge-white.png"
          alt="Telford & Wrekin Hockey Club"
          className="wow-badge"
        />

        {/* BRANDING */}

        <div className="wow-brand">
          <div className="wow-title">
            <span className="wow-the">
              THE
            </span>

            <span className="wow-title-main">
              PREDICTO
              <span className="wow-red-r">
                R
              </span>
            </span>
          </div>

          <div className="wow-glow-line" />

          <div className="wow-tagline">
            <span className="tag-blue">
              PREDICT
            </span>

            <span className="tag-dot">
              •
            </span>

            <span className="tag-white">
              COMPETE
            </span>

            <span className="tag-dot">
              •
            </span>

            <span className="tag-red">
              WIN
            </span>
          </div>
        </div>

        {/* LOGIN PANEL */}

        <div className="wow-login-card">
          <div className="welcome-label">
            WELCOME BACK
          </div>

          <h2>
            Sign In
          </h2>

          <p className="welcome-copy">
            Enter your email address and password to continue
          </p>

          <form
            onSubmit={handleLogin}
            className="wow-form"
          >
            {/* EMAIL */}

            <label>
              <strong>
                EMAIL ADDRESS
              </strong>

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

            {/* PASSWORD */}

            <label>
              <strong>
                PASSWORD
              </strong>

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

            {/* SIGN IN */}

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

          {/* FORGOT PASSWORD */}

          <a
            href="/forgot-password"
            className="wow-forgot"
          >
            Forgot Password?
          </a>

          {/* DIVIDER */}

          <div className="wow-divider">
            <div />

            <span>
              NEW TO THE PREDICTOR?
            </span>

            <div />
          </div>

          {/* CREATE ACCOUNT */}

          <a href="/register">
            <button
              type="button"
              className="wow-create"
            >
              ＋ CREATE ACCOUNT
            </button>
          </a>

          {/* ERROR MESSAGE */}

          {message && (
            <div className="wow-message">
              {message}
            </div>
          )}
        </div>

        {/* FOOTER */}

        <div className="wow-footer">
          Telford & Wrekin Hockey Club
        </div>
      </div>

      <style jsx>{`
        /* =====================================================
           PAGE
           ===================================================== */

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

        /* =====================================================
           BADGE
           ===================================================== */

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

        /* =====================================================
           BRANDING
           ===================================================== */

        .wow-brand {
          margin-bottom: 22px;
        }

        .wow-title {
          display: flex;
          align-items: baseline;
          justify-content: center;

          gap: 10px;

          color: #ffffff;

          line-height: 0.95;

          font-weight: 900;

          white-space: nowrap;

          text-shadow:
            0 4px 0 rgba(0, 0, 0, 0.28),
            0 0 22px rgba(20, 112, 255, 0.12);
        }

        .wow-the {
          font-size: 22px;

          letter-spacing: 1px;
        }

        .wow-title-main {
          display: inline-block;

          font-size: 62px;

          letter-spacing: -2px;

          white-space: nowrap;
        }

        .wow-red-r {
          color: #ed1c24;

          text-shadow:
            0 0 20px rgba(237, 28, 36, 0.48);
        }

        /* GLOW LINE */

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

        /* TAGLINE */

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

        /* =====================================================
           LOGIN CARD
           ===================================================== */

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
            inset 0 0 24px
              rgba(255, 255, 255, 0.025);

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

        /* =====================================================
           FORM
           ===================================================== */

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
            1px solid
            rgba(144, 166, 201, 0.45) !important;

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

        /* =====================================================
           SIGN IN BUTTON
           ===================================================== */

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
            0 9px 22px
              rgba(13, 75, 180, 0.28),
            0 0 20px
              rgba(237, 28, 36, 0.1);

          font-size: 15px;
          font-weight: 900;

          letter-spacing: 1.2px;
        }

        /* =====================================================
           FORGOT PASSWORD
           ===================================================== */

        .wow-forgot {
          display: inline-block;

          margin-top: 20px;

          color: #3499ff;

          font-size: 13px;
          font-weight: 800;

          text-decoration: none;
        }

        /* =====================================================
           DIVIDER
           ===================================================== */

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

        /* =====================================================
           CREATE ACCOUNT
           ===================================================== */

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

        /* =====================================================
           ERROR MESSAGE
           ===================================================== */

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

        /* =====================================================
           FOOTER
           ===================================================== */

        .wow-footer {
          margin-top: 23px;

          color: #8799ad;

          font-size: 11px;
        }

        /* =====================================================
           BACKGROUND ENERGY
           ===================================================== */

        .energy {
          position: absolute;

          pointer-events: none;

          opacity: 0.55;
        }

        .energy-blue {
          background:
            linear-gradient(
              135deg,
              transparent 28%,
              rgba(15, 121, 255, 0.9) 48%,
              transparent 54%
            );

          filter:
            blur(1px)
            drop-shadow(
              0 0 14px
              rgba(15, 121, 255, 0.5)
            );
        }

        .energy-red {
          background:
            linear-gradient(
              135deg,
              transparent 28%,
              rgba(237, 28, 36, 0.9) 48%,
              transparent 54%
            );

          filter:
            blur(1px)
            drop-shadow(
              0 0 14px
              rgba(237, 28, 36, 0.45)
            );
        }

        .energy-blue-1 {
          width: 520px;
          height: 95px;

          left: -290px;
          top: 22%;

          transform: rotate(-13deg);
        }

        .energy-blue-2 {
          width: 440px;
          height: 85px;

          right: -260px;
          bottom: 13%;

          transform: rotate(10deg);
        }

        .energy-red-1 {
          width: 480px;
          height: 90px;

          right: -280px;
          top: 28%;

          transform: rotate(12deg);
        }

        .energy-red-2 {
          width: 430px;
          height: 85px;

          left: -250px;
          bottom: 16%;

          transform: rotate(-10deg);
        }

        /* =====================================================
           MOBILE
           ===================================================== */

        @media (max-width: 600px) {
          .wow-login-page {
            padding:
              18px 12px 28px;
          }

          .wow-shell {
            max-width: 100%;
          }

          /* BADGE */

          .wow-badge {
            width: 92px;

            margin-bottom: 13px;
          }

          /* BRAND */

          .wow-brand {
            margin-bottom: 17px;
          }

          .wow-title {
            gap: 7px;

            line-height: 1;

            white-space: nowrap;
          }

          .wow-the {
            font-size: 28px;

            letter-spacing: -0.8px;
          }

          .wow-title-main {
            font-size: 42px;

            letter-spacing: -1.5px;

            white-space: nowrap;
          }

          .wow-glow-line {
            width: 86%;

            margin:
              11px auto 10px;
          }

          .wow-tagline {
            gap: 6px;

            font-size: 9px;

            letter-spacing: 1.8px;
          }

          /* CARD */

          .wow-login-card {
            padding:
              23px 16px 20px;

            border-radius: 15px;
          }

          .welcome-label {
            font-size: 10px;

            letter-spacing: 1.8px;
          }

          .wow-login-card h2 {
            font-size: 26px;
          }

          .welcome-copy {
            margin-bottom: 17px;

            font-size: 12px;
          }

          /* FORM */

          .wow-form {
            gap: 14px;
          }

          .wow-form input {
            height: 55px;

            font-size: 16px;
          }

          /* BUTTON */

          .wow-sign-in {
            min-height: 52px;
          }

          /* ENERGY */

          .energy-blue-1 {
            left: -350px;
            top: 21%;
          }

          .energy-red-1 {
            right: -350px;
            top: 30%;
          }

          .energy-blue-2 {
            right: -330px;
          }

          .energy-red-2 {
            left: -330px;
          }

          /* FOOTER */

          .wow-footer {
            margin-top: 20px;

            padding-bottom: 12px;
          }
        }

        /* =====================================================
           SMALL PHONES
           ===================================================== */

        @media (max-width: 380px) {
          .wow-login-page {
            padding-left: 9px;
            padding-right: 9px;
          }

          .wow-badge {
            width: 82px;
          }

          .wow-title {
            gap: 5px;
          }

          .wow-the {
            font-size: 23px;
          }

          .wow-title-main {
            font-size: 35px;

            letter-spacing: -1.3px;
          }

          .wow-tagline {
            font-size: 8px;

            letter-spacing: 1.3px;
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

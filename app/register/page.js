"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function RegisterPage() {
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
    <main className="wow-register-page">
      {/* BACKGROUND ENERGY */}

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

        {/* REGISTER PANEL */}

        <div className="wow-register-card">
          <div className="register-label">
            JOIN THE COMPETITION
          </div>

          <h2>Create Account</h2>

          <p className="register-copy">
            Create your Predictor account and choose your team name.
          </p>

          <form
            onSubmit={handleRegister}
            className="wow-form"
          >
            {/* TEAM NAME */}

            <label>
              <strong>
                PREDICTOR TEAM NAME
              </strong>

              <div className="field-wrap">
                <span className="field-icon blue-icon">
                  ★
                </span>

                <input
                  type="text"
                  value={teamName}
                  onChange={(e) =>
                    setTeamName(e.target.value)
                  }
                  placeholder="e.g. Stick Wizards"
                  required
                />
              </div>
            </label>

            {/* NAME ROW */}

            <div className="name-grid">
              <label>
                <strong>
                  FIRST NAME
                </strong>

                <div className="field-wrap">
                  <span className="field-icon blue-icon">
                    ●
                  </span>

                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) =>
                      setFirstName(e.target.value)
                    }
                    placeholder="First name"
                    required
                  />
                </div>
              </label>

              <label>
                <strong>
                  SURNAME
                </strong>

                <div className="field-wrap">
                  <span className="field-icon blue-icon">
                    ●
                  </span>

                  <input
                    type="text"
                    value={surname}
                    onChange={(e) =>
                      setSurname(e.target.value)
                    }
                    placeholder="Surname"
                    required
                  />
                </div>
              </label>
            </div>

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
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email address"
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
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>
            </label>

            {/* CONFIRM PASSWORD */}

            <label>
              <strong>
                CONFIRM PASSWORD
              </strong>

              <div className="field-wrap">
                <span className="field-icon red-icon">
                  ●
                </span>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Enter your password again"
                  required
                />
              </div>
            </label>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="wow-register-button"
            >
              {loading
                ? "CREATING ACCOUNT..."
                : "CREATE ACCOUNT  →"}
            </button>
          </form>

          {/* MESSAGE */}

          {message && (
            <div
              className={
                success
                  ? "wow-message success"
                  : "wow-message error"
              }
            >
              {message}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <a
              href="/login"
              className="success-link-wrap"
            >
              <button
                type="button"
                className="wow-sign-in-link"
              >
                GO TO SIGN IN
              </button>
            </a>
          )}

          {/* DIVIDER */}

          {!success && (
            <>
              <div className="wow-divider">
                <div />

                <span>
                  ALREADY REGISTERED?
                </span>

                <div />
              </div>

              <a href="/login">
                <button
                  type="button"
                  className="wow-back"
                >
                  BACK TO SIGN IN
                </button>
              </a>
            </>
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

        .wow-register-page {
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
          max-width: 620px;

          text-align: center;
        }

        /* =====================================================
           BADGE
           ===================================================== */

        .wow-badge {
          display: block;

          width: 105px;
          height: auto;

          margin: 0 auto 13px;

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
          margin-bottom: 20px;
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
          font-size: 21px;

          letter-spacing: 1px;
        }

        .wow-title-main {
          font-size: 57px;

          letter-spacing: -2px;

          white-space: nowrap;
        }

        .wow-red-r {
          color: #ed1c24;

          text-shadow:
            0 0 20px rgba(237, 28, 36, 0.48);
        }

        .wow-glow-line {
          width: 82%;
          height: 2px;

          margin: 12px auto 11px;

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
            0 0 15px
              rgba(35, 128, 255, 0.36);
        }

        .wow-tagline {
          display: flex;

          justify-content: center;
          align-items: center;

          gap: 10px;

          font-size: 12px;
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
           CARD
           ===================================================== */

        .wow-register-card {
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
            1px solid
              rgba(126, 155, 196, 0.45);

          box-shadow:
            0 24px 55px
              rgba(0, 0, 0, 0.55),
            inset 0 0 24px
              rgba(255, 255, 255, 0.025);

          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .register-label {
          margin-bottom: 5px;

          color: #ff3440;

          font-size: 11px;
          font-weight: 900;

          letter-spacing: 2px;
        }

        .wow-register-card h2 {
          margin: 0;

          color: #ffffff;

          font-size: 31px;
          font-weight: 900;
        }

        .register-copy {
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

          gap: 15px;

          text-align: left;
        }

        .wow-form label strong {
          display: block;

          margin-bottom: 7px;

          color: #ffffff;

          font-size: 11px;
          font-weight: 900;

          letter-spacing: 0.8px;
        }

        .name-grid {
          display: grid;

          grid-template-columns: 1fr 1fr;

          gap: 12px;
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

          font-size: 16px;
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
          height: 54px;

          padding: 0 16px 0 48px;

          border-radius: 10px;

          border:
            1px solid
            rgba(144, 166, 201, 0.45) !important;

          background:
            rgba(5, 16, 34, 0.62);

          color: #ffffff;

          font-size: 15px;

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
           CREATE ACCOUNT BUTTON
           ===================================================== */

        .wow-register-button {
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
            0 4px 0
              rgba(0, 0, 0, 0.3),
            0 9px 22px
              rgba(13, 75, 180, 0.28),
            0 0 20px
              rgba(237, 28, 36, 0.1);

          font-size: 14px;
          font-weight: 900;

          letter-spacing: 1.2px;
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
           BACK / SUCCESS BUTTONS
           ===================================================== */

        .wow-back,
        .wow-sign-in-link {
          min-height: 49px;

          border:
            1px solid #ed1c24;

          background:
            rgba(237, 28, 36, 0.025);

          color: #ff3440;

          box-shadow:
            0 0 14px
              rgba(237, 28, 36, 0.06);

          font-size: 13px;
          font-weight: 900;

          letter-spacing: 1px;
        }

        .wow-back:hover,
        .wow-sign-in-link:hover {
          background:
            rgba(237, 28, 36, 0.08);
        }

        .success-link-wrap {
          display: block;

          margin-top: 14px;
        }

        /* =====================================================
           MESSAGES
           ===================================================== */

        .wow-message {
          margin-top: 17px;

          padding: 12px;

          border-radius: 9px;

          font-size: 12px;
          font-weight: 800;

          line-height: 1.45;
        }

        .wow-message.error {
          background:
            rgba(237, 28, 36, 0.12);

          border:
            1px solid
              rgba(237, 28, 36, 0.38);

          color: #ff9da1;
        }

        .wow-message.success {
          background:
            rgba(20, 150, 79, 0.14);

          border:
            1px solid
              rgba(69, 194, 117, 0.38);

          color: #8ce1ab;
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
           ENERGY
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
          .wow-register-page {
            padding:
              18px 12px 28px;
          }

          .wow-shell {
            max-width: 100%;
          }

          .wow-badge {
            width: 86px;

            margin-bottom: 11px;
          }

          .wow-brand {
            margin-bottom: 16px;
          }

          .wow-title {
            gap: 7px;
          }

          .wow-the {
            font-size: 27px;
          }

          .wow-title-main {
            font-size: 41px;

            letter-spacing: -1.5px;
          }

          .wow-glow-line {
            width: 86%;

            margin:
              10px auto 9px;
          }

          .wow-tagline {
            gap: 6px;

            font-size: 9px;

            letter-spacing: 1.8px;
          }

          .wow-register-card {
            padding:
              22px 16px 20px;

            border-radius: 15px;
          }

          .wow-register-card h2 {
            font-size: 26px;
          }

          .register-copy {
            margin-bottom: 17px;

            font-size: 12px;
          }

          .wow-form {
            gap: 14px;
          }

          .name-grid {
            grid-template-columns: 1fr;

            gap: 14px;
          }

          .wow-form input {
            height: 55px;

            font-size: 16px;
          }

          .wow-register-button {
            min-height: 52px;
          }

          .energy-blue-1 {
            left: -350px;
          }

          .energy-red-1 {
            right: -350px;
          }

          .energy-blue-2 {
            right: -330px;
          }

          .energy-red-2 {
            left: -330px;
          }

          .wow-footer {
            margin-top: 20px;

            padding-bottom: 12px;
          }
        }

        /* =====================================================
           SMALL PHONES
           ===================================================== */

        @media (max-width: 380px) {
          .wow-register-page {
            padding-left: 9px;
            padding-right: 9px;
          }

          .wow-badge {
            width: 78px;
          }

          .wow-title {
            gap: 5px;
          }

          .wow-the {
            font-size: 23px;
          }

          .wow-title-main {
            font-size: 35px;
          }

          .wow-tagline {
            font-size: 8px;

            letter-spacing: 1.3px;
          }

          .wow-register-card {
            padding-left: 13px;
            padding-right: 13px;
          }
        }
      `}</style>
    </main>
  );
}

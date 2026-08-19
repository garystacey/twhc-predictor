"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("first_name, surname, team_name, role")
          .eq("id", user.id)
          .single();

        setProfile(data);
      }

      setLoading(false);
    }

    checkUser();
  }, []);

  async function handleSignOut() {
    setSigningOut(true);

    await supabase.auth.signOut();

    window.location.reload();
  }

  return (
    <main className="wow-home-page">
      {/* BACKGROUND ENERGY */}

      <div className="energy energy-blue energy-blue-1" />
      <div className="energy energy-blue energy-blue-2" />
      <div className="energy energy-red energy-red-1" />
      <div className="energy energy-red energy-red-2" />

      <div className="wow-shell">
        {/* BADGE */}

        <img
          src="/TWHC-badge-white.png"
          alt="Telford & Wrekin Hockey Club"
          className="wow-badge"
        />

        {/* BRAND */}

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

        {/* MAIN PANEL */}

        <div className="wow-home-card">
          {loading ? (
            <>
              <div className="eyebrow">
                LOADING
              </div>

              <h2>
                Getting The Predictor Ready...
              </h2>

              <div className="loading-bar">
                <div className="loading-bar-inner" />
              </div>
            </>
          ) : user ? (
            <>
              <div className="eyebrow">
                WELCOME BACK
              </div>

              <h2>
                {profile?.first_name
                  ? profile.first_name
                  : "Predictor"}
              </h2>

              {profile?.team_name && (
                <div className="team-badge">
                  {profile.team_name}
                </div>
              )}

              {profile?.role === "admin" && (
                <div className="admin-badge">
                  ADMINISTRATOR
                </div>
              )}

              <p className="welcome-copy">
                Your Predictor account is ready.
              </p>

              <a
                href="/predictor"
                className="main-link"
              >
                <button className="enter-button">
                  ENTER THE PREDICTOR →
                </button>
              </a>

              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="signout-button"
              >
                {signingOut
                  ? "SIGNING OUT..."
                  : "SIGN OUT"}
              </button>

              <div className="signed-in-note">
                Signed in as {user.email}
              </div>
            </>
          ) : (
            <>
              <div className="eyebrow">
                WELCOME
              </div>

              <h2>
                Ready to Predict?
              </h2>

              <p className="welcome-copy">
                Sign in to make your selections,
                track your points and climb the leaderboard.
              </p>

              <a
                href="/login"
                className="main-link"
              >
                <button className="enter-button">
                  SIGN IN →
                </button>
              </a>
            </>
          )}
        </div>

        <div className="wow-footer">
          Telford & Wrekin Hockey Club
        </div>
      </div>

      <style jsx>{`
        .wow-home-page {
          position: relative;

          min-height: 100vh;
          width: 100%;

          display: flex;
          justify-content: center;

          overflow: hidden;

          padding: 24px 14px 34px;

          background:
            radial-gradient(
              circle at 12% 45%,
              rgba(0, 108, 255, 0.18),
              transparent 32%
            ),
            radial-gradient(
              circle at 90% 55%,
              rgba(237, 28, 36, 0.18),
              transparent 34%
            ),
            radial-gradient(
              circle at 50% -5%,
              rgba(24, 92, 180, 0.25),
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

        .wow-badge {
          display: block;

          width: 100px;
          height: auto;

          margin: 0 auto 12px;

          filter:
            drop-shadow(
              0 8px 14px rgba(0, 0, 0, 0.45)
            )
            drop-shadow(
              0 0 14px rgba(0, 110, 255, 0.16)
            );
        }

        .wow-brand {
          margin-bottom: 22px;
        }

        .wow-title {
          display: flex;
          align-items: baseline;
          justify-content: center;

          gap: 9px;

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
          font-size: 56px;

          letter-spacing: -2px;
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
            0 0 15px rgba(35, 128, 255, 0.36);
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

        .wow-home-card {
          position: relative;

          padding: 30px 24px 24px;

          border-radius: 18px;

          background:
            linear-gradient(
              180deg,
              rgba(13, 30, 56, 0.94) 0%,
              rgba(7, 20, 40, 0.97) 100%
            );

          border:
            1px solid rgba(126, 155, 196, 0.45);

          color: #ffffff;

          box-shadow:
            0 24px 55px rgba(0, 0, 0, 0.55),
            inset 0 0 24px rgba(255, 255, 255, 0.025);

          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .eyebrow {
          margin-bottom: 6px;

          color: #ff3440;

          font-size: 11px;
          font-weight: 900;

          letter-spacing: 2px;
        }

        .wow-home-card h2 {
          margin: 0;

          color: #ffffff;

          font-size: 34px;
          font-weight: 900;

          line-height: 1.05;
        }

        .team-badge {
          display: inline-block;

          margin-top: 11px;

          padding: 7px 12px;

          border-radius: 999px;

          background:
            rgba(39, 142, 255, 0.12);

          border:
            1px solid rgba(39, 142, 255, 0.28);

          color: #63adff;

          font-size: 12px;
          font-weight: 900;

          letter-spacing: 0.5px;
        }

        .admin-badge {
          width: fit-content;

          margin: 10px auto 0;

          padding: 6px 10px;

          border-radius: 999px;

          background:
            rgba(237, 28, 36, 0.12);

          border:
            1px solid rgba(237, 28, 36, 0.32);

          color: #ff6970;

          font-size: 10px;
          font-weight: 900;

          letter-spacing: 1.2px;
        }

        .welcome-copy {
          margin: 15px 0 18px;

          color: #b4bfd0;

          font-size: 13px;
          line-height: 1.5;
        }

        .main-link {
          display: block;

          text-decoration: none;
        }

        .enter-button {
          min-height: 56px;

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

          font-size: 14px;
          font-weight: 900;

          letter-spacing: 1px;
        }

        .signout-button {
          min-height: 48px;

          margin-top: 14px;

          border-radius: 9px;

          border:
            1px solid rgba(145, 163, 188, 0.38);

          background:
            rgba(255, 255, 255, 0.025);

          color: #aebccd;

          box-shadow: none;

          font-size: 12px;
          font-weight: 900;

          letter-spacing: 0.9px;
        }

        .signout-button:hover {
          background:
            rgba(255, 255, 255, 0.05);

          color: #ffffff;
        }

        .signed-in-note {
          margin-top: 15px;

          color: #71869c;

          font-size: 10px;
          font-weight: 700;
        }

        .loading-bar {
          width: 100%;
          height: 5px;

          margin-top: 22px;

          overflow: hidden;

          border-radius: 999px;

          background:
            rgba(255, 255, 255, 0.08);
        }

        .loading-bar-inner {
          width: 45%;
          height: 100%;

          border-radius: inherit;

          background:
            linear-gradient(
              90deg,
              #087eff,
              #ffffff,
              #ed1c24
            );

          animation:
            loadingSlide 1.3s ease-in-out infinite;
        }

        @keyframes loadingSlide {
          0% {
            transform: translateX(-120%);
          }

          100% {
            transform: translateX(280%);
          }
        }

        .wow-footer {
          margin-top: 23px;

          color: #8799ad;

          font-size: 11px;
        }

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
              0 0 14px rgba(15, 121, 255, 0.5)
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
              0 0 14px rgba(237, 28, 36, 0.45)
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

        @media (max-width: 600px) {
          .wow-home-page {
            padding:
              18px 12px 28px;
          }

          .wow-badge {
            width: 86px;

            margin-bottom: 11px;
          }

          .wow-brand {
            margin-bottom: 17px;
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

          .wow-home-card {
            padding:
              25px 16px 20px;

            border-radius: 15px;
          }

          .wow-home-card h2 {
            font-size: 29px;
          }

          .welcome-copy {
            font-size: 12px;
          }

          .enter-button {
            min-height: 53px;
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
        }

        @media (max-width: 380px) {
          .wow-home-page {
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

          .wow-home-card {
            padding-left: 13px;
            padding-right: 13px;
          }
        }
      `}</style>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LeaderboardPage() {
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadLeaderboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, surname, team_name");

      if (profileError) {
        setMessage(profileError.message);
        setLoading(false);
        return;
      }

      const { data: predictions, error: predictionError } = await supabase
        .from("predictions")
        .select("user_id, prediction, fixture_id");

      if (predictionError) {
        setMessage(predictionError.message);
        setLoading(false);
        return;
      }

      const { data: fixtures, error: fixtureError } = await supabase
        .from("fixtures")
        .select("id, result, status")
        .not("result", "is", null);

      if (fixtureError) {
        setMessage(fixtureError.message);
        setLoading(false);
        return;
      }

      const resultByFixture = {};
      const statusByFixture = {};

      (fixtures || []).forEach((fixture) => {
        resultByFixture[fixture.id] = fixture.result;
        statusByFixture[fixture.id] = fixture.status;
      });

      const pointsByUser = {};

      (predictions || []).forEach((prediction) => {
        const actualResult = resultByFixture[prediction.fixture_id];
        const fixtureStatus = statusByFixture[prediction.fixture_id];

        if (
          fixtureStatus !== "cancelled" &&
          actualResult &&
          prediction.prediction === actualResult
        ) {
          pointsByUser[prediction.user_id] =
            (pointsByUser[prediction.user_id] || 0) + 1;
        }
      });

      const usersWhoHavePredicted = new Set(
        (predictions || []).map((prediction) => prediction.user_id)
      );

      const leaderboard = (profiles || [])
        .filter((profile) => usersWhoHavePredicted.has(profile.id))
        .map((profile) => ({
          id: profile.id,
          firstName: profile.first_name || "",
          surname: profile.surname || "",
          teamName: profile.team_name || "",
          points: pointsByUser[profile.id] || 0,
        }))
        .sort((a, b) => {
          if (b.points !== a.points) {
            return b.points - a.points;
          }

          return `${a.firstName} ${a.surname}`.localeCompare(
            `${b.firstName} ${b.surname}`
          );
        });

      let previousPoints = null;
      let previousPosition = 0;

      const rankedLeaderboard = leaderboard.map((row, index) => {
        let position;

        if (row.points === previousPoints) {
          position = previousPosition;
        } else {
          position = index + 1;
        }

        previousPoints = row.points;
        previousPosition = position;

        return {
          ...row,
          position,
        };
      });

      setRows(rankedLeaderboard);
      setLoading(false);
    }

    loadLeaderboard();
  }, [router]);

  function positionInfo(position) {
    if (position === 1) {
      return {
        icon: "🏆",
        className: "gold",
      };
    }

    if (position === 2) {
      return {
        icon: "2",
        className: "silver",
      };
    }

    if (position === 3) {
      return {
        icon: "3",
        className: "bronze",
      };
    }

    return {
      icon: String(position),
      className: "normal",
    };
  }

  if (loading) {
    return (
      <main className="wowPage">
        <BackgroundFX />

        <div className="pageShell">
          <BrandHeader />

          <div className="loadingCard">
            <div className="loadingDot" />
            Loading leaderboard...
          </div>
        </div>

        <Styles />
      </main>
    );
  }

  return (
    <main className="wowPage">
      <BackgroundFX />

      <div className="pageShell">
        <BrandHeader />

        {message && <div className="messageBar">{message}</div>}

        <section className="leaderboardCard">
          <div className="dualTop" />

          <div className="leaderHeader">
            <div>
              <div className="eyebrow">SEASON STANDINGS</div>
              <h1>Overall Leaderboard</h1>
              <p>Who will become The Predictor?</p>
            </div>

            <div className="trophyBox">
              <span>🏆</span>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="emptyState">
              No players have entered predictions yet.
            </div>
          ) : (
            <>
              <div className="columnHeadings">
                <span>POS</span>
                <span>PLAYER</span>
                <span>POINTS</span>
              </div>

              <div className="leaderRows">
                {rows.map((row) => {
                  const position = positionInfo(row.position);

                  return (
                    <div
                      key={row.id}
                      className={`leaderRow ${position.className}`}
                    >
                      {row.position === 1 && (
                        <div className="leaderGlow" />
                      )}

                      <div
                        className={`positionBadge ${position.className}`}
                      >
                        {position.icon}
                      </div>

                      <div className="playerInfo">
                        <div className="playerName">
                          {row.firstName} {row.surname}
                        </div>

                        {row.teamName && (
                          <div className="teamName">{row.teamName}</div>
                        )}
                      </div>

                      <div className="pointsBox">
                        <strong>{row.points}</strong>
                        <span>
                          {row.points === 1 ? "POINT" : "POINTS"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <a href="/predictor" className="backButton">
          ← BACK TO THE PREDICTOR
        </a>

        <div className="footer">Telford & Wrekin Hockey Club</div>
      </div>

      <Styles />
    </main>
  );
}

function BrandHeader() {
  return (
    <header className="brandHeader">
      <img
        src="/TWHC-badge-white.png"
        alt="Telford & Wrekin Hockey Club"
        className="brandBadge"
      />

      <div>
        <div className="brandTitle">
          THE PREDICTO<span>R</span>
        </div>

        <div className="brandLine" />

        <div className="brandTag">
          <span className="blueWord">PREDICT</span>
          <b>•</b>
          <span>COMPETE</span>
          <b>•</b>
          <span className="redWord">WIN</span>
        </div>

        <div className="pageTag">OVERALL LEADERBOARD</div>
      </div>
    </header>
  );
}

function BackgroundFX() {
  return (
    <>
      <div className="blueGlow" />
      <div className="redGlow" />
      <div className="blueSlash slashOne" />
      <div className="blueSlash slashTwo" />
      <div className="redSlash redOne" />
      <div className="redSlash redTwo" />
    </>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        background: #020c19;
      }

      body {
        overflow-x: hidden;
      }

      a {
        text-decoration: none;
        -webkit-tap-highlight-color: transparent;
      }

      .wowPage {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
        color: #ffffff;
        font-family: Arial, Helvetica, sans-serif;
        background:
          radial-gradient(
            circle at 8% 18%,
            rgba(0, 116, 255, 0.17),
            transparent 31%
          ),
          radial-gradient(
            circle at 92% 40%,
            rgba(237, 28, 36, 0.11),
            transparent 34%
          ),
          linear-gradient(
            135deg,
            #061b35 0%,
            #031428 38%,
            #050e1c 67%,
            #160c18 100%
          );
      }

      .pageShell {
        position: relative;
        z-index: 5;
        width: min(760px, calc(100% - 30px));
        margin: 0 auto;
        padding: 27px 0 30px;
      }

      /* BACKGROUND EFFECTS */

      .blueGlow,
      .redGlow {
        position: fixed;
        width: 480px;
        height: 480px;
        border-radius: 50%;
        filter: blur(120px);
        opacity: 0.17;
        pointer-events: none;
      }

      .blueGlow {
        top: 70px;
        left: -220px;
        background: #087eff;
      }

      .redGlow {
        top: 170px;
        right: -220px;
        background: #ed1c24;
      }

      .blueSlash,
      .redSlash {
        position: fixed;
        width: 280px;
        height: 55px;
        transform: skewX(-35deg);
        pointer-events: none;
        opacity: 0.11;
      }

      .blueSlash {
        left: -125px;
        background: linear-gradient(90deg, transparent, #087eff);
      }

      .redSlash {
        right: -125px;
        background: linear-gradient(90deg, #ed1c24, transparent);
      }

      .slashOne {
        top: 19%;
      }

      .slashTwo {
        bottom: 10%;
      }

      .redOne {
        top: 28%;
      }

      .redTwo {
        bottom: 8%;
      }

      /* BRAND */

      .brandHeader {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 13px;
        margin-bottom: 22px;
      }

      .brandBadge {
        display: block;
        width: 62px;
        height: auto;
        filter: drop-shadow(0 5px 12px rgba(0, 0, 0, 0.42));
      }

      .brandTitle {
        color: #ffffff;
        font-size: 30px;
        line-height: 0.95;
        font-weight: 950;
        letter-spacing: -1.6px;
        white-space: nowrap;
        text-shadow: 0 3px 10px rgba(0, 0, 0, 0.45);
      }

      .brandTitle span {
        color: #ed1c24;
        text-shadow: 0 0 15px rgba(237, 28, 36, 0.42);
      }

      .brandLine {
        height: 2px;
        margin-top: 7px;
        background: linear-gradient(
          90deg,
          #087eff,
          transparent 48%,
          #ed1c24
        );
      }

      .brandTag {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 7px;
        color: #edf4fb;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1.7px;
      }

      .brandTag b {
        color: #647b92;
      }

      .blueWord {
        color: #2b9cff;
      }

      .redWord {
        color: #ff3040;
      }

      .pageTag {
        margin-top: 5px;
        color: #93a9be;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1.3px;
      }

      /* LEADERBOARD */

      .leaderboardCard {
        position: relative;
        overflow: hidden;
        padding: 21px 16px 15px;
        border: 1px solid rgba(104, 150, 196, 0.38);
        border-radius: 14px;
        background: linear-gradient(
          155deg,
          rgba(12, 35, 64, 0.97),
          rgba(4, 17, 33, 0.97)
        );
        box-shadow:
          0 17px 42px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.035);
        backdrop-filter: blur(15px);
      }

      .dualTop {
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(
          90deg,
          #087eff 0%,
          #087eff 40%,
          #ed1c24 68%,
          #ed1c24 100%
        );
      }

      .leaderHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 3px 5px 17px;
      }

      .eyebrow {
        color: #2b9cff;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 1.4px;
      }

      .leaderHeader h1 {
        margin: 4px 0 0;
        color: #ffffff;
        font-size: 27px;
        line-height: 1;
        font-weight: 950;
        letter-spacing: -0.8px;
      }

      .leaderHeader p {
        margin: 7px 0 0;
        color: #91a9c0;
        font-size: 11px;
        font-weight: 700;
      }

      .trophyBox {
        display: grid;
        place-items: center;
        flex: 0 0 64px;
        width: 64px;
        height: 64px;
        border: 1px solid rgba(255, 194, 51, 0.4);
        border-radius: 15px;
        background:
          radial-gradient(
            circle,
            rgba(255, 190, 28, 0.16),
            rgba(255, 190, 28, 0.02) 65%
          ),
          rgba(4, 17, 33, 0.7);
        font-size: 31px;
        box-shadow:
          0 0 25px rgba(255, 183, 0, 0.09),
          inset 0 0 20px rgba(255, 187, 0, 0.04);
      }

      /* HEADINGS */

      .columnHeadings {
        display: grid;
        grid-template-columns: 55px minmax(0, 1fr) 82px;
        gap: 10px;
        padding: 8px 9px;
        color: #607c97;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: 1px;
      }

      .columnHeadings span:last-child {
        text-align: right;
      }

      /* ROWS */

      .leaderRows {
        overflow: hidden;
        border-top: 1px solid rgba(103, 139, 174, 0.22);
        border-radius: 4px;
      }

      .leaderRow {
        position: relative;
        display: grid;
        grid-template-columns: 55px minmax(0, 1fr) 82px;
        align-items: center;
        gap: 10px;
        min-height: 67px;
        padding: 9px;
        overflow: hidden;
        border-bottom: 1px solid rgba(103, 139, 174, 0.18);
        background: rgba(255, 255, 255, 0.008);
      }

      .leaderRow:nth-child(even) {
        background: rgba(255, 255, 255, 0.018);
      }

      /* TOP THREE */

      .leaderRow.gold {
        min-height: 83px;
        border: 1px solid rgba(255, 196, 47, 0.36);
        border-radius: 11px;
        margin: 4px 0 7px;
        background:
          linear-gradient(
            90deg,
            rgba(151, 102, 0, 0.19),
            rgba(255, 188, 0, 0.04) 55%,
            transparent
          ),
          rgba(255, 255, 255, 0.012);
        box-shadow:
          inset 0 0 27px rgba(255, 181, 0, 0.025),
          0 8px 18px rgba(0, 0, 0, 0.15);
      }

      .leaderRow.silver {
        border-left: 2px solid rgba(194, 211, 225, 0.65);
        background: linear-gradient(
          90deg,
          rgba(181, 204, 224, 0.08),
          transparent 65%
        );
      }

      .leaderRow.bronze {
        border-left: 2px solid rgba(209, 128, 67, 0.68);
        background: linear-gradient(
          90deg,
          rgba(187, 103, 44, 0.08),
          transparent 65%
        );
      }

      .leaderGlow {
        position: absolute;
        top: -70px;
        left: -20px;
        width: 220px;
        height: 190px;
        border-radius: 50%;
        background: rgba(255, 189, 0, 0.08);
        filter: blur(40px);
        pointer-events: none;
      }

      /* POSITION BADGES */

      .positionBadge {
        position: relative;
        z-index: 2;
        display: grid;
        place-items: center;
        width: 39px;
        height: 39px;
        border-radius: 50%;
        font-size: 13px;
        font-weight: 950;
      }

      .positionBadge.gold {
        width: 46px;
        height: 46px;
        border: 1px solid rgba(255, 223, 103, 0.9);
        background: linear-gradient(145deg, #ffc928, #a96b00);
        color: #ffffff;
        font-size: 22px;
        box-shadow:
          0 0 0 3px rgba(255, 188, 0, 0.08),
          0 0 19px rgba(255, 183, 0, 0.18);
      }

      .positionBadge.silver {
        border: 1px solid #d7e2ec;
        background: linear-gradient(145deg, #b9c8d5, #687887);
        color: #ffffff;
        box-shadow: 0 0 14px rgba(192, 214, 232, 0.13);
      }

      .positionBadge.bronze {
        border: 1px solid #dc955e;
        background: linear-gradient(145deg, #c77b43, #79401f);
        color: #ffffff;
        box-shadow: 0 0 14px rgba(201, 113, 54, 0.14);
      }

      .positionBadge.normal {
        border: 1px solid rgba(40, 135, 224, 0.43);
        background: #071d36;
        color: #8ecbff;
      }

      /* PLAYER */

      .playerInfo {
        position: relative;
        z-index: 2;
        min-width: 0;
      }

      .playerName {
        overflow: hidden;
        color: #edf5fc;
        font-size: 14px;
        font-weight: 950;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .leaderRow.gold .playerName {
        color: #fff6d1;
        font-size: 16px;
      }

      .leaderRow.silver .playerName,
      .leaderRow.bronze .playerName {
        font-size: 15px;
      }

      .teamName {
        margin-top: 4px;
        overflow: hidden;
        color: #7894ad;
        font-size: 10px;
        font-weight: 750;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .leaderRow.gold .teamName {
        color: #d7bc73;
      }

      /* POINTS */

      .pointsBox {
        position: relative;
        z-index: 2;
        text-align: right;
      }

      .pointsBox strong {
        display: block;
        color: #ffffff;
        font-size: 19px;
        line-height: 1;
        font-weight: 950;
      }

      .pointsBox span {
        display: block;
        margin-top: 4px;
        color: #68839c;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: 0.8px;
      }

      .leaderRow.gold .pointsBox strong {
        color: #ffc83d;
        font-size: 24px;
        text-shadow: 0 0 13px rgba(255, 191, 31, 0.2);
      }

      .leaderRow.gold .pointsBox span {
        color: #bfa052;
      }

      .leaderRow.silver .pointsBox strong {
        color: #dce7f0;
      }

      .leaderRow.bronze .pointsBox strong {
        color: #e09a67;
      }

      /* BUTTON */

      .backButton {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 47px;
        margin-top: 14px;
        border: 1px solid rgba(75, 150, 221, 0.43);
        border-radius: 10px;
        background: linear-gradient(
          105deg,
          #087eff 0%,
          #405eea 40%,
          #bd286b 70%,
          #ed1c24 100%
        );
        color: #ffffff;
        font-size: 11px;
        font-weight: 950;
        letter-spacing: 0.45px;
        box-shadow:
          0 8px 20px rgba(0, 0, 0, 0.2),
          0 0 22px rgba(0, 113, 255, 0.05);
      }

      .backButton:hover {
        filter: brightness(1.08);
      }

      /* MISC */

      .messageBar {
        margin-bottom: 12px;
        padding: 11px 14px;
        border: 1px solid rgba(255, 83, 91, 0.38);
        border-radius: 9px;
        background: rgba(126, 20, 27, 0.26);
        color: #ff7c83;
        text-align: center;
        font-size: 11px;
        font-weight: 850;
      }

      .emptyState {
        padding: 35px 15px;
        border-top: 1px solid rgba(103, 139, 174, 0.2);
        color: #8fa6bb;
        text-align: center;
        font-size: 12px;
        font-weight: 750;
      }

      .footer {
        margin-top: 20px;
        color: #647b91;
        text-align: center;
        font-size: 9px;
      }

      .loadingCard {
        width: min(460px, 100%);
        margin: 55px auto;
        padding: 28px;
        border: 1px solid rgba(104, 150, 196, 0.38);
        border-radius: 14px;
        background: rgba(7, 27, 52, 0.93);
        color: #afc4d7;
        text-align: center;
        font-size: 12px;
        font-weight: 800;
        box-shadow: 0 17px 42px rgba(0, 0, 0, 0.3);
      }

      .loadingDot {
        width: 11px;
        height: 11px;
        margin: 0 auto 12px;
        border-radius: 50%;
        background: #168eff;
        box-shadow: 0 0 18px #168eff;
        animation: pulse 1.1s infinite ease-in-out;
      }

      @keyframes pulse {
        50% {
          opacity: 0.35;
          transform: scale(0.72);
        }
      }

      /* MOBILE */

      @media (max-width: 620px) {
        .pageShell {
          width: calc(100% - 16px);
          padding-top: 16px;
        }

        .brandHeader {
          margin-bottom: 17px;
          gap: 10px;
        }

        .brandBadge {
          width: 50px;
        }

        .brandTitle {
          font-size: 24px;
          letter-spacing: -1.2px;
        }

        .brandTag {
          gap: 6px;
          font-size: 7px;
          letter-spacing: 1.15px;
        }

        .pageTag {
          font-size: 7px;
        }

        .leaderboardCard {
          padding: 17px 7px 10px;
        }

        .leaderHeader {
          padding: 2px 5px 13px;
        }

        .leaderHeader h1 {
          font-size: 22px;
        }

        .leaderHeader p {
          font-size: 9px;
        }

        .trophyBox {
          flex-basis: 51px;
          width: 51px;
          height: 51px;
          border-radius: 12px;
          font-size: 25px;
        }

        .columnHeadings,
        .leaderRow {
          grid-template-columns: 47px minmax(0, 1fr) 62px;
          gap: 7px;
        }

        .columnHeadings {
          padding-right: 6px;
          padding-left: 6px;
          font-size: 6px;
        }

        .leaderRow {
          min-height: 60px;
          padding: 7px 6px;
        }

        .leaderRow.gold {
          min-height: 73px;
        }

        .positionBadge {
          width: 34px;
          height: 34px;
          font-size: 11px;
        }

        .positionBadge.gold {
          width: 40px;
          height: 40px;
          font-size: 19px;
        }

        .playerName {
          font-size: 12px;
        }

        .leaderRow.gold .playerName {
          font-size: 14px;
        }

        .leaderRow.silver .playerName,
        .leaderRow.bronze .playerName {
          font-size: 13px;
        }

        .teamName {
          font-size: 9px;
        }

        .pointsBox strong {
          font-size: 17px;
        }

        .leaderRow.gold .pointsBox strong {
          font-size: 21px;
        }

        .backButton {
          min-height: 44px;
          margin-top: 10px;
          font-size: 9px;
        }
      }

      @media (max-width: 390px) {
        .brandTitle {
          font-size: 22px;
        }

        .brandBadge {
          width: 46px;
        }

        .leaderHeader h1 {
          font-size: 20px;
        }

        .columnHeadings,
        .leaderRow {
          grid-template-columns: 43px minmax(0, 1fr) 55px;
        }

        .playerName {
          font-size: 11px;
        }

        .teamName {
          font-size: 8px;
        }
      }
    `}</style>
  );
}

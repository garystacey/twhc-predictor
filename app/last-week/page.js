"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function WeeklyLeaderboardsPage() {
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [weekNo, setWeekNo] = useState(null);
  const [completedWeeks, setCompletedWeeks] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [fixtures, setFixtures] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [expandedUserId, setExpandedUserId] = useState(null);

  /* =====================================================
     LOAD COMPLETED WEEKS
     ===================================================== */

  useEffect(() => {
    async function loadCompletedWeeks() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const now = new Date().toISOString();

      const {
        data: completedWeekData,
        error: weekError,
      } = await supabase
        .from("match_weeks")
        .select("id, week_no, deadline")
        .lt("deadline", now)
        .order("week_no", { ascending: true });

      if (weekError) {
        setMessage(weekError.message);
        setLoading(false);
        return;
      }

      if (
        !completedWeekData ||
        completedWeekData.length === 0
      ) {
        setCompletedWeeks([]);
        setSelectedWeekId(null);
        setWeekNo(null);
        setLoading(false);
        return;
      }

      setCompletedWeeks(completedWeekData);

      const latestWeek =
        completedWeekData[
          completedWeekData.length - 1
        ];

      setSelectedWeekId(latestWeek.id);
    }

    loadCompletedWeeks();
  }, [router]);

  /* =====================================================
     LOAD SELECTED WEEK
     ===================================================== */

  useEffect(() => {
    if (!selectedWeekId) return;

    async function loadSelectedWeekLeaderboard() {
      setLoading(true);
      setMessage("");
      setExpandedUserId(null);

      const selectedWeek =
        completedWeeks.find(
          (week) =>
            week.id === selectedWeekId
        );

      if (!selectedWeek) {
        setLoading(false);
        return;
      }

      setWeekNo(
        selectedWeek.week_no
      );

      const {
        data: profiles,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, first_name, surname, team_name"
        );

      if (profileError) {
        setMessage(
          profileError.message
        );
        setLoading(false);
        return;
      }

      const {
        data: fixtureData,
        error: fixtureError,
      } = await supabase
        .from("fixtures")
        .select(
          "id, fixture_order, home_team, away_team, result, status"
        )
        .eq(
          "match_week_id",
          selectedWeekId
        )
        .order(
          "fixture_order",
          { ascending: true }
        );

      if (fixtureError) {
        setMessage(
          fixtureError.message
        );
        setLoading(false);
        return;
      }

      const fixtureIds =
        (fixtureData || []).map(
          (fixture) =>
            fixture.id
        );

      let predictionData = [];

      if (
        fixtureIds.length > 0
      ) {
        const {
          data,
          error: predictionError,
        } = await supabase
          .from("predictions")
          .select(
            "user_id, prediction, fixture_id"
          )
          .in(
            "fixture_id",
            fixtureIds
          );

        if (predictionError) {
          setMessage(
            predictionError.message
          );
          setLoading(false);
          return;
        }

        predictionData =
          data || [];
      }

      const resultByFixture = {};
      const statusByFixture = {};

      (fixtureData || []).forEach(
        (fixture) => {
          resultByFixture[
            fixture.id
          ] = fixture.result;

          statusByFixture[
            fixture.id
          ] = fixture.status;
        }
      );

      const pointsByUser = {};

      predictionData.forEach(
        (prediction) => {
          const actualResult =
            resultByFixture[
              prediction.fixture_id
            ];

          const fixtureStatus =
            statusByFixture[
              prediction.fixture_id
            ];

          if (
            fixtureStatus !==
              "cancelled" &&
            actualResult &&
            prediction.prediction ===
              actualResult
          ) {
            pointsByUser[
              prediction.user_id
            ] =
              (
                pointsByUser[
                  prediction.user_id
                ] || 0
              ) + 1;
          }
        }
      );

      const usersWhoPredictedThisWeek =
        new Set(
          predictionData.map(
            (prediction) =>
              prediction.user_id
          )
        );

      const leaderboard =
        (profiles || [])
          .filter((profile) =>
            usersWhoPredictedThisWeek.has(
              profile.id
            )
          )
          .map((profile) => ({
            id:
              profile.id,

            firstName:
              profile.first_name ||
              "",

            surname:
              profile.surname ||
              "",

            teamName:
              profile.team_name ||
              "",

            points:
              pointsByUser[
                profile.id
              ] || 0,
          }))
          .sort((a, b) => {
            if (
              b.points !==
              a.points
            ) {
              return (
                b.points -
                a.points
              );
            }

            return `${a.firstName} ${a.surname}`.localeCompare(
              `${b.firstName} ${b.surname}`
            );
          });

      let previousPoints = null;
      let previousPosition = 0;

      const rankedLeaderboard =
        leaderboard.map(
          (row, index) => {
            let position;

            if (
              row.points ===
              previousPoints
            ) {
              position =
                previousPosition;
            } else {
              position =
                index + 1;
            }

            previousPoints =
              row.points;

            previousPosition =
              position;

            return {
              ...row,
              position,
            };
          }
        );

      setFixtures(
        fixtureData || []
      );

      setPredictions(
        predictionData
      );

      setRows(
        rankedLeaderboard
      );

      setLoading(false);
    }

    loadSelectedWeekLeaderboard();
  }, [
    selectedWeekId,
    completedWeeks,
  ]);

  /* =====================================================
     HELPERS
     ===================================================== */

  function shortResult(value) {
    if (value === "home")
      return "H";

    if (value === "draw")
      return "D";

    if (value === "away")
      return "A";

    return "-";
  }

  function getUserPrediction(
    userId,
    fixtureId
  ) {
    const prediction =
      predictions.find(
        (item) =>
          item.user_id === userId &&
          item.fixture_id ===
            fixtureId
      );

    return (
      prediction?.prediction ||
      null
    );
  }

  function positionClass(
    position
  ) {
    if (position === 1)
      return "gold";

    if (position === 2)
      return "silver";

    if (position === 3)
      return "bronze";

    return "normal";
  }

  /* =====================================================
     LOADING
     ===================================================== */

  if (
    loading &&
    completedWeeks.length === 0
  ) {
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

  /* =====================================================
     RESULT COUNTS
     ===================================================== */

  const cancelledResults =
    fixtures.filter(
      (fixture) =>
        fixture.status ===
        "cancelled"
    ).length;

  const completedResults =
    fixtures.filter(
      (fixture) =>
        fixture.status !==
          "cancelled" &&
        fixture.result
    ).length;

  const pendingResults =
    fixtures.filter(
      (fixture) =>
        fixture.status !==
          "cancelled" &&
        !fixture.result
    ).length;

  /* =====================================================
     PAGE
     ===================================================== */

  return (
    <main className="wowPage">
      <BackgroundFX />

      <div className="pageShell">
        <BrandHeader />

        {message && (
          <div className="messageBar">
            {message}
          </div>
        )}

        {completedWeeks.length ===
        0 ? (
          <section className="glassCard emptyCard">
            <div className="dualTop" />

            <div className="emptyIcon">
              📊
            </div>

            <h2>
              No completed Match Week yet
            </h2>

            <p>
              Weekly Leaderboards will
              appear once the first Match
              Week has finished.
            </p>
          </section>
        ) : (
          <>
            {/* SELECTOR */}

            <section className="glassCard selectorCard">
              <div className="dualTop" />

              <div className="selectorGrid">
                <div>
                  <div className="eyebrow blue">
                    SELECT
                  </div>

                  <div className="selectorLabel">
                    MATCH WEEK
                  </div>
                </div>

                <select
                  value={
                    selectedWeekId ||
                    ""
                  }
                  onChange={(e) =>
                    setSelectedWeekId(
                      Number(
                        e.target.value
                      )
                    )
                  }
                >
                  {completedWeeks.map(
                    (week) => (
                      <option
                        key={
                          week.id
                        }
                        value={
                          week.id
                        }
                      >
                        Match Week{" "}
                        {
                          week.week_no
                        }
                      </option>
                    )
                  )}
                </select>
              </div>
            </section>

            {/* WEEKLY LEADERBOARD */}

            <section className="glassCard leaderboardCard">
              <div className="dualTop" />

              <div className="leaderHeader">
                <div>
                  <div className="eyebrow blue">
                    WEEKLY STANDINGS
                  </div>

                  <h1>
                    Match Week{" "}
                    {weekNo}
                  </h1>

                  <p>
                    Tap a player to view
                    their predictions.
                  </p>
                </div>

                <div className="weekIcon">
                  📊
                </div>
              </div>

              {/* WARNINGS */}

              {pendingResults > 0 &&
                !loading && (
                  <div className="warningBar">
                    <strong>
                      ⚠ PROVISIONAL
                      STANDINGS
                    </strong>

                    <span>
                      {pendingResults}{" "}
                      {pendingResults === 1
                        ? "result pending"
                        : "results pending"}

                      {cancelledResults >
                        0 && (
                        <>
                          {" "}
                          •{" "}
                          {
                            cancelledResults
                          }{" "}
                          cancelled
                        </>
                      )}
                    </span>
                  </div>
                )}

              {pendingResults === 0 &&
                cancelledResults > 0 &&
                !loading && (
                  <div className="cancelledNote">
                    {
                      cancelledResults
                    }{" "}
                    {cancelledResults ===
                    1
                      ? "fixture cancelled"
                      : "fixtures cancelled"}
                  </div>
                )}

              {loading ? (
                <div className="inlineLoading">
                  <div className="loadingDot" />
                  Loading Match Week...
                </div>
              ) : rows.length === 0 ? (
                <div className="noPlayers">
                  No predictions found for
                  this Match Week.
                </div>
              ) : (
                <>
                  <div className="tapHint">
                    TAP A PLAYER TO VIEW
                    THEIR PREDICTIONS
                  </div>

                  <div className="weeklyTable">
                    {rows.map(
                      (row) => {
                        const expanded =
                          expandedUserId ===
                          row.id;

                        const rankClass =
                          positionClass(
                            row.position
                          );

                        return (
                          <div
                            key={
                              row.id
                            }
                            className={`playerWrap ${
                              expanded
                                ? "expanded"
                                : ""
                            }`}
                          >
                            {/* PLAYER ROW */}

                            <button
                              type="button"
                              className={`playerRow ${rankClass}`}
                              onClick={() =>
                                setExpandedUserId(
                                  expanded
                                    ? null
                                    : row.id
                                )
                              }
                            >
                              <div
                                className={`positionBadge ${rankClass}`}
                              >
                                {row.position ===
                                1
                                  ? "🏆"
                                  : row.position}
                              </div>

                              <div className="playerInfo">
                                <div className="playerName">
                                  {
                                    row.firstName
                                  }{" "}
                                  {
                                    row.surname
                                  }
                                </div>

                                {row.teamName && (
                                  <div className="teamName">
                                    {
                                      row.teamName
                                    }
                                  </div>
                                )}
                              </div>

                              <div className="pointsBox">
                                <strong>
                                  {
                                    row.points
                                  }
                                </strong>

                                <span>
                                  {row.points ===
                                  1
                                    ? "POINT"
                                    : "POINTS"}
                                </span>
                              </div>

                              <div
                                className={`chevron ${
                                  expanded
                                    ? "open"
                                    : ""
                                }`}
                              >
                                ▼
                              </div>
                            </button>

                            {/* EXPANDED */}

                            {expanded && (
                              <div className="expandedPanel">
                                <div className="scoreSummary">
                                  <div>
                                    <div className="scoreLabel">
                                      WEEK SCORE
                                    </div>

                                    <div className="scoreValue">
                                      {
                                        row.points
                                      }
                                      /
                                      {
                                        completedResults
                                      }{" "}
                                      correct
                                    </div>
                                  </div>

                                  <div className="scoreBadge">
                                    {
                                      row.points
                                    }{" "}
                                    {row.points ===
                                    1
                                      ? "pt"
                                      : "pts"}
                                  </div>
                                </div>

                                {(pendingResults >
                                  0 ||
                                  cancelledResults >
                                    0) && (
                                  <div className="extraSummary">
                                    {pendingResults >
                                      0 && (
                                      <>
                                        {
                                          pendingResults
                                        }{" "}
                                        {pendingResults ===
                                        1
                                          ? "result pending"
                                          : "results pending"}
                                      </>
                                    )}

                                    {pendingResults >
                                      0 &&
                                      cancelledResults >
                                        0 &&
                                      " • "}

                                    {cancelledResults >
                                      0 && (
                                      <>
                                        {
                                          cancelledResults
                                        }{" "}
                                        cancelled
                                      </>
                                    )}
                                  </div>
                                )}

                                <div className="fixtureDetailList">
                                  {fixtures.map(
                                    (
                                      fixture
                                    ) => {
                                      const userPrediction =
                                        getUserPrediction(
                                          row.id,
                                          fixture.id
                                        );

                                      const cancelled =
                                        fixture.status ===
                                        "cancelled";

                                      const hasResult =
                                        !cancelled &&
                                        Boolean(
                                          fixture.result
                                        );

                                      const correct =
                                        hasResult &&
                                        userPrediction &&
                                        userPrediction ===
                                          fixture.result;

                                      const predictionLetter =
                                        shortResult(
                                          userPrediction
                                        );

                                      const resultLetter =
                                        shortResult(
                                          fixture.result
                                        );

                                      return (
                                        <div
                                          key={
                                            fixture.id
                                          }
                                          className="fixtureDetail"
                                        >
                                          <div
                                            className="fixtureName"
                                            title={`${fixture.home_team} v ${fixture.away_team}`}
                                          >
                                            {
                                              fixture.home_team
                                            }{" "}
                                            <span>
                                              v
                                            </span>{" "}
                                            {
                                              fixture.away_team
                                            }
                                          </div>

                                          {cancelled ? (
                                            <div className="cancelledRow">
                                              <ResultBlock
                                                label="Prediction"
                                                value={
                                                  predictionLetter
                                                }
                                                type={
                                                  predictionLetter ===
                                                  "-"
                                                    ? "muted"
                                                    : "prediction"
                                                }
                                              />

                                              <div className="cancelledText">
                                                CANCELLED
                                                — no
                                                points
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="resultRow">
                                              <ResultBlock
                                                label="Prediction"
                                                value={
                                                  predictionLetter
                                                }
                                                type={
                                                  predictionLetter ===
                                                  "-"
                                                    ? "muted"
                                                    : "prediction"
                                                }
                                              />

                                              <ResultBlock
                                                label="Result"
                                                value={
                                                  resultLetter
                                                }
                                                type={
                                                  hasResult
                                                    ? "actual"
                                                    : "muted"
                                                }
                                              />

                                              <div
                                                className={`outcome ${
                                                  !hasResult
                                                    ? "pending"
                                                    : correct
                                                    ? "correct"
                                                    : "wrong"
                                                }`}
                                              >
                                                {!hasResult
                                                  ? "…"
                                                  : correct
                                                  ? "✓"
                                                  : "✕"}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </>
              )}
            </section>
          </>
        )}

        <a
          href="/predictor"
          className="backButton"
        >
          ← BACK TO THE PREDICTOR
        </a>

        <div className="footer">
          Telford & Wrekin Hockey Club
        </div>
      </div>

      <Styles />
    </main>
  );
}

/* =====================================================
   RESULT BLOCK
   ===================================================== */

function ResultBlock({
  label,
  value,
  type,
}) {
  return (
    <div className="resultBlock">
      <span className="resultLabel">
        {label}
      </span>

      <span
        className={`resultCircle ${type}`}
      >
        {value}
      </span>
    </div>
  );
}

/* =====================================================
   HEADER
   ===================================================== */

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
          THE PREDICTO
          <span>R</span>
        </div>

        <div className="brandLine" />

        <div className="brandTag">
          <span className="blueWord">
            PREDICT
          </span>

          <b>•</b>

          <span>
            COMPETE
          </span>

          <b>•</b>

          <span className="redWord">
            WIN
          </span>
        </div>

        <div className="pageTag">
          WEEKLY LEADERBOARDS
        </div>
      </div>
    </header>
  );
}

/* =====================================================
   BACKGROUND
   ===================================================== */

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

/* =====================================================
   STYLES
   ===================================================== */

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

      button,
      select {
        font: inherit;
      }

      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      a {
        text-decoration: none;
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
        width: min(
          820px,
          calc(100% - 30px)
        );
        margin: 0 auto;
        padding: 27px 0 30px;
      }

      /* BACKGROUND */

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
        background:
          linear-gradient(
            90deg,
            transparent,
            #087eff
          );
      }

      .redSlash {
        right: -125px;
        background:
          linear-gradient(
            90deg,
            #ed1c24,
            transparent
          );
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
        filter:
          drop-shadow(
            0 5px 12px
            rgba(0, 0, 0, 0.42)
          );
      }

      .brandTitle {
        color: #ffffff;
        font-size: 30px;
        line-height: 0.95;
        font-weight: 950;
        letter-spacing: -1.6px;
        white-space: nowrap;
        text-shadow:
          0 3px 10px
          rgba(0, 0, 0, 0.45);
      }

      .brandTitle span {
        color: #ed1c24;
        text-shadow:
          0 0 15px
          rgba(237, 28, 36, 0.42);
      }

      .brandLine {
        height: 2px;
        margin-top: 7px;
        background:
          linear-gradient(
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

      /* GLASS */

      .glassCard,
      .loadingCard {
        position: relative;
        overflow: hidden;
        border:
          1px solid
          rgba(
            104,
            150,
            196,
            0.38
          );
        background:
          linear-gradient(
            155deg,
            rgba(
              12,
              35,
              64,
              0.97
            ),
            rgba(
              4,
              17,
              33,
              0.97
            )
          );
        box-shadow:
          0 17px 42px
            rgba(
              0,
              0,
              0,
              0.3
            ),
          inset 0 1px 0
            rgba(
              255,
              255,
              255,
              0.035
            );
        backdrop-filter: blur(15px);
      }

      .glassCard {
        border-radius: 14px;
      }

      .dualTop {
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        height: 3px;
        background:
          linear-gradient(
            90deg,
            #087eff 0%,
            #087eff 40%,
            #ed1c24 68%,
            #ed1c24 100%
          );
      }

      /* SELECTOR */

      .selectorCard {
        margin-bottom: 14px;
        padding: 16px 18px;
      }

      .selectorGrid {
        display: grid;
        grid-template-columns:
          125px 1fr;
        align-items: center;
        gap: 15px;
      }

      .eyebrow {
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 1.3px;
      }

      .eyebrow.blue {
        color: #2b9cff;
      }

      .selectorLabel {
        margin-top: 3px;
        color: #ffffff;
        font-size: 15px;
        font-weight: 950;
      }

      .selectorCard select {
        width: 100%;
        min-height: 44px;
        padding: 10px 13px;
        border:
          1px solid
          rgba(
            102,
            157,
            211,
            0.48
          );
        border-radius: 9px;
        outline: none;
        background: #071b34;
        color: #ffffff;
        font-size: 14px;
        font-weight: 850;
        cursor: pointer;
      }

      .selectorCard select:focus {
        border-color: #168eff;
        box-shadow:
          0 0 0 3px
          rgba(
            22,
            142,
            255,
            0.12
          );
      }

      .selectorCard option {
        background: #071b34;
        color: #ffffff;
      }

      /* LEADER HEADER */

      .leaderboardCard {
        padding: 20px 15px 14px;
      }

      .leaderHeader {
        display: flex;
        align-items: center;
        justify-content:
          space-between;
        gap: 16px;
        padding:
          2px 5px 15px;
      }

      .leaderHeader h1 {
        margin: 4px 0 0;
        color: #ffffff;
        font-size: 26px;
        line-height: 1;
        font-weight: 950;
        letter-spacing: -0.8px;
      }

      .leaderHeader p {
        margin: 7px 0 0;
        color: #91a9c0;
        font-size: 10px;
        font-weight: 700;
      }

      .weekIcon {
        display: grid;
        place-items: center;
        width: 58px;
        height: 58px;
        flex: 0 0 58px;
        border:
          1px solid
          rgba(
            53,
            154,
            246,
            0.42
          );
        border-radius: 14px;
        background:
          rgba(
            5,
            26,
            48,
            0.8
          );
        font-size: 29px;
        box-shadow:
          inset 0 0 18px
          rgba(
            0,
            130,
            255,
            0.04
          );
      }

      /* WARNINGS */

      .warningBar,
      .cancelledNote {
        margin-bottom: 12px;
        padding: 10px 12px;
        border-radius: 9px;
      }

      .warningBar {
        border:
          1px solid
          rgba(
            255,
            174,
            35,
            0.4
          );
        background:
          rgba(
            110,
            66,
            0,
            0.25
          );
      }

      .warningBar strong {
        display: block;
        color: #ffc04c;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 0.7px;
      }

      .warningBar span {
        display: block;
        margin-top: 3px;
        color: #d1af75;
        font-size: 9px;
        font-weight: 700;
      }

      .cancelledNote {
        border:
          1px solid
          rgba(
            151,
            171,
            191,
            0.3
          );
        background:
          rgba(
            91,
            108,
            126,
            0.14
          );
        color: #9eb2c4;
        font-size: 9px;
        font-weight: 850;
      }

      /* TAP HINT */

      .tapHint {
        padding: 7px 8px;
        color: #5f7b95;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: 1px;
      }

      /* TABLE */

      .weeklyTable {
        overflow: hidden;
        border-top:
          1px solid
          rgba(
            103,
            139,
            174,
            0.22
          );
      }

      .playerWrap {
        border-bottom:
          1px solid
          rgba(
            103,
            139,
            174,
            0.18
          );
      }

      .playerWrap.expanded {
        margin:
          6px 0 9px;
        border:
          1px solid
          rgba(
            42,
            135,
            222,
            0.38
          );
        border-radius: 12px;
        overflow: hidden;
        background:
          rgba(
            5,
            22,
            41,
            0.62
          );
        box-shadow:
          0 10px 24px
          rgba(
            0,
            0,
            0,
            0.18
          );
      }

      .playerRow {
        width: 100%;
        min-height: 65px;
        margin: 0;
        padding: 8px;
        border: 0;
        display: grid;
        grid-template-columns:
          52px
          minmax(0, 1fr)
          70px
          24px;
        align-items: center;
        gap: 8px;
        background:
          transparent;
        color: #ffffff;
        text-align: left;
        cursor: pointer;
      }

      .playerWrap:nth-child(even)
        .playerRow {
        background:
          rgba(
            255,
            255,
            255,
            0.012
          );
      }

      .playerRow.gold {
        background:
          linear-gradient(
            90deg,
            rgba(
              164,
              111,
              0,
              0.16
            ),
            transparent
              70%
          );
      }

      .playerRow:hover {
        background:
          rgba(
            13,
            71,
            126,
            0.12
          );
      }

      /* POSITION */

      .positionBadge {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        font-size: 12px;
        font-weight: 950;
      }

      .positionBadge.gold {
        width: 44px;
        height: 44px;
        border:
          1px solid
          rgba(
            255,
            224,
            108,
            0.85
          );
        background:
          linear-gradient(
            145deg,
            #ffc927,
            #a96900
          );
        font-size: 20px;
        box-shadow:
          0 0 16px
          rgba(
            255,
            184,
            0,
            0.16
          );
      }

      .positionBadge.silver {
        border:
          1px solid
          #d7e2ec;
        background:
          linear-gradient(
            145deg,
            #bccbd8,
            #677785
          );
      }

      .positionBadge.bronze {
        border:
          1px solid
          #dc955e;
        background:
          linear-gradient(
            145deg,
            #c77b43,
            #79401f
          );
      }

      .positionBadge.normal {
        border:
          1px solid
          rgba(
            40,
            135,
            224,
            0.43
          );
        background:
          #071d36;
        color: #8ecbff;
      }

      /* PLAYER */

      .playerInfo {
        min-width: 0;
      }

      .playerName {
        overflow: hidden;
        color: #edf5fc;
        font-size: 13px;
        font-weight: 950;
        text-overflow:
          ellipsis;
        white-space: nowrap;
      }

      .playerRow.gold
        .playerName {
        color: #fff4cb;
        font-size: 14px;
      }

      .teamName {
        margin-top: 3px;
        overflow: hidden;
        color: #7894ad;
        font-size: 9px;
        font-weight: 750;
        text-overflow:
          ellipsis;
        white-space: nowrap;
      }

      .playerRow.gold
        .teamName {
        color: #cdb46d;
      }

      /* POINTS */

      .pointsBox {
        text-align: right;
      }

      .pointsBox strong {
        display: block;
        color: #ffffff;
        font-size: 18px;
        line-height: 1;
        font-weight: 950;
      }

      .pointsBox span {
        display: block;
        margin-top: 3px;
        color: #68839c;
        font-size: 6px;
        font-weight: 950;
        letter-spacing: 0.8px;
      }

      .playerRow.gold
        .pointsBox strong {
        color: #ffc83d;
        font-size: 21px;
      }

      .playerRow.silver
        .pointsBox strong {
        color: #dce7f0;
      }

      .playerRow.bronze
        .pointsBox strong {
        color: #e09a67;
      }

      /* CHEVRON */

      .chevron {
        color: #66829d;
        font-size: 10px;
        text-align: center;
        transition:
          transform
          0.18s ease;
      }

      .chevron.open {
        transform:
          rotate(180deg);
        color: #45aaff;
      }

      /* EXPANDED */

      .expandedPanel {
        padding:
          13px 12px 12px;
        border-top:
          1px solid
          rgba(
            78,
            137,
            194,
            0.23
          );
        background:
          rgba(
            2,
            13,
            26,
            0.52
          );
      }

      .scoreSummary {
        display: flex;
        align-items: center;
        justify-content:
          space-between;
        gap: 12px;
        margin-bottom: 10px;
        padding: 11px 12px;
        border:
          1px solid
          rgba(
            33,
            142,
            239,
            0.28
          );
        border-radius: 9px;
        background:
          rgba(
            0,
            89,
            169,
            0.11
          );
      }

      .scoreLabel {
        color: #2c9cff;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: 0.9px;
      }

      .scoreValue {
        margin-top: 3px;
        color: #ffffff;
        font-size: 12px;
        font-weight: 900;
      }

      .scoreBadge {
        padding: 7px 9px;
        border:
          1px solid
          rgba(
            42,
            150,
            247,
            0.4
          );
        border-radius: 8px;
        background:
          rgba(
            8,
            63,
            115,
            0.36
          );
        color: #64b8ff;
        font-size: 10px;
        font-weight: 950;
      }

      .extraSummary {
        margin-bottom: 9px;
        color: #8ca4ba;
        font-size: 8px;
        font-weight: 750;
      }

      /* FIXTURE DETAILS */

      .fixtureDetailList {
        border-top:
          1px solid
          rgba(
            102,
            137,
            171,
            0.17
          );
      }

      .fixtureDetail {
        padding:
          10px 4px;
        border-bottom:
          1px solid
          rgba(
            102,
            137,
            171,
            0.15
          );
      }

      .fixtureName {
        margin-bottom: 7px;
        overflow: hidden;
        color: #dce8f3;
        font-size: 10px;
        font-weight: 850;
        text-overflow:
          ellipsis;
        white-space: nowrap;
      }

      .fixtureName span {
        color: #607c97;
      }

      .resultRow,
      .cancelledRow {
        display: flex;
        align-items: center;
        gap: 13px;
      }

      .resultBlock {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .resultLabel {
        color: #708aa2;
        font-size: 7px;
        font-weight: 900;
        letter-spacing: 0.4px;
      }

      .resultCircle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 31px;
        min-width: 31px;
        height: 31px;
        border-radius: 50%;
        color: #ffffff;
        font-size: 10px;
        font-weight: 950;
      }

      .resultCircle.prediction {
        border:
          1px solid
          rgba(
            40,
            150,
            248,
            0.58
          );
        background:
          #075399;
      }

      .resultCircle.actual {
        border:
          1px solid
          rgba(
            255,
            184,
            45,
            0.54
          );
        background:
          #9c6600;
      }

      .resultCircle.muted {
        border:
          1px solid
          rgba(
            129,
            151,
            171,
            0.32
          );
        background:
          #35495d;
        color: #8396a9;
      }

      .outcome {
        display: grid;
        place-items: center;
        margin-left: auto;
        width: 31px;
        height: 31px;
        border-radius: 50%;
        font-size: 15px;
        font-weight: 950;
      }

      .outcome.correct {
        border:
          1px solid
          rgba(
            57,
            211,
            124,
            0.5
          );
        background:
          rgba(
            13,
            116,
            60,
            0.42
          );
        color: #64e29b;
      }

      .outcome.wrong {
        border:
          1px solid
          rgba(
            237,
            68,
            77,
            0.46
          );
        background:
          rgba(
            136,
            20,
            27,
            0.4
          );
        color: #ff676f;
      }

      .outcome.pending {
        border:
          1px solid
          rgba(
            132,
            151,
            169,
            0.3
          );
        background:
          rgba(
            68,
            82,
            97,
            0.24
          );
        color: #91a5b8;
      }

      .cancelledText {
        color: #ff6570;
        font-size: 8px;
        font-weight: 900;
      }

      /* BACK */

      .backButton {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 47px;
        margin-top: 14px;
        border:
          1px solid
          rgba(
            75,
            150,
            221,
            0.43
          );
        border-radius: 10px;
        background:
          linear-gradient(
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
          0 8px 20px
          rgba(
            0,
            0,
            0,
            0.2
          );
      }

      .backButton:hover {
        filter:
          brightness(1.08);
      }

      /* MISC */

      .messageBar {
        margin-bottom: 12px;
        padding: 11px 14px;
        border:
          1px solid
          rgba(
            255,
            83,
            91,
            0.38
          );
        border-radius: 9px;
        background:
          rgba(
            126,
            20,
            27,
            0.26
          );
        color: #ff7c83;
        text-align: center;
        font-size: 11px;
        font-weight: 850;
      }

      .emptyCard {
        padding: 31px 20px;
        text-align: center;
      }

      .emptyIcon {
        margin-bottom: 8px;
        font-size: 31px;
      }

      .emptyCard h2 {
        margin: 0;
        color: #ffffff;
        font-size: 20px;
        font-weight: 950;
      }

      .emptyCard p {
        margin:
          9px 0 0;
        color: #91a8bd;
        font-size: 11px;
        line-height: 1.5;
      }

      .noPlayers,
      .inlineLoading {
        padding: 29px 12px;
        color: #91a8bd;
        text-align: center;
        font-size: 11px;
        font-weight: 750;
      }

      .footer {
        margin-top: 20px;
        color: #647b91;
        text-align: center;
        font-size: 9px;
      }

      .loadingCard {
        width:
          min(
            460px,
            100%
          );
        margin:
          55px auto;
        padding: 28px;
        border-radius: 14px;
        color: #afc4d7;
        text-align: center;
        font-size: 12px;
        font-weight: 800;
      }

      .loadingDot {
        width: 11px;
        height: 11px;
        margin:
          0 auto 12px;
        border-radius: 50%;
        background: #168eff;
        box-shadow:
          0 0 18px
          #168eff;
        animation:
          pulse
          1.1s
          infinite
          ease-in-out;
      }

      @keyframes pulse {
        50% {
          opacity: 0.35;
          transform:
            scale(0.72);
        }
      }

      /* MOBILE */

      @media
        (max-width: 620px) {

        .pageShell {
          width:
            calc(
              100% - 16px
            );
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
          letter-spacing:
            -1.2px;
        }

        .brandTag {
          gap: 6px;
          font-size: 7px;
          letter-spacing:
            1.15px;
        }

        .pageTag {
          font-size: 7px;
        }

        .selectorCard {
          padding:
            14px 12px;
        }

        .selectorGrid {
          grid-template-columns:
            94px 1fr;
          gap: 9px;
        }

        .selectorLabel {
          font-size: 12px;
        }

        .selectorCard select {
          min-height: 42px;
          padding-left: 10px;
          font-size: 12px;
        }

        .leaderboardCard {
          padding:
            17px 7px 10px;
        }

        .leaderHeader {
          padding:
            2px 5px 12px;
        }

        .leaderHeader h1 {
          font-size: 22px;
        }

        .leaderHeader p {
          font-size: 9px;
        }

        .weekIcon {
          width: 50px;
          height: 50px;
          flex-basis: 50px;
          font-size: 24px;
        }

        .playerRow {
          grid-template-columns:
            45px
            minmax(0, 1fr)
            56px
            19px;
          gap: 5px;
          min-height: 59px;
          padding: 6px;
        }

        .positionBadge {
          width: 33px;
          height: 33px;
          font-size: 10px;
        }

        .positionBadge.gold {
          width: 38px;
          height: 38px;
          font-size: 17px;
        }

        .playerName {
          font-size: 11px;
        }

        .playerRow.gold
          .playerName {
          font-size: 12px;
        }

        .teamName {
          font-size: 8px;
        }

        .pointsBox strong {
          font-size: 16px;
        }

        .playerRow.gold
          .pointsBox strong {
          font-size: 18px;
        }

        .chevron {
          font-size: 8px;
        }

        .expandedPanel {
          padding:
            10px 7px;
        }

        .scoreSummary {
          padding:
            9px 10px;
        }

        .fixtureDetail {
          padding:
            9px 2px;
        }

        .fixtureName {
          font-size: 9px;
        }

        .resultRow,
        .cancelledRow {
          gap: 7px;
        }

        .resultBlock {
          gap: 4px;
        }

        .resultLabel {
          font-size: 6px;
        }

        .resultCircle {
          width: 28px;
          min-width: 28px;
          height: 28px;
          font-size: 9px;
        }

        .outcome {
          width: 28px;
          height: 28px;
          font-size: 13px;
        }

        .backButton {
          min-height: 44px;
          margin-top: 10px;
          font-size: 9px;
        }
      }

      @media
        (max-width: 390px) {

        .brandTitle {
          font-size: 22px;
        }

        .brandBadge {
          width: 46px;
        }

        .playerRow {
          grid-template-columns:
            42px
            minmax(0, 1fr)
            50px
            17px;
        }

        .playerName {
          font-size: 10px;
        }

        .teamName {
          font-size: 7px;
        }
      }
    `}</style>
  );
}

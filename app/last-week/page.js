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

      const { data: completedWeekData, error: weekError } =
        await supabase
          .from("match_weeks")
          .select("id, week_no, deadline")
          .lt("deadline", now)
          .order("week_no", { ascending: true });

      if (weekError) {
        setMessage(weekError.message);
        setLoading(false);
        return;
      }

      if (!completedWeekData || completedWeekData.length === 0) {
        setCompletedWeeks([]);
        setSelectedWeekId(null);
        setWeekNo(null);
        setLoading(false);
        return;
      }

      setCompletedWeeks(completedWeekData);

      const latestWeek =
        completedWeekData[completedWeekData.length - 1];

      setSelectedWeekId(latestWeek.id);
    }

    loadCompletedWeeks();
  }, [router]);

  useEffect(() => {
    if (!selectedWeekId) return;

    async function loadSelectedWeekLeaderboard() {
      setLoading(true);
      setMessage("");
      setExpandedUserId(null);

      const selectedWeek = completedWeeks.find(
        (week) => week.id === selectedWeekId
      );

      if (!selectedWeek) {
        setLoading(false);
        return;
      }

      setWeekNo(selectedWeek.week_no);

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, surname, team_name");

      if (profileError) {
        setMessage(profileError.message);
        setLoading(false);
        return;
      }

      const { data: fixtureData, error: fixtureError } = await supabase
        .from("fixtures")
        .select(
          "id, fixture_order, home_team, away_team, result, status"
        )
        .eq("match_week_id", selectedWeekId)
        .order("fixture_order", { ascending: true });

      if (fixtureError) {
        setMessage(fixtureError.message);
        setLoading(false);
        return;
      }

      const fixtureIds = (fixtureData || []).map(
        (fixture) => fixture.id
      );

      let predictionData = [];

      if (fixtureIds.length > 0) {
        const {
          data,
          error: predictionError,
        } = await supabase
          .from("predictions")
          .select("user_id, prediction, fixture_id")
          .in("fixture_id", fixtureIds);

        if (predictionError) {
          setMessage(predictionError.message);
          setLoading(false);
          return;
        }

        predictionData = data || [];
      }

      const resultByFixture = {};
      const statusByFixture = {};

      (fixtureData || []).forEach((fixture) => {
        resultByFixture[fixture.id] = fixture.result;
        statusByFixture[fixture.id] = fixture.status;
      });

      const pointsByUser = {};

      predictionData.forEach((prediction) => {
        const actualResult =
          resultByFixture[prediction.fixture_id];

        const fixtureStatus =
          statusByFixture[prediction.fixture_id];

        if (
          fixtureStatus !== "cancelled" &&
          actualResult &&
          prediction.prediction === actualResult
        ) {
          pointsByUser[prediction.user_id] =
            (pointsByUser[prediction.user_id] || 0) + 1;
        }
      });

      const usersWhoPredictedThisWeek = new Set(
        predictionData.map(
          (prediction) => prediction.user_id
        )
      );

      const leaderboard = (profiles || [])
        .filter((profile) =>
          usersWhoPredictedThisWeek.has(profile.id)
        )
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

      const rankedLeaderboard = leaderboard.map(
        (row, index) => {
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
        }
      );

      setFixtures(fixtureData || []);
      setPredictions(predictionData);
      setRows(rankedLeaderboard);
      setLoading(false);
    }

    loadSelectedWeekLeaderboard();
  }, [selectedWeekId, completedWeeks]);

  function shortResult(value) {
    if (value === "home") return "H";
    if (value === "draw") return "D";
    if (value === "away") return "A";
    return "-";
  }

  function getUserPrediction(userId, fixtureId) {
    const prediction = predictions.find(
      (item) =>
        item.user_id === userId &&
        item.fixture_id === fixtureId
    );

    return prediction?.prediction || null;
  }

  function Header() {
    return (
      <div className="predictor-header">
        <img
          src="/TWHC-badge-white.png"
          alt="Telford & Wrekin Hockey Club"
          className="predictor-header-logo"
        />

        <div className="predictor-header-text">
          <div className="predictor-header-title">
            THE PREDICTO
            <span>R</span>
          </div>

          <div className="predictor-header-subtitle">
            WEEKLY LEADERBOARDS
          </div>
        </div>
      </div>
    );
  }

  if (loading && completedWeeks.length === 0) {
    return (
      <main>
        <div
          className="container"
          style={{ maxWidth: "760px" }}
        >
          <Header />

          <div className="card">
            <p>Loading leaderboard...</p>
          </div>
        </div>
      </main>
    );
  }

  const cancelledResults = fixtures.filter(
    (fixture) => fixture.status === "cancelled"
  ).length;

  const completedResults = fixtures.filter(
    (fixture) =>
      fixture.status !== "cancelled" &&
      fixture.result
  ).length;

  const pendingResults = fixtures.filter(
    (fixture) =>
      fixture.status !== "cancelled" &&
      !fixture.result
  ).length;

  return (
    <main>
      <div
        className="container"
        style={{ maxWidth: "760px" }}
      >
        <Header />

        {message && (
          <div className="card compact-message-card">
            <p>{message}</p>
          </div>
        )}

        {completedWeeks.length === 0 ? (
          <div className="card">
            <h2>No completed Match Week yet</h2>

            <p>
              Weekly Leaderboards will appear once the first Match Week
              has finished.
            </p>
          </div>
        ) : (
          <>
            <div className="card weekly-selector-card">
              <div className="weekly-selector-row">
                <div className="weekly-selector-label">
                  MATCH WEEK
                </div>

                <select
                  value={selectedWeekId || ""}
                  onChange={(e) =>
                    setSelectedWeekId(
                      Number(e.target.value)
                    )
                  }
                >
                  {completedWeeks.map((week) => (
                    <option
                      key={week.id}
                      value={week.id}
                    >
                      Match Week {week.week_no}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="card weekly-leaderboard-card">
              <div className="weekly-heading">
                <div className="weekly-heading-small">
                  WEEKLY STANDINGS
                </div>

                <div className="weekly-heading-main">
                  Match Week {weekNo}
                </div>
              </div>

              {pendingResults > 0 && !loading && (
                <div className="weekly-warning">
                  ⚠ Provisional standings — {pendingResults}{" "}
                  {pendingResults === 1
                    ? "result pending"
                    : "results pending"}

                  {cancelledResults > 0 && (
                    <>
                      {" • "}
                      {cancelledResults} cancelled
                    </>
                  )}
                </div>
              )}

              {pendingResults === 0 &&
                cancelledResults > 0 &&
                !loading && (
                  <div className="weekly-cancelled-note">
                    {cancelledResults}{" "}
                    {cancelledResults === 1
                      ? "fixture cancelled"
                      : "fixtures cancelled"}
                  </div>
                )}

              {loading ? (
                <p>Loading leaderboard...</p>
              ) : rows.length === 0 ? (
                <p>
                  No predictions found for this Match Week.
                </p>
              ) : (
                <>
                  <div className="weekly-tap-hint">
                    TAP A PLAYER TO VIEW THEIR PREDICTIONS
                  </div>

                  <div className="weekly-table">
                    {rows.map((row) => {
                      const expanded =
                        expandedUserId === row.id;

                      const isWinner =
                        row.position === 1;

                      const isSecond =
                        row.position === 2;

                      const isThird =
                        row.position === 3;

                      return (
                        <div
                          key={row.id}
                          className={`weekly-player-wrap ${
                            expanded ? "expanded" : ""
                          }`}
                        >
                          <div
                            className={`weekly-player-row ${
                              isWinner ? "winner" : ""
                            }`}
                            onClick={() =>
                              setExpandedUserId(
                                expanded ? null : row.id
                              )
                            }
                          >
                            <div
                              className={`weekly-position ${
                                isWinner
                                  ? "gold"
                                  : isSecond
                                  ? "silver"
                                  : isThird
                                  ? "bronze"
                                  : "navy"
                              }`}
                            >
                              {row.position}
                            </div>

                            <div className="weekly-player-name">
                              <div className="weekly-player-main">
                                {row.firstName} {row.surname}
                              </div>

                              {row.teamName && (
                                <div className="weekly-player-team">
                                  {row.teamName}
                                </div>
                              )}
                            </div>

                            <div className="weekly-points">
                              <div className="weekly-points-number">
                                {row.points}
                              </div>

                              <div className="weekly-points-label">
                                {row.points === 1
                                  ? "POINT"
                                  : "POINTS"}
                              </div>
                            </div>

                            <div
                              className={`weekly-chevron ${
                                expanded ? "open" : ""
                              }`}
                            >
                              ▼
                            </div>
                          </div>

                          {expanded && (
                            <div className="weekly-expanded">
                              <div className="weekly-score-summary">
                                <div>
                                  <div className="weekly-score-label">
                                    WEEK SCORE
                                  </div>

                                  <div className="weekly-score-value">
                                    {row.points}/{completedResults} correct
                                  </div>
                                </div>

                                <div className="weekly-score-badge">
                                  {row.points}{" "}
                                  {row.points === 1 ? "pt" : "pts"}
                                </div>
                              </div>

                              {(pendingResults > 0 ||
                                cancelledResults > 0) && (
                                <div className="weekly-extra-summary">
                                  {pendingResults > 0 && (
                                    <>
                                      {pendingResults}{" "}
                                      {pendingResults === 1
                                        ? "result pending"
                                        : "results pending"}
                                    </>
                                  )}

                                  {pendingResults > 0 &&
                                    cancelledResults > 0 &&
                                    " • "}

                                  {cancelledResults > 0 && (
                                    <>
                                      {cancelledResults} cancelled
                                    </>
                                  )}
                                </div>
                              )}

                              <div className="weekly-fixtures-list">
                                {fixtures.map((fixture) => {
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
                                    Boolean(fixture.result);

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
                                      key={fixture.id}
                                      className="weekly-fixture-detail"
                                    >
                                      <div
                                        className="weekly-fixture-name"
                                        title={`${fixture.home_team} v ${fixture.away_team}`}
                                      >
                                        {fixture.home_team} v{" "}
                                        {fixture.away_team}
                                      </div>

                                      {cancelled ? (
                                        <div className="weekly-cancelled-row">
                                          <div className="weekly-result-block">
                                            <span className="weekly-result-label">
                                              Prediction
                                            </span>

                                            <span
                                              className={`weekly-result-circle ${
                                                predictionLetter === "-"
                                                  ? "muted"
                                                  : "prediction"
                                              }`}
                                            >
                                              {predictionLetter}
                                            </span>
                                          </div>

                                          <div className="weekly-cancelled-text">
                                            CANCELLED — no points
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="weekly-result-row">
                                          <div className="weekly-result-block">
                                            <span className="weekly-result-label">
                                              Prediction
                                            </span>

                                            <span
                                              className={`weekly-result-circle ${
                                                predictionLetter === "-"
                                                  ? "muted"
                                                  : "prediction"
                                              }`}
                                            >
                                              {predictionLetter}
                                            </span>
                                          </div>

                                          <div className="weekly-result-block right">
                                            <span className="weekly-result-label">
                                              Result
                                            </span>

                                            <span
                                              className={`weekly-result-circle ${
                                                hasResult
                                                  ? "actual"
                                                  : "muted"
                                              }`}
                                            >
                                              {resultLetter}
                                            </span>
                                          </div>

                                          <div
                                            className={`weekly-outcome ${
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
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        <a href="/predictor">
          <button>
            Back to Predictor
          </button>
        </a>

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>
    </main>
  );
}

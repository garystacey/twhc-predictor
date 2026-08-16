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

      const { data: completedWeekData, error: weekError } = await supabase
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

            const leaderboard = (profiles || [])
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

  if (loading && completedWeeks.length === 0) {
    return (
      <main>
        <div className="container">
          <div className="badge">TELFORD & WREKIN HC</div>

          <h1>THE PREDICTOR</h1>
          <p className="subtitle">Weekly Leaderboards</p>

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
      <div className="container">
        <div className="badge">TELFORD & WREKIN HC</div>

        <h1>THE PREDICTOR</h1>
        <p className="subtitle">Weekly Leaderboards</p>

        {message && (
          <div className="card">
            <p>{message}</p>
          </div>
        )}

        {completedWeeks.length === 0 ? (
          <div className="card">
            <h2>No completed match week yet</h2>

            <p>
              Weekly Leaderboards will appear once the first match
              week has finished.
            </p>
          </div>
        ) : (
          <div className="card">
            <select
              value={selectedWeekId || ""}
              onChange={(e) =>
                setSelectedWeekId(Number(e.target.value))
              }
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "18px",
                borderRadius: "8px",
                border: "1px solid #d7dee7",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              {completedWeeks.map((week) => (
                <option key={week.id} value={week.id}>
                  Match Week {week.week_no}
                </option>
              ))}
            </select>

            <h2>Match Week {weekNo}</h2>

            {pendingResults > 0 && !loading && (
              <div
                style={{
                  marginTop: "8px",
                  marginBottom: "6px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: "#fff3cd",
                  color: "#664d03",
                  fontSize: "13px",
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
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
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    marginTop: "8px",
                  }}
                >
                  {cancelledResults}{" "}
                  {cancelledResults === 1
                    ? "fixture cancelled"
                    : "fixtures cancelled"}
                </p>
              )}

            {loading ? (
              <p>Loading leaderboard...</p>
            ) : (
              <div
                style={{
                  width: "100%",
                  marginTop: "20px",
                }}
              >
                {rows.map((row, index) => {
                  const expanded =
                    expandedUserId === row.id;

                  return (
                    <div key={row.id}>
                      <div
  style={{
    display: "grid",
    gridTemplateColumns: "50px 1fr 90px",
    alignItems: "center",
    padding: "12px 8px",
    borderBottom: "1px solid #d7dee7",
    textAlign: "left",
    cursor: "pointer",
  }}
>
  <strong>{row.position}</strong>

  <div>
                          <strong>
                            {row.firstName} {row.surname}
                          </strong>

                          {row.teamName && (
                            <div
                              style={{
                                fontSize: "13px",
                                marginTop: "3px",
                                opacity: 0.7,
                              }}
                            >
                              {row.teamName}
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            textAlign: "right",
                            fontWeight: "bold",
                          }}
                        >
                          {row.points}{" "}
                          {row.points === 1 ? "pt" : "pts"}
                        </div>
                      </div>

                      {expanded && (
                        <div
                          style={{
                            padding: "10px 8px 16px",
                            background: "#f7f9fb",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "bold",
                              marginBottom: "10px",
                            }}
                          >
                            {row.points}/{completedResults} correct

                            {pendingResults > 0 && (
                              <>
                                {" • "}
                                {pendingResults}{" "}
                                {pendingResults === 1
                                  ? "result pending"
                                  : "results pending"}
                              </>
                            )}

                            {cancelledResults > 0 && (
                              <>
                                {" • "}
                                {cancelledResults} cancelled
                              </>
                            )}
                          </div>

                          {fixtures.map((fixture) => {
                            const userPrediction =
                              getUserPrediction(
                                row.id,
                                fixture.id
                              );

                            const cancelled =
                              fixture.status === "cancelled";

                            const hasResult =
                              !cancelled &&
                              Boolean(fixture.result);

                            const correct =
                              hasResult &&
                              userPrediction &&
                              userPrediction === fixture.result;

                            const predictionLetter =
                              shortResult(userPrediction);

                            const resultLetter =
                              shortResult(fixture.result);

                            const circleStyle = {
                              width: "34px",
                              minWidth: "34px",
                              height: "34px",
                              borderRadius: "50%",
                              background: "#061b33",
                              color: "#ffffff",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "bold",
                              fontSize: "13px",
                            };

                            return (
                              <div
                                key={fixture.id}
                                style={{
                                  padding: "11px 0",
                                  borderTop:
                                    "1px solid #d7dee7",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "700",
                                    fontSize: "13px",
                                    marginBottom: "9px",
                                    textAlign: "left",
                                  }}
                                >
                                  {fixture.home_team} v{" "}
                                  {fixture.away_team}
                                </div>

                                {cancelled ? (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      textAlign: "left",
                                    }}
                                  >
                                    Prediction{" "}
                                    <span
                                      style={{
                                        ...circleStyle,
                                        marginLeft: "6px",
                                        marginRight: "12px",
                                        background:
                                          predictionLetter === "-"
                                            ? "#9ca3af"
                                            : "#061b33",
                                      }}
                                    >
                                      {predictionLetter}
                                    </span>

                                    CANCELLED — no points awarded
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent:
                                        "space-between",
                                      gap: "8px",
                                      fontSize: "12px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                      }}
                                    >
                                      <span>Prediction</span>

                                      <span
                                        style={{
                                          ...circleStyle,
                                          background:
                                            predictionLetter === "-"
                                              ? "#9ca3af"
                                              : "#061b33",
                                        }}
                                      >
                                        {predictionLetter}
                                      </span>
                                    </div>

                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                      }}
                                    >
                                      <span>Result</span>

                                      <span
                                        style={{
                                          ...circleStyle,
                                          background: hasResult
                                            ? "#061b33"
                                            : "#9ca3af",
                                        }}
                                      >
                                        {resultLetter}
                                      </span>
                                    </div>

                                    <div
                                      style={{
                                        width: "28px",
                                        textAlign: "center",
                                        fontWeight: "bold",
                                        fontSize: "23px",
                                        lineHeight: 1,
                                      }}
                                    >
                                      {!hasResult
                                        ? "…"
                                        : correct
                                        ? "✓"
                                        : "✗"}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <a href="/predictor">
          <button>Back to Predictor</button>
        </a>

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>
    </main>
  );
}

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

  // First load: check login and find all completed match weeks
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

      // Automatically show the most recently completed week
      const latestWeek =
        completedWeekData[completedWeekData.length - 1];

      setSelectedWeekId(latestWeek.id);
    }

    loadCompletedWeeks();
  }, [router]);

  // Whenever a different week is selected, rebuild that week's leaderboard
  useEffect(() => {
    if (!selectedWeekId) {
      return;
    }

    async function loadSelectedWeekLeaderboard() {
      setLoading(true);
      setMessage("");

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

      const { data: fixtures, error: fixtureError } = await supabase
        .from("fixtures")
        .select("id, result")
        .eq("match_week_id", selectedWeekId)
        .not("result", "is", null);

      if (fixtureError) {
        setMessage(fixtureError.message);
        setLoading(false);
        return;
      }

      const fixtureIds = (fixtures || []).map(
        (fixture) => fixture.id
      );

      let predictions = [];

      if (fixtureIds.length > 0) {
        const {
          data: predictionData,
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

        predictions = predictionData || [];
      }

      const resultByFixture = {};

      (fixtures || []).forEach((fixture) => {
        resultByFixture[fixture.id] = fixture.result;
      });

      const pointsByUser = {};

      predictions.forEach((prediction) => {
        if (
          resultByFixture[prediction.fixture_id] &&
          prediction.prediction ===
            resultByFixture[prediction.fixture_id]
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

      setRows(leaderboard);
      setLoading(false);
    }

    loadSelectedWeekLeaderboard();
  }, [selectedWeekId, completedWeeks]);

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

            {loading ? (
              <p>Loading leaderboard...</p>
            ) : (
              <div
                style={{
                  width: "100%",
                  marginTop: "20px",
                }}
              >
                {rows.map((row, index) => (
                  <div
                    key={row.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "50px 1fr 90px",
                      alignItems: "center",
                      padding: "12px 8px",
                      borderBottom: "1px solid #d7dee7",
                      textAlign: "left",
                    }}
                  >
                    <strong>{index + 1}</strong>

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
                ))}
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

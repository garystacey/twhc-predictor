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

  if (loading) {
    return (
      <main>
        <div className="container">
          <div className="badge">TELFORD & WREKIN HC</div>

          <h1>THE PREDICTOR</h1>
          <p className="subtitle">Overall Leaderboard</p>

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
        <p className="subtitle">Overall Leaderboard</p>

        {message && (
          <div className="card">
            <p>{message}</p>
          </div>
        )}

        <div className="card">
          <h2>Overall Leaderboard</h2>

          <div
            style={{
              width: "100%",
              marginTop: "20px",
            }}
          >
            {rows.map((row) => (
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
            ))}
          </div>

          {rows.length === 0 && <p>No players found.</p>}
        </div>

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

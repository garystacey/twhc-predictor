"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function PredictionsPage() {
  const router = useRouter();

  const [weeks, setWeeks] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [choices, setChoices] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPredictionsPage() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const today = new Date().toISOString().slice(0, 10);

      const { data: weekData, error: weekError } = await supabase
        .from("match_weeks")
        .select("id, week_no, match_date, opens_at, deadline")
        .gte("match_date", today)
        .order("week_no", { ascending: true })
        .limit(3);

      if (weekError) {
        setMessage(weekError.message);
        setLoading(false);
        return;
      }

      const weekIds = (weekData || []).map((week) => week.id);

      if (weekIds.length === 0) {
        setWeeks([]);
        setFixtures([]);
        setLoading(false);
        return;
      }

      const { data: fixtureData, error: fixtureError } = await supabase
        .from("fixtures")
        .select(
          "id, match_week_id, fixture_order, home_team, away_team, scheduled_date, status, result"
        )
        .in("match_week_id", weekIds)
        .order("match_week_id", { ascending: true })
        .order("fixture_order", { ascending: true });

      if (fixtureError) {
  setMessage(fixtureError.message);
  setLoading(false);
  return;
}
      
      const fixtureIds = (fixtureData || []).map((fixture) => fixture.id);

let savedChoices = {};

if (fixtureIds.length > 0) {
  const { data: predictionData, error: predictionError } = await supabase
    .from("predictions")
    .select("fixture_id, prediction")
    .eq("user_id", user.id)
    .in("fixture_id", fixtureIds);

  if (predictionError) {
    setMessage(predictionError.message);
  } else {
    const reverseMap = {
      home: "H",
      draw: "D",
      away: "A",
    };

    savedChoices = (predictionData || []).reduce((choices, prediction) => {
      choices[prediction.fixture_id] = reverseMap[prediction.prediction];
      return choices;
    }, {});
  }
}

setWeeks(weekData || []);
setFixtures(fixtureData || []);
setChoices(savedChoices);
setLoading(false);
    }

    loadPredictionsPage();
  }, [router]);

async function chooseResult(fixtureId, result, isOpen) {
  if (!isOpen) return;

  const resultMap = {
    H: "home",
    D: "draw",
    A: "away",
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.push("/login");
    return;
  }

  const { error } = await supabase
    .from("predictions")
    .upsert(
      {
        user_id: user.id,
        fixture_id: fixtureId,
        prediction: resultMap[result],
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,fixture_id",
      }
    );

  if (error) {
    setMessage(error.message);
    return;
  }

  setChoices((current) => ({
    ...current,
    [fixtureId]: result,
  }));

  setMessage("Prediction saved");
}

  function formatDate(dateString) {
    return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatDeadline(dateString) {
    return new Date(dateString).toLocaleString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main>
        <div className="container">
          <p>Loading fixtures...</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container" style={{ maxWidth: "760px" }}>
        <div className="badge">TELFORD & WREKIN HC</div>

        <h1>THE PREDICTOR</h1>

        <p className="subtitle">Make Your Predictions</p>

        {message && (
          <div className="card">
            <p>{message}</p>
          </div>
        )}

        {weeks.length === 0 && (
          <div className="card">
            <h2>No upcoming match weeks</h2>
          </div>
        )}

        {weeks.map((week) => {
          const now = new Date();
          const opensAt = new Date(week.opens_at);
          const deadline = new Date(week.deadline);

          const isOpen = now >= opensAt && now < deadline;
          const notOpenYet = now < opensAt;

          const weekFixtures = fixtures.filter(
            (fixture) => fixture.match_week_id === week.id
          );

          return (
            <div
              className="card"
              key={week.id}
              style={{ marginBottom: "20px", padding: "20px 12px" }}
            >
              <h2 style={{ marginBottom: "4px" }}>
                Match Week {week.week_no}
              </h2>

              <p style={{ marginBottom: "6px" }}>
                {formatDate(week.match_date)}
              </p>

              <p
                style={{
                  marginBottom: "18px",
                  fontSize: "13px",
                  fontWeight: "700",
                }}
              >
                {notOpenYet
                  ? `Opens ${formatDeadline(week.opens_at)}`
                  : isOpen
                  ? `Open — closes ${formatDeadline(week.deadline)}`
                  : "Predictions closed"}
              </p>

              {weekFixtures.map((fixture) => {
                const selected = choices[fixture.id];

                return (
                  <div
                    key={fixture.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) 116px",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 0",
                      borderTop: "1px solid #d9e0e7",
                    }}
                  >
                    <div
                      style={{
                        minWidth: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textAlign: "left",
                        fontWeight: "700",
                        fontSize: "14px",
                      }}
                    >
                      {fixture.home_team} v {fixture.away_team}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "nowrap",
                        gap: "5px",
                        justifyContent: "flex-end",
                      }}
                    >
                      {["H", "D", "A"].map((result) => (
                        <button
                          key={result}
                          onClick={() =>
                            chooseResult(fixture.id, result, isOpen)
                          }
                          disabled={!isOpen}
                          style={{
                            width: "34px",
                            minWidth: "34px",
                            height: "34px",
                            padding: 0,
                            borderRadius: "50%",
                            fontSize: "13px",
                            opacity: !isOpen ? 0.4 : 1,
                            background:
                              selected === result ? "#061b33" : "#0877c9",
                          }}
                        >
                          {result}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        <a href="/predictor">
          <button>Back to Predictor</button>
        </a>

        <p className="footer">Telford & Wrekin Hockey Club</p>
      </div>
    </main>
  );
}

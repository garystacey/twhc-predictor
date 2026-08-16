"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function PredictionsPage() {
  const router = useRouter();

  const [weeks, setWeeks] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [choices, setChoices] = useState({});
  const [selectedWeekId, setSelectedWeekId] = useState(null);
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

      const { data: weekData, error: weekError } = await supabase
        .from("match_weeks")
        .select("id, week_no, match_date, opens_at, deadline")
        .order("week_no", { ascending: true });

      if (weekError) {
        setMessage(weekError.message);
        setLoading(false);
        return;
      }

      const allWeeks = weekData || [];
      const weekIds = allWeeks.map((week) => week.id);

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

      const fixtureIds = (fixtureData || []).map(
        (fixture) => fixture.id
      );

      let savedChoices = {};

      if (fixtureIds.length > 0) {
        const {
          data: predictionData,
          error: predictionError,
        } = await supabase
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

          savedChoices = (predictionData || []).reduce(
            (currentChoices, prediction) => {
              currentChoices[prediction.fixture_id] =
                reverseMap[prediction.prediction];

              return currentChoices;
            },
            {}
          );
        }
      }

      const now = new Date();

      const currentOrNextWeek = allWeeks.find(
        (week) => now < new Date(week.deadline)
      );

      const mostRecentClosedWeek = [...allWeeks]
        .reverse()
        .find((week) => now >= new Date(week.deadline));

      setWeeks(allWeeks);
      setFixtures(fixtureData || []);
      setChoices(savedChoices);

      if (currentOrNextWeek) {
        setSelectedWeekId(currentOrNextWeek.id);
      } else if (mostRecentClosedWeek) {
        setSelectedWeekId(mostRecentClosedWeek.id);
      }

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
    return new Date(
      `${dateString}T12:00:00`
    ).toLocaleDateString("en-GB", {
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

  const selectedWeek = weeks.find(
    (week) => week.id === Number(selectedWeekId)
  );

  const now = new Date();

  const previousWeeks = weeks.filter(
    (week) => now >= new Date(week.deadline)
  );

  const currentAndFutureWeeks = weeks.filter(
    (week) => now < new Date(week.deadline)
  );

  return (
    <main>
      <div
        className="container"
        style={{ maxWidth: "760px" }}
      >
        <div className="badge">
          TELFORD & WREKIN HC
        </div>

        <h1>THE PREDICTOR</h1>

        <p className="subtitle">
          Make Your Predictions
        </p>

        {message && (
          <div className="card">
            <p>{message}</p>
          </div>
        )}

        <div className="card">
          <h2>Select Match Week</h2>

          <select
            value={selectedWeekId || ""}
            onChange={(e) =>
              setSelectedWeekId(
                Number(e.target.value)
              )
            }
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #d7dee7",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            {currentAndFutureWeeks.length > 0 && (
              <optgroup label="Current / Upcoming">
                {currentAndFutureWeeks.map(
                  (week) => (
                    <option
                      key={week.id}
                      value={week.id}
                    >
                      Match Week {week.week_no}
                    </option>
                  )
                )}
              </optgroup>
            )}

            {previousWeeks.length > 0 && (
              <optgroup label="Previous Weeks">
                {previousWeeks.map((week) => (
                  <option
                    key={week.id}
                    value={week.id}
                  >
                    Match Week {week.week_no} —
                    Locked
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {selectedWeek &&
          (() => {
            const opensAt = new Date(
              selectedWeek.opens_at
            );

            const deadline = new Date(
              selectedWeek.deadline
            );

            const isOpen =
              now >= opensAt && now < deadline;

            const notOpenYet = now < opensAt;

            const isLocked = now >= deadline;

            /*
              Current/upcoming:
              hide cancelled fixtures completely.

              Previous locked weeks:
              retain cancelled fixtures for history.
            */
            const weekFixtures = fixtures.filter(
              (fixture) =>
                fixture.match_week_id ===
                  selectedWeek.id &&
                (isLocked ||
                  fixture.status !== "cancelled")
            );

            return (
              <div
                className="card"
                style={{
                  marginBottom: "20px",
                  padding: "20px 12px",
                }}
              >
                <h2
                  style={{
                    marginBottom: "4px",
                  }}
                >
                  Match Week{" "}
                  {selectedWeek.week_no}
                </h2>

                <p
                  style={{
                    marginBottom: "6px",
                  }}
                >
                  {formatDate(
                    selectedWeek.match_date
                  )}
                </p>

                <p
                  style={{
                    marginBottom: "18px",
                    fontSize: "13px",
                    fontWeight: "700",
                  }}
                >
                  {notOpenYet
                    ? `Opens ${formatDeadline(
                        selectedWeek.opens_at
                      )}`
                    : isOpen
                    ? `Open — closes ${formatDeadline(
                        selectedWeek.deadline
                      )}`
                    : "🔒 Predictions Locked"}
                </p>

                {isLocked && (
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      marginBottom: "18px",
                    }}
                  >
                    Your selections are shown
                    below for reference only and
                    can no longer be changed.
                  </p>
                )}

                {weekFixtures.map(
                  (fixture) => {
                    const selected =
                      choices[fixture.id];

                    const cancelled =
                      fixture.status ===
                      "cancelled";

                    if (
                      cancelled &&
                      isLocked
                    ) {
                      return (
                        <div
                          key={fixture.id}
                          style={{
                            padding: "10px 0",
                            borderTop:
                              "1px solid #d9e0e7",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: "700",
                              fontSize: "14px",
                              textAlign: "left",
                              marginBottom:
                                "8px",
                            }}
                          >
                            {fixture.home_team} v{" "}
                            {fixture.away_team}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: "8px",
                              fontSize: "13px",
                              fontWeight: "700",
                            }}
                          >
                            <span>
                              Your Prediction
                            </span>

                            <span
                              style={{
                                width: "34px",
                                minWidth: "34px",
                                height: "34px",
                                borderRadius:
                                  "50%",
                                background:
                                  selected
                                    ? "#061b33"
                                    : "#9ca3af",
                                color:
                                  "#ffffff",
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                fontWeight:
                                  "bold",
                              }}
                            >
                              {selected || "-"}
                            </span>

                            <span>
                              CANCELLED — no
                              points awarded
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={fixture.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "minmax(0, 1fr) 116px",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 0",
                          borderTop:
                            "1px solid #d9e0e7",
                        }}
                      >
                        <div
                          style={{
                            minWidth: 0,
                            whiteSpace:
                              "nowrap",
                            overflow: "hidden",
                            textOverflow:
                              "ellipsis",
                            textAlign: "left",
                            fontWeight: "700",
                            fontSize: "14px",
                          }}
                        >
                          {fixture.home_team} v{" "}
                          {fixture.away_team}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "nowrap",
                            gap: "5px",
                            justifyContent:
                              "flex-end",
                          }}
                        >
                          {["H", "D", "A"].map(
                            (result) => {
                              const isSelected =
                                selected ===
                                result;

                              return (
                                <button
                                  key={result}
                                  onClick={() =>
                                    chooseResult(
                                      fixture.id,
                                      result,
                                      isOpen
                                    )
                                  }
                                  disabled={
                                    !isOpen
                                  }
                                  style={{
                                    width:
                                      "34px",
                                    minWidth:
                                      "34px",
                                    height:
                                      "34px",
                                    padding: 0,
                                    borderRadius:
                                      "50%",
                                    fontSize:
                                      "13px",
                                    opacity:
                                      !isOpen &&
                                      !isSelected
                                        ? 0.28
                                        : 1,
                                    cursor:
                                      !isOpen
                                        ? "not-allowed"
                                        : "pointer",
                                    background:
                                      isSelected
                                        ? "#061b33"
                                        : !isOpen
                                        ? "#9ca3af"
                                        : "#0877c9",
                                  }}
                                >
                                  {result}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            );
          })()}

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

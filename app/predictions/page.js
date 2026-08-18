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
  const [clearingAll, setClearingAll] = useState(false);

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

  async function clearAllPredictions(
    weekFixtures,
    weekNo,
    isOpen
  ) {
    if (!isOpen) return;

    const confirmed = window.confirm(
      `Clear all predictions for Match Week ${weekNo}?\n\nThis will remove all of your selections for this Match Week.`
    );

    if (!confirmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const fixtureIds = weekFixtures
      .filter((fixture) => fixture.status !== "cancelled")
      .map((fixture) => fixture.id);

    if (fixtureIds.length === 0) {
      setMessage("There are no predictions to clear.");
      return;
    }

    setClearingAll(true);
    setMessage("");

    const { error } = await supabase
      .from("predictions")
      .delete()
      .eq("user_id", user.id)
      .in("fixture_id", fixtureIds);

    if (error) {
      setMessage(error.message);
      setClearingAll(false);
      return;
    }

    setChoices((current) => {
      const updatedChoices = { ...current };

      fixtureIds.forEach((fixtureId) => {
        delete updatedChoices[fixtureId];
      });

      return updatedChoices;
    });

    setMessage(
      `All predictions cleared for Match Week ${weekNo}.`
    );

    setClearingAll(false);
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
        <div
          className="container"
          style={{ maxWidth: "760px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <img
              src="/TWHC-badge-white.png"
              alt="Telford & Wrekin Hockey Club"
              style={{
                width: "54px",
                height: "auto",
                margin: 0,
              }}
            />

            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  fontSize: "24px",
                  lineHeight: 1,
                  fontWeight: "900",
                  letterSpacing: "-1px",
                }}
              >
                THE PREDICTO
                <span style={{ color: "#ed1c24" }}>
                  R
                </span>
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "1.2px",
                  color: "#9eb5cc",
                }}
              >
                MAKE YOUR PREDICTIONS
              </div>
            </div>
          </div>

          <div className="card">
            <p>Loading fixtures...</p>
          </div>
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
        {/* COMPACT INTERNAL HEADER */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "11px",
            marginBottom: "18px",
          }}
        >
          <img
            src="/TWHC-badge-white.png"
            alt="Telford & Wrekin Hockey Club"
            style={{
              display: "block",
              width: "58px",
              height: "auto",
              margin: 0,
              filter:
                "drop-shadow(0 4px 8px rgba(0,0,0,0.35))",
            }}
          />

          <div
            style={{
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: "27px",
                lineHeight: 0.95,
                fontWeight: "900",
                letterSpacing: "-1.2px",
                color: "#ffffff",
                textShadow:
                  "0 2px 8px rgba(0,0,0,0.35)",
                whiteSpace: "nowrap",
              }}
            >
              THE PREDICTO
              <span
                style={{
                  color: "#ed1c24",
                  textShadow:
                    "0 0 12px rgba(237,28,36,0.32)",
                }}
              >
                R
              </span>
            </div>

            <div
              style={{
                marginTop: "5px",
                fontSize: "11px",
                fontWeight: "900",
                letterSpacing: "1.4px",
                color: "#a9bfd5",
              }}
            >
              MAKE YOUR PREDICTIONS
            </div>
          </div>
        </div>

        {/* MESSAGE */}

        {message && (
          <div
            className="card"
            style={{
              padding: "13px 16px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: "700",
              }}
            >
              {message}
            </p>
          </div>
        )}

        {/* MATCH WEEK SELECTOR */}

        <div
          className="card"
          style={{
            padding: "17px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div
              style={{
                textAlign: "left",
                minWidth: "92px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "900",
                  letterSpacing: "0.8px",
                  color: "#71869a",
                  textTransform: "uppercase",
                }}
              >
                Select
              </div>

              <div
                style={{
                  marginTop: "2px",
                  fontSize: "16px",
                  fontWeight: "900",
                  color: "#071d36",
                }}
              >
                Match Week
              </div>
            </div>

            <select
              value={selectedWeekId || ""}
              onChange={(e) =>
                setSelectedWeekId(
                  Number(e.target.value)
                )
              }
              style={{
                width: "100%",
                maxWidth: "350px",
                padding: "11px 12px",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "800",
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
                      Match Week {week.week_no} — Locked
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* FIXTURES */}

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

            const weekFixtures = fixtures.filter(
              (fixture) =>
                fixture.match_week_id ===
                  selectedWeek.id &&
                (isLocked ||
                  fixture.status !== "cancelled")
            );

            const hasAnyPredictions = weekFixtures.some(
              (fixture) =>
                Boolean(choices[fixture.id])
            );

            const activeFixtures =
              weekFixtures.filter(
                (fixture) =>
                  fixture.status !== "cancelled"
              );

            const completedPredictionCount =
              activeFixtures.filter(
                (fixture) =>
                  Boolean(choices[fixture.id])
              ).length;

            return (
              <div
                className="card"
                style={{
                  padding: "17px 12px 16px",
                }}
              >
                {/* WEEK HEADING */}

                <div
                  style={{
                    marginBottom: "14px",
                    padding: "0 4px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "900",
                      letterSpacing: "1.2px",
                      color: "#71869a",
                    }}
                  >
                    MATCH WEEK
                  </div>

                  <div
                    style={{
                      marginTop: "1px",
                      fontSize: "28px",
                      lineHeight: 1,
                      fontWeight: "900",
                      color: "#071d36",
                    }}
                  >
                    {selectedWeek.week_no}
                  </div>

                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#65788c",
                    }}
                  >
                    {formatDate(
                      selectedWeek.match_date
                    )}
                  </div>
                </div>

                {/* STATUS BAR */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginBottom: "14px",
                    padding: "10px 12px",
                    borderRadius: "9px",
                    background: isOpen
                      ? "#edf7ff"
                      : isLocked
                      ? "#f1f3f5"
                      : "#fff7e8",
                    border: isOpen
                      ? "1px solid #b8ddfa"
                      : isLocked
                      ? "1px solid #d4d9df"
                      : "1px solid #f1d49d",
                  }}
                >
                  <div
                    style={{
                      textAlign: "left",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "900",
                        color: isOpen
                          ? "#0867aa"
                          : isLocked
                          ? "#586675"
                          : "#966714",
                      }}
                    >
                      {notOpenYet
                        ? "NOT OPEN YET"
                        : isOpen
                        ? "PREDICTIONS OPEN"
                        : "🔒 PREDICTIONS LOCKED"}
                    </div>

                    <div
                      style={{
                        marginTop: "2px",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#71869a",
                      }}
                    >
                      {notOpenYet
                        ? `Opens ${formatDeadline(
                            selectedWeek.opens_at
                          )}`
                        : isOpen
                        ? `Closes ${formatDeadline(
                            selectedWeek.deadline
                          )}`
                        : "Selections can no longer be changed"}
                    </div>
                  </div>

                  {!isLocked && (
                    <div
                      style={{
                        flexShrink: 0,
                        minWidth: "58px",
                        padding: "7px 8px",
                        borderRadius: "8px",
                        background: "#071d36",
                        color: "#ffffff",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "16px",
                          lineHeight: 1,
                          fontWeight: "900",
                        }}
                      >
                        {completedPredictionCount}/
                        {activeFixtures.length}
                      </div>

                      <div
                        style={{
                          marginTop: "3px",
                          fontSize: "8px",
                          fontWeight: "900",
                          letterSpacing: "0.7px",
                          color: "#b9cee2",
                        }}
                      >
                        SELECTED
                      </div>
                    </div>
                  )}
                </div>

                {/* H D A KEY */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0, 1fr) 116px",
                    alignItems: "center",
                    gap: "8px",
                    padding:
                      "0 3px 7px 3px",
                    fontSize: "9px",
                    fontWeight: "900",
                    letterSpacing: "0.8px",
                    color: "#8a9aaa",
                  }}
                >
                  <div
                    style={{
                      textAlign: "left",
                    }}
                  >
                    FIXTURE
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(3, 34px)",
                      justifyContent: "end",
                      gap: "5px",
                      textAlign: "center",
                    }}
                  >
                    <span>H</span>
                    <span>D</span>
                    <span>A</span>
                  </div>
                </div>

                {/* FIXTURE ROWS */}

                <div
                  style={{
                    borderTop:
                      "1px solid #d9e0e7",
                  }}
                >
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
                              padding:
                                "12px 3px",
                              borderBottom:
                                "1px solid #d9e0e7",
                            }}
                          >
                            <div
                              style={{
                                fontWeight:
                                  "800",
                                fontSize:
                                  "13px",
                                textAlign:
                                  "left",
                                marginBottom:
                                  "8px",
                                color:
                                  "#354b61",
                              }}
                            >
                              {fixture.home_team} v{" "}
                              {fixture.away_team}
                            </div>

                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: "7px",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  "800",
                                color:
                                  "#6e7e8e",
                              }}
                            >
                              <span>
                                Prediction
                              </span>

                              <span
                                style={{
                                  width:
                                    "32px",
                                  minWidth:
                                    "32px",
                                  height:
                                    "32px",
                                  borderRadius:
                                    "50%",
                                  background:
                                    selected
                                      ? "#e31b23"
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
                                    "900",
                                }}
                              >
                                {selected || "-"}
                              </span>

                              <span
                                style={{
                                  color:
                                    "#c5161d",
                                }}
                              >
                                CANCELLED — no
                                points
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
                            alignItems:
                              "center",
                            gap: "8px",
                            padding:
                              "11px 3px",
                            borderBottom:
                              "1px solid #d9e0e7",
                          }}
                        >
                          <div
                            title={`${fixture.home_team} v ${fixture.away_team}`}
                            style={{
                              minWidth: 0,
                              whiteSpace:
                                "nowrap",
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              textAlign:
                                "left",
                              fontWeight:
                                "800",
                              fontSize:
                                "13px",
                              color:
                                "#23394f",
                            }}
                          >
                            {fixture.home_team} v{" "}
                            {fixture.away_team}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexWrap:
                                "nowrap",
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
                                    disabled={!isOpen}
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
                                      border:
                                        isSelected
                                          ? "2px solid #ffffff"
                                          : "0",
                                      outline:
                                        isSelected
                                          ? "2px solid #e31b23"
                                          : "none",
                                      fontSize:
                                        "12px",
                                      fontWeight:
                                        "900",
                                      boxShadow:
                                        isSelected
                                          ? "0 2px 7px rgba(227,27,35,0.3)"
                                          : "0 2px 4px rgba(0,0,0,0.15)",
                                      opacity:
                                        !isOpen &&
                                        !isSelected
                                          ? 0.3
                                          : 1,
                                      cursor:
                                        !isOpen
                                          ? "not-allowed"
                                          : "pointer",
                                      background:
                                        isSelected
                                          ? "#e31b23"
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

                {/* COMPLETION MESSAGE */}

                {isOpen &&
                  completedPredictionCount ===
                    activeFixtures.length &&
                  activeFixtures.length > 0 && (
                    <div
                      style={{
                        marginTop: "15px",
                        padding:
                          "10px 12px",
                        borderRadius:
                          "9px",
                        background:
                          "#e7f7ed",
                        border:
                          "1px solid #aad8bb",
                        color:
                          "#16733f",
                        fontSize:
                          "12px",
                        fontWeight:
                          "900",
                      }}
                    >
                      ✓ All predictions
                      completed
                    </div>
                  )}

                {/* CLEAR ALL */}

                {isOpen && (
                  <button
                    onClick={() =>
                      clearAllPredictions(
                        weekFixtures,
                        selectedWeek.week_no,
                        isOpen
                      )
                    }
                    disabled={
                      clearingAll ||
                      !hasAnyPredictions
                    }
                    style={{
                      marginTop: "16px",
                      background:
                        "#e31b23",
                      color: "#ffffff",
                      opacity:
                        clearingAll ||
                        !hasAnyPredictions
                          ? 0.45
                          : 1,
                      boxShadow:
                        "0 3px 0 #a20d13, 0 6px 12px rgba(0,0,0,0.16)",
                    }}
                  >
                    {clearingAll
                      ? "Clearing..."
                      : "Clear All Predictions"}
                  </button>
                )}
              </div>
            );
          })()}

        {/* BACK */}

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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function AdminPage() {
  const router = useRouter();

  const [weeks, setWeeks] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState("");
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");
  const [authorised, setAuthorised] = useState(false);

  useEffect(() => {
    async function loadAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile || profile.role !== "admin") {
        setMessage(
          "You do not have permission to access the Admin area."
        );
        setLoading(false);
        return;
      }

      setAuthorised(true);

      const { data: weekData, error: weekError } = await supabase
        .from("match_weeks")
        .select("id, week_no, match_date")
        .order("week_no", { ascending: true });

      if (weekError) {
        setMessage(weekError.message);
        setLoading(false);
        return;
      }

      setWeeks(weekData || []);

      if (weekData && weekData.length > 0) {
        setSelectedWeekId(weekData[0].id);
      }

      setLoading(false);
    }

    loadAdmin();
  }, [router]);

  useEffect(() => {
    if (!authorised || !selectedWeekId) return;

    async function loadFixtures() {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("fixtures")
        .select(
          "id, fixture_order, home_team, away_team, scheduled_date, result, status"
        )
        .eq("match_week_id", selectedWeekId)
        .order("fixture_order", { ascending: true });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setFixtures(data || []);
      setLoading(false);
    }

    loadFixtures();
  }, [selectedWeekId, authorised]);

  async function saveResult(fixtureId, result) {
    setSavingId(fixtureId);
    setMessage("");

    const resultMap = {
      H: "home",
      D: "draw",
      A: "away",
    };

    const { error } = await supabase
      .from("fixtures")
      .update({
        result: resultMap[result],
        result_recorded_at: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", fixtureId);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setFixtures((current) =>
      current.map((fixture) =>
        fixture.id === fixtureId
          ? {
              ...fixture,
              result: resultMap[result],
              status: "completed",
            }
          : fixture
      )
    );

    setMessage("Result saved.");
    setSavingId(null);
  }

  async function clearResult(fixtureId) {
    setSavingId(fixtureId);
    setMessage("");

    const { error } = await supabase
      .from("fixtures")
      .update({
        result: null,
        result_recorded_at: null,
        status: "scheduled",
      })
      .eq("id", fixtureId);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setFixtures((current) =>
      current.map((fixture) =>
        fixture.id === fixtureId
          ? {
              ...fixture,
              result: null,
              status: "scheduled",
            }
          : fixture
      )
    );

    setMessage("Result cleared.");
    setSavingId(null);
  }

  async function cancelFixture(fixtureId) {
    const confirmed = window.confirm(
      "Mark this fixture as cancelled?\n\nNo points will be awarded for this fixture."
    );

    if (!confirmed) return;

    setSavingId(fixtureId);
    setMessage("");

    const { error } = await supabase
      .from("fixtures")
      .update({
        result: null,
        result_recorded_at: null,
        status: "cancelled",
      })
      .eq("id", fixtureId);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setFixtures((current) =>
      current.map((fixture) =>
        fixture.id === fixtureId
          ? {
              ...fixture,
              result: null,
              status: "cancelled",
            }
          : fixture
      )
    );

    setMessage("Fixture marked as cancelled.");
    setSavingId(null);
  }

  async function restoreFixture(fixtureId) {
    const confirmed = window.confirm(
      "Restore this fixture to the active fixture list?"
    );

    if (!confirmed) return;

    setSavingId(fixtureId);
    setMessage("");

    const { error } = await supabase
      .from("fixtures")
      .update({
        result: null,
        result_recorded_at: null,
        status: "scheduled",
      })
      .eq("id", fixtureId);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setFixtures((current) =>
      current.map((fixture) =>
        fixture.id === fixtureId
          ? {
              ...fixture,
              result: null,
              status: "scheduled",
            }
          : fixture
      )
    );

    setMessage("Fixture restored.");
    setSavingId(null);
  }

  function displayResult(result) {
    if (result === "home") return "H";
    if (result === "draw") return "D";
    if (result === "away") return "A";
    return null;
  }

  function formatDate(dateString) {
    if (!dateString) return "";

    return new Date(`${dateString}T12:00:00`).toLocaleDateString(
      "en-GB",
      {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function Header() {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "11px",
          marginBottom: "16px",
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
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.35))",
          }}
        />

        <div style={{ textAlign: "left" }}>
          <div
            style={{
              fontSize: "27px",
              lineHeight: 0.95,
              fontWeight: "900",
              letterSpacing: "-1.2px",
              color: "#ffffff",
              whiteSpace: "nowrap",
              textShadow: "0 2px 8px rgba(0,0,0,0.35)",
            }}
          >
            THE PREDICTO
            <span
              style={{
                color: "#ed1c24",
                textShadow: "0 0 12px rgba(237,28,36,0.32)",
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
            ADMIN — ENTER RESULTS
          </div>
        </div>
      </div>
    );
  }

  if (loading && !authorised) {
    return (
      <main>
        <div className="container" style={{ maxWidth: "760px" }}>
          <Header />

          <div className="card">
            <p>Loading Admin area...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!authorised) {
    return (
      <main>
        <div className="container" style={{ maxWidth: "760px" }}>
          <Header />

          <div className="card">
            <h2>Access Denied</h2>
            <p>{message}</p>
          </div>

          <a href="/predictor">
            <button>Back to Predictor</button>
          </a>
        </div>
      </main>
    );
  }

  const selectedWeek = weeks.find(
    (week) => week.id === Number(selectedWeekId)
  );

  const completedCount = fixtures.filter(
    (fixture) =>
      fixture.result && fixture.status !== "cancelled"
  ).length;

  const cancelledCount = fixtures.filter(
    (fixture) => fixture.status === "cancelled"
  ).length;

  const activeCount = fixtures.filter(
    (fixture) => fixture.status !== "cancelled"
  ).length;

  return (
    <main>
      <div className="container" style={{ maxWidth: "760px" }}>
        <Header />

        {message && (
          <div
            className="card"
            style={{
              padding: "12px 16px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: "800",
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
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "110px 1fr",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                textAlign: "left",
                fontSize: "15px",
                fontWeight: "900",
                color: "#071d36",
                whiteSpace: "nowrap",
              }}
            >
              MATCH WEEK
            </div>

            <select
              value={selectedWeekId}
              onChange={(e) =>
                setSelectedWeekId(Number(e.target.value))
              }
              style={{
                width: "100%",
                padding: "11px 12px",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: "800",
              }}
            >
              {weeks.map((week) => (
                <option key={week.id} value={week.id}>
                  Match Week {week.week_no}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* RESULTS CARD */}

        <div
          className="card"
          style={{
            padding: "17px 12px 12px",
          }}
        >
          <div
            style={{
              marginBottom: "12px",
              padding: "0 4px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: "900",
                letterSpacing: "1px",
                color: "#7c8fa2",
              }}
            >
              RECORD RESULTS
            </div>

            <div
              style={{
                marginTop: "2px",
                fontSize: "24px",
                fontWeight: "900",
                color: "#071d36",
              }}
            >
              Match Week {selectedWeek?.week_no}
            </div>

            {selectedWeek?.match_date && (
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#71869a",
                }}
              >
                {formatDate(selectedWeek.match_date)}
              </div>
            )}
          </div>

          {/* STATUS SUMMARY */}

          {!loading && fixtures.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "7px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  padding: "9px 5px",
                  borderRadius: "8px",
                  background: "#071d36",
                  color: "#ffffff",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: "900",
                  }}
                >
                  {activeCount}
                </div>

                <div
                  style={{
                    marginTop: "2px",
                    fontSize: "8px",
                    fontWeight: "900",
                    letterSpacing: "0.5px",
                    color: "#b9cee2",
                  }}
                >
                  ACTIVE
                </div>
              </div>

              <div
                style={{
                  padding: "9px 5px",
                  borderRadius: "8px",
                  background: "#16733f",
                  color: "#ffffff",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: "900",
                  }}
                >
                  {completedCount}
                </div>

                <div
                  style={{
                    marginTop: "2px",
                    fontSize: "8px",
                    fontWeight: "900",
                    letterSpacing: "0.5px",
                    color: "#d7f2e0",
                  }}
                >
                  RESULTS IN
                </div>
              </div>

              <div
                style={{
                  padding: "9px 5px",
                  borderRadius: "8px",
                  background: "#8d99a6",
                  color: "#ffffff",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: "900",
                  }}
                >
                  {cancelledCount}
                </div>

                <div
                  style={{
                    marginTop: "2px",
                    fontSize: "8px",
                    fontWeight: "900",
                    letterSpacing: "0.5px",
                  }}
                >
                  CANCELLED
                </div>
              </div>
            </div>
          )}

          {/* COLUMN HEADINGS */}

          {!loading && fixtures.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 146px",
                alignItems: "center",
                gap: "8px",
                padding: "0 4px 7px",
                fontSize: "9px",
                fontWeight: "900",
                letterSpacing: "0.4px",
                color: "#8a9aaa",
              }}
            >
              <div style={{ textAlign: "left" }}>
                FIXTURE
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "5px",
                  textAlign: "center",
                }}
              >
                <span>Home</span>
                <span>Draw</span>
                <span>Away</span>
              </div>
            </div>
          )}

          {loading ? (
            <p>Loading fixtures...</p>
          ) : fixtures.length === 0 ? (
            <p>No fixtures found for this Match Week.</p>
          ) : (
            <div
              style={{
                width: "100%",
                borderTop: "1px solid #d9e0e7",
              }}
            >
              {fixtures.map((fixture) => {
                const selected = displayResult(fixture.result);
                const saving = savingId === fixture.id;
                const cancelled =
                  fixture.status === "cancelled";

                return (
                  <div
                    key={fixture.id}
                    style={{
                      padding: "11px 3px",
                      borderBottom: "1px solid #d9e0e7",
                      background: cancelled
                        ? "#f5f6f7"
                        : "transparent",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "minmax(0, 1fr) 146px",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {/* FIXTURE NAME */}

                      <div
                        title={`${fixture.home_team} v ${fixture.away_team}`}
                        style={{
                          minWidth: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          textAlign: "left",
                          fontWeight: "800",
                          fontSize: "13px",
                          color: cancelled
                            ? "#7b8792"
                            : "#23394f",
                          textDecoration: cancelled
                            ? "line-through"
                            : "none",
                        }}
                      >
                        {fixture.home_team} v {fixture.away_team}
                      </div>

                      {/* RESULT BUTTONS */}

                      {!cancelled ? (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "nowrap",
                            gap: "5px",
                            justifyContent: "flex-end",
                          }}
                        >
                          {["H", "D", "A"].map((result) => {
                            const isSelected =
                              selected === result;

                            return (
                              <button
                                key={result}
                                disabled={saving}
                                onClick={() =>
                                  saveResult(
                                    fixture.id,
                                    result
                                  )
                                }
                                style={{
                                  width: "44px",
                                  minWidth: "44px",
                                  height: "44px",
                                  padding: 0,
                                  borderRadius: "50%",
                                  background: isSelected
                                    ? "#e31b23"
                                    : "#0877c9",
                                  border: isSelected
                                    ? "2px solid #ffffff"
                                    : "0",
                                  outline: isSelected
                                    ? "2px solid #e31b23"
                                    : "none",
                                  boxShadow: isSelected
                                    ? "0 2px 7px rgba(227,27,35,0.30)"
                                    : "0 2px 4px rgba(0,0,0,0.15)",
                                  opacity: saving ? 0.5 : 1,
                                  fontSize: "13px",
                                  fontWeight: "900",
                                }}
                              >
                                {result}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div
                          style={{
                            textAlign: "right",
                            fontSize: "10px",
                            fontWeight: "900",
                            color: "#c5161d",
                          }}
                        >
                          CANCELLED
                        </div>
                      )}
                    </div>

                    {/* ADMIN ACTIONS */}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "7px",
                        marginTop: "9px",
                        flexWrap: "wrap",
                      }}
                    >
                      {!cancelled && fixture.result && (
                        <button
                          disabled={saving}
                          onClick={() =>
                            clearResult(fixture.id)
                          }
                          style={{
                            width: "auto",
                            minWidth: "75px",
                            padding: "7px 11px",
                            fontSize: "11px",
                            background: "#536579",
                            boxShadow:
                              "0 2px 0 #354657, 0 3px 6px rgba(0,0,0,0.14)",
                            opacity: saving ? 0.5 : 1,
                          }}
                        >
                          Clear Result
                        </button>
                      )}

                      {!cancelled && (
                        <button
                          disabled={saving}
                          onClick={() =>
                            cancelFixture(fixture.id)
                          }
                          style={{
                            width: "auto",
                            minWidth: "85px",
                            padding: "7px 11px",
                            fontSize: "11px",
                            background: "#e31b23",
                            boxShadow:
                              "0 2px 0 #a20d13, 0 3px 6px rgba(0,0,0,0.14)",
                            opacity: saving ? 0.5 : 1,
                          }}
                        >
                          Cancel Fixture
                        </button>
                      )}

                      {cancelled && (
                        <button
                          disabled={saving}
                          onClick={() =>
                            restoreFixture(fixture.id)
                          }
                          style={{
                            width: "auto",
                            minWidth: "95px",
                            padding: "7px 11px",
                            fontSize: "11px",
                            background: "#16733f",
                            boxShadow:
                              "0 2px 0 #0e502b, 0 3px 6px rgba(0,0,0,0.14)",
                            opacity: saving ? 0.5 : 1,
                          }}
                        >
                          Restore Fixture
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <a href="/admin">
          <button>Back to Admin</button>
        </a>

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>
    </main>
  );
}

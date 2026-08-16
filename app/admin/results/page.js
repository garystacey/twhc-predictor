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

  if (loading && !authorised) {
    return (
      <main>
        <div className="container">
          <img
            src="/TWHC-badge-white.png"
            alt="Telford & Wrekin Hockey Club"
            className="club-logo"
          />

          <h1>THE PREDICTOR</h1>
          <p className="subtitle">Administrator</p>

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
        <div className="container">
          <img
            src="/TWHC-badge-white.png"
            alt="Telford & Wrekin Hockey Club"
            className="club-logo"
          />

          <h1>THE PREDICTOR</h1>
          <p className="subtitle">Administrator</p>

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

  return (
    <main>
      <div className="container">
        <img
          src="/TWHC-badge-white.png"
          alt="Telford & Wrekin Hockey Club"
          className="club-logo"
        />

        <h1>THE PREDICTOR</h1>
        <p className="subtitle">
          Administrator — Enter Results
        </p>

        {message && (
          <div className="card">
            <p>{message}</p>
          </div>
        )}

        <div className="card">
          <h2>Select Match Week</h2>

          <select
            value={selectedWeekId}
            onChange={(e) =>
              setSelectedWeekId(Number(e.target.value))
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
            {weeks.map((week) => (
              <option key={week.id} value={week.id}>
                Match Week {week.week_no}
                {week.match_date ? ` — ${week.match_date}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="card">
          <h2>Enter Results</h2>

          {loading ? (
            <p>Loading fixtures...</p>
          ) : fixtures.length === 0 ? (
            <p>No fixtures found for this match week.</p>
          ) : (
            <div style={{ width: "100%" }}>
              {fixtures.map((fixture) => {
                const selected = displayResult(fixture.result);
                const saving = savingId === fixture.id;
                const cancelled =
                  fixture.status === "cancelled";

                return (
                  <div
                    key={fixture.id}
                    style={{
                      padding: "14px 0",
                      borderBottom: "1px solid #d7dee7",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "bold",
                        marginBottom: "10px",
                      }}
                    >
                      {fixture.home_team} v {fixture.away_team}
                    </div>

                    {cancelled && (
                      <div
                        style={{
                          marginBottom: "10px",
                          fontWeight: "bold",
                        }}
                      >
                        CANCELLED — no points awarded
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      {!cancelled &&
                        ["H", "D", "A"].map((result) => (
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
                              background:
                                selected === result
                                  ? "#061b33"
                                  : "#0877c9",
                              opacity: saving ? 0.5 : 1,
                            }}
                          >
                            {result}
                          </button>
                        ))}

                      {!cancelled && (
                        <button
                          disabled={saving}
                          onClick={() =>
                            cancelFixture(fixture.id)
                          }
                          style={{
                            width: "auto",
                            minWidth: "95px",
                            padding: "8px 12px",
                            opacity: saving ? 0.5 : 1,
                          }}
                        >
                          Cancelled
                        </button>
                      )}

                      {fixture.result && !cancelled && (
                        <button
                          disabled={saving}
                          onClick={() =>
                            clearResult(fixture.id)
                          }
                          style={{
                            width: "auto",
                            minWidth: "70px",
                            padding: "8px 12px",
                            opacity: saving ? 0.5 : 1,
                          }}
                        >
                          Clear
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
                            minWidth: "90px",
                            padding: "8px 12px",
                            opacity: saving ? 0.5 : 1,
                          }}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

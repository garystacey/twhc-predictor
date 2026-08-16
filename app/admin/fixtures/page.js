"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ManageFixturesPage() {
  const router = useRouter();

  const [authorised, setAuthorised] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");

  const [weeks, setWeeks] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState("");
  const [fixtures, setFixtures] = useState([]);

  useEffect(() => {
    async function loadPage() {
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
          "You do not have permission to access this page."
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

    loadPage();
  }, [router]);

  useEffect(() => {
    if (!authorised || !selectedWeekId) return;

    async function loadFixtures() {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("fixtures")
        .select(
          "id, match_week_id, home_team, away_team, fixture_order, scheduled_date, status"
        )
        .eq("match_week_id", Number(selectedWeekId))
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

  function updateFixtureField(fixtureId, field, value) {
    setFixtures((current) =>
      current.map((fixture) =>
        fixture.id === fixtureId
          ? { ...fixture, [field]: value }
          : fixture
      )
    );
  }

  async function saveFixture(fixture) {
    if (
      !fixture.home_team ||
      !fixture.away_team ||
      !fixture.fixture_order ||
      !fixture.scheduled_date ||
      !fixture.status
    ) {
      setMessage(
        "Please complete all fixture fields before saving."
      );
      return;
    }

    setSavingId(fixture.id);
    setMessage("");

    const { error } = await supabase
      .from("fixtures")
      .update({
        home_team: fixture.home_team.trim(),
        away_team: fixture.away_team.trim(),
        fixture_order: Number(fixture.fixture_order),
        scheduled_date: fixture.scheduled_date,
        status: fixture.status,
      })
      .eq("id", fixture.id);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setMessage("Fixture saved.");
    setSavingId(null);
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
          <p className="subtitle">Manage Fixtures</p>

          <div className="card">
            <p>Loading fixtures...</p>
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
          <p className="subtitle">Manage Fixtures</p>

          <div className="card">
            <h2>Access Denied</h2>
            <p>{message}</p>
          </div>

          <a href="/admin">
            <button>Back to Admin</button>
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
        <p className="subtitle">Manage Fixtures</p>

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
              setSelectedWeekId(e.target.value)
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
                {week.match_date
                  ? ` — ${week.match_date}`
                  : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="card">
          <h2>Edit Fixtures</h2>

          {loading ? (
            <p>Loading fixtures...</p>
          ) : fixtures.length === 0 ? (
            <p>No fixtures found for this match week.</p>
          ) : (
            <div style={{ width: "100%" }}>
              {fixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  style={{
                    borderBottom: "1px solid #d7dee7",
                    padding: "20px 0",
                    textAlign: "left",
                  }}
                >
                  <h3
                    style={{
                      marginTop: 0,
                      marginBottom: "14px",
                    }}
                  >
                    Fixture {fixture.fixture_order}
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gap: "14px",
                    }}
                  >
                    <label>
                      <strong>Home Team</strong>

                      <input
                        type="text"
                        value={fixture.home_team || ""}
                        onChange={(e) =>
                          updateFixtureField(
                            fixture.id,
                            "home_team",
                            e.target.value
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "10px",
                          marginTop: "5px",
                          borderRadius: "8px",
                          border: "1px solid #d7dee7",
                          boxSizing: "border-box",
                          fontSize: "16px",
                        }}
                      />
                    </label>

                    <label>
                      <strong>Away Team</strong>

                      <input
                        type="text"
                        value={fixture.away_team || ""}
                        onChange={(e) =>
                          updateFixtureField(
                            fixture.id,
                            "away_team",
                            e.target.value
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "10px",
                          marginTop: "5px",
                          borderRadius: "8px",
                          border: "1px solid #d7dee7",
                          boxSizing: "border-box",
                          fontSize: "16px",
                        }}
                      />
                    </label>

                    <label>
                      <strong>Fixture Order</strong>

                      <input
                        type="number"
                        min="1"
                        value={fixture.fixture_order || ""}
                        onChange={(e) =>
                          updateFixtureField(
                            fixture.id,
                            "fixture_order",
                            e.target.value
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "10px",
                          marginTop: "5px",
                          borderRadius: "8px",
                          border: "1px solid #d7dee7",
                          boxSizing: "border-box",
                          fontSize: "16px",
                        }}
                      />
                    </label>

                    <label>
                      <strong>Scheduled Date</strong>

                      <input
                        type="date"
                        value={fixture.scheduled_date || ""}
                        onChange={(e) =>
                          updateFixtureField(
                            fixture.id,
                            "scheduled_date",
                            e.target.value
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "10px",
                          marginTop: "5px",
                          borderRadius: "8px",
                          border: "1px solid #d7dee7",
                          boxSizing: "border-box",
                          fontSize: "16px",
                        }}
                      />
                    </label>

                    <label>
                      <strong>Status</strong>

                      <select
                        value={fixture.status || "scheduled"}
                        onChange={(e) =>
                          updateFixtureField(
                            fixture.id,
                            "status",
                            e.target.value
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "10px",
                          marginTop: "5px",
                          borderRadius: "8px",
                          border: "1px solid #d7dee7",
                          boxSizing: "border-box",
                          fontSize: "16px",
                        }}
                      >
                        <option value="scheduled">
                          Scheduled
                        </option>

                        <option value="postponed">
                          Postponed
                        </option>

                        <option value="completed">
                          Completed
                        </option>

                        <option value="cancelled">
                          Cancelled
                        </option>
                      </select>
                    </label>

                    <button
                      onClick={() =>
                        saveFixture(fixture)
                      }
                      disabled={savingId === fixture.id}
                      style={{
                        opacity:
                          savingId === fixture.id
                            ? 0.5
                            : 1,
                      }}
                    >
                      {savingId === fixture.id
                        ? "Saving..."
                        : "Save Fixture"}
                    </button>
                  </div>
                </div>
              ))}
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

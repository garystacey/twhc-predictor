"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ManageMatchWeeksPage() {
  const router = useRouter();

  const [authorised, setAuthorised] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [weeks, setWeeks] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState("");

  const [matchDate, setMatchDate] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [deadline, setDeadline] = useState("");

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
        .select("id, week_no, match_date, opens_at, deadline")
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
    if (!selectedWeekId || weeks.length === 0) return;

    const selectedWeek = weeks.find(
      (week) => week.id === Number(selectedWeekId)
    );

    if (!selectedWeek) return;

    setMatchDate(selectedWeek.match_date || "");
    setOpensAt(toLocalInputValue(selectedWeek.opens_at));
    setDeadline(toLocalInputValue(selectedWeek.deadline));
    setMessage("");
  }, [selectedWeekId, weeks]);

  function toLocalInputValue(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  async function saveWeek() {
    if (!selectedWeekId) return;

    if (!matchDate || !opensAt || !deadline) {
      setMessage(
        "Please complete all three date/time fields."
      );
      return;
    }

    const openDate = new Date(opensAt);
    const deadlineDate = new Date(deadline);

    if (openDate >= deadlineDate) {
      setMessage(
        "The opening time must be before the deadline."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("match_weeks")
      .update({
        match_date: matchDate,
        opens_at: openDate.toISOString(),
        deadline: deadlineDate.toISOString(),
      })
      .eq("id", Number(selectedWeekId));

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setWeeks((current) =>
      current.map((week) =>
        week.id === Number(selectedWeekId)
          ? {
              ...week,
              match_date: matchDate,
              opens_at: openDate.toISOString(),
              deadline: deadlineDate.toISOString(),
            }
          : week
      )
    );

    setMessage("Match Week saved.");
    setSaving(false);
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
            filter:
              "drop-shadow(0 4px 8px rgba(0,0,0,0.35))",
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
              textShadow:
                "0 2px 8px rgba(0,0,0,0.35)",
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
            ADMIN — MATCH WEEKS
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <main>
        <div
          className="container"
          style={{ maxWidth: "760px" }}
        >
          <Header />

          <div className="card">
            <p>Loading Match Weeks...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!authorised) {
    return (
      <main>
        <div
          className="container"
          style={{ maxWidth: "760px" }}
        >
          <Header />

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

  const selectedWeek = weeks.find(
    (week) => week.id === Number(selectedWeekId)
  );

  return (
    <main>
      <div
        className="container"
        style={{ maxWidth: "760px" }}
      >
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
                setSelectedWeekId(e.target.value)
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

        {/* EDIT MATCH WEEK */}

        <div
          className="card"
          style={{
            padding: "18px 16px",
          }}
        >
          <div
            style={{
              marginBottom: "16px",
              textAlign: "left",
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
              EDIT SCHEDULE
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
          </div>

          <div
            style={{
              display: "grid",
              gap: "15px",
              textAlign: "left",
            }}
          >
            <label>
              <strong
                style={{
                  fontSize: "13px",
                  color: "#21384f",
                }}
              >
                Match Date
              </strong>

              <input
                type="date"
                value={matchDate}
                onChange={(e) =>
                  setMatchDate(e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <label>
              <strong
                style={{
                  fontSize: "13px",
                  color: "#21384f",
                }}
              >
                Predictions Open
              </strong>

              <input
                type="datetime-local"
                value={opensAt}
                onChange={(e) =>
                  setOpensAt(e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <label>
              <strong
                style={{
                  fontSize: "13px",
                  color: "#21384f",
                }}
              >
                Prediction Deadline
              </strong>

              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) =>
                  setDeadline(e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                }}
              />
            </label>

            {/* TIMING SUMMARY */}

            {opensAt && deadline && (
              <div
                style={{
                  padding: "12px",
                  borderRadius: "9px",
                  background: "#f1f4f7",
                  border: "1px solid #d7dee7",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "900",
                    letterSpacing: "0.8px",
                    color: "#71869a",
                    marginBottom: "6px",
                  }}
                >
                  PREDICTION WINDOW
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      padding: "9px",
                      borderRadius: "8px",
                      background: "#edf7ff",
                      border:
                        "1px solid #b8ddfa",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "9px",
                        fontWeight: "900",
                        color: "#0867aa",
                      }}
                    >
                      OPENS
                    </div>

                    <div
                      style={{
                        marginTop: "3px",
                        fontSize: "12px",
                        fontWeight: "800",
                        color: "#21384f",
                      }}
                    >
                      {new Date(opensAt).toLocaleString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "9px",
                      borderRadius: "8px",
                      background: "#fff1f1",
                      border:
                        "1px solid #efb5b8",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "9px",
                        fontWeight: "900",
                        color: "#c5161d",
                      }}
                    >
                      CLOSES
                    </div>

                    <div
                      style={{
                        marginTop: "3px",
                        fontSize: "12px",
                        fontWeight: "800",
                        color: "#21384f",
                      }}
                    >
                      {new Date(deadline).toLocaleString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={saveWeek}
              disabled={saving}
              style={{
                marginTop: "2px",
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving
                ? "Saving..."
                : "Save Match Week"}
            </button>
          </div>
        </div>

        <a href="/admin">
          <button>
            Back to Admin
          </button>
        </a>

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>
    </main>
  );
}

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
        setMessage("You do not have permission to access this page.");
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
      setMessage("Please complete all three date/time fields.");
      return;
    }

    const openDate = new Date(opensAt);
    const deadlineDate = new Date(deadline);

    if (openDate >= deadlineDate) {
      setMessage("The opening time must be before the deadline.");
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

    setMessage("Match week saved.");
    setSaving(false);
  }

  if (loading) {
    return (
      <main>
        <div className="container">
          <img
            src="/TWHC-badge-white.png"
            alt="Telford & Wrekin Hockey Club"
            className="club-logo"
          />

          <h1>THE PREDICTOR</h1>
          <p className="subtitle">Manage Match Weeks</p>

          <div className="card">
            <p>Loading match weeks...</p>
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
          <p className="subtitle">Manage Match Weeks</p>

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
        <p className="subtitle">Manage Match Weeks</p>

        {message && (
          <div className="card">
            <p>{message}</p>
          </div>
        )}

        <div className="card">
          <h2>Select Match Week</h2>

          <select
            value={selectedWeekId}
            onChange={(e) => setSelectedWeekId(e.target.value)}
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
              </option>
            ))}
          </select>
        </div>

        <div className="card">
          <h2>Edit Match Week</h2>

          <div
            style={{
              display: "grid",
              gap: "18px",
              textAlign: "left",
            }}
          >
            <label>
              <strong>Match Date</strong>

              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  border: "1px solid #d7dee7",
                  fontSize: "16px",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <label>
              <strong>Predictions Open</strong>

              <input
                type="datetime-local"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  border: "1px solid #d7dee7",
                  fontSize: "16px",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <label>
              <strong>Prediction Deadline</strong>

              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  border: "1px solid #d7dee7",
                  fontSize: "16px",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <button
              onClick={saveWeek}
              disabled={saving}
              style={{
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? "Saving..." : "Save Match Week"}
            </button>
          </div>
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

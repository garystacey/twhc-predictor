"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function CompetitionSettingsPage() {
  const router = useRouter();

  const [authorised, setAuthorised] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [settingsId, setSettingsId] = useState(null);
  const [entryFee, setEntryFee] = useState("10");
  const [firstPrize, setFirstPrize] = useState("");
  const [secondPrize, setSecondPrize] = useState("");

  useEffect(() => {
    async function loadSettings() {
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

      const { data, error } = await supabase
        .from("competition_settings")
        .select("id, entry_fee, first_prize, second_prize")
        .limit(1)
        .single();

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setSettingsId(data.id);
      setEntryFee(
        data.entry_fee !== null && data.entry_fee !== undefined
          ? String(data.entry_fee)
          : "10"
      );

      setFirstPrize(
        data.first_prize !== null && data.first_prize !== undefined
          ? String(data.first_prize)
          : ""
      );

      setSecondPrize(
        data.second_prize !== null && data.second_prize !== undefined
          ? String(data.second_prize)
          : ""
      );

      setLoading(false);
    }

    loadSettings();
  }, [router]);

  async function saveSettings() {
    if (!settingsId) return;

    if (!entryFee || Number(entryFee) < 0) {
      setMessage("Please enter a valid entry fee.");
      return;
    }

    if (firstPrize && Number(firstPrize) < 0) {
      setMessage("Please enter a valid 1st Prize amount.");
      return;
    }

    if (secondPrize && Number(secondPrize) < 0) {
      setMessage("Please enter a valid 2nd Prize amount.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("competition_settings")
      .update({
        entry_fee: Number(entryFee),
        first_prize:
          firstPrize.trim() === "" ? null : Number(firstPrize),
        second_prize:
          secondPrize.trim() === "" ? null : Number(secondPrize),
        updated_at: new Date().toISOString(),
      })
      .eq("id", settingsId);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Competition settings saved.");
    setSaving(false);
  }

  if (loading) {
    return (
      <main>
        <div className="container">
          <div className="badge">TELFORD & WREKIN HC</div>

          <h1>THE PREDICTOR</h1>
          <p className="subtitle">Competition Settings</p>

          <div className="card">
            <p>Loading settings...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!authorised) {
    return (
      <main>
        <div className="container">
          <div className="badge">TELFORD & WREKIN HC</div>

          <h1>THE PREDICTOR</h1>
          <p className="subtitle">Competition Settings</p>

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
        <div className="badge">TELFORD & WREKIN HC</div>

        <h1>THE PREDICTOR</h1>
        <p className="subtitle">Competition Settings</p>

        {message && (
          <div className="card">
            <p>{message}</p>
          </div>
        )}

        <div className="card">
          <h2>Entry & Prize Money</h2>

          <div
            style={{
              display: "grid",
              gap: "18px",
              textAlign: "left",
            }}
          >
            <label>
              <strong>Entry Fee (£)</strong>

              <input
                type="number"
                min="0"
                step="0.01"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  border: "1px solid #d7dee7",
                  boxSizing: "border-box",
                  fontSize: "16px",
                }}
              />
            </label>

            <label>
              <strong>1st Prize (£)</strong>

              <input
                type="number"
                min="0"
                step="0.01"
                value={firstPrize}
                onChange={(e) => setFirstPrize(e.target.value)}
                placeholder="Leave blank for TBC"
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  border: "1px solid #d7dee7",
                  boxSizing: "border-box",
                  fontSize: "16px",
                }}
              />
            </label>

            <label>
              <strong>2nd Prize (£)</strong>

              <input
                type="number"
                min="0"
                step="0.01"
                value={secondPrize}
                onChange={(e) => setSecondPrize(e.target.value)}
                placeholder="Leave blank for TBC"
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  borderRadius: "8px",
                  border: "1px solid #d7dee7",
                  boxSizing: "border-box",
                  fontSize: "16px",
                }}
              />
            </label>

            <p
              style={{
                fontSize: "13px",
                margin: 0,
              }}
            >
              Leave a prize field blank and the Rules page will show
              <strong> TBC</strong>.
            </p>

            <button
              onClick={saveSettings}
              disabled={saving}
              style={{
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? "Saving..." : "Save Competition Settings"}
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

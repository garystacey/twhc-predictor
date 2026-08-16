"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function PredictorPage() {
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [predictionStatus, setPredictionStatus] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("first_name, surname, team_name, role")
        .eq("id", user.id)
        .single();

      setProfile(data);

      const now = new Date().toISOString();

      const { data: weekData } = await supabase
        .from("match_weeks")
        .select("id, week_no, deadline")
        .gt("deadline", now)
        .order("week_no", { ascending: true })
        .limit(1);

      if (weekData && weekData.length > 0) {
        const week = weekData[0];
        setCurrentWeek(week);

        const { data: fixtureData } = await supabase
          .from("fixtures")
          .select("id")
          .eq("match_week_id", week.id);

        const fixtureIds = (fixtureData || []).map(
          (fixture) => fixture.id
        );

        let completed = 0;

        if (fixtureIds.length > 0) {
          const { data: predictionData } = await supabase
            .from("predictions")
            .select("fixture_id")
            .eq("user_id", user.id)
            .in("fixture_id", fixtureIds);

          completed = (predictionData || []).length;
        }

        setPredictionStatus({
          completed,
          total: fixtureIds.length,
        });
      }

      setLoading(false);
    }

    loadUser();
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main>
        <div className="container">
          <p>Loading The Predictor...</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="container">
        <div className="badge">TELFORD & WREKIN HC</div>

        <h1>THE PREDICTOR</h1>

        <p className="subtitle">
          Welcome, {profile?.first_name} {profile?.surname}

          {profile?.team_name && (
            <>
              <br />
              <strong>{profile.team_name}</strong>
            </>
          )}
        </p>

        {currentWeek && predictionStatus && (
          <div className="card">
            <h2>Match Week {currentWeek.week_no}</h2>

            <p>
              <strong>
                {predictionStatus.completed} of{" "}
                {predictionStatus.total}
              </strong>{" "}
              predictions completed
            </p>

            {predictionStatus.completed ===
            predictionStatus.total ? (
              <p>✅ All predictions completed</p>
            ) : (
              <p>
                ⚠️{" "}
                {predictionStatus.total -
                  predictionStatus.completed}{" "}
                prediction
                {predictionStatus.total -
                  predictionStatus.completed ===
                1
                  ? ""
                  : "s"}{" "}
                still required
              </p>
            )}

            <a href="/predictions">
              <button>
                {predictionStatus.completed ===
                predictionStatus.total
                  ? "Review Predictions"
                  : "Complete Predictions"}
              </button>
            </a>
          </div>
        )}

        <div className="card">
          <h2>Make Your Predictions</h2>
          <p>
            View the upcoming fixtures and submit your predictions.
          </p>
          <a href="/predictions">
            <button>Predictions</button>
          </a>
        </div>

        <div className="card">
          <h2>Overall Leaderboard</h2>
          <p>
            See who's leading The Predictor this season.
          </p>
          <a href="/leaderboard">
            <button>Overall Leaderboard</button>
          </a>
        </div>

        <div className="card">
          <h2>Weekly Leaderboards</h2>
          <p>
            View the leaderboard for any completed match week.
          </p>
          <a href="/last-week">
            <button>Weekly Leaderboards</button>
          </a>
        </div>

        <div className="card">
          <h2>Rules</h2>
          <p>
            View the competition rules and scoring system.
          </p>
          <a href="/rules">
            <button>Competition Rules</button>
          </a>
        </div>

        {profile?.role === "admin" && (
          <div className="card">
            <h2>Admin</h2>
            <p>
              Manage fixtures, results and The Predictor.
            </p>
            <a href="/admin">
              <button>Admin Area</button>
            </a>
          </div>
        )}

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            width: "100%",
            marginTop: "10px",
            marginBottom: "10px",
            opacity: signingOut ? 0.5 : 1,
          }}
        >
          {signingOut ? "Signing Out..." : "Sign Out"}
        </button>

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>
    </main>
  );
}

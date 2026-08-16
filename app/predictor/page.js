"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function PredictorPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }

    loadUser();
  }, [router]);

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
          Welcome, {profile?.first_name}
        </p>

        <div className="card">
          <h2>Make Your Predictions</h2>
          <p>View the upcoming fixtures and submit your predictions.</p>
<a href="/predictions">
  <button>Predictions</button>
</a>
        </div>

        <div className="card">
          <h2>Overall Leaderboard</h2>
          <p>See who's leading The Predictor this season.</p>
          <a href="/leaderboard">
  <button>Overall Leaderboard</button>
</a>
        </div>

       <div className="card">
  <h2>Weekly Leaderboards</h2>
  <p>View the leaderboard for any completed match week.</p>
  <a href="/last-week">
    <button>Weekly Leaderboards</button>
  </a>
</div>

<div className="card">
  <h2>Rules</h2>
  <p>View the competition rules and scoring system.</p>
  <a href="/rules">
    <button>Competition Rules</button>
  </a>
</div>

        {profile?.role === "admin" && (
          <div className="card">
            <h2>Admin</h2>
            <p>Manage fixtures, results and The Predictor.</p>
            <button>Admin Area</button>
          </div>
        )}

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("first_name, surname, team_name, role")
          .eq("id", user.id)
          .single();

        setProfile(data);
      }

      setLoading(false);
    }

    checkUser();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.reload();
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
          Predict the results. Score the points. Top the leaderboard.
        </p>

        <div className="card">
          {loading ? (
            <p>Loading...</p>
          ) : user ? (
            <>
              <h2>
                Welcome
                {profile?.first_name
                  ? `, ${profile.first_name}`
                  : ""}
              </h2>

              <p>
                You are signed in as{" "}
                <strong>{user.email}</strong>
              </p>

              {profile?.role === "admin" && (
                <p>
                  <strong>Administrator account</strong>
                </p>
              )}

              <a href="/predictor">
                <button>Enter The Predictor</button>
              </a>

              <br />
              <br />

              <button onClick={handleSignOut}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <h2>Welcome to The Predictor</h2>

              <p>
                Sign in to make your predictions for the upcoming
                fixtures.
              </p>

              <a href="/login">
                <button>Sign In</button>
              </a>
            </>
          )}
        </div>

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>
    </main>
  );
}

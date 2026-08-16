"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorised, setAuthorised] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !profile || profile.role !== "admin") {
        setMessage("You do not have permission to access the Admin area.");
        setLoading(false);
        return;
      }

      setAuthorised(true);
      setLoading(false);
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <main>
        <div className="container">
          <div className="badge">TELFORD & WREKIN HC</div>
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
          <div className="badge">TELFORD & WREKIN HC</div>
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
        <div className="badge">TELFORD & WREKIN HC</div>

        <h1>THE PREDICTOR</h1>
        <p className="subtitle">Administrator Dashboard</p>

        <div className="card">
          <h2>Enter Results</h2>
          <p>Record the actual H / D / A result for each fixture.</p>
          <a href="/admin/results">
            <button>Enter Results</button>
          </a>
        </div>

        <div className="card">
          <h2>Manage Match Weeks</h2>
          <p>Review match dates, opening times and prediction deadlines.</p>
          <button disabled>Coming Soon</button>
        </div>

        <div className="card">
          <h2>Manage Fixtures</h2>
          <p>Review and manage the fixtures included in each match week.</p>
          <button disabled>Coming Soon</button>
        </div>

        <div className="card">
          <h2>Members</h2>
          <p>View Predictor members and account details.</p>
          <button disabled>Coming Soon</button>
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

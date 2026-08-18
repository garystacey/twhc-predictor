"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorised, setAuthorised] = useState(false);
  const [message, setMessage] = useState("");
  const [signingOut, setSigningOut] = useState(false);

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
        setMessage(
          "You do not have permission to access the Admin area."
        );
        setLoading(false);
        return;
      }

      setAuthorised(true);
      setLoading(false);
    }

    checkAdmin();
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
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
            ADMINISTRATOR
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
            <p>Loading Admin area...</p>
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

          <a href="/predictor">
            <button>Back to Predictor</button>
          </a>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div
        className="container"
        style={{ maxWidth: "760px" }}
      >
        <Header />

        <div
          style={{
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: "900",
              color: "#ffffff",
            }}
          >
            Administrator Dashboard
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "12px",
              fontWeight: "700",
              color: "#a9bfd5",
            }}
          >
            Manage The Predictor competition
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
            marginBottom: "16px",
          }}
        >
          <a
            href="/admin/results"
            style={{ display: "block" }}
          >
            <div
              className="card"
              style={{
                height: "100%",
                marginBottom: 0,
                padding: "19px 16px",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  marginBottom: "7px",
                }}
              >
                ✓
              </div>

              <h2>Enter Results</h2>

              <p>
                Record the actual H / D / A result for each fixture.
              </p>

              <button>Enter Results</button>
            </div>
          </a>

          <a
            href="/admin/weeks"
            style={{ display: "block" }}
          >
            <div
              className="card"
              style={{
                height: "100%",
                marginBottom: 0,
                padding: "19px 16px",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  marginBottom: "7px",
                }}
              >
                📅
              </div>

              <h2>Manage Match Weeks</h2>

              <p>
                Review match dates, opening times and prediction deadlines.
              </p>

              <button>Manage Match Weeks</button>
            </div>
          </a>

          <a
            href="/admin/fixtures"
            style={{ display: "block" }}
          >
            <div
              className="card"
              style={{
                height: "100%",
                marginBottom: 0,
                padding: "19px 16px",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  marginBottom: "7px",
                }}
              >
                🏑
              </div>

              <h2>Manage Fixtures</h2>

              <p>
                Review and manage the fixtures included in each Match Week.
              </p>

              <button>Manage Fixtures</button>
            </div>
          </a>

          <a
            href="/admin/members"
            style={{ display: "block" }}
          >
            <div
              className="card"
              style={{
                height: "100%",
                marginBottom: 0,
                padding: "19px 16px",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  marginBottom: "7px",
                }}
              >
                👥
              </div>

              <h2>Members</h2>

              <p>
                View Predictor members, payment status and account details.
              </p>

              <button>Members</button>
            </div>
          </a>

          <a
            href="/admin/settings"
            style={{ display: "block" }}
          >
            <div
              className="card"
              style={{
                height: "100%",
                marginBottom: 0,
                padding: "19px 16px",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  marginBottom: "7px",
                }}
              >
                £
              </div>

              <h2>Competition Settings</h2>

              <p>
                Manage the entry fee and prize money for The Predictor.
              </p>

              <button>Competition Settings</button>
            </div>
          </a>
        </div>

        <a href="/predictor">
          <button>
            Back to Predictor
          </button>
        </a>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            marginTop: "10px",
            background: "#536579",
            boxShadow:
              "0 3px 0 #354657, 0 5px 10px rgba(0,0,0,0.16)",
            opacity: signingOut ? 0.5 : 1,
          }}
        >
          {signingOut
            ? "Signing Out..."
            : "Sign Out"}
        </button>

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>
    </main>
  );
}

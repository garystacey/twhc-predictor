"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LeaderboardPage() {
  const router = useRouter();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadLeaderboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, surname, team_name");

      if (profileError) {
        setMessage(profileError.message);
        setLoading(false);
        return;
      }

      const { data: predictions, error: predictionError } = await supabase
        .from("predictions")
        .select("user_id, prediction, fixture_id");

      if (predictionError) {
        setMessage(predictionError.message);
        setLoading(false);
        return;
      }

      const { data: fixtures, error: fixtureError } = await supabase
        .from("fixtures")
        .select("id, result, status")
        .not("result", "is", null);

      if (fixtureError) {
        setMessage(fixtureError.message);
        setLoading(false);
        return;
      }

      const resultByFixture = {};
      const statusByFixture = {};

      (fixtures || []).forEach((fixture) => {
        resultByFixture[fixture.id] = fixture.result;
        statusByFixture[fixture.id] = fixture.status;
      });

      const pointsByUser = {};

      (predictions || []).forEach((prediction) => {
        const actualResult =
          resultByFixture[prediction.fixture_id];

        const fixtureStatus =
          statusByFixture[prediction.fixture_id];

        if (
          fixtureStatus !== "cancelled" &&
          actualResult &&
          prediction.prediction === actualResult
        ) {
          pointsByUser[prediction.user_id] =
            (pointsByUser[prediction.user_id] || 0) + 1;
        }
      });

      const usersWhoHavePredicted = new Set(
        (predictions || []).map(
          (prediction) => prediction.user_id
        )
      );

      const leaderboard = (profiles || [])
        .filter((profile) =>
          usersWhoHavePredicted.has(profile.id)
        )
        .map((profile) => ({
          id: profile.id,
          firstName: profile.first_name || "",
          surname: profile.surname || "",
          teamName: profile.team_name || "",
          points: pointsByUser[profile.id] || 0,
        }))
        .sort((a, b) => {
          if (b.points !== a.points) {
            return b.points - a.points;
          }

          return `${a.firstName} ${a.surname}`.localeCompare(
            `${b.firstName} ${b.surname}`
          );
        });

      let previousPoints = null;
      let previousPosition = 0;

      const rankedLeaderboard = leaderboard.map(
        (row, index) => {
          let position;

          if (row.points === previousPoints) {
            position = previousPosition;
          } else {
            position = index + 1;
          }

          previousPoints = row.points;
          previousPosition = position;

          return {
            ...row,
            position,
          };
        }
      );

      setRows(rankedLeaderboard);
      setLoading(false);
    }

    loadLeaderboard();
  }, [router]);

  function positionBadge(position) {
    if (position === 1) {
      return {
        label: "1",
        background: "#d9a900",
        color: "#ffffff",
        shadow: "0 3px 8px rgba(217,169,0,0.28)",
      };
    }

    if (position === 2) {
      return {
        label: "2",
        background: "#8d99a6",
        color: "#ffffff",
        shadow: "0 3px 8px rgba(90,100,110,0.22)",
      };
    }

    if (position === 3) {
      return {
        label: "3",
        background: "#a86432",
        color: "#ffffff",
        shadow: "0 3px 8px rgba(168,100,50,0.24)",
      };
    }

    return {
      label: String(position),
      background: "#071d36",
      color: "#ffffff",
      shadow: "0 2px 5px rgba(0,0,0,0.16)",
    };
  }

  if (loading) {
    return (
      <main>
        <div
          className="container"
          style={{ maxWidth: "760px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "11px",
              marginBottom: "18px",
            }}
          >
            <img
              src="/TWHC-badge-white.png"
              alt="Telford & Wrekin Hockey Club"
              style={{
                width: "58px",
                height: "auto",
                margin: 0,
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
                }}
              >
                THE PREDICTO
                <span style={{ color: "#ed1c24" }}>
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
                OVERALL LEADERBOARD
              </div>
            </div>
          </div>

          <div className="card">
            <p>Loading leaderboard...</p>
          </div>
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
        {/* COMPACT HEADER */}

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
              OVERALL LEADERBOARD
            </div>
          </div>
        </div>

        {message && (
          <div
            className="card"
            style={{
              padding: "13px 16px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: "700",
              }}
            >
              {message}
            </p>
          </div>
        )}

        <div
          className="card"
          style={{
            padding: "18px 12px 12px",
          }}
        >
          <div
            style={{
              marginBottom: "14px",
              padding: "0 4px",
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
              SEASON STANDINGS
            </div>

            <div
              style={{
                marginTop: "2px",
                fontSize: "24px",
                fontWeight: "900",
                color: "#071d36",
              }}
            >
              Overall Leaderboard
            </div>
          </div>

          {rows.length === 0 ? (
            <p>No players found.</p>
          ) : (
            <div
              style={{
                width: "100%",
                borderTop: "1px solid #d9e0e7",
              }}
            >
              {rows.map((row) => {
                const badge =
                  positionBadge(row.position);

                const isTopThree =
                  row.position <= 3;

                return (
                  <div
                    key={row.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "46px minmax(0, 1fr) 84px",
                      alignItems: "center",
                      gap: "10px",
                      padding: isTopThree
                        ? "14px 5px"
                        : "12px 5px",
                      borderBottom:
                        "1px solid #d9e0e7",
                      textAlign: "left",
                      background:
                        row.position === 1
                          ? "linear-gradient(90deg, rgba(255,247,209,0.72), rgba(255,255,255,0))"
                          : "transparent",
                    }}
                  >
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          badge.background,
                        color: badge.color,
                        fontSize: "14px",
                        fontWeight: "900",
                        boxShadow:
                          badge.shadow,
                      }}
                    >
                      {badge.label}
                    </div>

                    <div
                      style={{
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            isTopThree
                              ? "15px"
                              : "14px",
                          fontWeight: "900",
                          color: "#21384f",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow:
                            "ellipsis",
                        }}
                      >
                        {row.firstName}{" "}
                        {row.surname}
                      </div>

                      {row.teamName && (
                        <div
                          style={{
                            marginTop: "3px",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#71869a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow:
                              "ellipsis",
                          }}
                        >
                          {row.teamName}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            isTopThree
                              ? "18px"
                              : "16px",
                          lineHeight: 1,
                          fontWeight: "900",
                          color:
                            row.position === 1
                              ? "#b18300"
                              : "#071d36",
                        }}
                      >
                        {row.points}
                      </div>

                      <div
                        style={{
                          marginTop: "3px",
                          fontSize: "8px",
                          fontWeight: "900",
                          letterSpacing: "0.7px",
                          color: "#8a9aaa",
                        }}
                      >
                        {row.points === 1
                          ? "POINT"
                          : "POINTS"}
                      </div>
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

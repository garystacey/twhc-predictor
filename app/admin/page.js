"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const POSTER_WIDTH = 1080;
const POSTER_HEIGHT = 1350;

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorised, setAuthorised] = useState(false);
  const [message, setMessage] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const [completedWeeks, setCompletedWeeks] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState("");

  const [posterBusy, setPosterBusy] = useState("");
  const [posterMessage, setPosterMessage] = useState("");

  const [weeklyPosterUrl, setWeeklyPosterUrl] = useState("");
  const [overallPosterUrl, setOverallPosterUrl] = useState("");

  const selectedWeek = useMemo(() => {
    return completedWeeks.find(
      (week) => Number(week.id) === Number(selectedWeekId)
    );
  }, [completedWeeks, selectedWeekId]);

  /* =====================================================
     ADMIN CHECK + LOAD COMPLETED WEEKS
  ===================================================== */

  useEffect(() => {
    async function initialiseAdmin() {
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

      const now = new Date().toISOString();

      const {
        data: weekData,
        error: weekError,
      } = await supabase
        .from("match_weeks")
        .select("id, week_no, deadline")
        .lt("deadline", now)
        .order("week_no", { ascending: true });

      if (weekError) {
        setPosterMessage(
          `Could not load completed Match Weeks: ${weekError.message}`
        );
      } else {
        const weeks = weekData || [];

        setCompletedWeeks(weeks);

        if (weeks.length > 0) {
          setSelectedWeekId(
            String(weeks[weeks.length - 1].id)
          );
        }
      }

      setLoading(false);
    }

    initialiseAdmin();

    return () => {
      if (weeklyPosterUrl) {
        URL.revokeObjectURL(weeklyPosterUrl);
      }

      if (overallPosterUrl) {
        URL.revokeObjectURL(overallPosterUrl);
      }
    };
  }, [router]);

  /* =====================================================
     SIGN OUT
  ===================================================== */

  async function handleSignOut() {
    setSigningOut(true);

    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  /* =====================================================
     WEEKLY LEADERBOARD DATA
  ===================================================== */

  async function getWeeklyLeaderboard(matchWeekId) {
    const {
      data: profiles,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("id, first_name, surname, team_name");

    if (profileError) {
      throw new Error(profileError.message);
    }

    const {
      data: fixtures,
      error: fixtureError,
    } = await supabase
      .from("fixtures")
      .select(
        "id, fixture_order, home_team, away_team, result, status"
      )
      .eq("match_week_id", matchWeekId)
      .order("fixture_order", { ascending: true });

    if (fixtureError) {
      throw new Error(fixtureError.message);
    }

    const fixtureRows = fixtures || [];

    const fixtureIds = fixtureRows.map(
      (fixture) => fixture.id
    );

    let predictions = [];

    if (fixtureIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from("predictions")
        .select("user_id, prediction, fixture_id")
        .in("fixture_id", fixtureIds);

      if (error) {
        throw new Error(error.message);
      }

      predictions = data || [];
    }

    const pendingFixtures = fixtureRows.filter(
      (fixture) =>
        fixture.status !== "cancelled" &&
        !fixture.result
    );

    if (pendingFixtures.length > 0) {
      throw new Error(
        `${pendingFixtures.length} fixture ${
          pendingFixtures.length === 1
            ? "result is"
            : "results are"
        } still outstanding for Match Week ${selectedWeek?.week_no}. Enter all results before generating the weekly poster.`
      );
    }

    const resultByFixture = {};
    const statusByFixture = {};

    fixtureRows.forEach((fixture) => {
      resultByFixture[fixture.id] =
        fixture.result;

      statusByFixture[fixture.id] =
        fixture.status;
    });

    const pointsByUser = {};

    predictions.forEach((prediction) => {
      const actualResult =
        resultByFixture[
          prediction.fixture_id
        ];

      const fixtureStatus =
        statusByFixture[
          prediction.fixture_id
        ];

      if (
        fixtureStatus !== "cancelled" &&
        actualResult &&
        prediction.prediction === actualResult
      ) {
        pointsByUser[prediction.user_id] =
          (pointsByUser[prediction.user_id] || 0) + 1;
      }
    });

    const usersWhoPredicted = new Set(
      predictions.map(
        (prediction) => prediction.user_id
      )
    );

    const rows = (profiles || [])
      .filter((profile) =>
        usersWhoPredicted.has(profile.id)
      )
      .map((profile) => ({
        id: profile.id,
        firstName: profile.first_name || "",
        surname: profile.surname || "",
        teamName:
          profile.team_name || "Unnamed Team",
        points:
          pointsByUser[profile.id] || 0,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }

        return `${a.firstName} ${a.surname}`.localeCompare(
          `${b.firstName} ${b.surname}`
        );
      });

    return rankRows(rows);
  }

  /* =====================================================
     OVERALL LEADERBOARD THROUGH SELECTED WEEK
  ===================================================== */

  async function getOverallLeaderboardThroughWeek(
    week
  ) {
    if (!week) {
      throw new Error(
        "Please select a Match Week."
      );
    }

    const {
      data: weeks,
      error: weekError,
    } = await supabase
      .from("match_weeks")
      .select("id, week_no")
      .lte("week_no", week.week_no)
      .order("week_no", { ascending: true });

    if (weekError) {
      throw new Error(weekError.message);
    }

    const weekIds = (weeks || []).map(
      (row) => row.id
    );

    if (weekIds.length === 0) {
      return [];
    }

    const {
      data: profiles,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "id, first_name, surname, team_name"
      );

    if (profileError) {
      throw new Error(profileError.message);
    }

    const {
      data: fixtures,
      error: fixtureError,
    } = await supabase
      .from("fixtures")
      .select(
        "id, result, status, match_week_id"
      )
      .in("match_week_id", weekIds)
      .not("result", "is", null);

    if (fixtureError) {
      throw new Error(fixtureError.message);
    }

    const fixtureRows = fixtures || [];

    const fixtureIds = fixtureRows.map(
      (fixture) => fixture.id
    );

    let predictions = [];

    if (fixtureIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from("predictions")
        .select(
          "user_id, prediction, fixture_id"
        )
        .in("fixture_id", fixtureIds);

      if (error) {
        throw new Error(error.message);
      }

      predictions = data || [];
    }

    const resultByFixture = {};
    const statusByFixture = {};

    fixtureRows.forEach((fixture) => {
      resultByFixture[fixture.id] =
        fixture.result;

      statusByFixture[fixture.id] =
        fixture.status;
    });

    const pointsByUser = {};

    predictions.forEach((prediction) => {
      const actualResult =
        resultByFixture[
          prediction.fixture_id
        ];

      const fixtureStatus =
        statusByFixture[
          prediction.fixture_id
        ];

      if (
        fixtureStatus !== "cancelled" &&
        actualResult &&
        prediction.prediction === actualResult
      ) {
        pointsByUser[prediction.user_id] =
          (pointsByUser[prediction.user_id] || 0) + 1;
      }
    });

    const usersWhoPredicted = new Set(
      predictions.map(
        (prediction) => prediction.user_id
      )
    );

    const rows = (profiles || [])
      .filter((profile) =>
        usersWhoPredicted.has(profile.id)
      )
      .map((profile) => ({
        id: profile.id,
        firstName: profile.first_name || "",
        surname: profile.surname || "",
        teamName:
          profile.team_name || "Unnamed Team",
        points:
          pointsByUser[profile.id] || 0,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }

        return `${a.firstName} ${a.surname}`.localeCompare(
          `${b.firstName} ${b.surname}`
        );
      });

    return rankRows(rows);
  }

  /* =====================================================
     GENERATE POSTER #1
  ===================================================== */

  async function generateWeeklyPoster() {
    if (!selectedWeek) {
      setPosterMessage(
        "Please select a completed Match Week."
      );
      return;
    }

    setPosterBusy("weekly");
    setPosterMessage("");

    try {
      const weeklyRows =
        await getWeeklyLeaderboard(
          selectedWeek.id
        );

      if (weeklyRows.length === 0) {
        throw new Error(
          "No weekly leaderboard data was found."
        );
      }

      const topScore =
        weeklyRows[0].points;

      const winners =
        weeklyRows.filter(
          (row) =>
            row.points === topScore
        );

      const canvas =
        document.createElement("canvas");

      canvas.width = POSTER_WIDTH;
      canvas.height = POSTER_HEIGHT;

      const ctx =
        canvas.getContext("2d");

      await drawWeeklyPoster(
        ctx,
        selectedWeek,
        weeklyRows,
        winners
      );

      const blob =
        await canvasToBlob(canvas);

      const url =
        URL.createObjectURL(blob);

      if (weeklyPosterUrl) {
        URL.revokeObjectURL(
          weeklyPosterUrl
        );
      }

      setWeeklyPosterUrl(url);

      setPosterMessage(
        `Weekly Poster #1 created for Match Week ${selectedWeek.week_no}.`
      );
    } catch (error) {
      setPosterMessage(
        error.message ||
          "Could not create weekly poster."
      );
    } finally {
      setPosterBusy("");
    }
  }

  /* =====================================================
     GENERATE POSTER #2
  ===================================================== */

  async function generateOverallPoster() {
    if (!selectedWeek) {
      setPosterMessage(
        "Please select a completed Match Week."
      );
      return;
    }

    setPosterBusy("overall");
    setPosterMessage("");

    try {
      const rows =
        await getOverallLeaderboardThroughWeek(
          selectedWeek
        );

      if (rows.length === 0) {
        throw new Error(
          "No overall leaderboard data was found."
        );
      }

      const canvas =
        document.createElement("canvas");

      canvas.width = POSTER_WIDTH;
      canvas.height = POSTER_HEIGHT;

      const ctx =
        canvas.getContext("2d");

      await drawOverallPoster(
        ctx,
        selectedWeek,
        rows
      );

      const blob =
        await canvasToBlob(canvas);

      const url =
        URL.createObjectURL(blob);

      if (overallPosterUrl) {
        URL.revokeObjectURL(
          overallPosterUrl
        );
      }

      setOverallPosterUrl(url);

      setPosterMessage(
        `Overall Poster #2 created after Match Week ${selectedWeek.week_no}.`
      );
    } catch (error) {
      setPosterMessage(
        error.message ||
          "Could not create overall poster."
      );
    } finally {
      setPosterBusy("");
    }
  }

  /* =====================================================
     HEADER
  ===================================================== */

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

  /* =====================================================
     LOADING / ACCESS
  ===================================================== */

  if (loading) {
    return (
      <main>
        <div
          className="container"
          style={{ maxWidth: "920px" }}
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
            <button>
              Back to Predictor
            </button>
          </a>
        </div>
      </main>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <main>
      <div
        className="container adminShell"
        style={{ maxWidth: "920px" }}
      >
        <Header />

        <div className="adminIntro">
          <div className="adminTitle">
            Administrator Dashboard
          </div>

          <div className="adminSubtitle">
            Manage The Predictor competition
          </div>
        </div>

        {/* =================================================
            EXISTING ADMIN TOOLS
        ================================================= */}

        <div className="adminGrid">
          <AdminCard
            href="/admin/results"
            icon="✓"
            title="Enter Results"
            text="Record the actual H / D / A result for each fixture."
            button="Enter Results"
          />

          <AdminCard
            href="/admin/weeks"
            icon="📅"
            title="Manage Match Weeks"
            text="Review match dates, opening times and prediction deadlines."
            button="Manage Match Weeks"
          />

          <AdminCard
            href="/admin/fixtures"
            icon="🏑"
            title="Manage Fixtures"
            text="Review and manage the fixtures included in each Match Week."
            button="Manage Fixtures"
          />

          <AdminCard
            href="/admin/members"
            icon="👥"
            title="Members"
            text="View Predictor members, payment status and account details."
            button="Members"
          />

          <AdminCard
            href="/admin/settings"
            icon="£"
            title="Competition Settings"
            text="Manage the entry fee and prize money for The Predictor."
            button="Competition Settings"
          />
        </div>

        {/* =================================================
            SOCIAL MEDIA POSTERS
        ================================================= */}

        <section className="socialPosterSection">
          <div className="socialTopLine" />

          <div className="socialHeader">
            <div className="socialIconBox">
              ▧
            </div>

            <div>
              <div className="socialEyebrow">
                THE PREDICTOR
              </div>

              <h2>
                Social Media Posters
              </h2>

              <p>
                Create WOW branded 1080 × 1350 social images directly
                from the live leaderboard data.
              </p>
            </div>
          </div>

          <div className="weekSelectorPanel">
            <div>
              <div className="fieldEyebrow">
                SELECT COMPLETED MATCH WEEK
              </div>

              <div className="fieldLabel">
                Poster Match Week
              </div>
            </div>

            <select
              value={selectedWeekId}
              onChange={(event) => {
                setSelectedWeekId(
                  event.target.value
                );

                setPosterMessage("");
              }}
            >
              {completedWeeks.length === 0 ? (
                <option value="">
                  No completed Match Weeks
                </option>
              ) : (
                completedWeeks.map(
                  (week) => (
                    <option
                      key={week.id}
                      value={week.id}
                    >
                      Match Week {week.week_no}
                    </option>
                  )
                )
              )}
            </select>
          </div>

          {posterMessage && (
            <div className="posterMessage">
              {posterMessage}
            </div>
          )}

          <div className="posterGeneratorGrid">
            {/* WEEKLY POSTER */}

            <div className="posterGeneratorCard weekly">
              <div className="generatorTag blue">
                WEEKLY POSTER #1
              </div>

              <div className="generatorIcon">
                🏆
              </div>

              <h3>
                Weekly Results
              </h3>

              <p>
                Match Week winner plus the weekly Top 5.
              </p>

              <button
                type="button"
                className="posterButton weeklyButton"
                onClick={generateWeeklyPoster}
                disabled={
                  posterBusy !== "" ||
                  !selectedWeek
                }
              >
                {posterBusy === "weekly"
                  ? "CREATING POSTER..."
                  : "GENERATE WEEKLY POSTER #1"}
              </button>

              {weeklyPosterUrl && (
                <PosterPreview
                  src={weeklyPosterUrl}
                  alt="Weekly Predictor poster"
                  downloadName={`predictor-match-week-${selectedWeek?.week_no}-weekly.png`}
                />
              )}
            </div>

            {/* OVERALL POSTER */}

            <div className="posterGeneratorCard overall">
              <div className="generatorTag red">
                WEEKLY POSTER #2
              </div>

              <div className="generatorIcon">
                👑
              </div>

              <h3>
                Overall Leaderboard
              </h3>

              <p>
                Overall Top 10 after the selected Match Week.
              </p>

              <button
                type="button"
                className="posterButton overallButton"
                onClick={generateOverallPoster}
                disabled={
                  posterBusy !== "" ||
                  !selectedWeek
                }
              >
                {posterBusy === "overall"
                  ? "CREATING POSTER..."
                  : "GENERATE WEEKLY POSTER #2"}
              </button>

              {overallPosterUrl && (
                <PosterPreview
                  src={overallPosterUrl}
                  alt="Overall Predictor poster"
                  downloadName={`predictor-match-week-${selectedWeek?.week_no}-overall.png`}
                />
              )}
            </div>
          </div>

          <div className="posterTip">
            <span>ⓘ</span>

            <div>
              Posters use your live Predictor data. Make sure all
              Match Week results have been entered before generating
              the images.
            </div>
          </div>
        </section>

        {/* =================================================
            FOOTER BUTTONS
        ================================================= */}

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

      <style jsx global>{`
        .adminShell {
          padding-bottom: 35px;
        }

        .adminIntro {
          margin-bottom: 16px;
          text-align: center;
        }

        .adminTitle {
          color: #ffffff;
          font-size: 18px;
          font-weight: 900;
        }

        .adminSubtitle {
          margin-top: 4px;
          color: #a9bfd5;
          font-size: 12px;
          font-weight: 700;
        }

        .adminGrid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }

        /* =================================================
           SOCIAL POSTER ADMIN
        ================================================= */

        .socialPosterSection {
          position: relative;
          overflow: hidden;
          margin: 8px 0 22px;
          padding: 22px;
          border: 1px solid rgba(80, 140, 200, 0.42);
          border-radius: 16px;
          background:
            radial-gradient(
              circle at 10% 5%,
              rgba(0, 119, 255, 0.13),
              transparent 27%
            ),
            radial-gradient(
              circle at 92% 25%,
              rgba(237, 28, 36, 0.11),
              transparent 28%
            ),
            linear-gradient(
              145deg,
              rgba(8, 31, 59, 0.98),
              rgba(3, 13, 27, 0.98)
            );
          box-shadow:
            0 18px 42px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255,255,255,0.035);
        }

        .socialTopLine {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background:
            linear-gradient(
              90deg,
              #087eff,
              #087eff 38%,
              #ed1c24 68%,
              #ed1c24
            );
        }

        .socialHeader {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
        }

        .socialIconBox {
          display: grid;
          place-items: center;
          flex: 0 0 54px;
          width: 54px;
          height: 54px;
          border: 1px solid rgba(59, 150, 240, 0.48);
          border-radius: 13px;
          background:
            linear-gradient(
              145deg,
              rgba(8, 58, 106, 0.8),
              rgba(5, 24, 47, 0.9)
            );
          color: #ffffff;
          font-size: 27px;
          box-shadow:
            0 0 24px rgba(0, 128, 255, 0.09);
        }

        .socialEyebrow {
          color: #2999ff;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 1.6px;
        }

        .socialHeader h2 {
          margin: 4px 0 4px;
          color: #ffffff;
          font-size: 24px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.5px;
        }

        .socialHeader p {
          margin: 0;
          color: #9fb4c8;
          font-size: 12px;
          line-height: 1.45;
          font-weight: 700;
        }

        .weekSelectorPanel {
          display: grid;
          grid-template-columns: 1fr minmax(220px, 330px);
          align-items: center;
          gap: 18px;
          margin-bottom: 17px;
          padding: 14px;
          border: 1px solid rgba(62, 130, 196, 0.35);
          border-radius: 11px;
          background: rgba(3, 19, 38, 0.65);
        }

        .fieldEyebrow {
          color: #339dff;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: 1.2px;
        }

        .fieldLabel {
          margin-top: 3px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 900;
        }

        .weekSelectorPanel select {
          width: 100%;
          min-height: 44px;
          padding: 0 12px;
          border: 1px solid rgba(73, 149, 222, 0.52);
          border-radius: 9px;
          outline: none;
          background: #071a31;
          color: #ffffff;
          font-size: 13px;
          font-weight: 850;
        }

        .posterMessage {
          margin-bottom: 14px;
          padding: 11px 13px;
          border: 1px solid rgba(69, 149, 225, 0.38);
          border-radius: 9px;
          background: rgba(5, 52, 92, 0.42);
          color: #b9dbf8;
          text-align: center;
          font-size: 12px;
          font-weight: 800;
        }

        .posterGeneratorGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .posterGeneratorCard {
          position: relative;
          overflow: hidden;
          padding: 18px;
          border-radius: 14px;
          text-align: center;
          background:
            linear-gradient(
              155deg,
              rgba(9, 29, 55, 0.98),
              rgba(2, 13, 27, 0.98)
            );
        }

        .posterGeneratorCard.weekly {
          border: 1px solid rgba(35, 133, 239, 0.72);
          box-shadow:
            inset 0 0 30px rgba(0, 116, 255, 0.045),
            0 0 22px rgba(0, 116, 255, 0.07);
        }

        .posterGeneratorCard.overall {
          border: 1px solid rgba(237, 45, 53, 0.68);
          box-shadow:
            inset 0 0 30px rgba(237, 28, 36, 0.04),
            0 0 22px rgba(237, 28, 36, 0.065);
        }

        .generatorTag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 28px;
          padding: 0 13px;
          border-radius: 7px;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 1px;
        }

        .generatorTag.blue {
          border: 1px solid #168cff;
          color: #5ab0ff;
          background: rgba(5, 73, 136, 0.25);
        }

        .generatorTag.red {
          border: 1px solid #ed1c24;
          color: #ff5d64;
          background: rgba(126, 16, 23, 0.24);
        }

        .generatorIcon {
          margin: 14px 0 7px;
          font-size: 32px;
        }

        .posterGeneratorCard h3 {
          margin: 0;
          color: #ffffff;
          font-size: 21px;
          font-weight: 950;
          letter-spacing: -0.4px;
        }

        .posterGeneratorCard p {
          min-height: 36px;
          margin: 6px 0 14px;
          color: #a3b7ca;
          font-size: 11px;
          line-height: 1.45;
          font-weight: 700;
        }

        .posterButton {
          width: 100%;
          min-height: 46px;
          border: none;
          border-radius: 9px;
          color: #ffffff;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.4px;
          cursor: pointer;
        }

        .posterButton:disabled {
          cursor: default;
          opacity: 0.48;
        }

        .weeklyButton {
          background:
            linear-gradient(
              105deg,
              #087eff,
              #2c65e9,
              #135dc3
            );
          box-shadow:
            0 3px 0 #0756a7,
            0 6px 15px rgba(0, 80, 180, 0.25);
        }

        .overallButton {
          background:
            linear-gradient(
              105deg,
              #c40e19,
              #ed1c24,
              #ff3140
            );
          box-shadow:
            0 3px 0 #8d0911,
            0 6px 15px rgba(160, 0, 15, 0.24);
        }

        .posterPreviewWrap {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid rgba(112, 151, 188, 0.2);
        }

        .posterPreview {
          display: block;
          width: 100%;
          border: 1px solid rgba(117, 161, 202, 0.33);
          border-radius: 9px;
          background: #000000;
          box-shadow: 0 10px 24px rgba(0,0,0,0.27);
        }

        .downloadPoster {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 42px;
          margin-top: 9px;
          border: 1px solid rgba(105, 170, 231, 0.44);
          border-radius: 8px;
          background: rgba(8, 40, 73, 0.8);
          color: #ffffff;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.6px;
        }

        .posterTip {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
          padding: 11px 13px;
          border: 1px solid rgba(59, 124, 188, 0.33);
          border-radius: 9px;
          background: rgba(2, 16, 32, 0.67);
          color: #8fa8bf;
          font-size: 10px;
          line-height: 1.45;
          font-weight: 700;
        }

        .posterTip span {
          color: #4aaaff;
          font-size: 19px;
        }

        @media (max-width: 700px) {
          .posterGeneratorGrid {
            grid-template-columns: 1fr;
          }

          .weekSelectorPanel {
            grid-template-columns: 1fr;
            gap: 9px;
          }

          .socialPosterSection {
            padding: 15px 12px;
          }

          .socialHeader h2 {
            font-size: 21px;
          }

          .socialIconBox {
            flex-basis: 44px;
            width: 44px;
            height: 44px;
            font-size: 22px;
          }
        }
      `}</style>
    </main>
  );
}

/* =====================================================
   ADMIN CARD
===================================================== */

function AdminCard({
  href,
  icon,
  title,
  text,
  button,
}) {
  return (
    <a
      href={href}
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
          {icon}
        </div>

        <h2>{title}</h2>

        <p>{text}</p>

        <button>{button}</button>
      </div>
    </a>
  );
}

/* =====================================================
   POSTER PREVIEW
===================================================== */

function PosterPreview({
  src,
  alt,
  downloadName,
}) {
  return (
    <div className="posterPreviewWrap">
      <img
        src={src}
        alt={alt}
        className="posterPreview"
      />

      <a
        href={src}
        download={downloadName}
        className="downloadPoster"
      >
        DOWNLOAD 1080 × 1350 PNG
      </a>
    </div>
  );
}

/* =====================================================
   RANKING
===================================================== */

function rankRows(rows) {
  let previousPoints = null;
  let previousPosition = 0;

  return rows.map(
    (row, index) => {
      let position;

      if (
        row.points ===
        previousPoints
      ) {
        position =
          previousPosition;
      } else {
        position =
          index + 1;
      }

      previousPoints =
        row.points;

      previousPosition =
        position;

      return {
        ...row,
        position,
      };
    }
  );
}

/* =====================================================
   CANVAS HELPERS
===================================================== */

function canvasToBlob(canvas) {
  return new Promise(
    (resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(
              new Error(
                "Could not create PNG image."
              )
            );
          }
        },
        "image/png",
        1
      );
    }
  );
}

function roundedRect(
  ctx,
  x,
  y,
  width,
  height,
  radius
) {
  const r = Math.min(
    radius,
    width / 2,
    height / 2
  );

  ctx.beginPath();

  ctx.moveTo(x + r, y);

  ctx.arcTo(
    x + width,
    y,
    x + width,
    y + height,
    r
  );

  ctx.arcTo(
    x + width,
    y + height,
    x,
    y + height,
    r
  );

  ctx.arcTo(
    x,
    y + height,
    x,
    y,
    r
  );

  ctx.arcTo(
    x,
    y,
    x + width,
    y,
    r
  );

  ctx.closePath();
}

function fillRoundedRect(
  ctx,
  x,
  y,
  width,
  height,
  radius,
  fillStyle
) {
  roundedRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
  );

  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function strokeRoundedRect(
  ctx,
  x,
  y,
  width,
  height,
  radius,
  strokeStyle,
  lineWidth = 2
) {
  roundedRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
  );

  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function fitFont(
  ctx,
  text,
  maxWidth,
  startSize,
  minSize,
  fontFamily = "Arial Black"
) {
  let size = startSize;

  while (size > minSize) {
    ctx.font =
      `900 ${size}px ${fontFamily}, Arial, sans-serif`;

    if (
      ctx.measureText(text).width <=
      maxWidth
    ) {
      break;
    }

    size -= 2;
  }

  return size;
}

function drawCenteredText(
  ctx,
  text,
  x,
  y,
  maxWidth,
  startSize,
  minSize,
  colour,
  fontFamily = "Impact"
) {
  const size = fitFont(
    ctx,
    text,
    maxWidth,
    startSize,
    minSize,
    fontFamily
  );

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = colour;

  ctx.font =
    `900 ${size}px ${fontFamily}, Arial Black, Arial, sans-serif`;

  ctx.fillText(
    text,
    x,
    y
  );
}

function drawLeftText(
  ctx,
  text,
  x,
  y,
  maxWidth,
  startSize,
  minSize,
  colour,
  fontFamily = "Arial Black"
) {
  const size = fitFont(
    ctx,
    text,
    maxWidth,
    startSize,
    minSize,
    fontFamily
  );

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = colour;

  ctx.font =
    `900 ${size}px ${fontFamily}, Arial, sans-serif`;

  ctx.fillText(
    text,
    x,
    y
  );
}

function drawPosterBackground(ctx) {
  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      POSTER_WIDTH,
      POSTER_HEIGHT
    );

  gradient.addColorStop(
    0,
    "#020812"
  );

  gradient.addColorStop(
    0.36,
    "#04152a"
  );

  gradient.addColorStop(
    0.68,
    "#030814"
  );

  gradient.addColorStop(
    1,
    "#16050b"
  );

  ctx.fillStyle = gradient;

  ctx.fillRect(
    0,
    0,
    POSTER_WIDTH,
    POSTER_HEIGHT
  );

  /* BLUE GLOW */

  const blueGlow =
    ctx.createRadialGradient(
      100,
      390,
      0,
      100,
      390,
      490
    );

  blueGlow.addColorStop(
    0,
    "rgba(0,120,255,0.24)"
  );

  blueGlow.addColorStop(
    1,
    "rgba(0,120,255,0)"
  );

  ctx.fillStyle = blueGlow;

  ctx.fillRect(
    0,
    0,
    POSTER_WIDTH,
    POSTER_HEIGHT
  );

  /* RED GLOW */

  const redGlow =
    ctx.createRadialGradient(
      980,
      500,
      0,
      980,
      500,
      500
    );

  redGlow.addColorStop(
    0,
    "rgba(237,28,36,0.20)"
  );

  redGlow.addColorStop(
    1,
    "rgba(237,28,36,0)"
  );

  ctx.fillStyle = redGlow;

  ctx.fillRect(
    0,
    0,
    POSTER_WIDTH,
    POSTER_HEIGHT
  );

  /* STREAKS */

  ctx.save();

  ctx.lineCap = "round";

  for (let i = 0; i < 18; i += 1) {
    const y =
      75 + i * 66;

    ctx.beginPath();

    ctx.moveTo(
      -80,
      y
    );

    ctx.lineTo(
      360,
      y - 90
    );

    ctx.strokeStyle =
      i % 2 === 0
        ? "rgba(18,125,255,0.18)"
        : "rgba(255,255,255,0.035)";

    ctx.lineWidth =
      i % 3 === 0 ? 4 : 2;

    ctx.stroke();
  }

  for (let i = 0; i < 17; i += 1) {
    const y =
      160 + i * 65;

    ctx.beginPath();

    ctx.moveTo(
      760,
      y
    );

    ctx.lineTo(
      1160,
      y - 105
    );

    ctx.strokeStyle =
      i % 2 === 0
        ? "rgba(237,28,36,0.17)"
        : "rgba(255,255,255,0.03)";

    ctx.lineWidth =
      i % 3 === 0 ? 4 : 2;

    ctx.stroke();
  }

  ctx.restore();

  /* STARS */

  ctx.save();

  for (
    let i = 0;
    i < 115;
    i += 1
  ) {
    const x =
      pseudoRandom(i * 1.73) *
      POSTER_WIDTH;

    const y =
      pseudoRandom(i * 4.81) *
      POSTER_HEIGHT;

    const alpha =
      0.12 +
      pseudoRandom(i * 7.14) *
        0.48;

    const radius =
      pseudoRandom(i * 9.41) *
        1.8 +
      0.35;

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      radius,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      `rgba(255,255,255,${alpha})`;

    ctx.fill();
  }

  ctx.restore();
}

function pseudoRandom(seed) {
  const value =
    Math.sin(seed * 999.91) *
    43758.5453;

  return (
    value -
    Math.floor(value)
  );
}

async function loadBadge() {
  return new Promise(
    (resolve) => {
      const image =
        new Image();

      image.onload = () =>
        resolve(image);

      image.onerror = () =>
        resolve(null);

      image.src =
        "/TWHC-badge-white.png";
    }
  );
}

async function drawPosterBrand(ctx) {
  const badge =
    await loadBadge();

  if (badge) {
    ctx.save();

    ctx.shadowColor =
      "rgba(0,116,255,0.55)";

    ctx.shadowBlur = 24;

    ctx.drawImage(
      badge,
      72,
      48,
      142,
      142
    );

    ctx.restore();
  }

  drawCenteredText(
    ctx,
    "THE PREDICTOR",
    620,
    125,
    720,
    90,
    58,
    "#f4f5f6",
    "Impact"
  );

  ctx.save();

  const lineGradient =
    ctx.createLinearGradient(
      285,
      0,
      910,
      0
    );

  lineGradient.addColorStop(
    0,
    "#087eff"
  );

  lineGradient.addColorStop(
    0.58,
    "#ffffff"
  );

  lineGradient.addColorStop(
    1,
    "#ed1c24"
  );

  ctx.fillStyle =
    lineGradient;

  ctx.fillRect(
    290,
    145,
    630,
    5
  );

  ctx.restore();

  ctx.textAlign = "center";

  ctx.font =
    "900 28px Arial Black, Arial, sans-serif";

  ctx.fillStyle = "#ffffff";

  ctx.fillText(
    "PREDICT THE RESULT. COMPETE.",
    575,
    184
  );

  ctx.fillStyle = "#ff2733";

  ctx.fillText(
    "WIN.",
    858,
    184
  );
}

function drawMedal(
  ctx,
  position,
  x,
  y,
  radius
) {
  const colours =
    position === 1
      ? ["#ffd335", "#9b6100"]
      : position === 2
      ? ["#d9e6f0", "#617282"]
      : position === 3
      ? ["#d99057", "#713819"]
      : ["#123c66", "#06192d"];

  const gradient =
    ctx.createLinearGradient(
      x - radius,
      y - radius,
      x + radius,
      y + radius
    );

  gradient.addColorStop(
    0,
    colours[0]
  );

  gradient.addColorStop(
    1,
    colours[1]
  );

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    radius,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    gradient;

  ctx.fill();

  ctx.lineWidth = 2;

  ctx.strokeStyle =
    position <= 3
      ? "rgba(255,255,255,0.65)"
      : "rgba(61,157,244,0.6)";

  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    `900 ${Math.round(
      radius * 0.82
    )}px Arial Black, Arial, sans-serif`;

  ctx.fillText(
    String(position),
    x,
    y + 1
  );

  ctx.textBaseline =
    "alphabetic";
}

/* =====================================================
   WEEKLY POSTER
===================================================== */

async function drawWeeklyPoster(
  ctx,
  week,
  rows,
  winners
) {
  drawPosterBackground(ctx);

  await drawPosterBrand(ctx);

  /* WEEK BANNER */

  fillRoundedRect(
    ctx,
    335,
    216,
    410,
    64,
    14,
    "#0759b6"
  );

  strokeRoundedRect(
    ctx,
    335,
    216,
    410,
    64,
    14,
    "#2c9cff",
    2
  );

  drawCenteredText(
    ctx,
    `MATCH WEEK ${week.week_no}`,
    540,
    261,
    360,
    37,
    26,
    "#ffffff",
    "Impact"
  );

  const joint =
    winners.length > 1;

  drawCenteredText(
    ctx,
    joint
      ? "JOINT WEEKLY WINNERS!"
      : "WEEKLY WINNER!",
    540,
    362,
    900,
    70,
    46,
    "#f4f5f6",
    "Impact"
  );

  /* HERO WINNER */

  const heroGradient =
    ctx.createLinearGradient(
      90,
      0,
      990,
      0
    );

  heroGradient.addColorStop(
    0,
    "rgba(91,55,0,0.76)"
  );

  heroGradient.addColorStop(
    0.55,
    "rgba(23,24,18,0.92)"
  );

  heroGradient.addColorStop(
    1,
    "rgba(10,14,21,0.92)"
  );

  fillRoundedRect(
    ctx,
    86,
    400,
    908,
    250,
    26,
    heroGradient
  );

  strokeRoundedRect(
    ctx,
    86,
    400,
    908,
    250,
    26,
    "#eeb619",
    3
  );

  /* TROPHY */

  ctx.save();

  ctx.shadowColor =
    "#ffc320";

  ctx.shadowBlur = 28;

  ctx.font =
    "116px Arial";

  ctx.textAlign = "center";

  ctx.fillText(
    "🏆",
    218,
    555
  );

  ctx.restore();

  const winnerText =
    winners
      .slice(0, 2)
      .map(
        (winner) =>
          winner.teamName
      )
      .join(" / ");

  drawCenteredText(
    ctx,
    winnerText.toUpperCase(),
    655,
    485,
    590,
    62,
    36,
    "#ffd14e",
    "Impact"
  );

  const playerText =
    winners
      .slice(0, 2)
      .map(
        (winner) =>
          `${winner.firstName} ${winner.surname}`.trim()
      )
      .join(" / ");

  drawCenteredText(
    ctx,
    playerText,
    655,
    538,
    560,
    31,
    22,
    "#ffffff",
    "Arial Black"
  );

  fillRoundedRect(
    ctx,
    476,
    568,
    360,
    60,
    12,
    "rgba(2,15,30,0.86)"
  );

  strokeRoundedRect(
    ctx,
    476,
    568,
    360,
    60,
    12,
    "#eeb619",
    2
  );

  drawCenteredText(
    ctx,
    `${rows[0].points} POINT${
      rows[0].points === 1
        ? ""
        : "S"
    }`,
    656,
    612,
    320,
    34,
    25,
    "#ffffff",
    "Impact"
  );

  /* TOP 5 */

  drawCenteredText(
    ctx,
    "WEEKLY TOP 5",
    540,
    710,
    520,
    45,
    32,
    "#f5f6f8",
    "Impact"
  );

  drawLeaderboardTable(
    ctx,
    rows.slice(0, 5),
    {
      x: 80,
      y: 745,
      width: 920,
      rowHeight: 84,
      showPlayer: true,
    }
  );

  drawCenteredText(
    ctx,
    "GREAT PREDICTIONS THIS WEEK!",
    540,
    1225,
    820,
    39,
    28,
    "#168eff",
    "Impact"
  );

  drawCenteredText(
    ctx,
    "WELL DONE EVERYONE.",
    540,
    1272,
    780,
    35,
    26,
    "#ffffff",
    "Impact"
  );

  drawPosterFooter(ctx);
}

/* =====================================================
   OVERALL POSTER
===================================================== */

async function drawOverallPoster(
  ctx,
  week,
  rows
) {
  drawPosterBackground(ctx);

  await drawPosterBrand(ctx);

  drawCenteredText(
    ctx,
    "OVERALL LEADERBOARD",
    540,
    316,
    930,
    68,
    44,
    "#f4f5f6",
    "Impact"
  );

  fillRoundedRect(
    ctx,
    355,
    345,
    370,
    52,
    11,
    "#a80e18"
  );

  strokeRoundedRect(
    ctx,
    355,
    345,
    370,
    52,
    11,
    "#f02b35",
    2
  );

  drawCenteredText(
    ctx,
    `AFTER MATCH WEEK ${week.week_no}`,
    540,
    382,
    330,
    29,
    22,
    "#ffffff",
    "Impact"
  );

  /* LEADER HERO */

  const leader =
    rows[0];

  const heroGradient =
    ctx.createLinearGradient(
      70,
      0,
      1010,
      0
    );

  heroGradient.addColorStop(
    0,
    "rgba(112,69,0,0.64)"
  );

  heroGradient.addColorStop(
    0.52,
    "rgba(23,24,18,0.86)"
  );

  heroGradient.addColorStop(
    1,
    "rgba(8,16,28,0.90)"
  );

  fillRoundedRect(
    ctx,
    74,
    430,
    932,
    158,
    22,
    heroGradient
  );

  strokeRoundedRect(
    ctx,
    74,
    430,
    932,
    158,
    22,
    "#eeb619",
    2
  );

  ctx.font =
    "74px Arial";

  ctx.textAlign =
    "center";

  ctx.fillText(
    "🏆",
    155,
    536
  );

  drawLeftText(
    ctx,
    leader.teamName.toUpperCase(),
    225,
    493,
    570,
    47,
    29,
    "#ffd144",
    "Impact"
  );

  drawLeftText(
    ctx,
    `${leader.firstName} ${leader.surname}`.trim(),
    225,
    540,
    500,
    27,
    20,
    "#ffffff",
    "Arial Black"
  );

  drawCenteredText(
    ctx,
    String(
      leader.points
    ),
    894,
    507,
    135,
    58,
    40,
    "#ffd144",
    "Impact"
  );

  drawCenteredText(
    ctx,
    leader.points === 1
      ? "POINT"
      : "POINTS",
    894,
    545,
    140,
    18,
    14,
    "#c8a746",
    "Arial Black"
  );

  /* TOP 10 TABLE */

  drawLeaderboardTable(
    ctx,
    rows.slice(0, 10),
    {
      x: 70,
      y: 630,
      width: 940,
      rowHeight: 56,
      showPlayer: true,
      compact: true,
    }
  );

  drawCenteredText(
    ctx,
    "KEEP UP THE GREAT PREDICTIONS!",
    540,
    1230,
    870,
    37,
    27,
    "#ed2732",
    "Impact"
  );

  drawCenteredText(
    ctx,
    "EVERY POINT COUNTS.",
    540,
    1272,
    720,
    33,
    25,
    "#ffffff",
    "Impact"
  );

  drawPosterFooter(ctx);
}

/* =====================================================
   LEADERBOARD TABLE
===================================================== */

function drawLeaderboardTable(
  ctx,
  rows,
  options
) {
  const {
    x,
    y,
    width,
    rowHeight,
    compact = false,
  } = options;

  const tableHeight =
    rows.length * rowHeight + 48;

  fillRoundedRect(
    ctx,
    x,
    y,
    width,
    tableHeight,
    16,
    "rgba(2,14,29,0.88)"
  );

  strokeRoundedRect(
    ctx,
    x,
    y,
    width,
    tableHeight,
    16,
    "rgba(80,145,207,0.58)",
    2
  );

  /* HEAD */

  ctx.fillStyle =
    "rgba(10,45,79,0.86)";

  roundedRect(
    ctx,
    x,
    y,
    width,
    48,
    16
  );

  ctx.fill();

  ctx.fillStyle =
    "#88a6c2";

  ctx.font =
    "900 15px Arial Black, Arial, sans-serif";

  ctx.textBaseline =
    "middle";

  ctx.textAlign =
    "center";

  ctx.fillText(
    "POS",
    x + 55,
    y + 24
  );

  ctx.textAlign =
    "left";

  ctx.fillText(
    "TEAM",
    x + 108,
    y + 24
  );

  ctx.fillText(
    "PLAYER",
    x +
      width -
      (compact ? 355 : 390),
    y + 24
  );

  ctx.textAlign =
    "right";

  ctx.fillText(
    "POINTS",
    x + width - 28,
    y + 24
  );

  rows.forEach(
    (row, index) => {
      const top =
        y +
        48 +
        index * rowHeight;

      if (index % 2 === 0) {
        ctx.fillStyle =
          "rgba(255,255,255,0.025)";

        ctx.fillRect(
          x + 1,
          top,
          width - 2,
          rowHeight
        );
      }

      if (row.position === 1) {
        ctx.fillStyle =
          "rgba(255,187,0,0.08)";

        ctx.fillRect(
          x + 1,
          top,
          width - 2,
          rowHeight
        );
      }

      ctx.strokeStyle =
        "rgba(105,145,181,0.19)";

      ctx.lineWidth = 1;

      ctx.beginPath();

      ctx.moveTo(
        x + 12,
        top + rowHeight
      );

      ctx.lineTo(
        x + width - 12,
        top + rowHeight
      );

      ctx.stroke();

      drawMedal(
        ctx,
        row.position,
        x + 55,
        top + rowHeight / 2,
        compact ? 18 : 22
      );

      const teamSize =
        fitFont(
          ctx,
          row.teamName.toUpperCase(),
          compact ? 335 : 350,
          compact ? 25 : 28,
          17,
          "Impact"
        );

      ctx.textAlign =
        "left";

      ctx.textBaseline =
        "middle";

      ctx.font =
        `900 ${teamSize}px Impact, Arial Black, Arial`;

      ctx.fillStyle =
        row.position === 1
          ? "#ffd143"
          : "#ffffff";

      ctx.fillText(
        row.teamName.toUpperCase(),
        x + 108,
        top +
          rowHeight / 2
      );

      const player =
        `${row.firstName} ${row.surname}`.trim();

      const playerSize =
        fitFont(
          ctx,
          player,
          compact ? 245 : 280,
          compact ? 18 : 20,
          13,
          "Arial"
        );

      ctx.font =
        `700 ${playerSize}px Arial, sans-serif`;

      ctx.fillStyle =
        "#b5c5d4";

      ctx.fillText(
        player,
        x +
          width -
          (compact ? 355 : 390),
        top +
          rowHeight / 2
      );

      ctx.textAlign =
        "right";

      ctx.font =
        `900 ${
          compact ? 29 : 34
        }px Impact, Arial Black, Arial`;

      ctx.fillStyle =
        row.position === 1
          ? "#ffd143"
          : "#ffffff";

      ctx.fillText(
        String(row.points),
        x + width - 28,
        top +
          rowHeight / 2
      );
    }
  );

  ctx.textBaseline =
    "alphabetic";
}

/* =====================================================
   FOOTER
===================================================== */

function drawPosterFooter(ctx) {
  ctx.save();

  ctx.textAlign =
    "center";

  ctx.fillStyle =
    "rgba(255,255,255,0.62)";

  ctx.font =
    "700 18px Arial, sans-serif";

  ctx.fillText(
    "www.hockeypredictor.uk",
    540,
    1322
  );

  ctx.restore();
}

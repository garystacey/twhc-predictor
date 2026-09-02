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
  }, [router]);

  /* =====================================================
     CLEAN UP GENERATED IMAGE URLS
  ===================================================== */

  useEffect(() => {
    return () => {
      if (weeklyPosterUrl) {
        URL.revokeObjectURL(weeklyPosterUrl);
      }
    };
  }, [weeklyPosterUrl]);

  useEffect(() => {
    return () => {
      if (overallPosterUrl) {
        URL.revokeObjectURL(overallPosterUrl);
      }
    };
  }, [overallPosterUrl]);

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

    /*
      Cancelled fixtures are ignored.

      Any other fixture without a result is considered
      outstanding / provisional.
    */

    const outstandingFixtures = fixtureRows.filter(
      (fixture) =>
        fixture.status !== "cancelled" &&
        !fixture.result
    );

    const outstandingCount = outstandingFixtures.length;

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

    const resultByFixture = {};
    const statusByFixture = {};

    fixtureRows.forEach((fixture) => {
      resultByFixture[fixture.id] = fixture.result;
      statusByFixture[fixture.id] = fixture.status;
    });

    const pointsByUser = {};

    predictions.forEach((prediction) => {
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
        teamName: profile.team_name || "Unnamed Team",
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

    return {
      rows: rankRows(rows),
      outstandingCount,
    };
  }

  /* =====================================================
     OVERALL LEADERBOARD THROUGH SELECTED WEEK
  ===================================================== */

  async function getOverallLeaderboardThroughWeek(week) {
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
      resultByFixture[fixture.id] = fixture.result;
      statusByFixture[fixture.id] = fixture.status;
    });

    const pointsByUser = {};

    predictions.forEach((prediction) => {
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
        teamName: profile.team_name || "Unnamed Team",
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

    return rankRows(rows);
  }

  /* =====================================================
     GENERATE WEEKLY POSTER
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
      const weeklyData =
        await getWeeklyLeaderboard(
          selectedWeek.id
        );

      const weeklyRows = weeklyData.rows;

      if (weeklyRows.length === 0) {
        throw new Error(
          "No weekly leaderboard data was found."
        );
      }

      const topScore = weeklyRows[0].points;

      const leaders = weeklyRows.filter(
        (row) => row.points === topScore
      );

      const canvas =
        document.createElement("canvas");

      canvas.width = POSTER_WIDTH;
      canvas.height = POSTER_HEIGHT;

      const ctx = canvas.getContext("2d");

      await drawWeeklyPoster(
        ctx,
        selectedWeek,
        weeklyRows,
        leaders,
        weeklyData.outstandingCount
      );

      const blob =
        await canvasToBlob(canvas);

      const url =
        URL.createObjectURL(blob);

      setWeeklyPosterUrl(url);

      if (weeklyData.outstandingCount > 0) {
        setPosterMessage(
          `Provisional Weekly Poster created for Match Week ${selectedWeek.week_no}. ${weeklyData.outstandingCount} result${weeklyData.outstandingCount === 1 ? "" : "s"} still to be submitted.`
        );
      } else {
        setPosterMessage(
          `Final Weekly Poster created for Match Week ${selectedWeek.week_no}.`
        );
      }
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
     GENERATE OVERALL POSTER
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

      const ctx = canvas.getContext("2d");

      await drawOverallPoster(
        ctx,
        selectedWeek,
        rows
      );

      const blob =
        await canvasToBlob(canvas);

      const url =
        URL.createObjectURL(blob);

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
      <div className="adminBrandHeader">
        <div className="adminBrandGlow adminBrandGlowBlue" />
        <div className="adminBrandGlow adminBrandGlowRed" />

        <img
          src="/TWHC-badge-white.png"
          alt="Telford & Wrekin Hockey Club"
          className="adminBrandBadge"
        />

        <div className="adminBrandCopy">
          <div className="adminBrandTitle">
            THE PREDICTO<span>R</span>
          </div>

          <div className="adminBrandLabel">
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

  return (
    <main>
      <div
        className="container adminShell"
        style={{ maxWidth: "920px" }}
      >
        <Header />

        <section className="adminHero">
          <div className="adminHeroTopLine" />

          <div className="adminHeroEyebrow">
            THE PREDICTOR CONTROL CENTRE
          </div>

          <div className="adminHeroTitle">
            Administrator Dashboard
          </div>

          <div className="adminHeroSubtitle">
            Manage the competition from one place
          </div>

          <div className="adminHeroRule">
            <span className="blueRule" />
            <span className="centreDot" />
            <span className="redRule" />
          </div>
        </section>

        <div className="adminSectionHeading">
          <div>
            <div className="adminSectionEyebrow">
              COMPETITION CONTROL
            </div>
            <h2>Admin Tools</h2>
          </div>

          <div className="adminSectionPill">
            LIVE CONTROL
          </div>
        </div>

        <div className="adminGrid">
          <AdminCard
            href="/admin/results"
            icon="✓"
            title="Enter Results"
            text="Record the actual H / D / A result for each fixture."
            button="Enter Results"
            tone="blue"
          />

          <AdminCard
            href="/admin/weeks"
            icon="📅"
            title="Manage Match Weeks"
            text="Review match dates, opening times and prediction deadlines."
            button="Manage Match Weeks"
            tone="red"
          />

          <AdminCard
            href="/admin/fixtures"
            icon="🏑"
            title="Manage Fixtures"
            text="Review and manage the fixtures included in each Match Week."
            button="Manage Fixtures"
            tone="blue"
          />

          <AdminCard
            href="/admin/members"
            icon="👥"
            title="Members"
            text="View Predictor members, payment status and account details."
            button="Members"
            tone="red"
          />

          <AdminCard
            href="/admin/settings"
            icon="£"
            title="Competition Settings"
            text="Manage the entry fee and prize money for The Predictor."
            button="Competition Settings"
            tone="blue"
          />
        </div>

        <section className="socialPosterSection">
          <div className="socialTopLine" />
          <div className="socialSideGlow socialSideGlowBlue" />
          <div className="socialSideGlow socialSideGlowRed" />

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
                SELECT MATCH WEEK
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
                Weekly leader or winner plus the weekly Top 5.
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
              Posters use your live Predictor data. If results are
              outstanding, the weekly poster will automatically be
              marked as provisional.
            </div>
          </div>
        </section>

        <div className="adminFooterActions">
          <a
            href="/predictor"
            className="adminFooterLink"
          >
            <button className="backPredictorButton">
              ← Back to Predictor
            </button>
          </a>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="signOutButton"
          >
            {signingOut
              ? "Signing Out..."
              : "Sign Out"}
          </button>
        </div>

        <p className="footer">
          Telford & Wrekin Hockey Club
        </p>
      </div>

      <style jsx global>{`
        .adminShell {
          padding-bottom: 34px;
        }

        .adminBrandHeader {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: fit-content;
          max-width: 100%;
          margin: 0 auto 14px;
          padding: 7px 14px;
        }

        .adminBrandGlow {
          position: absolute;
          top: 50%;
          width: 78px;
          height: 44px;
          border-radius: 50%;
          filter: blur(23px);
          opacity: .33;
          pointer-events: none;
        }

        .adminBrandGlowBlue {
          left: -16px;
          background: #087eff;
        }

        .adminBrandGlowRed {
          right: -20px;
          background: #ed1c24;
        }

        .adminBrandBadge {
          position: relative;
          z-index: 1;
          display: block;
          width: 60px;
          height: auto;
          margin: 0;
          filter:
            drop-shadow(0 0 10px rgba(0,125,255,.24))
            drop-shadow(0 4px 8px rgba(0,0,0,.42));
        }

        .adminBrandCopy {
          position: relative;
          z-index: 1;
          text-align: left;
        }

        .adminBrandTitle {
          color: #ffffff;
          font-size: 28px;
          line-height: .95;
          font-weight: 950;
          letter-spacing: -1.3px;
          white-space: nowrap;
          text-shadow:
            0 2px 8px rgba(0,0,0,.45),
            0 0 12px rgba(255,255,255,.08);
        }

        .adminBrandTitle span {
          color: #ed1c24;
          text-shadow:
            0 0 14px rgba(237,28,36,.46);
        }

        .adminBrandLabel {
          margin-top: 6px;
          color: #a9bfd5;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 2px;
        }

        .adminHero {
          position: relative;
          overflow: hidden;
          margin-bottom: 18px;
          padding: 18px 18px 16px;
          border: 1px solid rgba(72,145,215,.34);
          border-radius: 15px;
          text-align: center;
          background:
            radial-gradient(
              circle at 4% 10%,
              rgba(0,121,255,.18),
              transparent 33%
            ),
            radial-gradient(
              circle at 96% 82%,
              rgba(237,28,36,.15),
              transparent 34%
            ),
            linear-gradient(
              145deg,
              rgba(8,30,56,.97),
              rgba(3,12,25,.99)
            );
          box-shadow:
            -7px 0 24px rgba(0,105,255,.08),
            7px 0 24px rgba(237,28,36,.07),
            0 15px 34px rgba(0,0,0,.3),
            inset 0 1px 0 rgba(255,255,255,.035);
        }

        .adminHeroTopLine {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background:
            linear-gradient(
              90deg,
              #087eff 0 42%,
              #d7e8f8 50%,
              #ed1c24 58% 100%
            );
          box-shadow:
            0 0 12px rgba(34,137,255,.25);
        }

        .adminHeroEyebrow,
        .adminSectionEyebrow {
          color: #2999ff;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 1.7px;
        }

        .adminHeroTitle {
          margin-top: 4px;
          color: #ffffff;
          font-size: 23px;
          line-height: 1.05;
          font-weight: 950;
          letter-spacing: -.55px;
          text-shadow:
            0 3px 10px rgba(0,0,0,.34);
        }

        .adminHeroSubtitle {
          margin-top: 5px;
          color: #9eb6cd;
          font-size: 12px;
          font-weight: 750;
        }

        .adminHeroRule {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          width: min(330px, 80%);
          margin: 12px auto 0;
        }

        .adminHeroRule .blueRule,
        .adminHeroRule .redRule {
          height: 2px;
          flex: 1;
        }
                .adminHeroRule .blueRule {
          background:
            linear-gradient(
              90deg,
              transparent,
              #168cff
            );
          box-shadow: 0 0 8px rgba(22,140,255,.5);
        }

        .adminHeroRule .redRule {
          background:
            linear-gradient(
              90deg,
              #ed1c24,
              transparent
            );
          box-shadow: 0 0 8px rgba(237,28,36,.45);
        }

        .centreDot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 8px rgba(255,255,255,.65);
        }

        .adminSectionHeading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin: 0 2px 11px;
        }

        .adminSectionHeading h2 {
          margin: 2px 0 0;
          color: #ffffff;
          font-size: 20px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -.4px;
        }

        .adminSectionPill {
          display: inline-flex;
          align-items: center;
          min-height: 25px;
          padding: 0 9px;
          border: 1px solid rgba(31,143,255,.5);
          border-radius: 999px;
          background: rgba(7,71,130,.22);
          color: #5db2ff;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .adminGrid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .adminToolLink {
          display: block;
          min-width: 0;
          color: inherit;
          text-decoration: none;
        }

        .adminToolCard {
          position: relative;
          overflow: hidden;
          height: 100%;
          min-height: 192px;
          padding: 17px 16px 15px;
          border-radius: 14px;
          background:
            radial-gradient(
              circle at 4% 0%,
              rgba(0,123,255,.11),
              transparent 36%
            ),
            radial-gradient(
              circle at 100% 100%,
              rgba(237,28,36,.08),
              transparent 34%
            ),
            linear-gradient(
              150deg,
              rgba(8,29,54,.98),
              rgba(3,13,27,.99)
            );
          box-shadow:
            0 13px 27px rgba(0,0,0,.28),
            inset 0 1px 0 rgba(255,255,255,.035);
          transition:
            transform .18s ease,
            border-color .18s ease,
            box-shadow .18s ease;
        }

        .adminToolCard.blue {
          border: 1px solid rgba(38,139,239,.48);
        }

        .adminToolCard.red {
          border: 1px solid rgba(237,45,53,.42);
        }

        .adminToolCard:hover {
          transform: translateY(-2px);
        }

        .adminToolCard.blue:hover {
          border-color: rgba(44,157,255,.85);
          box-shadow:
            0 0 22px rgba(0,120,255,.11),
            0 15px 30px rgba(0,0,0,.34);
        }

        .adminToolCard.red:hover {
          border-color: rgba(255,55,63,.78);
          box-shadow:
            0 0 22px rgba(237,28,36,.1),
            0 15px 30px rgba(0,0,0,.34);
        }

        .adminToolAccent {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
        }

        .adminToolCard.blue .adminToolAccent {
          background:
            linear-gradient(
              90deg,
              #087eff,
              rgba(8,126,255,.12)
            );
        }

        .adminToolCard.red .adminToolAccent {
          background:
            linear-gradient(
              90deg,
              #ed1c24,
              rgba(237,28,36,.12)
            );
        }

        .adminToolTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 11px;
        }

        .adminToolIcon {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 11px;
          color: #ffffff;
          font-size: 22px;
          font-weight: 950;
        }

        .adminToolCard.blue .adminToolIcon {
          border: 1px solid rgba(42,153,255,.55);
          background:
            linear-gradient(
              145deg,
              rgba(8,92,174,.72),
              rgba(4,30,58,.88)
            );
          box-shadow:
            0 0 17px rgba(0,120,255,.11);
        }

        .adminToolCard.red .adminToolIcon {
          border: 1px solid rgba(237,48,57,.55);
          background:
            linear-gradient(
              145deg,
              rgba(150,18,27,.68),
              rgba(54,8,16,.86)
            );
          box-shadow:
            0 0 17px rgba(237,28,36,.1);
        }

        .adminToolArrow {
          color: #6d88a2;
          font-size: 18px;
          font-weight: 900;
          transition:
            transform .18s ease,
            color .18s ease;
        }

        .adminToolCard:hover .adminToolArrow {
          transform: translateX(3px);
          color: #ffffff;
        }

        .adminToolCard h2 {
          margin: 0 0 6px;
          color: #ffffff;
          font-size: 17px;
          line-height: 1.1;
          font-weight: 950;
          letter-spacing: -.25px;
        }

        .adminToolCard p {
          min-height: 45px;
          margin: 0 0 13px;
          color: #9eb3c7;
          font-size: 11px;
          line-height: 1.4;
          font-weight: 700;
        }

        .adminToolButton {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 39px;
          margin: 0;
          border: none;
          border-radius: 8px;
          color: #ffffff;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .3px;
          text-transform: uppercase;
        }

        .adminToolCard.blue .adminToolButton {
          background:
            linear-gradient(
              105deg,
              #087eff,
              #2868df,
              #1257b8
            );
          box-shadow:
            0 3px 0 #07458d,
            0 6px 13px rgba(0,83,180,.18);
        }

        .adminToolCard.red .adminToolButton {
          background:
            linear-gradient(
              105deg,
              #b70d17,
              #ed1c24,
              #ff3440
            );
          box-shadow:
            0 3px 0 #7d0a11,
            0 6px 13px rgba(160,10,20,.16);
        }

        .socialPosterSection {
          position: relative;
          overflow: hidden;
          margin: 8px 0 20px;
          padding: 21px;
          border: 1px solid rgba(80,140,200,.44);
          border-radius: 16px;
          background:
            radial-gradient(
              circle at 8% 4%,
              rgba(0,119,255,.16),
              transparent 29%
            ),
            radial-gradient(
              circle at 94% 28%,
              rgba(237,28,36,.14),
              transparent 30%
            ),
            linear-gradient(
              145deg,
              rgba(8,31,59,.99),
              rgba(3,13,27,.99)
            );
          box-shadow:
            -9px 0 27px rgba(0,116,255,.07),
            9px 0 27px rgba(237,28,36,.06),
            0 18px 42px rgba(0,0,0,.31),
            inset 0 1px 0 rgba(255,255,255,.04);
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
              #ffffff 50%,
              #ed1c24 62%,
              #ed1c24
            );
          box-shadow:
            0 0 12px rgba(48,145,255,.24);
        }

        .socialSideGlow {
          position: absolute;
          width: 130px;
          height: 260px;
          border-radius: 50%;
          filter: blur(55px);
          opacity: .12;
          pointer-events: none;
        }

        .socialSideGlowBlue {
          left: -90px;
          top: 120px;
          background: #087eff;
        }

        .socialSideGlowRed {
          right: -90px;
          bottom: 90px;
          background: #ed1c24;
        }

        .socialHeader {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 17px;
        }

        .socialIconBox {
          display: grid;
          place-items: center;
          flex: 0 0 54px;
          width: 54px;
          height: 54px;
          border: 1px solid rgba(59,150,240,.55);
          border-radius: 13px;
          background:
            linear-gradient(
              145deg,
              rgba(8,67,123,.85),
              rgba(5,24,47,.94)
            );
          color: #ffffff;
          font-size: 27px;
          box-shadow:
            0 0 18px rgba(0,123,255,.11),
            inset 0 1px 0 rgba(255,255,255,.06);
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
          letter-spacing: -.5px;
        }

        .socialHeader p {
          margin: 0;
          color: #9fb4c8;
          font-size: 12px;
          line-height: 1.45;
          font-weight: 700;
        }

        .weekSelectorPanel {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns:
            1fr minmax(220px, 330px);
          align-items: center;
          gap: 18px;
          margin-bottom: 17px;
          padding: 14px;
          border: 1px solid rgba(62,130,196,.38);
          border-radius: 11px;
          background:
            linear-gradient(
              135deg,
              rgba(3,23,45,.8),
              rgba(2,14,29,.74)
            );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.025);
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
          border: 1px solid rgba(73,149,222,.56);
          border-radius: 9px;
          outline: none;
          background: #071a31;
          color: #ffffff;
          font-size: 13px;
          font-weight: 850;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.025);
        }

        .weekSelectorPanel select:focus {
          border-color: #2999ff;
          box-shadow:
            0 0 0 2px rgba(41,153,255,.12);
        }

        .posterMessage {
          position: relative;
          z-index: 1;
          margin-bottom: 14px;
          padding: 11px 13px;
          border: 1px solid rgba(69,149,225,.42);
          border-radius: 9px;
          background:
            linear-gradient(
              90deg,
              rgba(5,52,92,.48),
              rgba(7,32,59,.5)
            );
          color: #c0e0fa;
          text-align: center;
          font-size: 12px;
          font-weight: 800;
        }

        .posterGeneratorGrid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0,1fr));
          gap: 15px;
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
              rgba(9,29,55,.99),
              rgba(2,13,27,.99)
            );
          box-shadow:
            0 12px 27px rgba(0,0,0,.25),
            inset 0 1px 0 rgba(255,255,255,.03);
        }

        .posterGeneratorCard::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
        }

        .posterGeneratorCard.weekly {
          border: 1px solid rgba(35,133,239,.74);
        }

        .posterGeneratorCard.weekly::before {
          background:
            linear-gradient(
              90deg,
              #087eff,
              transparent
            );
        }

        .posterGeneratorCard.overall {
          border: 1px solid rgba(237,45,53,.7);
        }

        .posterGeneratorCard.overall::before {
          background:
            linear-gradient(
              90deg,
              transparent,
              #ed1c24
            );
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
          background: rgba(5,73,136,.25);
          box-shadow: 0 0 12px rgba(0,125,255,.08);
        }

        .generatorTag.red {
          border: 1px solid #ed1c24;
          color: #ff686f;
          background: rgba(126,16,23,.24);
          box-shadow: 0 0 12px rgba(237,28,36,.08);
        }

        .generatorIcon {
          margin: 14px 0 7px;
          font-size: 32px;
          filter: drop-shadow(0 4px 7px rgba(0,0,0,.38));
        }

        .posterGeneratorCard h3 {
          margin: 0;
          color: #ffffff;
          font-size: 21px;
          font-weight: 950;
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
          letter-spacing: .4px;
          cursor: pointer;
          transition:
            transform .15s ease,
            filter .15s ease;
        }

        .posterButton:not(:disabled):hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }

        .posterButton:disabled {
          cursor: default;
          opacity: .48;
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
            0 3px 0 #08458b,
            0 7px 15px rgba(0,94,200,.2);
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
            0 3px 0 #810b13,
            0 7px 15px rgba(175,10,20,.18);
        }

        .posterPreviewWrap {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid rgba(112,151,188,.2);
        }

        .posterPreview {
          display: block;
          width: 100%;
          border: 1px solid rgba(117,161,202,.36);
          border-radius: 9px;
          background: #000000;
          box-shadow:
            0 10px 24px rgba(0,0,0,.3);
        }

        .downloadPoster {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 42px;
          margin-top: 9px;
          border: 1px solid rgba(105,170,231,.48);
          border-radius: 8px;
          background:
            linear-gradient(
              105deg,
              rgba(8,53,96,.94),
              rgba(5,31,58,.94)
            );
          color: #ffffff;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .6px;
          text-decoration: none;
        }

        .posterTip {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 16px;
          padding: 11px 13px;
          border: 1px solid rgba(59,124,188,.36);
          border-radius: 9px;
          background: rgba(2,16,32,.72);
          color: #8fa8bf;
          font-size: 10px;
          line-height: 1.45;
          font-weight: 700;
        }

        .posterTip span {
          color: #4aaaff;
          font-size: 19px;
        }

        .adminFooterActions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 4px;
        }

        .adminFooterLink {
          display: block;
          text-decoration: none;
        }

        .backPredictorButton,
        .signOutButton {
          width: 100%;
          min-height: 43px;
          margin: 0;
          border: none;
          border-radius: 9px;
          color: #ffffff;
          font-size: 11px;
          font-weight: 900;
        }

        .backPredictorButton {
          background:
            linear-gradient(
              105deg,
              #087eff,
              #155fb8
            );
          box-shadow:
            0 3px 0 #06417e,
            0 6px 12px rgba(0,0,0,.16);
        }

        .signOutButton {
          background:
            linear-gradient(
              105deg,
              #536579,
              #3e4e60
            );
          box-shadow:
            0 3px 0 #2d3a47,
            0 6px 12px rgba(0,0,0,.16);
        }

        .signOutButton:disabled {
          opacity: .5;
        }

        @media (max-width: 700px) {
          .adminShell {
            padding-bottom: 22px;
          }

          .adminBrandHeader {
            margin-bottom: 9px;
            padding: 4px 8px;
            gap: 9px;
          }

          .adminBrandBadge {
            width: 50px;
          }

          .adminBrandTitle {
            font-size: 23px;
            letter-spacing: -1px;
          }

          .adminBrandLabel {
            margin-top: 4px;
            font-size: 8px;
            letter-spacing: 1.6px;
          }

          .adminHero {
            margin-bottom: 14px;
            padding: 14px 10px 12px;
          }

          .adminHeroEyebrow {
            font-size: 7px;
            letter-spacing: 1.35px;
          }

          .adminHeroTitle {
            font-size: 19px;
          }

          .adminHeroSubtitle {
            font-size: 10px;
          }

          .adminHeroRule {
            margin-top: 9px;
          }

          .adminSectionHeading {
            margin-bottom: 8px;
          }

          .adminSectionHeading h2 {
            font-size: 17px;
          }

          .adminSectionEyebrow {
            font-size: 7px;
          }

          .adminSectionPill {
            min-height: 22px;
            padding: 0 7px;
            font-size: 7px;
          }

          .adminGrid {
            grid-template-columns:
              repeat(2, minmax(0,1fr));
            gap: 8px;
            margin-bottom: 16px;
          }

          .adminToolCard {
            min-height: 156px;
            padding: 12px 10px 11px;
            border-radius: 11px;
          }

          .adminToolTop {
            margin-bottom: 8px;
          }

          .adminToolIcon {
            width: 34px;
            height: 34px;
            border-radius: 9px;
            font-size: 18px;
          }

          .adminToolArrow {
            font-size: 15px;
          }

          .adminToolCard h2 {
            margin-bottom: 4px;
            font-size: 14px;
          }

          .adminToolCard p {
            min-height: 38px;
            margin-bottom: 9px;
            font-size: 9px;
            line-height: 1.35;
          }

          .adminToolButton {
            min-height: 34px;
            padding: 0 5px;
            font-size: 8px;
          }

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

          .socialHeader {
            gap: 10px;
            margin-bottom: 13px;
          }

          .socialHeader h2 {
            font-size: 20px;
          }

          .socialHeader p {
            font-size: 10px;
          }

          .socialIconBox {
            flex-basis: 43px;
            width: 43px;
            height: 43px;
            font-size: 21px;
          }

          .weekSelectorPanel {
            padding: 11px;
          }

          .fieldLabel {
            font-size: 13px;
          }

          .weekSelectorPanel select {
            min-height: 40px;
            font-size: 12px;
          }

          .posterGeneratorCard {
            padding: 14px 12px;
          }

          .generatorIcon {
            margin: 10px 0 5px;
            font-size: 28px;
          }

          .posterGeneratorCard h3 {
            font-size: 18px;
          }

          .posterGeneratorCard p {
            min-height: 0;
            margin: 5px 0 11px;
            font-size: 10px;
          }

          .posterButton {
            min-height: 41px;
            font-size: 9px;
          }

          .posterTip {
            margin-top: 12px;
            padding: 9px 10px;
            font-size: 9px;
          }

          .adminFooterActions {
            gap: 8px;
          }

          .backPredictorButton,
          .signOutButton {
            min-height: 39px;
            font-size: 9px;
          }
        }

        @media (max-width: 390px) {
          .adminGrid {
            gap: 7px;
          }

          .adminToolCard {
            min-height: 151px;
            padding: 11px 9px 10px;
          }

          .adminToolCard h2 {
            font-size: 13px;
          }

          .adminToolCard p {
            font-size: 8.5px;
          }

          .adminToolButton {
            font-size: 7.5px;
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
  tone = "blue",
}) {
  return (
    <a
      href={href}
      className="adminToolLink"
    >
      <div className={`adminToolCard ${tone}`}>
        <div className="adminToolAccent" />

        <div className="adminToolTop">
          <div className="adminToolIcon">
            {icon}
          </div>

          <div className="adminToolArrow">
            ›
          </div>
        </div>

        <h2>{title}</h2>

        <p>{text}</p>

        <div className="adminToolButton">
          {button}
        </div>
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

  return rows.map((row, index) => {
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
  });
}

/* =====================================================
   CANVAS HELPERS
===================================================== */

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
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
  });
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
      ctx.measureText(text).width <= maxWidth
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

  ctx.save();
  ctx.lineCap = "round";

  for (let i = 0; i < 18; i += 1) {
    const y = 75 + i * 66;

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
    const y = 160 + i * 65;

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

  ctx.save();

  for (let i = 0; i < 115; i += 1) {
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

  return value - Math.floor(value);
}

async function loadBadge() {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () =>
      resolve(image);

    image.onerror = () =>
      resolve(null);

    image.src =
      "/TWHC-badge-white.png";
  });
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

  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.lineWidth = 2;

  ctx.strokeStyle =
    position <= 3
      ? "rgba(255,255,255,0.65)"
      : "rgba(61,157,244,0.6)";

  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#ffffff";

  ctx.font =
    `900 ${Math.round(
      radius * 0.82
    )}px Arial Black, Arial, sans-serif`;

  ctx.fillText(
    String(position),
    x,
    y + 1
  );

  ctx.textBaseline = "alphabetic";
}

/* =====================================================
   WEEKLY POSTER

   FINAL:
   WEEKLY WINNER!

   OUTSTANDING RESULT(S):
   WEEKLY LEADER!
   + PROVISIONAL RIDER
===================================================== */

async function drawWeeklyPoster(
  ctx,
  week,
  rows,
  leaders,
  outstandingCount
) {
  drawPosterBackground(ctx);

  await drawPosterBrand(ctx);

  const isProvisional =
    outstandingCount > 0;

  const joint =
    leaders.length > 1;

  /* MATCH WEEK */
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

  /* WINNER / LEADER HEADING */

  let mainHeading;

  if (isProvisional) {
    mainHeading =
      joint
        ? "JOINT WEEKLY LEADERS!"
        : "WEEKLY LEADER!";
  } else {
    mainHeading =
      joint
        ? "JOINT WEEKLY WINNERS!"
        : "WEEKLY WINNER!";
  }

  drawCenteredText(
    ctx,
    mainHeading,
    540,
    362,
    900,
    70,
    46,
    "#f4f5f6",
    "Impact"
  );

  /* HERO */

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

  ctx.save();

  ctx.shadowColor =
    "#ffc320";

  ctx.shadowBlur = 28;

  ctx.font =
    "116px Arial";

  ctx.textAlign = "center";

  ctx.fillText(
    isProvisional ? "👑" : "🏆",
    218,
    555
  );

  ctx.restore();

  const leaderText =
    leaders
      .slice(0, 2)
      .map(
        (leader) =>
          leader.teamName
      )
      .join(" / ");

  drawCenteredText(
    ctx,
    leaderText.toUpperCase(),
    655,
    485,
    590,
    62,
    36,
    "#ffd14e",
    "Impact"
  );

  const playerText =
    leaders
      .slice(0, 2)
      .map(
        (leader) =>
          `${leader.firstName} ${leader.surname}`.trim()
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

  /* TOP FIVE */

  drawCenteredText(
    ctx,
    isProvisional
      ? "CURRENT WEEKLY TOP 5"
      : "WEEKLY TOP 5",
    540,
    710,
    600,
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
      rowHeight: 78,
      showPlayer: true,
    }
  );

  /*
    PROVISIONAL RIDER
  */

  if (isProvisional) {
    const riderY = 1200;

    const riderGradient =
      ctx.createLinearGradient(
        80,
        0,
        1000,
        0
      );

    riderGradient.addColorStop(
      0,
      "rgba(151,86,0,0.92)"
    );

    riderGradient.addColorStop(
      0.5,
      "rgba(119,62,0,0.96)"
    );

    riderGradient.addColorStop(
      1,
      "rgba(151,86,0,0.92)"
    );

    fillRoundedRect(
      ctx,
      80,
      riderY,
      920,
      78,
      15,
      riderGradient
    );

    strokeRoundedRect(
      ctx,
      80,
      riderY,
      920,
      78,
      15,
      "#ffb31c",
      3
    );

    drawCenteredText(
      ctx,
      "PROVISIONAL STANDINGS",
      540,
      riderY + 31,
      800,
      25,
      20,
      "#ffd45a",
      "Arial Black"
    );

    drawCenteredText(
      ctx,
      `${outstandingCount} RESULT${
        outstandingCount === 1
          ? ""
          : "S"
      } STILL TO BE SUBMITTED`,
      540,
      riderY + 61,
      800,
      22,
      17,
      "#ffffff",
      "Arial Black"
    );
  } else {
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
  }

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

  const leader = rows[0];

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

  ctx.textAlign = "center";

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
    String(leader.points),
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

  ctx.textBaseline = "middle";

  ctx.textAlign = "center";

  ctx.fillText(
    "POS",
    x + 55,
    y + 24
  );

  ctx.textAlign = "left";

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

  ctx.textAlign = "right";

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

      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      ctx.font =
        `900 ${teamSize}px Impact, Arial Black, Arial`;

      ctx.fillStyle =
        row.position === 1
          ? "#ffd143"
          : "#ffffff";

      ctx.fillText(
        row.teamName.toUpperCase(),
        x + 108,
        top + rowHeight / 2
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
        top + rowHeight / 2
      );

      ctx.textAlign = "right";

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
        top + rowHeight / 2
      );
    }
  );

  ctx.textBaseline = "alphabetic";
}

/* =====================================================
   FOOTER
===================================================== */

function drawPosterFooter(ctx) {
  ctx.save();

  ctx.textAlign = "center";

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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ManageFixturesPage() {
  const router = useRouter();

  const [authorised, setAuthorised] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");

  const [weeks, setWeeks] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState("");
  const [fixtures, setFixtures] = useState([]);

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
        .select("id, week_no, match_date")
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
    if (!authorised || !selectedWeekId) return;

    async function loadFixtures() {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("fixtures")
        .select(
          "id, match_week_id, home_team, away_team, fixture_order, scheduled_date, status"
        )
        .eq("match_week_id", Number(selectedWeekId))
        .order("fixture_order", { ascending: true });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setFixtures(data || []);
      setLoading(false);
    }

    loadFixtures();
  }, [selectedWeekId, authorised]);

  function updateFixtureField(fixtureId, field, value) {
    setFixtures((current) =>
      current.map((fixture) =>
        fixture.id === fixtureId
          ? { ...fixture, [field]: value }
          : fixture
      )
    );
  }

  async function saveFixture(fixture) {
    if (
      !fixture.home_team ||
      !fixture.away_team ||
      !fixture.fixture_order ||
      !fixture.scheduled_date ||
      !fixture.status
    ) {
      setMessage("Please complete all fixture fields before saving.");
      return;
    }

    setSavingId(fixture.id);
    setMessage("");

    const { error } = await supabase
      .from("fixtures")
      .update({
        home_team: fixture.home_team.trim(),
        away_team: fixture.away_team.trim(),
        fixture_order: Number(fixture.fixture_order),
        scheduled_date: fixture.scheduled_date,
        status: fixture.status,
      })
      .eq("id", fixture.id);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    setMessage(`Fixture ${fixture.fixture_order} saved.`);
    setSavingId(null);
  }

  function BrandHeader() {
    return (
      <div className="brandHeader">
        <div className="brandGlow brandGlowBlue" />
        <div className="brandGlow brandGlowRed" />

        <img
          src="/TWHC-badge-white.png"
          alt="Telford & Wrekin Hockey Club"
          className="brandBadge"
        />

        <div className="brandCopy">
          <div className="brandTitle">
            THE PREDICTO<span>R</span>
          </div>

          <div className="brandLabel">ADMINISTRATOR</div>
        </div>
      </div>
    );
  }

  if (loading && !authorised) {
    return (
      <main>
        <div className="container fixturesShell">
          <BrandHeader />

          <div className="loadingCard">
            <div className="loadingPulse" />
            <p>Loading fixtures...</p>
          </div>
        </div>

        <PageStyles />
      </main>
    );
  }

  if (!authorised) {
    return (
      <main>
        <div className="container fixturesShell">
          <BrandHeader />

          <section className="pageHero">
            <div className="heroLine" />
            <div className="heroEyebrow">COMPETITION CONTROL</div>
            <h1>Manage Fixtures</h1>
          </section>

          <div className="accessCard">
            <h2>Access Denied</h2>
            <p>{message}</p>
          </div>

          <a href="/admin" className="backLink">
            <button className="backButton">← Back to Admin</button>
          </a>
        </div>

        <PageStyles />
      </main>
    );
  }

  const selectedWeek = weeks.find(
    (week) => Number(week.id) === Number(selectedWeekId)
  );

  return (
    <main>
      <div className="container fixturesShell">
        <BrandHeader />

        <section className="pageHero">
          <div className="heroLine" />

          <div className="heroEyebrow">
            THE PREDICTOR CONTROL CENTRE
          </div>

          <h1>Manage Fixtures</h1>

          <p>
            Edit teams, dates, order and fixture status
          </p>

          <div className="heroRule">
            <span className="blueRule" />
            <span className="centreDot" />
            <span className="redRule" />
          </div>
        </section>

        <section className="weekPanel">
          <div className="weekPanelTop">
            <div>
              <div className="sectionEyebrow">MATCH WEEK</div>
              <h2>Select Match Week</h2>
            </div>

            <div className="fixtureCount">
              {fixtures.length} FIXTURE{fixtures.length === 1 ? "" : "S"}
            </div>
          </div>

          <select
            className="weekSelect"
            value={selectedWeekId}
            onChange={(e) => setSelectedWeekId(e.target.value)}
          >
            {weeks.map((week) => (
              <option key={week.id} value={week.id}>
                Match Week {week.week_no}
                {week.match_date ? ` — ${week.match_date}` : ""}
              </option>
            ))}
          </select>

          {selectedWeek && (
            <div className="selectedWeekStrip">
              <span className="weekDot" />
              Editing Match Week {selectedWeek.week_no}
              {selectedWeek.match_date
                ? ` · ${formatDate(selectedWeek.match_date)}`
                : ""}
            </div>
          )}
        </section>

        {message && (
          <div
            className={`messageBar ${
              message.toLowerCase().includes("saved")
                ? "success"
                : "warning"
            }`}
          >
            <span>
              {message.toLowerCase().includes("saved") ? "✓" : "ⓘ"}
            </span>
            {message}
          </div>
        )}

        <div className="fixturesHeading">
          <div>
            <div className="sectionEyebrow">FIXTURE CONTROL</div>
            <h2>Edit Fixtures</h2>
          </div>

          {!loading && fixtures.length > 0 && (
            <div className="livePill">LIVE DATA</div>
          )}
        </div>

        {loading ? (
          <div className="loadingCard">
            <div className="loadingPulse" />
            <p>Loading fixtures...</p>
          </div>
        ) : fixtures.length === 0 ? (
          <div className="emptyCard">
            <div className="emptyIcon">🏑</div>
            <h3>No Fixtures Found</h3>
            <p>There are no fixtures for this Match Week.</p>
          </div>
        ) : (
          <div className="fixtureList">
            {fixtures.map((fixture, index) => {
              const tone = index % 2 === 0 ? "blue" : "red";
              const saving = savingId === fixture.id;

              return (
                <section
                  key={fixture.id}
                  className={`fixtureCard ${tone}`}
                >
                  <div className="fixtureAccent" />

                  <div className="fixtureHeader">
                    <div className="fixtureNumber">
                      <span>FIXTURE</span>
                      <strong>{fixture.fixture_order}</strong>
                    </div>

                    <div
                      className={`statusBadge ${fixture.status || "scheduled"}`}
                    >
                      <span className="statusDot" />
                      {formatStatus(fixture.status)}
                    </div>
                  </div>

                  <div className="matchup">
                    <div className="teamSide">
                      <label>HOME</label>

                      <input
                        type="text"
                        value={fixture.home_team || ""}
                        onChange={(e) =>
                          updateFixtureField(
                            fixture.id,
                            "home_team",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="versus">
                      <span>V</span>
                    </div>

                    <div className="teamSide away">
                      <label>AWAY</label>

                      <input
                        type="text"
                        value={fixture.away_team || ""}
                        onChange={(e) =>
                          updateFixtureField(
                            fixture.id,
                            "away_team",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="fixtureControls">
                    <label className="controlField orderField">
                      <span>ORDER</span>

                      <input
                        type="number"
                        min="1"
                        value={fixture.fixture_order || ""}
                        onChange={(e) =>
                          updateFixtureField(
                            fixture.id,
                            "fixture_order",
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <label className="controlField dateField">
                      <span>SCHEDULED DATE</span>

                      <input
                        type="date"
                        value={fixture.scheduled_date || ""}
                        onChange={(e) =>
                          updateFixtureField(
                            fixture.id,
                            "scheduled_date",
                            e.target.value
                          )
                        }
                      />
                    </label>

                    <label className="controlField statusField">
                      <span>STATUS</span>

                      <select
                        value={fixture.status || "scheduled"}
                        onChange={(e) =>
                          updateFixtureField(
                            fixture.id,
                            "status",
                            e.target.value
                          )
                        }
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="postponed">Postponed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </label>

                    <button
                      className={`saveButton ${tone}`}
                      onClick={() => saveFixture(fixture)}
                      disabled={saving}
                    >
                      {saving ? "SAVING..." : "SAVE FIXTURE"}
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <a href="/admin" className="backLink">
          <button className="backButton">
            ← Back to Admin
          </button>
        </a>

        <p className="pageFooter">
          Telford & Wrekin Hockey Club
        </p>
      </div>

      <PageStyles />
    </main>
  );
}

function formatStatus(status) {
  if (!status) return "Scheduled";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T12:00:00`);

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PageStyles() {
  return (
    <style jsx global>{`
      .fixturesShell {
        max-width: 920px !important;
        padding-bottom: 28px;
      }

      .brandHeader {
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

      .brandGlow {
        position: absolute;
        top: 50%;
        width: 80px;
        height: 44px;
        border-radius: 50%;
        filter: blur(23px);
        opacity: 0.34;
        pointer-events: none;
      }

      .brandGlowBlue {
        left: -18px;
        background: #087eff;
      }

      .brandGlowRed {
        right: -20px;
        background: #ed1c24;
      }

      .brandBadge {
        position: relative;
        z-index: 1;
        display: block;
        width: 60px;
        height: auto;
        margin: 0;
        filter:
          drop-shadow(0 0 10px rgba(0, 125, 255, 0.24))
          drop-shadow(0 4px 8px rgba(0, 0, 0, 0.42));
      }

      .brandCopy {
        position: relative;
        z-index: 1;
        text-align: left;
      }

      .brandTitle {
        color: #ffffff;
        font-size: 28px;
        line-height: 0.95;
        font-weight: 950;
        letter-spacing: -1.3px;
        white-space: nowrap;
        text-shadow:
          0 2px 8px rgba(0, 0, 0, 0.45),
          0 0 12px rgba(255, 255, 255, 0.08);
      }

      .brandTitle span {
        color: #ed1c24;
        text-shadow: 0 0 14px rgba(237, 28, 36, 0.46);
      }

      .brandLabel {
        margin-top: 6px;
        color: #a9bfd5;
        font-size: 10px;
        font-weight: 950;
        letter-spacing: 2px;
      }

      .pageHero {
        position: relative;
        overflow: hidden;
        margin-bottom: 15px;
        padding: 18px 18px 16px;
        border: 1px solid rgba(72, 145, 215, 0.34);
        border-radius: 15px;
        text-align: center;
        background:
          radial-gradient(
            circle at 4% 10%,
            rgba(0, 121, 255, 0.18),
            transparent 33%
          ),
          radial-gradient(
            circle at 96% 82%,
            rgba(237, 28, 36, 0.15),
            transparent 34%
          ),
          linear-gradient(
            145deg,
            rgba(8, 30, 56, 0.97),
            rgba(3, 12, 25, 0.99)
          );
        box-shadow:
          -7px 0 24px rgba(0, 105, 255, 0.08),
          7px 0 24px rgba(237, 28, 36, 0.07),
          0 15px 34px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.035);
      }

      .heroLine {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(
          90deg,
          #087eff 0 42%,
          #d7e8f8 50%,
          #ed1c24 58% 100%
        );
      }

      .heroEyebrow,
      .sectionEyebrow {
        color: #2999ff;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 1.7px;
      }

      .pageHero h1 {
        margin: 4px 0 0;
        color: #ffffff;
        font-size: 25px;
        line-height: 1.05;
        font-weight: 950;
        letter-spacing: -0.6px;
      }

      .pageHero p {
        margin: 6px 0 0;
        color: #9eb6cd;
        font-size: 12px;
        font-weight: 750;
      }

      .heroRule {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        width: min(330px, 80%);
        margin: 12px auto 0;
      }

      .blueRule,
      .redRule {
        flex: 1;
        height: 2px;
      }

      .blueRule {
        background: linear-gradient(90deg, transparent, #168cff);
      }

      .redRule {
        background: linear-gradient(90deg, #ed1c24, transparent);
      }

      .centreDot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #ffffff;
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.65);
      }

      .weekPanel {
        position: relative;
        margin-bottom: 12px;
        padding: 15px;
        border: 1px solid rgba(46, 133, 218, 0.48);
        border-radius: 13px;
        background:
          radial-gradient(
            circle at 0 0,
            rgba(0, 119, 255, 0.13),
            transparent 35%
          ),
          linear-gradient(
            145deg,
            rgba(7, 28, 53, 0.98),
            rgba(3, 14, 28, 0.99)
          );
        box-shadow:
          0 12px 26px rgba(0, 0, 0, 0.25),
          inset 0 1px 0 rgba(255, 255, 255, 0.03);
      }

      .weekPanelTop {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }

      .weekPanel h2,
      .fixturesHeading h2 {
        margin: 2px 0 0;
        color: #ffffff;
        font-size: 18px;
        font-weight: 950;
      }

      .fixtureCount,
      .livePill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 25px;
        padding: 0 9px;
        border: 1px solid rgba(38, 145, 247, 0.5);
        border-radius: 999px;
        background: rgba(5, 71, 130, 0.24);
        color: #55aeff;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 0.8px;
        white-space: nowrap;
      }

      .weekSelect {
        width: 100%;
        min-height: 44px;
        padding: 0 12px;
        border: 1px solid rgba(74, 151, 224, 0.62);
        border-radius: 9px;
        outline: none;
        background: #071a31;
        color: #ffffff;
        font-size: 13px;
        font-weight: 850;
      }

      .weekSelect:focus {
        border-color: #2999ff;
        box-shadow: 0 0 0 2px rgba(41, 153, 255, 0.12);
      }

      .selectedWeekStrip {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-top: 9px;
        color: #93abc1;
        font-size: 10px;
        font-weight: 800;
      }

      .weekDot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #168cff;
        box-shadow: 0 0 8px rgba(22, 140, 255, 0.7);
      }

      .messageBar {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-bottom: 12px;
        padding: 10px 12px;
        border-radius: 9px;
        font-size: 11px;
        font-weight: 850;
      }

      .messageBar.success {
        border: 1px solid rgba(50, 194, 115, 0.48);
        background: rgba(19, 104, 59, 0.2);
        color: #8ee5b5;
      }

      .messageBar.warning {
        border: 1px solid rgba(240, 165, 40, 0.45);
        background: rgba(117, 74, 10, 0.2);
        color: #ffd181;
      }

      .fixturesHeading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        margin: 16px 2px 9px;
      }

      .fixtureList {
        display: grid;
        gap: 10px;
      }

      .fixtureCard {
        position: relative;
        overflow: hidden;
        padding: 13px;
        border-radius: 13px;
        background:
          radial-gradient(
            circle at 0 0,
            rgba(0, 123, 255, 0.1),
            transparent 32%
          ),
          radial-gradient(
            circle at 100% 100%,
            rgba(237, 28, 36, 0.07),
            transparent 32%
          ),
          linear-gradient(
            150deg,
            rgba(8, 29, 54, 0.98),
            rgba(3, 13, 27, 0.99)
          );
        box-shadow:
          0 11px 25px rgba(0, 0, 0, 0.26),
          inset 0 1px 0 rgba(255, 255, 255, 0.03);
      }

      .fixtureCard.blue {
        border: 1px solid rgba(38, 139, 239, 0.48);
      }

      .fixtureCard.red {
        border: 1px solid rgba(237, 45, 53, 0.42);
      }

      .fixtureAccent {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
      }

      .fixtureCard.blue .fixtureAccent {
        background: linear-gradient(90deg, #087eff, transparent 70%);
      }

      .fixtureCard.red .fixtureAccent {
        background: linear-gradient(90deg, transparent 30%, #ed1c24);
      }

      .fixtureHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 10px;
      }

      .fixtureNumber {
        display: flex;
        align-items: center;
        gap: 7px;
      }

      .fixtureNumber span {
        color: #7f9bb6;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 1px;
      }

      .fixtureNumber strong {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border: 1px solid rgba(51, 148, 240, 0.5);
        border-radius: 7px;
        background: rgba(5, 57, 105, 0.5);
        color: #ffffff;
        font-size: 13px;
      }

      .statusBadge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 25px;
        padding: 0 9px;
        border-radius: 999px;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 0.6px;
        text-transform: uppercase;
      }

      .statusDot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .statusBadge.scheduled {
        border: 1px solid rgba(44, 150, 249, 0.46);
        background: rgba(9, 76, 139, 0.23);
        color: #62b5ff;
      }

      .statusBadge.scheduled .statusDot {
        background: #168cff;
      }

      .statusBadge.postponed {
        border: 1px solid rgba(255, 176, 42, 0.5);
        background: rgba(129, 78, 8, 0.23);
        color: #ffc75d;
      }

      .statusBadge.postponed .statusDot {
        background: #ffad25;
      }

      .statusBadge.completed {
        border: 1px solid rgba(48, 192, 111, 0.48);
        background: rgba(13, 103, 55, 0.22);
        color: #78dda5;
      }

      .statusBadge.completed .statusDot {
        background: #35cf79;
      }

      .statusBadge.cancelled {
        border: 1px solid rgba(237, 49, 58, 0.52);
        background: rgba(126, 14, 22, 0.23);
        color: #ff747b;
      }

      .statusBadge.cancelled .statusDot {
        background: #ed1c24;
      }

      .matchup {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 42px minmax(0, 1fr);
        align-items: end;
        gap: 8px;
        margin-bottom: 11px;
      }

      .teamSide label {
        display: block;
        margin: 0 0 4px 2px;
        color: #4aa9ff;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 1.1px;
      }

      .teamSide.away label {
        color: #ff626a;
      }

      .teamSide input,
      .controlField input,
      .controlField select {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid rgba(72, 137, 199, 0.48);
        border-radius: 8px;
        outline: none;
        background: rgba(3, 17, 33, 0.92);
        color: #ffffff;
        font-weight: 800;
      }

      .teamSide input {
        min-height: 43px;
        padding: 0 11px;
        font-size: 13px;
      }

      .teamSide input:focus,
      .controlField input:focus,
      .controlField select:focus {
        border-color: #2999ff;
        box-shadow: 0 0 0 2px rgba(41, 153, 255, 0.1);
      }

      .versus {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 43px;
      }

      .versus span {
        display: grid;
        place-items: center;
        width: 31px;
        height: 31px;
        border: 1px solid rgba(131, 161, 188, 0.34);
        border-radius: 50%;
        background: #06172a;
        color: #ffffff;
        font-size: 11px;
        font-weight: 950;
        box-shadow:
          -4px 0 10px rgba(0, 126, 255, 0.08),
          4px 0 10px rgba(237, 28, 36, 0.08);
      }

      .fixtureControls {
        display: grid;
        grid-template-columns: 90px minmax(150px, 1.2fr) minmax(140px, 1fr) 150px;
        align-items: end;
        gap: 8px;
        padding-top: 10px;
        border-top: 1px solid rgba(95, 137, 176, 0.16);
      }

      .controlField span {
        display: block;
        margin: 0 0 4px 2px;
        color: #7f9bb6;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: 0.8px;
      }

      .controlField input,
      .controlField select {
        min-height: 38px;
        padding: 0 9px;
        font-size: 11px;
      }

      .saveButton {
        min-height: 38px;
        margin: 0;
        border: none;
        border-radius: 8px;
        color: #ffffff;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 0.35px;
        cursor: pointer;
      }

      .saveButton.blue {
        background: linear-gradient(105deg, #087eff, #155fc1);
        box-shadow:
          0 3px 0 #064487,
          0 5px 11px rgba(0, 90, 190, 0.16);
      }

      .saveButton.red {
        background: linear-gradient(105deg, #bd0e18, #ed1c24);
        box-shadow:
          0 3px 0 #7d0a11,
          0 5px 11px rgba(170, 10, 20, 0.15);
      }

      .saveButton:disabled {
        opacity: 0.5;
        cursor: default;
      }

      .loadingCard,
      .emptyCard,
      .accessCard {
        margin: 12px 0;
        padding: 22px;
        border: 1px solid rgba(57, 137, 214, 0.42);
        border-radius: 13px;
        background: linear-gradient(
          145deg,
          rgba(7, 29, 55, 0.97),
          rgba(3, 14, 28, 0.99)
        );
        color: #ffffff;
        text-align: center;
      }

      .loadingCard p,
      .emptyCard p,
      .accessCard p {
        margin: 6px 0 0;
        color: #9eb4c9;
        font-size: 12px;
      }

      .emptyCard h3,
      .accessCard h2 {
        margin: 5px 0 0;
      }

      .emptyIcon {
        font-size: 34px;
      }

      .loadingPulse {
        width: 12px;
        height: 12px;
        margin: 0 auto 8px;
        border-radius: 50%;
        background: #168cff;
        box-shadow: 0 0 14px rgba(22, 140, 255, 0.75);
        animation: fixturePulse 1.2s infinite ease-in-out;
      }

      @keyframes fixturePulse {
        0%,
        100% {
          opacity: 0.35;
          transform: scale(0.8);
        }

        50% {
          opacity: 1;
          transform: scale(1);
        }
      }

      .backLink {
        display: block;
        margin-top: 14px;
        text-decoration: none;
      }

      .backButton {
        width: 100%;
        min-height: 42px;
        margin: 0;
        border: none;
        border-radius: 9px;
        background: linear-gradient(105deg, #087eff, #155fb8);
        color: #ffffff;
        font-size: 10px;
        font-weight: 950;
        box-shadow:
          0 3px 0 #06417e,
          0 6px 12px rgba(0, 0, 0, 0.16);
      }

      .pageFooter {
        margin: 15px 0 0;
        color: #607b94;
        text-align: center;
        font-size: 9px;
        font-weight: 750;
      }

      @media (max-width: 700px) {
        .fixturesShell {
          padding-bottom: 20px;
        }

        .brandHeader {
          margin-bottom: 8px;
          padding: 4px 8px;
          gap: 9px;
        }

        .brandBadge {
          width: 49px;
        }

        .brandTitle {
          font-size: 23px;
          letter-spacing: -1px;
        }

        .brandLabel {
          margin-top: 4px;
          font-size: 8px;
          letter-spacing: 1.6px;
        }

        .pageHero {
          margin-bottom: 11px;
          padding: 13px 10px 11px;
        }

        .heroEyebrow {
          font-size: 7px;
          letter-spacing: 1.3px;
        }

        .pageHero h1 {
          font-size: 20px;
        }

        .pageHero p {
          font-size: 9px;
        }

        .heroRule {
          margin-top: 8px;
        }

        .weekPanel {
          padding: 11px;
        }

        .weekPanel h2,
        .fixturesHeading h2 {
          font-size: 15px;
        }

        .sectionEyebrow {
          font-size: 7px;
        }

        .fixtureCount,
        .livePill {
          min-height: 22px;
          padding: 0 7px;
          font-size: 7px;
        }

        .weekSelect {
          min-height: 40px;
          font-size: 11px;
        }

        .selectedWeekStrip {
          font-size: 8px;
        }

        .fixtureList {
          gap: 8px;
        }

        .fixtureCard {
          padding: 10px;
          border-radius: 11px;
        }

        .fixtureHeader {
          margin-bottom: 8px;
        }

        .fixtureNumber span {
          font-size: 7px;
        }

        .fixtureNumber strong {
          width: 25px;
          height: 25px;
          font-size: 11px;
        }

        .statusBadge {
          min-height: 22px;
          padding: 0 7px;
          font-size: 7px;
        }

        .matchup {
          grid-template-columns: minmax(0, 1fr) 30px minmax(0, 1fr);
          gap: 5px;
          margin-bottom: 8px;
        }

        .teamSide label {
          font-size: 7px;
        }

        .teamSide input {
          min-height: 39px;
          padding: 0 8px;
          font-size: 11px;
        }

        .versus {
          height: 39px;
        }

        .versus span {
          width: 25px;
          height: 25px;
          font-size: 9px;
        }

        .fixtureControls {
          grid-template-columns: 55px minmax(0, 1.2fr) minmax(0, 1fr);
          gap: 6px;
          padding-top: 8px;
        }

        .controlField span {
          font-size: 6px;
          letter-spacing: 0.45px;
        }

        .controlField input,
        .controlField select {
          min-height: 35px;
          padding: 0 6px;
          font-size: 9px;
        }

        .saveButton {
          grid-column: 1 / -1;
          min-height: 35px;
          font-size: 8px;
        }

        .messageBar {
          padding: 8px 10px;
          font-size: 9px;
        }

        .backButton {
          min-height: 38px;
          font-size: 9px;
        }
      }

      @media (max-width: 390px) {
        .fixtureControls {
          grid-template-columns: 50px minmax(0, 1.15fr) minmax(0, 0.9fr);
        }

        .controlField input,
        .controlField select {
          font-size: 8px;
        }

        .teamSide input {
          font-size: 10px;
        }
      }
    `}</style>
  );
}

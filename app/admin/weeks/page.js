"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function ManageMatchWeeksPage() {
  const router = useRouter();

  const [authorised, setAuthorised] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [weeks, setWeeks] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState("");

  const [matchDate, setMatchDate] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [deadline, setDeadline] = useState("");

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
        setMessage(
          "You do not have permission to access this page."
        );
        setLoading(false);
        return;
      }

      setAuthorised(true);

      const { data: weekData, error: weekError } = await supabase
        .from("match_weeks")
        .select("id, week_no, match_date, opens_at, deadline")
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
    if (!selectedWeekId || weeks.length === 0) return;

    const selectedWeek = weeks.find(
      (week) => week.id === Number(selectedWeekId)
    );

    if (!selectedWeek) return;

    setMatchDate(selectedWeek.match_date || "");
    setOpensAt(toLocalInputValue(selectedWeek.opens_at));
    setDeadline(toLocalInputValue(selectedWeek.deadline));
    setMessage("");
  }, [selectedWeekId, weeks]);

  function toLocalInputValue(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function formatSummaryDate(value) {
    if (!value) return "";

    const date = new Date(value);

    return date.toLocaleString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatMatchDate(value) {
    if (!value) return "Not set";

    const date = new Date(`${value}T12:00:00`);

    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  async function saveWeek() {
    if (!selectedWeekId) return;

    if (!matchDate || !opensAt || !deadline) {
      setMessage(
        "Please complete all three date/time fields."
      );
      return;
    }

    const openDate = new Date(opensAt);
    const deadlineDate = new Date(deadline);

    if (openDate >= deadlineDate) {
      setMessage(
        "The opening time must be before the deadline."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("match_weeks")
      .update({
        match_date: matchDate,
        opens_at: openDate.toISOString(),
        deadline: deadlineDate.toISOString(),
      })
      .eq("id", Number(selectedWeekId));

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setWeeks((current) =>
      current.map((week) =>
        week.id === Number(selectedWeekId)
          ? {
              ...week,
              match_date: matchDate,
              opens_at: openDate.toISOString(),
              deadline: deadlineDate.toISOString(),
            }
          : week
      )
    );

    setMessage("Match Week saved.");
    setSaving(false);
  }

  function Header() {
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

          <div className="brandLabel">
            ADMIN — MATCH WEEKS
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <main>
        <div className="container weeksShell">
          <Header />

          <div className="loadingCard">
            <div className="loadingPulse" />
            <p>Loading Match Weeks...</p>
          </div>
        </div>

        <PageStyles />
      </main>
    );
  }

  if (!authorised) {
    return (
      <main>
        <div className="container weeksShell">
          <Header />

          <section className="pageHero">
            <div className="heroLine" />
            <div className="heroEyebrow">
              COMPETITION CONTROL
            </div>
            <h1>Manage Match Weeks</h1>
          </section>

          <div className="accessCard">
            <h2>Access Denied</h2>
            <p>{message}</p>
          </div>

          <a href="/admin" className="backLink">
            <button className="backButton">
              ← Back to Admin
            </button>
          </a>
        </div>

        <PageStyles />
      </main>
    );
  }

  const selectedWeek = weeks.find(
    (week) => week.id === Number(selectedWeekId)
  );

  return (
    <main>
      <div className="container weeksShell">
        <Header />

        <section className="pageHero">
          <div className="heroLine" />

          <div className="heroEyebrow">
            THE PREDICTOR CONTROL CENTRE
          </div>

          <h1>Manage Match Weeks</h1>

          <p>
            Control match dates, opening times & prediction deadlines
          </p>

          <div className="heroRule">
            <span className="blueRule" />
            <span className="centreDot" />
            <span className="redRule" />
          </div>
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
              {message.toLowerCase().includes("saved")
                ? "✓"
                : "ⓘ"}
            </span>

            {message}
          </div>
        )}

        <section className="selectorPanel">
          <div className="panelHeading">
            <div>
              <div className="sectionEyebrow">
                MATCH WEEK
              </div>

              <h2>Select Match Week</h2>
            </div>

            <div className="weekCount">
              {weeks.length} WEEKS
            </div>
          </div>

          <select
            className="weekSelect"
            value={selectedWeekId}
            onChange={(e) =>
              setSelectedWeekId(e.target.value)
            }
          >
            {weeks.map((week) => (
              <option
                key={week.id}
                value={week.id}
              >
                Match Week {week.week_no}
              </option>
            ))}
          </select>

          {selectedWeek && (
            <div className="weekSummaryStrip">
              <span className="weekDot" />

              Match Week {selectedWeek.week_no}

              {matchDate && (
                <>
                  <span className="summaryDivider">
                    ·
                  </span>

                  {formatMatchDate(matchDate)}
                </>
              )}
            </div>
          )}
        </section>

        <section className="schedulePanel">
          <div className="panelHeading scheduleHeading">
            <div>
              <div className="sectionEyebrow">
                EDIT SCHEDULE
              </div>

              <h2>
                Match Week {selectedWeek?.week_no}
              </h2>
            </div>

            <div className="livePill">
              LIVE CONTROL
            </div>
          </div>

          <div className="scheduleGrid">
            <label className="scheduleField matchDateField">
              <span className="fieldLabel">
                MATCH DATE
              </span>

              <div className="dateControl">
                <span className="fieldIcon">
                  📅
                </span>

                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) =>
                    setMatchDate(e.target.value)
                  }
                />
              </div>
            </label>

            <label className="scheduleField openField">
              <span className="fieldLabel">
                PREDICTIONS OPEN
              </span>

              <div className="dateControl openControl">
                <span className="fieldIcon">
                  ▶
                </span>

                <input
                  type="datetime-local"
                  value={opensAt}
                  onChange={(e) =>
                    setOpensAt(e.target.value)
                  }
                />
              </div>
            </label>

            <label className="scheduleField deadlineField">
              <span className="fieldLabel">
                PREDICTION DEADLINE
              </span>

              <div className="dateControl deadlineControl">
                <span className="fieldIcon">
                  ■
                </span>

                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) =>
                    setDeadline(e.target.value)
                  }
                />
              </div>
            </label>
          </div>

          {opensAt && deadline && (
            <div className="predictionWindow">
              <div className="windowTitle">
                PREDICTION WINDOW
              </div>

              <div className="windowGrid">
                <div className="windowCard opensCard">
                  <div className="windowStatus">
                    <span className="statusDot blue" />
                    OPENS
                  </div>

                  <strong>
                    {formatSummaryDate(opensAt)}
                  </strong>
                </div>

                <div className="windowArrow">
                  →
                </div>

                <div className="windowCard closesCard">
                  <div className="windowStatus">
                    <span className="statusDot red" />
                    CLOSES
                  </div>

                  <strong>
                    {formatSummaryDate(deadline)}
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div className="weekInfo">
            <div className="infoIcon">
              i
            </div>

            <div>
              <strong>
                Match Week {selectedWeek?.week_no}
              </strong>

              <span>
                Predictions will only be accepted between the opening time and deadline shown above.
              </span>
            </div>
          </div>

          <button
            className="saveButton"
            onClick={saveWeek}
            disabled={saving}
          >
            {saving
              ? "SAVING MATCH WEEK..."
              : "SAVE MATCH WEEK"}
          </button>
        </section>

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

function PageStyles() {
  return (
    <style jsx global>{`
      .weeksShell {
        max-width: 820px !important;
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
        letter-spacing: 1.5px;
      }

      .pageHero {
        position: relative;
        overflow: hidden;
        margin-bottom: 12px;
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
          0 15px 34px rgba(0, 0, 0, 0.3);
      }

      .heroLine {
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
        background:
          linear-gradient(
            90deg,
            transparent,
            #168cff
          );
      }

      .redRule {
        background:
          linear-gradient(
            90deg,
            #ed1c24,
            transparent
          );
      }

      .centreDot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #ffffff;
        box-shadow:
          0 0 8px
          rgba(255, 255, 255, 0.65);
      }

      .selectorPanel,
      .schedulePanel {
        margin-bottom: 12px;
        padding: 14px;
        border-radius: 13px;
        background:
          radial-gradient(
            circle at 0 0,
            rgba(0, 119, 255, 0.1),
            transparent 35%
          ),
          radial-gradient(
            circle at 100% 100%,
            rgba(237, 28, 36, 0.06),
            transparent 30%
          ),
          linear-gradient(
            145deg,
            rgba(7, 28, 53, 0.98),
            rgba(3, 14, 28, 0.99)
          );
        box-shadow:
          0 12px 26px rgba(0, 0, 0, 0.25);
      }

      .selectorPanel {
        border:
          1px solid
          rgba(46, 133, 218, 0.48);
      }

      .schedulePanel {
        border:
          1px solid
          rgba(67, 130, 190, 0.38);
      }

      .panelHeading {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 11px;
      }

      .panelHeading h2 {
        margin: 2px 0 0;
        color: #ffffff;
        font-size: 18px;
        font-weight: 950;
      }

      .weekCount,
      .livePill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 24px;
        padding: 0 9px;
        border:
          1px solid
          rgba(38, 145, 247, 0.5);
        border-radius: 999px;
        background:
          rgba(5, 71, 130, 0.24);
        color: #55aeff;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 0.8px;
      }

      .weekSelect {
        width: 100%;
        min-height: 43px;
        padding: 0 12px;
        border:
          1px solid
          rgba(74, 151, 224, 0.62);
        border-radius: 9px;
        outline: none;
        background: #071a31;
        color: #ffffff;
        font-size: 13px;
        font-weight: 850;
      }

      .weekSummaryStrip {
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
        box-shadow:
          0 0 8px
          rgba(22, 140, 255, 0.7);
      }

      .summaryDivider {
        color: #5e7890;
      }

      .scheduleGrid {
        display: grid;
        grid-template-columns:
          repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .scheduleField {
        min-width: 0;
      }

      .fieldLabel {
        display: block;
        margin: 0 0 5px 2px;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 0.8px;
      }

      .matchDateField .fieldLabel {
        color: #cbd8e4;
      }

      .openField .fieldLabel {
        color: #5fb6ff;
      }

      .deadlineField .fieldLabel {
        color: #ff6b72;
      }

      .dateControl {
        display: grid;
        grid-template-columns:
          36px minmax(0, 1fr);
        overflow: hidden;
        min-height: 45px;
        border:
          1px solid
          rgba(158, 177, 195, 0.42);
        border-radius: 9px;
        background:
          rgba(3, 17, 33, 0.95);
      }

      .openControl {
        border-color:
          rgba(42, 151, 255, 0.48);
      }

      .deadlineControl {
        border-color:
          rgba(237, 49, 58, 0.48);
      }

      .fieldIcon {
        display: grid;
        place-items: center;
        border-right:
          1px solid
          rgba(83, 138, 189, 0.24);
        background:
          rgba(76, 92, 108, 0.25);
        color: #d5dfe8;
        font-size: 12px;
        font-weight: 950;
      }

      .openControl .fieldIcon {
        background:
          rgba(6, 73, 131, 0.34);
        color: #69bdff;
      }

      .deadlineControl .fieldIcon {
        background:
          rgba(115, 14, 22, 0.31);
        color: #ff7c82;
      }

      .dateControl input {
        width: 100%;
        min-width: 0;
        min-height: 43px;
        box-sizing: border-box;
        border: none;
        outline: none;
        padding: 0 9px;
        background: transparent;
        color: #ffffff;
        color-scheme: dark;
        font-size: 11px;
        font-weight: 850;
      }

      .dateControl input::-webkit-calendar-picker-indicator {
        filter: invert(1);
        opacity: 0.75;
      }

      .predictionWindow {
        margin-top: 13px;
        padding: 11px;
        border:
          1px solid
          rgba(75, 137, 193, 0.25);
        border-radius: 10px;
        background:
          rgba(3, 18, 34, 0.66);
      }

      .windowTitle {
        margin-bottom: 8px;
        color: #8298ad;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 1px;
      }

      .windowGrid {
        display: grid;
        grid-template-columns:
          minmax(0, 1fr)
          32px
          minmax(0, 1fr);
        align-items: center;
        gap: 7px;
      }

      .windowCard {
        padding: 10px;
        border-radius: 8px;
      }

      .opensCard {
        border:
          1px solid
          rgba(39, 148, 248, 0.4);
        background:
          rgba(7, 79, 145, 0.24);
      }

      .closesCard {
        border:
          1px solid
          rgba(237, 49, 58, 0.4);
        background:
          rgba(118, 14, 22, 0.22);
      }

      .windowStatus {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: 0.7px;
      }

      .opensCard .windowStatus {
        color: #69bbff;
      }

      .closesCard .windowStatus {
        color: #ff858c;
      }

      .statusDot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .statusDot.blue {
        background: #168cff;
        box-shadow:
          0 0 7px
          rgba(22, 140, 255, 0.7);
      }

      .statusDot.red {
        background: #ed1c24;
        box-shadow:
          0 0 7px
          rgba(237, 28, 36, 0.7);
      }

      .windowCard strong {
        display: block;
        margin-top: 4px;
        color: #ffffff;
        font-size: 11px;
        font-weight: 900;
      }

      .windowArrow {
        color: #708ca5;
        text-align: center;
        font-size: 18px;
        font-weight: 900;
      }

      .weekInfo {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        margin-top: 11px;
        padding: 10px;
        border:
          1px solid
          rgba(68, 133, 193, 0.23);
        border-radius: 9px;
        background:
          rgba(4, 22, 40, 0.64);
      }

      .infoIcon {
        display: grid;
        place-items: center;
        flex: 0 0 24px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background:
          rgba(13, 99, 178, 0.38);
        color: #67b8ff;
        font-size: 11px;
        font-weight: 950;
      }

      .weekInfo strong {
        display: block;
        color: #d9e5ef;
        font-size: 9px;
        font-weight: 900;
      }

      .weekInfo span {
        display: block;
        margin-top: 2px;
        color: #7f97ae;
        font-size: 8px;
        font-weight: 700;
        line-height: 1.4;
      }

      .saveButton {
        width: 100%;
        min-height: 43px;
        margin: 13px 0 0;
        border: none;
        border-radius: 9px;
        background:
          linear-gradient(
            105deg,
            #087eff,
            #155fb8
          );
        color: #ffffff;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: 0.7px;
        box-shadow:
          0 3px 0 #06417e,
          0 6px 14px rgba(0, 76, 160, 0.2);
      }

      .saveButton:disabled {
        opacity: 0.5;
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
        border:
          1px solid
          rgba(50, 194, 115, 0.48);
        background:
          rgba(19, 104, 59, 0.2);
        color: #8ee5b5;
      }

      .messageBar.warning {
        border:
          1px solid
          rgba(240, 165, 40, 0.45);
        background:
          rgba(117, 74, 10, 0.2);
        color: #ffd181;
      }

      .loadingCard,
      .accessCard {
        margin: 12px 0;
        padding: 20px;
        border:
          1px solid
          rgba(57, 137, 214, 0.42);
        border-radius: 13px;
        background:
          linear-gradient(
            145deg,
            rgba(7, 29, 55, 0.97),
            rgba(3, 14, 28, 0.99)
          );
        color: #ffffff;
        text-align: center;
      }

      .loadingCard p,
      .accessCard p {
        margin: 6px 0 0;
        color: #9eb4c9;
        font-size: 11px;
      }

      .loadingPulse {
        width: 12px;
        height: 12px;
        margin: 0 auto 8px;
        border-radius: 50%;
        background: #168cff;
        box-shadow:
          0 0 14px
          rgba(22, 140, 255, 0.75);
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
        background:
          linear-gradient(
            105deg,
            #087eff,
            #155fb8
          );
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
        .weeksShell {
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
          font-size: 7px;
          letter-spacing: 1px;
        }

        .pageHero {
          margin-bottom: 10px;
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

        .selectorPanel,
        .schedulePanel {
          padding: 10px;
        }

        .panelHeading {
          margin-bottom: 8px;
        }

        .panelHeading h2 {
          font-size: 15px;
        }

        .sectionEyebrow {
          font-size: 7px;
        }

        .weekCount,
        .livePill {
          min-height: 21px;
          font-size: 6px;
        }

        .weekSelect {
          min-height: 39px;
          font-size: 11px;
        }

        .weekSummaryStrip {
          font-size: 8px;
        }

        .scheduleGrid {
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .fieldLabel {
          font-size: 7px;
        }

        .dateControl {
          min-height: 40px;
        }

        .dateControl input {
          min-height: 38px;
          font-size: 10px;
        }

        .predictionWindow {
          margin-top: 10px;
          padding: 8px;
        }

        .windowGrid {
          grid-template-columns:
            minmax(0, 1fr)
            22px
            minmax(0, 1fr);
          gap: 5px;
        }

        .windowCard {
          padding: 8px;
        }

        .windowStatus {
          font-size: 6px;
        }

        .windowCard strong {
          font-size: 9px;
        }

        .windowArrow {
          font-size: 13px;
        }

        .weekInfo {
          margin-top: 9px;
          padding: 8px;
        }

        .weekInfo strong {
          font-size: 8px;
        }

        .weekInfo span {
          font-size: 7px;
        }

        .saveButton {
          min-height: 39px;
          margin-top: 10px;
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
        .brandTitle {
          font-size: 21px;
        }

        .brandBadge {
          width: 45px;
        }

        .windowGrid {
          grid-template-columns: 1fr;
        }

        .windowArrow {
          transform: rotate(90deg);
        }
      }
    `}</style>
  );
}

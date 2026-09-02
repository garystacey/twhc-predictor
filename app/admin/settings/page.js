"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function CompetitionSettingsPage() {
  const router = useRouter();

  const [authorised, setAuthorised] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);
  const [message, setMessage] = useState("");

  const [settingsId, setSettingsId] = useState(null);

  const [entryFee, setEntryFee] = useState("10");
  const [firstPrize, setFirstPrize] = useState("");
  const [secondPrize, setSecondPrize] = useState("");
  const [paymentDeadline, setPaymentDeadline] = useState("");

  const [
    predictionRemindersEnabled,
    setPredictionRemindersEnabled,
  ] = useState(false);

  useEffect(() => {
    async function loadSettings() {
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

      const { data, error } = await supabase
        .from("competition_settings")
        .select(
          "id, entry_fee, first_prize, second_prize, payment_deadline, prediction_reminders_enabled"
        )
        .limit(1)
        .single();

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setSettingsId(data.id);

      setEntryFee(
        data.entry_fee !== null &&
          data.entry_fee !== undefined
          ? String(data.entry_fee)
          : "10"
      );

      setFirstPrize(
        data.first_prize !== null &&
          data.first_prize !== undefined
          ? String(data.first_prize)
          : ""
      );

      setSecondPrize(
        data.second_prize !== null &&
          data.second_prize !== undefined
          ? String(data.second_prize)
          : ""
      );

      setPaymentDeadline(
        data.payment_deadline || ""
      );

      setPredictionRemindersEnabled(
        data.prediction_reminders_enabled === true
      );

      setLoading(false);
    }

    loadSettings();
  }, [router]);

  async function saveSettings() {
    if (!settingsId) return;

    if (!entryFee || Number(entryFee) < 0) {
      setMessage(
        "Please enter a valid entry fee."
      );
      return;
    }

    if (firstPrize && Number(firstPrize) < 0) {
      setMessage(
        "Please enter a valid 1st Prize amount."
      );
      return;
    }

    if (secondPrize && Number(secondPrize) < 0) {
      setMessage(
        "Please enter a valid 2nd Prize amount."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("competition_settings")
      .update({
        entry_fee: Number(entryFee),

        first_prize:
          firstPrize.trim() === ""
            ? null
            : Number(firstPrize),

        second_prize:
          secondPrize.trim() === ""
            ? null
            : Number(secondPrize),

        payment_deadline:
          paymentDeadline.trim() === ""
            ? null
            : paymentDeadline,

        prediction_reminders_enabled:
          predictionRemindersEnabled,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", settingsId);

    if (error) {
      setMessage(
        `Unable to save settings: ${error.message}`
      );

      setSaving(false);
      return;
    }

    setMessage(
      "Competition settings saved."
    );

    setSaving(false);
  }

  async function togglePredictionReminders() {
    if (!settingsId || savingReminder) {
      return;
    }

    const newValue =
      !predictionRemindersEnabled;

    setSavingReminder(true);
    setMessage("");

    const { data, error } = await supabase
      .from("competition_settings")
      .update({
        prediction_reminders_enabled:
          newValue,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", settingsId)
      .select(
        "prediction_reminders_enabled"
      )
      .single();

    if (error) {
      setMessage(
        `Unable to change reminder emails: ${error.message}`
      );

      setSavingReminder(false);
      return;
    }

    if (
      !data ||
      data.prediction_reminders_enabled !==
        newValue
    ) {
      setMessage(
        "The reminder setting could not be confirmed. Please try again."
      );

      setSavingReminder(false);
      return;
    }

    setPredictionRemindersEnabled(
      data.prediction_reminders_enabled
    );

    setMessage(
      newValue
        ? "Prediction reminder emails switched ON."
        : "Prediction reminder emails switched OFF."
    );

    setSavingReminder(false);
  }

  function formatPreview(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "TBC";
    }

    const amount = Number(value);

    if (Number.isNaN(amount)) {
      return "TBC";
    }

    if (Number.isInteger(amount)) {
      return `£${amount}`;
    }

    return `£${amount.toFixed(2)}`;
  }

  function formatDatePreview(value) {
    if (!value) {
      return "TBC";
    }

    const date =
      new Date(`${value}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
      return "TBC";
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
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
            ADMIN — COMPETITION SETTINGS
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <main>
        <div className="container settingsShell">
          <Header />

          <div className="loadingCard">
            <div className="loadingPulse" />
            <p>Loading settings...</p>
          </div>
        </div>

        <PageStyles />
      </main>
    );
  }

  if (!authorised) {
    return (
      <main>
        <div className="container settingsShell">
          <Header />

          <section className="pageHero">
            <div className="heroLine" />
            <div className="heroEyebrow">
              COMPETITION CONTROL
            </div>
            <h1>Competition Settings</h1>
          </section>

          <div className="accessCard">
            <h2>Access Denied</h2>
            <p>{message}</p>
          </div>

          <a
            href="/admin"
            className="backLink"
          >
            <button className="backButton">
              ← Back to Admin
            </button>
          </a>
        </div>

        <PageStyles />
      </main>
    );
  }

  return (
    <main>
      <div className="container settingsShell">
        <Header />

        <section className="pageHero">
          <div className="heroLine" />

          <div className="heroEyebrow">
            THE PREDICTOR CONTROL CENTRE
          </div>

          <h1>Competition Settings</h1>

          <p>
            Entry fee, prize money, payments & reminders
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
              message
                .toLowerCase()
                .includes("saved") ||
              message
                .toLowerCase()
                .includes("switched")
                ? "success"
                : "warning"
            }`}
          >
            <span>
              {message
                .toLowerCase()
                .includes("saved") ||
              message
                .toLowerCase()
                .includes("switched")
                ? "✓"
                : "ⓘ"}
            </span>

            {message}
          </div>
        )}

        <section className="overviewPanel">
          <div className="panelHeading">
            <div>
              <div className="sectionEyebrow">
                CURRENT SETTINGS
              </div>

              <h2>Competition Overview</h2>
            </div>

            <div className="livePill">
              LIVE
            </div>
          </div>

          <div className="overviewGrid">
            <div className="overviewCard entry">
              <span>ENTRY</span>
              <strong>
                {formatPreview(entryFee)}
              </strong>
            </div>

            <div className="overviewCard gold">
              <span>1ST PRIZE</span>
              <strong>
                {formatPreview(firstPrize)}
              </strong>
            </div>

            <div className="overviewCard silver">
              <span>2ND PRIZE</span>
              <strong>
                {formatPreview(secondPrize)}
              </strong>
            </div>

            <div className="overviewCard deadline">
              <span>PAYMENT DEADLINE</span>
              <strong className="dateValue">
                {formatDatePreview(
                  paymentDeadline
                )}
              </strong>
            </div>

            <div
              className={`overviewCard reminder ${
                predictionRemindersEnabled
                  ? "reminderOn"
                  : "reminderOff"
              }`}
            >
              <span>EMAIL REMINDERS</span>

              <strong>
                {predictionRemindersEnabled
                  ? "ON"
                  : "OFF"}
              </strong>
            </div>
          </div>
        </section>

        <section className="settingsPanel">
          <div className="panelHeading">
            <div>
              <div className="sectionEyebrow">
                COMPETITION SETTINGS
              </div>

              <h2>
                Entry, Prizes & Payment
              </h2>
            </div>
          </div>

          <div className="formGrid">
            <label className="settingField">
              <span className="fieldLabel">
                ENTRY FEE (£)
              </span>

              <div className="moneyInput">
                <span>£</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={entryFee}
                  onChange={(e) =>
                    setEntryFee(
                      e.target.value
                    )
                  }
                />
              </div>
            </label>

            <label className="settingField">
              <span className="fieldLabel goldText">
                1ST PRIZE (£)
              </span>

              <div className="moneyInput goldInput">
                <span>£</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={firstPrize}
                  onChange={(e) =>
                    setFirstPrize(
                      e.target.value
                    )
                  }
                  placeholder="TBC"
                />
              </div>
            </label>

            <label className="settingField">
              <span className="fieldLabel silverText">
                2ND PRIZE (£)
              </span>

              <div className="moneyInput silverInput">
                <span>£</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={secondPrize}
                  onChange={(e) =>
                    setSecondPrize(
                      e.target.value
                    )
                  }
                  placeholder="TBC"
                />
              </div>
            </label>

            <label className="settingField">
              <span className="fieldLabel redText">
                PAYMENT CLOSING DATE
              </span>

              <input
                className="dateInput"
                type="date"
                value={paymentDeadline}
                onChange={(e) =>
                  setPaymentDeadline(
                    e.target.value
                  )
                }
              />

              <small>
                Unpaid entrants will be reminded
                on the Predictor home page.
              </small>
            </label>
          </div>

          <div
            className={`reminderPanel ${
              predictionRemindersEnabled
                ? "enabled"
                : "disabled"
            }`}
          >
            <div className="reminderTop">
              <div className="reminderIcon">
                ✉
              </div>

              <div className="reminderCopy">
                <div className="reminderTitle">
                  Prediction Reminder Emails
                </div>

                <div className="reminderDescription">
                  Automatically remind entrants
                  who have not completed all their
                  predictions before the Match Week
                  deadline.
                </div>
              </div>

              <button
                type="button"
                disabled={savingReminder}
                onClick={
                  togglePredictionReminders
                }
                className={`toggleButton ${
                  predictionRemindersEnabled
                    ? "toggleOn"
                    : "toggleOff"
                }`}
              >
                <span className="toggleTrack">
                  <span className="toggleKnob" />
                </span>

                <strong>
                  {savingReminder
                    ? "SAVING"
                    : predictionRemindersEnabled
                    ? "ON"
                    : "OFF"}
                </strong>
              </button>
            </div>

            <div className="reminderInfo">
              <span className="infoDot" />

              <span>
                The reminder checks only the
                specific Match Week approaching
                its deadline. Later open weeks are
                ignored.
              </span>
            </div>

            <div
              className={`reminderStatus ${
                predictionRemindersEnabled
                  ? "statusOn"
                  : "statusOff"
              }`}
            >
              <span
                className="statusLight"
              />

              {predictionRemindersEnabled
                ? "AUTOMATIC REMINDERS ENABLED"
                : "AUTOMATIC REMINDERS DISABLED"}
            </div>
          </div>

          <div className="infoPanel">
            <div className="infoIcon">
              i
            </div>

            <div>
              Leave either prize field blank
              and the Rules page will display{" "}
              <strong>TBC</strong>.
              <br />
              Leave the payment closing date
              blank if you do not want to show
              a payment deadline.
              <br />
              The reminder email switch saves
              immediately when changed.
            </div>
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="saveButton"
          >
            {saving
              ? "SAVING SETTINGS..."
              : "SAVE COMPETITION SETTINGS"}
          </button>
        </section>

        <a
          href="/admin"
          className="backLink"
        >
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
      .settingsShell {
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
          drop-shadow(
            0 0 10px
            rgba(0, 125, 255, 0.24)
          )
          drop-shadow(
            0 4px 8px
            rgba(0, 0, 0, 0.42)
          );
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
          0 2px 8px
          rgba(0, 0, 0, 0.45),
          0 0 12px
          rgba(255, 255, 255, 0.08);
      }

      .brandTitle span {
        color: #ed1c24;
        text-shadow:
          0 0 14px
          rgba(237, 28, 36, 0.46);
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
        border:
          1px solid
          rgba(72, 145, 215, 0.34);
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
          -7px 0 24px
          rgba(0, 105, 255, 0.08),
          7px 0 24px
          rgba(237, 28, 36, 0.07),
          0 15px 34px
          rgba(0, 0, 0, 0.3),
          inset 0 1px 0
          rgba(255, 255, 255, 0.035);
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

      .overviewPanel,
      .settingsPanel {
        position: relative;
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
          0 12px 26px
          rgba(0, 0, 0, 0.25),
          inset 0 1px 0
          rgba(255, 255, 255, 0.03);
      }

      .overviewPanel {
        border:
          1px solid
          rgba(46, 133, 218, 0.48);
      }

      .settingsPanel {
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

      .overviewGrid {
        display: grid;
        grid-template-columns:
          repeat(5, 1fr);
        gap: 7px;
      }

      .overviewCard {
        min-width: 0;
        padding: 11px 5px 10px;
        border-radius: 9px;
        text-align: center;
      }

      .overviewCard span {
        display: block;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: 0.55px;
      }

      .overviewCard strong {
        display: block;
        margin-top: 4px;
        color: #ffffff;
        font-size: 18px;
        line-height: 1.1;
        font-weight: 950;
      }

      .overviewCard .dateValue {
        font-size: 12px;
      }

      .overviewCard.entry {
        border:
          1px solid
          rgba(41, 151, 255, 0.45);
        background:
          linear-gradient(
            145deg,
            rgba(7, 79, 145, 0.68),
            rgba(4, 43, 81, 0.76)
          );
        color: #9cd2ff;
      }

      .overviewCard.gold {
        border:
          1px solid
          rgba(238, 182, 25, 0.56);
        background:
          linear-gradient(
            145deg,
            rgba(151, 102, 6, 0.7),
            rgba(88, 61, 7, 0.82)
          );
        color: #ffe28a;
      }

      .overviewCard.silver {
        border:
          1px solid
          rgba(164, 182, 200, 0.44);
        background:
          linear-gradient(
            145deg,
            rgba(84, 102, 120, 0.68),
            rgba(50, 64, 78, 0.82)
          );
        color: #d8e2eb;
      }

      .overviewCard.deadline {
        border:
          1px solid
          rgba(237, 49, 58, 0.48);
        background:
          linear-gradient(
            145deg,
            rgba(145, 15, 24, 0.7),
            rgba(86, 10, 17, 0.82)
          );
        color: #ff9ca1;
      }

      .overviewCard.reminderOn {
        border:
          1px solid
          rgba(53, 207, 121, 0.48);
        background:
          linear-gradient(
            145deg,
            rgba(15, 116, 61, 0.72),
            rgba(10, 74, 41, 0.84)
          );
        color: #9ae6bb;
      }

      .overviewCard.reminderOff {
        border:
          1px solid
          rgba(137, 153, 168, 0.36);
        background:
          linear-gradient(
            145deg,
            rgba(73, 86, 100, 0.68),
            rgba(43, 53, 64, 0.82)
          );
        color: #c2ced8;
      }

      .formGrid {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 11px;
      }

      .settingField {
        min-width: 0;
      }

      .fieldLabel {
        display: block;
        margin: 0 0 5px 2px;
        color: #5fb6ff;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 0.8px;
      }

      .goldText {
        color: #f5ca50;
      }

      .silverText {
        color: #c7d3de;
      }

      .redText {
        color: #ff6b72;
      }

      .moneyInput {
        display: grid;
        grid-template-columns: 34px 1fr;
        min-height: 43px;
        overflow: hidden;
        border:
          1px solid
          rgba(71, 146, 216, 0.48);
        border-radius: 8px;
        background:
          rgba(3, 17, 33, 0.92);
      }

      .moneyInput > span {
        display: grid;
        place-items: center;
        border-right:
          1px solid
          rgba(71, 146, 216, 0.28);
        background:
          rgba(5, 59, 108, 0.38);
        color: #6cbdff;
        font-weight: 950;
      }

      .goldInput {
        border-color:
          rgba(221, 171, 40, 0.45);
      }

      .goldInput > span {
        border-right-color:
          rgba(221, 171, 40, 0.28);
        background:
          rgba(113, 77, 6, 0.36);
        color: #ffd966;
      }

      .silverInput {
        border-color:
          rgba(157, 178, 197, 0.4);
      }

      .silverInput > span {
        border-right-color:
          rgba(157, 178, 197, 0.24);
        background:
          rgba(72, 84, 96, 0.4);
        color: #d4dee7;
      }

      .moneyInput input,
      .dateInput {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        border: none;
        outline: none;
        background:
          rgba(3, 17, 33, 0.92);
        color: #ffffff;
        font-size: 13px;
        font-weight: 850;
      }

      .moneyInput input {
        padding: 0 10px;
      }

      .dateInput {
        min-height: 43px;
        padding: 0 10px;
        border:
          1px solid
          rgba(237, 49, 58, 0.4);
        border-radius: 8px;
      }

      .moneyInput:focus-within,
      .dateInput:focus {
        border-color: #2999ff;
        box-shadow:
          0 0 0 2px
          rgba(41, 153, 255, 0.1);
      }

      .settingField small {
        display: block;
        margin-top: 5px;
        color: #748da5;
        font-size: 8px;
        font-weight: 700;
        line-height: 1.35;
      }

      .reminderPanel {
        margin-top: 13px;
        padding: 12px;
        border-radius: 10px;
        transition: 0.2s ease;
      }

      .reminderPanel.enabled {
        border:
          1px solid
          rgba(53, 207, 121, 0.4);
        background:
          radial-gradient(
            circle at 100% 0,
            rgba(53, 207, 121, 0.11),
            transparent 32%
          ),
          rgba(6, 32, 28, 0.66);
      }

      .reminderPanel.disabled {
        border:
          1px solid
          rgba(115, 139, 161, 0.28);
        background:
          rgba(11, 28, 45, 0.72);
      }

      .reminderTop {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .reminderIcon {
        display: grid;
        place-items: center;
        flex: 0 0 36px;
        width: 36px;
        height: 36px;
        border:
          1px solid
          rgba(70, 145, 214, 0.4);
        border-radius: 9px;
        background:
          rgba(7, 63, 113, 0.35);
        color: #6abbff;
        font-size: 16px;
        font-weight: 900;
      }

      .reminderCopy {
        flex: 1;
        min-width: 0;
      }

      .reminderTitle {
        color: #ffffff;
        font-size: 12px;
        font-weight: 950;
      }

      .reminderDescription {
        margin-top: 3px;
        color: #829ab0;
        font-size: 8px;
        font-weight: 700;
        line-height: 1.4;
      }

      .toggleButton {
        display: flex;
        align-items: center;
        gap: 7px;
        width: auto;
        min-width: 91px;
        min-height: 38px;
        margin: 0;
        padding: 5px 8px;
        border: none;
        border-radius: 9px;
        color: #ffffff;
        font-size: 8px;
        font-weight: 950;
        cursor: pointer;
      }

      .toggleOn {
        background:
          linear-gradient(
            145deg,
            #198c50,
            #11653a
          );
        box-shadow:
          0 3px 0 #0a4829;
      }

      .toggleOff {
        background:
          linear-gradient(
            145deg,
            #627587,
            #435568
          );
        box-shadow:
          0 3px 0 #2c3c4d;
      }

      .toggleTrack {
        position: relative;
        display: block;
        width: 31px;
        height: 17px;
        border-radius: 999px;
        background:
          rgba(1, 12, 22, 0.48);
      }

      .toggleKnob {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: #ffffff;
        transition: 0.2s ease;
      }

      .toggleOn .toggleKnob {
        transform: translateX(14px);
      }

      .reminderInfo {
        display: flex;
        align-items: flex-start;
        gap: 7px;
        margin-top: 10px;
        padding: 8px 9px;
        border-radius: 7px;
        background:
          rgba(2, 14, 27, 0.5);
        color: #7992aa;
        font-size: 8px;
        font-weight: 700;
        line-height: 1.4;
      }

      .infoDot {
        flex: 0 0 6px;
        width: 6px;
        height: 6px;
        margin-top: 2px;
        border-radius: 50%;
        background: #168cff;
        box-shadow:
          0 0 7px
          rgba(22, 140, 255, 0.6);
      }

      .reminderStatus {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: 0.5px;
      }

      .statusOn {
        color: #78dda5;
      }

      .statusOff {
        color: #8196aa;
      }

      .statusLight {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        box-shadow:
          0 0 7px currentColor;
      }

      .infoPanel {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        margin-top: 12px;
        padding: 10px;
        border:
          1px solid
          rgba(81, 137, 188, 0.25);
        border-radius: 8px;
        background:
          rgba(5, 24, 43, 0.62);
        color: #7d96ad;
        font-size: 8px;
        font-weight: 700;
        line-height: 1.45;
      }

      .infoIcon {
        display: grid;
        place-items: center;
        flex: 0 0 22px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background:
          rgba(13, 99, 178, 0.38);
        color: #67b8ff;
        font-size: 11px;
        font-weight: 950;
      }

      .infoPanel strong {
        color: #ffffff;
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
        letter-spacing: 0.4px;
        box-shadow:
          0 3px 0 #06417e,
          0 6px 14px
          rgba(0, 76, 160, 0.2);
        cursor: pointer;
      }

      .saveButton:disabled {
        opacity: 0.5;
        cursor: default;
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

      .accessCard h2 {
        margin: 0;
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
        animation:
          settingsPulse
          1.2s infinite ease-in-out;
      }

      @keyframes settingsPulse {
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
          0 6px 12px
          rgba(0, 0, 0, 0.16);
      }

      .pageFooter {
        margin: 15px 0 0;
        color: #607b94;
        text-align: center;
        font-size: 9px;
        font-weight: 750;
      }

      @media (max-width: 700px) {
        .settingsShell {
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

        .heroRule {
          margin-top: 8px;
        }

        .overviewPanel,
        .settingsPanel {
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

        .livePill {
          min-height: 21px;
          font-size: 6px;
        }

        .overviewGrid {
          grid-template-columns:
            repeat(5, 1fr);
          gap: 4px;
        }

        .overviewCard {
          padding: 8px 2px 7px;
          border-radius: 7px;
        }

        .overviewCard span {
          font-size: 5px;
          letter-spacing: 0.2px;
        }

        .overviewCard strong {
          margin-top: 3px;
          font-size: 13px;
        }

        .overviewCard .dateValue {
          font-size: 8px;
        }

        .formGrid {
          gap: 8px;
        }

        .fieldLabel {
          font-size: 7px;
        }

        .moneyInput,
        .dateInput {
          min-height: 39px;
        }

        .moneyInput {
          grid-template-columns: 30px 1fr;
        }

        .moneyInput input,
        .dateInput {
          font-size: 11px;
        }

        .settingField small {
          font-size: 7px;
        }

        .reminderPanel {
          margin-top: 10px;
          padding: 9px;
        }

        .reminderTop {
          gap: 7px;
        }

        .reminderIcon {
          flex-basis: 31px;
          width: 31px;
          height: 31px;
          font-size: 13px;
        }

        .reminderTitle {
          font-size: 10px;
        }

        .reminderDescription {
          font-size: 7px;
        }

        .toggleButton {
          min-width: 78px;
          min-height: 34px;
          gap: 5px;
          padding: 4px 6px;
          font-size: 7px;
        }

        .toggleTrack {
          width: 27px;
          height: 15px;
        }

        .toggleKnob {
          width: 9px;
          height: 9px;
        }

        .toggleOn .toggleKnob {
          transform:
            translateX(12px);
        }

        .reminderInfo {
          margin-top: 8px;
          padding: 7px;
          font-size: 7px;
        }

        .reminderStatus {
          font-size: 6px;
        }

        .infoPanel {
          margin-top: 9px;
          padding: 8px;
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

      @media (max-width: 440px) {
        .formGrid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
        }

        .overviewGrid {
          grid-template-columns:
            repeat(5, minmax(0, 1fr));
        }

        .overviewCard {
          min-width: 0;
        }

        .reminderDescription {
          line-height: 1.3;
        }
      }

      @media (max-width: 370px) {
        .brandTitle {
          font-size: 21px;
        }

        .brandLabel {
          font-size: 6px;
        }

        .overviewCard strong {
          font-size: 11px;
        }

        .overviewCard .dateValue {
          font-size: 7px;
        }

        .toggleButton {
          min-width: 70px;
        }

        .reminderIcon {
          display: none;
        }
      }
    `}</style>
  );
}

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

      if (
        profileError ||
        !profile ||
        profile.role !== "admin"
      ) {
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
      setMessage("Please enter a valid entry fee.");
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

        updated_at: new Date().toISOString(),
      })
      .eq("id", settingsId);

    if (error) {
      setMessage(
        `Unable to save settings: ${error.message}`
      );
      setSaving(false);
      return;
    }

    setMessage("Competition settings saved.");
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
    if (!value) return "TBC";

    const date = new Date(
      `${value}T12:00:00`
    );

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
      <div className="settingsBrand">
        <div className="brandBlueGlow" />
        <div className="brandRedGlow" />

        <img
          src="/TWHC-badge-white.png"
          alt="Telford & Wrekin Hockey Club"
          className="settingsBadge"
        />

        <div className="settingsBrandText">
          <div className="predictorWord">
            THE PREDICTO<span>R</span>
          </div>

          <div className="adminWord">
            ADMIN — COMPETITION SETTINGS
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <main>
        <div className="container settingsPage">
          <Header />

          <div className="loadingPanel">
            <div className="loadingDot" />
            Loading settings...
          </div>
        </div>

        <Styles />
      </main>
    );
  }

  if (!authorised) {
    return (
      <main>
        <div className="container settingsPage">
          <Header />

          <div className="accessPanel">
            <h2>Access Denied</h2>
            <p>{message}</p>
          </div>

          <a
            href="/admin"
            className="navLink"
          >
            <button className="backAdmin">
              ← Back to Admin
            </button>
          </a>
        </div>

        <Styles />
      </main>
    );
  }

  return (
    <main>
      <div className="container settingsPage">
        <Header />

        {/* HERO */}

        <section className="settingsHero">
          <div className="heroTopBeam" />

          <div className="heroLabel">
            THE PREDICTOR CONTROL CENTRE
          </div>

          <h1>Competition Settings</h1>

          <p>
            Entry fee, prizes, payments & reminders
          </p>

          <div className="heroDivider">
            <span />
            <i />
            <strong />
          </div>
        </section>

        {/* MESSAGE */}

        {message && (
          <div
            className={`settingsMessage ${
              message
                .toLowerCase()
                .includes("saved") ||
              message
                .toLowerCase()
                .includes("switched")
                ? "good"
                : "warn"
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
                : "!"}
            </span>

            {message}
          </div>
        )}

        {/* OVERVIEW */}

        <section className="overviewSection">
          <div className="sectionHeader">
            <div>
              <div className="sectionLabel">
                CURRENT SETTINGS
              </div>

              <h2>Competition Overview</h2>
            </div>

            <div className="liveBadge">
              <i />
              LIVE
            </div>
          </div>

          <div className="overviewCards">
            <div className="miniCard entryCard">
              <span>ENTRY FEE</span>
              <strong>
                {formatPreview(entryFee)}
              </strong>
            </div>

            <div className="miniCard goldCard">
              <span>1ST PRIZE</span>
              <strong>
                {formatPreview(firstPrize)}
              </strong>
            </div>

            <div className="miniCard silverCard">
              <span>2ND PRIZE</span>
              <strong>
                {formatPreview(secondPrize)}
              </strong>
            </div>

            <div className="miniCard deadlineCard">
              <span>PAYMENT DEADLINE</span>
              <strong className="smallValue">
                {formatDatePreview(
                  paymentDeadline
                )}
              </strong>
            </div>

            <div
              className={`miniCard reminderCard ${
                predictionRemindersEnabled
                  ? "on"
                  : "off"
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

        {/* MAIN SETTINGS */}

        <section className="mainSettings">
          <div className="sectionHeader">
            <div>
              <div className="sectionLabel">
                COMPETITION SETTINGS
              </div>

              <h2>
                Entry, Prizes & Payment
              </h2>
            </div>
          </div>

          <div className="settingsGrid">
            {/* ENTRY */}

            <label className="fieldBlock blueField">
              <span className="fieldTitle">
                ENTRY FEE
              </span>

              <div className="fieldControl">
                <div className="prefix">
                  £
                </div>

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

            {/* FIRST */}

            <label className="fieldBlock goldField">
              <span className="fieldTitle">
                1ST PRIZE
              </span>

              <div className="fieldControl">
                <div className="prefix">
                  £
                </div>

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

            {/* SECOND */}

            <label className="fieldBlock silverField">
              <span className="fieldTitle">
                2ND PRIZE
              </span>

              <div className="fieldControl">
                <div className="prefix">
                  £
                </div>

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

            {/* DATE */}

            <label className="fieldBlock redField">
              <span className="fieldTitle">
                PAYMENT CLOSING DATE
              </span>

              <div className="dateControl">
                <span className="calendarIcon">
                  ◫
                </span>

                <input
                  type="date"
                  value={paymentDeadline}
                  onChange={(e) =>
                    setPaymentDeadline(
                      e.target.value
                    )
                  }
                />
              </div>

              <small>
                Unpaid entrants will be reminded
                on the Predictor home page.
              </small>
            </label>
          </div>

          {/* REMINDER */}

          <section
            className={`emailReminder ${
              predictionRemindersEnabled
                ? "emailOn"
                : "emailOff"
            }`}
          >
            <div className="emailHeader">
              <div className="mailIcon">
                ✉
              </div>

              <div className="emailText">
                <strong>
                  Prediction Reminder Emails
                </strong>

                <span>
                  Remind entrants who have not
                  completed their predictions
                  before the deadline.
                </span>
              </div>

              <button
                type="button"
                disabled={savingReminder}
                onClick={
                  togglePredictionReminders
                }
                className={`switchButton ${
                  predictionRemindersEnabled
                    ? "switchOn"
                    : "switchOff"
                }`}
              >
                <span className="switchTrack">
                  <i />
                </span>

                <strong>
                  {savingReminder
                    ? "..."
                    : predictionRemindersEnabled
                    ? "ON"
                    : "OFF"}
                </strong>
              </button>
            </div>

            <div className="emailNote">
              <span className="blueBullet" />

              <p>
                Checks only the specific Match
                Week approaching its deadline.
                Later open Match Weeks are ignored.
              </p>
            </div>

            <div
              className={`emailStatus ${
                predictionRemindersEnabled
                  ? "statusEnabled"
                  : "statusDisabled"
              }`}
            >
              <span />

              {predictionRemindersEnabled
                ? "AUTOMATIC REMINDERS ENABLED"
                : "AUTOMATIC REMINDERS DISABLED"}
            </div>
          </section>

          {/* INFO */}

          <div className="helpBox">
            <div className="helpIcon">
              i
            </div>

            <div>
              Leave either prize field blank
              and the Rules page will display{" "}
              <strong>TBC</strong>.
              <br />
              Leave the payment closing date
              blank if you do not want a
              payment deadline.
              <br />
              The reminder switch saves
              immediately when changed.
            </div>
          </div>

          <button
            className="saveSettingsButton"
            onClick={saveSettings}
            disabled={saving}
          >
            <span>
              {saving
                ? "SAVING SETTINGS..."
                : "SAVE COMPETITION SETTINGS"}
            </span>
          </button>
        </section>

        <a
          href="/admin"
          className="navLink"
        >
          <button className="backAdmin">
            ← Back to Admin
          </button>
        </a>

        <p className="settingsFooter">
          Telford & Wrekin Hockey Club
        </p>
      </div>

      <Styles />
    </main>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      .settingsPage {
        max-width: 820px !important;
        padding-bottom: 28px;
      }

      /* =====================================
         BRAND
      ===================================== */

      .settingsBrand {
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

      .brandBlueGlow,
      .brandRedGlow {
        position: absolute;
        width: 95px;
        height: 50px;
        top: 50%;
        transform: translateY(-50%);
        border-radius: 50%;
        filter: blur(28px);
        opacity: 0.32;
        pointer-events: none;
      }

      .brandBlueGlow {
        left: -18px;
        background: #087eff;
      }

      .brandRedGlow {
        right: -20px;
        background: #ed1c24;
      }

      .settingsBadge {
        position: relative;
        z-index: 2;
        width: 60px;
        height: auto;
        display: block;
        margin: 0;
        filter:
          drop-shadow(
            0 0 9px
            rgba(0, 126, 255, 0.2)
          )
          drop-shadow(
            0 5px 8px
            rgba(0, 0, 0, 0.4)
          );
      }

      .settingsBrandText {
        position: relative;
        z-index: 2;
        text-align: left;
      }

      .predictorWord {
        color: #fff;
        font-size: 28px;
        line-height: 0.95;
        font-weight: 950;
        letter-spacing: -1.3px;
        white-space: nowrap;
      }

      .predictorWord span {
        color: #ed1c24;
        text-shadow:
          0 0 14px
          rgba(237, 28, 36, 0.5);
      }

      .adminWord {
        margin-top: 6px;
        color: #9db4ca;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1.6px;
      }

      /* =====================================
         HERO
      ===================================== */

      .settingsHero {
        position: relative;
        overflow: hidden;
        padding: 18px 16px 15px;
        margin-bottom: 13px;
        border-radius: 16px;
        border:
          1px solid
          rgba(69, 143, 213, 0.38);
        text-align: center;
        background:
          radial-gradient(
            circle at 0 0,
            rgba(0, 119, 255, 0.17),
            transparent 42%
          ),
          radial-gradient(
            circle at 100% 100%,
            rgba(237, 28, 36, 0.13),
            transparent 42%
          ),
          linear-gradient(
            145deg,
            #071e38,
            #030e1c
          );
        box-shadow:
          0 14px 32px
          rgba(0, 0, 0, 0.29);
      }

      .heroTopBeam {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background:
          linear-gradient(
            90deg,
            #0788ff 0%,
            #0788ff 42%,
            #ffffff 50%,
            #ed1c24 58%,
            #ed1c24 100%
          );
      }

      .heroLabel,
      .sectionLabel {
        color: #2f9cff;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 2px;
      }

      .settingsHero h1 {
        margin: 5px 0 0;
        color: #fff;
        font-size: 25px;
        line-height: 1.05;
        font-weight: 950;
      }

      .settingsHero p {
        margin: 6px 0 0;
        color: #96acc1;
        font-size: 11px;
        font-weight: 750;
      }

      .heroDivider {
        display: grid;
        grid-template-columns:
          1fr 7px 1fr;
        align-items: center;
        gap: 9px;
        max-width: 330px;
        margin: 12px auto 0;
      }

      .heroDivider span {
        height: 2px;
        background:
          linear-gradient(
            90deg,
            transparent,
            #168cff
          );
      }

      .heroDivider strong {
        height: 2px;
        background:
          linear-gradient(
            90deg,
            #ed1c24,
            transparent
          );
      }

      .heroDivider i {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #fff;
        box-shadow:
          0 0 8px
          rgba(255, 255, 255, 0.7);
      }

      /* =====================================
         PANELS
      ===================================== */

      .overviewSection,
      .mainSettings {
        position: relative;
        padding: 15px;
        margin-bottom: 13px;
        border-radius: 15px;
        border:
          1px solid
          rgba(56, 137, 214, 0.4);
        background:
          radial-gradient(
            circle at 0 0,
            rgba(0, 123, 255, 0.09),
            transparent 38%
          ),
          linear-gradient(
            145deg,
            rgba(7, 29, 53, 0.99),
            rgba(3, 14, 27, 0.99)
          );
        box-shadow:
          0 12px 28px
          rgba(0, 0, 0, 0.25);
      }

      .sectionHeader {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 10px;
        margin-bottom: 12px;
      }

      .sectionHeader h2 {
        margin: 3px 0 0;
        color: #fff;
        font-size: 19px;
        font-weight: 950;
      }

      .liveBadge {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 28px;
        padding: 0 11px;
        border:
          1px solid
          rgba(37, 148, 249, 0.5);
        border-radius: 999px;
        background:
          rgba(4, 72, 132, 0.25);
        color: #60b6ff;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 0.8px;
      }

      .liveBadge i {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #168cff;
        box-shadow:
          0 0 8px #168cff;
      }

      /* =====================================
         OVERVIEW
      ===================================== */

      .overviewCards {
        display: grid;
        grid-template-columns:
          repeat(5, minmax(0, 1fr));
        gap: 8px;
      }

      .miniCard {
        min-width: 0;
        min-height: 73px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 8px 5px;
        border-radius: 10px;
        text-align: center;
      }

      .miniCard > span {
        font-size: 6px;
        font-weight: 950;
        letter-spacing: 0.45px;
      }

      .miniCard > strong {
        margin-top: 5px;
        color: #fff;
        font-size: 17px;
        line-height: 1;
        font-weight: 950;
      }

      .miniCard .smallValue {
        font-size: 10px;
        line-height: 1.15;
      }

      .entryCard {
        border:
          1px solid
          rgba(26, 150, 255, 0.52);
        background:
          linear-gradient(
            145deg,
            rgba(8, 87, 158, 0.65),
            rgba(5, 44, 82, 0.82)
          );
        color: #9dd5ff;
      }

      .goldCard {
        border:
          1px solid
          rgba(235, 181, 36, 0.55);
        background:
          linear-gradient(
            145deg,
            rgba(148, 100, 6, 0.7),
            rgba(77, 53, 4, 0.85)
          );
        color: #ffe181;
      }

      .silverCard {
        border:
          1px solid
          rgba(166, 185, 203, 0.48);
        background:
          linear-gradient(
            145deg,
            rgba(81, 101, 119, 0.7),
            rgba(45, 58, 72, 0.85)
          );
        color: #d9e4ec;
      }

      .deadlineCard {
        border:
          1px solid
          rgba(237, 40, 51, 0.52);
        background:
          linear-gradient(
            145deg,
            rgba(137, 18, 27, 0.72),
            rgba(77, 8, 14, 0.85)
          );
        color: #ff9ca1;
      }

      .reminderCard.on {
        border:
          1px solid
          rgba(51, 210, 122, 0.52);
        background:
          linear-gradient(
            145deg,
            rgba(16, 121, 63, 0.75),
            rgba(8, 67, 36, 0.88)
          );
        color: #9ce9bc;
      }

      .reminderCard.off {
        border:
          1px solid
          rgba(137, 153, 168, 0.4);
        background:
          linear-gradient(
            145deg,
            rgba(71, 84, 97, 0.72),
            rgba(38, 47, 56, 0.88)
          );
        color: #cad4dc;
      }

      /* =====================================
         FORM
      ===================================== */

      .settingsGrid {
        display: grid;
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
        gap: 11px;
      }

      .fieldBlock {
        display: block;
        min-width: 0;
      }

      .fieldTitle {
        display: block;
        margin: 0 0 6px 3px;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 1.2px;
      }

      .blueField .fieldTitle {
        color: #58b1ff;
      }

      .goldField .fieldTitle {
        color: #f4ca51;
      }

      .silverField .fieldTitle {
        color: #cbd6df;
      }

      .redField .fieldTitle {
        color: #ff6f76;
      }

      .fieldControl,
      .dateControl {
        display: grid;
        grid-template-columns:
          42px minmax(0, 1fr);
        overflow: hidden;
        min-height: 48px;
        border-radius: 10px;
        background: #041426;
      }

      .fieldControl {
        border:
          1px solid
          rgba(78, 148, 214, 0.52);
      }

      .goldField .fieldControl {
        border-color:
          rgba(229, 180, 48, 0.52);
      }

      .silverField .fieldControl {
        border-color:
          rgba(174, 191, 207, 0.48);
      }

      .prefix,
      .calendarIcon {
        display: grid;
        place-items: center;
        border-right:
          1px solid
          rgba(104, 155, 201, 0.27);
        font-size: 18px;
        font-weight: 950;
      }

      .blueField .prefix {
        color: #6cc1ff;
        background:
          rgba(5, 73, 131, 0.38);
      }

      .goldField .prefix {
        color: #ffd85c;
        background:
          rgba(104, 75, 5, 0.43);
      }

      .silverField .prefix {
        color: #d8e1e9;
        background:
          rgba(72, 85, 99, 0.45);
      }

      .fieldControl input,
      .dateControl input {
        width: 100%;
        min-width: 0;
        min-height: 46px;
        box-sizing: border-box;
        border: 0;
        outline: 0;
        padding: 0 12px;
        background: transparent;
        color: #fff;
        font-size: 13px;
        font-weight: 850;
      }

      .fieldControl input::placeholder {
        color: #8795a4;
        opacity: 1;
      }

      .dateControl {
        border:
          1px solid
          rgba(237, 48, 57, 0.52);
      }

      .calendarIcon {
        color: #ff6b73;
        background:
          rgba(114, 13, 21, 0.35);
      }

      .dateControl input {
        color-scheme: dark;
        appearance: none;
        -webkit-appearance: none;
      }

      .dateControl input::-webkit-date-and-time-value {
        text-align: left;
      }

      .dateControl input::-webkit-calendar-picker-indicator {
        opacity: 0.75;
        filter: invert(1);
      }

      .fieldBlock small {
        display: block;
        margin: 5px 3px 0;
        color: #728ba3;
        font-size: 7px;
        font-weight: 700;
        line-height: 1.35;
      }

      /* =====================================
         REMINDER
      ===================================== */

      .emailReminder {
        margin-top: 14px;
        padding: 13px;
        border-radius: 12px;
      }

      .emailOn {
        border:
          1px solid
          rgba(47, 207, 119, 0.48);
        background:
          radial-gradient(
            circle at 100% 0,
            rgba(32, 203, 113, 0.14),
            transparent 38%
          ),
          rgba(4, 35, 29, 0.73);
      }

      .emailOff {
        border:
          1px solid
          rgba(103, 129, 153, 0.32);
        background:
          rgba(8, 26, 43, 0.74);
      }

      .emailHeader {
        display: grid;
        grid-template-columns:
          40px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
      }

      .mailIcon {
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        border-radius: 10px;
        border:
          1px solid
          rgba(52, 147, 232, 0.46);
        background:
          rgba(5, 70, 126, 0.36);
        color: #79c4ff;
        font-size: 18px;
      }

      .emailText {
        min-width: 0;
      }

      .emailText > strong {
        display: block;
        color: #fff;
        font-size: 12px;
        font-weight: 950;
      }

      .emailText > span {
        display: block;
        margin-top: 4px;
        color: #819ab1;
        font-size: 8px;
        font-weight: 700;
        line-height: 1.4;
      }

      .switchButton {
        width: 92px;
        min-height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        margin: 0;
        padding: 5px 8px;
        border: 0;
        border-radius: 10px;
        color: #fff;
        font-size: 8px;
        font-weight: 950;
        cursor: pointer;
      }

      .switchOn {
        background:
          linear-gradient(
            145deg,
            #1c9a58,
            #10693b
          );
        box-shadow:
          0 3px 0 #084825;
      }

      .switchOff {
        background:
          linear-gradient(
            145deg,
            #607486,
            #415365
          );
        box-shadow:
          0 3px 0 #293948;
      }

      .switchTrack {
        position: relative;
        display: block;
        width: 32px;
        height: 18px;
        border-radius: 99px;
        background:
          rgba(0, 12, 21, 0.5);
      }

      .switchTrack i {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #fff;
        transition:
          transform 0.2s ease;
      }

      .switchOn .switchTrack i {
        transform:
          translateX(14px);
      }

      .emailNote {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        margin-top: 11px;
        padding: 9px 10px;
        border-radius: 8px;
        background:
          rgba(1, 14, 27, 0.54);
      }

      .emailNote p {
        margin: 0;
        color: #8298ad;
        font-size: 8px;
        font-weight: 700;
        line-height: 1.4;
      }

      .blueBullet {
        flex: 0 0 6px;
        width: 6px;
        height: 6px;
        margin-top: 2px;
        border-radius: 50%;
        background: #168cff;
        box-shadow:
          0 0 8px #168cff;
      }

      .emailStatus {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-top: 9px;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: 0.8px;
      }

      .emailStatus > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: currentColor;
        box-shadow:
          0 0 8px currentColor;
      }

      .statusEnabled {
        color: #6fe09f;
      }

      .statusDisabled {
        color: #8094a7;
      }

      /* =====================================
         HELP
      ===================================== */

      .helpBox {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        margin-top: 12px;
        padding: 11px;
        border:
          1px solid
          rgba(69, 135, 197, 0.28);
        border-radius: 10px;
        background:
          rgba(4, 22, 40, 0.66);
        color: #849bb0;
        font-size: 8px;
        font-weight: 700;
        line-height: 1.5;
      }

      .helpBox strong {
        color: #fff;
      }

      .helpIcon {
        flex: 0 0 24px;
        width: 24px;
        height: 24px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        background:
          rgba(9, 91, 164, 0.52);
        color: #6dbdff;
        font-size: 12px;
        font-weight: 950;
      }

      /* =====================================
         BUTTONS
      ===================================== */

      .saveSettingsButton,
      .backAdmin {
        width: 100%;
        border: 0;
        color: #fff;
        font-weight: 950;
        cursor: pointer;
      }

      .saveSettingsButton {
        position: relative;
        min-height: 48px;
        overflow: hidden;
        margin: 14px 0 0;
        border-radius: 10px;
        background:
          linear-gradient(
            100deg,
            #0787ff,
            #1975dc
          );
        font-size: 9px;
        letter-spacing: 1.4px;
        box-shadow:
          0 4px 0 #0751a0,
          0 9px 20px
          rgba(0, 101, 214, 0.22);
      }

      .saveSettingsButton::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
          linear-gradient(
            110deg,
            transparent 25%,
            rgba(255, 255, 255, 0.15)
              50%,
            transparent 75%
          );
        transform:
          translateX(-100%);
      }

      .saveSettingsButton span {
        position: relative;
        z-index: 2;
      }

      .saveSettingsButton:disabled {
        opacity: 0.5;
      }

      .navLink {
        display: block;
        margin-top: 15px;
        text-decoration: none;
      }

      .backAdmin {
        min-height: 43px;
        margin: 0;
        border-radius: 10px;
        background:
          linear-gradient(
            100deg,
            #0a7ee8,
            #1769be
          );
        font-size: 10px;
        box-shadow:
          0 3px 0 #07509a;
      }

      .settingsFooter {
        margin: 17px 0 0;
        color: #5f7790;
        text-align: center;
        font-size: 9px;
        font-weight: 750;
      }

      .settingsMessage {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        padding: 9px 11px;
        border-radius: 9px;
        font-size: 10px;
        font-weight: 850;
      }

      .settingsMessage.good {
        border:
          1px solid
          rgba(44, 198, 110, 0.45);
        background:
          rgba(15, 102, 55, 0.22);
        color: #8be1b1;
      }

      .settingsMessage.warn {
        border:
          1px solid
          rgba(238, 167, 47, 0.45);
        background:
          rgba(114, 70, 8, 0.22);
        color: #ffd17d;
      }

      /* =====================================
         LOADING / ACCESS
      ===================================== */

      .loadingPanel,
      .accessPanel {
        margin-top: 14px;
        padding: 22px;
        border:
          1px solid
          rgba(54, 139, 218, 0.4);
        border-radius: 14px;
        background:
          #061a30;
        color: #fff;
        text-align: center;
      }

      .loadingDot {
        width: 10px;
        height: 10px;
        margin: 0 auto 9px;
        border-radius: 50%;
        background: #168cff;
        box-shadow:
          0 0 12px #168cff;
      }

      .accessPanel h2 {
        margin: 0;
      }

      .accessPanel p {
        color: #91a8bc;
      }

      /* =====================================
         MOBILE
      ===================================== */

      @media (max-width: 700px) {
        .settingsPage {
          padding-bottom: 20px;
        }

        .settingsBrand {
          gap: 9px;
          margin-bottom: 9px;
          padding: 5px 7px;
        }

        .settingsBadge {
          width: 48px;
        }

        .predictorWord {
          font-size: 23px;
          letter-spacing: -1px;
        }

        .adminWord {
          margin-top: 4px;
          font-size: 7px;
          letter-spacing: 1px;
        }

        .settingsHero {
          padding: 14px 10px 12px;
        }

        .heroLabel {
          font-size: 7px;
          letter-spacing: 1.5px;
        }

        .settingsHero h1 {
          font-size: 20px;
        }

        .settingsHero p {
          font-size: 9px;
        }

        .overviewSection,
        .mainSettings {
          padding: 11px;
        }

        .sectionHeader {
          margin-bottom: 9px;
        }

        .sectionHeader h2 {
          font-size: 16px;
        }

        .sectionLabel {
          font-size: 7px;
          letter-spacing: 1.4px;
        }

        .liveBadge {
          height: 24px;
          padding: 0 8px;
          font-size: 7px;
        }

        /*
          Mobile overview:
          first 4 cards in two columns,
          reminders full width.
        */

        .overviewCards {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 7px;
        }

        .miniCard {
          min-height: 63px;
          padding: 8px;
        }

        .miniCard > span {
          font-size: 7px;
        }

        .miniCard > strong {
          font-size: 17px;
        }

        .miniCard .smallValue {
          font-size: 12px;
        }

        .reminderCard {
          grid-column: 1 / -1;
          min-height: 54px;
          flex-direction: row;
          align-items: center;
          justify-content:
            space-between;
          padding: 0 16px;
        }

        .reminderCard > span {
          font-size: 8px;
        }

        .reminderCard > strong {
          margin: 0;
        }

        .settingsGrid {
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 9px 8px;
        }

        .fieldTitle {
          font-size: 7px;
          letter-spacing: 0.8px;
        }

        .fieldControl,
        .dateControl {
          grid-template-columns:
            35px minmax(0, 1fr);
          min-height: 43px;
        }

        .prefix,
        .calendarIcon {
          font-size: 15px;
        }

        .fieldControl input,
        .dateControl input {
          min-height: 41px;
          padding: 0 8px;
          font-size: 11px;
        }

        .fieldBlock small {
          font-size: 6px;
        }

        .emailReminder {
          margin-top: 11px;
          padding: 10px;
        }

        .emailHeader {
          grid-template-columns:
            34px minmax(0, 1fr) 77px;
          gap: 7px;
        }

        .mailIcon {
          width: 34px;
          height: 34px;
          font-size: 15px;
        }

        .emailText > strong {
          font-size: 10px;
        }

        .emailText > span {
          font-size: 7px;
        }

        .switchButton {
          width: 77px;
          min-height: 35px;
          padding: 4px 6px;
          gap: 5px;
          font-size: 7px;
        }

        .switchTrack {
          width: 28px;
          height: 16px;
        }

        .switchTrack i {
          width: 10px;
          height: 10px;
        }

        .switchOn .switchTrack i {
          transform:
            translateX(12px);
        }

        .emailNote {
          margin-top: 8px;
          padding: 7px 8px;
        }

        .emailNote p {
          font-size: 7px;
        }

        .emailStatus {
          font-size: 6px;
        }

        .helpBox {
          margin-top: 9px;
          padding: 8px;
          font-size: 7px;
        }

        .saveSettingsButton {
          min-height: 43px;
          margin-top: 11px;
          font-size: 8px;
        }

        .backAdmin {
          min-height: 40px;
          font-size: 9px;
        }
      }

      @media (max-width: 390px) {
        .predictorWord {
          font-size: 21px;
        }

        .settingsBadge {
          width: 45px;
        }

        .settingsGrid {
          grid-template-columns: 1fr;
        }

        .emailHeader {
          grid-template-columns:
            minmax(0, 1fr) 75px;
        }

        .mailIcon {
          display: none;
        }

        .emailText > span {
          line-height: 1.3;
        }
      }
    `}</style>
  );
}

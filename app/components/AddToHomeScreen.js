
"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "predictor-hide-install-prompt";

export default function AddToHomeScreen() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [hiddenForVisit, setHiddenForVisit] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();

    const ios =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1);

    const mobile =
      /android|iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" &&
        navigator.maxTouchPoints > 1);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    setIsIOS(ios);
    setIsMobile(mobile);
    setIsInstalled(standalone);

    try {
      setIsDismissed(
        localStorage.getItem(DISMISS_KEY) === "true"
      );
    } catch {
      setIsDismissed(false);
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallPrompt(event);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setInstallPrompt(null);
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // App continues normally if service worker registration fails.
      });
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );
    };
  }, []);

  async function handleInstall() {
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }

    if (!installPrompt) {
      return;
    }

    installPrompt.prompt();

    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
    }
  }

  function handleNotNow() {
    setHiddenForVisit(true);
    setShowIOSHelp(false);
  }

  function handleDontShowAgain() {
    try {
      localStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // The message is still hidden for this visit
      // if browser storage is unavailable.
    }

    setIsDismissed(true);
    setHiddenForVisit(true);
    setShowIOSHelp(false);
  }

  if (
    !isMobile ||
    isInstalled ||
    isDismissed ||
    hiddenForVisit
  ) {
    return null;
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          left: "14px",
          right: "14px",
          bottom: "14px",
          zIndex: 9999,
          maxWidth: "520px",
          margin: "0 auto",
          background: "#07111f",
          border: "1px solid rgba(74, 163, 255, 0.65)",
          borderRadius: "14px",
          padding: "8px",
          boxShadow:
            "0 0 18px rgba(0,108,255,0.25), 0 0 18px rgba(237,28,36,0.15), 0 5px 14px rgba(0,0,0,0.4)",
        }}
      >
        <button
          onClick={handleNotNow}
          aria-label="Close installation message"
          title="Not now"
          style={{
            position: "absolute",
            top: "-11px",
            right: "-9px",
            width: "27px",
            height: "27px",
            border: "1px solid #5c7795",
            borderRadius: "50%",
            background: "#172b43",
            color: "#ffffff",
            fontSize: "17px",
            fontWeight: "900",
            lineHeight: "1",
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <button
          onClick={handleInstall}
          style={{
            width: "100%",
            border: "1px solid rgba(74, 163, 255, 0.9)",
            borderRadius: "10px",
            padding: "13px 16px",
            background:
              "linear-gradient(110deg, #006cff 0%, #073a8c 48%, #a90018 72%, #ed1c24 100%)",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: "900",
            letterSpacing: "0.4px",
            boxShadow:
              "0 0 12px rgba(0,108,255,0.25), 0 0 12px rgba(237,28,36,0.15)",
            cursor: "pointer",
          }}
        >
          📲 ADD THE PREDICTOR TO YOUR HOME SCREEN
        </button>

        <button
          onClick={handleDontShowAgain}
          style={{
            display: "block",
            width: "100%",
            marginTop: "7px",
            padding: "7px 10px",
            border: "none",
            borderRadius: "7px",
            background: "transparent",
            color: "#a9bfd5",
            fontSize: "11px",
            fontWeight: "800",
            cursor: "pointer",
          }}
        >
          DON'T SHOW THIS AGAIN
        </button>
      </div>

      {showIOSHelp && (
        <div
          onClick={() => setShowIOSHelp(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0,0,0,0.78)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "18px",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "480px",
              background: "#07111f",
              border: "1px solid #1677ff",
              borderRadius: "18px",
              padding: "22px 18px",
              color: "#ffffff",
              textAlign: "center",
              boxShadow:
                "0 0 25px rgba(0,108,255,0.3), 0 0 20px rgba(237,28,36,0.18)",
            }}
          >
            <img
              src="/apple-touch-icon.png"
              alt="The Predictor"
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "16px",
                marginBottom: "12px",
              }}
            />

            <div
              style={{
                fontSize: "21px",
                fontWeight: "900",
                marginBottom: "10px",
              }}
            >
              ADD THE PREDICTOR
            </div>

            <div
              style={{
                color: "#c7d5e5",
                lineHeight: 1.55,
                fontSize: "15px",
              }}
            >
              In Safari, tap the <strong>Share</strong> button
              <br />
              then choose
              <br />
              <strong style={{ color: "#ffffff" }}>
                Add to Home Screen
              </strong>
            </div>

            <button
              onClick={() => setShowIOSHelp(false)}
              style={{
                marginTop: "18px",
                width: "100%",
                border: 0,
                borderRadius: "10px",
                padding: "11px",
                background: "#ed1c24",
                color: "#ffffff",
                fontWeight: "900",
                cursor: "pointer",
              }}
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </>
  );
}

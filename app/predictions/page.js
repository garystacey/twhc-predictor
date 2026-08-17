<button
  onClick={() =>
    clearAllPredictions(
      weekFixtures,
      selectedWeek.week_no
    )
  }
  disabled={clearingAll || !hasAnyPredictions}
  style={{
    marginTop: "22px",
    background: "#e31b23",
    color: "#ffffff",
    opacity:
      clearingAll || !hasAnyPredictions ? 0.5 : 1,
  }}
>
  {clearingAll
    ? "Clearing..."
    : "Clear All Predictions"}
</button>

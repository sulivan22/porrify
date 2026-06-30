export type WorldCupKnockoutStage = "round32" | "round16" | "quarter" | "semi" | "final" | "third-place";

export function getWorldCupStageByDate(dateEvent?: string | null): WorldCupKnockoutStage | null {
  if (!dateEvent) {
    return null;
  }

  if (dateEvent >= "2026-06-29" && dateEvent <= "2026-07-04") {
    return "round32";
  }

  if (dateEvent >= "2026-07-05" && dateEvent <= "2026-07-08") {
    return "round16";
  }

  if (dateEvent >= "2026-07-09" && dateEvent <= "2026-07-11") {
    return "quarter";
  }

  if (dateEvent >= "2026-07-14" && dateEvent <= "2026-07-15") {
    return "semi";
  }

  if (dateEvent === "2026-07-18") {
    return "third-place";
  }

  if (dateEvent === "2026-07-19") {
    return "final";
  }

  return null;
}

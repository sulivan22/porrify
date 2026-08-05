"use client";

import { useState } from "react";

export function LandingScoringTabs() {
  const [activeTab, setActiveTab] = useState<"world-cup" | "la-liga">("world-cup");

  return (
    <div className="landing-tabs">
      <div className="landing-tab-row" aria-label="Sistema de puntuación de fútbol">
        <button
          type="button"
          className={activeTab === "world-cup" ? "landing-tab-active" : "landing-tab"}
          onClick={() => setActiveTab("world-cup")}
        >
          Mundial 2026
        </button>
        <button
          type="button"
          className={activeTab === "la-liga" ? "landing-tab-active" : "landing-tab"}
          onClick={() => setActiveTab("la-liga")}
        >
          La Liga 2026-2027
        </button>
      </div>
      <div className="landing-tab-panel" role="tabpanel">
        {activeTab === "world-cup" ? (
          <>
            <p>Eliges 15 países y cada posición multiplica los puntos: x15, x14, x13... hasta x1.</p>
            <p>Partido ganado suma 3, empate 1, derrota 0. Cada gol a favor suma 1 y cada gol en contra resta 0.5.</p>
            <p>Bonos por avanzar: 16avos +10, octavos +15, cuartos +20, semifinal +40, final +50, subcampeón +50, 3º puesto +15 y campeón +100.</p>
          </>
        ) : (
          <>
            <p>Eliges 10 equipos y cada posición multiplica los puntos: x10, x9, x8... hasta x1.</p>
            <p>Partido ganado suma 3, empate 1, derrota 0. Cada gol a favor suma 1 y cada gol en contra resta 0.5.</p>
            <p>En La Liga no hay bonos por fases. Los puntos empiezan a contar desde que el usuario crea o se une a la porra.</p>
          </>
        )}
      </div>
    </div>
  );
}

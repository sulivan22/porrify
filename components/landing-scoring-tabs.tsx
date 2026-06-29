export function LandingScoringTabs() {
  return (
    <div className="landing-tabs">
      <div className="landing-tab-row" aria-label="Sistema de puntuación del Mundial">
        <span className="landing-tab-active">Mundial 2026</span>
      </div>
      <div className="landing-tab-panel" role="tabpanel">
        <p>Eliges 15 países y cada posición multiplica los puntos: x15, x14, x13... hasta x1.</p>
        <p>Partido ganado suma 3, empate 1, derrota 0. Cada gol a favor suma 1 y cada gol en contra resta 0.5.</p>
        <p>Bonos por avanzar: 16avos +10, octavos +15, cuartos +20, semifinal +40, final +50, subcampeón +50, 3º puesto +15 y campeón +100.</p>
      </div>
    </div>
  );
}

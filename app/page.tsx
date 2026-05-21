import Link from "next/link";

import { LandingScoringTabs } from "@/components/landing-scoring-tabs";
import { getCompetitionCatalog } from "@/lib/competition-catalog";

export default async function HomePage() {
  const competitions = await getCompetitionCatalog();
  const worldCupCompetition = competitions.find((competition) => competition.key === "world-cup");
  const highlightImages =
    worldCupCompetition?.teams
      .map((team) => team.image)
      .filter((image): image is string => Boolean(image))
      .slice(0, 8) ?? [];

  return (
    <div className="page-stack">
      <section className="hero landing-hero">
        <div>
          <p className="eyebrow">Porra privada de competiciones deportivas</p>
          <h1>Porras entre amigos, compañeros y familia.</h1>
          <p className="hero-copy">
            Porrify es una porra privada del Mundial donde cada participante paga, selecciona sus países y compite en
            un ranking real con datos oficiales.
          </p>
          <div className="cta-row">
            <Link href="/signin" className="primary-button">
              Acceder con Google
            </Link>
          </div>
        </div>
        <div className="hero-panel">
          <h2>Resumen rápido</h2>
          <div className="stat-grid landing-stat-grid">
            <article className="stat-card">
              <span>Pago por porra</span>
              <strong>Importe acordado con tu grupo</strong>
            </article>
            <article className="stat-card">
              <span>Premio neto</span>
              <strong>90% del bote</strong>
            </article>
            <article className="stat-card">
              <span>Reparto</span>
              <strong>1º 50% - 2º 30% - 3º 20%</strong>
            </article>
          </div>
          {highlightImages.length > 0 ? (
            <div className="landing-logo-strip">
              {highlightImages.map((image, index) => (
                <img key={`${image}-${index}`} src={image} alt="Logo deportivo" width={40} height={40} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="card">
        <span className="eyebrow">Cómo funciona</span>
        <h2>Paso a paso</h2>
        <div className="landing-step-grid">
          <article className="landing-step-card">
            <p className="landing-step-number">1</p>
            <h3>Regístrate</h3>
            <p>Accede con tu cuenta de Google y entra al dashboard personal.</p>
          </article>
          <article className="landing-step-card">
            <p className="landing-step-number">2</p>
            <h3>Crea, comparte y únete</h3>
            <p>Crea una porra privada o únete con su nombre único para entrar al checkout.</p>
          </article>
          <article className="landing-step-card">
            <p className="landing-step-number">3</p>
            <h3>Ranking de resultados</h3>
            <p>Sigue en directo la clasificación y los puntos acumulados de cada participante.</p>
          </article>
          <article className="landing-step-card">
            <p className="landing-step-number">4</p>
            <h3>Reparto del premio</h3>
            <p>Se descuenta 10% plataforma y el 90% restante se reparte 50/30/20.</p>
          </article>
        </div>
      </section>

      <section className="card">
        <span className="eyebrow">Sistema de puntuación</span>
        <h2>Mundial 2026</h2>
        <LandingScoringTabs />
      </section>

      <section className="card">
        <span className="eyebrow">Competición disponible</span>
        <h2>Torneo activo</h2>
        <div className="competition-grid">
          {competitions.map((competition) => (
            <article className="competition-card competition-card-left" key={competition.key}>
              <p className="competition-card-title">{competition.label}</p>
              {competition.logo ? (
                <div className="competition-card-logo">
                  <img
                    src={competition.logo}
                    alt={`Logo ${competition.label}`}
                    width={118}
                    height={118}
                    className={`competition-badge ${
                      competition.key === "champions-league" ? "competition-badge-dark" : ""
                    }`}
                  />
                </div>
              ) : null}
              <h3>{competition.subtitle}</h3>
              <p>{competition.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="landing-footer card">
        <p>© 2026 Porrify. Todos los derechos reservados.</p>
        <div className="landing-footer-links">
          <Link href="/politica-privacidad">Política de Privacidad</Link>
          <Link href="/politica-cookies">Política de Cookies</Link>
        </div>
      </footer>
    </div>
  );
}

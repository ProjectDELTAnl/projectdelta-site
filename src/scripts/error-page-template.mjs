export function renderErrorPage({
  code,
  label,
  pageTitle,
  description,
  heading,
  intro,
}) {
  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#050506" />
    <title>${pageTitle}</title>
    <meta name="description" content="${description}" />
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
    <style>
      :root {
        color-scheme: dark;
        --black: #050506;
        --red: #e21b23;
        --white: #f4f1ea;
        --muted: #aeb7bd;
        --steel: #2d3740;
        --cyan: #13b9ff;
      }
      * {
        box-sizing: border-box;
      }
      body {
        min-height: 100vh;
        margin: 0;
        display: grid;
        place-items: center;
        overflow: hidden;
        color: var(--white);
        background:
          linear-gradient(rgba(226, 27, 35, 0.11) 1px, transparent 1px),
          linear-gradient(90deg, rgba(19, 185, 255, 0.09) 1px, transparent 1px),
          radial-gradient(circle at 35% 25%, rgba(226, 27, 35, 0.32), transparent 32%),
          var(--black);
        background-size:
          42px 42px,
          42px 42px,
          auto;
        font-family: "Rajdhani", "Arial Narrow", system-ui, sans-serif;
      }
      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(transparent 0 92%, rgba(244, 241, 234, 0.08) 93% 100%),
          linear-gradient(90deg, transparent 0 50%, rgba(19, 185, 255, 0.08) 51% 52%, transparent 53%);
        background-size:
          100% 7px,
          220px 100%;
        mix-blend-mode: screen;
        opacity: 0.45;
      }
      main {
        width: min(760px, calc(100vw - 32px));
        position: relative;
        z-index: 1;
        padding: clamp(28px, 7vw, 72px);
        border: 1px solid rgba(244, 241, 234, 0.18);
        background: rgba(5, 5, 6, 0.82);
        box-shadow:
          0 0 0 1px rgba(226, 27, 35, 0.25),
          0 28px 90px rgba(0, 0, 0, 0.52),
          inset 0 0 42px rgba(226, 27, 35, 0.12);
      }
      img {
        width: 74px;
        height: 74px;
        object-fit: contain;
        border-radius: 50%;
        box-shadow:
          0 0 0 1px rgba(226, 27, 35, 0.62),
          0 0 16px rgba(226, 27, 35, 0.22);
        filter: drop-shadow(0 0 18px rgba(226, 27, 35, 0.45));
        animation: signalPulse 4.8s ease-in-out infinite;
        will-change: box-shadow, filter, transform;
      }
      @keyframes signalPulse {
        0%,
        100% {
          transform: scale(1);
          box-shadow:
            0 0 0 1px rgba(226, 27, 35, 0.58),
            0 0 11px rgba(226, 27, 35, 0.18),
            0 0 0 0 rgba(226, 27, 35, 0);
          filter: drop-shadow(0 0 10px rgba(226, 27, 35, 0.28));
        }
        48% {
          transform: scale(1.045);
          box-shadow:
            0 0 0 1px rgba(244, 241, 234, 0.26),
            0 0 24px rgba(226, 27, 35, 0.42),
            0 0 44px rgba(226, 27, 35, 0.2);
          filter:
            drop-shadow(0 0 16px rgba(226, 27, 35, 0.5))
            drop-shadow(0 0 26px rgba(226, 27, 35, 0.22));
        }
        52% {
          transform: scale(1.015);
          box-shadow:
            0 0 0 1px rgba(226, 27, 35, 0.74),
            0 0 18px rgba(226, 27, 35, 0.32),
            0 0 34px rgba(226, 27, 35, 0.12);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        img {
          animation: none;
        }
      }
      p,
      a {
        font-family: "IBM Plex Mono", ui-monospace, monospace;
      }
      .eyebrow {
        color: var(--red);
        font-size: 0.8rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      h1 {
        max-width: 14ch;
        margin: 0.18em 0;
        font-size: clamp(3rem, 13vw, 8rem);
        line-height: 0.88;
        text-transform: uppercase;
        text-shadow:
          2px 0 rgba(226, 27, 35, 0.75),
          -2px 0 rgba(19, 185, 255, 0.5);
      }
      .intro {
        max-width: 58ch;
        color: var(--muted);
        font-size: 1rem;
        line-height: 1.7;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 28px;
      }
      a {
        display: inline-flex;
        min-height: 44px;
        align-items: center;
        justify-content: center;
        padding: 0.78rem 1rem;
        border: 1px solid rgba(244, 241, 234, 0.2);
        color: var(--white);
        text-decoration: none;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      a:first-child {
        border-color: rgba(226, 27, 35, 0.7);
        background: rgba(226, 27, 35, 0.14);
      }
      a:focus-visible {
        outline: 2px solid var(--cyan);
        outline-offset: 4px;
      }
    </style>
  </head>
  <body>
    <main class="page-hero not-found section-shell">
      <img class="page-stamp" src="/assets/delta-profielstempel-512.png" alt="" />
      <p class="eyebrow">${code} / ${label}</p>
      <h1>${heading}</h1>
      <p class="intro">${intro}</p>
      <div class="actions">
        <a href="/">Hoofdpagina</a>
        <a href="/publicaties/">Publicaties</a>
      </div>
    </main>
  </body>
</html>`;
}

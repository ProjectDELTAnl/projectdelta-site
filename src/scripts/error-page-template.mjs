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
        --muted: #87919c;
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
          0 28px 90px rgba(5, 5, 6, 0.52),
          inset 0 0 42px rgba(226, 27, 35, 0.12);
      }
      .page-stamp-shell {
        position: relative;
        display: inline-grid;
        width: 74px;
        height: 74px;
        place-items: center;
        border-radius: 50%;
        isolation: isolate;
      }
      .page-stamp-shell::before,
      .page-stamp-shell::after {
        content: "";
        position: absolute;
        border-radius: inherit;
        pointer-events: none;
      }
      .page-stamp-shell::before {
        inset: -7px;
        border: 1px solid rgba(226, 27, 35, 0.3);
        box-shadow:
          0 0 18px rgba(226, 27, 35, 0.13),
          0 0 34px rgba(226, 27, 35, 0.08),
          inset 0 0 14px rgba(226, 27, 35, 0.08);
        opacity: 0.48;
        animation: stampOuterPulse 7.2s cubic-bezier(0.42, 0, 0.2, 1) infinite;
      }
      .page-stamp-shell::after {
        inset: -3px;
        background:
          conic-gradient(
            from 0deg,
            transparent 0deg 38deg,
            rgba(226, 27, 35, 0.58) 58deg,
            transparent 82deg 206deg,
            rgba(244, 241, 234, 0.24) 226deg,
            transparent 252deg 360deg
          );
        -webkit-mask:
          radial-gradient(farthest-side, transparent calc(100% - 2px), #050506 0);
        mask:
          radial-gradient(farthest-side, transparent calc(100% - 2px), #050506 0);
        opacity: 0.44;
        filter: drop-shadow(0 0 7px rgba(226, 27, 35, 0.28));
        animation:
          stampSignalOrbit 10.8s linear infinite,
          stampSignalBreath 7.2s cubic-bezier(0.42, 0, 0.2, 1) infinite;
      }
      img {
        position: relative;
        z-index: 1;
        width: 74px;
        height: 74px;
        object-fit: contain;
        border-radius: 50%;
        box-shadow: 0 0 0 1px rgba(226, 27, 35, 0.72);
        filter:
          drop-shadow(0 0 10px rgba(226, 27, 35, 0.28))
          drop-shadow(0 0 20px rgba(226, 27, 35, 0.14));
      }
      @keyframes stampOuterPulse {
        0%,
        100% {
          transform: scale(1);
          opacity: 0.42;
          box-shadow:
            0 0 16px rgba(226, 27, 35, 0.12),
            0 0 28px rgba(226, 27, 35, 0.06),
            inset 0 0 12px rgba(226, 27, 35, 0.07);
        }
        18% {
          transform: scale(1.018);
          opacity: 0.49;
          box-shadow:
            0 0 18px rgba(226, 27, 35, 0.16),
            0 0 34px rgba(226, 27, 35, 0.08),
            inset 0 0 13px rgba(226, 27, 35, 0.08);
        }
        38% {
          transform: scale(1.05);
          opacity: 0.6;
          box-shadow:
            0 0 21px rgba(226, 27, 35, 0.22),
            0 0 40px rgba(226, 27, 35, 0.11),
            inset 0 0 16px rgba(226, 27, 35, 0.1);
        }
        58% {
          transform: scale(1.075);
          opacity: 0.68;
          box-shadow:
            0 0 24px rgba(226, 27, 35, 0.28),
            0 0 48px rgba(226, 27, 35, 0.15),
            inset 0 0 18px rgba(226, 27, 35, 0.12);
        }
        76% {
          transform: scale(1.045);
          opacity: 0.58;
          box-shadow:
            0 0 20px rgba(226, 27, 35, 0.2),
            0 0 38px rgba(226, 27, 35, 0.1),
            inset 0 0 15px rgba(226, 27, 35, 0.09);
        }
        90% {
          transform: scale(1.014);
          opacity: 0.47;
          box-shadow:
            0 0 17px rgba(226, 27, 35, 0.14),
            0 0 31px rgba(226, 27, 35, 0.07),
            inset 0 0 13px rgba(226, 27, 35, 0.08);
        }
      }
      @keyframes stampSignalOrbit {
        to {
          transform: rotate(1turn);
        }
      }
      @keyframes stampSignalBreath {
        0%,
        100% {
          opacity: 0.38;
          filter: drop-shadow(0 0 7px rgba(226, 27, 35, 0.24));
        }
        50% {
          opacity: 0.56;
          filter: drop-shadow(0 0 10px rgba(226, 27, 35, 0.34));
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .page-stamp-shell::before,
        .page-stamp-shell::after {
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
      <span class="page-stamp-shell" aria-hidden="true">
        <img class="page-stamp" src="/assets/delta-profielstempel-512.png" alt="" />
      </span>
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

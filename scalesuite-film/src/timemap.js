/* V2 reading holds. The scenes keep their V1 animation clock; the film clock inserts holds only at
   moments where the composition is already settled. Around each hold the animation clock eases
   down to a near-stop and back (raised-cosine rate curve), so motion velocity is untouched
   everywhere else and there is never a jump or a freeze.
   Each hold: [V1 time (settled moment), seconds added, easing window in V1 seconds, label].
   Shared with audio/music.py (it parses the JSON below), so picture and sound stay in sync.
   ?v=1 renders the original V1 timing. */
window.SS = window.SS || {};
SS.TIMEMAP = {
  "v1Duration": 27.5,
  "holds": [
    [2.10, 0.45, 0.30, "hook: 10 courtiers / 10 campagnes Google Ads ?"],
    [3.33, 0.30, 0.06, "Plus de courtiers."],
    [4.00, 0.30, 0.18, "Plus de campagnes."],
    [4.88, 0.30, 0.16, "Plus de gestion."],
    [7.45, 0.55, 0.30, "ScaleSuite lockup + tagline"],
    [9.35, 0.15, 0.40, "Toute votre équipe sur Google Ads."],
    [10.93, 0.55, 0.10, "Une seule structure."],
    [13.95, 0.55, 0.40, "Centralisé. Mais personnalisé."],
    [15.85, 0.20, 0.16, "Créées."],
    [16.72, 0.20, 0.14, "Suivies."],
    [17.70, 0.40, 0.12, "Optimisées. (all three)"],
    [21.18, 0.75, 0.20, "Le bon courtier le reçoit."],
    [23.50, 0.75, 0.50, "Plus de campagnes. Pas plus de gestion."],
    [26.00, 0.50, 0.30, "final CTA"]
  ]
};
(function () {
  const q = new URLSearchParams(location.search);
  const M = SS.TIMEMAP, holds = q.get('v') === '1' ? [] : M.holds;
  const cdf = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u - Math.sin(2 * Math.PI * u) / (2 * Math.PI));
  // film (V2) time of an animation (V1) instant
  SS.toFilm = (t1) => holds.reduce((t, [p, s, w]) => t + s * cdf((t1 - (p - w / 2)) / w), t1);
  // animation (V1) instant shown at film time t2 (monotonic → bisection)
  SS.toAnim = (t2) => {
    let lo = -1, hi = t2 + 0.001;
    for (let i = 0; i < 48; i++) { const m = (lo + hi) / 2; if (SS.toFilm(m) < t2) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };
  SS.VERSION = holds.length ? 2 : 1;
  SS.FILM_DURATION = SS.toFilm(M.v1Duration);
})();

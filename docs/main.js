(() => {
  // Hero playback and mute controls
  const heroVid = document.getElementById('hero-vid');
  const heroPlayback = document.getElementById('hero-playback');
  const heroMute = document.getElementById('hero-mute');
  if (heroVid && heroPlayback && heroMute) {
    const heroMuteLabel = heroMute.querySelector('.hero-mute-label');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncPlaybackControl = () => {
      const mode = heroVid.paused ? 'play' : 'pause';
      const label = `${mode} brag video`;
      heroPlayback.dataset.mode = mode;
      heroPlayback.setAttribute('aria-label', label);
      heroPlayback.setAttribute('title', label);
    };

    const syncMuteControl = () => {
      heroMute.setAttribute('aria-pressed', heroVid.muted ? 'true' : 'false');
      heroMute.setAttribute('aria-label', heroVid.muted ? 'unmute brag video' : 'mute brag video');
      if (heroMuteLabel) heroMuteLabel.textContent = 'tap for sound';
    };

    const applyMotionPreference = () => {
      if (reducedMotion.matches) {
        heroVid.pause();
        heroVid.load();
        syncPlaybackControl();
        return;
      }

      heroVid.muted = true;
      syncMuteControl();
      const playback = heroVid.play();
      if (playback && playback.catch) playback.catch(syncPlaybackControl);
    };

    heroPlayback.addEventListener('click', () => {
      if (heroVid.paused) {
        const playback = heroVid.play();
        if (playback && playback.catch) playback.catch(syncPlaybackControl);
        return;
      }

      heroVid.pause();
    });

    heroMute.addEventListener('click', () => {
      heroVid.muted = !heroVid.muted;
      syncMuteControl();
    });

    heroVid.addEventListener('play', syncPlaybackControl);
    heroVid.addEventListener('pause', syncPlaybackControl);
    applyMotionPreference();
    reducedMotion.addEventListener('change', applyMotionPreference);
  }

  // Gallery videos use the native <video controls> player. No custom JS.

  // Copy buttons
  // navigator.clipboard only exists in secure contexts (https / localhost), so on a
  // phone hitting the dev server over http:// we fall back to execCommand('copy').
  const legacyCopy = (text) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length); // iOS Safari needs an explicit range
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    document.body.removeChild(ta);
    return ok;
  };

  document.querySelectorAll('.copy[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy || '';
      let ok = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          ok = true;
        } catch { /* fall through to legacy path */ }
      }
      if (!ok) ok = legacyCopy(text);

      if (ok) {
        btn.dataset.state = 'copied';
        const orig = btn.textContent;
        btn.textContent = 'copied';
        setTimeout(() => {
          btn.dataset.state = '';
          btn.textContent = orig;
        }, 1600);
      } else {
        // last resort: select the command so the user can copy it manually
        const pre = btn.closest('.install');
        if (pre) {
          const range = document.createRange();
          range.selectNodeContents(pre.querySelector('code'));
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    });
  });
})();

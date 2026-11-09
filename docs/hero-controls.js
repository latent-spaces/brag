// Pure state for the hero mute button. Kept out of main.js so it can be tested
// without a browser.

export function heroMutePresentation(muted) {
  if (muted) {
    return {
      pressed: "true",
      label: "unmute brag video",
      hint: "tap for sound",
    };
  }
  return {
    pressed: "false",
    label: "mute brag video",
    hint: "sound on",
  };
}

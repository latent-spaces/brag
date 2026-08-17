/**
 * Placeholder for pipeline stages that land in a later phase.
 *
 * A stub exits non-zero and names the phase that will implement it, so an
 * unfinished stage can never be mistaken for a passing one.
 */

import { BragError, EXIT } from "./util.mjs";

export function notYet(command, phase, whatItWillDo) {
  return async function run() {
    throw new BragError(
      `\`brag ${command}\` lands in ${phase}: ${whatItWillDo}\n` +
        `Run \`brag status\` to see which stages are available now.`,
      EXIT.USAGE,
    );
  };
}

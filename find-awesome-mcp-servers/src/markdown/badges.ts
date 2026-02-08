import { TimePeriodType } from "../types/badges.js";
import { BADGE_STYLE, COLORS } from "./theme.js";

const FRESHNESS_BADGES: Record<TimePeriodType, string> = {
  one_day: `![FRESH AF](https://img.shields.io/badge/FRESH_AF-${COLORS.freshAf}?style=${BADGE_STYLE.table})`,
  one_week: `![HOT](https://img.shields.io/badge/HOT-${COLORS.hot}?style=${BADGE_STYLE.table})`,
  one_month: `![ACTIVE](https://img.shields.io/badge/ACTIVE-${COLORS.active}?style=${BADGE_STYLE.table})`,
  six_months: `![STABLE](https://img.shields.io/badge/STABLE-${COLORS.stable}?style=${BADGE_STYLE.table})`,
  one_year: `![ZZZ](https://img.shields.io/badge/ZZZ-${COLORS.zzz}?style=${BADGE_STYLE.table})`,
};

const FRESHNESS_EMOJIS: Record<TimePeriodType, string> = {
  one_day: "🔥",
  one_week: "🌶️",
  one_month: "✅",
  six_months: "📘",
  one_year: "💤",
};

export function freshnessBadge(period: TimePeriodType): string {
  return FRESHNESS_BADGES[period];
}

export function freshnessEmoji(period: TimePeriodType): string {
  return FRESHNESS_EMOJIS[period];
}

export function statBadge(label: string, value: number, color: string): string {
  const encodedLabel = encodeURIComponent(label);
  const badgeUrl = `https://img.shields.io/badge/${encodedLabel}-${value}-${color}?style=${BADGE_STYLE.table}`;
  return `![${label}](${badgeUrl})`;
}

export function licenseBadge(license: { name: string } | null): string {
  if (!license)
    return `![No License](https://img.shields.io/badge/No_License-${COLORS.noLicense}?style=${BADGE_STYLE.table})`;

  const basePath = "https://img.shields.io/badge/License-";
  const style = BADGE_STYLE.table;

  const LICENSE_BADGES: Record<string, string> = {
    "MIT License": `[![MIT](${basePath}MIT-yellow.svg?style=${style})](https://opensource.org/licenses/MIT)`,
    "Apache License 2.0": `[![Apache 2.0](${basePath}Apache_2.0-blue.svg?style=${style})](https://opensource.org/licenses/Apache-2.0)`,
    "Boost Software License 1.0": `[![Boost 1.0](${basePath}Boost_1.0-lightblue.svg?style=${style})](https://www.boost.org/LICENSE_1_0.txt)`,
    'BSD 3-Clause "New" or "Revised" License': `[![BSD 3-Clause](${basePath}BSD_3--Clause-blue.svg?style=${style})](https://opensource.org/licenses/BSD-3-Clause)`,
    'BSD 2-Clause "Simplified" License': `[![BSD 2-Clause](${basePath}BSD_2--Clause-orange.svg?style=${style})](https://opensource.org/licenses/BSD-2-Clause)`,
    "Creative Commons Zero v1.0 Universal": `[![CC0 1.0](${basePath}CC0_1.0-lightgrey.svg?style=${style})](http://creativecommons.org/publicdomain/zero/1.0/)`,
    "Creative Commons Attribution 4.0 International": `[![CC BY 4.0](${basePath}CC_BY_4.0-lightgrey.svg?style=${style})](https://creativecommons.org/licenses/by/4.0/)`,
    "Creative Commons Attribution Share Alike 4.0 International": `[![CC BY-SA 4.0](${basePath}CC_BY--SA_4.0-lightgrey.svg?style=${style})](https://creativecommons.org/licenses/by-sa/4.0/)`,
    "Creative Commons Attribution Non Commercial 4.0 International": `[![CC BY-NC 4.0](${basePath}CC_BY--NC_4.0-lightgrey.svg?style=${style})](https://creativecommons.org/licenses/by-nc/4.0/)`,
    "Creative Commons Attribution No Derivatives 4.0 International": `[![CC BY-ND 4.0](${basePath}CC_BY--ND_4.0-lightgrey.svg?style=${style})](https://creativecommons.org/licenses/by-nd/4.0/)`,
    "Creative Commons Attribution Non Commercial Share Alike 4.0 International": `[![CC BY-NC-SA 4.0](${basePath}CC_BY--NC--SA_4.0-lightgrey.svg?style=${style})](https://creativecommons.org/licenses/by-nc-sa/4.0/)`,
    "Creative Commons Attribution Non Commercial No Derivatives 4.0 International": `[![CC BY-NC-ND 4.0](${basePath}CC_BY--NC--ND_4.0-lightgrey.svg?style=${style})](https://creativecommons.org/licenses/by-nc-nd/4.0/)`,
    "Eclipse Public License 1.0": `[![EPL 1.0](${basePath}EPL_1.0-red.svg?style=${style})](https://opensource.org/licenses/EPL-1.0)`,
    "GNU General Public License v3.0": `[![GPL v3](${basePath}GPLv3-blue.svg?style=${style})](https://www.gnu.org/licenses/gpl-3.0)`,
    "GNU General Public License v2.0": `[![GPL v2](${basePath}GPL_v2-blue.svg?style=${style})](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html)`,
    "GNU Affero General Public License v3.0": `[![AGPL v3](${basePath}AGPL_v3-blue.svg?style=${style})](https://www.gnu.org/licenses/agpl-3.0)`,
    "GNU Lesser General Public License v3.0": `[![LGPL v3](${basePath}LGPL_v3-blue.svg?style=${style})](https://www.gnu.org/licenses/lgpl-3.0)`,
    "GNU Free Documentation License v1.3": `[![FDL 1.3](${basePath}FDL_v1.3-blue.svg?style=${style})](https://www.gnu.org/licenses/fdl-1.3)`,
    "ISC License": `[![ISC](${basePath}ISC-blue.svg?style=${style})](https://opensource.org/licenses/ISC)`,
    "Mozilla Public License 2.0": `[![MPL 2.0](${basePath}MPL_2.0-brightgreen.svg?style=${style})](https://opensource.org/licenses/MPL-2.0)`,
    "The Unlicense": `[![Unlicense](${basePath}Unlicense-blue.svg?style=${style})](http://unlicense.org/)`,
  };

  return (
    LICENSE_BADGES[license.name] ||
    `![${license.name}](${basePath}${encodeURIComponent(license.name)}-lightgrey.svg?style=${style})`
  );
}

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const apiBase = process.env.HENRIKDEV_API_BASE || "https://api.henrikdev.xyz";
const outputPath = resolve(process.env.VALORANT_OUTPUT_PATH || "data/valorant-stats.json");

const rankDefinitions = [
  { pattern: /^IRON/i, key: "iron", label: "Iron" },
  { pattern: /^BRONZE/i, key: "bronze", label: "Brąz" },
  { pattern: /^SILVER/i, key: "silver", label: "Silver" },
  { pattern: /^GOLD/i, key: "gold", label: "Gold" },
  { pattern: /^PLATINUM/i, key: "platinum", label: "Platyna" },
  { pattern: /^DIAMOND/i, key: "diamond", label: "Diament" },
  { pattern: /^ASCENDANT/i, key: "ascendant", label: "Ascendant" },
  { pattern: /^IMMORTAL/i, key: "immortal", label: "Immortal" },
  { pattern: /^RADIANT/i, key: "radiant", label: "Radiant" }
];

function normalizedTier(tier) {
  const tierName = String(tier?.name || "");
  const definition = rankDefinitions.find((rank) => rank.pattern.test(tierName));
  const division = Number(tierName.match(/([1-3])$/)?.[1]) || null;

  if (!definition) return null;

  return {
    key: definition.key,
    label: definition.label,
    division: definition.key === "radiant" ? null : division,
    name: definition.key === "radiant" || !division ? definition.label : `${definition.label} ${division}`
  };
}

export function normalizeMatches(matches, riotId) {
  const [riotName, riotTag] = riotId.split("#");

  return (Array.isArray(matches) ? matches : []).flatMap((match) => {
    const player = match.players?.find((entry) =>
      entry.name?.toLowerCase() === riotName.toLowerCase() &&
      entry.tag?.toLowerCase() === riotTag.toLowerCase()
    );

    if (!player) return [];

    const team = match.teams?.find((entry) => entry.team_id === player.team_id);
    const stats = player.stats || {};

    return [{
      id: match.metadata?.match_id || "",
      startedAt: match.metadata?.started_at || null,
      map: match.metadata?.map?.name || "Unknown",
      queue: match.metadata?.queue?.name || "Competitive",
      agent: player.agent?.name || "Unknown",
      result: typeof team?.won === "boolean" ? (team.won ? "win" : "loss") : "unknown",
      kills: Number(stats.kills) || 0,
      deaths: Number(stats.deaths) || 0,
      assists: Number(stats.assists) || 0
    }];
  });
}

export function buildPublicProfile(mmrResponse, matchesResponse, { riotId, region }) {
  const mmr = mmrResponse?.data;
  if (!mmr?.current?.tier) throw new Error("HenrikDev did not return current rank data.");

  const [riotName, riotTag] = riotId.split("#");
  const matches = normalizeMatches(matchesResponse?.data, riotId);
  const wins = matches.filter((match) => match.result === "win").length;
  const losses = matches.filter((match) => match.result === "loss").length;
  const byAgent = new Map();

  matches.forEach((match) => {
    const agent = byAgent.get(match.agent) || { name: match.agent, games: 0, kills: 0 };
    agent.games += 1;
    agent.kills += match.kills;
    byAgent.set(match.agent, agent);
  });

  const peak = mmr.peak;
  const currentTier = normalizedTier(mmr.current.tier);
  const peakTier = normalizedTier(peak?.tier);

  return {
    available: true,
    updatedAt: new Date().toISOString(),
    source: "HenrikDev API",
    profile: { riotId, name: mmr.account?.name || riotName, tag: mmr.account?.tag || riotTag, region },
    rank: {
      current: {
        ...currentTier,
        rr: Number(mmr.current.rr) || 0,
        leaderboardPlacement: Number(mmr.current.leaderboard_placement?.rank) || null
      },
      peak: peakTier ? {
        ...peakTier,
        season: peak.season?.short || null
      } : null
    },
    summary: {
      matches: matches.length,
      wins,
      losses,
      winRate: matches.length ? Math.round((wins / matches.length) * 100) : 0,
      byAgent: [...byAgent.values()].sort((left, right) => right.games - left.games)
    },
    matches
  };
}

async function requestJson(path, apiKey) {
  const response = await fetch(new URL(path, apiBase), {
    headers: { Authorization: apiKey, Accept: "application/json" },
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error(`HenrikDev request failed with HTTP ${response.status}.`);
  }

  return response.json();
}

export async function refreshProfile({ apiKey, riotId, region }) {
  if (!apiKey) throw new Error("Missing HENRIKDEV_API_KEY secret.");

  const [riotName, riotTag, ...unexpected] = riotId.split("#");
  if (!riotName || !riotTag || unexpected.length) {
    throw new Error("RIOT_ID must use the name#tag format.");
  }

  const encodedName = encodeURIComponent(riotName);
  const encodedTag = encodeURIComponent(riotTag);
  const affinity = encodeURIComponent(region.toLowerCase());
  const accountPath = `/valorant/v3/mmr/${affinity}/pc/${encodedName}/${encodedTag}`;
  const matchesPath = `/valorant/v4/matches/${affinity}/pc/${encodedName}/${encodedTag}?mode=competitive&size=10`;
  const [mmr, matches] = await Promise.all([
    requestJson(accountPath, apiKey),
    requestJson(matchesPath, apiKey)
  ]);

  return buildPublicProfile(mmr, matches, { riotId, region });
}

async function main() {
  const profile = await refreshProfile({
    apiKey: process.env.HENRIKDEV_API_KEY,
    riotId: process.env.RIOT_ID || "Julc1a#uwu",
    region: process.env.VALORANT_REGION || "eu"
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
  console.log(`Updated ${profile.profile.riotId}: ${profile.rank.current.name}, ${profile.rank.current.rr} RR, ${profile.matches.length} matches.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";
import type {
  HolidayCategoryValue,
  ListPublicHolidaysQuery,
} from "../types/index.js";
import { BadRequestError } from "../utils/errors.js";

interface ListPublicHolidaysParams {
  workspaceId: string;
  query: ListPublicHolidaysQuery;
}

type HolidayRule = {
  category: HolidayCategoryValue;
  name: string;
  month: number;
  day: number;
  region?: string;
};

const NATIONAL_RULES: HolidayRule[] = [
  { category: "NATIONAL", name: "Republic Day", month: 1, day: 26 },
  { category: "NATIONAL", name: "Independence Day", month: 8, day: 15 },
  { category: "NATIONAL", name: "Gandhi Jayanti", month: 10, day: 2 },
];

const COMPANY_RULES: HolidayRule[] = [
  { category: "COMPANY", name: "Company Foundation Day", month: 4, day: 1 },
  { category: "COMPANY", name: "Annual Team Retreat", month: 11, day: 14 },
];

const REGIONAL_RULES: HolidayRule[] = [
  {
    category: "REGIONAL",
    name: "Maharashtra Day",
    month: 5,
    day: 1,
    region: "IN-MH",
  },
  {
    category: "REGIONAL",
    name: "Karnataka Rajyotsava",
    month: 11,
    day: 1,
    region: "IN-KA",
  },
  {
    category: "REGIONAL",
    name: "Tamil Nadu Day",
    month: 11,
    day: 1,
    region: "IN-TN",
  },
];

function startOfUtcDay(date: Date) {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function endOfUtcDay(date: Date) {
  const copy = new Date(date);
  copy.setUTCHours(23, 59, 59, 999);
  return copy;
}

function normalizeRange(query: ListPublicHolidaysQuery) {
  if (query.from && query.to) {
    const from = startOfUtcDay(new Date(`${query.from}T00:00:00.000Z`));
    const to = endOfUtcDay(new Date(`${query.to}T00:00:00.000Z`));

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestError("Invalid date range");
    }

    return {
      from,
      to,
      fromKey: query.from,
      toKey: query.to,
    };
  }

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const monthEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );

  return {
    from: monthStart,
    to: monthEnd,
    fromKey: monthStart.toISOString().slice(0, 10),
    toKey: monthEnd.toISOString().slice(0, 10),
  };
}

function buildSystemHolidayOccurrences({
  from,
  to,
  region,
}: {
  from: Date;
  to: Date;
  region?: string;
}) {
  const fromYear = from.getUTCFullYear();
  const toYear = to.getUTCFullYear();
  const normalizedRegion = region?.trim().toUpperCase();

  const rules = [
    ...NATIONAL_RULES,
    ...COMPANY_RULES,
    ...REGIONAL_RULES.filter(
      (rule) =>
        !rule.region || !normalizedRegion || rule.region === normalizedRegion,
    ),
  ];

  const holidays: Array<{
    id: string;
    name: string;
    date: string;
    category: HolidayCategoryValue;
    region: string | null;
    source: "SYSTEM";
  }> = [];

  for (let year = fromYear; year <= toYear; year += 1) {
    for (const rule of rules) {
      const date = new Date(
        Date.UTC(year, rule.month - 1, rule.day, 0, 0, 0, 0),
      );
      if (date < from || date > to) {
        continue;
      }

      const dateKey = date.toISOString().slice(0, 10);
      holidays.push({
        id: `SYSTEM-${rule.category}-${rule.region ?? "GLOBAL"}-${dateKey}-${rule.name}`,
        name: rule.name,
        date: dateKey,
        category: rule.category,
        region: rule.region ?? null,
        source: "SYSTEM",
      });
    }
  }

  return holidays;
}

export const listPublicHolidays = async ({
  workspaceId,
  query,
}: ListPublicHolidaysParams) => {
  const { from, to, fromKey, toKey } = normalizeRange(query);
  const region = query.region?.trim().toUpperCase();

  const whereClause: Prisma.PublicHolidayWhereInput = {
    date: {
      gte: from,
      lte: to,
    },
    OR: [{ workspaceId }, { workspaceId: null }],
    ...(region
      ? {
          AND: [{ OR: [{ region }, { region: null }] }],
        }
      : {}),
  };

  const [customRows] = await Promise.all([
    prisma.publicHoliday.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        date: true,
        category: true,
        region: true,
      },
      orderBy: [{ date: "asc" }, { name: "asc" }],
    }),
  ]);

  const systemHolidays = buildSystemHolidayOccurrences({
    from,
    to,
    ...(region ? { region } : {}),
  });

  const customHolidays = customRows.map((row) => ({
    id: row.id,
    name: row.name,
    date: row.date.toISOString().slice(0, 10),
    category: row.category,
    region: row.region,
    source: "CUSTOM" as const,
  }));

  const dedupe = new Map<
    string,
    (typeof customHolidays)[number] | (typeof systemHolidays)[number]
  >();
  for (const holiday of [...systemHolidays, ...customHolidays]) {
    const key = `${holiday.date}|${holiday.name}|${holiday.category}|${holiday.region ?? ""}`;
    dedupe.set(key, holiday);
  }

  const holidays = Array.from(dedupe.values()).sort((a, b) => {
    if (a.date === b.date) return a.name.localeCompare(b.name);
    return a.date.localeCompare(b.date);
  });

  return {
    from: fromKey,
    to: toKey,
    region: region ?? null,
    holidays,
  };
};

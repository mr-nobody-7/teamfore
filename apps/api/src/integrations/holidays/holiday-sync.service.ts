import axios from "axios";
import { prisma } from "../../lib/db.js";

type NagerHoliday = {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
};

type SupportedCountry = {
  code: string;
  name: string;
};

const SUPPORTED_COUNTRIES: SupportedCountry[] = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "SG", name: "Singapore" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "CA", name: "Canada" },
  { code: "AE", name: "UAE" },
];

function yearRange(year: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
  };
}

export function getSupportedCountries(): SupportedCountry[] {
  return SUPPORTED_COUNTRIES;
}

export async function syncPublicHolidays(
  workspaceId: string,
  year: number,
): Promise<number> {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { country: true },
    });

    const country = workspace?.country?.trim().toUpperCase() ?? null;
    if (!country) {
      return 0;
    }

    const { data } = await axios.get<NagerHoliday[]>(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`,
      { timeout: 15_000 },
    );

    const publicHolidays = data.filter((holiday) =>
      holiday.types.includes("Public"),
    );

    const desiredRows = publicHolidays.map((holiday) => ({
      workspaceId,
      name: holiday.localName,
      date: new Date(`${holiday.date}T00:00:00.000Z`),
      category: "NATIONAL" as const,
      region: holiday.countryCode,
    }));

    for (const row of desiredRows) {
      await prisma.publicHoliday.upsert({
        where: {
          workspaceId_date_name: {
            workspaceId: row.workspaceId,
            date: row.date,
            name: row.name,
          },
        },
        create: row,
        update: {
          category: row.category,
          region: row.region,
        },
      });
    }

    const keepKeys = new Set(
      desiredRows.map((row) => `${row.date.toISOString().slice(0, 10)}|${row.name}`),
    );

    const { start, end } = yearRange(year);
    const existingRows = await prisma.publicHoliday.findMany({
      where: {
        workspaceId,
        category: "NATIONAL",
        date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        date: true,
        name: true,
      },
    });

    const toDeleteIds = existingRows
      .filter((row) => !keepKeys.has(`${row.date.toISOString().slice(0, 10)}|${row.name}`))
      .map((row) => row.id);

    if (toDeleteIds.length > 0) {
      await prisma.publicHoliday.deleteMany({
        where: { id: { in: toDeleteIds } },
      });
    }

    return desiredRows.length;
  } catch (error) {
    console.error("[syncPublicHolidays] Failed to sync public holidays", {
      workspaceId,
      year,
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}

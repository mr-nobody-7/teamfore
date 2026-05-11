import { prisma } from "../lib/db.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../utils/errors.js";

export const listTeams = async (workspaceId: string) => {
  return prisma.team.findMany({
    where: { workspaceId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
};

export const createTeam = async (workspaceId: string, name: string) => {
  const existing = await prisma.team.findFirst({
    where: { workspaceId, name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError("Team with this name already exists");
  }

  return prisma.team.create({
    data: { workspaceId, name },
    select: { id: true, name: true, createdAt: true },
  });
};

export const updateTeam = async (
  workspaceId: string,
  teamId: string,
  name: string,
) => {
  const [team, duplicate] = await Promise.all([
    prisma.team.findFirst({
      where: { id: teamId, workspaceId },
      select: { id: true },
    }),
    prisma.team.findFirst({
      where: {
        workspaceId,
        id: { not: teamId },
        name: { equals: name, mode: "insensitive" },
      },
      select: { id: true },
    }),
  ]);

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  if (duplicate) {
    throw new ConflictError("Another team with this name already exists");
  }

  return prisma.team.update({
    where: { id: teamId },
    data: { name },
    select: { id: true, name: true, createdAt: true },
  });
};

export const deleteTeam = async (workspaceId: string, teamId: string) => {
  const [team, activeUsers] = await Promise.all([
    prisma.team.findFirst({
      where: { id: teamId, workspaceId },
      select: { id: true },
    }),
    prisma.user.count({
      where: { workspaceId, teamId, isActive: true },
    }),
  ]);

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  if (activeUsers > 0) {
    throw new BadRequestError("Cannot delete team with active users");
  }

  await prisma.user.updateMany({
    where: { workspaceId, teamId },
    data: { teamId: null },
  });

  await prisma.team.delete({ where: { id: teamId } });
};

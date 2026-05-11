import bcrypt from "bcrypt";

import { prisma } from "../lib/db.js";
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateMyPasswordInput,
  UpdateMyProfileInput,
  UpdateUserInput,
} from "../types/index.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../utils/errors.js";

export const listUsers = async (workspaceId: string, query: ListUsersQuery) => {
  const where: {
    workspaceId: string;
    role?: "USER" | "MANAGER" | "ADMIN";
    teamId?: string;
    isActive?: boolean;
  } = { workspaceId };

  if (query.role) where.role = query.role;
  if (query.team_id) where.teamId = query.team_id;
  if (query.is_active !== undefined) where.isActive = query.is_active;

  const skip = (query.page - 1) * query.limit;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        workspaceId: true,
        teamId: true,
        team: { select: { id: true, name: true } },
      },
    }),
  ]);

  return { users, total, page: query.page, limit: query.limit };
};

export const createUser = async (
  workspaceId: string,
  input: CreateUserInput,
) => {
  const [team, existing] = await Promise.all([
    input.team_id
      ? prisma.team.findFirst({
          where: { id: input.team_id, workspaceId },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    }),
  ]);

  if (input.team_id && !team) {
    throw new BadRequestError("Invalid team selected");
  }

  if (existing) {
    throw new ConflictError("Email already in use");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      workspaceId,
      teamId: input.team_id ?? null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      workspaceId: true,
      teamId: true,
      team: { select: { id: true, name: true } },
    },
  });
};

export const updateUser = async (
  workspaceId: string,
  userId: string,
  input: UpdateUserInput,
) => {
  const [user, existing, team] = await Promise.all([
    prisma.user.findFirst({
      where: { id: userId, workspaceId },
      select: { id: true },
    }),
    input.email
      ? prisma.user.findFirst({
          where: {
            email: input.email,
            id: { not: userId },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
    input.team_id
      ? prisma.team.findFirst({
          where: { id: input.team_id, workspaceId },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (input.email && existing) {
    throw new ConflictError("Email already in use");
  }

  if (input.team_id && !team) {
    throw new BadRequestError("Invalid team selected");
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.team_id !== undefined ? { teamId: input.team_id } : {}),
      ...(input.is_active !== undefined ? { isActive: input.is_active } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      workspaceId: true,
      teamId: true,
      team: { select: { id: true, name: true } },
    },
  });
};

export const deactivateUser = async (workspaceId: string, userId: string) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, workspaceId },
    select: { id: true },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      teamId: true,
    },
  });
};

export const updateMyProfile = async (
  workspaceId: string,
  userId: string,
  input: UpdateMyProfileInput,
) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, workspaceId },
    select: { id: true },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { name: input.name.trim() },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      workspaceId: true,
      teamId: true,
      team: { select: { id: true, name: true } },
    },
  });
};

export const updateMyPassword = async (
  workspaceId: string,
  userId: string,
  input: UpdateMyPasswordInput,
) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, workspaceId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const currentPasswordValid = await bcrypt.compare(
    input.currentPassword,
    user.passwordHash,
  );

  if (!currentPasswordValid) {
    throw new BadRequestError("Current password is incorrect");
  }

  const nextPasswordHash = await bcrypt.hash(input.newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: nextPasswordHash },
  });
};

import { db } from '../db/client';
import { users } from '../db/schema';
import { sql } from 'drizzle-orm';
import type { User } from '../db/schema';

interface TaskRequirements {
  requiredSkills: string[];
  priority: string;
}

export async function findBestAssignee(task: TaskRequirements): Promise<User | null> {
  const allUsers = await db.select().from(users);
  const availableUsers = allUsers.filter(user => user.currentCapacity < user.maxCapacity);

  if (availableUsers.length === 0) return null;

  const usersWithScores = availableUsers.map(user => {
    const matchingSkills = task.requiredSkills.filter(skill => user.skills.includes(skill));
    const skillMatchPercentage = task.requiredSkills.length > 0
      ? Math.round((matchingSkills.length / task.requiredSkills.length) * 100)
      : 100;

    const availableCapacity = user.maxCapacity - user.currentCapacity;
    const capacityPercentage = Math.round((availableCapacity / user.maxCapacity) * 100);

    return { user, skillMatchPercentage, availableCapacity, capacityPercentage };
  });

  const matchedUsers = task.requiredSkills.length > 0
    ? usersWithScores.filter(u => u.skillMatchPercentage > 0)
    : usersWithScores;

  if (matchedUsers.length === 0) return null;

  matchedUsers.sort((a, b) => {
    if (b.availableCapacity !== a.availableCapacity) {
      return b.availableCapacity - a.availableCapacity;
    }
    return b.skillMatchPercentage - a.skillMatchPercentage;
  });

  return matchedUsers[0].user;
}

export async function getAssignmentInfo(userId: string, task: TaskRequirements) {
  const user = await db.select().from(users).where(sql`${users.id} = ${userId}`).limit(1);
  if (!user[0]) throw new Error(`User ${userId} not found`);

  const u = user[0];
  const matchingSkills = task.requiredSkills.filter(skill => u.skills.includes(skill));
  const skillMatchPercentage = task.requiredSkills.length > 0
    ? Math.round((matchingSkills.length / task.requiredSkills.length) * 100)
    : 100;

  const availableCapacity = u.maxCapacity - u.currentCapacity;
  const capacityPercentage = Math.round((availableCapacity / u.maxCapacity) * 100);

  return {
    userId: u.id,
    name: u.name,
    role: u.role || '',
    skillMatch: skillMatchPercentage,
    capacity: capacityPercentage
  };
}

export async function incrementUserCapacity(userId: string) {
  await db.update(users)
    .set({ currentCapacity: sql`${users.currentCapacity} + 1` })
    .where(sql`${users.id} = ${userId}`);
}

export async function decrementUserCapacity(userId: string) {
  await db.update(users)
    .set({ currentCapacity: sql`GREATEST(0, ${users.currentCapacity} - 1)` })
    .where(sql`${users.id} = ${userId}`);
}

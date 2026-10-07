import type { Role } from "@signa/shared";
import { ROLES } from "@signa/shared";
import { pgTable, text, uuid, pgEnum } from "drizzle-orm/pg-core";
import { asPgEnum, timestamps } from "../schemas/helper.schema";

export const roleEnum = pgEnum("role", asPgEnum(Object.values(ROLES)));

// ------------------- users -------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  fullname: text("full_name").notNull(),
  password: text("password").notNull(),
  avatar: text("avatar").notNull().default(""),
  bio: text("bio").notNull().default(""),
  role: roleEnum("role").notNull().default(ROLES.CLERK).$type<Role>(),
  ...timestamps
});

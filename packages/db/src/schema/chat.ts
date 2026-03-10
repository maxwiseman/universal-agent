import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const conversation = pgTable(
  "conversation",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    model: text("model").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("conversation_userId_idx").on(table.userId)],
);

export const message = pgTable(
  "message",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant", "system", "tool"] }).notNull(),
    parts: jsonb("parts").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("message_conversationId_idx").on(table.conversationId)],
);

export const artifact = pgTable(
  "artifact",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    messageId: text("message_id").references(() => message.id, { onDelete: "set null" }),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    path: text("path").notNull(),
    mimeType: text("mime_type"),
    content: text("content"),
    blobUrl: text("blob_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("artifact_conversationId_idx").on(table.conversationId)],
);

export const sandboxSession = pgTable(
  "sandbox_session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    sandboxId: text("sandbox_id"),
    snapshotId: text("snapshot_id"),
    blobPrefix: text("blob_prefix"),
    runtime: text("runtime").default("node").notNull(),
    status: text("status", { enum: ["running", "stopped", "snapshotted"] })
      .default("stopped")
      .notNull(),
    lastFileSync: timestamp("last_file_sync"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("sandbox_session_conversationId_idx").on(table.conversationId)],
);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  defaultModel: text("default_model"),
});

// Relations

export const conversationRelations = relations(conversation, ({ one, many }) => ({
  user: one(user, {
    fields: [conversation.userId],
    references: [user.id],
  }),
  messages: many(message),
  artifacts: many(artifact),
  sandboxSession: one(sandboxSession),
}));

export const messageRelations = relations(message, ({ one, many }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
  artifacts: many(artifact),
}));

export const artifactRelations = relations(artifact, ({ one }) => ({
  message: one(message, {
    fields: [artifact.messageId],
    references: [message.id],
  }),
  conversation: one(conversation, {
    fields: [artifact.conversationId],
    references: [conversation.id],
  }),
}));

export const sandboxSessionRelations = relations(sandboxSession, ({ one }) => ({
  conversation: one(conversation, {
    fields: [sandboxSession.conversationId],
    references: [conversation.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(user, {
    fields: [userSettings.userId],
    references: [user.id],
  }),
}));

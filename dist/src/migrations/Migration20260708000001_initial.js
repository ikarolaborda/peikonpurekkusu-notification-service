"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20260708000001_initial = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20260708000001_initial extends migrations_1.Migration {
    async up() {
        this.addSql(`
      create table "notifications" (
        "id" uuid primary key,
        "user_id" uuid not null,
        "template_id" varchar(255) not null,
        "channel" varchar(255) not null,
        "rendered_title" varchar(255) not null,
        "rendered_body" text not null,
        "params" jsonb not null,
        "read_at" timestamptz null,
        "created_at" timestamptz not null
      );
      create index "notifications_user_id_index" on "notifications" ("user_id");
    `);
        this.addSql(`
      create table "delivery_attempts" (
        "id" uuid primary key,
        "notification_id" uuid not null,
        "channel" varchar(255) not null,
        "status" varchar(255) not null,
        "attempt" int not null,
        "detail" varchar(255) null,
        "created_at" timestamptz not null
      );
      create index "delivery_attempts_notification_id_index" on "delivery_attempts" ("notification_id");
    `);
        this.addSql(`
      create table "dev_inbox" (
        "id" uuid primary key,
        "channel" varchar(255) not null,
        "user_id" uuid not null,
        "title" varchar(255) not null,
        "body" text not null,
        "created_at" timestamptz not null
      );
    `);
        this.addSql(`
      create table "processed_events" (
        "event_id" uuid primary key,
        "processed_at" timestamptz not null default now()
      );
    `);
        this.addSql(`
      create table "outbox" (
        "id" uuid primary key,
        "aggregatetype" varchar(255) not null,
        "aggregateid" varchar(255) not null,
        "type" varchar(255) not null,
        "payload" jsonb not null,
        "created_at" timestamptz not null,
        "processed_at" timestamptz null
      );
      create index "outbox_unprocessed_idx" on "outbox" ("id") where "processed_at" is null;
    `);
    }
    async down() {
        this.addSql('drop table if exists "outbox", "processed_events", "dev_inbox", "delivery_attempts", "notifications";');
    }
}
exports.Migration20260708000001_initial = Migration20260708000001_initial;
//# sourceMappingURL=Migration20260708000001_initial.js.map
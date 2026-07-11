"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migrations_1 = require("@mikro-orm/migrations");
const postgresql_1 = require("@mikro-orm/postgresql");
const delivery_attempt_entity_js_1 = require("./src/entities/delivery-attempt.entity.js");
const dev_inbox_entity_js_1 = require("./src/entities/dev-inbox.entity.js");
const notification_entity_js_1 = require("./src/entities/notification.entity.js");
const outbox_event_entity_js_1 = require("./src/entities/outbox-event.entity.js");
const processed_event_entity_js_1 = require("./src/entities/processed-event.entity.js");
exports.default = (0, postgresql_1.defineConfig)({
    host: process.env.NOTIFICATION_DB_HOST ?? 'notification-db',
    port: Number(process.env.NOTIFICATION_DB_PORT ?? 5432),
    user: process.env.NOTIFICATION_DB_USER,
    password: process.env.NOTIFICATION_DB_PASSWORD,
    dbName: process.env.NOTIFICATION_DB_NAME,
    entities: [notification_entity_js_1.Notification, delivery_attempt_entity_js_1.DeliveryAttempt, dev_inbox_entity_js_1.DevInboxItem, processed_event_entity_js_1.ProcessedEvent, outbox_event_entity_js_1.OutboxEvent],
    extensions: [migrations_1.Migrator],
    migrations: { path: 'dist/src/migrations', pathTs: 'src/migrations', transactional: true, allOrNothing: true, snapshot: false },
    forceUtcTimezone: true,
});
//# sourceMappingURL=mikro-orm.config.js.map
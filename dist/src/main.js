"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const postgresql_1 = require("@mikro-orm/postgresql");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_js_1 = require("./app.module.js");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_js_1.AppModule);
    const logger = new common_1.Logger('bootstrap');
    app.enableShutdownHooks();
    const orm = app.get(postgresql_1.MikroORM);
    await orm.migrator.up();
    logger.log('migrations applied');
    await app.listen(8080, '0.0.0.0');
    logger.log('notification-service listening on :8080');
}
void bootstrap();
//# sourceMappingURL=main.js.map
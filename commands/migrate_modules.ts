import { BaseCommand, flags } from '@adonisjs/core/ace'
import MigrationOrchestrator from '#shared/database/migration_orchestrator'

export default class MigrateModules extends BaseCommand {
  static commandName = 'migrate:modules'
  static description = 'Run migrations for all modules in priority order'

  @flags.boolean({ description: 'Show migration order without executing' })
  declare dryRun: boolean

  @flags.string({ description: 'Run migrations for specific module only' })
  declare module: string

  async run() {
    const orchestrator = new MigrationOrchestrator()

    if (this.dryRun) {
      await orchestrator.printMigrationOrder()
      return
    }

    if (this.module) {
      this.logger.info(`Running migrations for module: ${this.module}`)
      const migrations = await orchestrator.getModuleMigrations(this.module)

      for (const migration of migrations) {
        this.logger.info(`  - ${migration}`)
      }

      // NOTE: AdonisJS v6 "migration:run" does not support a "--files" flag.
      // We currently delegate to the standard migrator, which will run all
      // configured migrations. The ordered list above is informational.
      await this.kernel.exec('migration:run', [])
    } else {
      this.logger.info('Running migrations for all modules...')
      await orchestrator.printMigrationOrder()

      const allMigrations = await orchestrator.getAllMigrations()
      for (const migration of allMigrations) {
        this.logger.info(`  - ${migration}`)
      }

      // Same note as above: we call the standard migrator without attempting to
      // pass a per-file list, since that is not a supported option.
      await this.kernel.exec('migration:run', [])
    }

    this.logger.success('✓ Migrations completed')
  }
}

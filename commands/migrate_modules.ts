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

      // Exécuter les migrations
      await this.kernel.exec('migration:run', [`--files=${migrations.join(',')}`])
    } else {
      this.logger.info('Running migrations for all modules...')
      await orchestrator.printMigrationOrder()

      const allMigrations = await orchestrator.getAllMigrations()
      await this.kernel.exec('migration:run', [`--files=${allMigrations.join(',')}`])
    }

    this.logger.success('✓ Migrations completed')
  }
}

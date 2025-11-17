import { BaseCommand, flags } from '@adonisjs/core/ace'
import MigrationOrchestrator from '#shared/database/migration_orchestrator'

export default class SeedModules extends BaseCommand {
  static commandName = 'seed:modules'
  static description = 'Run seeders for all modules in priority order'

  @flags.boolean({ description: 'Show seeder order without executing' })
  declare dryRun: boolean

  @flags.string({ description: 'Run seeders for specific module only' })
  declare module: string

  async run() {
    const orchestrator = new MigrationOrchestrator()

    if (this.dryRun) {
      await orchestrator.printSeederOrder()
      return
    }

    if (this.module) {
      this.logger.info(`Running seeders for module: ${this.module}`)
      const seeders = await orchestrator.getModuleSeeders(this.module)

      if (seeders.length === 0) {
        this.logger.info('No seeders found for this module')
        return
      }

      seeders.forEach((file) => this.logger.info(`  - ${file}`))

      await this.kernel.exec('db:seed', [`--files=${seeders.join(',')}`])
    } else {
      this.logger.info('Running seeders for all modules...')
      await orchestrator.printSeederOrder()

      const allSeeders = await orchestrator.getAllSeeders()

      if (allSeeders.length === 0) {
        this.logger.info('No module seeders found')
        return
      }

      await this.kernel.exec('db:seed', [`--files=${allSeeders.join(',')}`])
    }

    this.logger.success('✓ Seeders completed')
  }
}

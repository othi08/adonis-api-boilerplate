import { BaseCommand, flags } from '@adonisjs/core/ace'
import { relative } from 'node:path'
import MigrationOrchestrator from '#shared/database/migration_orchestrator'
import db from '@adonisjs/lucid/services/db'

export default class SeedModules extends BaseCommand {
  static commandName = 'seed:modules'
  static description = 'Run seeders for all modules in priority order'
  static needsApplication = true

  private dbManager?: typeof import('@adonisjs/lucid/services/db').default

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
      await this.runSeedersSequentially(await orchestrator.getModuleSeeders(this.module))
    } else {
      this.logger.info('Running seeders for all modules...')
      await orchestrator.printSeederOrder()

      const allSeeders = await orchestrator.getAllSeeders()

      if (allSeeders.length === 0) {
        this.logger.info('No module seeders found')
        return
      }

      await this.runSeedersSequentially(allSeeders)
    }

    this.logger.success('✓ Seeders completed')
  }

  private async runSeedersSequentially(files: string[]) {
    if (files.length === 0) {
      this.logger.info('No seeders found')
      return
    }

    const dbManager = await this.getDbManager()
    const client = dbManager.connection()
    for (const file of files) {
      const relativePath = relative(process.cwd(), file)
      this.logger.info(`Running seeder: ${relativePath}`)
      await this.executeSeeder(file, client)
    }
  }

  private async executeSeeder(file: string, client: ReturnType<typeof db.connection>) {
    const seederModule = await import(file)
    const SeederClass = seederModule.default

    if (!SeederClass) {
      this.logger.warning(`Skipping seeder without default export: ${file}`)
      return
    }

    const seederInstance = new SeederClass(this.app)
    if (typeof seederInstance.run !== 'function') {
      this.logger.warning(`Seeder does not implement run(): ${file}`)
      return
    }

    await seederInstance.run({ client })
  }

  private async getDbManager() {
    if (!this.dbManager) {
      const { default: dbService } = await import('@adonisjs/lucid/services/db')
      this.dbManager = dbService
    }

    return this.dbManager
  }
}

import { BaseCommand, args } from '@adonisjs/core/ace'
import ModuleManager from '#shared/modules/module_manager'

export default class ModuleCheck extends BaseCommand {
  static commandName = 'module:check'
  static description = 'Check modules configuration and dependencies'

  @args.string({ description: 'Optional module name to check', required: false })
  declare moduleName?: string

  async run() {
    const moduleManager = ModuleManager.getInstance()
    await moduleManager.discoverModules()

    const target = this.moduleName
    if (target) {
      this.logger.info(`Checking dependencies for module: ${target}...`)
    } else {
      this.logger.info('Checking dependencies for all modules...')
    }

    try {
      await moduleManager.printDependencyTree(target)
      this.logger.success('✓ Module dependencies are valid')
    } catch (error) {
      this.logger.error(`Dependency error: ${error.message}`)
      this.exitCode = 1
    }
  }
}

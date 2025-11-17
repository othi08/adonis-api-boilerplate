import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class TestModule extends BaseCommand {
  static commandName = 'test:module'
  static description = 'Run tests for a specific module or all modules'

  @flags.string({ description: 'Module name' })
  declare module: string

  @flags.string({ description: 'Test type: unit, functional, integration, all' })
  declare type: string

  async run() {
    const moduleName = this.module
    const testType = this.type || 'all'

    let testPattern = 'tests/modules/**/*.spec.ts'

    if (moduleName) {
      if (testType === 'unit') {
        testPattern = `tests/modules/${moduleName}/models/**/*.spec.ts`
      } else if (testType === 'functional') {
        testPattern = `tests/modules/${moduleName}/functional/**/*.spec.ts`
      } else if (testType === 'integration') {
        testPattern = `tests/modules/${moduleName}/integration/**/*.spec.ts`
      } else {
        testPattern = `tests/modules/${moduleName}/**/*.spec.ts`
      }
    }

    this.logger.info(`Running tests: ${testPattern}`)

    await this.kernel.exec('test', [testPattern])
  }
}

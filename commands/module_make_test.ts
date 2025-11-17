import { BaseCommand, args } from '@adonisjs/core/ace'
import TestGenerator from '#shared/testing/test_generator'

export default class ModuleMakeTest extends BaseCommand {
  static commandName = 'module:make:test'
  static description = 'Generate tests for a module'

  @args.string({ description: 'Module name' })
  declare module: string

  @args.string({ description: 'Test type: model, controller, integration, all' })
  declare type: string

  @args.string({ description: 'Model or Controller name', required: false })
  declare name?: string

  @args.string({
    description: 'Resource name for controller tests (e.g., products)',
    required: false,
  })
  declare resource?: string

  async run() {
    const moduleName = this.module
    const testType = this.type

    if (!testType) {
      this.logger.error('Test type is required. Use --type=model|controller|integration|all')
      this.exitCode = 1
      return
    }

    try {
      if (testType === 'model' || testType === 'all') {
        const modelName = this.name
        if (!modelName) {
          this.logger.error('Model name is required for model/all tests. Use --name=<ModelName>')
          this.exitCode = 1
          return
        }
        const path = await TestGenerator.generateModelTests(moduleName, modelName)
        this.logger.success(`✓ Model tests created: ${path}`)
      }

      if (testType === 'controller' || testType === 'all') {
        const controllerName = this.name
        if (!controllerName) {
          this.logger.error(
            'Controller name is required for controller/all tests. Use --name=<ControllerName>'
          )
          this.exitCode = 1
          return
        }

        const resourceName = this.resource
        if (!resourceName) {
          this.logger.error(
            'Resource name is required for controller/all tests. Use --resource=<resource>'
          )
          this.exitCode = 1
          return
        }
        const path = await TestGenerator.generateControllerTests(
          moduleName,
          controllerName,
          resourceName
        )
        this.logger.success(`✓ Controller tests created: ${path}`)
      }

      if (testType === 'integration' || testType === 'all') {
        const path = await TestGenerator.generateIntegrationTests(moduleName)
        this.logger.success(`✓ Integration tests created: ${path}`)
      }
    } catch (error) {
      this.logger.error(`Failed to generate tests: ${error.message}`)
      this.exitCode = 1
    }
  }
}

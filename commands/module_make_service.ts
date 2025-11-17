import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export default class ModuleMakeService extends BaseCommand {
  static commandName = 'module:make:service'
  static description = 'Create a service in a specific module'

  @args.string({ description: 'Module name' })
  declare module: string

  @flags.string({ description: 'Service name' })
  declare name: string

  async run() {
    const moduleName = this.module
    const serviceName = this.name || (await this.prompt.ask('Enter service name'))
    const modulePath = this.app.makePath('src', 'modules', moduleName)

    const serviceContent = `export default class ${this.toPascalCase(serviceName)} {
  /**
   * Service logic here
   */
  async execute() {
    // Implementation
  }
}
`

    const servicePath = join(modulePath, 'services', `${this.toSnakeCase(serviceName)}.ts`)

    try {
      await writeFile(servicePath, serviceContent)
      this.logger.success(`✓ Service ${serviceName} created in module ${moduleName}`)
    } catch (error) {
      this.logger.error(`Failed to create service: ${error.message}`)
      this.exitCode = 1
    }
  }

  private toPascalCase(name: string): string {
    return name
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  }

  private toSnakeCase(name: string): string {
    return name
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
  }
}

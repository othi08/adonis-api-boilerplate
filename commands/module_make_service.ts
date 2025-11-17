import { BaseCommand, args } from '@adonisjs/core/ace'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export default class ModuleMakeService extends BaseCommand {
  static commandName = 'module:make:service'
  static description = 'Create a service in a specific module'

  @args.string({ description: 'Module name' })
  declare module: string

  @args.string({ description: 'Service name' })
  declare name: string

  async run() {
    const moduleName = this.module
    const rawName = this.name
    if (!rawName) {
      this.logger.error(
        'Service name is required. Example: node ace module:make:service inventory Product'
      )
      this.exitCode = 1
      return
    }

    const baseName = this.normalizeServiceBase(rawName)
    const className = `${baseName}Service`
    const modulePath = this.app.makePath('src', 'modules', moduleName)

    const serviceContent = `export default class ${className} {
  /**
   * Service logic here
   */
  async execute() {
    // Implementation
  }
}
`

    const servicePath = join(modulePath, 'services', `${this.toSnakeCase(className)}.ts`)

    try {
      await writeFile(servicePath, serviceContent)
      this.logger.success(`✓ Service ${className} created in module ${moduleName}`)
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

  private normalizeServiceBase(name: string): string {
    // Remove existing "Service" suffix if present and normalize to PascalCase base
    const withoutSuffix = name.replace(/Service$/i, '')
    return this.toPascalCase(withoutSuffix)
  }
}

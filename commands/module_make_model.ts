import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export default class ModuleMakeModel extends BaseCommand {
  static commandName = 'module:make:model'
  static description = 'Create a model in a specific module'

  @args.string({ description: 'Module name' })
  declare module: string

  @flags.string({ description: 'Model name' })
  declare name: string

  @flags.boolean({ description: 'Create migration' })
  declare migration: boolean

  async run() {
    const moduleName = this.module
    const modelName = this.name || (await this.prompt.ask('Enter model name'))
    const modulePath = this.app.makePath('src', 'modules', moduleName)

    const modelContent = `import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ${this.toPascalCase(modelName)} extends BaseModel {
  static table = '${this.toSnakeCase(this.toPlural(modelName))}'

  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
`

    const modelPath = join(modulePath, 'models', `${this.toSnakeCase(modelName)}.ts`)

    try {
      await writeFile(modelPath, modelContent)
      this.logger.success(`✓ Model ${modelName} created in module ${moduleName}`)

      if (this.migration) {
        // Créer aussi la migration
        await this.kernel.exec('module:make:migration', [
          moduleName,
          `create_${this.toSnakeCase(this.toPlural(modelName))}_table`,
        ])
      }
    } catch (error) {
      this.logger.error(`Failed to create model: ${error.message}`)
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

  private toPlural(name: string): string {
    if (name.endsWith('y')) {
      return name.slice(0, -1) + 'ies'
    }
    if (name.endsWith('s')) {
      return name + 'es'
    }
    return name + 's'
  }
}

import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export default class ModuleMakeValidator extends BaseCommand {
  static commandName = 'module:make:validator'
  static description = 'Create a validator in a specific module'

  @args.string({ description: 'Module name' })
  declare module: string

  @args.string({ description: 'Validator name' })
  declare name: string

  @flags.boolean({ description: 'Create CRUD validators' })
  declare crud: boolean

  async run() {
    const moduleName = this.module
    const rawName = this.name
    if (!rawName) {
      this.logger.error(
        'Validator name is required. Example: node ace module:make:validator inventory Product'
      )
      this.exitCode = 1
      return
    }

    const baseName = this.normalizeValidatorBase(rawName)
    const validatorName = `${baseName}Validator`
    const modulePath = this.app.makePath('src', 'modules', moduleName)

    const validatorContent = this.crud
      ? this.generateCrudValidator(validatorName)
      : this.generateBasicValidator(validatorName)

    const validatorPath = join(modulePath, 'validators', `${this.toSnakeCase(validatorName)}.ts`)

    try {
      await writeFile(validatorPath, validatorContent)
      this.logger.success(`✓ Validator ${validatorName} created in module ${moduleName}`)
    } catch (error) {
      this.logger.error(`Failed to create validator: ${error.message}`)
      this.exitCode = 1
    }
  }

  private generateBasicValidator(name: string): string {
    return `import vine from '@vinejs/vine'

export const ${this.toCamelCase(name)}Validator = vine.compile(
  vine.object({
    // Define your validation rules here
    name: vine.string().trim().minLength(2),
  })
)
`
  }

  private generateCrudValidator(name: string): string {
    const entityName = name.replace(/Validator$/, '')
    return `import vine from '@vinejs/vine'

/**
 * Validator for creating ${entityName}
 */
export const create${this.toPascalCase(entityName)}Validator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(200),
    description: vine.string().optional(),
    status: vine.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
)

/**
 * Validator for updating ${entityName}
 */
export const update${this.toPascalCase(entityName)}Validator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(200).optional(),
    description: vine.string().optional(),
    status: vine.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
)

/**
 * Validator for querying ${entityName} list
 */
export const query${this.toPascalCase(entityName)}Validator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    search: vine.string().optional(),
    status: vine.enum(['ACTIVE', 'INACTIVE']).optional(),
    sortBy: vine.string().optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
  })
)
`
  }

  private toPascalCase(name: string): string {
    return name
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  }

  private toCamelCase(name: string): string {
    const pascal = this.toPascalCase(name)
    return pascal.charAt(0).toLowerCase() + pascal.slice(1)
  }

  private toSnakeCase(name: string): string {
    return name
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
  }

  private normalizeValidatorBase(name: string): string {
    // Remove existing "Validator" suffix if present and normalize to PascalCase base
    const withoutSuffix = name.replace(/Validator$/i, '')
    return this.toPascalCase(withoutSuffix)
  }
}

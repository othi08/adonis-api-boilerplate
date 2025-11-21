import { BaseCommand, args } from '@adonisjs/core/ace'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DateTime } from 'luxon'

export default class ModuleMakeSeeder extends BaseCommand {
  static commandName = 'module:make:seeder'
  static description = 'Create a database seeder in a specific module'

  @args.string({ description: 'Module name' })
  declare module: string

  @args.string({ description: 'Seeder class name (without "Seeder" suffix)' })
  declare name: string

  async run() {
    const moduleName = this.module
    const rawName = this.name

    if (!rawName) {
      this.logger.error('Seeder name is required. Example: node ace module:make:seeder user User')
      this.exitCode = 1
      return
    }

    const baseName = this.normalizeBaseName(rawName)
    const className = `${baseName}Seeder`

    const modulePath = this.app.makePath('src', 'modules', moduleName)
    const timestamp = DateTime.now().toFormat('yyyy_MM_dd_HHmmss')
    const fileName = `${timestamp}_${this.toSnakeCase(baseName)}.ts`

    const seederContent = `import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class ${className} extends BaseSeeder {
  public static environment = ['development', 'testing']

  public async run () {
    // Write your database queries inside the run method
  }
}
`

    const seederPath = join(modulePath, 'database', 'seeders', fileName)

    try {
      await writeFile(seederPath, seederContent)
      this.logger.success(`✓ Seeder ${className} created in module ${moduleName}`)
      this.logger.info(`Path: ${seederPath}`)
    } catch (error: any) {
      this.logger.error(`Failed to create seeder: ${error.message}`)
      this.exitCode = 1
    }
  }

  private normalizeBaseName(name: string): string {
    // Remove existing "Seeder" suffix and convert to PascalCase base
    const withoutSuffix = name.replace(/Seeder$/i, '')
    return this.toPascalCase(withoutSuffix)
  }

  private toPascalCase(name: string): string {
    return name
      .split(/[-_]/)
      .filter((part) => part.length > 0)
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

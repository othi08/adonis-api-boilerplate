import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DateTime } from 'luxon'

export default class ModuleMakeMigration extends BaseCommand {
  static commandName = 'module:make:migration'
  static description = 'Create a migration in a specific module'

  @args.string({ description: 'Module name' })
  declare module: string

  @flags.string({ description: 'Migration name' })
  declare name: string

  async run() {
    const moduleName = this.module
    const migrationName = this.name || (await this.prompt.ask('Enter migration name'))
    const modulePath = this.app.makePath('src', 'modules', moduleName)

    const timestamp = DateTime.now().toFormat('yyyy_MM_dd_HHmmss')
    const fileName = `${timestamp}_${migrationName}.ts`

    const migrationContent = `import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = '${this.extractTableName(migrationName)}'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
`

    const migrationPath = join(modulePath, 'database', 'migrations', fileName)

    try {
      await writeFile(migrationPath, migrationContent)
      this.logger.success(`✓ Migration ${fileName} created in module ${moduleName}`)
      this.logger.info(`Path: ${migrationPath}`)
    } catch (error) {
      this.logger.error(`Failed to create migration: ${error.message}`)
      this.exitCode = 1
    }
  }

  private extractTableName(migrationName: string): string {
    // Extract table name from migration name
    // create_users_table → users
    // add_email_to_users_table → users
    const match = migrationName.match(/_([a-z_]+)_table$/)
    return match ? match[1] : 'table_name'
  }
}

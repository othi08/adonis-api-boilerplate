import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export default class MakeModule extends BaseCommand {
  static commandName = 'make:module'
  static description = 'Create a new module with standard structure'

  @args.string({ description: 'Module name' })
  declare name: string

  static options: CommandOptions = {}

  async run() {
    const moduleName = this.name
    const modulePath = this.app.makePath('src', 'modules', moduleName)

    this.logger.info(`Creating module: ${moduleName}`)

    try {
      // Créer la structure de dossiers
      const folders = [
        'controllers',
        'models',
        'services',
        'validators',
        'routes',
        'config',
        'database/migrations',
        'database/seeders',
      ]

      for (const folder of folders) {
        await mkdir(join(modulePath, folder), { recursive: true })
      }

      // Créer module.json
      const moduleConfig = {
        name: moduleName,
        displayName: this.toDisplayName(moduleName),
        version: '1.0.0',
        description: `${this.toDisplayName(moduleName)} module`,
        enabled: true,
        dependencies: [],
        routes: {
          prefix: `/api/v1/${moduleName}`,
          middleware: ['auth'],
        },
        migrations: {
          path: 'database/migrations',
          priority: 999,
        },
        seeders: {
          path: 'database/seeders',
        },
      }

      await writeFile(
        join(modulePath, 'config', 'module.json'),
        JSON.stringify(moduleConfig, null, 2)
      )

      // Créer .gitkeep pour les dossiers vides
      const gitkeepDirs = ['controllers', 'models', 'services', 'validators']
      for (const dir of gitkeepDirs) {
        await writeFile(join(modulePath, dir, '.gitkeep'), '')
      }

      // Créer le fichier de routes
      const routesContent = `import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// const ${this.toPascalCase(moduleName)}Controller = () => import('#modules/${moduleName}/controllers/${moduleName}_controller')

router
  .group(() => {
    // Définissez vos routes ici
    // router.get('${moduleName}', [${this.toPascalCase(moduleName)}Controller, 'index'])
  })
  .prefix('api/v1/${moduleName}')
  .use(middleware.auth())

export default router
`

      await writeFile(join(modulePath, 'routes', `${moduleName}.ts`), routesContent)

      // Créer README
      const readmeContent = `# ${this.toDisplayName(moduleName)} Module

## Description
${this.toDisplayName(moduleName)} module for Track Flow ERP

## Structure
- \`controllers/\` - HTTP controllers
- \`models/\` - Database models
- \`services/\` - Business logic
- \`validators/\` - Request validators
- \`routes/\` - Route definitions
- \`database/migrations/\` - Database migrations
- \`database/seeders/\` - Database seeders

## Usage
\`\`\`typescript
// Import the module
import ${this.toPascalCase(moduleName)} from '#modules/${moduleName}/models/${moduleName}'
\`\`\`
`

      await writeFile(join(modulePath, 'README.md'), readmeContent)

      this.logger.success(`✓ Module ${moduleName} created successfully!`)
      this.logger.info(`\nNext steps:`)
      this.logger.info(`  1. Create a model: node ace module:${moduleName} make:model`)
      this.logger.info(`  2. Create a controller: node ace module:${moduleName} make:controller`)
      this.logger.info(`  3. Create a migration: node ace module:${moduleName} make:migration`)
    } catch (error) {
      this.logger.error(`Failed to create module: ${error.message}`)
      this.exitCode = 1
    }
  }

  private toDisplayName(name: string): string {
    return name
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  private toPascalCase(name: string): string {
    return name
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  }
}

import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import { writeFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default class ModuleMakeRoute extends BaseCommand {
  static commandName = 'module:make:route'
  static description = 'Add routes to a module'

  @args.string({ description: 'Module name' })
  declare module: string

  @args.string({ description: 'Resource name (e.g., products)' })
  declare resource: string

  @flags.boolean({ description: 'Add API resource routes (CRUD)' })
  declare api: boolean

  async run() {
    const moduleName = this.module
    const resourceName = this.resource
    if (!resourceName) {
      this.logger.error('Resource name is required. Use --resource=<name>')
      this.exitCode = 1
      return
    }
    const modulePath = this.app.makePath('src', 'modules', moduleName)
    const routesPath = join(modulePath, 'routes', `${moduleName}.ts`)

    try {
      // Lire le fichier de routes existant
      let routesContent = await readFile(routesPath, 'utf-8')

      if (this.api) {
        const controllerName = this.toPascalCase(resourceName) + 'Controller'
        const newRoutes = this.generateApiRoutes(resourceName, controllerName, moduleName)

        // Insérer les routes avant la dernière ligne
        const lines = routesContent.split('\n')
        const lastBraceIndex = lines.lastIndexOf('  })')

        if (lastBraceIndex !== -1) {
          lines.splice(lastBraceIndex, 0, newRoutes)
          routesContent = lines.join('\n')
        }
      }

      await writeFile(routesPath, routesContent)
      this.logger.success(`✓ Routes added to module ${moduleName}`)
    } catch (error) {
      this.logger.error(`Failed to add routes: ${error.message}`)
      this.exitCode = 1
    }
  }

  private generateApiRoutes(
    resourceName: string,
    controllerName: string,
    _moduleName: string
  ): string {
    return `
    // ${resourceName} routes
    router.get('${resourceName}', [${controllerName}, 'index'])
    router.post('${resourceName}', [${controllerName}, 'store'])
    router.get('${resourceName}/:id', [${controllerName}, 'show'])
    router.put('${resourceName}/:id', [${controllerName}, 'update'])
    router.delete('${resourceName}/:id', [${controllerName}, 'destroy'])
`
  }

  private toPascalCase(name: string): string {
    return name
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  }
}

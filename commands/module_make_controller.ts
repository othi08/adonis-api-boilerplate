import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export default class ModuleMakeController extends BaseCommand {
  static commandName = 'module:make:controller'
  static description = 'Create a controller in a specific module'

  @args.string({ description: 'Module name' })
  declare module: string

  @args.string({ description: 'Controller name' })
  declare name: string

  @flags.boolean({ description: 'Create resource controller' })
  declare resource: boolean

  async run() {
    const moduleName = this.module
    const controllerName = this.normalizeControllerName(this.name)
    const modulePath = this.app.makePath('src', 'modules', moduleName)

    const controllerContent = this.resource
      ? this.generateResourceController(controllerName, moduleName)
      : this.generateBasicController(controllerName)

    const controllerPath = join(modulePath, 'controllers', `${this.toSnakeCase(controllerName)}.ts`)

    try {
      await writeFile(controllerPath, controllerContent)
      this.logger.success(`✓ Controller ${controllerName} created in module ${moduleName}`)
    } catch (error) {
      this.logger.error(`Failed to create controller: ${error.message}`)
      this.exitCode = 1
    }
  }

  private generateBasicController(name: string): string {
    return `import type { HttpContext } from '@adonisjs/core/http'

export default class ${this.toPascalCase(name)} {
  /**
   * Handle request
   */
  async handle({ request, response }: HttpContext) {
    return response.ok({
      success: true,
      message: 'Hello from ${name}',
    })
  }
}
`
  }

  private generateResourceController(name: string, moduleName: string): string {
    const modelName = name.replace(/Controller$/, '')
    return `import type { HttpContext } from '@adonisjs/core/http'
import ${this.toPascalCase(modelName)} from '#modules/${moduleName}/models/${this.toSnakeCase(modelName)}'

export default class ${this.toPascalCase(name)} {
  /**
   * Display a list of resources
   * GET /
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const items = await ${this.toPascalCase(modelName)}.query().paginate(page, limit)

    return response.ok({
      success: true,
      data: items.serialize(),
      meta: items.getMeta(),
    })
  }

  /**
   * Display a single resource
   * GET /:id
   */
  async show({ params, response }: HttpContext) {
    const item = await ${this.toPascalCase(modelName)}.findOrFail(params.id)

    return response.ok({
      success: true,
      data: item.serialize(),
    })
  }

  /**
   * Create a new resource
   * POST /
   */
  async store({ request, response }: HttpContext) {
    const data = request.all()
    const item = await ${this.toPascalCase(modelName)}.create(data)

    return response.created({
      success: true,
      message: 'Created successfully',
      data: item.serialize(),
    })
  }

  /**
   * Update a resource
   * PUT /:id
   */
  async update({ params, request, response }: HttpContext) {
    const item = await ${this.toPascalCase(modelName)}.findOrFail(params.id)
    const data = request.all()

    item.merge(data)
    await item.save()

    return response.ok({
      success: true,
      message: 'Updated successfully',
      data: item.serialize(),
    })
  }

  /**
   * Delete a resource
   * DELETE /:id
   */
  async destroy({ params, response }: HttpContext) {
    const item = await ${this.toPascalCase(modelName)}.findOrFail(params.id)
    await item.delete()

    return response.ok({
      success: true,
      message: 'Deleted successfully',
    })
  }
}
`
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

  private normalizeControllerName(name: string): string {
    if (!name) {
      return name
    }

    // If the user already provided a name ending with "Controller", keep it
    if (/Controller$/i.test(name)) {
      return this.toPascalCase(name.replace(/Controller$/i, '')) + 'Controller'
    }

    // Otherwise, build a PascalCase name and append the suffix
    return this.toPascalCase(name) + 'Controller'
  }
}

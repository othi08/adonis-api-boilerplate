import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

export default class TestGenerator {
  /**
   * Générer tests unitaires pour un modèle
   */
  static async generateModelTests(moduleName: string, modelName: string): Promise<string> {
    const content = `import { test } from '@japa/runner'
import ${modelName} from '#modules/${moduleName}/models/${this.toSnakeCase(modelName)}'

test.group('${modelName} Model', () => {
  test('should create a ${modelName.toLowerCase()}', async ({ assert }) => {
    const data = {
      name: 'Test ${modelName}',
      // Add more fields
    }

    const item = await ${modelName}.create(data)

    assert.exists(item.id)
    assert.equal(item.name, data.name)
  })

  test('should update a ${modelName.toLowerCase()}', async ({ assert }) => {
    const item = await ${modelName}.create({ name: 'Original' })
    
    item.name = 'Updated'
    await item.save()

    assert.equal(item.name, 'Updated')
  })

  test('should delete a ${modelName.toLowerCase()}', async ({ assert }) => {
    const item = await ${modelName}.create({ name: 'To Delete' })
    await item.delete()

    const found = await ${modelName}.find(item.id)
    assert.isNull(found)
  })

  test('should find a ${modelName.toLowerCase()} by id', async ({ assert }) => {
    const item = await ${modelName}.create({ name: 'Find Me' })
    const found = await ${modelName}.find(item.id)

    assert.exists(found)
    assert.equal(found?.id, item.id)
  })
})
`

    const testPath = join(
      'tests',
      'modules',
      moduleName,
      'models',
      `${this.toSnakeCase(modelName)}.spec.ts`
    )

    await mkdir(join('tests', 'modules', moduleName, 'models'), { recursive: true })
    await writeFile(testPath, content)

    return testPath
  }

  /**
   * Générer tests fonctionnels pour un controller
   */
  static async generateControllerTests(
    moduleName: string,
    controllerName: string,
    resourceName: string
  ): Promise<string> {
    const content = `import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('${controllerName}', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('GET /${resourceName} - should return paginated list', async ({ client, assert }) => {
    const response = await client.get('/api/v1/${resourceName}')

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
    })

    assert.properties(response.body().data, ['data', 'meta'])
  })

  test('POST /${resourceName} - should create new item', async ({ client, assert }) => {
    const data = {
      name: 'Test Item',
      // Add more fields
    }

    const response = await client.post('/api/v1/${resourceName}').json(data)

    response.assertStatus(201)
    response.assertBodyContains({
      success: true,
      message: 'Created successfully',
    })

    assert.exists(response.body().data.id)
  })

  test('GET /${resourceName}/:id - should return single item', async ({ client }) => {
    // Create test item
    const createResponse = await client.post('/api/v1/${resourceName}').json({
      name: 'Test Item',
    })

    const id = createResponse.body().data.id

    const response = await client.get(\`/api/v1/${resourceName}/\${id}\`)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
    })
  })

  test('PUT /${resourceName}/:id - should update item', async ({ client, assert }) => {
    // Create test item
    const createResponse = await client.post('/api/v1/${resourceName}').json({
      name: 'Original Name',
    })

    const id = createResponse.body().data.id

    const response = await client.put(\`/api/v1/${resourceName}/\${id}\`).json({
      name: 'Updated Name',
    })

    response.assertStatus(200)
    assert.equal(response.body().data.name, 'Updated Name')
  })

  test('DELETE /${resourceName}/:id - should delete item', async ({ client }) => {
    // Create test item
    const createResponse = await client.post('/api/v1/${resourceName}').json({
      name: 'To Delete',
    })

    const id = createResponse.body().data.id

    const response = await client.delete(\`/api/v1/${resourceName}/\${id}\`)

    response.assertStatus(200)
    response.assertBodyContains({
      success: true,
      message: 'Deleted successfully',
    })

    // Verify deletion
    const getResponse = await client.get(\`/api/v1/${resourceName}/\${id}\`)
    getResponse.assertStatus(404)
  })

  test('GET /${resourceName} - should filter by search', async ({ client, assert }) => {
    await client.post('/api/v1/${resourceName}').json({ name: 'Searchable Item' })

    const response = await client.get('/api/v1/${resourceName}?search=Searchable')

    response.assertStatus(200)
    assert.isAbove(response.body().data.data.length, 0)
  })

  test('GET /${resourceName} - should paginate results', async ({ client, assert }) => {
    // Create multiple items
    for (let i = 0; i < 5; i++) {
      await client.post('/api/v1/${resourceName}').json({ name: \`Item \${i}\` })
    }

    const response = await client.get('/api/v1/${resourceName}?page=1&limit=2')

    response.assertStatus(200)
    assert.lengthOf(response.body().data.data, 2)
    assert.equal(response.body().data.meta.perPage, 2)
  })
})
`

    const testPath = join(
      'tests',
      'modules',
      moduleName,
      'functional',
      `${this.toSnakeCase(controllerName)}.spec.ts`
    )

    await mkdir(join('tests', 'modules', moduleName, 'functional'), { recursive: true })
    await writeFile(testPath, content)

    return testPath
  }

  /**
   * Générer tests d'intégration
   */
  static async generateIntegrationTests(moduleName: string): Promise<string> {
    const content = `import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('${moduleName} Integration', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('module should load correctly', async ({ assert }) => {
    const ModuleManager = (await import('#shared/modules/module_manager')).default
    const manager = ModuleManager.getInstance()
    
    await manager.discoverModules()
    const config = manager.getModuleConfig('${moduleName}')

    assert.exists(config)
    assert.equal(config?.name, '${moduleName}')
  })

  test('module dependencies should be satisfied', async ({ assert }) => {
    const ModuleManager = (await import('#shared/modules/module_manager')).default
    const manager = ModuleManager.getInstance()
    
    await manager.discoverModules()
    
    // Should not throw
    const loadOrder = await manager.getLoadOrder()
    assert.include(loadOrder, '${moduleName}')
  })

  test('module routes should be accessible', async ({ client }) => {
    const response = await client.get('/api/modules')
    
    response.assertStatus(200)
    const modules = response.body().data
    const module = modules.find((m: any) => m.name === '${moduleName}')
    
    assert.exists(module)
  })
})
`

    const testPath = join('tests', 'modules', moduleName, 'integration', 'module.spec.ts')

    await mkdir(join('tests', 'modules', moduleName, 'integration'), { recursive: true })
    await writeFile(testPath, content)

    return testPath
  }

  private static toSnakeCase(name: string): string {
    return name
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
  }
}

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'

interface ModuleConfig {
  name: string
  displayName: string
  version: string
  description: string
  enabled: boolean
  dependencies: string[]
  routes: {
    prefix: string
    middleware: string[]
  }
  migrations: {
    path: string
    priority: number
  }
  seeders: {
    path: string
  }
}

interface LoadedModule {
  config: ModuleConfig
  path: string
  routesFile?: string
}

export default class ModuleManager {
  private static instance: ModuleManager
  private modules: Map<string, LoadedModule> = new Map()
  private loadedModules: Set<string> = new Set()
  private modulesPath = app.makePath('src/modules')

  static getInstance(): ModuleManager {
    if (!ModuleManager.instance) {
      ModuleManager.instance = new ModuleManager()
    }
    return ModuleManager.instance
  }

  /**
   * Découvrir et charger tous les modules
   */
  async discoverModules(options: { log?: boolean } = {}): Promise<void> {
    const shouldLog = options.log ?? false
    try {
      const moduleDirs = await readdir(this.modulesPath, { withFileTypes: true })

      for (const dir of moduleDirs) {
        if (!dir.isDirectory()) continue

        const moduleName = dir.name
        const configPath = join(this.modulesPath, moduleName, 'config', 'module.json')

        try {
          const configContent = await readFile(configPath, 'utf-8')
          const config: ModuleConfig = JSON.parse(configContent)

          if (!config.enabled) {
            console.debug(`Module ${moduleName} is disabled`)
            continue
          }

          // Vérifier si le fichier de routes existe
          const routesPath = join(this.modulesPath, moduleName, 'routes', `${moduleName}.ts`)
          let routesFile: string | undefined

          try {
            await readFile(routesPath)
            routesFile = routesPath
          } catch {
            // Pas de fichier de routes
          }

          this.modules.set(moduleName, {
            config,
            path: join(this.modulesPath, moduleName),
            routesFile,
          })

          if (shouldLog) {
            console.info(`✓ Module discovered: ${moduleName}`)
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          console.warn(`Module ${moduleName} has no valid config: ${message}`)
        }
      }

      if (shouldLog) {
        console.info(`Total modules discovered: ${this.modules.size}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`Failed to discover modules: ${message}`)
    }
  }

  /**
   * Résoudre les dépendances d'un module
   */
  private async resolveDependencies(
    moduleName: string,
    resolved: Set<string> = new Set()
  ): Promise<string[]> {
    const module = this.modules.get(moduleName)
    if (!module) {
      throw new Error(`Module ${moduleName} not found`)
    }

    if (resolved.has(moduleName)) {
      return []
    }

    const order: string[] = []
    const missingDeps: string[] = []

    // Résoudre les dépendances récursivement
    for (const dep of module.config.dependencies || []) {
      if (!this.modules.has(dep)) {
        missingDeps.push(dep)
        continue
      }

      if (resolved.has(dep)) {
        continue
      }

      // Détecter les dépendances circulaires
      if (order.includes(dep)) {
        throw new Error(`Circular dependency detected: ${moduleName} <-> ${dep}`)
      }

      const depOrder = await this.resolveDependencies(dep, resolved)
      order.push(...depOrder)
    }

    if (missingDeps.length > 0) {
      const list = missingDeps.join(', ')
      throw new Error(`Dependencies ${list} required by ${moduleName} are not available`)
    }

    resolved.add(moduleName)
    order.push(moduleName)

    return order
  }

  /**
   * Obtenir l'ordre de chargement des modules
   */
  async getLoadOrder(): Promise<string[]> {
    const resolved = new Set<string>()
    const loadOrder: string[] = []

    // Trier par priorité de migration d'abord
    const modulesByPriority = Array.from(this.modules.entries()).sort(
      (a, b) =>
        (a[1].config.migrations?.priority || 999) - (b[1].config.migrations?.priority || 999)
    )

    for (const [moduleName] of modulesByPriority) {
      if (!resolved.has(moduleName)) {
        const order = await this.resolveDependencies(moduleName, resolved)
        loadOrder.push(...order.filter((m) => !loadOrder.includes(m)))
      }
    }

    return loadOrder
  }

  /**
   * Obtenir l'ordre de chargement pour un module spécifique
   */
  async getModuleLoadOrder(moduleName: string): Promise<string[]> {
    const resolved = new Set<string>()
    const order = await this.resolveDependencies(moduleName, resolved)
    return order
  }

  /**
   * Charger les routes d'un module
   */
  async loadModuleRoutes(moduleName: string, options: { log?: boolean } = {}): Promise<void> {
    const shouldLog = options.log ?? false
    const module = this.modules.get(moduleName)
    if (!module || !module.routesFile) {
      return
    }

    if (this.loadedModules.has(moduleName)) {
      return
    }

    try {
      // Importer dynamiquement les routes
      await import(module.routesFile)
      this.loadedModules.add(moduleName)
      if (shouldLog) {
        console.info(`✓ Routes loaded for module: ${moduleName}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`Failed to load routes for module ${moduleName}: ${message}`)
    }
  }

  /**
   * Charger toutes les routes dans l'ordre
   */
  async loadAllRoutes(options: { log?: boolean } = {}): Promise<void> {
    const shouldLog = options.log ?? false
    const loadOrder = await this.getLoadOrder()

    if (shouldLog) {
      console.info('Loading module routes in order:')
    }
    for (const name of loadOrder) {
      await this.loadModuleRoutes(name, { log: shouldLog })
    }
  }

  /**
   * Obtenir la configuration d'un module
   */
  getModuleConfig(moduleName: string): ModuleConfig | undefined {
    return this.modules.get(moduleName)?.config
  }

  /**
   * Obtenir tous les modules
   */
  getAllModules(): Map<string, LoadedModule> {
    return this.modules
  }

  /**
   * Afficher les dépendances
   */
  async printDependencyTree(moduleName?: string): Promise<void> {
    console.log('\n📦 Module Dependency Tree:')
    console.log('━'.repeat(60))

    const loadOrder = moduleName
      ? await this.getModuleLoadOrder(moduleName)
      : await this.getLoadOrder()

    for (const name of loadOrder) {
      const module = this.modules.get(name)!
      const deps = module.config.dependencies || []

      console.log(`\n${name} (priority: ${module.config.migrations?.priority || 999})`)
      if (deps.length > 0) {
        console.log(`  Dependencies: ${deps.join(', ')}`)
      } else {
        console.log(`  No dependencies`)
      }
    }

    console.log('\n━'.repeat(60))
    console.log(`Load order: ${loadOrder.join(' → ')}`)
  }
}

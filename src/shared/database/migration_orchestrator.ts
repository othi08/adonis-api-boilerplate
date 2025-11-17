import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'

interface ModuleMigration {
  module: string
  priority: number
  path: string
  files: string[]
}

export default class MigrationOrchestrator {
  private modulesPath = app.makePath('src/modules')

  /**
   * Découvrir tous les modules avec leurs migrations
   */
  async discoverModuleMigrations(): Promise<ModuleMigration[]> {
    const modules: ModuleMigration[] = []

    try {
      const moduleDirs = await readdir(this.modulesPath, { withFileTypes: true })

      for (const dir of moduleDirs) {
        if (!dir.isDirectory()) continue

        const moduleName = dir.name
        const configPath = join(this.modulesPath, moduleName, 'config', 'module.json')
        const migrationsPath = join(this.modulesPath, moduleName, 'database', 'migrations')

        try {
          // Lire la config du module
          const config = await import(configPath).then((m) => m.default || m)

          if (!config.enabled) continue

          // Lister les fichiers de migration
          const migrationFiles = await readdir(migrationsPath)
            .then((files) => files.filter((f) => f.endsWith('.ts') || f.endsWith('.js')))
            .catch(() => [])

          if (migrationFiles.length > 0) {
            modules.push({
              module: moduleName,
              priority: config.migrations?.priority || 999,
              path: migrationsPath,
              files: migrationFiles.sort(),
            })
          }
        } catch (error) {
          // Module sans config ou sans migrations
          continue
        }
      }

      // Trier par priorité (plus bas = exécuté en premier)
      return modules.sort((a, b) => a.priority - b.priority)
    } catch (error) {
      console.error('Error discovering module migrations:', error)
      return []
    }
  }

  /**
   * Obtenir toutes les migrations dans l'ordre
   */
  async getAllMigrations(): Promise<string[]> {
    const modules = await this.discoverModuleMigrations()
    const allMigrations: string[] = []

    for (const module of modules) {
      for (const file of module.files) {
        allMigrations.push(join(module.path, file))
      }
    }

    return allMigrations
  }

  /**
   * Obtenir les migrations d'un module spécifique
   */
  async getModuleMigrations(moduleName: string): Promise<string[]> {
    const migrationsPath = join(this.modulesPath, moduleName, 'database', 'migrations')

    try {
      const files = await readdir(migrationsPath)
      return files
        .filter((f) => f.endsWith('.ts') || f.endsWith('.js'))
        .sort()
        .map((f) => join(migrationsPath, f))
    } catch (error) {
      return []
    }
  }

  /**
   * Afficher l'ordre d'exécution des migrations
   */
  async printMigrationOrder(): Promise<void> {
    const modules = await this.discoverModuleMigrations()

    console.log('\n📦 Migration execution order:')
    console.log('━'.repeat(60))

    for (const module of modules) {
      console.log(`\n${module.priority}. Module: ${module.module}`)
      module.files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`)
      })
    }

    console.log('\n━'.repeat(60))
  }
}

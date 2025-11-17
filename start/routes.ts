/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import ModuleManager from '#shared/modules/module_manager'
import openapi from '@foadonis/openapi/services/main'

// Charger les routes des modules automatiquement
const moduleManager = ModuleManager.getInstance()

// Découvrir et charger les modules
await moduleManager.discoverModules()
await moduleManager.loadAllRoutes()

// Routes globales (si besoin)
router.get('/', async () => {
  return {
    app: 'Track Flow ERP',
    version: '1.0.0',
  }
})

openapi.registerRoutes()

router.get('/api/modules', async () => {
  const modules = Array.from(moduleManager.getAllModules().entries()).map(([name, module]) => ({
    name,
    displayName: module.config.displayName,
    version: module.config.version,
    enabled: module.config.enabled,
  }))

  return {
    success: true,
    data: modules,
  }
})

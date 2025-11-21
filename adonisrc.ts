import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  directories: {
    config: 'config',
    commands: 'commands',
    contracts: 'contracts',
    public: 'public',
    providers: 'providers',
    languageFiles: 'resources/lang',
    migrations: 'src/shared/database/migrations',
    seeders: 'src/shared/database/seeders',
    factories: 'src/shared/database/factories',
    views: 'resources/views',
    start: 'start',
    tmp: 'tmp',
    tests: 'tests',
    httpControllers: 'src/shared/controllers',
    models: 'src/shared/models',
    services: 'src/shared/services',
    exceptions: 'src/shared/exceptions',
    mailers: 'src/shared/mailers',
    mails: 'src/shared/mails',
    middleware: 'src/shared/middleware',
    policies: 'src/shared/policies',
    validators: 'src/shared/validators',
    events: 'src/shared/events',
    listeners: 'src/shared/listeners',
    stubs: 'stubs',
  },
  /*
  |--------------------------------------------------------------------------
  | Experimental flags
  |--------------------------------------------------------------------------
  |
  | The following features will be enabled by default in the next major release
  | of AdonisJS. You can opt into them today to avoid any breaking changes
  | during upgrade.
  |
  */
  experimental: {
    mergeMultipartFieldsAndFiles: true,
    shutdownInReverseOrder: true,
  },

  /*
  |--------------------------------------------------------------------------
  | Commands
  |--------------------------------------------------------------------------
  |
  | List of ace commands to register from packages. The application commands
  | will be scanned automatically from the "./commands" directory.
  |
  */
  commands: [() => import('@adonisjs/core/commands'), () => import('@adonisjs/lucid/commands')],

  /*
  |--------------------------------------------------------------------------
  | Service providers
  |--------------------------------------------------------------------------
  |
  | List of service providers to import and register when booting the
  | application
  |
  */
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    {
      file: () => import('@adonisjs/core/providers/repl_provider'),
      environment: ['repl', 'test'],
    },
    () => import('@adonisjs/core/providers/vinejs_provider'),
    () => import('@adonisjs/cors/cors_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/auth/auth_provider'),
    () => import('@foadonis/openapi/openapi_provider'),
  ],

  /*
  |--------------------------------------------------------------------------
  | Preloads
  |--------------------------------------------------------------------------
  |
  | List of modules to import before starting the application.
  |
  */
  preloads: [() => import('#start/routes'), () => import('#start/kernel')],

  /*
  |--------------------------------------------------------------------------
  | Tests
  |--------------------------------------------------------------------------
  |
  | List of test suites to organize tests by their type. Feel free to remove
  | and add additional suites.
  |
  */
  tests: {
    suites: [
      {
        files: ['tests/unit/**/*.spec(.ts|.js)'],
        name: 'unit',
        timeout: 2000,
      },
      {
        files: ['tests/functional/**/*.spec(.ts|.js)'],
        name: 'functional',
        timeout: 30000,
      },
    ],
    forceExit: false,
  },
})

import express, { Router } from 'express'
import { MetaRoutes } from '../modules/meta/meta_api_route'
import { AdInsightsRoutes } from '../modules/ad_insights/ad_insights_route'

/**
 * Main router configuration
 * This file serves as the central point for registering all module routes
 */
const routers: Router = express.Router()

/**
 * Array of module routes to be registered
 * Each object contains:
 * - path: The base path for the module (e.g., '/auth')
 * - route: The router instance for the module
 */
const moduleRoutes = [
  {
    path: '/meta',
    route: MetaRoutes
  },
  {
    path: '/insights',
    route: AdInsightsRoutes
  }
]

/**
 * Register all module routes
 * This loop iterates through the moduleRoutes array and registers each route
 * with its corresponding path
 */
moduleRoutes.forEach(route => {
  routers.use(route.path, route.route)
})

export default routers

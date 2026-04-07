import express from 'express'
import { MetaControllers } from './meta_api_controller'

const router = express.Router()

// get meta insights for a campaign from meta api.
router.get('/ad-insights', MetaControllers.get_adInsights_fromMeta)

export const MetaRoutes = router

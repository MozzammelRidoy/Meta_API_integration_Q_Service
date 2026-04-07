import express from 'express'
import { adInsightsControllers } from './ad_insights_controller'

const router = express.Router()

router.get('/', adInsightsControllers.get_all_adInsights)

export const AdInsightsRoutes = router

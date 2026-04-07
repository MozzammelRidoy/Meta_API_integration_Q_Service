import express from 'express'
import { adInsightsControllers } from './ad_insights_controller'
import validateRequest from '../../middlewares/validateRequest'
import { AdInsights_Validation } from './ad_insights_validationSchema'

const router = express.Router()

// fetch all adInsights
router.get('/', adInsightsControllers.get_all_adInsights)

// store adInsights
router.post(
  '/sync-insights',
  validateRequest(AdInsights_Validation.store_adInsights_ValidationZodSchema),
  adInsightsControllers.create_adInsights
)

export const AdInsightsRoutes = router

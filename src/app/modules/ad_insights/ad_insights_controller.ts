import catchAsync from '../../utils/catchAsync'
import sendResponse from '../../utils/sendResponse'
import { adIsightsServices } from './ad_insights_service'

// get all ad insights
const get_all_adInsights = catchAsync(async (req, res) => {
  const result = await adIsightsServices.fetch_all_adInsights_from_DB(req.query)

  sendResponse(res, {
    status: 200,
    success: true,
    message: 'Ad Insights Store Data fetched successfully',
    data: result.data,
    meta: result.meta
  })
})

// store ad insights
const create_adInsights = catchAsync(async (req, res) => {
  const result = await adIsightsServices.store_adInsights_into_DB(req.body)

  sendResponse(res, {
    status: 201,
    success: true,
    message: 'Ad Insights Data stored successfully',
    data: result
  })
})

export const adInsightsControllers = { get_all_adInsights, create_adInsights }

import catchAsync from '../../utils/catchAsync'
import sendResponse from '../../utils/sendResponse'
import { adIsightsServices } from './ad_insights_service'

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

export const adInsightsControllers = { get_all_adInsights }

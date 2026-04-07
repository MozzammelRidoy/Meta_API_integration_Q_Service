import catchAsync from '../../utils/catchAsync'
import sendResponse from '../../utils/sendResponse'
import { MetaServices } from './meta_api_service'

// fetch adInsights data from meta api.
const get_adInsights_fromMeta = catchAsync(async (req, res) => {
  const result = await MetaServices.fetch_AdInsights_fromMeta(
    (req.query.campaign_id as string) || 'ace234b1-ae89-47b0-9f01-53a03b8c3ddc',
    (req.query.date as string) || '2026-04-07'
  )

  sendResponse(res, {
    status: result.status || 200,
    success: result.success || true,
    message: result.message || 'Ad insights fetched successfully from Meta API',
    data: result.data || {}
  })
})

export const MetaControllers = { get_adInsights_fromMeta }

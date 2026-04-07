import AppError from '../../errors/AppError'
import { META_ERRORS } from './meta_api_constant'
import { TMetaAPI_Response } from './meta_api_interface'

/**
 * Simulated Meta Ads API
 * Randomly returns success (60%), general error (20%), or rate limit error (20%)
 */

// Simulate a Meta API call - deliberately unreliable
const fetch_AdInsights_fromMeta = async (
  campaign_id: string,
  date: string
): Promise<TMetaAPI_Response> => {
  // Simulate network latency
  await new Promise(res => setTimeout(res, 100 + Math.random() * 300))

  const roll = Math.random()

  // 20% chance: rate limit error
  if (roll < 0.2) {
    throw new AppError(
      429,
      'meta_api',
      'Meta API rate limit exceeded. Please retry after some time.'
    )
  }

  // 20% chance: general API error (roll 0.2–0.4)
  if (roll < 0.4) {
    const error = META_ERRORS[Math.floor(Math.random() * META_ERRORS.length)]

    throw new AppError(error.status, 'meta_api', `Meta API error: ${error.mgs}`)
  }

  // 60% chance: success
  const statusCode = [200, 202, 203][Math.floor(Math.random() * 3)]

  return {
    status: statusCode,
    success: true,
    message: 'Ad insights fetched successfully from Meta API',
    data: {
      campaign_id,
      impressions: Math.floor(Math.random() * 50_000) + 1_000,
      clicks: Math.floor(Math.random() * 2_000) + 50,
      spend: parseFloat((Math.random() * 500 + 10).toFixed(2)),
      date
    }
  }
}

export const MetaServices = { fetch_AdInsights_fromMeta }

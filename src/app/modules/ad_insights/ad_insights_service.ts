import PrismaQueryBuilder from '../../builder/PrismaQueryBuilder'
import { prisma } from '../../shared/prisma'
import { adInsightsQueue } from '../../queue/ad_insights_queue'
import { logger } from '../../utils/logger'
import { isValidDate } from '../../utils/date_Time_Validation'
import AppError from '../../errors/AppError'

const fetch_all_adInsights_from_DB = async (query: Record<string, unknown>) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isDeleted, ...rest } = query
  if (rest.impressions) rest.impressions = Number(rest.impressions)
  if (rest.clicks) rest.clicks = Number(rest.clicks)
  if (rest.spend) rest.spend = Number(rest.spend)

  const adInsightsQuery = new PrismaQueryBuilder(prisma.adInsights, rest)
    .setBaseQuery({
      isDeleted: false
    })
    .setSecretFields(['isDeleted'])
    .fields()
    .filter()
    .sort()
    .paginate()
  // .search(['name'])

  const data = await adInsightsQuery.execute()
  const meta = await adInsightsQuery.countTotal()

  return { data, meta }
}

// Store ad insights into DB.

const store_adInsights_into_DB = async (payload: {
  campaign_ids: string[]
  date: string
}) => {
  const { campaign_ids, date } = payload
  // date validation and formatting.
  if (!isValidDate(date)) throw new AppError(400, 'date', 'Invalid date format')

  // Job creation.
  const jobs = await Promise.all(
    campaign_ids.map(campaign_id =>
      adInsightsQueue.add(
        `sync:${campaign_id}:${date}`,
        { campaign_id, date },
        {
          jobId: `insights:${campaign_id}:${date}`
        }
      )
    )
  )

  logger.info(`▶ Enqueued ${jobs.length} sync job(s) for date=${date}`)

  return {
    queued: jobs.length,
    date,
    campaign_ids,
    jobIds: jobs.map(j => j.id)
  }
}

export const adIsightsServices = {
  fetch_all_adInsights_from_DB,
  store_adInsights_into_DB
}

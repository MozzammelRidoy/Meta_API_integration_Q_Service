import PrismaQueryBuilder from '../../builder/PrismaQueryBuilder'
import { prisma } from '../../shared/prisma'

const fetch_all_adInsights_from_DB = async (query: Record<string, unknown>) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isDeleted, ...rest } = query

  const adInsightsQuery = new PrismaQueryBuilder(prisma.adInsights, rest)
    .setBaseQuery({
      isDeleted: false
    })
    .setSecretFields(['isDeleted'])
    .fields()
    .filter()
    .sort()
    .paginate()
    .search(['date'])

  const data = await adInsightsQuery.execute()
  const meta = await adInsightsQuery.countTotal()

  return { data, meta }
}

export const adIsightsServices = { fetch_all_adInsights_from_DB }

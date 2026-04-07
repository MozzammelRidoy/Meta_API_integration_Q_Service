import { z } from 'zod'

const store_adInsights_ValidationZodSchema = z.object({
  body: z.object({
    campaign_ids: z
      .array(z.string({ required_error: 'campaign_ids is required' }))
      .min(1, { message: 'Minimum 1 campaign_id is required' })
      .nonempty({ message: 'campaign_ids is required' }),
    date: z
      .string({ required_error: 'date is required' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format')
  })
})

export const AdInsights_Validation = { store_adInsights_ValidationZodSchema }

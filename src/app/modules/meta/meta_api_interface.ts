type TMetaAPI_Data = {
  campaign_id: string
  impressions: number
  clicks: number
  spend: number
  date: string
}

export type TMetaAPI_Response = {
  status: number
  success: boolean
  message: string
  data?: TMetaAPI_Data
}

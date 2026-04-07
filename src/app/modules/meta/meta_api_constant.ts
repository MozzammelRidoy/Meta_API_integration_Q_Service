export const META_ERRORS: { status: number; mgs: string }[] = [
  { status: 500, mgs: 'Internal Server Error' },
  { status: 504, mgs: 'Gateway Timeout' },
  { status: 503, mgs: 'Service Unavailable' },
  { status: 502, mgs: 'Bad Gateway' },
  { status: 400, mgs: 'Bad Request' },
  { status: 401, mgs: 'Unauthorized' },
  { status: 403, mgs: 'Forbidden' },
  { status: 404, mgs: 'Not Found' }
] as const

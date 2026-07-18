export interface ApiErrorPayload {
  error: {
    code: string
    message: string
    fields?: Record<string, string[]>
  }
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface UserSummary {
  user_code: string
  name: string
  access_level: number
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: 'Bearer'
  expires_in: number
  user: UserSummary
}

export interface Customer {
  customer_code: string
  customer_name: string
  customer_description: string
}

export interface RetailStore {
  retail_store_code: string
  retail_store_name: string
  retail_store_city: string
  retail_store_location: { type?: 'Point'; coordinates: [number, number] } | { latitude: number; longitude: number }
}

export interface CustomerInput {
  customer_input_code: string
  customer_input_description: string
  created_at?: string
  gridfs_code?: string | null
}

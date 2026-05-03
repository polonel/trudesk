export interface ApiSuccess {
  success: true
  [key: string]: unknown
}

export interface ApiError {
  success: false
  error: string
}

export type ApiResponse = ApiSuccess | ApiError

export interface User {
  _id: string
  username: string
  email: string
  fullname: string
  title?: string
  image?: string
  role: {
    _id: string
    name: string
    isAdmin: boolean
    isAgent: boolean
  }
}

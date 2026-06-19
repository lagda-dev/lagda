export type Role = "owner" | "admin" | "user"

export type Organization = {
  id: string
  name: string
  slug: string
}

export type Entity = {
  id: string
  organizationId: string
  name: string
  slug: string
}

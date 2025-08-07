export interface Suggestion {
  id: string
  title: string
  description: string
  upvotes: number
  status: 'Queued' | 'In Progress' | 'Completed'
  createdAt: Date
}

export interface ThemeColors {
  primary: string
  secondary: string
}

export interface UserUpvotes {
  upvotedPosts: string[]
} 
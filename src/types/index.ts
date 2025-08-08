export interface Comment {
  id: string
  content: string
  author: string
  createdAt: Date
}

export interface Suggestion {
  id: string
  title: string
  description: string
  upvotes: number
  status: 'Queued' | 'In Progress' | 'Completed'
  createdAt: Date
  comments: Comment[]
}

export interface ThemeColors {
  primary: string
  secondary: string
}

export interface UserUpvotes {
  upvotedPosts: string[]
} 
export interface Comment {
  id: string
  content: string
  author: string
  createdAt: Date
}

export interface ImageAttachment {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploadedAt: Date
  file?: File // Store the actual File object for uploads
  tempFilename?: string // Temporary storage filename for unauthenticated users
  expiresAt?: string // When the temporary URL expires
}

export interface Suggestion {
  id: string
  title: string
  description: string
  upvotes: number
  status: 'Queued' | 'In Progress' | 'Completed'
  hidden: boolean
  createdAt: Date
  comments: Comment[]
  images: ImageAttachment[]
}

export interface ThemeColors {
  primary: string
}

export interface UserUpvotes {
  upvotedPosts: string[]
}

export interface Logo {
  url: string
  redirectUrl?: string
} 
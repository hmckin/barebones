# API Documentation

This document describes the backend API routes and how to use them.

## Overview

The application now uses a backend API with Prisma ORM and PostgreSQL database instead of hardcoded local state. All data operations (create, read, update, delete) are now handled through RESTful API endpoints.

## API Routes

### Base URL
All API routes are prefixed with `/api`

### Authentication
Most endpoints require authentication via NextAuth.js. Include the session cookie in your requests.

### 1. Tickets API (`/api/tickets`)

#### GET `/api/tickets`
Fetch tickets with filtering, sorting, and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (e.g., "Queued", "In Progress", "Completed")
- `search` (optional): Search in title and description
- `authorId` (optional): Filter by author ID
- `sortBy` (optional): Sort by field ("createdAt", "upvotes", "trending")
- `sortOrder` (optional): Sort order ("asc" or "desc")

**Example:**
```bash
GET /api/tickets?page=1&limit=20&sortBy=upvotes&sortOrder=desc&search=dark mode
```

**Response:**
```json
{
  "tickets": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### POST `/api/tickets`
Create a new ticket.

**Request Body:**
```json
{
  "title": "Feature Request Title",
  "description": "Detailed description of the feature",
  "imageUrl": "https://example.com/image.jpg" // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Feature Request Title",
  "description": "Detailed description of the feature",
  "status": "Queued",
  "upvotes": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "author": {...},
  "comments": [],
  "images": [...]
}
```

### 2. Comments API (`/api/comments`)

#### GET `/api/comments?ticketId=<id>`
Fetch comments for a specific ticket.

**Response:**
```json
[
  {
    "id": "uuid",
    "content": "Comment text",
    "author": "Author Name",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST `/api/comments`
Create a new comment.

**Request Body:**
```json
{
  "ticketId": "ticket-uuid",
  "content": "Comment text"
}
```

### 3. Votes API (`/api/votes`)

#### POST `/api/votes`
Toggle vote on a ticket (upvote/downvote).

**Request Body:**
```json
{
  "ticketId": "ticket-uuid"
}
```

**Response:**
```json
{
  "action": "added", // or "removed"
  "upvotes": 1 // or -1
}
```

### 4. Uploads API (`/api/uploads`)

#### POST `/api/uploads`
Upload an image file.

**Request:**
- Use `FormData` with a `file` field
- File must be an image
- Maximum size: 5MB

**Response:**
```json
{
  "success": true,
  "imageUrl": "/api/uploads/filename.jpg",
  "filename": "filename.jpg",
  "size": 1024000,
  "type": "image/jpeg"
}
```

## Frontend Integration

### API Service Layer
The frontend uses a service layer (`src/lib/api.ts`) that provides:

- `ticketsApi`: Methods for ticket operations
- `commentsApi`: Methods for comment operations  
- `votesApi`: Methods for vote operations
- `uploadsApi`: Methods for file uploads

### Custom Hooks
- `useTickets()`: Manages tickets data with filtering, sorting, and pagination
- `useApp()`: Main app context with API-integrated methods

### Example Usage

```typescript
import { useTickets } from '@/hooks/use-tickets'
import { ticketsApi } from '@/lib/api'

function MyComponent() {
  const { suggestions, loading, updateSorting } = useTickets()
  
  const handleCreateTicket = async () => {
    const result = await ticketsApi.createTicket({
      title: "New Feature",
      description: "Description here"
    })
    
    if (result.data) {
      // Handle success
    }
  }
  
  return (
    <div>
      {loading ? <div>Loading...</div> : (
        suggestions.map(suggestion => (
          <div key={suggestion.id}>{suggestion.title}</div>
        ))
      )}
    </div>
  )
}
```

## Database Schema

The application uses the following main models:

- **User**: Authentication and user management
- **Ticket**: Feature requests/suggestions
- **Comment**: Comments on tickets
- **Vote**: User votes on tickets
- **Settings**: App configuration (colors, logo)

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error

## Development Notes

### Current Limitations
- Image uploads return placeholder URLs (need to implement actual storage)
- Some advanced filtering is done client-side
- Error handling could be improved with user notifications

### Future Improvements
- Implement real image storage (Supabase, AWS S3)
- Add server-side caching
- Implement real-time updates with WebSockets
- Add comprehensive error logging
- Add API rate limiting

### Testing
Test the API endpoints using the test route:
```bash
GET /api/test-tickets
```

This will verify database connectivity and return basic stats. 
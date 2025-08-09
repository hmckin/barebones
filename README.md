# barebones - Feature Requests & Roadmap Management

A modern Next.js application for managing feature requests and tracking their progress through a visual roadmap interface.

## Features

### 🎯 Core Functionality
- **Create Post**: Submit new feature suggestions with title, description, and image attachments
- **Requests View**: View, upvote, and manage feature requests with sorting and search
- **Roadmap View**: Track suggestions grouped by status (Queued, In Progress, Completed)
- **Status Management**: Update suggestion status with dropdown selectors

### 🎨 UI/UX Features
- **Light/Dark Theme**: Toggle between light, dark, and system themes
- **Custom Theme Colors**: Pick primary and secondary colors with color pickers
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Built with shadcn/ui components for a clean, professional look

### 💾 Data Management
- **In-Memory Storage**: Suggestions persist during the session
- **Form Validation**: Ensures required fields are filled
- **Real-time Updates**: Changes reflect immediately across all views

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Theme Management**: next-themes
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd barebones
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and theme variables
│   ├── layout.tsx           # Root layout with providers
│   └── page.tsx             # Main application page
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── color-picker.tsx     # Color picker component
│   ├── create-post.tsx      # Create new feature suggestions
│   ├── expanded-post.tsx    # Detailed view of individual posts
│   ├── requests-view.tsx    # Display and manage feature requests
│   ├── roadmap-view.tsx     # Roadmap view for progress tracking
│   ├── system-admin-modal.tsx # System administration modal
│   └── theme-toggle.tsx     # Theme switcher
├── contexts/
│   └── app-context.tsx      # Global state management
└── types/
    └── index.ts             # TypeScript type definitions
```

## Usage

### Create Post
- Submit new feature suggestions with title and description
- Attach images to provide visual context
- Form validation ensures required fields are filled
- Real-time search integration with the requests view

### Requests View
- View all feature requests with sorting options (trending, newest, oldest, alphabetical)
- Search through requests using the search bar
- Upvote existing suggestions with the upvote button
- Each request shows title, description, status, upvotes, comments, and attachments

### Roadmap View
- See suggestions organized by status in a roadmap format
- Track progress from Queued → In Progress → Completed
- Visual representation of feature development pipeline

### Theme Customization
- Toggle between light, dark, and system themes
- Use color pickers to customize primary and secondary colors
- Theme preferences are saved in localStorage

## Data Model

### Suggestion
```typescript
interface Suggestion {
  id: string
  title: string
  description: string
  upvotes: number
  status: 'Queued' | 'In Progress' | 'Completed'
  createdAt: Date
}
```

### Theme Colors
```typescript
interface ThemeColors {
  primary: string
  secondary: string
}
```

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Components
The project uses shadcn/ui for consistent component design. To add new components:

```bash
npx shadcn@latest add <component-name>
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

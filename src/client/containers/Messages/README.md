# Messages Container

This directory contains the refactored messages component structure, split into multiple smaller components for better maintainability and organization.

## Directory Structure

```
src/client/containers/Messages/
├── MessagesContainer.jsx          # Main container component
├── components/
│   ├── ConversationList.jsx       # Renders the list of conversations
│   ├── UserList.jsx               # Renders the user list for starting new conversations
│   └── MessageThread.jsx          # Renders the message thread and input area
└── README.md                      # This file
```

## Components

### MessagesContainer.jsx
The main container component that manages:
- Overall state and logic
- Socket event handling
- Redux connections
- Routing between conversation list and message thread views

### components/ConversationList.jsx
Responsible for rendering the conversation list with:
- Conversation items showing partner information
- Timestamps and recent messages
- Context menu functionality for deleting conversations

### components/UserList.jsx
Handles user selection for starting new conversations:
- Search functionality
- User filtering by role (admins/agents)
- Start conversation button

### components/MessageThread.jsx
Manages the message thread display and interaction:
- Message rendering with proper styling (left/right alignment)
- Typing indicators
- Message input form
- Scroll to bottom functionality
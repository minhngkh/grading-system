# Grader Service

A Moleculer-based microservice for grading submissions according to rubrics.

## Overview

The Grader Service is responsible for:
- Orchestrating the grading process for assignments
- Determining the appropriate grading method for each rubric criterion
- Using plugins or AI services for automated grading
- Generating scoring and feedback

## Architecture

This service follows the event-based saga pattern for communication with other services. It listens for events from other services and emits events when grading is completed.

## Event Flow

1. `submission.ready` - Received when a new submission is ready for grading
2. `plugin.execute` - Emitted to request a plugin to grade a criterion
3. `ai.grade` - Emitted to request AI grading for a criterion
4. `plugin.execution.completed` - Received when plugin grading is completed
5. `ai.grading.completed` - Received when AI grading is completed
6. `assignment.graded` - Emitted when all criteria have been graded

## Installation

```bash
# Install dependencies
npm install

# Or if using Bun
bun install
```

## Development

```bash
# Start the service in development mode
bun run dev

# Start with specific configuration
TRANSPORTER=nats://localhost:4222 NODE_ID=grader-1 bun run dev
```

## Testing

```bash
# Run tests
bun test
```

## Production

```bash
# Build for production
bun run build

# Start the service in production mode
bun run start
```

## Environment Variables

- `NODE_ID` - Unique identifier for this service instance
- `TRANSPORTER` - URL for the message broker (e.g., "nats://localhost:4222")
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

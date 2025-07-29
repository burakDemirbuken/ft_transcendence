#!/bin/sh

# Run TypeScript compiler in watch mode in background
# npm run watch &

# # Run nodemon in foreground (so Docker tracks the process)
# npm run devFront

# # This ensures SIGTERM gets propagated to both processes
# trap "kill 0" EXIT

# For backend development or production, just leave these open:
npm run build

exec "$@"

#!/bin/sh

# Run TypeScript compiler in watch mode in background
npm run watch &

# Run nodemon in foreground (so Docker tracks the process)
npm run dev

# This ensures SIGTERM gets propagated to both processes
trap "kill 0" EXIT

# For production only leave these open:

# # Compile typescript once
# # Needs to be here because the ts files are in the frontend bind mount.
# npm run build

# exec "$@"

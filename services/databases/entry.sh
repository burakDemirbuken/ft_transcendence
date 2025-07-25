#!/bin/bash

# Set database path
DB_PATH=${DB_PATH:-"/data/app.db"}
DB_DIR=$(dirname "$DB_PATH")

mkdir -p "$DB_DIR"

if [ ! -f "$DB_PATH" ]; then
    echo "Initializing SQLite database at $DB_PATH"
    sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS health_check (id INTEGER PRIMARY KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);"
    sqlite3 "$DB_PATH" "INSERT INTO health_check (timestamp) VALUES (datetime('now'));"
    echo "Database initialized successfully"
fi

# Function to handle graceful shutdown
cleanup() {
    echo "Shutting down SQLite container..."
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGTERM SIGINT

echo "SQLite database is ready at $DB_PATH"
echo "Database files are stored in $DB_DIR"

# Keep container running and provide a simple interface
while true; do
    sleep 1
    # Optional: Add periodic maintenance tasks here
done
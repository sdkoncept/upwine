#!/bin/bash
# Script to reset the database (use with caution - deletes all data)

echo "⚠️  WARNING: This will delete all orders and reset the database!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

if [ -f "upwine.db" ]; then
    echo "Deleting upwine.db..."
    rm upwine.db
    echo "✅ Database deleted. Restart the server to recreate it."
else
    echo "Database file not found. Nothing to delete."
fi


#!/bin/bash
set -e

echo "Building Go application..."
go build -o main cmd/api/main.go

echo "Creating uploads directory..."
mkdir -p public/uploads

echo "Build completed successfully!"
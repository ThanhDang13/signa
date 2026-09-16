#!/usr/bin/env bash

echo "Starting port-forwards (Ctrl+C to stop all)..."

kubectl port-forward svc/postgres 5432:5432 &
PG_PID=$!

kubectl port-forward svc/redis 6379:6379 &
REDIS_PID=$!

kubectl port-forward svc/redis 8001:8001 &
INSIGHT_PID=$!

kubectl port-forward svc/minio 9000:9000 &
MINIO_PID=$!

kubectl port-forward svc/minio-console 9001:9001 &
CONSOLE_PID=$!

echo ""
echo "✓ Port-forwards running:"
echo "  PostgreSQL:    localhost:5432 (PID $PG_PID)"
echo "  Redis:         localhost:6379 (PID $REDIS_PID)"
echo "  RedisInsight:  http://localhost:8001 (PID $INSIGHT_PID)"
echo "  MinIO API:     localhost:9000 (PID $MINIO_PID)"
echo "  MinIO Console: http://localhost:9001 (PID $CONSOLE_PID)"
echo ""
echo "Press Ctrl+C to stop all..."

# Cleanup on exit
trap "kill $PG_PID $REDIS_PID $INSIGHT_PID $MINIO_PID $CONSOLE_PID 2>/dev/null; exit" INT TERM

wait

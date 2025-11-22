# Support both docker and podman
docker := if `command -v podman >/dev/null 2>&1; echo $?` == "0" { "podman" } else { "docker" }

# Display available commands and their descriptions (default target)
default:
    @just --list

# Install dependencies
install:
    pnpm install

# Start service dependencies
up *args:
    @mkdir -p ./infra/postgres/data
    {{docker}} compose up -d --wait {{args}}

# Tail logs for service dependencies
logs *args:
    {{docker}} compose logs -f --tail 100 {{args}}

# Stop service dependencies
stop *args:
    {{docker}} compose stop {{args}}

# Stop all services and remove volumes
down:
    {{docker}} compose down --volumes
    @rm -rf ./infra/postgres/data

# Run all development services in parallel
dev:
  pnpm run dev
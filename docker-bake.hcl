# Bake file for DocsOps release images (parallel targets, shared builder cache).
variable "TAG" {
  default = "dev"
}

variable "REGISTRY" {
  default = "ghcr.io"
}

variable "OWNER" {
  default = "bjkawecki"
}

group "default" {
  targets = ["app", "migrate", "worker", "frontend"]
}

target "app" {
  context    = "."
  dockerfile = "apps/backend/Dockerfile"
  target     = "app"
  tags       = ["${REGISTRY}/${OWNER}/docsops-app:${TAG}"]
  # Shared scope so app/migrate/worker reuse the backend builder layers.
  cache-from = ["type=gha,scope=docsops-backend"]
  cache-to   = ["type=gha,mode=max,scope=docsops-backend"]
}

target "migrate" {
  context    = "."
  dockerfile = "apps/backend/Dockerfile"
  target     = "migrate"
  tags       = ["${REGISTRY}/${OWNER}/docsops-migrate:${TAG}"]
  cache-from = ["type=gha,scope=docsops-backend"]
  cache-to   = ["type=gha,mode=max,scope=docsops-backend"]
}

target "worker" {
  context    = "."
  dockerfile = "apps/backend/Dockerfile"
  target     = "worker"
  tags       = ["${REGISTRY}/${OWNER}/docsops-worker:${TAG}"]
  cache-from = ["type=gha,scope=docsops-backend"]
  cache-to   = ["type=gha,mode=max,scope=docsops-backend"]
}

target "frontend" {
  context    = "."
  dockerfile = "apps/frontend/Dockerfile"
  tags       = ["${REGISTRY}/${OWNER}/docsops-frontend:${TAG}"]
  cache-from = ["type=gha,scope=docsops-frontend"]
  cache-to   = ["type=gha,mode=max,scope=docsops-frontend"]
}

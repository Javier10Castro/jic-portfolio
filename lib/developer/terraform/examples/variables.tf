variable "platform_api_key" {
  description = "Platform API key"
  type = string
  sensitive = true
}

variable "github_token" {
  description = "GitHub personal access token"
  type = string
  sensitive = true
  default = ""
}

param(
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"

if ($Message) {
    node "$PSScriptRoot\deploy.js" "$Message"
} else {
    node "$PSScriptRoot\deploy.js"
}


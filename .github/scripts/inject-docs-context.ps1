# PowerShell script to inject documentation context for FileSharing project
# Triggered on UserPromptSubmit event before agent processes any prompt

param(
    [string]$InputJson = ""
)

# Keywords that indicate analysis or code changes
$triggerKeywords = @(
    "analyze", "analysis", "assessment",
    "implement", "implementation", "build", "create",
    "modify", "change", "update", "edit", "fix",
    "refactor", "restructure", "redesign", "architect",
    "workflow", "architecture", "design",
    "decode", "inspect", "review", "evaluate",
    "explain", "understand", "clarify",
    "plan", "strategy", "specification", "spec"
)

# Read input from stdin if provided
if ([string]::IsNullOrEmpty($InputJson)) {
    $InputJson = $input | ConvertFrom-Json -ErrorAction SilentlyContinue | ConvertTo-Json
}

# Parse user prompt
try {
    $input_obj = $InputJson | ConvertFrom-Json
    $userPrompt = $input_obj.userPromptText
} catch {
    $userPrompt = ""
}

# Check if prompt matches trigger keywords (case-insensitive)
$shouldInjectDocs = $false
foreach ($keyword in $triggerKeywords) {
    if ($userPrompt -match "\b$keyword\b") {
        $shouldInjectDocs = $true
        break
    }
}

# If no trigger keywords found, continue without injection
if (-not $shouldInjectDocs) {
    $output = @{
        continue = $true
        hookResult = "No doc injection needed for this prompt"
    }
    Write-Output ($output | ConvertTo-Json)
    exit 0
}

# Read documentation files from the three key locations
$docPaths = @(
    "docs",
    "client/docs",
    "server/docs"
)

$allDocs = @()

foreach ($docPath in $docPaths) {
    if (Test-Path $docPath) {
        $docFiles = Get-ChildItem -Path $docPath -Filter "*.md" -Recurse -ErrorAction SilentlyContinue
        
        foreach ($file in $docFiles) {
            try {
                $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
                if ($content) {
                    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "").Replace("\", "/")
                    $allDocs += @{
                        path = $relativePath
                        content = $content
                    }
                }
            } catch {
                # Silently skip files that can't be read
            }
        }
    }
}

# Prepare documentation context message
$docsContent = ""
if ($allDocs.Count -gt 0) {
    $docsContent = "## Relevant Project Documentation`n`n"
    
    foreach ($doc in $allDocs) {
        $docsContent += "### Document: $($doc.path)`n"
        $docsContent += "```markdown`n"
        $docsContent += $doc.content
        $docsContent += "`n```"
        $docsContent += "`n`n---`n`n"
    }
} else {
    $docsContent = "## Project Documentation`n`nNote: No documentation files found in /docs, /client/docs, or /server/docs`n"
}

# Create output JSON response
$systemMessage = "IMPORTANT: Before proceeding with analysis or code changes, review the project documentation below to ensure understanding of the project architecture, requirements, and design decisions.`n`n$docsContent`n`nBased on this documentation context, proceed with the analysis or changes requested by the user."

$output = @{
    continue = $true
    systemMessage = $systemMessage
    hookResult = "Automatically injected $($allDocs.Count) documentation files"
}

Write-Output ($output | ConvertTo-Json -Depth 10)
exit 0

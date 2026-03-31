#!/bin/bash
# Bash script to inject documentation context for FileSharing project
# Triggered on UserPromptSubmit event before agent processes any prompt
# Works on Linux and macOS

# Keywords that indicate analysis or code changes
TRIGGER_KEYWORDS=(
    "analyze" "analysis" "assessment"
    "implement" "implementation" "build" "create"
    "modify" "change" "update" "edit" "fix"
    "refactor" "restructure" "redesign" "architect"
    "workflow" "architecture" "design"
    "decode" "inspect" "review" "evaluate"
    "explain" "understand" "clarify"
    "plan" "strategy" "specification" "spec"
)

# Read input from stdin
read -t 5 INPUT_JSON || INPUT_JSON=""

# Extract user prompt from JSON input
USER_PROMPT=$(echo "$INPUT_JSON" | jq -r '.userPromptText // empty' 2>/dev/null)

# Check if prompt matches trigger keywords (case-insensitive)
SHOULD_INJECT_DOCS=false
for keyword in "${TRIGGER_KEYWORDS[@]}"; do
    if echo "$USER_PROMPT" | grep -iq "\b$keyword\b"; then
        SHOULD_INJECT_DOCS=true
        break
    fi
done

# If no trigger keywords found, continue without injection
if [ "$SHOULD_INJECT_DOCS" = false ]; then
    jq -n '{
        continue: true,
        hookResult: "No doc injection needed for this prompt"
    }'
    exit 0
fi

# Read documentation files from the three key locations
DOC_PATHS=("docs" "client/docs" "server/docs")
ALL_DOCS=""
DOC_COUNT=0

for DOC_PATH in "${DOC_PATHS[@]}"; do
    if [ -d "$DOC_PATH" ]; then
        while IFS= read -r -d '' file; do
            if [ -f "$file" ]; then
                # Read file content
                CONTENT=$(cat "$file" 2>/dev/null)
                if [ -n "$CONTENT" ]; then
                    RELATIVE_PATH="${file#./}"
                    ALL_DOCS+="### Document: $RELATIVE_PATH"$'\n'
                    ALL_DOCS+='```markdown'$'\n'
                    ALL_DOCS+="$CONTENT"$'\n'
                    ALL_DOCS+='```'$'\n'$'\n''---'$'\n'$'\n'
                    ((DOC_COUNT++))
                fi
            fi
        done < <(find "$DOC_PATH" -type f -name "*.md" -print0 2>/dev/null)
    fi
done

# Prepare documentation context message
if [ $DOC_COUNT -gt 0 ]; then
    DOCS_CONTENT="## Relevant Project Documentation"$'\n'$'\n'"$ALL_DOCS"
else
    DOCS_CONTENT="## Project Documentation"$'\n'$'\n'"Note: No documentation files found in /docs, /client/docs, or /server/docs"$'\n'
fi

# Create system message
SYSTEM_MESSAGE="IMPORTANT: Before proceeding with analysis or code changes, review the project documentation below to ensure understanding of the project architecture, requirements, and design decisions.

$DOCS_CONTENT

Based on this documentation context, proceed with the analysis or changes requested by the user."

# Output JSON response using jq
jq -n \
    --arg continue "true" \
    --arg sysMsg "$SYSTEM_MESSAGE" \
    --argjson docCount "$DOC_COUNT" \
    '{
        continue: ($continue == "true"),
        systemMessage: $sysMsg,
        hookResult: "Automatically injected \($docCount) documentation files"
    }'

exit 0

# Documentation Enforcement Hook

## Tóm tắt

Hook này **tự động inject documentation** từ project vào context của agent trước khi xử lý analysis hoặc code changes. Đảm bảo agent luôn có đầy đủ project context trước khi thực hiện bất kì thay đổi nào.

## Cấu hình

- **Hook File**: `.github/hooks/require-docs-reading.json`
- **Scripts**: 
  - `.github/scripts/inject-docs-context.ps1` (Windows)
  - `.github/scripts/inject-docs-context.sh` (Linux/macOS)
- **Trigger Event**: `UserPromptSubmit` (khởi động trước khi user prompt được xử lý)
- **Timeout**: 30 giây

## Cách hoạt động

### 1. Phát hiện Prompt Analysis/Change

Hook nhận diện các keywords sẽ trigger document injection:

```
analyze, analysis, assessment,
implement, implementation, build, create,
modify, change, update, edit, fix,
refactor, restructure, redesign, architect,
workflow, architecture, design,
decode, inspect, review, evaluate,
explain, understand, clarify,
plan, strategy, specification, spec
```

**Ví dụ**: User prompt "analyze the video transcoding workflow" → hook detect keyword "analyze" → trigger injection

### 2. Đọc Tất Cả Docs

Script tự động quét 3 thư mục docs:
- `docs/` - Tài liệu chính project
- `client/docs/` - Tài liệu client
- `server/docs/` - Tài liệu server

Tất cả file `.md` được đọc và nối lại.

### 3. Inject vào Context

System message được tạo với nội dung:
```
IMPORTANT: Before proceeding with analysis or code changes, review the project documentation below...

## Relevant Project Documentation

### Document: docs/04-proposed-tech-stack-architecture.md
[full content]

### Document: docs/ffmpeg.md
[full content]

...

Based on this documentation context, proceed with the analysis or changes requested by the user.
```

**Kết quả**: Agent có full docs context → xử lý prompt với understanding đầy đủ

## Output Hook

Hook trả về JSON:

```json
{
  "continue": true,
  "systemMessage": "IMPORTANT: Before proceeding...",
  "hookResult": "Automatically injected 12 documentation files"
}
```

- `continue: true` → cho phép tiếp tục xử lý prompt
- `systemMessage` → inject vào system context
- `hookResult` → log message

## Sơ đồ Workflow

```
User submits prompt: "analyze video encoding architecture"
        ↓
Hook triggered (UserPromptSubmit)
        ↓
Script checks prompt keywords → match "analyze"
        ↓
Script reads /docs, /client/docs, /server/docs
        ↓
System message created with all doc content
        ↓
Hook returns JSON with continue=true, systemMessage
        ↓
Agent receives prompt + full doc context injected
        ↓
Agent processes with complete project understanding
```

## Sửa đổi/Mở rộng

### Thêm Trigger Keywords

Sửa file script (`.ps1` hoặc `.sh`):

```powershell
# PowerShell
$triggerKeywords = @(
    "analyze", "analyze_new", ...  # Thêm từ mới
)

# Bash
TRIGGER_KEYWORDS=(
    "analyze" "analyze_new" ...  # Thêm từ mới
)
```

### Thêm Thư Mục Docs

Sửa `DOC_PATHS`:

```powershell
# PowerShell
$docPaths = @(
    "docs",
    "client/docs",
    "server/docs",
    "api/docs"  # Thêm mới
)

# Bash
DOC_PATHS=("docs" "client/docs" "server/docs" "api/docs")
```

### Thay đổi Trigger Event

Mặc định hook trigger ở `UserPromptSubmit`. Có thể đổi thành:
- `SessionStart` - Inject docs khi bắt đầu session (lúc đầu tiên)
- `PreToolUse` - Inject trước mỗi tool invocation

Sửa `.github/hooks/require-docs-reading.json`:

```json
{
  "hooks": {
    "SessionStart": [  // Thay đổi event
      { ... }
    ]
  }
}
```

## Testing

### Test Hook Chạy Tốt

1. Trigger prompt với keyword analysis:
   ```
   "hãy phân tích (analyze) architecture của video encoding"
   ```

2. Kiểm tra agent context:
   - Xem system message có chứa docs nội dung không
   - Xem agent có reference tới docs nội dung không

3. Trigger prompt KHÔNG có keyword:
   ```
   "hello world"
   ```
   → Hook không inject, prompt xử lý bình thường

### Test Script Trực Tiếp (Development)

**PowerShell (Windows):**
```powershell
# Test script
$testInput = @{
    userPromptText = "analyze the ffmpeg architecture"
} | ConvertTo-Json

# Run script
$testInput | & ".\.github\scripts\inject-docs-context.ps1"
```

**Bash (Linux/macOS):**
```bash
# Test script
echo '{"userPromptText": "analyze the ffmpeg architecture"}' | \
  bash .github/scripts/inject-docs-context.sh
```

## Lưu ý Quan Trọng

**⚠️ Hiệu suất:**
- Hook có timeout 30 giây, đủ để đọc tất cả docs
- Nếu project lớn, có thể chậm — có thể tăng timeout hoặc cache docs

**⚠️ Context Size:**
- System message có thể rất lớn (triệu ký tự nếu docs nhiều)
- Agent token limit có thể bị vượt
- Giải pháp: Dùng `PreToolUse` hook thay vì `UserPromptSubmit` để chỉ inject khi cần

**⚠️ Syntax:**
- Windows: `.ps1` file phải có encoding UTF-8, có newline ở line cuối
- Linux: `.sh` file phải executable: `chmod +x .github/scripts/inject-docs-context.sh`

## Liên quan

- Hook reference: `.github/hooks/release-notes.json` (example)
- Docs: [Hooks Documentation](https://code.visualstudio.com/docs/copilot/customization/hooks)
- Skill: `agent-customization`

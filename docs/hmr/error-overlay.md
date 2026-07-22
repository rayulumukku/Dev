# HMR Error Overlay Version 2 (`@ray/hmr-runtime`)

Ray's HMR Error Overlay Version 2 provides modern, framework-agnostic error diagnostics, source mapping, code frames, and automatic recovery.

## Architecture

```
Error Event (Runtime / Transform / Plugin)
        ↓
   ErrorParser (Normalizes stack trace & category)
        ↓
CodeFrame & Diagnostics (Highlights caret & suggests fixes)
        ↓
    OverlayUI (Lazy DOM render, shadow root)
        ↓
OverlayRecoveryTracker (Auto-dismisses overlay on HMR fix)
```

## Features

- **Source Map Mapping**: Translates generated line/column positions back to original source files.
- **Highlighted Code Frames**: Shows surrounding context lines with caret indicators.
- **Actionable Diagnostic Hints**: Built-in suggestions for unresolved imports, JSX syntax errors, export mismatches, and TypeScript parse issues.
- **Automatic Recovery**: Automatically dismisses the overlay when an HMR update resolves the error.

#!/usr/bin/env python3
"""
Reads an AI Task ticket (via env vars, populated from the Jira dispatch payload)
and asks Claude to implement it, writing files directly to the working directory.

Env vars expected:
  TICKET_KEY          e.g. "SANDBOX-12"
  TICKET_SUMMARY       one-line ticket title
  TICKET_DESCRIPTION   full ticket body (the boilerplate template, filled in)
  ANTHROPIC_API_KEY    set as a repo secret, injected by the workflow

Cost controls baked in:
  - Uses Haiku (cheapest model)
  - max_tokens capped
  - Only reads files explicitly mentioned in the ticket's Context section
    (no blind whole-repo scanning)
"""

import os
import sys
import json
import glob
import anthropic

MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 4000
MAX_CONTEXT_FILES = 6
MAX_FILE_CHARS = 8000  # per file, to keep input tokens bounded


def gather_context_files(description: str) -> dict:
    """
    Very simple heuristic: look for file-like paths mentioned in the ticket
    description (anything with a '/' or a common extension) and read them
    if they exist in the repo. Keeps input small and deliberate.
    """
    candidates = set()
    for token in description.replace(",", " ").replace("`", " ").split():
        token = token.strip("()[]{}:;\"'")
        if "/" in token or any(
            token.endswith(ext) for ext in (
                ".py", ".js", ".ts", ".md", ".yml", ".yaml",
                ".json", ".html", ".css", ".txt"
            )
        ):
            candidates.add(token)

    files = {}
    for path in list(candidates)[:MAX_CONTEXT_FILES]:
        matches = glob.glob(path) or glob.glob(f"**/{path}", recursive=True)
        for m in matches[:1]:
            try:
                with open(m, "r", encoding="utf-8") as f:
                    content = f.read()
                files[m] = content[:MAX_FILE_CHARS]
            except (IOError, UnicodeDecodeError):
                continue
    return files


def build_prompt(key: str, summary: str, description: str, context_files: dict) -> str:
    context_block = ""
    if context_files:
        context_block = "\n\nExisting relevant files:\n"
        for path, content in context_files.items():
            context_block += f"\n--- {path} ---\n{content}\n"
    else:
        context_block = "\n\nNo existing files were found matching paths mentioned in the ticket. If this task requires editing an existing file, say so in your response instead of inventing content."

    return f"""You are completing a small, well-defined engineering ticket.

Ticket: {key}
Summary: {summary}

Description:
{description}
{context_block}

Implement ONLY what is described above. Do not add extra features, dependencies, or unrelated refactoring.

Respond with ONLY a JSON object, no other text, no markdown fences, in this exact shape:
{{
  "files": [
    {{"path": "relative/path/to/file.ext", "content": "full file content here"}}
  ],
  "summary": "one sentence describing what you did",
  "blocked": false,
  "blocked_reason": ""
}}

If the ticket is not clear enough to complete safely, set "blocked": true, leave "files" empty, and explain why in "blocked_reason".
"""


def main():
    key = os.environ.get("TICKET_KEY", "UNKNOWN")
    summary = os.environ.get("TICKET_SUMMARY", "")
    description = os.environ.get("TICKET_DESCRIPTION", "")

    if not description.strip():
        print("No ticket description provided — aborting.", file=sys.stderr)
        sys.exit(1)

    context_files = gather_context_files(description)
    prompt = build_prompt(key, summary, description, context_files)

    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env

    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}],
    )

    raw_text = "".join(
        block.text for block in response.content if block.type == "text"
    ).strip()

    # Strip accidental markdown fences if the model adds them anyway
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
        raw_text = raw_text.strip()

    try:
        result = json.loads(raw_text)
    except json.JSONDecodeError as e:
        print(f"Failed to parse model response as JSON: {e}", file=sys.stderr)
        print(f"Raw response was:\n{raw_text}", file=sys.stderr)
        sys.exit(1)

    if result.get("blocked"):
        print(f"BLOCKED: {result.get('blocked_reason', 'no reason given')}")
        # Write a marker file the workflow can check for
        with open("AGENT_BLOCKED.txt", "w") as f:
            f.write(result.get("blocked_reason", "Ticket unclear."))
        sys.exit(2)

    files_written = []
    for file_entry in result.get("files", []):
        path = file_entry["path"]
        content = file_entry["content"]
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        files_written.append(path)

    print(f"Wrote {len(files_written)} file(s): {', '.join(files_written)}")
    print(f"Summary: {result.get('summary', '')}")

    # Expose for the workflow to use in the PR body
    with open("AGENT_SUMMARY.txt", "w") as f:
        f.write(result.get("summary", ""))

    # Log token usage so you can watch cost during the demo
    print(
        f"Tokens — input: {response.usage.input_tokens}, "
        f"output: {response.usage.output_tokens}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()

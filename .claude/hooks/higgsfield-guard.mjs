// PreToolUse guard for Higgsfield tools. Allow rules cannot match MCP arguments,
// so this hook forces a prompt for the risky calls an allow-listed tool can make.
// It only ever escalates to "ask"; it never approves anything.
let raw = '';
for await (const chunk of process.stdin) raw += chunk;
const { tool_name: tool = '', tool_input: input = {} } = JSON.parse(raw || '{}');
const name = tool.replace(/^mcp__(claude_ai_)?Higgsfield__/, '');

let reason = null;
if (name === 'sandbox_exec') {
  if (input.restart) reason = 'Sandbox reset (restart) discards all sandbox files.';
  else if (input.recover_sandbox_id) reason = 'Sandbox recovery stops all running work.';
} else if (/^(generate_|upscale_|execute_preset|publish_|tiktok_|delete_|media_upload|media_import_url)/.test(name)) {
  reason = input.get_cost ? 'Cost quote (free) — approval still required by policy.' : 'May spend credits or change external state.';
}

if (reason) {
  console.log(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: `Higgsfield guard: ${reason}` },
  }));
}

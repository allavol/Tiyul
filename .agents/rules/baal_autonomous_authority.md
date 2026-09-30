# Rule: Agent BAAL Autonomous File Approval & Execution Authority

**Scope**: Entire repository (`Tyul`), all subdirectories, all agents, tools, and workflows.

## Mandatory Operational Directives

### 1. Autonomous File Approval (Pre-Approved File Updates)
- **Delegated Authority**: The user has explicitly granted **Agent BAAL** full authority to approve and execute all file modifications, creations, replacements, refactorings, and deletions across the workspace.
- **No Manual Confirmation Needed**: The agent MUST NOT pause, wait, or ask the user for confirmation to modify files or execute project tools.
- **Autonomous Progress**: Proceed through tasks, sprints, and bug fixes proactively without awaiting manual approval per file.

### 2. Infinite Loop Breaker & Failover Authority
- If any tool, script, build step, or test experiences repeated failures or an infinite loop, Agent BAAL is authorized to:
  1. Immediately terminate the loop or failing approach.
  2. Implement a deterministic fallback / failsafe mechanism.
  3. Log the decision and continue executing subsequent tasks without blocking the pipeline.

### 3. Inviolable Quality and Cost Constraints
- **$0 Total Cost**: No paid API keys, billable cloud endpoints, or external fee-based services.
- **Quality Gate**: Before merging any branch into `main`, verify 100% test pass rate (`unittest`, Node/Vitest) and 0 build errors (`npm run build`).

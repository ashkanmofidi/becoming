PRD Management Rules:
1. When asked to create a PRD, save it as a numbered markdown file in docs/prds/ (e.g., 001-feature-name.md). Include a 'Dependencies' section listing any related PRDs by number and name.
2. When asked to update a PRD, find the existing file in docs/prds/ by name or topic and edit only the relevant sections in place. Never create duplicates.
3. After any PRD is created or updated, automatically scan all other PRDs in docs/prds/ for dependency conflicts or impacts. If the change affects other PRDs (shared data models, API changes, UX flows, prerequisite features), update those PRDs too and list what was changed at the end of your response.
4. Maintain a docs/prds/INDEX.md file that lists all PRDs with their number, title, status, and dependencies. Update it automatically whenever a PRD is created or modified.

Mandatory Documentation Update Rule:
ANY code change, bug fix, feature addition, or behavior modification — regardless of size — MUST include corresponding updates to ALL of these documents:
1. PRD.md — Update the relevant section. Mark changes with [CHANGED v3.x.x - YYYY-MM-DD] tag.
2. TEST_CASES.md — Update affected test case expected results, or add new test cases.
3. CHANGELOG.md — Add entry under the current version with what changed and why.
4. BUILD_TRACKER.md — Update status if a feature's completion state changed.
This rule is ALWAYS enforced. The developer does NOT need to ask for it. It happens automatically on every change.

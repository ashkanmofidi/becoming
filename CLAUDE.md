PRD Management Rules:
1. When asked to create a PRD, save it as a numbered markdown file in docs/prds/ (e.g., 001-feature-name.md). Include a 'Dependencies' section listing any related PRDs by number and name.
2. When asked to update a PRD, find the existing file in docs/prds/ by name or topic and edit only the relevant sections in place. Never create duplicates.
3. After any PRD is created or updated, automatically scan all other PRDs in docs/prds/ for dependency conflicts or impacts. If the change affects other PRDs (shared data models, API changes, UX flows, prerequisite features), update those PRDs too and list what was changed at the end of your response.
4. Maintain a docs/prds/INDEX.md file that lists all PRDs with their number, title, status, and dependencies. Update it automatically whenever a PRD is created or modified.

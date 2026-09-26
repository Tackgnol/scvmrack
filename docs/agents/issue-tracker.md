# Issue tracker: Linear

Issues and specs for this repo live in Linear, in the **rpgtoolsco** workspace, team key **`RPG`** (issues are `RPG-<n>`, e.g. https://linear.app/rpgtoolsco/issue/RPG-251). Use the Linear connector / MCP tools available in the session for all operations. If no Linear tools are available, say so and stop rather than falling back to GitHub Issues.

GitHub Issues on `Tackgnol/scvmrack` is not the tracker; ignore it unless the user points at a specific GitHub issue.

## Conventions

- **Create an issue**: create it in team `RPG` with a title and a markdown description.
- **Read an issue**: fetch it by its `RPG-<n>` identifier, including comments, labels, status, sub-issues and relations.
- **List issues**: list team `RPG` issues filtered by status and/or label.
- **Comment on an issue**: add a comment to the `RPG-<n>` issue.
- **Apply / remove labels**: update the issue's labels (see `triage-labels.md`).
- **Close**: comment with the reason, then move the issue to a completed or canceled status.
- **Branches and commits**: reference the identifier (e.g. `fix: ... (RPG-256)`, branch `.../rpg-256-...`) so Linear links the work.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

## When a skill says "publish to the issue tracker"

Create a Linear issue in team `RPG`.

## When a skill says "fetch the relevant ticket"

Fetch the `RPG-<n>` issue from Linear, with its comments.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single parent issue with **child** issues as tickets.

- **Map**: a single `RPG` issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog body.
- **Child ticket**: a Linear **sub-issue** of the map, labelled `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: Linear's native **"blocked by"** issue relation. A ticket is unblocked when every blocker is completed or canceled.
- **Frontier query**: list the map's open sub-issues, drop any with an open blocker or an assignee; first in map order wins.
- **Claim**: assign the issue to the driving dev (and move it to in-progress), the session's first write.
- **Resolve**: comment with the answer, move the issue to done, then append a context pointer (gist + link) to the map's Decisions-so-far.

# Custom Classes are versioned, not locked

A character stores only keys, and every sheet load resolves ability text, item stats and modifiers live from its class. So editing a Custom Class that characters already play would silently change their sheets. We make each saved edit of a used class create a new immutable Class Version: `Character.classId` keeps pointing at the version it was rolled with, while pools and new rolls follow the lineage's latest version. The creator tells the GM before a save creates a version.

## Considered Options

- **Lock on first use, duplicate to change** (the original charting decision): simple, but GMs hit a wall, and typos stay forever.
- **Snapshot class content into each character at roll time**: changes every reader and the character model.

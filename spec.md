# BP-PAY Per-User Data Isolation

## Current State
- bppay_upi_entries is a single shared localStorage key shared across all users
- localStats initialized hardcoded to balance 300, synced from anonymous shared backend actor
- Logout only removes bppay_current_user; new users inherit previous user state

## Requested Changes (Diff)

### Add
- Per-user localStorage helpers: loadUserStats(username), saveUserStats(username, stats)
- Per-user withdrawal timer key: bppay_withdrawal_{username}

### Modify
- STORAGE_KEY -> bppay_upi_entries_{username}
- loadEntries/saveEntries accept username, use namespaced key
- localStats initial state loads from bppay_stats_{username}; defaults to balance 300 if no data
- Stats sync interval saves to localStorage instead of/in addition to actor
- withdrawalMs loaded from bppay_withdrawal_{username} on mount; saved on change

### Remove
- Nothing removed, actor calls kept as-is but localStorage is primary

## Implementation Plan
1. Read username from localStorage.getItem('bppay_current_user') in Dashboard
2. Define namespaced helpers for stats and entries
3. Initialize localStats from per-user localStorage (default 300 if new user)
4. Initialize entries from per-user localStorage
5. Initialize withdrawalMs from per-user localStorage
6. Save stats on change and in sync interval
7. Save withdrawalMs on change
8. All saveEntries calls pass username

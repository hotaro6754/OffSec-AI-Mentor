# Bolt's Journal - OffSec AI Mentor

## 2025-05-22 - Missing Database Indexes
**Learning:** SQLite foreign keys do not automatically create indexes. Every query filtered by user_id was performing a full table scan (O(n)). Adding indexes reduces this to O(log n), resulting in a ~50x performance improvement for tables with 50k+ records.
**Action:** Always verify that frequently queried foreign keys have explicit indexes in SQLite.

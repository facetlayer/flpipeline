---
description: How to make SQL queries when using the facetlayer/sqlite-wrapper library
---

This document details how to interact with a SQLite database using facetlayer/sqlite-wrapper

This library wrappers around 'better-sqlite'.

All SQlite operations are *synchronous* and don't need async/await.

Quick guide to the database functions:

 - db.run(sql, params) - Run a SQL command without returning any rows.
 - db.get(sql, params) - Get a single row.
 - db.list(sql, params) - Get multiple rows as an array.
 - db.each(sql, params) - Get multiple rows as an iterator
 - db.exists(sql, params) - Check if a row exists with `select exists(select 1 ${sql})`.
 - db.count(sql, params) - Get a count using `select count(*) ${sql}`
 - db.insert(tableName: string, row: Record<string,any>)
   - Builds an INSERT statement using the 'row' object.
 - db.update(tableName: string, whereClause, whereParams, row: Record)
   - Builds an UPDATE statement that looks like: `UPDATE <tableName> SET column1 = ?, column2 = ? WHERE <where condition>`
 - db.upsert(tableName, where, whereValues, row)
   - Calls .insert() or .update() (depending if an existing item is found)

# Parameters

(Almost) every function accepts a 'params' array for dynamic values.

Example:

    const row = db.get(
      `SELECT * FROM mcp_inspection_results WHERE user_id = ? AND mcp_url = ?`,
      [userId, mcpUrl]
    );

# Schema Migration #

The library wrapper will automatically do safe migrations if the existing database
schema is different than the code's schema. This means that a column can be safely
added.

Wrapper object over a `better-sqlite3` instance.

# RunResult

Certain functions (`.run`, `.insert`, `update`) return a RunResult instead of
returning any rows. This can be checked to see the effect of the statement.

    interface RunResult {
        changes: number;
        lastInsertRowid: number;
    }

# Inserts

For simple INSERT commands, there is a builder-style function db.insert():

```
insert(tableName: string, row: Record<string, any>): RunResult;
```

Example usage:

```
db.insert('user_accounts', { user_id: 123, name: "John" });
```

The wrapper library will convert the `row: Record` object into an INSERT INTO statement,
where the record's keys correspond to database columns. The values will be parameterized.
The above example will result in this SQL statment:

```
INSERT INTO user_accounts (user_id, name) values (?, ?)
```

# Updates

For simple UPDATE commands, there is a builder-style function db.update():

```
update(tableName: string, whereClause: string, whereParams: any[], row: Record<string,any>): RunResult;
```

**Parameters**

| name | description |
| ---- | ----------- |
| tableName | the table name |
| whereClause | SQL clause that will be added as the WHERE section |
| whereParams | Parametrized values used in the `whereClause` |
| row | Object that is converted into `<column> = <value>` statements |

**Example**

```
db.update('user_accounts', 'id = ?', [123], {
  name: 'John',
  email: 'john@example.com'
});
```

This will result in an SQL call with:

```
UPDATE user_accounts SET name = ?, email = ? WHERE id = ?
```

(with params: `["John", "john@example.com", 123]`)

# Timestamps

For timestamp columns in database schemas, always use UTC format with 'Z' suffix to ensure proper timezone handling:

**Correct:**
```sql
created_at DATETIME DEFAULT (datetime('now', 'utc') || 'Z'),
```

**Incorrect:**
```sql
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
```

# Upsert

The wrapper library provides a more advanced helper db.upsert():

```
upsert(tableName: string, where: Record<string,any>, row: Record<string, any>)
```

This call will either `insert` or `update` depending on whether the item exists.

The flow is:

 1) First the library will try to `update`.
 2) If no rows were affected, the library will `insert`.

More details:

First the library will run an UPDATE, using the keys and values in `where` as the WHERE clause,
and using the `row` as the SET section.

If no rows are affected, the library will combine the `where` and `row` objects into
a single object, and use that to build an `INSERT` statement.

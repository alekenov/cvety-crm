# Railway Logs Command

## Checking Service Logs

To check logs for the specific Railway service, use:

```bash
railway logs --service cvety-kz
```

This command shows logs for the `cvety-kz` service specifically.

## Other Useful Log Commands

```bash
# View all logs
railway logs

# View build logs
railway logs --build

# View logs in JSON format
railway logs --json

# View build logs in JSON format
railway logs -b --json

# Follow logs in real-time
railway logs -f

# View last N lines
railway logs --tail 50
```

## Troubleshooting

If you see database transaction errors like:
- "current transaction is aborted"
- "InFailedSqlTransaction"

This usually means:
1. The database connection was interrupted
2. A previous query failed and the transaction wasn't rolled back
3. The app needs to be restarted to clear the bad transaction

Fix: Restart the service with `railway restart` or redeploy with `railway up -c`
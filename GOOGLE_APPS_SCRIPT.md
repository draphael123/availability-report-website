# Google Apps Script for Historical Data

To track historical data, add this script to your Google Sheet:

## Setup Instructions

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Delete any existing code and paste the script below
4. Click **Save** (disk icon)
5. Run `createDailyTrigger()` once to set up automatic daily snapshots
6. Authorize the script when prompted

## Script Code

```javascript
/**
 * Daily snapshot function - copies current data to History tab
 */
function dailySnapshot() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get the source sheet (your main data tab)
  // Change 'Sheet1' to your actual tab name if different
  const sourceSheet = ss.getSheetByName('Sheet1');
  if (!sourceSheet) {
    Logger.log('Source sheet not found');
    return;
  }
  
  // Get or create History sheet
  let historySheet = ss.getSheetByName('History');
  if (!historySheet) {
    historySheet = ss.insertSheet('History');
    Logger.log('Created new History sheet');
  }
  
  // Get today's date in YYYY-MM-DD format
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  
  // Get all data from source sheet
  const data = sourceSheet.getDataRange().getValues();
  if (data.length === 0) {
    Logger.log('No data in source sheet');
    return;
  }
  
  const headers = data[0];
  
  // Check if history sheet needs headers
  if (historySheet.getLastRow() === 0) {
    historySheet.appendRow(['snapshot_date', ...headers]);
    Logger.log('Added headers to History sheet');
  }
  
  // Check if we already have today's snapshot
  const historyData = historySheet.getDataRange().getValues();
  const existingDates = historyData.slice(1).map(row => row[0]);
  if (existingDates.includes(today)) {
    Logger.log('Snapshot for ' + today + ' already exists, skipping');
    return;
  }
  
  // Append each data row with today's date
  let rowsAdded = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Skip empty rows
    if (row.every(cell => cell === '' || cell === null)) continue;
    
    historySheet.appendRow([today, ...row]);
    rowsAdded++;
  }
  
  Logger.log('Added ' + rowsAdded + ' rows to History for ' + today);
}

/**
 * Create a daily trigger to run the snapshot at midnight
 */
function createDailyTrigger() {
  // Remove any existing triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'dailySnapshot') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new daily trigger at midnight
  ScriptApp.newTrigger('dailySnapshot')
    .timeBased()
    .everyDays(1)
    .atHour(0)
    .create();
  
  Logger.log('Daily trigger created - will run at midnight');
}

/**
 * Manual function to create history for past 7 days (for testing)
 * Only run this once if you want to backfill some data
 */
function backfillHistory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheet = ss.getSheetByName('Sheet1');
  
  let historySheet = ss.getSheetByName('History');
  if (!historySheet) {
    historySheet = ss.insertSheet('History');
  }
  
  const data = sourceSheet.getDataRange().getValues();
  const headers = data[0];
  
  // Clear and add headers
  historySheet.clear();
  historySheet.appendRow(['snapshot_date', ...headers]);
  
  // Create entries for past 7 days
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.every(cell => cell === '' || cell === null)) continue;
      historySheet.appendRow([dateStr, ...row]);
    }
  }
  
  Logger.log('Backfilled history for past 7 days');
}

/**
 * View function to check trigger status
 */
function checkTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    Logger.log('Trigger: ' + trigger.getHandlerFunction() + ' - ' + trigger.getEventType());
  });
  if (triggers.length === 0) {
    Logger.log('No triggers found. Run createDailyTrigger() to set up.');
  }
}
```

## Usage

After setup, the script will:

1. **Run automatically at midnight** every day
2. **Create a "History" tab** in your spreadsheet
3. **Add daily snapshots** with a `snapshot_date` column

## History Tab Structure

| snapshot_date | Category | Location | Name | ... |
|--------------|----------|----------|------|-----|
| 2026-01-06 | HRT | NYC | Provider A | ... |
| 2026-01-06 | TRT | LA | Provider B | ... |
| 2026-01-07 | HRT | NYC | Provider A | ... |

## Troubleshooting

- **Script not running?** Check Extensions → Apps Script → Triggers
- **Permission error?** Re-authorize the script
- **No data?** Make sure your source tab is named correctly in the script


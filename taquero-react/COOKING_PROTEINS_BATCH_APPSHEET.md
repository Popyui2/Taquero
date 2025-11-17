# AppSheet Setup for Cooking Proteins Batch

## Google Sheet Setup

Create a Google Sheet with the following structure:

### Sheet Name: `Cooking Proteins Batch`

### Column Headers (Row 1):
| Column A | Column B | Column C | Column D | Column E | Column F | Column G |
|----------|----------|----------|----------|----------|----------|----------|
| Unix Timestamp | Staff Name | Protein Cooked | Type of check | temperature | duration in that temperature | Cooking Protein Batch ID |

### Column Types in AppSheet:
- **Unix Timestamp**: Number
- **Staff Name**: Text
- **Protein Cooked**: Text (or Enum with values: Chicken, Beef, Pork, Other)
- **Type of check**: Text (or Enum with values: Individual, Weekly Batch, One item in each batch)
- **temperature**: Decimal
- **duration in that temperature**: Text
- **Cooking Protein Batch ID**: Text (Key column)

---

## AppSheet Configuration

### 1. Create AppSheet App
1. Go to https://www.appsheet.com
2. Create a new app
3. Connect to your Google Sheet
4. Select the "Cooking Proteins Batch" sheet

### 2. Set Column Properties

#### Unix Timestamp
- Type: Number
- Display name: "Timestamp"
- Initial value: `NOW()`
- Editable: No
- Show: No

#### Staff Name
- Type: Text
- Display name: "Staff Name"
- Initial value: `USEREMAIL()`
- Editable: No
- Required: Yes

#### Protein Cooked
- Type: Enum
- Display name: "Protein Cooked"
- Values: `Chicken`, `Beef`, `Pork`, `Other`
- Required: Yes

#### Type of check
- Type: Enum
- Display name: "Type of Check"
- Values: `Individual`, `Weekly Batch`, `One item in each batch`
- Required: Yes

#### temperature
- Type: Decimal
- Display name: "Temperature (°C)"
- Min: 0
- Max: 300
- Required: Yes

#### duration in that temperature
- Type: Text
- Display name: "Duration"
- Required: Yes
- Show if: `TRUE`

#### Cooking Protein Batch ID
- Type: Text
- Display name: "Batch ID"
- Key: Yes
- Initial value: `UNIQUEID()`
- Editable: No
- Show: No

---

## 3. AppSheet Expressions (Optional)

### Virtual Column: Temperature Status
Add a virtual column to show if temperature is in safe range:

```
Type: Text
Formula: IF([temperature] >= 65, "Safe", "Check Required")
```

### Virtual Column: Formatted Date
Add a virtual column for human-readable date:

```
Type: Text
Formula: TEXT([Unix Timestamp] / 86400 + DATE(1970, 1, 1), "MMM DD, YYYY")
```

---

## 4. AppSheet Views

### Form View (Add New Check)
Configure the form to show:
1. Protein Cooked (dropdown)
2. Type of check (dropdown)
3. Temperature (number input)
4. Duration in that temperature (text input)

Hide:
- Unix Timestamp (auto-filled)
- Staff Name (auto-filled)
- Cooking Protein Batch ID (auto-generated)

### Table View (Recent Checks)
Configure columns to display:
1. Staff Name
2. Protein Cooked
3. Temperature
4. Duration
5. Type of check
6. Formatted Date (if virtual column created)

Sort by: Unix Timestamp (descending)

---

## 5. AppSheet Actions (Optional)

### Delete Record Action
```
Action Name: Delete Check
For a record of: Cooking Proteins Batch
Do this: Delete this row
```

### Export to PDF Action (Advanced)
```
Action Name: Export Report
For a record of: Cooking Proteins Batch
Do this: Create a PDF report
Template: Create a custom template showing all check details
```

---

## 6. AppSheet Data Sync

Configure automatic sync:
- Sync mode: Automatic
- Sync interval: Every 5 minutes
- Allow offline use: Yes

---

## 7. AppSheet Security

### Share Settings
1. Go to "Manage" > "Users"
2. Set authentication to require sign-in
3. Add authorized users by email

### Row-level Security (Optional)
To restrict users to only see their own records:
```
USEREMAIL() = [Staff Name]
```

---

## Integration Notes

- The web app (React) and AppSheet app will both write to the same Google Sheet
- Data will sync automatically between both interfaces
- AppSheet provides offline capability for field use
- Use AppSheet for mobile/tablet quick entry
- Use web app for detailed review and analysis

---

## Testing Checklist

- [ ] Create test record from AppSheet
- [ ] Verify it appears in Google Sheet
- [ ] Verify it appears in web app after refresh
- [ ] Create test record from web app
- [ ] Verify it appears in AppSheet after sync
- [ ] Test all enum values
- [ ] Test temperature validation
- [ ] Test with different users

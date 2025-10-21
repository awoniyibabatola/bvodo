# Super Admin Credits Matrix - Explanation

## What the Columns Mean

### Credits Column
Shows the complete financial picture for each organization:

```
$100,000              ← Total Credits (what super admin allocated to org)
$50,000 available     ← Available Credits (unallocated + users' available)
$20,000 used          ← Used Credits (actual bookings made by users)
```

**Breakdown:**
- **Total**: Organization's total credit pool allocated by super admin
- **Available**: Org's unallocated + Sum of all users' available credits
- **Used**: Credits actually spent on confirmed bookings

### Usage Column
Shows the percentage of total credits that have been used:

```
████████░░░░░ 20%    ← Visual progress bar with percentage
```

**Formula:**
```
Usage % = (Used Credits / Total Credits) × 100
        = ($20,000 / $100,000) × 100
        = 20%
```

**Color Coding:**
- 🟢 Green (0-50%): Healthy usage
- 🟠 Orange (51-80%): Moderate usage
- 🔴 Red (81-100%): High usage, may need more credits

---

## Example Scenario

### Organization: Acme Corporation

**Super Admin allocated:** $100,000

**Company Admin allocated to users:**
- User A (Traveler): $30,000 limit → Used $10,000, Available $20,000
- User B (Traveler): $40,000 limit → Used $5,000, Available $35,000
- User C (Manager): $20,000 limit → Used $5,000, Available $15,000
- **Remaining unallocated:** $10,000

**What Super Admin Sees:**

| Column | Value | Calculation |
|--------|-------|-------------|
| **Total** | $100,000 | Super admin allocation |
| **Available** | $80,000 | $10,000 unallocated + $70,000 (users' available) |
| **Used** | $20,000 | $10,000 + $5,000 + $5,000 (actual bookings) |
| **Usage** | 20% | ($20,000 / $100,000) × 100 |

### Why This Makes Sense:

1. **Total Credits ($100,000)**: What the organization was given
2. **Available Credits ($80,000)**: What can still be spent
   - $10,000 not yet allocated to users
   - $70,000 allocated to users but not spent
3. **Used Credits ($20,000)**: What's actually been spent on trips
4. **Usage (20%)**: Only 20% of the organization's total allocation has been used

---

## What's NOT Included in "Used"

❌ Credits allocated to users but not spent
❌ Credits on hold for pending bookings (unless confirmed)
❌ Unallocated organization credits

✅ **ONLY credits spent on confirmed bookings**

---

## Common Scenarios

### Scenario 1: Low Usage (Good)
```
Total: $100,000
Available: $85,000
Used: $15,000
Usage: 15% 🟢
```
**Meaning**: Organization has plenty of credits available. Users are traveling efficiently.

### Scenario 2: Medium Usage (Monitor)
```
Total: $100,000
Available: $40,000
Used: $60,000
Usage: 60% 🟠
```
**Meaning**: Organization is using credits actively. May need a top-up soon.

### Scenario 3: High Usage (Action Needed)
```
Total: $100,000
Available: $10,000
Used: $90,000
Usage: 90% 🔴
```
**Meaning**: Running low on credits. Super admin should allocate more soon.

---

## Is the Calculation Correct?

**YES!** ✅ The usage percentage is calculated correctly.

### Verification:

**Old Formula (WRONG):**
```
Usage = (Total - Available) / Total
      = ($100,000 - $80,000) / $100,000
      = 20%  ← This would count allocated-but-not-used credits
```

**New Formula (CORRECT):**
```
Usage = Used Credits / Total Credits
      = $20,000 / $100,000
      = 20%  ← This only counts actual spending
```

The **current calculation is correct** because it measures **actual consumption**, not allocation.

---

## Why Two Different "Available" Meanings?

### For Company Admins (Organization View):
- **Available** = Unallocated credits (what they can give to users)

### For Super Admins (Platform View):
- **Available** = Unallocated + Users' available (total spending power)

This gives super admins a complete picture of how much the organization can actually spend.

---

## Summary

| Metric | What It Shows | Why It Matters |
|--------|---------------|----------------|
| **Total** | Super admin allocation | Organization's credit limit |
| **Available** | Can still be spent | Remaining spending power |
| **Used** | Actually spent | Real consumption |
| **Usage %** | Consumption rate | Budget health indicator |

The matrix gives super admins a quick health check of every organization's credit situation at a glance!

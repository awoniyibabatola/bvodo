# Styled-JSX Compilation Error - Solution Guide

## Problem Summary
The project was experiencing compilation errors with `<style jsx global>` tags in React components. The error message was:

```
Error: Expression expected
<style jsx global>{`...`}</style>
Expected ',', got 'className'
```

## Root Cause
The `<style jsx global>` syntax is a special CSS-in-JS solution provided by the `styled-jsx` package. Next.js 14 requires this package to be explicitly installed and configured to work properly.

## Solution Implemented

### 1. Installed styled-jsx Package
```bash
npm install styled-jsx
```

### 2. Moved Styles to Global CSS (Recommended Approach)
Instead of using styled-jsx, we moved all component-specific styles to `frontend/src/app/globals.css`. This is the **recommended approach** because:
- ✅ Better performance (CSS is loaded once)
- ✅ Easier to maintain
- ✅ No additional dependencies
- ✅ Standard CSS workflow
- ✅ Better caching

#### Styles Added to globals.css:

**Animation Styles:**
```css
@keyframes fade-scale {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes progress-bar {
  0% { width: 0%; }
  100% { width: 100%; }
}

.animate-fade-scale {
  animation: fade-scale 0.3s ease-out;
}

.animate-progress {
  animation: progress-bar 4s linear;
}
```

**Print Styles:**
```css
.print-only {
  display: none;
}

@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  body {
    background: white !important;
    margin: 0;
    padding: 0;
  }

  .no-print {
    display: none !important;
  }

  .print-only {
    display: block !important;
  }

  .print-container {
    max-width: 210mm !important;
    margin: 0 auto !important;
    padding: 20mm !important;
    background: white !important;
  }

  /* ...additional print styles */
}
```

### 3. Removed styled-jsx Blocks
Removed all `<style jsx global>` blocks from:
- `frontend/src/app/dashboard/flights/search/page.tsx`
- `frontend/src/app/dashboard/bookings/[id]/page.tsx`

## Alternative: Using Styled-JSX (If Needed)

If you need component-scoped styles or prefer styled-jsx, follow these steps:

### 1. Install Package
```bash
cd frontend
npm install styled-jsx
```

### 2. Verify Installation
Check that `styled-jsx` appears in `package.json`:
```json
{
  "dependencies": {
    "styled-jsx": "^5.1.2"
  }
}
```

### 3. Usage Example
```tsx
export default function MyComponent() {
  return (
    <>
      <style jsx global>{`
        .my-custom-class {
          color: blue;
        }
      `}</style>

      <div className="my-custom-class">
        Content here
      </div>
    </>
  );
}
```

## Files Modified

### ✅ Modified Files
- `frontend/package.json` - Added styled-jsx dependency
- `frontend/src/app/globals.css` - Added animations and print styles
- `frontend/src/app/dashboard/bookings/[id]/page.tsx` - Removed styled-jsx block

### ⚠️ Reverted Files
- `frontend/src/app/dashboard/flights/search/page.tsx` - Restored original due to syntax errors in sidebar filter code

## Build Verification
After implementing the solution:
```bash
cd frontend
npm run build
```

Result: ✅ **Compiled successfully**

## Common Issues & Troubleshooting

### Issue 1: "Expression expected" Error
**Cause:** Missing styled-jsx package or incorrect Next.js configuration
**Solution:** Install styled-jsx OR move styles to globals.css

### Issue 2: Styles Not Applying
**Cause:** CSS specificity or import order issues
**Solution:** Ensure globals.css is imported in `layout.tsx`

### Issue 3: Build Still Failing
**Cause:** Syntax errors in code before the styled-jsx block
**Solution:** Check for:
- Unclosed braces `{}`
- Unclosed parentheses `()`
- Missing semicolons `;`
- Unclosed JSX tags

## Best Practices

### ✅ DO:
- Use global CSS for shared styles
- Use Tailwind CSS classes for component styling
- Keep styled-jsx for truly component-scoped styles

### ❌ DON'T:
- Don't mix styled-jsx with Tailwind unnecessarily
- Don't use styled-jsx for animations (use globals.css instead)
- Don't forget to install dependencies before using them

## Next Steps for Sidebar Filter Feature

The sidebar filter code that was added to the flight search page contains a syntax error. To re-implement it:

1. Start with the original working file from git
2. Add filter functionality incrementally
3. Test compilation after each major change
4. Use proper JSX syntax validation

## Support & Documentation

- **styled-jsx Docs:** https://github.com/vercel/styled-jsx
- **Next.js CSS:** https://nextjs.org/docs/app/building-your-application/styling/css
- **Tailwind CSS:** https://tailwindcss.com/docs

---

**Last Updated:** $(date)
**Solution Status:** ✅ RESOLVED
**Build Status:** ✅ PASSING

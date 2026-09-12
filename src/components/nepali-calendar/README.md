# 🗓️ Nepali Calendar

A **100% standalone** React component library for Bikram Sambat (BS) / Nepali date picking. No external date libraries. No heavy dependencies — only React.

---

## ✨ Features

- 📅 **Single date picker** (`NepaliDatePicker`)
- 📆 **Date range picker** (`NepaliDateRangePicker`) with 1 or 2 month view
- 🇳🇵 **Dual locale** — English (`en`) or Nepali/Devanagari (`ne`) text
- 🎨 **Fully themeable** via `primaryColor` prop — works with any CSS color
- 📐 **Popover positioning** — smart viewport-aware floating popover via React Portal
- 🔒 **Min/Max date & year** constraints
- ♿ **Keyboard accessible** — Escape closes, full tab support
- 📦 **Zero external date dependencies** — standalone BS dataset (2060–2100)
- 🛠️ **TypeScript first** — full types exported

---

## 📁 File Structure

```
nepali-calendar/
├── calendarData.ts           # BS month/day dataset + AD↔BS conversion engine
├── calendarUtils.ts          # Utility helpers (parse, format, compare, etc.)
├── types.ts                  # TypeScript interfaces & prop types
├── CalendarHeader.tsx        # Month/year nav dropdowns + arrow buttons
├── CalendarMonth.tsx         # Day grid renderer (handles ranges & hover preview)
├── NepaliDatePicker.tsx      # Single date picker component
├── NepaliDateRangePicker.tsx # Date range picker component
├── nepaliCalendar.css        # Self-contained styles (CSS custom properties)
└── index.ts                  # Public exports barrel
```

---

## 📦 Requirements

| Peer Dependency | Version  |
|-----------------|----------|
| `react`         | `>= 17`  |
| `react-dom`     | `>= 17`  |

No other runtime dependencies are required.

---

## 🚀 Usage

### Import

```tsx
import { NepaliDatePicker, NepaliDateRangePicker } from './nepali-calendar'
```

---

### Single Date Picker

```tsx
import { useState } from 'react'
import { NepaliDatePicker } from './nepali-calendar'

function MyForm() {
    const [date, setDate] = useState<string>('')

    return (
        <NepaliDatePicker
            value={date}
            onChange={setDate}
            placeholder="Select date"
        />
    )
}
```

### Uncontrolled (with default value)

```tsx
<NepaliDatePicker
    defaultValue="2081-05-15"
    onChange={(iso) => console.log(iso)} // "YYYY-MM-DD" (BS)
/>
```

---

### Date Range Picker

```tsx
import { useState } from 'react'
import { NepaliDateRangePicker, BsDateRange } from './nepali-calendar'

function MyFilter() {
    const [range, setRange] = useState<BsDateRange>({})

    return (
        <NepaliDateRangePicker
            value={range}
            onChange={setRange}
            numberOfMonths={2}
        />
    )
}
```

---

## 🎨 Theming

Pass any valid CSS color to `primaryColor`. The component automatically derives the hover tint using `color-mix()` with a hex fallback.

```tsx
{/* Green (default) */}
<NepaliDatePicker primaryColor="#16a34a" />

{/* Blue */}
<NepaliDatePicker primaryColor="#2563eb" />

{/* Purple */}
<NepaliDateRangePicker primaryColor="#7c3aed" />

{/* Saffron */}
<NepaliDatePicker primaryColor="#ea580c" />

{/* Named color */}
<NepaliDatePicker primaryColor="royalblue" />
```

You can also override CSS variables globally:

```css
:root {
    --nc-primary:       #7c3aed;
    --nc-primary-hover: #6d28d9;
    --nc-primary-light: rgba(124, 58, 237, 0.12);
    --nc-primary-text:  #ffffff;
    --nc-bg:            #ffffff;
    --nc-surface:       #f9fafb;
    --nc-border:        #e5e7eb;
    --nc-text:          #1f2937;
    --nc-text-muted:    #6b7280;
    --nc-weekend:       #ef4444;
    --nc-radius:        10px;
}
```

---

## 🌐 Locale

| `locale`       | Day numbers | Month names           | Weekdays      |
|----------------|-------------|------------------------|---------------|
| `"en"` (default) | 1, 2, 3 …  | Baisakh, Jestha …     | Sun, Mon …   |
| `"ne"`         | १, २, ३ …  | बैशाख, जेठ …          | आइत, सोम …   |

```tsx
<NepaliDatePicker locale="ne" />
<NepaliDateRangePicker locale="ne" />
```

---

## 📋 Props Reference

### `NepaliDatePicker`

| Prop              | Type                            | Default            | Description                                  |
|-------------------|---------------------------------|--------------------|----------------------------------------------|
| `value`           | `string`                        | —                  | Controlled BS date `"YYYY-MM-DD"`            |
| `defaultValue`    | `string`                        | —                  | Initial uncontrolled value                   |
| `onChange`        | `(val: string) => void`         | —                  | Called on date select                        |
| `primaryColor`    | `string`                        | `#16a34a`          | Accent color (any CSS color)                 |
| `locale`          | `'en' \| 'ne'`                  | `'en'`             | Display language                             |
| `minYear`         | `number`                        | `2060`             | Minimum selectable BS year                   |
| `maxYear`         | `number`                        | `2100`             | Maximum selectable BS year                   |
| `minDate`         | `string`                        | —                  | Minimum selectable date `"YYYY-MM-DD"`       |
| `maxDate`         | `string`                        | —                  | Maximum selectable date `"YYYY-MM-DD"`       |
| `disabled`        | `boolean`                       | `false`            | Disables interaction                         |
| `allowClear`      | `boolean`                       | `true`             | Shows clear (✕) button                       |
| `size`            | `'small' \| 'middle' \| 'large'`| `'middle'`         | Trigger input size                           |
| `placeholder`     | `string`                        | `'Select BS date'` | Placeholder text                             |
| `showAdEquivalent`| `boolean`                       | `false`            | Show AD day number as small badge            |
| `zIndex`          | `number`                        | `1200`             | z-index for popover portal                   |
| `className`       | `string`                        | —                  | Extra CSS class on container                 |
| `style`           | `React.CSSProperties`           | —                  | Inline style on container                    |
| `popoverStyle`    | `React.CSSProperties`           | —                  | Inline style on floating popover             |

---

### `NepaliDateRangePicker`

All props from `NepaliDatePicker` plus:

| Prop             | Type                              | Default                    | Description                          |
|------------------|-----------------------------------|----------------------------|--------------------------------------|
| `value`          | `BsDateRange`                     | —                          | Controlled `{ from?, to? }`          |
| `defaultValue`   | `BsDateRange`                     | —                          | Initial uncontrolled range           |
| `onChange`       | `(range: BsDateRange) => void`    | —                          | Called when range is completed       |
| `numberOfMonths` | `1 \| 2`                          | `2`                        | Months to show side-by-side          |
| `placeholder`    | `string \| [string, string]`      | `'Select BS date range'`   | Single or `[startLabel, endLabel]`   |

---

### `BsDateRange`

```ts
interface BsDateRange {
    from?: string  // "YYYY-MM-DD" (BS)
    to?:   string  // "YYYY-MM-DD" (BS)
}
```

---

## 🛠️ Utility API

All utilities are exported from `index.ts`:

```ts
import {
    // Conversion
    bsToAdParts,               // BS parts → AD { year, month, day }
    adToBs,                    // Date | string | parts → BS parts
    todayBs,                   // → current BS date parts

    // Month/year helpers
    daysInBsMonth,             // (year, month) → days in month
    getDaysInBsYear,           // (year) → total days in BS year
    getBsWeekday,              // (bs) → 0=Sun … 6=Sat

    // String helpers
    parseBsDate,               // "YYYY-MM-DD" → { year, month, day } | null
    formatBsDate,              // { year, month, day } → "YYYY-MM-DD"
    formatBsDisplay,           // "YYYY-MM-DD" → "15 Shrawan 2081" or "१५ श्रावण २०८१"
    compareBsDates,            // (a, b) → negative | 0 | positive

    // Numerals
    toNepaliNumerals,          // (string | number) → Devanagari string

    // Constants
    BS_MIN_YEAR,               // 2060
    BS_MAX_YEAR,               // 2100
    BS_MONTH_NAMES_EN,
    BS_MONTH_NAMES_NE,
    BS_WEEKDAY_NAMES_EN_SHORT,
    BS_WEEKDAY_NAMES_NE_SHORT,
    BS_MONTH_DAYS,             // Full Panchanga dataset record
} from './nepali-calendar'
```

### Conversion Examples

```ts
import { bsToAdParts, adToBs, toNepaliNumerals } from './nepali-calendar'

// BS → AD
bsToAdParts({ year: 2081, month: 4, day: 1 })
// → { year: 2024, month: 7, day: 16 }

// AD → BS (Date object)
adToBs(new Date('2024-07-16'))
// → { year: 2081, month: 4, day: 1 }

// AD → BS (ISO string)
adToBs('2024-04-14')
// → { year: 2081, month: 1, day: 1 }

// Devanagari numerals
toNepaliNumerals(2081)  // "२०८१"
toNepaliNumerals(15)    // "१५"
```

---

## 📅 Supported Date Range

| Property             | Value                           |
|----------------------|---------------------------------|
| Minimum BS year      | **2060** (≈ AD 2003)            |
| Maximum BS year      | **2100** (≈ AD 2043)            |
| Epoch calibration    | BS 2060-01-01 = AD 2003-04-14   |
| Data source          | Verified Panchanga tables       |

> **Extending the range:** Add rows to `BS_MONTH_DAYS` in `calendarData.ts` and update `BS_MIN_YEAR` / `BS_MAX_YEAR` constants accordingly.

---

## 📐 Date Format

All date strings use **ISO-style BS format**:

```
YYYY-MM-DD
```

Examples: `"2081-01-01"`, `"2080-12-30"`, `"2075-06-15"`

---

## 💡 Advanced Examples

### Constrain selectable dates

```tsx
<NepaliDatePicker
    minDate="2081-01-01"
    maxDate="2081-12-30"
/>
```

### Fiscal year range picker (Nepali locale)

```tsx
<NepaliDateRangePicker
    primaryColor="#0ea5e9"
    locale="ne"
    placeholder={['सुरु मिति', 'अन्तिम मिति']}
    numberOfMonths={2}
    onChange={(r) => console.log(r.from, r.to)}
/>
```

### Above AntD drawer / Modal

```tsx
<NepaliDatePicker zIndex={1400} />
```

### Show AD day number badge

```tsx
<NepaliDatePicker showAdEquivalent={true} />
```

### Single-month range picker

```tsx
<NepaliDateRangePicker numberOfMonths={1} />
```

---

## 🌑 Dark Mode

Override CSS variables inside a dark scope:

```css
.dark .nc-container {
    --nc-bg:           #1f2937;
    --nc-surface:      #111827;
    --nc-surface-hover:#374151;
    --nc-border:       #374151;
    --nc-border-hover: #4b5563;
    --nc-text:         #f9fafb;
    --nc-text-muted:   #9ca3af;
}
```

---

## 🤝 Extending

| Goal | Where to edit |
|---|---|
| More BS years | `BS_MONTH_DAYS` in `calendarData.ts` + update `BS_MAX_YEAR` |
| Holiday highlights | Add `holidays?: string[]` prop to `CalendarMonth.tsx` |
| Dark mode | Override CSS variables in a `.dark` scope |
| npm package | Build with Vite lib mode — no code changes needed |

---

## 📄 License

MIT — free to use in personal and commercial projects.

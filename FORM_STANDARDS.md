# Form Width Standards

This document defines the standard width classes for form elements in the Cvety.kz application to ensure consistency and professional appearance across all pages.

## Core Principles

1. **Mobile-first approach**: Full width on mobile, constrained on desktop
2. **Content-appropriate sizing**: Field widths should match expected content
3. **Consistency**: Same type of content uses same width across the app
4. **Shadcn/Tailwind conventions**: Use Tailwind utility classes

## Standard Width Classes by Content Type

### Text Inputs

| Content Type | Width Class | Pixel Width | Use Cases |
|-------------|-------------|-------------|-----------|
| Phone numbers | `max-w-[200px]` | 200px | Phone inputs, WhatsApp |
| Short IDs/Codes | `max-w-[150px]` | 150px | Order IDs, tracking codes |
| Email addresses | `max-w-sm` | 384px (24rem) | Email fields |
| Names (person) | `max-w-sm` | 384px (24rem) | Customer/recipient names |
| Names (company) | `max-w-md` | 448px (28rem) | Supplier, company names |
| Short text | `max-w-md` | 448px (28rem) | Titles, short descriptions |
| Search inputs | `max-w-md` | 448px (28rem) | Search bars |
| URLs/Links | `max-w-lg` | 512px (32rem) | Website addresses |

### Date & Time

| Content Type | Width Class | Pixel Width | Use Cases |
|-------------|-------------|-------------|-----------|
| Date picker | `max-w-xs` | 320px (20rem) | Date selection buttons |
| Time select | `max-w-[120px]` | 120px | Hour/minute dropdowns |
| Date range | `max-w-sm` | 384px (24rem) | From-to date inputs |

### Numbers & Currency

| Content Type | Width Class | Pixel Width | Use Cases |
|-------------|-------------|-------------|-----------|
| Currency | `max-w-[150px]` | 150px | Prices, costs |
| Quantity | `max-w-[100px]` | 100px | Item quantities |
| Percentage | `max-w-[100px]` | 100px | Discounts, margins |
| Large numbers | `max-w-[200px]` | 200px | Total amounts |

### Textareas

| Content Type | Width Class | Pixel Width | Use Cases |
|-------------|-------------|-------------|-----------|
| Address | `max-w-xl` | 576px (36rem) | Delivery addresses |
| Comments | `max-w-xl` | 576px (36rem) | Order comments |
| Description | `max-w-2xl` | 672px (42rem) | Product descriptions |
| Import data | `max-w-2xl` | 672px (42rem) | Bulk data input |

### Select Dropdowns

| Content Type | Width Class | Pixel Width | Use Cases |
|-------------|-------------|-------------|-----------|
| Status/Category | `max-w-[200px]` | 200px | Order status, categories |
| Currency | `max-w-[150px]` | 150px | KZT, USD, EUR |
| Country/City | `max-w-xs` | 320px (20rem) | Location selection |
| Product select | `max-w-sm` | 384px (24rem) | Product dropdowns |

### Buttons

| Content Type | Width Class | Use Cases |
|-------------|-------------|-----------|
| Action buttons | `w-full md:max-w-sm` | Submit, Save, Create |
| Icon buttons | No constraint | Edit, Delete icons |
| Preview/Show | `max-w-sm` | Preview buttons |

### Form Containers

| Container Type | Width Class | Use Cases |
|---------------|-------------|-----------|
| Full form | `max-w-4xl` | Complete forms |
| Form section | `max-w-2xl` | Grouped fields |
| Inline editor | `max-w-xl` | Quick edit forms |
| Dialog forms | `max-w-lg` | Modal forms |

## Implementation Examples

### Basic Input
```tsx
// Phone number input
<Input
  type="tel"
  placeholder="+7 (___) ___-__-__"
  className="max-w-[200px]"
/>

// Email input with responsive width
<Input
  type="email"
  placeholder="email@example.com"
  className="w-full md:max-w-sm"
/>
```

### Form Layout
```tsx
// Full form container
<form className="max-w-4xl space-y-6">
  {/* Form sections */}
  <div className="space-y-4">
    <div>
      <Label>Имя клиента</Label>
      <Input className="max-w-sm" />
    </div>
    <div>
      <Label>Телефон</Label>
      <Input className="max-w-[200px]" />
    </div>
  </div>
</form>
```

### Grid Layout
```tsx
// Two-column grid with proper widths
<div className="grid gap-4 md:grid-cols-2 md:max-w-2xl">
  <div>
    <Label>Цена</Label>
    <Input type="number" className="max-w-[150px]" />
  </div>
  <div>
    <Label>Количество</Label>
    <Input type="number" className="max-w-[100px]" />
  </div>
</div>
```

### Responsive Pattern
```tsx
// Mobile-first responsive approach
<Button className="w-full md:max-w-sm">
  Сохранить изменения
</Button>
```

## Best Practices

### DO:
- ✅ Use content-appropriate widths
- ✅ Apply responsive classes for mobile
- ✅ Group related fields together
- ✅ Use consistent spacing (space-y-4 or space-y-6)
- ✅ Limit form container width on large screens

### DON'T:
- ❌ Let inputs stretch to full screen width on desktop
- ❌ Use fixed pixel widths for responsive layouts
- ❌ Mix different width systems (%, px, rem)
- ❌ Forget mobile responsive classes
- ❌ Use w-full without desktop constraints

## Migration Checklist

When updating existing forms:

1. [ ] Identify all Input, Textarea, Select components
2. [ ] Add appropriate max-w-* classes based on content type
3. [ ] Add responsive classes where needed (w-full md:max-w-*)
4. [ ] Wrap forms in max-w-4xl container
5. [ ] Test on mobile and desktop viewports
6. [ ] Ensure consistent spacing between fields

## Quick Reference

```tsx
// Most common patterns
<Input className="max-w-[200px]" />              // Phone
<Input className="max-w-sm" />                   // Name, Email
<Input className="max-w-md" />                   // Search
<Input className="max-w-[150px]" />              // Price
<Input className="max-w-[100px]" />              // Quantity
<Textarea className="max-w-xl" />                // Address
<Select className="max-w-[200px]" />             // Status
<Button className="w-full md:max-w-sm" />        // Submit
```
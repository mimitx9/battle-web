# User Profile Cache Flow Diagram

```
┌─────────────────┐
│   User Navigate │
│   to New Page   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  AuthProvider   │
│   Initializes   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Check Token in  │
│   localStorage  │
└─────────┬───────┘
          │
          ▼
    ┌─────────┐
    │Has Token?│
    └────┬────┘
         │
    ┌────▼────┐
    │   YES   │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Check User Cache│
│ in localStorage │
└─────────┬───────┘
          │
          ▼
    ┌─────────┐
    │Cache    │
    │Valid?   │
    └────┬────┘
         │
    ┌────▼────┐
    │   YES   │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Use Cached Data │
│  (No API Call)  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Set User State  │
│   & Render      │
└─────────────────┘

    ┌─────────┐
    │   NO    │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Call getProfile │
│      API        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Save to Cache   │
│ & Set User State│
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│     Render      │
└─────────────────┘

    ┌─────────┐
    │   NO    │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Clear Cache &   │
│ Set User = null │
└─────────────────┘
```

## Cache Lifecycle

```
┌─────────────────┐
│   Login/Register│
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Call getProfile │
│      API        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Save to Cache   │
│ (5 min TTL)     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Subsequent      │
│ Page Loads      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Use Cache       │
│ (No API Call)   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ After 5 minutes │
│ Cache Expires   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Call API Again  │
│ & Refresh Cache │
└─────────────────┘
```

## Cache States

```
┌─────────────────┐
│   No Cache      │
│   (First Load)  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   Valid Cache   │
│   (Use Cache)   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Expired Cache   │
│ (Call API)      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   Clear Cache   │
│   (On Logout)    │
└─────────────────┘
```

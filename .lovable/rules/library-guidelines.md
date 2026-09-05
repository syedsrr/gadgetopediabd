# Gadgetopedia n' Lifestyle — Guidelines

## Components

The design system exports these components — import them from `@ws-afnhgbth2iuysaagxxp3/1fedc441-4bd8-4f82-b81d-60b8535241da` and compose them before building anything from scratch:

`AuthModal`, `Badge`, `Button`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle`, `Card`, `CartDrawer`, `CartProvider`, `Constants`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger`, `Dialog`, `Footer`, `Header`, `Input`, `Label`, `Logo`, `ProductCard`, `ProductForm`, `ProductGridSkeleton`, `ProductSpecsDrawer`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectScrollDownButton`, `SelectScrollUpButton`, `SelectSeparator`, `SelectTrigger`, `SelectValue`, `Select`, `Separator`, `SheetClose`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetOverlay`, `SheetPortal`, `SheetTitle`, `SheetTrigger`, `Sheet`, `SiteLayout`, `Skeleton`, `Switch`, `TabsContent`, `TabsList`, `TabsTrigger`, `Tabs`, `Textarea`

Per-component details (import stanzas, props, variants, examples) live in `.lovable/rules/libraries/{slug}/components.md` — on disk, not auto-loaded. Read that file or the component source when the name alone isn't enough.

## Theme Files

The design system's theme is delivered through the following files. The author's original source files carry the full wiring the design system needs — variable declarations, framework-specific directives, provider objects, etc. — and are the canonical import target.

- `@ws-afnhgbth2iuysaagxxp3/1fedc441-4bd8-4f82-b81d-60b8535241da/styles.css` (source — preferred import)
- `@ws-afnhgbth2iuysaagxxp3/1fedc441-4bd8-4f82-b81d-60b8535241da/dist/tokens.css` (auto-generated flat list of CSS custom properties — a raw-values fallback only; does NOT carry framework-specific wiring that the source files above provide)


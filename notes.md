# CSS

## Grid Layout

auto takes as much space as its content needs
1fr is one fraction of the remaining space.
if used alone it means the entire space. if there was 2fr and 1fr, the first would take 2/3 of the space while the second 1/3.

there is something called implicit grid flow in css where css places items in the grid cells in the exact order they appear in your html document. thats why the first child element (sidebar) goes to the first column, the secon child element (content) goes into the second.

1em is a relative unit that scales with text size. If you set font-size: 16px, then 1em = 16px.

position: fixed;
This would isolate the sidebar from the body, and break the grid layout.
That's why we use position: sticky; instead.

## Spacing

1. Padding
Space inside an element, between it's border and content

2. Margin
Space Outside an element, between it's border and neighbouring elements

3. Border
The line between padding and margin

## Sizing
.85em = 85% of the current font size
(Example: If font size is 16px, .85em = 13.6px)

85em = 85 times the current font size
(Example: If font size is 16px, 85em = 1,360px!)
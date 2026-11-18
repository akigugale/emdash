---
"@emdash-cms/admin": minor
"@emdash-cms/blocks": minor
"emdash": minor
---

Adds `condition` to plugin Portable Text block fields, so the block edit dialog shows a field only while another field matches. A top-level field checks another top-level field, and a `repeater` sub-field checks another sub-field of the same row. The condition uses the same `{ field, eq }` or `{ field, neq }` shape as Block Kit form fields:

```ts
fields: [
	{ type: "toggle", action_id: "has_link", label: "Add link" },
	{
		type: "text_input",
		action_id: "link_url",
		label: "Link URL",
		condition: { field: "has_link", eq: true },
	},
];
```

Hidden fields keep their saved values and skip validation, so block renderers should check the controlling field. `@emdash-cms/blocks` also exports `evaluateCondition` and the `PortableTextBlockField` type.

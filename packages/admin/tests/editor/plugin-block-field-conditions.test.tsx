import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import "../../dist/styles.css";

import {
	PortableTextEditor,
	type PortableTextEditorProps,
} from "../../src/components/PortableTextEditor";
import { render } from "../utils/render";

vi.mock("../../src/components/MediaPickerModal", () => ({
	MediaPickerModal: () => null,
}));

vi.mock("../../src/components/SectionPickerModal", () => ({
	SectionPickerModal: () => null,
}));

vi.mock("../../src/components/editor/DragHandleWrapper", () => ({
	DragHandleWrapper: () => null,
}));

const pluginBlocks: NonNullable<PortableTextEditorProps["pluginBlocks"]> = [
	{
		type: "test.cta",
		pluginId: "test-blocks",
		label: "Call to action",
		fields: [
			{ type: "text_input", action_id: "heading", label: "Heading" },
			{ type: "toggle", action_id: "has_button", label: "Show button" },
			{
				type: "text_input",
				action_id: "button_label",
				label: "Button label",
				condition: { field: "has_button", eq: true },
			},
			{
				type: "number_input",
				action_id: "columns",
				label: "Columns",
				min: 1,
				max: 4,
				condition: { field: "has_button", neq: true },
			},
		],
	},
	{
		type: "test.cards",
		pluginId: "test-blocks",
		label: "Cards",
		fields: [
			{
				type: "repeater",
				action_id: "cards",
				label: "Cards",
				item_label: "card",
				fields: [
					{ type: "text_input", action_id: "title", label: "Title" },
					{ type: "toggle", action_id: "is_download", label: "Download" },
					{
						type: "text_input",
						action_id: "link_url",
						label: "Link URL",
						condition: { field: "is_download", neq: true },
					},
					{
						type: "text_input",
						action_id: "file_name",
						label: "File name",
						condition: { field: "is_download", eq: true },
					},
				],
			},
		],
	},
];

async function openBlock(value: Record<string, unknown>, type = "test.cta") {
	const onChange = vi.fn<NonNullable<PortableTextEditorProps["onChange"]>>();
	const screen = await render(
		<PortableTextEditor
			value={[{ _type: type, _key: "block-1", ...value }]}
			onChange={onChange}
			pluginBlocks={pluginBlocks}
		/>,
	);
	await screen.getByRole("button", { name: "Edit" }).click();
	await expect.element(screen.getByRole("dialog")).toBeVisible();
	return { screen, onChange };
}

describe("plugin block field conditions", () => {
	it("shows each conditional field only while its condition matches", async () => {
		const { screen } = await openBlock({ heading: "Start now", has_button: false });
		const buttonLabel = screen.getByRole("textbox", { name: "Button label", exact: true });
		const columns = screen.getByRole("spinbutton", { name: "Columns", exact: true });

		await expect.element(buttonLabel).not.toBeInTheDocument();
		await expect.element(columns).toBeVisible();

		await screen.getByRole("switch", { name: "Show button", exact: true }).click();

		await expect.element(buttonLabel).toBeVisible();
		await expect.element(columns).not.toBeInTheDocument();
	});

	it("saves without validating hidden fields and keeps their values", async () => {
		const { screen, onChange } = await openBlock({
			heading: "Start now",
			has_button: true,
			button_label: "Sign up",
			columns: 9,
		});

		const showButton = screen.getByRole("switch", { name: "Show button", exact: true });
		await showButton.click();
		await showButton.click();
		await screen.getByRole("textbox", { name: "Heading", exact: true }).fill("Get started");
		await screen.getByRole("button", { name: "Save", exact: true }).click();

		await vi.waitFor(() => {
			expect(onChange.mock.lastCall?.[0]).toEqual([
				expect.objectContaining({
					_type: "test.cta",
					heading: "Get started",
					has_button: true,
					button_label: "Sign up",
					columns: 9,
				}),
			]);
		});
	});

	it("applies each repeater row's conditions to that row's values", async () => {
		const { screen, onChange } = await openBlock(
			{
				cards: [
					{ _key: "card-1", title: "Partners", is_download: false, link_url: "/partners/" },
					{
						_key: "card-2",
						title: "Logos",
						is_download: true,
						link_url: "/old-logos/",
						file_name: "Logos.zip",
					},
				],
			},
			"test.cards",
		);
		await screen.getByRole("button", { name: "Partners", exact: true }).click();
		await screen.getByRole("button", { name: "Logos", exact: true }).click();
		const linkUrls = screen.getByRole("textbox", { name: "Link URL", exact: true });
		const fileNames = screen.getByRole("textbox", { name: "File name", exact: true });

		await expect.element(linkUrls).toHaveValue("/partners/");
		await expect.element(fileNames).toHaveValue("Logos.zip");

		await screen.getByRole("switch", { name: "Download", exact: true }).nth(1).click();

		await expect.element(fileNames).not.toBeInTheDocument();
		await expect.element(linkUrls.nth(1)).toHaveValue("/old-logos/");

		await screen.getByRole("button", { name: "Save", exact: true }).click();
		await vi.waitFor(() => {
			expect(onChange.mock.lastCall?.[0]).toEqual([
				expect.objectContaining({
					cards: [
						expect.objectContaining({ title: "Partners", link_url: "/partners/" }),
						expect.objectContaining({
							title: "Logos",
							is_download: false,
							link_url: "/old-logos/",
							file_name: "Logos.zip",
						}),
					],
				}),
			]);
		});
	});
});

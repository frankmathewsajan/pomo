import React, { RefObject } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";

export default function RichTextToolbar({
    textareaRef,
    value,
    onChange
}: {
    textareaRef: RefObject<HTMLTextAreaElement | null>;
    value: string;
    onChange: (val: string) => void;
}) {
    const insertTag = (startTag: string, endTag: string, placeholder = "") => {
        if (!textareaRef.current) return;
        const ta = textareaRef.current;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = value.substring(start, end) || placeholder;

        const before = value.substring(0, start);
        const after = value.substring(end);

        const newValue = `${before}${startTag}${selected}${endTag}${after}`;
        onChange(newValue);

        setTimeout(() => {
            ta.focus();
            ta.setSelectionRange(start + startTag.length, start + startTag.length + selected.length);
        }, 0);
    };

    const insertImage = async () => {
        try {
            // Check if dialog plugin works in this env
            if (!(window as any).__TAURI__) return;
            const selected = await open({
                multiple: false,
                filters: [{ name: 'Images', extensions: ['png', 'jpeg', 'jpg', 'gif', 'webp'] }]
            });
            if (typeof selected === 'string') {
                const assetUrl = convertFileSrc(selected);
                insertTag(`<img src="${assetUrl}" alt="`, `" />`, "Local Image");
            }
        } catch (e) {
            console.error("Failed to select image", e);
        }
    };

    const tBtn = "wb w-6 h-6 flex items-center justify-center rounded bg-black/5 hover:bg-black/10 transition-colors font-bold text-[10px] shrink-0";

    return (
        <div className="flex flex-wrap gap-1 p-1.5 bg-black/5 border border-black/5 rounded-t-md w-full justify-start shadow-inner overflow-x-auto">
            <button className={tBtn} title="Bold" onClick={() => insertTag("<b>", "</b>", "bold text")}>B</button>
            <button className={tBtn} title="Italic" style={{ fontStyle: "italic" }} onClick={() => insertTag("<i>", "</i>", "italic text")}>I</button>
            <button className={tBtn} title="Underline" style={{ textDecoration: "underline" }} onClick={() => insertTag("<u>", "</u>", "underlined text")}>U</button>
            <button className={tBtn} title="Heading 1" onClick={() => insertTag("<h1>", "</h1>", "Heading 1")}>H1</button>
            <button className={tBtn} title="Heading 2" onClick={() => insertTag("<h2>", "</h2>", "Heading 2")}>H2</button>
            <button className={tBtn} title="Heading 3" onClick={() => insertTag("<h3>", "</h3>", "Heading 3")}>H3</button>
            <div className="w-[1px] h-4 bg-black/20 mx-1 self-center shrink-0" />
            <button className={tBtn} title="Link" onClick={() => insertTag("<a href=\"#\">", "</a>", "link text")}>🔗</button>
            <button className={tBtn} title="Link Button" onClick={() => insertTag("<a href=\"#\" className=\"note-btn\">", "</a>", "Button")}>Btn</button>
            <button className={tBtn} title="Unordered List" onClick={() => insertTag("<ul>\n  <li>", "</li>\n  <li>Item 2</li>\n</ul>", "Item 1")}>UL</button>
            <button className={tBtn} title="Ordered List" onClick={() => insertTag("<ol>\n  <li>", "</li>\n  <li>Item 2</li>\n</ol>", "Item 1")}>OL</button>
            <button className={tBtn} title="Table" onClick={() => insertTag("<table>\n  <tr><th>", "</th><th>Header 2</th></tr>\n  <tr><td>Data 1</td><td>Data 2</td></tr>\n</table>", "Header 1")}>TB</button>
            <button className={tBtn} title="Image" onClick={insertImage}>🖼️</button>
        </div>
    );
}

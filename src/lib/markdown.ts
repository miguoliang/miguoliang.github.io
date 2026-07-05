import { createMarkdownProcessor } from '@astrojs/markdown-remark';

let processor: Awaited<ReturnType<typeof createMarkdownProcessor>> | null = null;

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/** Turn ```mermaid fences into <pre class="mermaid"> for astro-mermaid client rendering. */
export function preprocessMermaid(markdown: string): string {
	return markdown.replace(/```mermaid\r?\n([\s\S]*?)```/g, (_, diagram) => {
		return `\n<pre class="mermaid">${escapeHtml(diagram.trim())}</pre>\n`;
	});
}

export async function renderMarkdown(content: string) {
	processor ??= await createMarkdownProcessor({});
	return processor.render(preprocessMermaid(content));
}

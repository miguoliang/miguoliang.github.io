import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const automationPath = join(root, 'config/automation.json');

function loadConfig() {
	try {
		return JSON.parse(readFileSync(automationPath, 'utf8'));
	} catch {
		return {};
	}
}

const automation = loadConfig();
const provider = process.env.CLIP_LLM_PROVIDER ?? automation.llm?.provider ?? 'anthropic';
const model =
	process.env.CLIP_LLM_MODEL ??
	automation.llm?.model ??
	(provider === 'openai' ? 'gpt-4o' : 'claude-sonnet-4-20250514');
const maxTokens = automation.llm?.maxTokens ?? 8192;

export async function generateClipMarkdown({ system, user }) {
	if (provider === 'openai') {
		return callOpenAI({ system, user });
	}
	return callAnthropic({ system, user });
}

async function callAnthropic({ system, user }) {
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		throw new Error('Missing ANTHROPIC_API_KEY (GitHub Actions secret or local env)');
	}

	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			model,
			max_tokens: maxTokens,
			system,
			messages: [{ role: 'user', content: user }],
		}),
	});

	if (!response.ok) {
		const err = await response.text();
		throw new Error(`Anthropic API ${response.status}: ${err.slice(0, 400)}`);
	}

	const data = await response.json();
	const text = data.content?.find((b) => b.type === 'text')?.text;
	if (!text) throw new Error('Anthropic returned empty content');
	return text.trim();
}

async function callOpenAI({ system, user }) {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error('Missing OPENAI_API_KEY (GitHub Actions secret or local env)');
	}

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			model,
			max_tokens: maxTokens,
			messages: [
				{ role: 'system', content: system },
				{ role: 'user', content: user },
			],
		}),
	});

	if (!response.ok) {
		const err = await response.text();
		throw new Error(`OpenAI API ${response.status}: ${err.slice(0, 400)}`);
	}

	const data = await response.json();
	const text = data.choices?.[0]?.message?.content;
	if (!text) throw new Error('OpenAI returned empty content');
	return text.trim();
}

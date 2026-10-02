import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	TOPIC_APPLICATION,
	TOPIC_INFRA,
	TOPIC_UNKNOWN,
	classifyClipTopic,
	topicHaystack,
} from './clip-topic.mjs';

test('Oct 1 Auto Router is specialist infra, not an application story', () => {
	assert.equal(
		classifyClipTopic(
			topicHaystack({
				title: "Cut your AI spend with AI Gateway's Auto Router",
				url: 'https://blog.cloudflare.com/auto-router',
			}),
		),
		TOPIC_INFRA,
	);
});

test('Oct 2 Matthew Green quote is sandbox/security theory', () => {
	assert.equal(
		classifyClipTopic('Quoting Matthew Green\nhttps://simonwillison.net/2026/Oct/1/matthew-green'),
		TOPIC_INFRA,
	);
	assert.equal(
		classifyClipTopic(
			'A short link post\nAgents in a sandbox still spread worms via a shared package cache',
		),
		TOPIC_INFRA,
	);
});

test('routing internals, training, state machines, and sandboxes are infra', () => {
	assert.equal(classifyClipTopic('How Cursor Router works'), TOPIC_INFRA);
	assert.equal(classifyClipTopic('Mixture-of-Kittens: MoE training megakernel'), TOPIC_INFRA);
	assert.equal(classifyClipTopic('smolmachines untrusted sandbox for Python'), TOPIC_INFRA);
	assert.equal(classifyClipTopic('How We Contain Claude'), TOPIC_INFRA);
	assert.equal(classifyClipTopic('Replace your agent loop with a state machine'), TOPIC_INFRA);
	assert.equal(classifyClipTopic('RLHF and pre-training ablations'), TOPIC_INFRA);
	assert.equal(classifyClipTopic('AutoSynthData: Generating Training Data for Enterprise Agents'), TOPIC_INFRA);
});

test('who-uses-AI-at-work stories are application', () => {
	assert.equal(
		classifyClipTopic(
			'GitHub Copilot app for beginners: how to build custom workflows with canvases',
		),
		TOPIC_APPLICATION,
	);
	assert.equal(classifyClipTopic('Understanding ChatGPT Work'), TOPIC_APPLICATION);
	assert.equal(classifyClipTopic('Reviewing and Testing Code with AI'), TOPIC_APPLICATION);
	assert.equal(
		classifyClipTopic('How we used AI to close support tickets faster'),
		TOPIC_APPLICATION,
	);
	assert.equal(
		classifyClipTopic(
			'How Albertsons Companies is reimagining retail from the inside out\nAlbertsons Cos. is using ChatGPT Enterprise and the OpenAI API to help teams work faster',
		),
		TOPIC_APPLICATION,
	);
	assert.equal(
		classifyClipTopic(
			'Inside-Out AI: Rebuilding Airbnb Behind the Scenes and Across the Guest Experience',
		),
		TOPIC_APPLICATION,
	);
});

test('framework how-tos are not application stories just because they say how to use', () => {
	assert.equal(
		classifyClipTopic(
			"What’s new in Microsoft Agent Framework\nHere’s how to use them—from connecting an agent to your application",
		),
		TOPIC_UNKNOWN,
	);
	assert.equal(
		classifyClipTopic('What Is Jev? Learn how to use Jev with LangChain'),
		TOPIC_UNKNOWN,
	);
});

test('infra wins when a cost-saving title is still a router post', () => {
	assert.equal(
		classifyClipTopic("Cut your AI spend with Auto Router — save hours on model picking"),
		TOPIC_INFRA,
	);
});

test('unrelated titles stay unknown rather than false-infra', () => {
	assert.equal(classifyClipTopic('Introducing Muse: a personal AI agent'), TOPIC_UNKNOWN);
	assert.equal(classifyClipTopic('He Built This City'), TOPIC_UNKNOWN);
});

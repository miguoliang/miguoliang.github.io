/**
 * Daily clip topic policy (from 2026-10-03):
 * Prefer application stories; reject specialist infrastructure as the main clipping.
 */

export const TOPIC_APPLICATION = 'application';
export const TOPIC_INFRA = 'infra';
export const TOPIC_UNKNOWN = 'unknown';

/**
 * Model routing, sandbox/security theory, state machines, training methods,
 * and other specialist infrastructure — never the daily main clipping.
 */
const INFRA_PATTERNS = [
	/\bauto[- ]routers?\b/i,
	/\bmodel[- ]rout(?:er|ing)\b/i,
	/\bhow[- ].{0,40}router[- ]works\b/i,
	/\/(?:auto-router|how-cursor-router-works)(?:\/|$)/i,
	/\brouted[- ]model\b/i,
	/\bsandbox(?:ing|es|ed)?\b/i,
	/\buntrusted[- ](?:code|sandbox|python|javascript)\b/i,
	/\bsmol(?:vm|machines)\b/i,
	/\bhow we contain\b/i,
	/\/how-we-contain-claude(?:\/|$)/i,
	/\bcontain(?:ing)? claude\b/i,
	/\brogue agents?\b/i,
	/\bagent worms?\b/i,
	/\bquoting matthew green\b/i,
	/\bhypervisor\b/i,
	/\bfirecracker\b/i,
	/\bjailbreak/i,
	/\bstate[- ]machines?\b/i,
	/\bfinite[- ]state\b/i,
	/\bmegakernel\b/i,
	/\bmixture[- ]of[- ]kittens\b/i,
	/\bmixture[- ]of[- ]experts\b/i,
	/\bmoe (?:layer|training|kernel|megakernel)\b/i,
	/\bpre-?training\b/i,
	/\bfine-?tun(?:e|ing|es|ed)\b/i,
	/\brlhf\b/i,
	/\breinforcement learning\b/i,
	/\bhow we train(?:ed|ing)?\b/i,
	/\btraining (?:method|methods|run|cluster|infra(?:structure)?|megakernel|data)\b/i,
	/\bmodel (?:weights|checkpoint)s?\b/i,
	/\bgpu kernels?\b/i,
	/模型路由|沙箱|状态机|预训练|微调|训练方法/,
];

/** Who uses AI on a real job, and how that raises efficiency / quality or cuts cost. */
const APPLICATION_PATTERNS = [
	/\bhow (?:we|i|our team|they) (?:use|used|built|ship|shipped|saved|cut|close|closed)\b/i,
	/\bhow .{2,80}? (?:is|are) (?:using|reimagining|automating|building|shipping)\b/i,
	/\bcase stud(?:y|ies)\b/i,
	/\bcustomer stor(?:y|ies)\b/i,
	/\busing (?:ai|chatgpt|claude|copilot|cursor)\b.{0,80}?\bto\b/i,
	/\bproductivit(?:y|ies)\b/i,
	/\bsave(?:s|d)? (?:time|money|cost|hours)\b/i,
	/\breal[- ]world\b/i,
	/\bwork problem\b/i,
	/\bfor beginners\b/i,
	/\bhow to (?:build|write|review|ship|debug|close)\b/i,
	/\bplaybook\b/i,
	/\bcoding with\b/i,
	/\breviewing and testing\b/i,
	/\bgithub copilot\b/i,
	/\bchatgpt work\b/i,
	/\bcustom workflows?\b/i,
	/\bsupport tickets?\b/i,
	/\bsales cycle\b/i,
	/\bbehind the scenes\b/i,
	/\bhelp teams work\b/i,
	/效率|质量|降低成本|工作流|真实工作/,
];

export function topicHaystack(candidate = {}) {
	return [candidate.title, candidate.url, candidate.description].filter(Boolean).join('\n');
}

function matchesAny(text, patterns) {
	return patterns.some((re) => re.test(text));
}

/**
 * @returns {'application' | 'infra' | 'unknown'}
 * Infra wins when both match (e.g. “cut spend” + Auto Router).
 */
export function classifyClipTopic(text) {
	const haystack = String(text ?? '');
	if (!haystack.trim()) return TOPIC_UNKNOWN;
	if (matchesAny(haystack, INFRA_PATTERNS)) return TOPIC_INFRA;
	if (matchesAny(haystack, APPLICATION_PATTERNS)) return TOPIC_APPLICATION;
	return TOPIC_UNKNOWN;
}

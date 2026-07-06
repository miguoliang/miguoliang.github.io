export function slugFromUrl(url) {
	const last = new URL(url).pathname.split('/').filter(Boolean).pop() ?? 'clip';
	return last
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 72) || 'clip';
}

export function todayEdition(timezone = 'Asia/Shanghai') {
	return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

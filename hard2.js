const { solutions, guesses } = require('./words.json');
const fs = require('fs');

const groups = {};
for (const word of solutions)
	for (let i = 0; i < word.length; ++i) {
		let pattern = word.split('');
		pattern[i] = '.';
		pattern = pattern.join('');
		if (groups[pattern]) continue;
		const r = new RegExp(`^${pattern}$`, 'g');
		groups[pattern] = {
			group: solutions.filter(w => r.test(w))
		};
		groups[pattern].letters = groups[pattern].group.map(x => x[i]).join('')
	}

const sorted = 
	Object.entries(groups)
		.map(([key, { ...g }]) => ({ key, ...g }))
		.filter(g => g.group.length > 1)
		.sort((a, b) => b.group.length - a.group.length);

const letters = sorted.filter(x => x.group.length > 4)
	.map(x => x.letters)
	.join('');

const letterCount = {};
for (const letter of letters) {
	if (letterCount[letter]) ++letterCount[letter];
	else letterCount[letter] = 1;
}

fs.writeFileSync('similar-words.json',
	JSON.stringify({
		sorted,
		letterCount: Object.entries(letterCount)
			.map(([l,c]) => ({ l, c }))
			.sort((a, b) => b.c - a.c)
	}, null, 2)
);

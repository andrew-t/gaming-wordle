const { sorted: similarGroups } = require('./similar-words.json');
const { guesses, solutions } = require('./words.json');

const groups = similarGroups.map(g => g.letters);

guesses.push(...solutions);

function score(guess, g = groups) {
	return Math.max(
		...g.map(g => g
			.split('')
			.filter(x => !guess.includes(x))
			.join('')
			.length)
	);
}

const first = guesses
	.map(guess => ({ guess, score: score(guess) }))
	.sort((a, b) => a.score - b.score)
	.slice(0, 25);

console.log(first);

function *andThen(soFar) {
	for (const word of guesses)
		yield soFar + '-' + word;
}

const second = [];
for (const f of first)
for (const guess of andThen(f.guess))
	second.push({ guess, score: score(guess) });

second.sort((a, b) => a.score - b.score);

console.log(second.slice(0, 50));

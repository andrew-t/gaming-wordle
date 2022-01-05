const { solutions, guesses } = require('./words.json');
const easy = require('./easy.json');
const hard = require('./hard.json');

guesses.push(...solutions);

const GREEN = Symbol('🟩');
const YELLOW = Symbol('🟨');
const BLACK = Symbol('⬛️');

function test(source, hard) {
	for (const solution of solutions) {
		let pos = source;
		const guessesSoFar = [];
		while (true) {
			const { guess } = pos;
			if (!guesses.includes(guess))
				console.error('invalid guess', guess);
			if (hard)
				for (const { guess: g, result } of guessesSoFar)
					if (guessString(g, guess) != result)
						console.error('error on', { previousGuess: g, guess, result, solution, guessesSoFar });
			const result = guessString(guess, solution);
			guessesSoFar.push({ guess, result });
			if (result == '🟩🟩🟩🟩🟩') break;
			pos = pos.next[result];
			if (typeof pos == 'string') {
				pos = { guess: pos };
				continue;
			}
			if (pos.possibilities) {
				if (guessesSoFar.length + pos.possibilities.length <= 6) break;
				console.error('fucked it lads');
			}
			if (!pos.next) {
				console.error(pos, result);
				console.error('the answer was', solution);
				throw new Error('what even is this nonsense at', guessesSoFar);
			}
		}
	}
	console.log('finished one!');
}

test(easy);
test(hard, false);
test(hard, true);

function guess(word, solution) {
	if (!guesses.includes(word)) throw new Error('invalid guess: ' + word);
	const a = [BLACK,BLACK,BLACK,BLACK,BLACK];
	const used = [];
	for (let i = 0; i < solution.length; ++i)
		if (word[i] == solution[i]) {
			a[i] = GREEN;
			used[i] = true;
		}
	for (let i = 0; i < word.length; ++i) 
	for (let j = 0; j < solution.length; ++j) {
		if (a[i] == GREEN || used[j] || i == j) continue;
		if (word[i] == solution[j]) {
			a[i] = YELLOW;
			used[j] = true;
		}
	}
	return a;
}

function guessString(...a) { return guess(...a).map(x => x.description).join(''); }

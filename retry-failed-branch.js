const { solutions, guesses } = require('./words.json');
const fs = require('fs');

const args = require('process').argv;

const startPath = args[2];
const offset = parseInt(args[3] ?? '1', 10);
console.log('Starting at', startPath);

guesses.push(...solutions);

// console.log(solutions.length, guesses.length);

function letterFrequency(sols = solutions) {
	const counts = {};
	for (const word of sols) for (const letter of word) {
		if (counts[letter]) ++counts[letter]
		else counts[letter] = 1;
	}
	return Object.entries(counts)
		.map(([letter, count]) => ({ letter, count }))
		.sort((a, b) => b.count - a.count);
}

function inOut(word) {
	let i = 0, o = 0;
	const r = new RegExp(`[${word}]`);
	for (const sol of solutions) {
		if (r.test(sol)) ++i;
		else ++o;
	}
	return { i, o };
}

const GREEN = Symbol('🟩');
const YELLOW = Symbol('🟨');
const BLACK = Symbol('⬛️');

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

// console.log(guessString('later', 'orate'))
// console.log(guessString('idles', 'adder'))
// console.log(guessString('fussy', 'siege'))

function group(word, sols = solutions) {
	const groups = {};
	for (const sol of sols) {
		const r = guessString(word, sol);
		if (groups[r]) groups[r].push(sol);
		else groups[r] = [sol];
	}
	return groups;
}

function groupCounts(g) {
	for (const [r, sols] of Object.entries(g))
		console.log(r, sols.length > 1 ? sols.length : sols[0]);
}

//groupCounts(group('orate'));

function similarGroups(sols) {
	const groups = {};
	for (const word of sols)
		for (let i = 0; i < word.length; ++i) {
			let pattern = word.split('');
			pattern[i] = '.';
			pattern = pattern.join('');
			if (groups[pattern]) continue;
			const r = new RegExp(`^${pattern}$`, 'g');
			const group = sols.filter(w => r.test(w));
			groups[pattern] = {
				group,
				letters: group.map(x => x[i]).join('')
			};
		}
	return groups;
}

function similarity(sols) {
	const g = similarGroups(sols);
	return Math.max(...Object.values(g).map(g => g.letters.length));
}

function bestGuess({sols, guesses, guessesSoFar, path}) {
	const index = path == startPath ? offset : 0;
	// this seems to be the best word you can start with
	// if (guessesSoFar.length == 0) {
	// 	return { word: 'twerp', groups: group('twerp', sols) };
	// }

	// ok first things first
	// strip out any words that are obviously total disasters
	// we do NOT want to end up at ⬛️IGHT
	const priorSimilarity = similarity(sols);
	const similarities = guesses.map(guess => {
		const groups = group(guess, sols);
		const s = Object.values(groups).map(group => ({
			group, similarity: similarity(group)
		}));
		return {
			guess,
			originalGroups: groups,
			groups: s,
			similarity: Math.max(...s.map(s => s.similarity))
		};
	}).sort((a, b) => a.similarity - b.similarity);
	write(`${path}/similarities`, {
		priorSimilarity, similarities
	});

	if (similarities[index].similarity < priorSimilarity) {
	 	return {
	 		word: similarities[index].guess,
	 		groups: similarities[index].originalGroups
	 	};
	}

	// if (HARD_MODE) {
	// 	if (guessesSoFar.length == 1
	// 		&& guessesSoFar[0].r == '⬛️⬛️⬛️⬛️⬛️')
	// 	{
	// 		return { word: 'prams', groups: group('prams', sols) };
	// 	}
	// 	if (guessesSoFar.length == 1
	// 		&& guessesSoFar[0].r == '⬛️🟨⬛️⬛️⬛️')
	// 	{
	// 		return { word: 'merde', groups: group('merde', sols) };
	// 	}
	// }
	// might not always be right but should always be good enough
	const commonLetters = letterFrequency(sols)
		.filter(({ count }) => count < sols.length)
		.map(({ letter }) => letter);
	// console.log(commonLetters);
	const worstGuess = sols.length > 10;
	const candidates = [];
	// if (HARD_MODE) {
		candidates.push(...guesses);
	// } else {
	// 	if (worstGuess) commonLetters.reverse();
	// 	findWords: for (let i = 0x3e00000n;  ; --i) {
	// 		const use = i.toString(2).split('').map(x => x == '1');
	// 		if (use.reduce((a, n) => a + n, 0) != 5) continue;
	// 		const letters = commonLetters.filter((_, i) => use[i]);
	// 		// console.log('L', letters.join(''))
	// 		nextWord: for (const w of guesses) {
	// 			if (guessesSoFar.some(g => g.guess == w)) continue;
	// 			for (const letter of letters)
	// 				if (!w.includes(letter)) continue nextWord;
	// 			candidates.push(w);
	// 			if (candidates.length == 50) break findWords;
	// 		}
	// 	}
	// }
	const g = candidates.map(word => {
		const groups = group(word, sols);
		if (worstGuess) {
			const g = worstGroup(groups);
			let score = 10000
				- g.n * 100
				- similarity(g.group) * 10
				+ Math.abs(sols.length / 4 - g.group.length);
			for (const k in groups) {
				if (count(k.split(''), '🟩') > 2)
				if (groups[k].length > 4)
					score -= 1000;
			}
			return { word, groups, score };
		}
		return {
			word, groups,
			score: Math.max(...Object.values(groups).map(g => g.length))
		};
	});
	g.sort((a, b) => a.score - b.score);
	// console.log(JSON.stringify(g, (k,v)=>k=='groups'?null:v, 2));
	// console.log(JSON.stringify(g,null,2));
	// write('first-guess', g);
	return g[index];
}

function worstGroup(groups) {
	const m = Object.entries(groups).map(([r, group]) => {
		const k = r.split('');
		return {
			r,
			group,
			n: `${count(k, '⬛️')}${count(k, '🟨')}`
		};
	});
	m.sort((a,b) => b.n - a.n);
	return m[0];
}

function count(arr, c) {
	return arr.reduce((a,n) => a+(n==c), 0);
}

// console.log(bestGuess(solutions, guesses, [], Infinity).guess); process.exit(0);

// console.log(solutions.length)
const start = require(`./${startPath}/results.json`);

let wins = 0;
const startedAt = Date.now();
function process(position) {
	write(`${position.path}/sols`, position.sols);
	if (position.sols.length <= position.guessesLeft
		|| position.guessesSoFar[position.guessesSoFar.length - 1]?.r == '🟩🟩🟩🟩🟩') {
		position.result = '✅ SUCCESS';
		// console.log(position);
		write(`${position.path}/success`, position);
		return position;
	}
	if (position.guessesLeft <= 1) {
		position.result = '❌ FAILURE';
		console.log(position);
		write(`${position.path}/failure`, position);
		return position;
	}
	const { word, groups } = bestGuess(position);
	position.guess = word; // bestGuess(position.sols, position.guessesSoFar.map(g => g.guess));
	position.next = groups; // group(position.guess, position.sols);
	for (const [key, sols] of Object.entries(position.next)) {
		const nextPath = `${position.path}/${position.guess}-${key}-${sols.length}`;
		try { fs.mkdirSync(nextPath, 0777); } catch {}
		position.next[key] = process({
			// parent: position,
			guessesLeft: position.guessesLeft - 1,
			sols,
			// lastClue: key,
			guessesSoFar: [
				...position.guessesSoFar,
				{ guess: position.guess, r: key }
			],
			path: nextPath,
			guesses: position.guesses.filter(w => guessString(position.guess, w) == key)
		});
	}
	write(`${position.path}/results-${position.guess}`, position);
	return position;
}

const game = process(start);
write('game', game);

console.log((Date.now() - startedAt) / 1000);

function write(fn, pos) {
	fs.writeFileSync(`${fn}.json`, JSON.stringify(pos));
}

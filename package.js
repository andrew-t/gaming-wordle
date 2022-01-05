const fs = require('fs');


function processPos(pos) {
	if (!pos.result) {
		return {
			guess: pos.guess,
			next: oMap(pos.next, processPos)
		};
	}

	if (pos.result == '✅ SUCCESS') {
		if (pos.sols.length == 1) {
			return pos.sols[0];
		}

		return {
			guessesLeft: pos.guessesLeft,
			possibilities: pos.sols
		}
	}

	throw new Error(pos.result);
}

function oMap(obj, cb) {
	const out = {};
	for (const k in obj) out[k] = cb(obj[k], k);
	return out;
}

function write(fn, pos) {
	fs.writeFileSync(`${fn}.json`, JSON.stringify(pos, null, 2));
}

write('easy', processPos(require('./out/results.json')));

const hard = require('./hard/results.json');

function patch(replacement, ...results) {
	const last = results.pop();
	let target = hard;
	for (const r of results) target = target.next[r];
	target.next[last] = require('./' + target.next[last].path + '/results-' + replacement + '.json');
}

patch('dampy', '⬛️⬛️🟨⬛️⬛️', '🟨⬛️⬛️⬛️⬛️', '⬛️🟩⬛️⬛️🟩');
patch('repeg', '⬛️⬛️⬛️⬛️⬛️', '⬛️🟨⬛️⬛️⬛️', '⬛️⬛️⬛️🟩⬛️');
patch('furan', '⬛️⬛️⬛️⬛️⬛️', '⬛️⬛️🟨⬛️🟨');

write('hard', processPos(hard));

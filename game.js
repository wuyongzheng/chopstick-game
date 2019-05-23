// Current State: Opponent=computer; Me=human.
var state_opl, state_opr;
var state_mel, state_mer;

// a stack of states
var state_history;

// temperature: 0: perfect play, 1: random play, 0.x: ??
var temperature = 0.0;

// key is state, value is score. score=99 means win, score=-99 means lose, score=98 means win in one turn
var score_table = {
	0: -99, 1: -99, 2: -99, 3: -99, 4: -99, 11: -99, 12: -99, 13: -99, 14: -99, 22: -99,
	23: -99, 24: -99, 33: -99, 34: -99, 44: -99, 100: 99, 101: -91, 102: -91, 103: -97, 104: 98,
	111: -93, 112: -93, 113: -95, 114: 90, 122: -95, 123: -95, 124: -91, 133: -97, 134: -91, 144: -97,
	200: 99, 201: 92, 202: 74, 203: 98, 204: 98, 211: -75, 212: -85, 213: 90, 214: 90, 222: -83,
	223: -73, 224: -73, 233: -87, 234: -89, 244: -95, 300: 99, 301: 92, 302: 98, 303: 98, 304: 98,
	311: 76, 312: 96, 313: 96, 314: 96, 322: -79, 323: -93, 324: -89, 333: -95, 334: -89, 344: -95,
	400: 99, 401: 98, 402: 98, 403: 98, 404: 98, 411: 84, 412: 80, 413: -69, 414: 80, 422: 70,
	423: -71, 424: -71, 433: -85, 434: -87, 444: -93, 1100: 99, 1101: 92, 1102: 84, 1103: -83, 1104: 98,
	1111: 76, 1112: -77, 1113: -85, 1114: 92, 1122: -79, 1123: -87, 1124: 74, 1133: -89, 1134: -75, 1144: -83,
	1200: 99, 1201: 94, 1202: 72, 1203: 98, 1204: 98, 1211: 86, 1212: 82, 1213: 92, 1214: 92, 1222: -81,
	1223: 84, 1224: 84, 1233: -89, 1234: -79, 1244: -79, 1300: 99, 1301: 94, 1302: 98, 1303: 98, 1304: 98,
	1311: 78, 1312: 94, 1313: 94, 1314: 94, 1322: 70, 1323: -71, 1324: 68, 1333: -85, 1334: 68, 1344: 68,
	1400: 99, 1401: 98, 1402: 98, 1403: 98, 1404: 98, 1411: 86, 1412: -83, 1413: 70, 1414: 88, 1422: -81,
	1423: -89, 1424: -79, 1433: -89, 1434: -79, 1444: -79, 2200: 99, 2201: 94, 2202: 72, 2203: 98, 2204: 98,
	2211: 84, 2212: 80, 2213: 94, 2214: 94, 2222: -71, 2223: 82, 2224: 82, 2233: 78, 2234: 78, 2244: -69,
	2300: 99, 2301: 96, 2302: 98, 2303: 98, 2304: 98, 2311: 88, 2312: 94, 2313: 94, 2314: 94, 2322: 72,
	2323: 92, 2324: 72, 2333: 92, 2334: 92, 2344: 70, 2400: 99, 2401: 98, 2402: 98, 2403: 98, 2404: 98,
	2411: 90, 2412: 90, 2413: 90, 2414: 90, 2422: 72, 2423: 88, 2424: 72, 2433: 88, 2434: 88, 2444: 70,
	3300: 99, 3301: 96, 3302: 98, 3303: 98, 3304: 98, 3311: 88, 3312: 96, 3313: 96, 3314: 96, 3322: 86,
	3323: 94, 3324: 86, 3333: 94, 3334: 94, 3344: 84, 3400: 99, 3401: 98, 3402: 98, 3403: 98, 3404: 98,
	3411: 90, 3412: 90, 3413: 90, 3414: 90, 3422: 88, 3423: 88, 3424: 88, 3433: 88, 3434: 88, 3444: 86,
	4400: 99, 4401: 98, 4402: 98, 4403: 98, 4404: 98, 4411: 96, 4412: 96, 4413: 96, 4414: 96, 4422: 94,
	4423: 94, 4424: 94, 4433: 94, 4434: 94, 4444: 92
};

function onLoad ()
{
	onReset();
}

function onReset (me_first = true, rand_start = false)
{
	state_opl = state_opr = 1;
	state_mel = state_mer = 1;
	state_history = [];
	if (!me_first)
		computer();
	update();
}

// update html. i.e. enable/disable buttons, etc.
opimgs = ["hand0.png", "hand1.png", "hand2.png", "hand3.png", "hand4.png"];
meimgs = ["hand0.png", "hand1.png", "hand2.png", "hand3.png", "hand4.png"];
function update ()
{
	document.getElementById("imgopl").src = opimgs[state_opl];
	document.getElementById("imgopr").src = opimgs[state_opr];
	document.getElementById("imgmel").src = meimgs[state_mel];
	document.getElementById("imgmer").src = meimgs[state_mer];
	document.getElementById("btntapll").style.display = (state_mel > 0 && state_opl > 0) ? "" : "none";
	document.getElementById("btntaplr").style.display = (state_mel > 0 && state_opr > 0) ? "" : "none";
	document.getElementById("btntaprl").style.display = (state_mer > 0 && state_opl > 0) ? "" : "none";
	document.getElementById("btntaprr").style.display = (state_mer > 0 && state_opr > 0) ? "" : "none";
	document.getElementById("btntapmlr").style.display = (state_mel > 0 && state_mer > 0) ? "" : "none";
	document.getElementById("btntapmrl").style.display = (state_mel > 0 && state_mer > 0) ? "" : "none";

	for (var i = 1; i <= 4; i ++) {
		document.getElementById("btnsplit" + i).style.display = "none";
		if (state_mel == i || state_mer == i) continue;
		var j = state_mel + state_mer - i;
		if (j < 1 || j > 4) continue;
		document.getElementById("btnsplit" + i).style.display = "";
		document.getElementById("btnsplit" + i).innerHTML = "Split to " + i + ", " + j;
	}

	document.getElementById("btnback").style.display = (state_history.length > 0) ? "" : "none";
}

function onSplit (new_left)
{
	state_history.push([state_mel, state_mer, state_opl, state_opr]);
	new_right = state_mel + state_mer - new_left;
	if (new_right < 1 || new_right > 4)
		throw "illigal split " + new_left + ", " + new_right;
	state_mel = new_left;
	state_mer = new_right;
	pause_and_computer();
}

// source, target: 0=myleft, 1=myright, 2=opleft, 3=opright
function onTap (source, target)
{
	state = [state_mel, state_mer, state_opl, state_opr];
	state_history.push(state);
	if (state[source] == 0 || state[target] == 0)
		throw "illigal tap " + state[source] + ", " + state[target];
	state[target] = state[target] + state[source];
	if (state[target] >= 5)
		state[target] = 0;
	switch (target) {
		case 0: state_mel = state[target]; break;
		case 1: state_mer = state[target]; break;
		case 2: state_opl = state[target]; break;
		case 3: state_opr = state[target]; break;
	}
	pause_and_computer();
}

function onBack ()
{
	if (state_history.length == 0)
		throw "illigal back. no history";
	[state_mel, state_mer, state_opl, state_opr] = state_history.pop();
	update();
}

function pause_and_computer ()
{
	document.getElementById("imgopl").src = opimgs[state_opl];
	document.getElementById("imgopr").src = opimgs[state_opr];
	document.getElementById("imgmel").src = meimgs[state_mel];
	document.getElementById("imgmer").src = meimgs[state_mer];
	// TODO: disable all buttons
	// TODO: display count down
	setTimeout(pause_and_computer2, 3000);
}

function pause_and_computer2 ()
{
	// TODO: enable all buttons
	// TODO: remove count down
	computer();
	update();
}

function tap_outcome (source, target)
{
	if (source == 0 || target == 0)
		throw "illigal tap in tap_outcome " + source + "," + target;
	val = source + target;
	return val >= 5 ? 0 : val;
}

function computer ()
{
	next = [];
	// enumerate the options and put them in `next`
	if (state_opl > 0 && state_mel > 0) next.push([tap_outcome(state_opl, state_mel), state_mer, state_opl, state_opr]);
	if (state_opl > 0 && state_mer > 0) next.push([state_mel, tap_outcome(state_opl, state_mer), state_opl, state_opr]);
	if (state_opr > 0 && state_mel > 0) next.push([tap_outcome(state_opr, state_mel), state_mer, state_opl, state_opr]);
	if (state_opr > 0 && state_mer > 0) next.push([state_mel, tap_outcome(state_opr, state_mer), state_opl, state_opr]);
	if (state_opl > 0 && state_opr > 0) {
		next.push([state_mel, state_mer, state_opl, tap_outcome(state_opl, state_opr)]);
		next.push([state_mel, state_mer, tap_outcome(state_opr, state_opl), state_opr]);
	}
	for (var new_opl = 0; new_opl <= 4 && new_opl < state_opl + state_opr; new_opl ++) {
		if (new_opl == state_opl || new_opl == state_opr) continue;
		new_opr = state_opl + state_opr - new_opl;
		if (new_opr > 4) continue;
		next.push([state_mel, state_mer, new_opl, new_opr]);
	}

	var max_score = -99, min_score = 99;
	for (var i = 0; i < next.length; i ++) {
		normalized = [next[i][2], next[i][3], next[i][0], next[i][1]];
		if (normalized[0] > normalized[1])
			[normalized[0], normalized[1]] = [normalized[1], normalized[0]];
		if (normalized[2] > normalized[3])
			[normalized[2], normalized[3]] = [normalized[3], normalized[2]];
		normalized = normalized[0] * 1000 + normalized[1] * 100 + normalized[2] * 10 + normalized[3];
		if (!(normalized in score_table))
			throw "invalid state " + normalized;
		next[i].push(score_table[normalized]);
		if (max_score < score_table[normalized])
			max_score = score_table[normalized];
		if (min_score > score_table[normalized])
			min_score = score_table[normalized];
	}

	threshold = max_score - (max_score - min_score) * temperature;
	threshold = Math.round(threshold);
	next = next.filter(l => l[4] >= threshold);
	if (next.length == 0)
		throw "nothing neft in next";
	[state_mel, state_mer, state_opl, state_opr] = next[Math.floor(Math.random() * next.length)];
}

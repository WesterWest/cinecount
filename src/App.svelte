<script>
	// easteregg část
	let kokes = false;
	let memiky = ["images/kokes-1.jpg", "images/kokes-2.jpg"];
	let memik;

	let countStarted = false;
	let countStopped = false;
	let timer;
	let initialTime;
	let endTime;

	// this is a really terrible fix, but what can you do, it fixes stuff
	let shots = [
		{
			suprasegmentCount: 0,
			segmentCount: 0,
			time: 0,
			length: 0,
		},
	];
	let segmentCount = 1;
	let suprasegmentCount = 1;

	let startCount = () => {
		countStarted = true;
		initialTime = Date.now() / 1000;
	};

	let addShot = () => {
		let time = Date.now() / 1000 - initialTime;
		let length = time - shots[shots.length - 1].time;
		shots.push({
			suprasegmentCount,
			segmentCount,
			time,
			length,
		});
	};

	let addSegment = () => {
		segmentCount++;
		addShot();
	};

	let addSuprasegment = () => {
		suprasegmentCount++;
		addSegment();
	};

	let stopCount = () => {
		endTime = Date.now() / 1000 - initialTime;
		exportData();
		countStopped = true;
	};

	let handleKeydown = (event) => {
		if (key === "Enter" && !countStarted) {
			startCount();
		} else if (key === "D") {
				kokes = !kokes;
				memik = memiky[Math.floor(Math.random() * memiky.length)];
		} else if (countStarted && !countStopped) {
			let key = event.key;
			console.log(key);
			if (key === "s" || key === "S" || key === " ") {
				console.log("sko");
				addShot();
			} else if (key === "g" || key === "G") {
				console.log("gěčko");
				addSegment();
			} else if (key === "u" || key === "U") {
				console.log("učko");
				addSuprasegment();
			} else if (key === "Escape" || key === "Esc") {
				if (countStarted && !countStopped) {
					stopCount();
				} else if (!countStarted) {
					startCount();
				}
			}
		}
	};

	let filmName = "Women on the run";

	let downloadLink;

	let averageShotLenght;
	let maxShotLenght;
	let minShotLenght;

	let exportData = () => {
		// remove empty shot, this is a crude fix, but oh well
		shots.shift();
		let shotTimes = shots.map((shot) => shot.time);
		let shotLengths = shots.map((shot) => shot.length);
		averageShotLenght =
			shotLengths.reduce((a, b) => a + b) / shotLengths.length;
		maxShotLenght = Math.max(...shotLengths);
		minShotLenght = Math.min(...shotLengths);

		let csvContent =
			"data:text/csv;charset=utf-8,suprasegment,segment,time,length" +
			shots.map((row) => Object.values(row).join(",")).join("\n") +
			"\nfinal,count,avg shot len: " +
			averageShotLenght +
			",max shot len: " +
			maxShotLenght +
			",min shot len: " +
			minShotLenght +
			"\n";
		downloadLink = encodeURI(csvContent);
	};
</script>

<svelte:window on:keydown={handleKeydown} />

<main>
	<div class="container">
		<div>
			<h1>Welcome to Cinecount</h1>
			<h2>Counting for a film named: {filmName}</h2>
		</div>
		<div>
			{#if countStarted && !countStopped}
				<button on:click={addShot}>Add shot</button>
				<button on:click={addSegment}>Add segment</button>
				<button on:click={addSuprasegment}>Add suprasegment</button>
				<button on:click={stopCount}>Stop the count</button>
			{:else if countStopped}
				<p>Number of shots: {shots.length}</p>
				<p>Number of segments: {segmentCount}</p>
				<p>Number of suprasegments: {suprasegmentCount}</p>
				<p>
					Length of the film: {Math.round(endTime * 100) / 100} seconds
				</p>
				<p>
					Average shot length: {Math.round(averageShotLenght * 100) /
						100}
					seconds
				</p>
				<p>
					Max shot length: {Math.round(maxShotLenght * 100) / 100} seconds
				</p>
				<p>
					Min shot length: {Math.round(minShotLenght * 100) / 100} seconds
				</p>
				<a href={downloadLink} download={filmName + ".csv"}
					>Download CSV</a
				>
			{:else}
				<input bind:value={filmName} />
				<button on:click={startCount}>Start the count</button>
			{/if}
		</div>
		<div>
			{#if kokes}
				<br /><img
					src={memik}
					width="500px"
					alt="Pan Kokeš je momentálně nedostupný"
				/>
			{/if}
		</div>
	</div>
</main>

<footer>
	<blockquote style="align: center;text-align: left;color: #768390">
		<p>Shortcuts:</p>
		<p>S or SPACE - add shot</p>
		<p>G - add segment</p>
		<p>U - add suprasegment</p>
		<p>Enter - start counting</p>
		<p>Escape - end counting</p>
	</blockquote>
</footer>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	h2 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 2em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	.container {
		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
	}

	footer {
		position: fixed;
		bottom: 0;
		padding: 10px 10px 0px 10px;
		width: 100%;
	}
</style>

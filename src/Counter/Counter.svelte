<script>
    export let segmentCount = 1;
    export let suprasegmentCount = 1;
    export let initialTime;
    export let endTime;
    export let countStopped = false;
    export let exportData;
    export let shots;

    $: shotCount = shots.length;

    const addShot = () => {
        addedSuprasegment = false;
        addedSegment = false;
        let time = Date.now() / 1000 - initialTime;
        let length = time - shots[shots.length - 1].time;
        shots.push({
            suprasegmentCount,
            segmentCount,
            time,
            length,
        });
        shots = shots;
    };

    let addedSuprasegment = false;
    let addedSegment = false;

    const addSegment = () => {
        segmentCount++;
        addShot();
        addedSegment = true;
    };

    const addSuprasegment = () => {
        suprasegmentCount++;
        addSegment();
        addedSuprasegment = true;
    };

    const removeShot = () => {
        console.log(shots);
        if (shots[shots.length - 1].segmentCount > shots[shots.length - 2].segmentCount) {
            segmentCount--;
        }
        if (shots[shots.length - 1].suprasegmentCount > shots[shots.length - 2].suprasegmentCount) {
            suprasegmentCount--;
        }
        shots.pop();
        shots = shots;
    }

    const stopCount = () => {
        endTime = Date.now() / 1000 - initialTime;
        exportData();
        countStopped = true;
    };

    const handleKeydown = (event) => {
        let key = event.key;
        let keyCode = event.keyCode;

        console.log(key);
        if (key === "s" || key === "S" || key === " ") {
            addShot();
        } else if (key === "g" || key === "G") {
            addSegment();
        } else if (key === "u" || key === "U") {
            addSuprasegment();
        } else if (key === "Escape" || key === "Esc") {
            if (!countStopped) {
                stopCount();
            }
        } else if (key === "Backspace") {
            removeShot();
        }
    };
</script>

<svelte:window on:keydown={handleKeydown}/>

<p>Suprasegment: {suprasegmentCount}</p>
<p>Segment: {segmentCount}</p>
<p>Shot: {shotCount}</p>

<button on:click={addShot}>Add shot</button>
<button on:click={addSegment}>Add segment</button>
<button on:click={addSuprasegment}>Add suprasegment</button>
<button on:click={removeShot}>Remove last shot</button>
<button on:click={stopCount}>Stop the count</button>
<script>
    export let segmentCount = 1;
    export let suprasegmentCount = 1;
    export let initialTime;
    export let endTime;
    export let countStopped = false;
    export let exportData;
    export let shots;

    const addShot = () => {
        let time = Date.now() / 1000 - initialTime;
        let length = time - shots[shots.length - 1].time;
        shots.push({
            suprasegmentCount,
            segmentCount,
            time,
            length,
        });
    };

    const addSegment = () => {
        segmentCount++;
        addShot();
    };

    const addSuprasegment = () => {
        suprasegmentCount++;
        addSegment();
    };

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
        }
    };
</script>

<svelte:window on:keydown={handleKeydown}/>

<button on:click={addShot}>Add shot</button>
<button on:click={addSegment}>Add segment</button>
<button on:click={addSuprasegment}>Add suprasegment</button>
<button on:click={stopCount}>Stop the count</button>

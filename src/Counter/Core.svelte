<script>
import Counter from "./Counter.svelte";
import CountResults from "./CountResults.svelte";
import Kokes from "./Kokes.svelte";

    export let filmName = "Women on the run";

    let countStarted = false;
    let countStopped;
    let initialTime;
    let endTime;

    let segmentCount;
    let suprasegmentCount;

    // this is a really terrible fix, but what can you do, it fixes stuff
    let shots = [
        {
            suprasegmentCount: 0,
            segmentCount: 0,
            time: 0,
            length: 0,
        },
    ];

    const startCount = () => {
        countStarted = true;
        initialTime = Date.now() / 1000;
    };

    const handleKeydown = (event) => {
        let key = event.key;
        let keyCode = event.keyCode;

        console.log("Key pressed: " + key + " with code: " + keyCode);
        if (key === "Enter" && !countStarted) {
            startCount();
        } else if (key === "D") {
            kokes.toggleKokes();
        } 
    };

    let countResults = {
        averageShotLenght: 0,
        maxShotLenght: 0,
        minShotLenght: 0,
    }
    const exportData = () => {
        // remove empty shot, this is a crude fix, but oh well
        shots.shift();
        countResults.shots = shots;
        countResults.segmentCount = segmentCount;
        countResults.suprasegmentCount = suprasegmentCount;
        countResults.initialTime = initialTime;
        countResults.endTime = endTime;

        countResults.shotTimes = shots.map((shot) => shot.time);
        countResults.shotLengths = shots.map((shot) => shot.length);

        console.log(shots);
        console.log(countResults.shotLengths);
        if (shots.length > 0) {
            countResults.averageShotLenght =
                countResults.shotLengths.reduce((a, b) => a + b) / countResults.shotLengths.length;
            countResults.maxShotLenght = Math.max(...countResults.shotLengths);
            countResults.minShotLenght = Math.min(...countResults.shotLengths);
        }
        console.log(countResults);

        let csvContent =
            "data:text/csv;charset=utf-8,suprasegment,segment,time,length\n" +
            shots.map((row) => Object.values(row).join(",")).join("\n") +
            "\nfinal,count,avg shot len: " +
            countResults.averageShotLenght +
            ",max shot len: " +
            countResults.maxShotLenght +
            ",min shot len: " +
            countResults.minShotLenght +
            "\n";
        countResults.downloadLink = encodeURI(csvContent);
    };

    let kokes;
</script>

<svelte:window on:keydown={handleKeydown}/>

<div>
    {#if countStarted && !countStopped}
       <Counter {initialTime} bind:shots={shots} bind:segmentCount={segmentCount} bind:suprasegmentCount={suprasegmentCount} bind:countStopped={countStopped} bind:endTime={endTime} {exportData}/>
    {:else if countStopped}
       <CountResults {countResults}/> 
    {:else}
        <input bind:value={filmName} />
        <button on:click={startCount}>Start the count</button>
    {/if}
</div>
<Kokes bind:this={kokes} />

<script>
    export let countResults;
</script>

<p>Number of shots: {countResults.shots.length}</p>
<p>Number of segments: {countResults.segmentCount}</p>
<p>Number of suprasegments: {countResults.suprasegmentCount}</p>
<p>
    Length of the film: {Math.round(countResults.endTime * 100) / 100} seconds
</p>
<p>
    Average shot length: {Math.round(countResults.averageShotLenght * 100) /
        100}
    seconds
</p>
<p>
    Max shot length: {Math.round(countResults.maxShotLenght * 100) / 100} seconds
</p>
<p>
    Min shot length: {Math.round(countResults.minShotLenght * 100) / 100} seconds
</p>
<a href={countResults.downloadLink} download={countResults.filmName + ".csv"}
    >Download CSV</a
>

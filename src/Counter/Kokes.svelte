<script>
    // easteregg část
    let kokes = false;
    let memiky = ["images/kokes-1.jpg", "images/kokes-2.jpg"];
    let memik;

    export const toggleKokes = () => {
        kokes = !kokes;
        memik = memiky[Math.floor(Math.random() * memiky.length)];
    }
</script>

{#if kokes}
    <div>
        <img
            src={memik}
            width="500px"
            alt="Pan Kokeš je momentálně nedostupný"
        />
    </div>
{/if}

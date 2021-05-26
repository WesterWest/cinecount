<script>
    export let filmName;
</script>

<div>
    <h1>Welcome to Cinecount</h1>
    <h2>Counting for a film named: {filmName}</h2>
</div>

<style>
    h1 {
        color: var(--header-color);
        text-transform: uppercase;
        font-size: var(--h1-size);
        font-weight: 100;
    }

    h2 {
        color: var(--header-color);
        text-transform: uppercase;
        font-size: var(--h2-size);
        font-weight: 100;
    }
</style>

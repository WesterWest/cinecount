<script>
	import Core from './Counter/Core.svelte';
	import Header from './Header.svelte';

	let filmName;
</script>

<!--<svelte:window on:keydown={handleKeydown} />-->

<main>
	<Header {filmName}/>
	<Core bind:filmName={filmName}/>
</main>

<footer>
	<blockquote style="align: center;text-align: left;color: #768390; padding-bottom: 10px;">
		<p>Shortcuts:</p>
		<p>S or SPACE - add shot</p>
		<p>G - add segment</p>
		<p>U - add suprasegment</p>
		<p>Backspace - remove last shot</p>
		<p>Enter - start counting</p>
		<p>Escape - end counting</p>
	</blockquote>
</footer>

<style>
	:global(:root) {
		--bg-color: white;
		--text-color: #333;
		--header-color: #ff3e00;
		--h1-size: 4rem;
		--h2-size: 2rem;
	}

	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	footer {
		position: fixed;
		bottom: 0;
		padding: 10px 10px 0px 10px;
		width: 100%;
	}
</style>

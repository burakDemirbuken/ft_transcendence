export default async function doubleFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
	console.log("doubleFetch called!");
	const res1 = await fetch(input, init);
	if (res1.ok) return res1;

	console.log("First fetch failed, trying again...");
	const res2 = await fetch(input, init);
	return res2;
}

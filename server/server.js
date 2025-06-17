// ...existing code...
const fastify = require('fastify')({
	logger: true});

fastify.get('/hello-woerld', async (request, reply) =>
{
	// İstekten veri alma
	const { isim } = request.query || {};

	// Yanıtı özelleştirme
	reply.code(200).send({ mesaj: `Merhaba, ${isim || 'dünya'}!`,
		baner: 'https://example.com/banner.png' });

});

fastify.get('/naber', async (request, reply) =>
{
	// İstekten veri alma
	const { isim } = request.query || {};

	// Yanıtı özelleştirme
	reply.code(200).send({ mesaj: `Nasılsın, ${isim || 'dünya'}?` });
});

const start = async () =>
{
	try
	{
		await fastify.listen({ port: 3000});
		fastify.log.info(`Server listening at http://localhost:3000`);
	}
	catch (err)
	{
		fastify.log.error(err);
		process.exit(1);
	}
};

start();

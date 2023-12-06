const fs = require('fs');
const elasticlunr = require('elasticlunr');

const geoJsonSources = ['world-administrative-boundaries-countries.geojson'];
const searchIndex = elasticlunr(function () {
	this.setRef('ID'); // iso3-code
	this.addField('COUNTRY'); // country name english
	this.saveDocument(true);
});

const processData = (source) => {
	const data = fs.readFileSync(`./${source}`);
	const raw = JSON.parse(data);

	const features = raw.features.map((feature) => {
		const data = {
			source: source,
		};
		data.ID = feature.properties.iso3_code;
		data.COUNTRY = feature.properties.preferred_term;

		return data;
	});

	features.forEach((feature) => {
		searchIndex.addDoc(feature);
	});
};

Promise.all(geoJsonSources.map(processData)).then(() => {
	console.log(searchIndex);

	fs.writeFile('./searchIndex.json', JSON.stringify(searchIndex), (err) => {
		if (err) throw err;
		console.log('Search index generated.');
	});
});

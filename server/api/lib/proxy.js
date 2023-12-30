const scrapingbee = require('scrapingbee'); 
const config = require('./config');

async function get(url, wait =5000) {

	try {
		let client = new scrapingbee.ScrapingBeeClient(config.get('proxy.apiKey')); 
		let response = await client.get({
			url,
			params: {
				'country_code': 'il',
				'premium_proxy': 'true',
				'wait': wait,
			},
			headers: {
			}
		});
		return response.data;
	}
	catch (err) {
		console.error(`error in proxy for url ${url}`, err);
	}
}
module.exports = {
	get,
};
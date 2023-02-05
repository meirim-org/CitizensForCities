const proxy = require('./../proxy');
const cheerio = require('cheerio');
const TreePermit = require('../../model/tree_permit');
const {
	REGIONAL_OFFICE, START_DATE, PERMIT_NUMBER, APPROVER_TITLE, ACTION, 
	END_DATE, LAST_DATE_TO_OBJECTION, TOTAL_TREES, 
	REASON_SHORT, PLACE, STREET,
	TREES_PER_PERMIT, PERSON_REQUEST_NAME, TREE_PERMIT_URL
} = require('../../model/tree_permit_constants');
const { formatDate } = require('./utils');
const Log = require('../log');

const TREES_RAMAT_GAN_URL = `https://www.ramat-gan.muni.il/tashtiot/view/forest_commissioner/license/${new Date().getFullYear()}/`;
const RGTreePermit = {
	urls:[TREES_RAMAT_GAN_URL]
};

async function parseTreesHtml(url) {
	const treesHtml = await proxy.get(url);

    const treesHtmlStr = replaceAll(replaceAll(treesHtml.toString(), '<br>', '\n'), '<BR>', '\n');

	const dom = cheerio.load(treesHtmlStr, {
		decodeEntities: false
	});
	if (!dom) {
		Log.error('cheerio dom is null');
	}
	const keys = [];
	const result = [];
    
    dom('.table_content_regular_wrap').find('TABLE').find('TR').each((row, elem) => {
        if (row === 0) {
            dom(elem).find('TH').each((idx, elem) => {
                const key = dom(elem).text().trim();
                keys.push(key);
            });
            return;
        }
        const treePermit = {};
        dom(elem).find('TD,TH').each((idx, elem) => {
            const value = idx === 6 ? dom(elem).find('a').attr('href') : dom(elem).text().trim();
            if (value.length > 0) {
                const key = keys[idx];
                treePermit[key] = value;
            }
        });
        if (Object.keys(treePermit).length > 0) {
            result.push(treePermit);
        }
    });     

	Log.info(`number of ramat gan permits: ${result.length}`);
	return result;
}

function processRawPermits(rawPermits) {
	try {
		const treePermits = rawPermits.map((raw) => {
			try {
				const parts = raw['שם הרחוב'].split('\n'); // captures (כריתה), (העתקה)
				const street = parts[0];
				const action = parts.length > 1 ? parts[1] : 'כריתה';
				const last_date_to_objection = parsePermitDates(raw['ניתן להגיש ערעור עד'])[0];
				if (!last_date_to_objection) {
					Log.error(`No / Bad dates format, ignore this license: Ramat Gan, ${raw['שם הרחוב']} , ${raw['ניתן להגיש ערעור עד']}`);
					return null;
				}
				const treesPerPermit = raw['סוג העצים'] !== undefined ? parseTreesPerPermit(raw['סוג העצים']) : {};
				const totalTrees = raw['סוג העצים'] !== undefined ? sum(Object.values(treesPerPermit)) : 0;
				const dates = parsePermitDates(raw['מתאריך – עד תאריך']);

				const permitNumber = `meirim-rg-${street}-${dates[0]}`;

				const attributes = {
					[REGIONAL_OFFICE]: 'רמת גן',
					[PLACE]: 'רמת גן',
					[APPROVER_TITLE]: 'פקיד יערות עירוני רמת גן',
					[PERMIT_NUMBER]: permitNumber,
					[PERSON_REQUEST_NAME]: raw['שם בעל הרשיון'],
					[STREET]: street,
					[ACTION]: action,
					[LAST_DATE_TO_OBJECTION]: last_date_to_objection,
					[REASON_SHORT]: raw['סיבת הכריתה'],
					[TREES_PER_PERMIT]: treesPerPermit,
					[TOTAL_TREES]: totalTrees,
					[START_DATE]: dates[0],
					[END_DATE]: dates[1],
					[TREE_PERMIT_URL]: 'https://www.ramat-gan.muni.il/' + raw['הבקשה'],
				};
				const permit = new TreePermit(attributes);
				return permit;
			} catch (e) {
				Log.error(`error in ramat gan parse row: ${raw}`, e.message);
				return null;
			}
		});
		return treePermits.filter(Boolean); // remove undefined values;
	}
	catch (e) {
		Log.error('error in ramat gan parse rows:' + e);
	}
}

function removeTags(line) { // remove data on tree id
    const place = line.startsWith('מס\' ') ? 0 : line.indexOf(' מס\' ');
    if (place >= 0) {
        return line.substring(0, place).trim();
    }
    return line;
}

function isDigit(c) {
	return (c >= '0' && c <= '9');
}

function fixAmount(treeItem) { // amount not at the end - move it
    var amount = treeItem.pop();
    var parts = [];
    while (isNaN(amount) && treeItem.length > 0) {
        const part = treeItem.pop();
        parts.push(amount);
        amount = part;       
    }

    while(parts.length > 0) {
        treeItem.push(parts.pop());
    }

    return {
        [treeItem.join(' ')]: amount,
    };
}

function parseTreesPerPermit(treesInPermitStr) {
	const lines = treesInPermitStr.split('\n');
	const treesInPermit = lines.map(line => {
		line = replaceAll(line, ',', ' ');
        line = line.trim();   
        line = removeTags(line); 
        line = replaceAll(line, '-', ' ');
        line = replaceAll(line, '  ', ' ');
        return fixAmount(line.split(' '));
	}).filter(Boolean);
	return Object.assign({}, ...treesInPermit);
}

function parseGushHelka(gushHelkaStr) {
	return gushHelkaStr? gushHelkaStr.split('\n'): [];
}

function parsePermitDates(treeDatesStr) {
	const dates = treeDatesStr ? treeDatesStr.split('-') : [];
	return dates.map(date => formatDate(date, '09:00', 'DD.MM.YY'));
}

function sum(treeArray) {
	const amount = treeArray.map( (item) => { return parseInt((item)) || 0; });
	return amount.reduce((total, current) => {
		return total + current;
	});
}

function replaceAll(str, from, to) {
    return str.replace(new RegExp(from, 'g'), to);
}

/**
 * Scrape Ramat Gan Tree page, and return the results as a TreePermit[].
 */
async function crawlRGTreesHTML(url, permitType ) {
	try {
		const raw = await parseTreesHtml(url);
		const treePermits = processRawPermits(raw);
		return treePermits;
	}
	catch (e) {
		Log.error(e.message);
	}
}

module.exports = { crawlRGTreesHTML, RGTreePermit };
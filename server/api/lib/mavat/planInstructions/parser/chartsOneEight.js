const { chartToArrayBuilder } = require('./chartToArrayBuilder');
const { getFromArr } = require('./parsersUtils');
const log = require('../../../log');

// this function look for the correct columns for the given headers, and returns a factory embedded with these findings
const rowAbstractFactoryChartsOneEight = (firstPageOfTable, headersStartIndex) => {
	// clean the headers
	firstPageOfTable = firstPageOfTable.map(row => row.map(cell => cell.replace(/\n/g, ' ')
		.replace(/ {2}/g, ' ')
		.trim()));

	if (headersStartIndex === -1) {
		// chart 1.8.3 doesn't have to be in the pdf (for example)
		log.info('didn\'t find headers for some chart 1.8');
		return () => {};
	}

	const header = firstPageOfTable[headersStartIndex];

	const professionIndex = header.findIndex(title => title.includes('מקצוע'));
	const typeIndex = header.findIndex(title => title === 'סוג');
	const descriptionIndex = header.findIndex(title => title === 'תיאור');
	const nameIndex = header.findIndex(title => title === 'שם');
	const licenseNumberIndex = header.findIndex(title => title === 'מספר רשיון');
	const corporateIndex = header.findIndex(title => title === 'שם תאגיד');
	const cityIndex = header.findIndex(title => title === 'ישוב');
	const streetIndex = header.findIndex(title => title === 'רחוב');
	const houseIndex = header.findIndex(title => title === 'בית');
	const phoneIndex = header.findIndex(title => title === 'טלפון');
	const faxIndex = header.findIndex(title => title === 'פקס');
	const emailIndex = header.findIndex(title => title === 'דוא"ל');

	return (row) => {
		let shouldBeDescription = getFromArr(row, descriptionIndex);
		let shouldBeType = getFromArr(row, typeIndex);
		// to fix test_plan4 1.8.3 parsing test. type is less likely to be empty.
		if (shouldBeType === '' && shouldBeDescription !== '' && shouldBeDescription !== undefined) {
			shouldBeType = shouldBeDescription;
			shouldBeDescription = '';
		}
		return {
			profession: getFromArr(row, professionIndex),
			type: shouldBeType,
			description: shouldBeDescription,
			name: getFromArr(row, nameIndex),
			license_number: getFromArr(row, licenseNumberIndex),
			corporate: getFromArr(row, corporateIndex),
			city: getFromArr(row, cityIndex),
			street: getFromArr(row, streetIndex),
			house: getFromArr(row, houseIndex),
			phone: getFromArr(row, phoneIndex),
			fax: getFromArr(row, faxIndex),
			email: getFromArr(row, emailIndex) !== undefined ? getFromArr(row, emailIndex).replace(/ /g, '') : undefined
		};
	};
};

const extractChartsOneEight = (pageTables) => {
	const tbl184 = chartToArrayBuilder({
		pageTables,
		rowAbstractFactory: rowAbstractFactoryChartsOneEight,
		startOfChartPred: (cell) => (cell.includes('1.8.4') && !cell.includes('1.8.3'))	|| (cell.includes('\nעורך התכנית ובעלי מקצוע') && (cell.includes('בעלי עניין בקרקע'))) ,  // the second option is for empty 1.8.3
		offsetOfRowWithDataInChart: 1,
		chartDonePredicate: (row) => row.some(cell => cell.includes('1.9') && cell.includes('הגדרות בתכנית')),
		getHeaderRowIndex: (page, searchFrom) => page.slice(searchFrom).findIndex(row => row.some(cell => cell.includes('סוג')) &&
			row.some(cell => cell.includes('שם'))) + searchFrom,
		rowTrimmer: (row) => row.map((cell) => cell.replace(/\n/g, ' ').replace(/ {2}/g, ' ').trim()),
		identifier: '1.8.4'
	});

	// tbl 184 can have a trail of details about the table, like a small appendix.
	// This will appear in the email column - and it will be the only thing in the row.
	const tbl184Filtered = [];
	for (let i = 0; i < tbl184.length; i++) {
		for (const [key, value] of Object.entries(tbl184[i])) {
			if (key === 'email') {
				continue;
			}
			if (value !== undefined && value !== '') {
				// there's one value at least that isn't "email"
				// if there's a line of junk - it will be only in the email
				tbl184Filtered.push(tbl184[i]);
				break;    // go to the next line!
			}
		}
	}

	return {
		chart181: chartToArrayBuilder({
			pageTables,
			rowAbstractFactory: rowAbstractFactoryChartsOneEight,
			startOfChartPred: (cell) => cell === 'מגיש התכנית1.8.1',
			offsetOfRowWithDataInChart: 1,
			chartDonePredicate: (row) => row.some(cell => cell.includes('1.8.2')) || row.some(cell => cell.includes('הערה')),
			getHeaderRowIndex: (page, searchFrom) => page.slice(searchFrom).findIndex(row => row.some(cell => cell.includes('שם'))) + searchFrom,
			rowTrimmer: (row) => row.map((cell) => cell.replace(/\n/g, ' ').replace(/ {2}/g, ' ').trim()),
			identifier: '1.8.1'
		}),
		chart182: chartToArrayBuilder({
			pageTables,
			rowAbstractFactory: rowAbstractFactoryChartsOneEight,
			startOfChartPred: (cell) => cell.includes('1.8.2') && !cell.includes('1.8.3'),
			offsetOfRowWithDataInChart: 1,
			chartDonePredicate: (row) => row.some(cell => cell.includes('1.8.3' || cell.includes('כתובת:'))),
			getHeaderRowIndex: (page, searchFrom) => page.slice(searchFrom).findIndex(row => row.some(cell => cell.includes('שם'))) + searchFrom,
			rowTrimmer: (row) => row.map((cell) => cell.replace(/\n/g, ' ').replace(/ {2}/g, ' ').trim()),
			identifier: '1.8.2'
		}),
		chart183: chartToArrayBuilder({
			pageTables,
			rowAbstractFactory: rowAbstractFactoryChartsOneEight,
			startOfChartPred: (cell) => cell.includes('1.8.3') && !cell.includes('1.8.4'),
			offsetOfRowWithDataInChart: 1,
			chartDonePredicate: (row) => row.some(cell => cell.includes('1.8.4') || cell.includes('כתובת:')),
			getHeaderRowIndex: (page, searchFrom) => page.slice(searchFrom).findIndex(row => row.some(cell => cell.includes('סוג')) &&
                row.some(cell => cell.includes('שם'))) + searchFrom,
			rowTrimmer: (row) => row.map((cell) => cell.replace(/\n/g, ' ').replace(/ {2}/g, ' ').trim()),
			identifier: '1.8.3'
		}),
		chart184: tbl184Filtered
	};
};

module.exports = {
	extractChartsOneEight
};

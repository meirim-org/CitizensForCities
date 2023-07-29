const AlertStruct = function(table) {
	table.increments();
	table.integer('person_id');
	table.string('address');
	table.string('radius');
	table.specificType('geom', 'GEOMETRY');
	table.string('type');
	table.string('place');
	table.integer('subscription');
	return table;
};

module.exports = AlertStruct;
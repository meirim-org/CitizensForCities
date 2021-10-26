const expect = require('chai').expect;
const { PlanAreaChanges } = require('../../../api/model');

describe('Plan Area Changes model', function() {
	let instance;
	beforeEach(function () {
		instance = new PlanAreaChanges();
	}); 
	
	afterEach(function() {
		instance = null;
	});

	it('has the right rules', function() {
		const rules = instance.rules;
		expect(rules.plan_id).to.eql(['required', 'integer']);
		expect(rules.usage).to.eql(['string']);
		expect(rules.measurement_unit).to.eql(['string']);
		expect(rules.approved_state).to.eql(['string']);
		expect(rules.total_in_detailed_plan).to.eql(['string']);
		expect(rules.total_in_mitaarit_plan).to.eql(['string']);
		expect(rules.remarks).to.eql(['string']);
	});

	it('has the right table name', function() {
		const tableName = instance.tableName;
		expect(tableName).to.eql('plan_area_changes');
	});

	it('has the right defaults', function() {
		const defaults = instance.defaults;
		expect(defaults).to.eql(null);
	});	

	it('has the right timestamps', function() {
		const isTimestamps = instance.hasTimestamps;
		expect(isTimestamps).to.eql(false);
	});

});

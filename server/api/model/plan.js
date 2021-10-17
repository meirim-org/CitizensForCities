const Bluebird = require('bluebird');
const Model = require('./base_model');
const Log = require('../lib/log');
const Exception = require('./exception');
const { Bookshelf, Knex } = require('../service/database');
const PlanChartFiveRow = require('./plan_chart_five_row');
const PlanChartOneEightRow = require('./plan_chart_one_eight_row');
const PlanChartFourRow = require('./plan_chart_four_row');
const PlanChartSixRow = require('./plan_chart_six_row');
const {	notification_types } = require('../constants');
const Notification = require('./notification');
const Alert = require('./alert');
const File = require('./file');

class Plan extends Model {
	get rules () {
		return {
			sent: 'integer',
			OBJECTID: ['required', 'integer'],
			PLAN_COUNTY_NAME: 'string',
			PL_NUMBER: 'string',
			PL_NAME: 'string',
			plan_display_name: 'string',
			PLAN_CHARACTOR_NAME: 'string',
			data: ['required'],
			geom: ['required', 'object'],
			jurisdiction: 'string',
			areaChanges: 'string',
			rating: ['required', 'number'],
			views: ['required', 'number'],
			// numeric indicator of interestingness. It is update like the views field, but also eroded over time
			erosion_views: ['required', 'number'],
			plan_url: 'string',
			status: 'string',
			goals_from_mavat: 'string',
			main_details_from_mavat: 'string',
			explanation: 'string',
			geo_search_filter: 'boolean'
		};
	}

	defaults () {
		return {
			sent: 0,
			geo_search_filter: false
		};
	}

	// support json encode for data field
	format (attributes) {
		if (attributes.data) {
			attributes.data = JSON.stringify(attributes.data);
		}
		return super.format(attributes);
	}

	get hasTimestamps() {
		return true;
	}

	// support json encode for data field
	parse (attributes) {
		try {
			if (attributes.data) {
				attributes.data = JSON.parse(attributes.data);
			}
		} catch (e) {
			Log.error('Json parse error', attributes.data);
		}

		return super.parse(attributes);
	}

	get geometry () {
		return ['geom'];
	}

	get tableName () {
		return 'plan';
	}

	initialize() {
		this.on('created', this._created, this);
		this.on('saving', this._saving, this);
		this.on('creating', this._creating, this);
		this.on('updating', this._updating, this);
		super.initialize();
	}

	_creating (model) {
		return new Promise((resolve) => {
			// set the geometry's centroid using ST_Centroid function
			model.set('geom_centroid', Knex.raw('ST_Centroid(geom)'));
			resolve();
		});
	}

	_updating (model, attrs) {
		return new Promise((resolve) => {
			// if the geometry is being updated update the centroid as well,
			// otherwise never update the centroid since the value is not
			// parsed and formatted like the geometry value is
			if (attrs.geom !== undefined) {
				model.set('geom_centroid', Knex.raw('ST_Centroid(geom)'));
			} else {
				model.unset('geom_centroid');
			}

			resolve();
		}).then(() => this.handleUpdatingPlan(model));
	}

	_saving () {
		// return new Checkit(model.rules).run(model.attributes);
	}

	_created(model) {
		return this.handleNewPlan(model);
	}

	async handleNewPlan (model) {
		const planId = model.id;
		const [ usersSubscribedToPlanArea ] = await Alert.getUsersByGeometry(planId);
		const type = notification_types['NEW_PLAN_IN_AREA']; 

		Log.info(`Creating ${usersSubscribedToPlanArea.length} new plan notifications`);

		await Notification.createNotifications({
			users: usersSubscribedToPlanArea,
			planId,
			type
		});
	}

	async handleUpdatingPlan (model) {
		// NOTE: this would be best done after the model was successfully saved (ie. the
		// updated event), but in that point in time we can't accurately determine which
		// attributes have changed. previousAttributes returns all attributes originally
		// fetched and is not reset by a save (details: https://github.com/bookshelf/bookshelf/pull/1848),
		// and so if we update a model again after saving it previousAttributes will still
		// hint that all attributes that were updated on the first save are again being
		// updated
		const types = this.getPlanUpdateTypes(model);
		if (!types.length)
			return null;

		const planId = model.id;
		const [ usersSubscribedToPlanArea ] = await Alert.getUsersByGeometry(planId);

		Log.info(`Creating ${usersSubscribedToPlanArea.length} updated plan notifications of ${types.length} types`);

		for (let type of types) {
			await Notification.createNotifications({
				users: usersSubscribedToPlanArea,
				planId,
				type
			});
		}
	}

	getPlanUpdateTypes (model) {
		const updates = [];

		if (model.changed.status) {
			updates.push(notification_types['STATUS_CHANGE']);
		}

		return updates;
	}


	canRead () {
		return Bluebird.resolve(this);
	}

	static canCreate(session) {
		if (!session.person || !session.person.admin) {
			throw new Exception.NotAllowed('Must be logged in');
		}
		return Promise.resolve(this);
	}

	static markPlansAsSent (plan_ids) {
		return new Plan()
			.query(qb => {
				qb.whereIn('id', plan_ids);
			})
			.save(
				{
					sent: '2'
				},
				{
					method: 'update'
				}
			);
	}

	static fetchByObjectID (objectID) {
		return Plan.forge({
			OBJECTID: objectID
		}).fetch();
	}

	static fetchByPlanID (planID) {
		return Plan.forge({
			[Plan.prototype.idAttribute]: planID
		}).fetch();
	}

	static cleanPlanName (planName) {

		const cleanFromStart = (planName) => {
			const reSearchWithBackSlash = /^([א-ת0-9]+\\(\ )?[א-ת0-9]+(((\\(\ )?)|\-)[א-ת0-9]+)*)/;
			let searchAns = reSearchWithBackSlash.exec(planName);
			if (searchAns === null) {
				const reSearchWithForwardSlash = /^([א-ת0-9]+\/(\ )?[א-ת0-9]+(((\/(\ )?)|\-)[א-ת0-9]+)*)/;
				searchAns = reSearchWithForwardSlash.exec(planName);
			}

			if (searchAns === null) {
				return planName;
			}

			const matchStr = searchAns[0];
			// the match starts and the beginning of the string
			const endOfMatch = matchStr.length;
			// can't strip the whole plan name
			if (endOfMatch === planName.length) {
				return planName;
			}

			const idxOfSlash1 = matchStr.lastIndexOf('/');
			const idxOfSlash2 = matchStr.lastIndexOf('\\');
			const idxOfHyphen = matchStr.lastIndexOf('-');
			const idxOfSlash = idxOfSlash1 === -1 ? idxOfSlash2 : idxOfSlash1;

			const endOfStripping = idxOfSlash !== -1 && idxOfHyphen > idxOfSlash ? idxOfHyphen : endOfMatch;

			const stripped = planName.substring(endOfStripping + 1);

			const hebrewABCre = /[א-ת]/;
			const separatorRe = /[ ,:\-"']/;

			let hasContinued = false;
			for (let i = 0; i < stripped.length; i++) {
				const char = stripped[i];

				if (char.match(separatorRe) === null) {
					// look for a situation of something like: א\ב\גדה א' עוד דברים כתובים
					// on these cases, we would like to drop the א' as well

					if (!hasContinued && i < stripped.length - 1 && char.match(hebrewABCre) &&
						stripped[i + 1].match(separatorRe)) {
						hasContinued = true;
						continue;
					}

					return stripped.substring(i);
				}
			}

			// we can get here only if all of the chars in the stripped str are separators,
			// so we will return the plan_name...
			return planName;

		};

		const cleanFromEnd = (planName) => {
			const reSearchWithBackSlash = /((\()?[א-ת0-9]+\\(\ )?[א-ת0-9]+(\\(\ )?[א-ת0-9]+)*(\))?(\.)?)$/g;
			let searchAns = reSearchWithBackSlash.exec(planName);
			if (searchAns === null) {
				const reSearchWithForwardSlash = /((\()?[א-ת0-9]+\/(\ )?[א-ת0-9]+(\/(\ )?[א-ת0-9]+)*(\))?(\.)?)$/g;
				searchAns = reSearchWithForwardSlash.exec(planName);
			}

			if (searchAns === null) {
				return planName;
			}

			const startOfStripping = searchAns.index;
			// we can't strip the whole name
			if (startOfStripping === 0) {
				return planName;
			}

			const stripped = planName.substring(0, startOfStripping);

			const seperatorRe = /[ ,:\-"']/;
			// we don't want a plan name with a single character
			for (let i = stripped.length - 1; i > 0; i--) {
				if(!stripped[i].match(seperatorRe)) {
					return stripped.substring(0, i + 1);
				}
			}

			// we can get here only if all of the chars in the stripped str are separators,
			// so we will return the plan_name...
			return planName;
		};

		// Tama is important. Don't clean it.
		if (planName === '' || planName.includes('תמא') || planName.includes('תמ"א')) {
			return planName;
		}

		let cleaned = cleanFromStart(planName);

		// we can clean from end XOR from the start (one side only!)
		if (cleaned.length === planName.length) {
			cleaned = cleanFromEnd(planName);
		}

		return cleaned;
	}

	static buildFromIPlan (iPlan, oldPlan = null) {
		const data = {
			OBJECTID: iPlan.properties.OBJECTID,
			PLAN_COUNTY_NAME: iPlan.properties.PLAN_COUNTY_NAME || '',
			PL_NUMBER: iPlan.properties.PL_NUMBER || '',
			PL_NAME: iPlan.properties.PL_NAME || '',
			plan_display_name: Plan.cleanPlanName(iPlan.properties.PL_NAME),
			// 'PLAN_CHARACTOR_NAME': iPlan.properties.PLAN_CHARACTOR_NAME || '',
			data: iPlan.properties,
			geom: iPlan.geometry,
			PLAN_CHARACTOR_NAME: '',
			plan_url: iPlan.properties.PL_URL,
			status: iPlan.properties.STATION_DESC
		};
		if (oldPlan) {
			oldPlan.set(data);
			return oldPlan.save();
		}

		const plan = new Plan(data);
		return plan.save();
	}

	static async setMavatData (plan, mavatData) {
		const addPlanIdToArray = (chart) => {
			chart.forEach(row => { row.plan_id = plan.id; });
		};

		await Bookshelf.transaction(async (transaction) => {
			await plan.set({
				goals_from_mavat: mavatData.goals,
				main_details_from_mavat: mavatData.mainPlanDetails,
				jurisdiction: mavatData.jurisdiction,
				areaChanges: mavatData.areaChanges,
				explanation: mavatData.planExplanation
			});

			await plan.save(null, { transacting: transaction });

			// delete all of the plan's existing files
			const fileRows = await File.query(qb => {
				qb.where('plan_id', plan.id);
			}).fetchAll({transacting: transaction});
			for (const existingFile of fileRows.models) {
				await existingFile.destroy({transacting: transaction});
			}

			// save all plan files scraped from mavat
			mavatData.files.forEach(async (file) => {
				await new File({ plan_id: plan.id, ...file }).save(null, {transacting: transaction});
			});

			// delete existing chart rows since we have no identifiers for the single
			// rows and so scrape them all again each time
			for (let modelClass of [PlanChartOneEightRow, PlanChartFourRow, PlanChartFiveRow, PlanChartSixRow]) {
				const chartRows = await modelClass.query(qb => {
					qb.where('plan_id', plan.id);
				}).fetchAll({ transacting: transaction });

				for (const chartModel of chartRows.models) {
					await chartModel.destroy({ transacting: transaction });
				}
			}

			if (mavatData.chartsOneEight !== undefined) {
				const chart181 = mavatData.chartsOneEight.chart181;
				// add plan_id and origin
				chart181.forEach(row => {
					row.plan_id = plan.id;
					row.origin = '1.8.1';
				});

				const chart182 = mavatData.chartsOneEight.chart182;
				chart182.forEach(row => {
					row.plan_id = plan.id;
					row.origin = '1.8.2';
				});

				const chart183 = mavatData.chartsOneEight.chart183;
				chart183.forEach(row => {
					row.plan_id = plan.id;
					row.origin = '1.8.3';
				});

				const chartsOneEight = chart181.concat(chart182, chart183);
				for (let i = 0; i < chartsOneEight.length; i++) {
					try {
						await new PlanChartOneEightRow(chartsOneEight[i]).save(null, { transacting: transaction });
					} catch (e) {
						Log.error(e);
					}
				}
			}

			const chartFourData = mavatData.chartFour;
			if (chartFourData !== undefined) {
				addPlanIdToArray(chartFourData);

				for (let i = 0; i < chartFourData.length; i++) {
					try {
						await new PlanChartFourRow(chartFourData[i]).save(null, { transacting: transaction });
					} catch (e) {
						Log.error(e);
					}
				}
			}

			const chartFiveData = mavatData.chartFive;
			if (chartFiveData !== undefined) {
				addPlanIdToArray(chartFiveData);

				for (let i = 0; i < chartFiveData.length; i++) {
					try {
						await new PlanChartFiveRow(chartFiveData[i]).save(null, { transacting: transaction });
					} catch (e) {
						Log.error(e);
					}
				}
			}

			const chartSixData = mavatData.chartSix;
			if (chartSixData !== undefined) {
				addPlanIdToArray(chartSixData);

				for (let i = 0; i < chartSixData.length; i++) {
					try {
						await new PlanChartSixRow(chartSixData[i]).save(null, { transacting: transaction });
					} catch (e) {
						Log.error(e);
					}
				}
			}
		});

		return plan;
	}

	static getUnsentPlans (userOptions) {
		const options = userOptions || {};
		if (!options.limit) {
			options.limit = 1;
		}
		return Plan.query(qb => {
			qb.where('sent', '=', '0');
			if (options.OBJECTID) {
				qb.where('OBJECTID', '=', options.OBJECTID);
			}
		}).fetchPage({
			pageSize: options.limit,
			columns: [
				'id',
				'data',
				'goals_from_mavat',
				'main_details_from_mavat',
				'geom',
				'jurisdiction'
			]
		});
	}

	static erodeViews () {
		const query = 'UPDATE plan SET erosion_views = FLOOR(erosion_views/2)';
		return Knex.raw(query);
	}

	// TODO: actually get the plans we want to tag today, for now getting all of them in dev
	static async getPlansToTag (options) {
		return Plan.query(qb => {
			if (options && options.OBJECTID) {
				qb.where('OBJECTID', '=', options.OBJECTID);
			}
		}).fetchAll({
			columns: [
				'id',
				'geom',
				'PL_NAME'
			]
		});
	}	
}
module.exports = Plan;

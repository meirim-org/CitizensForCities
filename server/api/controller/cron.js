const Bluebird = require('bluebird');
const { map, max } = require('lodash');
const moment = require('moment');
const Turf = require('turf');
const Log = require('../lib/log');
const iplanApi = require('../lib/iplanApi');
const Alert = require('../model/alert');
const Plan = require('../model/plan');
const Email = require('../service/email');
const DigestEmail = require('../service/template_email');
const MavatAPI = require('../lib/mavat');
const { fetchStaticMap } = require('../service/staticmap');
const { crawlTreesExcel } = require('../lib/trees/tree_crawler_excel');
const TreePermit = require('../model/tree_permit');

// const isNewPlan = iPlan => Plan
//   .fetchByObjectID(iPlan.properties.OBJECTID)
//   .then(plan => !plan);

const iplan = (limit = -1) =>
	iplanApi
		.getBlueLines()
		.then(iPlans => {
			// limit blue lines found so we output only *limit* plans
			if (limit > -1) {
				iPlans.splice(limit);
			}

			return Bluebird.mapSeries(iPlans, iPlan => fetchIplan(iPlan));
		});

const fix_geodata = () => {
	return iplanApi.getBlueLines().then(iPlans =>
		Bluebird.mapSeries(iPlans, iPlan => {
			return Plan.forge({
				PL_NUMBER: iPlan.properties.PL_NUMBER
			})
				.fetch()
				.then(oldPlan => {
					// check if there was an update
					return Plan.buildFromIPlan(iPlan, oldPlan).then(plan => {
						return plan.save();
					});
				})
				.catch(e => {
					console.log('iplan exception\n' + e.message + '\n' + e.stack);
					return Bluebird.resolve();
				});
		})
	);
};

const complete_mavat_data = () =>
	Plan.query(qb => {
		// qb.where("main_details_from_mavat", "=", "");
		qb.whereNull('areaChanges');
		qb.orderBy('id', 'desc');
	})
		.fetchAll()
		.then(planCollection =>
			Bluebird.mapSeries(planCollection.models, plan => {
				Log.debug(plan.get('plan_url'));

				return MavatAPI.getByPlan(plan)
					.then(mavatData => {
						Plan.setMavatData(plan, mavatData);
						Log.debug(
							'Saving with mavat',
							JSON.stringify(mavatData)
						);
						return plan.save();
					})
					.catch(() => {
						// do nothing on error
					});
			})
		);

const complete_jurisdiction_from_mavat = () =>
	Plan.query(qb => {
		qb.where('jurisdiction', 'IS', null);
	})
		.fetchAll()
		.then(planCollection =>
			Bluebird.mapSeries(planCollection.models, plan => {
				Log.debug(plan.get('plan_url'));
				return MavatAPI.getByPlan(plan).then(mavatData => {
					Plan.setMavatData(plan, mavatData);
					Log.debug(
						'saved with jurisdiction from mavat',
						JSON.stringify(mavatData)
					);
				});
			})
		);

const sendPlanningAlerts = () => {
	// send emails for each plan to each user in the geographic area the fits
	// sendPlanningAlerts(req, res, next) {id
	Log.info('Running send planning alert');

	return Plan.getUnsentPlans({
		limit: 1
	})
		.then(unsentPlans => {
			Log.debug('Got', unsentPlans.models.length, 'Plans');
			return unsentPlans.models;
		})
		.mapSeries(unsentPlan => {
			const centroid = Turf.centroid(unsentPlan.get('geom'));
			return Promise.all([
				Alert.getUsersByGeometry(unsentPlan.get('id')),
				fetchStaticMap(
					centroid.geometry.coordinates[1],
					centroid.geometry.coordinates[0]
				)
			]).then(([users, planStaticMap]) => {
				Log.debug(
					'Got',
					users[0].length,
					'users for plan',
					unsentPlan.get('id')
				);

				if (!users[0] || !users[0].length) {
					return {
						plan_id: unsentPlan.get('id'),
						users: 0
					};
				}
				return Bluebird.mapSeries(users[0], user =>
					Email.newPlanAlert(user, unsentPlan, planStaticMap)
				).then(() => ({
					plan_id: unsentPlan.get('id'),
					users: users.length
				}));
			});
		})
		.then(successArray => {
			const idArray = [];
			successArray.reduce((pv, cv) => idArray.push(cv.plan_id), 0);
			if (idArray.length) {
				return Plan.markPlansAsSent(idArray).then(() =>
					Log.info('Processed plans', idArray)
				);
			}
			return true;
		});
};

const planToEmail = async (plan) => {
	const map = await plan.map();
	return {
		id: plan.get('id'),
		title: plan.get('plan_display_name'),
		city: plan.get('PLAN_COUNTY_NAME'),
		text: plan.get('goals_from_mavat'),
		status: plan.get('status'),
		areaChange: plan.describeHousingChange(),
		map,
		link:`${this.baseUrl}plan/${plan.get('id')}`
	};
}; 

const alertToEmail = (alert) => {
	const addressTitle = (alert.get('address')|| '').split(',').splice(0,3).join(', ');
	const alertTitle = `תוכניות חדשות בקרבת ${addressTitle ||  'תחומי הענין שלך'}`;
	return {
		alert:{
			title: alertTitle,
			unsubscribeLink: `${this.baseUrl}alerts/unsubscribe/${alert.unsubsribeToken()}`
		}
	};
};

const sendDigestPlanningAlerts = async () => {
	// Send emails for each user, by new plans in his area, that
	// have been added since he last received a digest email
	// sendPlanningAlerts(req, res, next) {id
	Log.info('Running digest send planning alert');
	const lastSentDifference = 7; // update
	const maxAlertsToSend = 5;
	const timeDifference = moment.duration(lastSentDifference, 'd');
	const date = moment().subtract(timeDifference);

	try {
		const { alert, email } = await Alert.getAlertToNotify({}, date);
		if(!alert || !email) {
			Log.debug('No alerts to notify');
		}
		const alertGeom = alert.get('geom');
		const alertPlans = await Plan.getPlansByGeometryThatWereUpdatedSince(alertGeom, date);
		console.log(`Got ${alertPlans.length} plans for alert ${alert.get('id')}`);
		Log.debug(`Got ${alertPlans.length} plans for alert ${alert.get('id')}`);

		const emailAlertParams = alertToEmail(alert);
		const emailPlanParams = {
			firstPlan: alertPlans[1] ? await planToEmail(alertPlans[1]): {},
			secondPlan:alertPlans[2] ? await planToEmail(alertPlans[2]): {},
			// thirdPlan: alertPlans[4] ? planToEmail(alertPlans[3], maps[4]): {},
		// fifthPlan: planToEmail(plans[0]),
		};

		await DigestEmail.digestPlanAlert(email, emailPlanParams, emailAlertParams);	
		const newUpdateDate = alertPlans.length < maxAlertsToSend ? max(map(alertPlans, 'created_at')): Date.now();
		alert.set({
			last_email_sent: moment(newUpdateDate).format('YYYY-MM-DD h:mm')
		});
		await alert.save();
		Log.debug(`User ${email} alert ${alert.id} with ${alertPlans[0].length} plans`);
	}
	catch(e) {
		Log.debug(`Failed digest plans for alert ${alert.id}`);
	}
	finally {
		process.exit();
	}
};

const sendTreeAlerts = () => {
	// send emails for each tree permit to each user in the place
	Log.info('Running send tree permits alert');

	return TreePermit.getUnsentTreePermits({
		limit: 1
	})
		.then(unsentTrees => {
			Log.debug('Got', unsentTrees.models.length, 'Tree permits');
			return unsentTrees.models;
		})
		.mapSeries(unsentTree => {
			let prepDataPromise;

			if (unsentTree.get('geom')) {
				const centroid = Turf.centroid(unsentTree.get('geom'));

				prepDataPromise = Promise.all([
					Alert.getUsersByPlace(unsentTree.get('id')),
					fetchStaticMap(
						centroid.geometry.coordinates[1],
						centroid.geometry.coordinates[0]
					)
				]);
			} else {
				prepDataPromise = Promise.all([
					Alert.getUsersByPlace(unsentTree.get('id')),
					Promise.resolve()
				]);
			}

			return prepDataPromise.then(([users, treeStaticMap]) => {
				Log.debug(
					'Got',
					users[0].length,
					'users for tree permit',
					unsentTree.get('id')
				);

				if (!users[0] || !users[0].length) {
					return {
						tree_id: unsentTree.get('id'),
						users: 0
					};
				}
				return Bluebird.mapSeries(users[0], user =>
					Email.treeAlert(user, unsentTree, treeStaticMap)
				).then(() => ({
					tree_id: unsentTree.get('id'),
					users: users.length
				}));
			});
		})
		.then(successArray => {
			const idArray = [];
			successArray.reduce((pv, cv) => idArray.push(cv.tree_id), 0);
			if (idArray.length) {
				return TreePermit.markTreesAsSent(idArray).then(() =>
					Log.info('Processed trees', idArray)
				);
			}
			return true;
		});
};


/** Private */

const fetchIplan = iPlan =>
	Plan.forge({
		PL_NUMBER: iPlan.properties.PL_NUMBER
	})
		.fetch()
		.then(oldPlan => {
			// check if there was an update

			if (
				oldPlan &&
				oldPlan.get('data').LAST_UPDATE === iPlan.properties.LAST_UPDATE
			) {
				return Bluebird.resolve(oldPlan);
			}

			return buildPlan(iPlan, oldPlan)
				// check if there is an update in the status of the plan and mark it for email update
				.then(plan => {
					if (
						!oldPlan ||
						oldPlan.get('data').STATION !==
						iPlan.properties.STATION
					) {
						plan.set('sent', oldPlan ? 1 : 0);
					}
					return plan;
				})
				.then(plan => {
					if (plan !== undefined) {
						plan.save();
					}
				});
		})
		.catch(e => {
			console.log('iplan exception\n' + e.message + '\n' + e.stack);
			return Bluebird.resolve();
		});

const buildPlan = (iPlan, oldPlan) => {
	return Plan.buildFromIPlan(iPlan, oldPlan).then(plan =>
		MavatAPI.getByPlan(plan)
			.then(mavatData => Plan.setMavatData(plan, mavatData))
			.catch(e => {
				// mavat might crash gracefully
				Log.error('Mavat error', e.message, e.stack);
				return plan;
			})
	);
};

const fetchTreePermit = () =>{
	return crawlTreesExcel();
};

module.exports = {
	iplan,
	complete_mavat_data,
	sendPlanningAlerts,
	complete_jurisdiction_from_mavat,
	fix_geodata,
	fetchIplan,
	fetchTreePermit,
	sendTreeAlerts,
	sendDigestPlanningAlerts
};

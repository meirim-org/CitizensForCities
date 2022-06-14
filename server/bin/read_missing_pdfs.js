const mavat = require('../api/lib/mavat');
const { Knex } = require('../api/service/database');

const readMissingPdfs = async () => {
	const get = (val) => val === undefined ? null : val;

	const insertTo18 = async (origin_chart_txt, chart, planId) => {
		for (const rowIn18 of chart) {
			await Knex.raw(`INSERT INTO tables_18_interests_in_plan (plan_id, origin, profession, type, description, name, license_number, corporate, city, street, house, phone, fax, email)
                                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [planId, origin_chart_txt, get(rowIn18.profession), get(rowIn18.type), get(rowIn18.description),
				get(rowIn18.name), get(rowIn18.license_number), get(rowIn18.corporate), get(rowIn18.city), get(rowIn18.street), get(rowIn18.house), get(rowIn18.phone), get(rowIn18.fax), get(rowIn18.email)]);
		}
	};

	const knexRes = await Knex.raw(`SELECT id, plan_url
          FROM plan
          WHERE kind_of_plan IS NULL ORDER BY id DESC`);

	const idsAndUrls = knexRes[0];
	let howMuchLeft = idsAndUrls.length;
	for (const {id: planId, plan_url: planUrl} of idsAndUrls) {
		console.log(`${howMuchLeft} plans left`);
		howMuchLeft--;

		if (planUrl) {
			await mavat.init();
			let fetchRes;
			try {
				fetchRes = await mavat.fetch(planUrl);
			}
			catch(e) {
				console.error('mavat fetch failed');
				continue;
			}
			const readRes = fetchRes.pageInstructions;

			if (readRes === undefined) {
				continue;
			}

			try {
				await Knex.raw('UPDATE plan SET explanation=?, kind_of_plan=?, laws=?, permit=?, union_and_division=? WHERE id=?', [readRes.planExplanation, readRes.textOneFour.kindOfPlan, readRes.textOneFour.laws, readRes.textOneFour.permit, readRes.textOneFour.unionAndDivision, planId]);

				//1.6
				for (const row of readRes.chartOneSix) {
					await Knex.raw('INSERT INTO table_1_6_prev_plans_relations (plan_id, prev_plan_number, kind, comment, yalkoot_number, yalkoot_page_number, date) VALUES(?, ?, ?, ?, ?, ?, ?)',
						[planId, row.prev_plan_number, row.kind, row.comment, row.yalkoot_number, row.yalkoot_page_number, row.date]);
				}


				//1.7
				for (const row of readRes.chartOneSeven) {
					await Knex.raw('INSERT INTO table_1_7_plan_docs (plan_id, kind, contains, scale, number_of_pages, edit_date, editor, creation_date, description, included) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
						[planId, row.kind, row.contains, row.scale, row.number_of_pages, row.edit_date, row.editor, row.creation_date, row.description, row.included]);
				}

				await insertTo18('1.8.1', readRes.chartsOneEight.chart181, planId);
				await insertTo18('1.8.2', readRes.chartsOneEight.chart182, planId);
				await insertTo18('1.8.3', readRes.chartsOneEight.chart183, planId);
				await insertTo18('1.8.4', readRes.chartsOneEight.chart184, planId);

				//3.1 with change
				for (const row of readRes.chartsThreeOne["3_1_with_change"]) {
					await Knex.raw('INSERT INTO table_3_1_with_change (plan_id, tasrit_marking, designation, field_cells) VALUES(?, ?, ?, ?)', [planId, row.tasrit_marking, row.designation, row.field_cells])
				}

				//3.1 without change
				for (const row of readRes.chartsThreeOne["3_1_without_change"]) {
					await Knex.raw('INSERT INTO table_3_1_without_change (plan_id, designation, field_cells) VALUES(?, ?, ?)', [planId, row.designation, row.field_cells])
				}

				//3.2
				for (const row of readRes.chartsThreeTwo.chart3_2_approved) {
					await Knex.raw('INSERT INTO table_3_2_areas_table (plan_id, designation, size_in_mr, percentage, is_current_state) VALUES(?, ?, ?, ?, ?)', [planId, row.designation, row.size_in_mr, row.percentage, true]);
				}

				for (const row of readRes.chartsThreeTwo.chart3_2_suggested) {
					await Knex.raw('INSERT INTO table_3_2_areas_table (plan_id, designation, size_in_mr, percentage, is_current_state) VALUES(?, ?, ?, ?, ?)', [planId, row.designation, row.size_in_mr, row.percentage, false]);
				}

				for (const rowIn4 of readRes.chartFour) {
					await Knex.raw(`INSERT INTO table_4_area_designation_and_usage (plan_id, category_number, category, father_category_number, father_category, text)
                                       VALUES (?, ?, ?, ?, ?, ?)`, [planId, rowIn4.category_number, rowIn4.category, rowIn4.father_category_number, rowIn4.father_category, rowIn4.text]
						.map(val => get(val)));
				}

				for (const rowIn5 of readRes.chartFive) {
					await Knex.raw(`INSERT INTO table_5_building_rights (plan_id, designation, \`use\`, area_number, location, field_size_sqm, above_primary_main, above_primary_service, below_primary_main, below_primary_service, building_percentage, tahsit, density_yahad_to_dunam, num_of_housing_units, floors_above, floors_below, overall_building_land, height_above_entrance, side_line_right, side_line_left, side_line_back, side_line_front)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [planId, rowIn5.designation, rowIn5.use, rowIn5.area_number, rowIn5.location,
						rowIn5.field_size_sqm, rowIn5.above_primary_main, rowIn5.above_primary_service, rowIn5.below_primary_main, rowIn5.below_primary_service, rowIn5.building_percentage, rowIn5.tahsit,
						rowIn5.density_yahad_to_dunam, rowIn5.num_of_housing_units, rowIn5.floors_above, rowIn5.floors_below, rowIn5.overall_building_land, rowIn5.height_above_entrance,
						rowIn5.side_line_right, rowIn5.side_line_left, rowIn5.side_line_back, rowIn5.side_line_front].map(val => get(val)));
				}

				for (const rowIn6 of readRes.chartSix) {
					await Knex.raw('INSERT INTO table_6_additional_instructions (plan_id, category_number, category, text) VALUES (?, ?, ?, ?)',
						[planId, rowIn6.category_number, rowIn6.category, rowIn6.text].map(val => get(val)));
				}

				//7.1
				for (const row of readRes.chartSevenOne) {
					await Knex.raw('INSERT INTO table_7_1_implementation_stages (plan_id, phase, phase_description ,conditioning) VALUES(?, ?, ?, ?)', [planId, row.phase, row.phase_description, row.conditioning])
				}

			}
			catch(e) {
				console.log(e);
			}
		}
	}
};

readMissingPdfs().then(() => console.log('done read missing pdfs'));

import React from 'react';
import PropTypes from 'prop-types';
import { Chart } from 'react-charts';
import { TabPanel, TabBox, Typography } from 'shared';
import t from 'locale/he_IL';
import { series, axes } from '../../utils';
import * as SC from './style';
import { colors } from 'style';

export const HousingUnitPanel = ({ dataUnits }) => {
	if (!dataUnits || !dataUnits[0] || !dataUnits[0].data.length) return null;
	
	return (
		<TabPanel>
			<TabBox>
				<SC.PlanSummaryTitleWrapper>
					<Typography
						variant="planDetailTitle"
						mobileVariant="planDetailTitle"
						component="h2"
						color={colors.black}
					>
						{t.housingUnitChanges}
					</Typography>
				</SC.PlanSummaryTitleWrapper>

				<SC.ChartWrapper>
					<Chart
						series={series}
						data={dataUnits}
						axes={axes}
						tooltip={true}
					/>
				</SC.ChartWrapper>

			</TabBox>
		</TabPanel>
	);
};

HousingUnitPanel.propTypes = {
	dataUnits: PropTypes.array.isRequired,
};

export default HousingUnitPanel;
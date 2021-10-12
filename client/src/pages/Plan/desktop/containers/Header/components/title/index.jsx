import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'shared';
import * as SC from '../../style';
import { BackButton } from 'pages/Plan/common';
import { goBack } from 'pages/Plan/utils';
import t from 'locale/he_IL';
import { colors } from 'style';

const Title = ({ countyName, planName }) => {

	return (
		<>
			<SC.SubTitleWrapper>
				<BackButton onclick={goBack} label={t.backToComments} classname="back-button"/>
				<Text size="18px" weight="700" text={countyName} component="span" color={colors.purple[500]}/>
			</SC.SubTitleWrapper>
			<SC.TitleWrapper>
				<Text size="24px" lineHeight="1.17" weight="600" text={planName} component="h1" color={colors.black}/>
			</SC.TitleWrapper>
		</>
	);
};

Title.propTypes = {
	planName: PropTypes.string,
	countyName: PropTypes.string,
};

export default Title;
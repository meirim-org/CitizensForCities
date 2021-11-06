import { useTranslation } from 'locale/he_IL';
import PropTypes from 'prop-types';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { TreeSelectors } from 'redux/selectors';
import { pageTitleText, tabIsActive } from '../../../utils';
import { ShareTree, Title } from './components';
import * as SC from './style';

const Header = ({ match }) => {
	const history = useHistory();
	const { treeData: { place, street , street_number, total_trees } } = TreeSelectors();
	const { t } = useTranslation();
	const pathData  = {
		pathName: history.location.pathname,
		treeId: match.params.id
	};

	const titleText = pageTitleText(total_trees, street, street_number);

	return (
		<SC.Header>
			<SC.TitlesAndTabs>
				<Title place={place} text={titleText}/>
				<SC.AppBar position="static">
					<div>
						<SC.Tab className={tabIsActive('summary', pathData) ? 'active' : ''} onClick={() => history.push(match.url)}>{t.summary}</SC.Tab>
					</div>
				</SC.AppBar>
			</SC.TitlesAndTabs>
			<SC.Buttons>
				<ShareTree />
			</SC.Buttons>
		</SC.Header>
	);
};

Header.propTypes = {
	match: PropTypes.object.isRequired
};

export default Header;
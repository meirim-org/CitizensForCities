import React from 'react';
import { useParams } from 'react-router-dom';
import { withGetScreen } from 'react-getscreen';
import PlanDesktop from './desktop';
import { useDataHandler, useCommentsDataHandler } from './hooks';
import t from 'locale/he_IL';
import PlanMobile from './mobile';

const Plan = (props) => {
	const [tabValue, setValue] = React.useState(0);
	const [subscribePanel, setSubscribePanel] = React.useState(true);
	const [isNewCommentOpen, setIsNewCommentOpen] = React.useState(false);
	const [newCommentText, setNewCommentText] = React.useState('');
	const [newCommentType, setNewCommentType] = React.useState('review');
	const [refetchComments, setRefetchComments] = React.useState(false);

	const openNewCommentView = () => {
	    setIsNewCommentOpen(true);
		window.scrollTo(0, 0);
	};
	const closeNewCommentView = () => setIsNewCommentOpen(false);

	const handleTabChange = (_, newValue) => setValue(newValue);
	const handleSubscribePanel = (newValue) => setSubscribePanel(newValue);
	const handleNewCommentText = (newValue) => setNewCommentText(newValue);
	const handleNewCommentType = (newValue) => setNewCommentType(newValue);
	const { id: planId } = useParams();
	useDataHandler(planId);
	useCommentsDataHandler(planId, refetchComments, setRefetchComments);
	const commentTypes = [
		{
			value: 'review',
			text: t.review
		},
		{
			value: 'improvement-proposal',
			text: t.improvementProposal
		},
		{
			value: 'general-opinion',
			text: t.generalOpinion
		},

	];

	if (props.isMobile() || props.isTablet()) return <PlanMobile
		tabValue={tabValue}
		setRefetchComments={setRefetchComments}
		handleTabChange={handleTabChange}
		subscribePanel={subscribePanel}
		handleSubscribePanel={handleSubscribePanel}
		isNewCommentOpen={isNewCommentOpen}
		newCommentViewHandler={() => setIsNewCommentOpen(!isNewCommentOpen)}
		openNewCommentView={openNewCommentView}
		closeNewCommentView={closeNewCommentView}
		newCommentText={newCommentText}
		handleNewCommentText={handleNewCommentText}
		newCommentType={newCommentType}
		handleNewCommentType={handleNewCommentType}
		commentTypes={commentTypes}/>;
	else return <PlanDesktop
		tabValue={tabValue}
		setRefetchComments={setRefetchComments}
		handleTabChange={handleTabChange}
		subscribePanel={subscribePanel}
		handleSubscribePanel={handleSubscribePanel}
		isNewCommentOpen={isNewCommentOpen}
		newCommentViewHandler={() => setIsNewCommentOpen(!isNewCommentOpen)}
		openNewCommentView={openNewCommentView}
		closeNewCommentView={closeNewCommentView}
		newCommentText={newCommentText}
		handleNewCommentText={handleNewCommentText}
		newCommentType={newCommentType}
		handleNewCommentType={handleNewCommentType}
		commentTypes={commentTypes}/>;
};

export default withGetScreen(Plan, { mobileLimit: 768, tabletLimit: 1024, shouldListenOnResize: true });

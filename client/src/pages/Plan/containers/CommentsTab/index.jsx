import React from 'react';
import { useTheme } from '@material-ui/styles';
import PropTypes from 'prop-types';
import t from 'locale/he_IL';
import {  TabPanel, Button } from 'shared';
import { CommentForm, CommentView,  SubCommentForm, SubCommentView, AddComment } from 'pages/Plan/common';
import { CommentSelectors } from 'redux/selectors';
import { Badge } from '@material-ui/core';
import * as SC from './style';

const CommentsTab = ({
	commentState,
	subCommentState,
	setCommentState,
	setSubCommentState,
	addNewComment,
	addSubComment,
	addLikeToComment,
	 }) => {
	const { comments } = CommentSelectors();
	const { isOpen: isSubCommentOpen } = subCommentState;
	const { isOpen: isCommentOpen } = commentState;
	const theme = useTheme();
	const showComments = comments.length > 0; 
	const showStartDiscussionPanel = comments.length === 0 && !isCommentOpen;
	const newCommentViewHandler = () => setCommentState(pv => ({ ...pv, isOpen: !isCommentOpen }));
	
	return (
		<>			
			<SC.ButtonWrapper>
				<AddComment isNewCommentOpen={isCommentOpen} newCommentViewHandler={newCommentViewHandler}/>
			</SC.ButtonWrapper>
			{isCommentOpen && <CommentForm
				addNewComment={addNewComment}
				comments={comments.length}
				commentState={commentState}
				setCommentState={setCommentState}
			/>}
			{showComments && comments.map((comment, index) => {
				const { id: commentId, likes } = comment;

				return ( 
					<>
						<CommentView
							key={index}
							addLikeToComment={addLikeToComment}
							commentData={comment}
							isNewCommentOpen={isCommentOpen}
						>
							<SC.Like>
								<Button
									id={'like-' + commentId}
									textcolor={theme.palette.black}
									text={t.iLike}
									onClick={() => addLikeToComment(commentId)}
									simple
									iconBefore={<SC.LikeIcon/>}
								/>
								<Badge
									badgeContent={!likes ? 0 : likes}
								/>
							</SC.Like>
							<SC.AddSubComment className={isSubCommentOpen ? 'active' : ''}>
								<Button
									id={'add-subcomment-' + comment.id}
									textcolor={theme.palette.black}
									text={t.addAResponse}
									onClick={() => setSubCommentState(pv => ({ ...pv, isOpen: !subCommentState.isOpen }))}
									simple
									iconBefore={<SC.CommentIcon/>}
								/>
							</SC.AddSubComment>
							<SC.CommentsWrapper>
								{isSubCommentOpen &&
                                <SubCommentForm
                                	id={'add-subcomment-form' + comment.id}
                                	isSubCommentOpen={isSubCommentOpen}
                                	addSubComment={addSubComment}
                                	parentComment={comment}
                                	subCommentState={subCommentState}
                                	setSubCommentState={setSubCommentState}
                                />
								}
								{comment.subComments &&
                                comment.subComments.map((subComment, index) => (
                                	<SubCommentView key={index} id={index} subCommentData={subComment}/>
                                ))}
							</SC.CommentsWrapper>
						</CommentView>
					</>
				);
			})
			}
			{showStartDiscussionPanel &&
            <TabPanel>
            		<SC.NoComments>
            		<SC.NoCommentsBold>{t.startDiscussion}</SC.NoCommentsBold>
            		<br/>
            		<SC.NoCommentsRegular>{t.shareThought}</SC.NoCommentsRegular>
            		</SC.NoComments>
            </TabPanel>
			}
		</>
	);
};

CommentsTab.propTypes = {
	commentState:  PropTypes.object.isRequired,
	subCommentState: PropTypes.object.isRequired,
	setCommentState: PropTypes.func.isRequired,
	setSubCommentState: PropTypes.func.isRequired,
	addNewComment: PropTypes.func.isRequired,
	addSubComment: PropTypes.func.isRequired,
	addLikeToComment: PropTypes.func.isRequired,
};

export default CommentsTab;
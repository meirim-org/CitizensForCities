import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import { colors } from 'style';

const StyledLink = withTheme(styled(RouterLink)`
  font-size: 16px;
  font-weight: ${(props) => props.fontWeight};
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  text-align: center;
  transition: 0.3s;
  text-decoration: ${(props) => props.textDecoration};
  color: ${colors.purple[500]};
  cursor: pointer;
  
  &:hover {
    color: ${colors.purple[400]};
    text-decoration: ${(props) => props.textDecoration} !important;
  }

`);

const Link = ({ id, text, fontWeight, onClick, url, textDecoration, ...other }) => (
	<StyledLink id={id} to={url} fontWeight={fontWeight} onClick={onClick} textDecoration={textDecoration} {...other}>{text}</StyledLink>
);

Link.defaultProps = {
	fontWeight: '400',
	url: '#',
	textDecoration: 'underline'
};

Link.propTypes = {
	onClick: PropTypes.func,
	text: PropTypes.string,
	id: PropTypes.string,
	url: PropTypes.string,
	fontWeight: PropTypes.string,
	textDecoration: PropTypes.string
};

export default Link;

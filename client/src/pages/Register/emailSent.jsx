/* eslint-disable react/prop-types */
import { withTheme } from '@material-ui/core/styles';
import Wrapper from 'components/Wrapper';
import { useTranslation } from 'locale/he_IL';
import React from 'react';
import { device } from 'style';
import styled from 'styled-components';
import { resendActivationLinkToEmail } from './controller';

const MainWrapper = withTheme(styled.div`
    width: 100%;
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
    height: calc(100vh - ${props => props.theme.navigation.mobile});
    @media ${device.tablet} { 
        grid-template-columns: 55% 45%;
        height: calc(100vh - ${props => props.theme.navigation.desktop});
    }
`);

const ImageCol = styled.div`
    position: relative;
    overflow: hidden;
    display: none;
    &:before {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        mix-blend-mode: color;
        background-image: linear-gradient(to top right, #6200ee, #eb8c47);
        height: 100%;
        width: 100%;
    }   
    &:after {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        height: 110%;
        transform: tX(100%) rotate(3.5deg);
        transform-origin: top left;
        width: 100%;
    }
    @media ${device.tablet} { 
        display: block;  
    }
`;

const Image = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: right;
`;

const ContentCol = styled.div`
    padding-top: 20vh;
    @media ${device.tablet} { 
        padding-top: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 3.5rem;
    @media ${device.tablet} { 
        padding: 0 1rem;
    }
`;

const PreTitle = styled.span`
    font-size: 16px;
    font-family: Assistant;
    font-weight: 600;
    font-stretch: normal;
    font-style: normal;
    line-height: normal;
    letter-spacing: normal;
    text-align: center;
    color: #000000;
    margin-bottom: 1.4rem;
    @media ${device.tablet} { 
        font-size: 24px;
    }
`;

const Title = styled.h1`
    font-family: Assistant;
    font-size: 32px;
    font-weight: 600;
    font-stretch: normal;
    font-style: normal;
    line-height: 1.15;
    letter-spacing: normal;
    text-align: center;
    color: #000000;
    margin-bottom: 2.5rem;
    @media ${device.tablet} { 
        margin-bottom: 1.4rem;
        font-weight: 700;
    }
`;

const Text = styled.span`
    font-family: Assistant;
    font-size: 16px;
    font-weight: normal;
    font-stretch: normal;
    font-style: normal;
    line-height: normal;
    letter-spacing: normal;
    text-align: center;
    color: #000000;
    margin-bottom: 1.2rem;
    padding: 0 0.5rem;
    @media ${device.tablet} { 
        padding: 0;
      font-size: 20px;
    }
`;

const SmallTextWrapper = styled.div`
  text-align: center;
`;

const SmallText = styled.span`
  font-family: Assistant;
  font-size: 16px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  text-align: center;
  color: #000000;
`;

const Link = styled.span`
  cursor: pointer;
  font-family: Assistant;
  font-size: 16px;
  font-weight: bold;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  text-align: center;
  color: var(--meirim-purple);
  text-decoration: underline;
  color: #652dd0;
`;

const EmailSent = ({ fullPage = true , ...props }) => {
	const { t } = useTranslation();
	let email = '';
	if (props && props.location && props.location.state){
		email = props.location.state.email;
	}
	
	return (
		<Wrapper fullPage={fullPage}>
			<MainWrapper style>
				<ContentCol>
					<Content>
						<PreTitle>{t.almostDone}</PreTitle>
						<Title>
                            {t.confirmEmail1}
                            <br />
                            {t.confirmEmail2}
						</Title>
						<Text id="register-emailsent-sucess">{t.sentYouEmailForConfirmation}</Text>
						<SmallTextWrapper>
							<SmallText>{t.resendEmail}</SmallText>
							<Link onClick={()=> resendActivationLinkToEmail(email)}>{t.clickHere}</Link>
						</SmallTextWrapper>
					</Content>
				</ContentCol>
				<ImageCol>
					<Image src="./images/tolu-olubode-PlBsJ5MybGc-unsplash-3.jpg" alt="construction image"/>
				</ImageCol>
			</MainWrapper>
		</Wrapper>
	);
};

export default EmailSent;

import { withTheme } from '@material-ui/core/styles';
import WhatsAppIcon from '@material-ui/icons/WhatsApp';
import FacebookIcon from '@material-ui/icons/Facebook';
import { useTheme } from '@material-ui/styles';
import { useTranslation } from 'locale/he_IL';
import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Button, Text } from 'shared';
import { device } from 'style';
import styled from 'styled-components';
import { copiedToClipboard } from 'toasts';

const ShareWrapper = styled.div`
    max-width: 100%;
    min-width: 21.5rem;
    @media ${device.tablet} {
        min-width: 31.5rem; 
    }
`;

const ShareTitleWrapper =  withTheme(styled.div`
    text-align: center;
    border-bottom: 1px solid ${props => props.theme.palette.gray['radio']};
    
    padding-bottom: 1rem;
    @media ${device.tablet} {
        padding-bottom: 2.5rem;
    }
    > * {
        font-size: 24px !important;
        @media ${device.tablet} {
           font-size: 32px !important;
           font-weight: 600 !important;
        }
    }
`);

const ShareActionWrapper =  withTheme(styled.div`
    padding: 1.5rem 2.2rem;
    text-align: center;
    @media ${device.tablet} {
       padding: 2rem 3.75rem;
    }
    > * {
        font-size: 16px !important;
        @media ${device.tablet} {
           font-size: 14px !important;
        }
    }
`);

const ShareButtonWrapper = withTheme(styled.div`
    margin-bottom: 1rem;
    .MuiButton-root {
        width: 100%;
        border: transparent!important;
        background-color: ${props => props.theme.palette.green['whatsapp']} !important;
        &:hover, &:focus {
            background-color: ${props => props.theme.palette.green['whatsapp']} !important;
            outline: 0 !important;
        }
        min-height: 3rem;
        @media ${device.tablet} {
            min-height: 3.7em;
        }
    }

    .MuiButton-label {
        text-transform: capitalize;
    }

`);

const FacebookShareButtonWrapper = withTheme(styled.div`
    margin-bottom: 1rem;
    .MuiButton-root {
        width: 100%;
        border: transparent!important;
        background-color: ${props => props.theme.palette.green['facebook']} !important;
        &:hover, &:focus {
            background-color: ${props => props.theme.palette.green['facebook']} !important;
            outline: 0 !important;
        }
        min-height: 3rem;
        @media ${device.tablet} {
            min-height: 3.7em;
        }
    }

    .MuiButton-label {
        text-transform: capitalize;
    }

`);

const ShareTextWrapper = styled.div`
    margin-bottom: 1rem;
    text-align: center;
    
    > * {
        font-size: 12px !important;
        @media ${device.tablet} {
           font-size: 14px !important;
        }
    }
`;

const CopyUrlArea = withTheme(styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    background-color: ${props => props.theme.palette.gray['bg']} !important;
    align-items: center;
    padding: 1rem;
    border-radius: 12px;
    border: solid 1px ${props => props.theme.palette.gray['400']} !important;

    > span {
        direction: ltr;
        white-space: nowrap;
        overflow-x: scroll;
        font-size: 12px !important;  
        max-width: 11.8rem;              
        @media ${device.tablet} {
           max-width: 17rem; 
           font-size: 14px !important;
        }        
    }
`);

const ShareTreeView = () => {
	const theme = useTheme();
	const url = encodeURI(window.location.toString());
	const whatsappURL = `https://wa.me/?text=רשיון%20כריתת%20עצים%20שאולי%20יעניין%20אותך%3A%0A${url}`;
    const facebookURL = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    const { t } = useTranslation();

	return (
		<ShareWrapper>
			<ShareTitleWrapper>
				<Text text={t.shareTree} color={theme.palette.primary['800']}/>
			</ShareTitleWrapper>
			<ShareActionWrapper>
				<ShareButtonWrapper>
					<Button
					 component="a"
					 href={whatsappURL}
					 target="_blank"
					 text={t.whatsappShare} 
					 fontWeight="600" 
					 textcolor={theme.palette.white}
					 iconBefore={<WhatsAppIcon/>} />
				</ShareButtonWrapper>
                <FacebookShareButtonWrapper>
					<Button
					 component="a"
					 href={facebookURL}
					 target="_blank"
					 text={t.facebookShare} 
					 fontWeight="600" 
					 textcolor={theme.palette.white}
					 iconBefore={<FacebookIcon/>} />
				</FacebookShareButtonWrapper>
				<ShareTextWrapper>
					<Text text={t.copyUrl} color={theme.palette.black}/>
				</ShareTextWrapper>
				<CopyUrlArea>
					<Text text={url} size="14px" color={theme.palette.black}/>
					<CopyToClipboard text={url} onCopy={() => copiedToClipboard()}>
						<Button
						 text={t.copy} 
						 fontSize="14px" 
						 fontWeight="400" 
						 textcolor={theme.palette.primary.main}
						 simple={true}
						 />
					</CopyToClipboard>
				</CopyUrlArea>
			</ShareActionWrapper>
		</ShareWrapper>
	);
};

export default ShareTreeView;
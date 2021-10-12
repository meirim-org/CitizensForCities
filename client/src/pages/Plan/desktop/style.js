import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import { colors } from 'style';

export const MainWrapper = withTheme(styled.div`
    display: grid;
    grid-template-columns: 60% 1fr;
    grid-template-rows: 1fr;
    overflow: hidden;
    height: calc(100vh - ${props => props.theme.navigation.desktop});
`);

export const Content = withTheme(styled.div`
    background-color:  ${props => props.theme.palette.gray['bg']};
    box-shadow: -3px 0 24px 0 rgba(0, 0, 0, 0.08);
    overflow-y: auto;
    
    header {
        background-color:  ${colors.white};
    }
`);

export const Main = withTheme(styled.main`
    padding: 2.5rem 4.8rem;
    &.no-comments {
        min-height: 100vh;
    }
`);
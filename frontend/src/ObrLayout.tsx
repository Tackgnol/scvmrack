import OBR from '@owlbear-rodeo/sdk';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from './components/molecules/header/LanguageToggle';
import { Actions, Bar, Body, Container, ExpandButton, Wordmark } from './ObrLayout.styles';

const COMPACT_WIDTH = 420;
const EXPANDED_WIDTH = 860;

// Chrome for the Owlbear Rodeo extension panel. No app nav/header/footer — the
// host (OBR) owns the window. The only chrome is a thin bar that lets the
// player grow the panel in place (`OBR.action.setWidth`) so the same sheet gets
// room to edit, then shrink it back. Editing never leaves this iframe, so the
// partitioned session is untouched.
export function ObrLayout({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    const [ready, setReady] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => OBR.onReady(() => setReady(true)), []);

    function toggleExpand() {
        const next = !expanded;
        setExpanded(next);
        OBR.action.setWidth(next ? EXPANDED_WIDTH : COMPACT_WIDTH);
    }

    return (
        <Container>
            <Bar>
                <Wordmark>Scvmrack</Wordmark>
                <Actions>
                    <LanguageToggle />
                    <ExpandButton type="button" onClick={toggleExpand} disabled={!ready}>
                        {expanded
                            ? t('obr.layout.collapse', '⊠ Collapse')
                            : t('obr.layout.expand', '⤢ Expand')}
                    </ExpandButton>
                </Actions>
            </Bar>
            <Body>{children}</Body>
        </Container>
    );
}

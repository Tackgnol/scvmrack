import OBR from '@owlbear-rodeo/sdk';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from './components/molecules/header/LanguageToggle';
import { Actions, Bar, Body, Container, ExpandButton, Wordmark } from './ObrLayout.styles';

const COMPACT_WIDTH = 420;
const EXPANDED_WIDTH = 860;
const EXPANDED_HEIGHT_FLOOR = 720;

type PanelSize = 'compact' | 'expanded' | 'max';

// window.screen.availWidth/availHeight is unavailable in some hosts (or can
// report an unreasonably small value); fall back to the expanded-mode size
// rather than shrinking the panel.
function maxDimension(available: number | undefined, floor: number): number {
    return available && available > floor ? available : floor;
}

// Chrome for the Owlbear Rodeo extension panel. No app nav/header/footer — the
// host (OBR) owns the window. The only chrome is a thin bar that lets the
// player grow the panel in place (`OBR.action.setWidth`/`setHeight`) so the
// same sheet gets room to edit, then shrink it back. Editing never leaves
// this iframe, so the partitioned session is untouched.
export function ObrLayout({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    const [ready, setReady] = useState(false);
    const [size, setSize] = useState<PanelSize>('compact');
    const expanded = size !== 'compact';

    useEffect(() => OBR.onReady(() => setReady(true)), []);

    function toggleExpand() {
        const next = expanded ? 'compact' : 'expanded';
        setSize(next);
        OBR.action.setWidth(next === 'expanded' ? EXPANDED_WIDTH : COMPACT_WIDTH);
    }

    function maximize() {
        setSize('max');
        OBR.action.setWidth(maxDimension(window.screen.availWidth, EXPANDED_WIDTH));
        OBR.action.setHeight(maxDimension(window.screen.availHeight, EXPANDED_HEIGHT_FLOOR));
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
                    <ExpandButton type="button" onClick={maximize} disabled={!ready}>
                        {t('obr.layout.maximize', '⛶ Max')}
                    </ExpandButton>
                </Actions>
            </Bar>
            <Body>{children}</Body>
        </Container>
    );
}

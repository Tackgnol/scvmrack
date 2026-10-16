import { loginUrl } from '@/auth';
import { PartyCreateForm } from '@/components/organisms/party/PartyCreateForm';
import { Card, CardAction, CardGrid, CardName, Meta } from '@/pages/gmPages.styles';
import { Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { GmLockedOverviewProps } from './GmLockedOverview.models';
import './GmLockedOverview.styles.css';

/** Shows a non-interactive GM dashboard preview with a sign-up route. */
export function GmLockedOverview({ isGuest }: GmLockedOverviewProps) {
  const { t } = useTranslation();

  return (
    <div className="gm-locked-overview">
      <div className="gm-locked-overview__glass">
        <div className="gm-locked-overview__preview" data-testid="gm-locked-preview" aria-hidden="true" inert>
          <PartyCreateForm isAuthLoading isCreating={false} onCreate={async () => false} />
          <CardGrid>
            <Card>
              <div>
                <CardName>{t('gm.previewPartyOne', 'The Grave Wardens')}</CardName>
                <Meta>{t('gm.partyCardMeta', '{{count}}/{{max}} scvms', { count: 3, max: 10 })}</Meta>
              </div>
              <CardAction component="span">{t('gm.manageParty', 'Manage')}</CardAction>
            </Card>
            <Card>
              <div>
                <CardName>{t('gm.previewPartyTwo', 'Galgenbeck Night Watch')}</CardName>
                <Meta>{t('gm.partyCardMeta', '{{count}}/{{max}} scvms', { count: 5, max: 10 })}</Meta>
              </div>
              <CardAction component="span">{t('gm.manageParty', 'Manage')}</CardAction>
            </Card>
          </CardGrid>
        </div>
        <span className="gm-locked-overview__pin gm-locked-overview__pin--one" aria-hidden="true">
          <b>1</b>{t('gm.pinMakeParty', 'Make a party')}
        </span>
        <span className="gm-locked-overview__pin gm-locked-overview__pin--two" aria-hidden="true">
          <b>2</b>{t('gm.pinSendLink', 'Send its link')}
        </span>
        <span className="gm-locked-overview__pin gm-locked-overview__pin--three" aria-hidden="true">
          <b>3</b>{t('gm.pinWatchVitals', 'Watch them bleed')}
        </span>
        <section className="gm-locked-overview__slab" aria-labelledby="gm-overview-heading">
          <h2 id="gm-overview-heading">{t('gm.overviewHeading', 'This is the GM screen. Sign up to run it.')}</h2>
          <p>{t('gm.overviewIntro', 'The GM side of scvmrack is free with an rpgtools.co account.')}</p>
          <ol>
            <li>{t('gm.overviewParty', 'Make a party and hand your table one invite link.')}</li>
            <li>{t('gm.overviewVitals', 'Follow every scvm’s HP, Omens and armour live.')}</li>
            <li>{t('gm.overviewClasses', 'Choose the classes they roll from, or forge your own.')}</li>
          </ol>
          {isGuest && <p className="gm-locked-overview__guest">{t('gm.guestCarriesOver', 'Your guest scvm comes with you when you sign up.')}</p>}
          <div className="gm-locked-overview__actions">
            <Button component="a" href={loginUrl('/gm')} variant="contained">
              {t('gm.signUp', 'Sign up')}
            </Button>
            <a href={loginUrl('/gm')}>{t('gm.logIn', 'Log in')}</a>
          </div>
        </section>
      </div>
      <section className="gm-locked-overview__more" aria-label={t('gm.overviewMore', 'More GM tools')}>
        <div>
          <h3>{t('gm.overviewOwlbearTitle', 'Owlbear Rodeo')}</h3>
          <p>{t('gm.overviewOwlbear', 'The live roster, token binding and an enemy board inside your Owlbear room.')}</p>
        </div>
        <div>
          <h3>{t('gm.overviewCustomClassesTitle', 'Custom Classes')}</h3>
          <p>{t('gm.overviewCustomClasses', 'Forge classes with abilities, Class Items and tables; keep them or publish them.')}</p>
        </div>
      </section>
    </div>
  );
}

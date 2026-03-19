import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { customStyles } from '@/theme/morkBorgTheme';
import {Seo} from '@/seo/Seo';

interface FaqItem {
    question: string;
    answer: string;
}

export function FaqPage() {
    const { t } = useTranslation();

    const faqs: FaqItem[] = [
        {
            question: t('faq.whatIsMorkBorg.q', 'What is MÖRK BORG?'),
            answer: t('faq.whatIsMorkBorg.a', 'MÖRK BORG is a doom metal album of a game. A rules-light, art-heavy tabletop RPG about lost souls seeking redemption in a bleak world. The game is published by Free League Publishing.'),
        },
        {
            question: t('faq.whatIsScvmGrinder.q', 'What is Scvm Rack?'),
            answer: t('faq.whatIsScvmGrinder.a', 'Scvm Rack is a free character sheet and generator for MÖRK BORG. It helps you create characters, track stats, and manage equipment during your games.'),
        },
        {
            question: t('faq.isItFree.q', 'Is this free?'),
            answer: t('faq.isItFree.a', 'Yes! Scvm Rack is completely free to use. You can create and save characters without paying anything.'),
        },
        {
            question: t('faq.guestVsAccount.q', 'Do I need an account?'),
            answer: t('faq.guestVsAccount.a', 'No! You can use Scvm Rack as a guest. Your character will be saved for 7 days. If you create an account, your characters are saved permanently and you can access them from any device.'),
        },
        {
            question: t('faq.howToSave.q', 'How do I save my character?'),
            answer: t('faq.howToSave.a', 'Characters are saved automatically as you make changes. As a guest, your character is stored for 7 days. Sign up for a free account to keep your characters forever.'),
        },
        {
            question: t('faq.multipleCharacters.q', 'Can I have multiple characters?'),
            answer: t('faq.multipleCharacters.a', 'Yes! With an account, you can create and switch between multiple characters. Access your character list from the menu.'),
        },
        {
            question: t('faq.mobileSupport.q', 'Does it work on mobile?'),
            answer: t('faq.mobileSupport.a', 'Yes! Scvm Rack is designed to work on phones, tablets, and desktops. Use it at the table or on the go.'),
        },
        {
            question: t('faq.offlineUse.q', 'Can I use it offline?'),
            answer: t('faq.offlineUse.a', 'Currently, Scvm Rack requires an internet connection. Offline support may be added in the future.'),
        },
        {
            question: t('faq.bugReport.q', 'I found a bug! How do I report it?'),
            answer: t('faq.bugReport.a', 'Please report bugs via GitHub issues or contact us directly. We appreciate your help making Scvm Rack better!'),
        },
    ];

    const faqStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };

    return (
        <>
            <Seo
                title="Mork Borg Character Sheet FAQ"
                description="Answers about Scvm Rack, the free interactive Mork Borg character sheet. Learn how to create, save, and manage Mörk Borg characters online."
                path="/faq"
                keywords={[
                    'Mork Borg FAQ',
                    'Mork Borg character sheet FAQ',
                    'Mork Borg character generator help',
                    'MÖRK BORG',
                    'Scvm Rack',
                ]}
                jsonLd={faqStructuredData}
            />
            <Box sx={customStyles.faqPage.container}>
                {/* Header */}
                <Box sx={customStyles.faqPage.header}>
                    <Typography variant="h4" sx={customStyles.faqPage.title}>
                        {t('faq.title', 'Frequently Asked Questions')}
                    </Typography>
                    <Button
                        component={Link}
                        to="/"
                        variant="outlined"
                        sx={customStyles.faqPage.backButton}
                    >
                        {t('common.back', 'Back')}
                    </Button>
                </Box>

                {/* FAQ Accordions */}
                <Box>
                    {faqs.map((faq, index) => (
                        <Accordion key={index} sx={customStyles.faqPage.accordion}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon sx={customStyles.faqPage.expandIcon} />}
                                sx={customStyles.faqPage.accordionSummary}
                            >
                                <Typography sx={customStyles.faqPage.question}>
                                    {faq.question}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography sx={customStyles.faqPage.answer}>
                                    {faq.answer}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>

                {/* Footer */}
                <Box sx={customStyles.faqPage.footer}>
                    <Typography sx={customStyles.faqPage.footerText}>
                        {t('faq.morkBorgCredit', 'MÖRK BORG is © Free League Publishing. This is an independent fan project.')}
                    </Typography>
                </Box>
            </Box>
        </>
    );
}

import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Hr,
} from '@react-email/components';
import * as React from 'react';

export const PublishedEmail = ({
    docUrl = 'https://superdocs.dev',
}: {
    docUrl?: string;
}) => (
    <Html>
        <Head />
        <Preview>Your documentation is live! 🎉</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Congrats on Publishing!</Heading>
                <Text style={text}>
                    Your new documentation is now live and ready to share with the world.
                </Text>

                <Section style={btnContainer}>
                    <Link style={button} href={docUrl}>
                        View Live Documentation
                    </Link>
                </Section>

                <Text style={text}>
                    Don't forget to share your new docs on Twitter and tag us @SuperDocsDev!
                    <br />
                    - The SuperDocs Team
                </Text>
                <Hr style={hr} />
                <Text style={footer}>
                    SuperDocs.dev
                </Text>
            </Container>
        </Body>
    </Html>
);

const main = {
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
};

const h1 = {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '40px 0',
    color: '#111',
};

const text = {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#333',
};

const btnContainer = {
    textAlign: 'center' as const,
    marginTop: '32px',
    marginBottom: '32px',
};

const button = {
    backgroundColor: '#6366f1',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px 20px',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '20px 0',
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
};

export default PublishedEmail;

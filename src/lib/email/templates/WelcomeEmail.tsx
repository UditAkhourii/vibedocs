import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Hr,
} from '@react-email/components';
import * as React from 'react';

export const WelcomeEmail = ({
    userFirstName = 'there',
}: {
    userFirstName?: string;
}) => (
    <Html>
        <Head />
        <Preview>Welcome to SuperDocs! 🚀</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>Welcome to SuperDocs!</Heading>
                <Text style={text}>
                    Hi {userFirstName},
                </Text>
                <Text style={text}>
                    I'm Udit, the founder of SuperDocs. I'm building this to help developers like you generate beautiful, comprehensive documentation in minutes, not days.
                </Text>
                <Text style={text}>
                    To help you get started, here are a few Loom videos I recorded to show you around:
                </Text>
                <Section style={btnContainer}>
                    <Link style={button} href="https://youtu.be/RoljHC3QTIE?si=7VmtPvQ6en6PHbn_">
                        📺 Watch 3-min Demo
                    </Link>
                </Section>
                <Text style={text}>
                    If you get stuck or have any feedback, just reply to this email. It goes directly to my personal inbox (researchudit@gmail.com).
                </Text>
                <Text style={text}>
                    Happy Documenting!
                    <br />
                    - Udit
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
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
};

const h1 = {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '40px 0',
    padding: '0',
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

export default WelcomeEmail;

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

export const NudgeEmail = ({
    type = 1,
}: {
    type?: number;
}) => {
    let subject = "Quick question...";
    let content = "";

    if (type === 1) {
        subject = "Need any help with SuperDocs?";
        content = "I noticed you signed up but haven't created your first doc yet. Is there anything blocking you? I'd love to help you get unblocked.";
    } else if (type === 2) {
        subject = "SuperDocs Pro Tip 💡";
        content = "Did you know you can import your entire GitHub repo in one click? It's the fastest way to see the magic of AI documentation.";
    } else {
        subject = "One last thing...";
        content = "I don't want to spam you, so this is my last check-in. If you're still interested in generating docs, I'm here to help. If not, no hard feelings!";
    }

    return (
        <Html>
            <Head />
            <Preview>{subject}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>{subject}</Heading>
                    <Text style={text}>
                        {content}
                    </Text>

                    <Section style={btnContainer}>
                        <Link style={button} href="https://superdocs.dev/dashboard">
                            Go to Dashboard
                        </Link>
                    </Section>

                    <Text style={text}>
                        Reply if you have any questions!
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
};

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

export default NudgeEmail;

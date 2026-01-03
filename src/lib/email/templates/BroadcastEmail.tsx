
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Text,
    Hr,
} from '@react-email/components';
import * as React from 'react';

export const BroadcastEmail = ({
    subject,
    content,
}: {
    subject: string;
    content: string;
}) => (
    <Html>
        <Head />
        <Preview>{subject}</Preview>
        <Body style={main}>
            <Container style={container}>
                <Heading style={h1}>{subject}</Heading>
                {content.split('\n').map((line, i) => (
                    <Text key={i} style={text}>
                        {line}
                    </Text>
                ))}
                <Hr style={hr} />
                <Text style={footer}>
                    SuperDocs.dev
                    <br />
                    You are receiving this email as a user of SuperDocs.
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

const hr = {
    borderColor: '#e6ebf1',
    margin: '20px 0',
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
};

export default BroadcastEmail;

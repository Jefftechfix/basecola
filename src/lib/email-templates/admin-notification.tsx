import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
type AdminNotificationProps = {
  subject: string;
  message: string;
  name?: string;
  appUrl?: string;
};

export default function AdminNotificationEmail({ subject, message, name = "there" }: AdminNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={{ backgroundColor: "#f4f5fb", fontFamily: "Arial, sans-serif", margin: 0, padding: "24px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: "12px", margin: "0 auto", maxWidth: "600px", padding: "32px" }}>
          <Heading as="h1" style={{ color: "#1b1240", fontSize: "22px", margin: "0 0 24px" }}>
            {subject}
          </Heading>
          <Text style={{ color: "#1b1240", fontSize: "15px" }}>Hello {name},</Text>
          <Section>
            {message.split(/\r?\n/).map((line, index) => (
              <Text key={index} style={{ color: "#343044", fontSize: "15px", lineHeight: "1.6", margin: "0 0 12px" }}>
                {line || "\u00a0"}
              </Text>
            ))}
          </Section>
          <Text style={{ color: "#777386", fontSize: "12px", marginTop: "28px" }}>
            This operational notice was sent by Basecola. Replies to this email may not be monitored.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

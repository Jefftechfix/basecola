import React from 'react'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  decision?: 'approved' | 'rejected'
  note?: string | null
  appUrl: string
}

const BLUE = '#1f5cff'

const Email = ({ name, decision = 'approved', note, appUrl }: Props) => {
  const ok = decision === 'approved'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{ok ? 'Your Basecola account is verified' : 'Update on your Basecola verification'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}><Text style={logo}>Basecola</Text></Section>
          <Section style={card}>
            <Text style={{ ...badge, backgroundColor: ok ? '#e7f8ef' : '#fdecec', color: ok ? '#0f8a4b' : '#c62828' }}>
              {ok ? 'Verification approved' : 'Verification not approved'}
            </Text>
            <Heading style={h1}>{ok ? 'You’re verified!' : 'We couldn’t verify your account'}</Heading>
            <Text style={text}>Hi {name || 'there'},</Text>
            <Text style={text}>
              {ok
                ? 'Great news — our team has reviewed your identity verification and your Basecola account is now fully verified. You can now buy, sell, send and receive crypto without limits.'
                : 'Our team reviewed your identity verification request, but we were not able to approve it this time.'}
            </Text>
            {note ? <Section style={noteBox}><Text style={noteLabel}>{ok ? 'Note from our team' : 'Reason'}</Text><Text style={noteText}>{note}</Text></Section> : null}
            {!ok && <Text style={text}>You can correct the details and submit a new request from Profile → Verify Account.</Text>}
            <Button href={ok ? `${appUrl}/dashboard` : `${appUrl}/profile`} style={button}>{ok ? 'Go to dashboard' : 'Submit again'}</Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>Basecola · Secure crypto, made simple. If you didn’t request verification, please contact support.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => d.decision === 'rejected' ? 'Your Basecola verification needs attention' : 'Your Basecola account is verified',
  displayName: 'Verification decision',
  previewData: { name: 'Mustapha', decision: 'rejected', note: 'The ID photo was blurry. Please upload a clearer copy.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"Plus Jakarta Sans", Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px 16px' }
const header = { backgroundColor: BLUE, borderRadius: '20px 20px 0 0', padding: '20px 24px' }
const logo = { color: '#ffffff', fontSize: '24px', fontWeight: 800, margin: 0 }
const card = { border: '1px solid #e6e9f5', borderTop: 'none', borderRadius: '0 0 20px 20px', padding: '28px 24px' }
const badge = { display: 'inline-block', borderRadius: '999px', padding: '4px 12px', fontSize: '12px', fontWeight: 700, margin: '0 0 12px' }
const h1 = { fontSize: '24px', fontWeight: 800, color: '#0b1736', margin: '0 0 16px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#3d4766', margin: '0 0 14px' }
const noteBox = { backgroundColor: '#f3f6ff', borderRadius: '14px', padding: '12px 16px', margin: '0 0 16px' }
const noteLabel = { fontSize: '12px', fontWeight: 700, color: BLUE, margin: '0 0 4px' }
const noteText = { fontSize: '14px', color: '#0b1736', margin: 0 }
const button = { backgroundColor: BLUE, color: '#ffffff', borderRadius: '14px', padding: '14px 24px', fontWeight: 700, fontSize: '15px', textDecoration: 'none', display: 'inline-block', marginTop: '8px' }
const hr = { borderColor: '#e6e9f5', margin: '24px 0 12px' }
const footer = { fontSize: '12px', color: '#8a93ad', textAlign: 'center' as const }

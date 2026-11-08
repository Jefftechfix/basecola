import React from 'react'
import { Body, Button, Column, Container, Head, Heading, Hr, Html, Preview, Row, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

const PURPLE = '#6d4dff'

interface Props {
  name?: string
  title?: string
  headline?: string
  status?: string
  rows?: { label: string; value: string }[]
  appUrl: string
}

const Email = ({ name, title = 'Transaction receipt', headline = '', status = 'Completed', rows = [], appUrl }: Props) => {
  const ok = /complete|paid|success|confirmed|broadcast/i.test(status)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${title}: ${headline}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}><Text style={logo}>Basecola</Text><Text style={tagline}>CRYPTO, MADE SIMPLE</Text></Section>
          <Section style={card}>
            <Text style={{ ...badge, backgroundColor: ok ? '#e7f8ef' : '#fff6e0', color: ok ? '#0f8a4b' : '#a86a00' }}>{status}</Text>
            <Heading style={h1}>{title}</Heading>
            <Text style={text}>Hi {name || 'there'}, here is your receipt.</Text>
            <Section style={amountBox}><Text style={amountText}>{headline}</Text></Section>
            {rows.map(r => (
              <Row key={r.label} style={row}>
                <Column style={labelCol}>{r.label}</Column>
                <Column style={valueCol}>{r.value}</Column>
              </Row>
            ))}
            <Button href={`${appUrl}/transactions`} style={button}>View transactions</Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>Basecola · Secure crypto, made simple. If you didn’t make this transaction, change your password and contact support right away.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, unknown>) => `Basecola receipt: ${String(d.title ?? 'Transaction')}`,
  displayName: 'Transaction receipt',
  previewData: { name: 'Jane', title: 'Crypto purchase', headline: '0.00146 BTC', status: 'Completed', rows: [{ label: 'Amount', value: '$100.00' }, { label: 'Fee', value: '$1.50' }, { label: 'Reference', value: 'BUY-1A2B3C4D5E' }] },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '"Plus Jakarta Sans", Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '24px 16px' }
const header = { backgroundColor: PURPLE, borderRadius: '20px 20px 0 0', padding: '20px 24px' }
const logo = { color: '#ffffff', fontSize: '24px', fontWeight: 800, margin: 0 }
const tagline = { color: '#e8e2ff', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', margin: '5px 0 0' }
const card = { border: '1px solid #e6e9f5', borderTop: 'none', borderRadius: '0 0 20px 20px', padding: '28px 24px' }
const badge = { display: 'inline-block', borderRadius: '999px', padding: '4px 12px', fontSize: '12px', fontWeight: 700, margin: '0 0 12px' }
const h1 = { fontSize: '24px', fontWeight: 800, color: '#0b1736', margin: '0 0 12px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#3d4766', margin: '0 0 14px' }
const amountBox = { backgroundColor: '#f3f6ff', borderRadius: '14px', padding: '16px', margin: '0 0 16px', textAlign: 'center' as const }
const amountText = { fontSize: '26px', fontWeight: 800, color: PURPLE, margin: 0 }
const row = { borderBottom: '1px solid #eef1f8' }
const labelCol = { fontSize: '14px', color: '#6b7593', padding: '10px 0' }
const valueCol = { fontSize: '14px', color: '#0b1736', fontWeight: 700, padding: '10px 0', textAlign: 'right' as const, wordBreak: 'break-all' as const }
const button = { backgroundColor: PURPLE, color: '#ffffff', borderRadius: '14px', padding: '14px 24px', fontWeight: 700, fontSize: '15px', textDecoration: 'none', display: 'inline-block', marginTop: '20px' }
const hr = { borderColor: '#e6e9f5', margin: '24px 0 12px' }
const footer = { fontSize: '12px', color: '#8a93ad', lineHeight: '18px' }

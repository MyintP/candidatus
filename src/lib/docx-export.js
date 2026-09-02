// Client-side DOCX rendering for generated resume/cover-letter content, using
// the `docx` npm package. Not a pixel-match to the SEEK-template pipeline in
// resume-automation/ - this is a plain, clean layout good enough to send.

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

function heading(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { after: 120 } })
}

function body(text, opts = {}) {
  return new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 160 } })
}

function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 60 } })
}

export async function resumeToDocxBlob(contact, tailored, tierData) {
  const children = [
    new Paragraph({
      children: [new TextRun({ text: contact.name, bold: true, size: 32 })],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: tailored.headline || tierData.headline, size: 24 })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `${contact.email}  |  ${contact.phone}  |  ${contact.linkedin}  |  ${contact.location}`,
        size: 18, color: '555555',
      })],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: contact.rights, size: 18, color: '555555' })],
      spacing: { after: 240 },
    }),

    heading('Summary'),
    body(tailored.summary || tierData.summary),

    heading('Key skills'),
    body(tailored.keySkillsOrdered || tierData.key_skills),

    heading('Certifications'),
    body(tierData.certifications.join('  |  ')),

    heading('Career history'),
  ]

  for (const role of tierData.roles) {
    const roleTitle = role.org ? `${role.title} — ${role.org}` : role.title
    children.push(new Paragraph({
      children: [new TextRun({ text: roleTitle, bold: true, size: 22 })],
      spacing: { before: 160, after: 20 },
    }))
    const loc = role.location ? `  |  ${role.location}` : ''
    children.push(new Paragraph({
      children: [new TextRun({ text: `${role.dates}${loc}`, italics: true, size: 18, color: '555555' })],
      spacing: { after: 60 },
    }))
    if (role.overview) children.push(body(role.overview))
    for (const b of role.achievements || []) children.push(bullet(b))
    for (const b of role.responsibilities || []) children.push(bullet(b))
  }

  if (tierData.earlier_career?.length) {
    children.push(heading('Earlier career'))
    for (const line of tierData.earlier_career) children.push(body(line, { size: 20 }))
  }

  const doc = new Document({ sections: [{ children }] })
  return Packer.toBlob(doc)
}

export async function coverLetterToDocxBlob(contact, letter, companyName) {
  const children = [
    new Paragraph({ children: [new TextRun({ text: contact.name, bold: true, size: 28 })], spacing: { after: 40 } }),
    new Paragraph({
      children: [new TextRun({
        text: `${contact.email}  |  ${contact.phone}  |  ${contact.location}`, size: 18, color: '555555',
      })],
      spacing: { after: 300 },
    }),
    new Paragraph({ text: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }), spacing: { after: 200 } }),
  ]

  if (companyName) {
    children.push(new Paragraph({ text: companyName, spacing: { after: 300 } }))
  }

  children.push(new Paragraph({ text: letter.greeting || 'Dear Hiring Manager,', spacing: { after: 200 } }))
  for (const p of letter.paragraphs || []) {
    children.push(new Paragraph({ children: [new TextRun({ text: p })], spacing: { after: 200 }, alignment: AlignmentType.LEFT }))
  }
  children.push(new Paragraph({ text: letter.signOff || 'Kind regards,', spacing: { before: 200, after: 40 } }))
  children.push(new Paragraph({ text: contact.name }))

  const doc = new Document({ sections: [{ children }] })
  return Packer.toBlob(doc)
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

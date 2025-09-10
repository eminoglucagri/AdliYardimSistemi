import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

export async function generateWordDocument(content: string, title: string): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "HİZMETE ÖZEL",
            heading: HeadingLevel.TITLE,
            alignment: "center",
          }),
          new Paragraph({
            text: new Date().toLocaleDateString("tr-TR"),
            alignment: "center",
          }),
          new Paragraph({
            text: "ANKARA CUMHURİYET BAŞSAVCILIĞI",
            alignment: "center",
          }),
          new Paragraph({ text: "" }), // Empty line
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
              }),
            ],
          }),
          new Paragraph({ text: "" }), // Empty line
          ...content.split('\n').map(line => 
            new Paragraph({
              text: line,
            })
          ),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

export function generatePDFFromHTML(html: string): string {
  // For now, return HTML that can be converted to PDF on the client side
  // In a production environment, you might use puppeteer or similar
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Adli Bilgi Notu</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .content { line-height: 1.6; }
            .field { margin-bottom: 15px; }
            .field strong { display: inline-block; width: 200px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h3>HİZMETE ÖZEL</h3>
            <p>${new Date().toLocaleDateString("tr-TR")}</p>
            <p>ANKARA CUMHURİYET BAŞSAVCILIĞI</p>
        </div>
        <div class="content">
            ${html}
        </div>
    </body>
    </html>
  `;
}

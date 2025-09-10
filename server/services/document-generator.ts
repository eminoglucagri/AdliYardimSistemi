import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from "docx";

export async function generateWordDocument(content: string, title: string): Promise<Buffer> {
  // İçeriği parse et
  const lines = content.split('\n').filter(line => line.trim());
  
  // İçerik bölümlerini organize et
  let konu = "";
  let basinDurumu = "";
  const sections: { title: string, content: string }[] = [];
  let currentSection = "";
  let currentContent = "";
  
  lines.forEach(line => {
    if (line.startsWith("KONU:")) {
      konu = line.replace("KONU:", "").trim();
    } else if (line.includes("BASINA DÜŞME DURUMU:")) {
      basinDurumu = line.replace("BASINA DÜŞME DURUMU:", "").trim();
    } else if (line.includes("MAĞDUR BİLGİLERİ:") || 
               line.includes("ŞÜPHELİ BİLGİLERİ:") ||
               line.includes("SUÇ BİLGİLERİ:") ||
               line.includes("TEDBİRLER:") ||
               line.includes("OLAYIN ÖZETİ:")) {
      
      if (currentSection && currentContent) {
        sections.push({ title: currentSection, content: currentContent.trim() });
      }
      
      currentSection = line.replace(":", "").trim();
      currentContent = "";
    } else if (currentSection && line.trim() && 
               !line.startsWith("T.C.") &&
               !line.startsWith("ANKARA") &&
               !line.startsWith("BİLGİ NOTU")) {
      currentContent += line + "\n";
    }
  });
  
  if (currentSection && currentContent) {
    sections.push({ title: currentSection, content: currentContent.trim() });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Başlık bölümü
          new Paragraph({
            text: "HİZMETE ÖZEL",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: new Date().toLocaleDateString("tr-TR"),
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: "BAŞSAVCILIĞI",
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          
          // Konu ve Basın Durumu tablosu
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: "KONU:", bold: true })]
                    })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: "BASIN DESTEK DURUMU", bold: true })]
                    })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: konu })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: basinDurumu })],
                  }),
                ],
              }),
            ],
          }),
          
          new Paragraph({ text: "" }), // Boşluk
          
          // BİLGİ NOTU başlığı
          new Paragraph({
            children: [new TextRun({ text: "BİLGİ NOTU", bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          }),
          
          // İçerik tablosu
          new Table({
            rows: sections.map(section => 
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ 
                      children: [new TextRun({ text: section.title, bold: true })]
                    })],
                  }),
                  new TableCell({
                    children: section.content.split('\n').filter(line => line.trim()).map(line => 
                      new Paragraph({ text: line.trim() })
                    ),
                  }),
                ],
              })
            ),
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

export function generatePDFFromHTML(content: string): string {
  const lines = content.split('\n').filter(line => line.trim());
  
  // İçeriği parse et
  let konu = "";
  let basinDurumu = "";
  const sections: { title: string, content: string }[] = [];
  let currentSection = "";
  let currentContent = "";
  
  lines.forEach(line => {
    if (line.startsWith("KONU:")) {
      konu = line.replace("KONU:", "").trim();
    } else if (line.includes("BASINA DÜŞME DURUMU:")) {
      basinDurumu = line.replace("BASINA DÜŞME DURUMU:", "").trim();
    } else if (line.includes("MAĞDUR BİLGİLERİ:") || 
               line.includes("ŞÜPHELİ BİLGİLERİ:") ||
               line.includes("SUÇ BİLGİLERİ:") ||
               line.includes("TEDBİRLER:") ||
               line.includes("OLAYIN ÖZETİ:")) {
      
      if (currentSection && currentContent) {
        sections.push({ title: currentSection, content: currentContent.trim() });
      }
      
      currentSection = line.replace(":", "").trim();
      currentContent = "";
    } else if (currentSection && line.trim() && 
               !line.startsWith("T.C.") &&
               !line.startsWith("ANKARA")) {
      currentContent += line + "\n";
    }
  });
  
  if (currentSection && currentContent) {
    sections.push({ title: currentSection, content: currentContent.trim() });
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Adli Bilgi Notu</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 40px; 
                line-height: 1.4;
            }
            .header { 
                text-align: center; 
                margin-bottom: 30px; 
            }
            .header h2 {
                margin: 5px 0;
                font-size: 16px;
            }
            .main-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            .main-table td, .main-table th {
                border: 1px solid #000;
                padding: 8px;
                vertical-align: top;
            }
            .header-row {
                background-color: #f5f5f5;
                text-align: center;
                font-weight: bold;
            }
            .section-title {
                font-weight: bold;
                background-color: #f9f9f9;
                width: 30%;
            }
            .section-content {
                width: 70%;
                white-space: pre-line;
            }
            .info-note-header {
                text-align: center;
                font-weight: bold;
                background-color: #e9e9e9;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>HİZMETE ÖZEL</h2>
            <p>${new Date().toLocaleDateString("tr-TR")}</p>
            <h2>BAŞSAVCILIĞI</h2>
        </div>
        
        <table class="main-table">
            <tr class="header-row">
                <td>KONU:</td>
                <td>BASIN DESTEK DURUMU</td>
                <td>${konu}</td>
                <td>${basinDurumu}</td>
            </tr>
            <tr>
                <td colspan="4" class="info-note-header">BİLGİ NOTU</td>
            </tr>
            ${sections.map(section => `
                <tr>
                    <td class="section-title">${section.title}</td>
                    <td colspan="3" class="section-content">${section.content}</td>
                </tr>
            `).join('')}
        </table>
    </body>
    </html>
  `;
}

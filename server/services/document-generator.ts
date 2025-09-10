import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from "docx";

export async function generateWordDocument(content: string, title: string): Promise<Buffer> {
  // İçeriği parse et
  const lines = content.split('\n').filter(line => line.trim());
  
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
          
          // Ana tablo
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
            rows: createTableRowsFromContent(lines),
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

function createTableRowsFromContent(lines: string[]): TableRow[] {
  const rows: TableRow[] = [];
  
  // İlk satır - KONU ve BASIN DESTEK DURUMU
  let konu = "";
  let basinDurumu = "";
  
  lines.forEach(line => {
    if (line.startsWith("KONU:")) {
      konu = line.replace("KONU:", "").trim();
    }
    if (line.includes("BASINA DÜŞME DURUMU:")) {
      basinDurumu = line.replace("BASINA DÜŞME DURUMU:", "").trim();
    }
  });
  
  rows.push(new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ text: "KONU:", alignment: AlignmentType.CENTER })],
        width: { size: 25, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ text: "BASIN DESTEK DURUMU", alignment: AlignmentType.CENTER })],
        width: { size: 25, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ text: konu })],
        width: { size: 25, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ text: basinDurumu })],
        width: { size: 25, type: WidthType.PERCENTAGE },
      }),
    ],
  }));
  
  // BİLGİ NOTU başlığı
  rows.push(new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ 
          text: "BİLGİ NOTU", 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "BİLGİ NOTU", bold: true })]
        })],
        columnSpan: 4,
      }),
    ],
  }));
  
  // Ana içerik bölümü
  let currentSection = "";
  let currentContent = "";
  
  lines.forEach(line => {
    if (line.includes("MAĞDUR BİLGİLERİ:") || 
        line.includes("ŞÜPHELİ BİLGİLERİ:") ||
        line.includes("SUÇ BİLGİLERİ:") ||
        line.includes("TEDBİRLER:") ||
        line.includes("OLAYIN ÖZETİ:")) {
      
      // Önceki bölümü ekle
      if (currentSection && currentContent) {
        rows.push(createContentRow(currentSection, currentContent));
      }
      
      currentSection = line.replace(":", "").trim();
      currentContent = "";
    } else if (currentSection && line.trim() && 
               !line.startsWith("KONU:") && 
               !line.includes("BASINA DÜŞME DURUMU:") &&
               !line.startsWith("T.C.") &&
               !line.startsWith("ANKARA")) {
      currentContent += line + "\n";
    }
  });
  
  // Son bölümü ekle
  if (currentSection && currentContent) {
    rows.push(createContentRow(currentSection, currentContent));
  }
  
  return rows;
}

function createContentRow(section: string, content: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ 
          text: section,
          children: [new TextRun({ text: section, bold: true })]
        })],
        width: { size: 30, type: WidthType.PERCENTAGE },
        verticalAlign: "top",
      }),
      new TableCell({
        children: content.split('\n').filter(line => line.trim()).map(line => 
          new Paragraph({ text: line.trim() })
        ),
        width: { size: 70, type: WidthType.PERCENTAGE },
        columnSpan: 3,
      }),
    ],
  });
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

import PDFDocument from 'pdfkit';

export const generateBasePDF = async (title, textContent, imageUrl = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));

      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text(title, { align: 'center' });

      doc.moveDown(2);

      doc.fontSize(12)
         .font('Helvetica')
         .text(textContent, {
           align: 'justify',
           lineGap: 5
         });

      if (imageUrl) {
        try {
          const response = await fetch(imageUrl);
          const arrayBuffer = await response.arrayBuffer();
          const imageBuffer = Buffer.from(arrayBuffer);

          doc.moveDown(2);
          doc.text('Firmado:');
          doc.moveDown(1);
          doc.image(imageBuffer, { width: 200 });
        } catch (imgError) {
          console.error('Error al incrustar la imagen en el PDF:', imgError);
          doc.text('(Error al cargar la imagen de la firma)');
        }
      }

      doc.moveDown(4);
      doc.fontSize(10)
         .fillColor('gray')
         .text('Generado automáticamente por BildyApp', { align: 'center' });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

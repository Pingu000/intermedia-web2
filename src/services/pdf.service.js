import PDFDocument from 'pdfkit';

/**
 * Servicio base para la generación de PDFs
 * Devuelve una Promesa que resuelve en un Buffer con el contenido del PDF.
 * Este buffer se puede enviar directamente como respuesta HTTP.
 */
export const generateBasePDF = async (title, textContent, imageUrl = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Configuramos el documento PDF
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      // Cada vez que pdfkit genera un trozo del PDF, lo guardamos en nuestro array de buffers
      doc.on('data', buffers.push.bind(buffers));

      // Cuando termina el documento, unimos todos los trozos y resolvemos la promesa
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // ---- CONSTRUCCIÓN DEL DOCUMENTO ----

      // Título principal
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text(title, { align: 'center' });
         
      doc.moveDown(2); // Salto de línea

      // Cuerpo del texto
      doc.fontSize(12)
         .font('Helvetica')
         .text(textContent, { 
           align: 'justify',
           lineGap: 5 // Espacio entre líneas
         });

      // Si hay una imagen de firma, la descargamos y la incrustamos
      if (imageUrl) {
        try {
          const response = await fetch(imageUrl);
          const arrayBuffer = await response.arrayBuffer();
          const imageBuffer = Buffer.from(arrayBuffer);
          
          doc.moveDown(2);
          doc.text('Firmado:');
          doc.moveDown(1);
          // Insertamos la imagen (máximo 200px de ancho)
          doc.image(imageBuffer, { width: 200 });
        } catch (imgError) {
          console.error('Error al incrustar la imagen en el PDF:', imgError);
          doc.text('(Error al cargar la imagen de la firma)');
        }
      }

      // Pie de página genérico
      doc.moveDown(4);
      doc.fontSize(10)
         .fillColor('gray')
         .text('Generado automáticamente por BildyApp', { align: 'center' });

      // Finalizamos el documento (dispara el evento 'end')
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

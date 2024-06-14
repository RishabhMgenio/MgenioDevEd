import { LightningElement, api, wire } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import pdfjs from '@salesforce/resourceUrl/pdfjs';
import pdfjsworker from '@salesforce/resourceUrl/pdfjsworker';
import getObjectFields from '@salesforce/apex/PdfToTextForRecordPageController.getObjectFields';
import savePDFContent from '@salesforce/apex/PdfToTextForRecordPageController.savePDFContent';
import PNPLogo from '@salesforce/resourceUrl/PNPLogo';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

/**
 * Component to upload and extract text from PDF files.
 */
export default class PdfUploader extends LightningElement {
    pdfjsLib;
    pdfDataOne;
    isScriptLoaded = false;
    @api recordId;
    selectedField;
    fieldOptions = [];
    @api objectApiName;
    finalString;
    binaryData;
    pagesTextArray;
    logoUrl = PNPLogo;

    handleonUpload(event) {
        const fileInput = event.target;

        // console.log('handleonUploadeventCalled======');
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onloadend = () => {
                const BinaryData = reader.result;
                this.binaryData = BinaryData;
                // console.log("Base64 encoded PDF data:", this.binaryData);

                this.loadPdfjsLibraries();
                this.getObjectFields();
            };

            reader.readAsBinaryString(file);
        }
    }

    loadPdfjsLibraries() {
        try {
            Promise.all([loadScript(this, pdfjs + '/pdf.min.js'), loadScript(this, pdfjsworker + '/pdf.worker.min.js')])
                .then(() => {
                    // console.log('pdfjs and pdfjsworker loaded');
                    this.initializePdfjsLib();
                })
                .catch((error) => {
                    // console.error('Error loading pdfjs libraries:', error);
                    // alert('Error loading PDF libraries. Please try again.');
                });
        } catch (error) {
            // console.error('Error loading PDF libraries:', error);
            // alert('Error loading PDF libraries. Please try again.');
        }
    }

    initializePdfjsLib() {
        // console.log('insideinitializePdfjsLib');
        try {
            if (typeof globalThis === 'undefined') {
                if (typeof window !== 'undefined') {
                    window.globalThis = window;
                } else if (typeof global !== 'undefined') {
                    global.globalThis = global;
                } else if (typeof self !== 'undefined') {
                    self.globalThis = self;
                }
            }

            this.pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = this.pdfjsworker + '/pdf.worker.min.js';
            this.isScriptLoaded = true;
            // console.log('endofinitializePdfjsLib');
            this.convertBinaryToText();
        } catch (error) {
            // console.error('Error initializing PDF libraries:', error);
            // alert('Error initializing PDF libraries. Please try again.');
        }
    }

    convertBinaryToText() {
        try {
            var loadingTask = pdfjsLib.getDocument({ data: this.binaryData });
            loadingTask.promise
                .then(pdf => {
                    var pdfDocument = pdf;
                    var pagesPromises = [];
                    for (let i = 0; i < pdf.numPages; i++) {
                        pagesPromises.push(this.getPageText(i + 1, pdfDocument));
                    }
                    return Promise.all(pagesPromises);
                })
                .then(pagesTextArray => {
                    this.finalString = pagesTextArray.map(pageText => pageText).join();
                    for (var i = 0; i < pagesTextArray.length; i++) {
                        // console.log("Page " + (i + 1) + ": " + pagesTextArray[i]);
                    }
                })
                .catch(error => {
                    // window.alert('Error converting PDF to text: ' + error.message);
                });
        } catch(error) {
            // window.alert('Error converting PDF to text: ' + error.message);
        }
    }

    /**
     * Retrieves text content of a page in the PDF.
     * @param {number} pageNum - The page number.
     * @param {Object} PDFDocumentInstance - The PDF document instance.
     * @returns {Promise} A promise that resolves with the page text.
     */
    getPageText(pageNum, PDFDocumentInstance) {
        return new Promise((resolve, reject) => {
            PDFDocumentInstance.getPage(pageNum).then(pdfPage => {
                pdfPage.getTextContent().then(textContent => {
                    const textItems = textContent.items;
                    let lines = [];
                    let inParagraph = false;
                    lines.push('\n');
                    for (let i = 0; i < textItems.length; i++) {
                        const item = textItems[i];
                        const fontSize = item.fontHeight;
                        const isHeading = fontSize > 12;
                        if (isHeading) {
                            if (inParagraph) {
                                lines.push('\n\n');
                            }
                            inParagraph = true;
                        } else {
                            inParagraph = false;
                        }
                        const trimmedText = item.str.trim();
                        if (trimmedText !== '') {
                            lines.push(inParagraph ? ' ' + trimmedText : trimmedText);
                        }
                    }
                    resolve(lines.join('\n'));
                });
            });
        });
    }
    getObjectFields() {
        // console.log('getObjectFieldsCalled', getObjectFields);
        getObjectFields({ objectApiName: this.objectApiName })
            .then(result => {
                if (result.length === 0) {
                    this.showToast('Warning', 'No fields available for this object', 'warning');
                    return;
                }
                
                this.fieldOptions = result.map(field => ({ label: field, value: field }));
                // console.log('fieldOptions=====', this.fieldOptions);
            })
            .catch(error => {
                // console.error(error);
                alert('Error fetching object fields. Please try again.');
            });
    }

    handleFieldChange(event) {
        const selectedField = event.detail.value;
        // console.log('selectedField========', selectedField);
        this.selectedField = selectedField;

    }



    handleButtonClick() {

        if (!this.selectedField) {
            this.showToast('Error', 'Please select a field before generating PDF.', 'error');
            return;
        }
        // console.log('finalString====', this.finalString);
        // console.log('objectApiName====', this.objectApiName);
        // console.log('recordId====', this.recordId);
        // console.log('selectedField====', this.selectedField);

        savePDFContent({ recordId: this.recordId, objectApiName: this.objectApiName, selectedField: this.selectedField, finalString: this.finalString })
        .then(() => {
            // Show success toast message
            this.showToast('Success', 'PDF content saved successfully', 'success');
            // console.log('ApexCalled');
        })
        .catch(error => {
            // Show error toast message
            // console.error(error);
            this.showToast('Error', 'Error saving PDF content. Please try again.', 'error');
        });
    }
    /**
     * Helper method to show toast message.
     * @param {String} title - The title of the toast message.
     * @param {String} message - The message to be displayed in the toast.
     * @param {String} variant - The variant of the toast (e.g., success, error).
     */
    showToast(title, message, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(evt);
    }
}
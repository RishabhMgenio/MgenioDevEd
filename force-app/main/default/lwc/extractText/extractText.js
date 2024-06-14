import { LightningElement, wire, track, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import pdfjs from '@salesforce/resourceUrl/pdfjs';
import pdfjsworker from '@salesforce/resourceUrl/pdfjsworker';
import fetchAllObjectList from '@salesforce/apex/GetObject.fetchAllObjectList';
import fetchAllFieldList from '@salesforce/apex/GetObject.fetchAllFieldList';
import updateField from '@salesforce/apex/GetObject.updateField';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

/**
 * Component to extract text from PDF and update a field in Salesforce with the extracted text.
 */
export default class Pdftotext extends LightningElement {
    pdfjsLib;
    pdfContent;
    pdfDataOne;
    isScriptLoaded = false;
    @track allObjectList = [];
    @track objectList = [];
    @track customObjectList = [];
    @track standardObjectList = [];
    @track fieldList = [];
    objectName = '';
    @track recordId = '';
    @api objectApiName;
    arrayValue;
    finalString;
    binaryData;

    @track objectTypeList =  [
        { label: "All", value: 'All' },
        { label: "Custom", value: 'Custom' },
        { label: "Standard", value: 'Standard' }
    ];

    /**
     * Fetches all Salesforce objects and initializes the component.
     */
    async connectedCallback(){
        try {
            const result = await fetchAllObjectList();
            if(result){
                for(let key in result){
                    if(key.endsWith('__c')){
                        this.customObjectList.push({ label: key, value:key });
                    } else if(!key.endsWith('__c')){
                        this.standardObjectList.push({ label: key, value:key });
                    }
                    this.allObjectList.push({ label: key, value:key }); 
                }
            } else {
                // window.alert('Objects not found');
            }
        } catch(error) {
            // window.alert('Error fetching objects: ' + error.message);
        }
    }

    /**
     * Handles the change event when selecting object types.
     * @param {Event} event - The event containing the selected value.
     */
    onObjectTypeChange(event){
        this.objectList = []; // Clear the list
        this.fieldList = [];
        const value = event.detail.value;
        if(value === 'All'){
            this.objectList = this.allObjectList;
        }else if(event.detail.value == 'Custom'){
            if (this.customObjectList.length === 0) {
                this.showToast('Error', 'No custom objects available', 'error');
                return;
            }
            this.objectList = this.customObjectList;
        } else if(value === 'Standard'){
            this.objectList = this.standardObjectList;
        }
    }

    /**
     * Handles the change event when selecting an object.
     * @param {Event} event - The event containing the selected value.
     */
    async onObjectChange(event){
        this.objectName = event.detail.value;
        this.fieldList = [];
        this.objectApiName = event.target.value;
        try {
            const result = await fetchAllFieldList({ strObjectName : this.objectName});
            // Check if fields are empty
            if (Object.keys(result).length === 0) {
                this.showToast('Warning', 'No fields available for this object', 'warning');
                return;
            }
            for(let key in result){
                this.fieldList.push({label: key, value: key});
            }
        } catch(error) {
            // window.alert('Error fetching fields: ' + error.message);
        }
    }

    /**
     * Handles the change event when selecting a checkbox.
     * @param {Event} event - The event containing the selected value.
     */
    handleCheckboxChange(event) {
        const selectedValue = event.target.value;
        this.arrayValue = selectedValue[0];
    }

    /**
     * Handles the change event when uploading a file.
     * @param {Event} event - The event containing the uploaded file.
     */
    onFileChange(event) {
        const fileInput = event.target;
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const BinaryData = reader.result;
                this.binaryData = BinaryData;
                this.loadPdfjsLibraries();
            };
            reader.readAsBinaryString(file);
        }
    }

    /**
     * Loads PDF.js libraries and initializes them.
     */
    async loadPdfjsLibraries() {
        try {
            await Promise.all([loadScript(this, pdfjs + '/pdf.min.js'), loadScript(this, pdfjsworker + '/pdf.worker.min.js')]);
            this.initializePdfjsLib();
        } catch(error) {
            // window.alert('Error loading PDF.js libraries: ' + error.message);
        }
    }

    /**
     * Initializes PDF.js libraries.
     */
    initializePdfjsLib() {
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
            this.convertBinaryToText();
        } catch(error) {
            // window.alert('Error initializing PDF.js libraries: ' + error.message);
        }
    }

    /**
     * Converts binary data of the PDF to text.
     */
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
                    this.showToast('Error', 'Error extracting text: ' + error.message, 'error');
                    
                });
        } catch(error) {
            this.showToast('Error', 'Error calling Apex method: ' + error.message, 'error');
            
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

    /**
     * Handles the change event when entering a record ID.
     * @param {Event} event - The event containing the entered value.
     */
    handleRecordIdChange(event) {
        this.recordId = event.target.value;
    }
     

    /**
     * Handles the button click event to update the field in Salesforce.
     */
    handleButtonClick() {
        try {
            updateField({ objectApiName: this.objectApiName, recordId: this.recordId, arrayValue: this.arrayValue, finalString: this.finalString })
                .then(result => {
                    // Check if the update was successful
                    if (result === 'Fields updated successfully') {
                        // Show success toast message
                        this.showToast('Success', 'Fields updated successfully', 'success');
                    } else {
                        // Show error toast message
                        this.showToast('Error', result, 'error');
                    }
                    
                })
                .catch(error => {
                    // Show error toast message
                    this.showToast('Error', 'Error calling Apex method: ' + error.message, 'error');
                });
        } catch(error) {
            // Show error toast message
            this.showToast('Error', 'Error calling Apex method: ' + error.message, 'error');
        }
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